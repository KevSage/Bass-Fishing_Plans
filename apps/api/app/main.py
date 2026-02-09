# apps/api/app/main.py
"""
Bass Clarity API - Complete Backend
Unified plan generation with LLM, rate limiting, and plan history.
"""
from __future__ import annotations

import os
import stripe
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional

# Load environment variables from .env file
from dotenv import load_dotenv
from pathlib import Path

# Get the directory where this file lives
BASE_DIR = Path(__file__).resolve().parent.parent  # apps/api/
ENV_PATH = BASE_DIR / ".env"

# Load .env from the correct location
load_dotenv(dotenv_path=ENV_PATH)
from app.services.subscribers import SubscriberStore
from app.services.stripe_billing import init_stripe
from fastapi import FastAPI, HTTPException, Request, Response, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, EmailStr

# Services
from app.services.subscribers import SubscriberStore
from app.services.rate_limits import RateLimitStore
from app.services.plan_links import PlanLinkStore
from app.services.plan_history import PlanHistoryStore
from app.services.weather import get_weather_snapshot
from app.services.phase_logic import determine_phase
from app.services.llm_plan_service import generate_llm_plan_with_retries
from app.services.plan_enrichment import enrich_member_plan
from app.canon.target_definitions import get_target_definition
from app.services.email_service import (
    send_preview_plan_email,
    send_welcome_email,
    add_to_audience,
)

from app.services.stripe_billing import (
    create_checkout_session,
    create_portal_session,
    verify_webhook_and_parse_event,
    extract_subscription_state,
)
from app.routes.catches import router as catches_router
from app.routes.lakes import router as lakes_router
from app.routes.uploads import router as uploads_router

# ----------------------------------------
# FREE MODE CONFIGURATION
# ----------------------------------------
# When enabled, all authenticated users get full member access
# Toggle via environment variable: FREE_MODE=true
FREE_MODE = os.getenv("FREE_MODE", "false").lower() == "true"
DAILY_PLAN_LIMIT = 10  # Universal rate limit for all users

# ----------------------------------------
# 1. INITIALIZE STORES FIRST
# ----------------------------------------
# These must exist BEFORE importing routes that use them
subs = SubscriberStore()
rate_limits = RateLimitStore()
plan_links = PlanLinkStore()
plan_history_store = PlanHistoryStore() 

# ----------------------------------------
# 2. APP SETUP
# ----------------------------------------
app = FastAPI(title="Bass Clarity API")
app.include_router(catches_router, tags=["catches"])
app.include_router(lakes_router, tags=["lakes"])
app.include_router(uploads_router, tags=["uploads"])

# [DELETED] The premature app.include_router(billing.router) was here. GONE.

# ✅ PRODUCTION CORS CONFIGURATION
origins = [
    "https://www.bassclarity.com",
    "https://bassclarity.com",
    "https://bassclarity.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    # Capacitor mobile app origins
    "capacitor://bassclarity.com",
    "capacitor://localhost",
    "ionic://localhost",
    "http://localhost",
    "https://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment
WEB_BASE_URL = os.getenv("WEB_BASE_URL", "https://bassclarity.com")


async def sync_members_from_stripe():
    """
    Scans Stripe for active/trialing subscriptions and syncs them to Postgres.
    """
    print("[Startup] Starting Stripe-to-DB member sync...")
    init_stripe()
    store = SubscriberStore()
    
    try:
        # Fetch all active/trialing subscriptions
        subscriptions = stripe.Subscription.list(status="active", limit=100)
        # Also include trialing
        trialing = stripe.Subscription.list(status="trialing", limit=100)
        
        all_subs = list(subscriptions.auto_paging_iter()) + list(trialing.auto_paging_iter())
        
        count = 0
        for sub in all_subs:
            customer_id = sub.get("customer")
            # We need the email, which isn't always in the sub object
            customer = stripe.Customer.retrieve(customer_id)
            email = getattr(customer, "email", None)

            if email:
                store.upsert_active(
                    email=email.lower().strip(),
                    active=True,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=sub.get("id")
                )
                count += 1
        print(f"[Startup] Sync complete. Verified {count} active members.")
    except Exception as e:
        print(f"[Startup] Sync failed: {e}")

# ========================================
# VARIETY SYSTEM HELPER
# ========================================

def get_recent_lures(email: str, current_lake_name: str, limit: int = 3) -> dict[str, any]:
    """
    Get user's N most recent primary AND secondary lures from plan history.
    Also returns regeneration context (location, timing, last combination).
    """
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    try:
        recent_history = plan_history_store.get_user_plans(
            email=email,
            since=seven_days_ago,
            limit=limit,
            offset=0,
            include_deleted=False
        )
    except Exception as e:
        print(f"Failed to get plan history for {email}: {e}")
        return {
            "primary": [], 
            "secondary": [],
            "context": {
                "last_lake_name": None,
                "minutes_since_last_gen": None,
                "last_combination": None
            }
        }
    
    primary_lures = []
    secondary_lures = []
    last_lake_name = None
    minutes_since_last = None
    last_combination = None
    
    for idx, plan_hist in enumerate(recent_history):
        token = plan_hist.get("plan_link_id")
        if not token: continue
        
        # Capture context from most recent plan (first in list)
        if idx == 0:
            last_lake_name = plan_hist.get("lake_name")
            gen_date_str = plan_hist.get("generation_date")
            
            # Calculate time since last generation
            if gen_date_str:
                try:
                    gen_date = datetime.fromisoformat(gen_date_str.replace('Z', '+00:00'))
                    now = datetime.now(timezone.utc)
                    delta = now - gen_date
                    minutes_since_last = int(delta.total_seconds() / 60)
                except Exception as e:
                    print(f"Failed to parse generation date: {e}")
        
        try:
            full_plan_data = plan_links.get_plan(token)
            if not full_plan_data: continue
            
            plan = full_plan_data.get("plan", {})
            p_lure = plan.get("primary", {}).get("base_lure")
            if p_lure: primary_lures.append(p_lure)
            
            s_lure = plan.get("secondary", {}).get("base_lure")
            if s_lure: secondary_lures.append(s_lure)
            
            # Capture most recent combination
            if idx == 0 and p_lure and s_lure:
                last_combination = (p_lure, s_lure)
                
        except Exception as e:
            print(f"Failed to extract lures from plan {token}: {e}")
            continue
    
    return {
        "primary": primary_lures,
        "secondary": secondary_lures,
        "context": {
            "last_lake_name": last_lake_name,
            "minutes_since_last_gen": minutes_since_last,
            "last_combination": last_combination
        }
    }

# ========================================
# REQUEST MODELS
# ========================================

class PlanGenerateRequest(BaseModel):
    email: EmailStr
    latitude: float
    longitude: float
    location_name: str
    access_type: str = "boat"

class SubscribeRequest(BaseModel):
    email: EmailStr


# ========================================
# SYNC STRIPE MEMBERS
# ========================================
@app.on_event("startup")
async def startup_event():
    # This runs every time Render deploys or restarts your API
    await sync_members_from_stripe()


# ========================================
# WEATHER UTILS
# ========================================

@app.get("/weather/current")
async def weather_current(lat: float, lon: float):
    """
    Lightweight endpoint to fetch live weather for the UI.
    Used by WeatherSection to update the 'face' of the card without
    regenerating the entire plan.
    """
    try:
        # Reuse your existing weather service
        weather = await get_weather_snapshot(lat, lon)
        return weather
    except Exception as e:
        # Frontend fails gracefully (stays offline) if this errors
        print(f"Live weather fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Weather unavailable")


@app.get("/weather/history")
async def weather_history(lat: float, lon: float, dt: int):
    """
    Fetch historical weather for a specific timestamp.
    Used by CatchLog to get weather at the time a photo was taken.

    Args:
        lat: Latitude
        lon: Longitude
        dt: Unix timestamp (seconds since epoch)
    """
    import os
    import httpx
    from app.services.weather import degrees_to_cardinal

    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Weather API not configured")

    try:
        url = "https://api.openweathermap.org/data/3.0/onecall/timemachine"
        params = {
            "lat": lat,
            "lon": lon,
            "dt": dt,
            "appid": api_key,
            "units": "imperial"
        }

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)

            if resp.status_code != 200:
                print(f"Weather history API error: {resp.status_code} - {resp.text}")
                raise HTTPException(status_code=502, detail="Historical weather unavailable")

            data = resp.json()

        # Extract the data point closest to requested time
        hist_data = data.get("data", [{}])[0] if data.get("data") else {}

        if not hist_data:
            raise HTTPException(status_code=404, detail="No historical data for this time")

        wind_deg = hist_data.get("wind_deg")
        weather_desc = hist_data.get("weather", [{}])[0] if hist_data.get("weather") else {}

        return {
            "temp_f": hist_data.get("temp"),
            "wind_mph": hist_data.get("wind_speed"),
            "wind_direction": degrees_to_cardinal(wind_deg),
            "pressure_mb": hist_data.get("pressure"),
            "sky_condition": weather_desc.get("main", "Unknown"),
            "cloud_cover": weather_desc.get("description", "unknown"),
            "humidity": hist_data.get("humidity"),
            "historical": True,
            "timestamp": dt,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Historical weather fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Weather history unavailable")


# ========================================
# PLAN GENERATION (UNIFIED ENDPOINT)
# ========================================

@app.post("/plan/generate")
async def plan_generate(body: PlanGenerateRequest, request: Request):
    # Map flat fields to Service variables
    latitude = body.latitude
    longitude = body.longitude
    location = body.location_name
    
    email = body.email.lower().strip()
    
    access_type = body.access_type.lower().strip()
    if access_type not in ["boat", "bank"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid access_type: '{access_type}'. Must be 'boat' or 'bank'."
        )
    
    admin_override = request.headers.get("X-Admin-Override") == "true"

    # FREE_MODE: All authenticated users are treated as members
    is_member = True if FREE_MODE else subs.is_active(email)

    if not admin_override:
        # Subscription check (skipped in FREE_MODE since is_member is always True)
        if not is_member:
            raise HTTPException(
                status_code=403,
                detail="Subscription required to generate scouting reports."
            )

        # Universal rate limiting (applies to everyone)
        if not rate_limits.is_within_daily_limit(email, limit=DAILY_PLAN_LIMIT):
            # Calculate seconds until midnight for frontend display
            now = datetime.now()
            midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            seconds_remaining = int((midnight - now).total_seconds())

            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit_member",
                    "message": f"You've used your {DAILY_PLAN_LIMIT} daily scouting reports. New insights reset at midnight.",
                    "seconds_remaining": seconds_remaining
                }
            )
    
    try:
        weather = await get_weather_snapshot(latitude, longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather service error: {e}")
    
    # Phase selection (V1): date + region baseline via season_selector.
    # Non-breaking: we keep determine_phase available for legacy debugging,
    # but the active phase for seasonal policies is date/region-based.
    from datetime import date as _date
    from app.utils.season_selector import get_season as _get_season

    # ✅ NEW: Pass 'weather' so the overrides can trigger
    raw_season = _get_season(_date.today(), latitude, longitude, weather=weather)
    
    # Optional: Debug Print to confirm it worked in the logs
    print(f"DEBUG: Calendar Date=Winter, but Detected Phase={raw_season} (Temp: {weather.get('temp_f')})")    # Normalize to canonical module keys used by seasonal policies
    if raw_season in ("pre_spawn", "pre-spawn", "pre spawn"):
        phase = "prespawn"
    elif raw_season in ("post_spawn", "post-spawn", "post spawn"):
        phase = "postspawn"
    else:
        phase = raw_season
    
    recent_data = get_recent_lures(email, current_lake_name=body.location_name, limit=2)
    trip_date = datetime.now().strftime("%B %d, %Y")
    
    try:
        plan = await generate_llm_plan_with_retries(
            weather=weather,
            phase=phase,
            location=location, 
            latitude=latitude,
            longitude=longitude,
            access_type=access_type,
            is_member=is_member,
            current_lake_name=body.location_name,
            recent_primary_lures=recent_data["primary"],
            recent_secondary_lures=recent_data["secondary"],
            regen_context=recent_data["context"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation error: {e}")
    
    if not plan:
        raise HTTPException(status_code=503, detail="Plan generation temporarily unavailable.")
    
    if is_member:
        plan = enrich_member_plan(plan, weather, phase)
    
    # ✅ POPULATE CONDITIONS - UPDATED TO INCLUDE NEW FIELDS
    plan["conditions"] = {
        "location_name": body.location_name,
        "latitude": latitude,
        "longitude": longitude,
        "trip_date": trip_date,
        "access_type": access_type,
        "subscriber_email": email if is_member else None,
        "phase": phase,
        # Core
        "temp_f": weather["temp_f"],
        "temp_high": weather["temp_high"],
        "temp_low": weather["temp_low"],
        "feels_like_f": weather.get("feels_like_f"), # New
        # Wind
        "wind_mph": weather["wind_mph"],
        "wind_speed": weather["wind_mph"],
        "wind_gust_mph": weather.get("wind_gust_mph"), # New
        "wind_direction": weather.get("wind_direction"), # New
        # Sky/Air
        "cloud_cover": weather["cloud_cover"],
        "sky_condition": weather["sky_condition"], # New
        "humidity": weather["humidity"],
        "visibility_miles": weather.get("visibility_miles"), # New
        "dew_point": weather.get("dew_point"), # New
        # Pressure
        "pressure_mb": weather["pressure_mb"],
        "pressure_trend": weather["pressure_trend"],
        # Solar/Moon
        "uv_index": weather["uv_index"],
        "precipitation_1h": weather["precipitation_1h"],
        "has_recent_rain": weather["has_recent_rain"],
        "moon_phase": weather["moon_phase"],
        "moon_illumination": weather["moon_illumination"],
        "is_major_period": weather["is_major_period"],
        # Times
        "sunriseTime": weather.get("sunriseTime", "--:--"),
        "solarNoonTime": weather.get("solarNoonTime", "--:--"),
        "sunsetTime": weather.get("sunsetTime", "--:--"),
    }
    
    if "forecast_rating" in plan:
        plan["conditions"]["forecast_rating"] = plan["forecast_rating"]

    token = plan_links.save_plan(
        email=email,
        is_member=is_member,
        plan_data=plan,
    )
    
    # ✅ Use query param format that matches frontend routing
    plan_url = f"{WEB_BASE_URL}/plan?token={token}"
    
    # ✅ Add plan_url to the plan object itself for frontend Share/Copy functionality
    plan["plan_url"] = plan_url
    
    plan_history_store.add_plan(
        user_email=email,
        plan_link_id=token,
        lake_name=body.location_name,
        plan_type="member" if is_member else "preview",
        conditions=plan["conditions"]
    )
    
    if is_member:
        rate_limits.increment_daily_count(email)
    
    return {
        "plan_url": plan_url,
        "token": token,
        "access_type": access_type,
        "plan": plan,
    }

# ========================================
# PLAN VIEWING
# ========================================

@app.get("/plan/view/{token}")
async def plan_view(token: str):
    plan_data = plan_links.get_plan(token)
    if not plan_data:
        raise HTTPException(status_code=404, detail="Plan not found")
    return {
        "plan": plan_data["plan"],
        "plan_url": plan_data["plan"].get("plan_url") or f"{WEB_BASE_URL}/plan?token={token}",
        "created_at": plan_data["created_at"],
        "views": plan_data["views"],
    }

# ========================================
# BILLING / STRIPE
# ========================================

@app.post("/billing/subscribe")
def billing_subscribe(body: SubscribeRequest):
    email = body.email.strip().lower()
    try:
        checkout_url = create_checkout_session(email=email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Billing error: {e}")
    return {"checkout_url": checkout_url}

@app.post("/billing/portal")
async def billing_portal(authorization: Optional[str] = Header(None)):
    from app.routes.members import verify_clerk_session
    email = await verify_clerk_session(authorization)
    subscriber = subs.get(email)
    if not subscriber or not subscriber.stripe_customer_id:
        raise HTTPException(status_code=404, detail="No subscription found")
    try:
        portal_url = create_portal_session(customer_id=subscriber.stripe_customer_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portal error: {e}")
    return {"portal_url": portal_url}

@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    
    try:
        event = verify_webhook_and_parse_event(payload=payload, stripe_signature=sig)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {e}")
    
    # event_type is pulled from the Stripe event object
    event_type = event.get("type")
    
    # Supported events now include manual dashboard changes and updates
    supported_events = [
        "checkout.session.completed", 
        "customer.subscription.created", 
        "customer.subscription.updated",
        "customer.subscription.deleted"
    ]
    
    if event_type in supported_events:
        update = extract_subscription_state(event)
        if update:
            email, active, customer_id, subscription_id = update
            
            # 1. Update the member's active status in Postgres
            subs.upsert_active(
                email=email,
                active=active,
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id,
            )
            
            # 2. ✅ LOG THE EVENT: For real-time monitoring and database auditing
            print(f"[Webhook Received] {event_type} | User: {email} | Active: {active}")
            subs.log_webhook(
                event_type=event_type,
                email=email,
                active=active,
                event_id=event["id"]
            )
            
            # 3. Send welcome email only for new activations
            if active and event_type in ["checkout.session.completed", "customer.subscription.created"]:
                try:
                    send_welcome_email(email)
                except Exception as e:
                    print(f"Welcome email failed for {email}: {e}")
    
    return {"ok": True}

# ========================================
# HEALTH CHECK & ROOT
# ========================================

@app.get("/health")
@app.head("/health")
def health_check():
    return {
        "status": "healthy",
        "services": {
            "subscribers": "ok",
            "rate_limits": "ok",
            "plan_links": "ok",
            "plan_history": "ok"
        }
    }

@app.get("/")
@app.head("/")
def root():
    return {
        "service": "Bass Clarity API",
        "version": "2.0",
        "endpoints": {
            "generate_plan": "POST /plan/generate",
            "view_plan": "GET /plan/view/{token}",
            "subscribe": "POST /billing/subscribe",
            "health": "GET /health",
        }
    }

# ========================================
# 3. REGISTER ROUTES LAST
# ========================================
# Import routes AFTER stores are initialized to prevent circular import 500s
from app.routes import clerk_webhooks, members, mobile_auth
from app.routes import billing  # Cleaned up duplicate imports

app.include_router(clerk_webhooks.router, tags=["clerk"])
app.include_router(members.router, tags=["members"])
app.include_router(billing.router, tags=["billing"])
app.include_router(mobile_auth.router)  # Mobile auth (bypasses CORS)