# apps/api/app/main.py
"""
Bass Clarity API - Complete Backend
Unified plan generation with LLM, rate limiting, and plan history.
"""
from __future__ import annotations

import os
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
from app.services.pdf_generator import (
    generate_mobile_dark_html,
    generate_a4_printable_html,
)
from app.services.stripe_billing import (
    create_checkout_session,
    create_portal_session,
    verify_webhook_and_parse_event,
    extract_subscription_state,
)

# Routes
from app.routes import clerk_webhooks, members

# Initialize stores
subs = SubscriberStore()
rate_limits = RateLimitStore()
plan_links = PlanLinkStore()

# FastAPI app
app = FastAPI(title="Bass Clarity API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment
WEB_BASE_URL = os.getenv("WEB_BASE_URL", "https://bassclarity.com")


# ========================================
# VARIETY SYSTEM HELPER
# ========================================


def get_recent_lures(
    email: str,
    limit: int = 2
) -> dict[str, list[str]]:
    """
    Get user's N most recent primary AND secondary lures from plan history.
    
    This is used for variety tie-breaking - if multiple lures are equally valid,
    prefer alternatives to recently used lures.
    
    Args:
        email: User's email address
        limit: Number of recent plans to check (default 2)
        
    Returns:
        Dict with primary and secondary lure lists:
        {
            "primary": ["carolina rig", "chatterbait"],
            "secondary": ["texas rig", "jig"]
        }
    """
    # Get recent plan history (last 7 days is enough for variety)
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
        return {"primary": [], "secondary": []}
    
    primary_lures = []
    secondary_lures = []
    
    for plan_hist in recent_history:
        token = plan_hist.get("plan_link_id")
        if not token:
            continue
        
        try:
            # Get full plan data using token
            full_plan_data = plan_links.get_plan(token)
            if not full_plan_data:
                continue
            
            plan = full_plan_data.get("plan", {})
            
            # Extract primary lure
            primary_lure = plan.get("primary", {}).get("base_lure")
            if primary_lure:
                primary_lures.append(primary_lure)
            
            # Extract secondary lure
            secondary_lure = plan.get("secondary", {}).get("base_lure")
            if secondary_lure:
                secondary_lures.append(secondary_lure)
                
        except Exception as e:
            print(f"Failed to extract lures from plan {token}: {e}")
            continue
    
    return {
        "primary": primary_lures,
        "secondary": secondary_lures
    }
# ========================================
# REQUEST MODELS
# ========================================

class PlanGenerateRequest(BaseModel):
    email: EmailStr
    latitude: float
    longitude: float
    location_name: str
    access_type: str = "boat"  # "boat" or "bank" - defaults to boat for backward compatibility


class SubscribeRequest(BaseModel):
    email: EmailStr

# ========================================
# PLAN GENERATION (UNIFIED ENDPOINT)
# ========================================

@app.post("/plan/generate")
async def plan_generate(body: PlanGenerateRequest, request: Request):
    """
    Unified plan generation endpoint.
    
    Flow:
    1. Validate access_type (boat or bank)
    2. Check if user is subscriber
    3. Check rate limits (30-day preview OR 1-hour member cooldown) - skipped with X-Admin-Override header
    4. Get weather + determine phase
    5. Get recent lures for variety (if available)
    6. Generate plan with access-filtered targets and variety context
    7. Save plan link
    8. Record request (no emails for v1)
    9. Return plan URL + data
    """
    email = body.email.lower().strip()
    
    # 1. Validate access_type
    access_type = body.access_type.lower().strip()
    if access_type not in ["boat", "bank"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid access_type: '{access_type}'. Must be 'boat' or 'bank'."
        )
    
    # Check for admin override header
    admin_override = request.headers.get("X-Admin-Override") == "true"
    
    # 2. Check subscription status
    is_member = subs.is_active(email)
    
    # 3. Rate limiting (skip if admin override)
    if not admin_override:
        if is_member:
            # Members: 1-hour cooldown
            allowed, seconds_remaining = rate_limits.check_member_cooldown(email)
            if not allowed:
                minutes = seconds_remaining / 60
                hours = seconds_remaining / 3600
                if hours >= 1:
                    time_msg = f"{hours:.1f} hours"
                else:
                    time_msg = f"{int(minutes)} minutes"
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limit_member",
                        "message": f"Please wait {time_msg} between plan requests. Plans are limited to one per hour.",
                        "seconds_remaining": seconds_remaining,
                    }
                )
        else:
            # Non-members: 30-day preview limit
            allowed, seconds_remaining = rate_limits.check_preview_limit(email)
            if not allowed:
                days = seconds_remaining / (24 * 3600)
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "rate_limit_preview",
                        "message": f"You can request one preview every 30 days. Next available in {days:.1f} days.",
                        "seconds_remaining": seconds_remaining,
                        "upgrade_url": f"{WEB_BASE_URL}/subscribe?email={email}"
                    }
                )
    
    # 4. Get weather and determine phase
    try:
        weather = await get_weather_snapshot(body.latitude, body.longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather service error: {e}")
    
    # Determine phase using regional logic
    current_month = datetime.now().month
    phase = determine_phase(
        temp_f=weather["temp_f"],
        month=current_month,
        latitude=body.latitude,
    )
    
    # Debug logging
    print(f"WEATHER: temp={weather.get('temp_f')}°F, wind={weather.get('wind_mph')}mph, "
          f"pressure={weather.get('pressure_mb')}mb ({weather.get('pressure_trend')}), "
          f"sky={weather.get('cloud_cover')}, phase={phase}")

    # 5. Get recent lures for variety (if user has history)
    recent_lures = get_recent_lures(email, limit=2)

    if recent_lures:
        print(f"LLM_PLAN: Recent lures for {email}: {recent_lures}")
    
    # 6. Generate plan (LLM with retries, access filtering, and variety context)
    trip_date = datetime.now().strftime("%B %d, %Y")
    
    try:
        plan = await generate_llm_plan_with_retries(
            weather=weather,
            phase=phase,
            location=body.location_name,
            latitude=body.latitude,
            longitude=body.longitude,
            access_type=access_type,
            is_member=is_member,
            recent_primary_lures=recent_lures["primary"],
            recent_secondary_lures=recent_lures["secondary"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation error: {e}")
    
    if not plan:
        raise HTTPException(
            status_code=503,
            detail="Plan generation temporarily unavailable. Please try again."
        )
    
    # 6b. Enrich member plans with gear and strategy (deterministic)
    if is_member:
        plan = enrich_member_plan(plan, weather, phase)
    
    # ✅ FIXED: Add ALL weather data to conditions (flattened)
    plan["conditions"] = {
        # Location & Date
        "location_name": body.location_name,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "trip_date": trip_date,
        "access_type": access_type,
        "subscriber_email": email if is_member else None,
        
        # Phase
        "phase": phase,
        
        # ✅ ALL ENHANCED WEATHER DATA (flattened from weather snapshot)
        "temp_f": weather["temp_f"],
        "temp_high": weather["temp_high"],
        "temp_low": weather["temp_low"],
        "wind_mph": weather["wind_mph"],
        "cloud_cover": weather["cloud_cover"],
        
        # ✅ Barometric Pressure (CRITICAL - was missing)
        "pressure_mb": weather["pressure_mb"],
        "pressure_trend": weather["pressure_trend"],
        
        # ✅ Light & UV (NEW)
        "uv_index": weather["uv_index"],
        
        # ✅ Precipitation (NEW)
        "precipitation_1h": weather["precipitation_1h"],
        "has_recent_rain": weather["has_recent_rain"],
        
        # ✅ Moon & Solunar (NEW)
        "moon_phase": weather["moon_phase"],
        "moon_illumination": weather["moon_illumination"],
        "is_major_period": weather["is_major_period"],
        
        # ✅ Other (NEW)
        "humidity": weather["humidity"],
        
        # ✅ LEGACY FIELDS (for backward compatibility with old frontend)
        "wind_speed": weather["wind_mph"],  # Alias for old field name
        "sky_condition": weather["cloud_cover"],  # Alias for old field name
    }
    
    # 7. Save plan link
    token = plan_links.save_plan(
        email=email,
        is_member=is_member,
        plan_data=plan,
    )
    
    plan_url = f"{WEB_BASE_URL}/plan?token={token}"
    
    # 7b. Add to plan history
    plan_history_store.add_plan(
        user_email=email,
        plan_link_id=token,
        lake_name=body.location_name,
        plan_type="member" if is_member else "preview",
        conditions=plan["conditions"]
    )
    
    # 8. Record request (no emails for v1)
    if is_member:
        rate_limits.record_member_request(email)
    else:
        rate_limits.record_preview(email)
    
    # 9. Return response
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
    """
    View a saved plan by token.
    Anyone with the link can view.
    """
    plan_data = plan_links.get_plan(token)
    
    if not plan_data:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return {
        "plan": plan_data["plan"],
        "created_at": plan_data["created_at"],
        "views": plan_data["views"],
    }


# ========================================
# BILLING / STRIPE
# ========================================

@app.post("/billing/subscribe")
def billing_subscribe(body: SubscribeRequest):
    """
    Create Stripe checkout session for subscription.
    """
    email = body.email.strip().lower()
    
    try:
        checkout_url = create_checkout_session(email=email)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Billing error: {e}")
    
    return {"checkout_url": checkout_url}


@app.post("/billing/portal")
async def billing_portal(authorization: Optional[str] = Header(None)):
    """
    Create Stripe Customer Portal session for subscription management.
    Requires authentication.
    """
    from app.routes.members import verify_clerk_session
    
    # Verify user is authenticated
    email = await verify_clerk_session(authorization)
    
    # Get subscriber to find customer_id
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
    """
    Handle Stripe webhooks for subscription events.
    """
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    
    try:
        event = verify_webhook_and_parse_event(payload=payload, stripe_signature=sig)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {e}")
    
    # Extract subscription state
    update = extract_subscription_state(event)
    
    if update:
        email, active, customer_id, subscription_id = update
        
        # Update subscriber status
        subs.upsert_active(
            email=email,
            active=active,
            stripe_customer_id=customer_id,
            stripe_subscription_id=subscription_id,
        )
        
        # Send welcome email for new subscribers
        if active and event.get("type") == "checkout.session.completed":
            try:
                send_welcome_email(email)
            except Exception as e:
                print(f"Welcome email failed for {email}: {e}")
    
    return {"ok": True}


# ========================================
# HEALTH CHECK
# ========================================

@app.get("/health")
def health_check():
    """
    Simple health check endpoint.
    """
    return {
        "status": "healthy",
        "services": {
            "subscribers": "ok",
            "rate_limits": "ok",
            "plan_links": "ok",
        }
    }


# ========================================
# CLERK & MEMBER ROUTES
# ========================================

app.include_router(clerk_webhooks.router, tags=["clerk"])
app.include_router(members.router, tags=["members"])

# DEBUG: Print all registered routes
print("\n" + "="*50)
print("REGISTERED ROUTES:")
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        print(f"  {list(route.methods)} {route.path}")
print("="*50 + "\n")


@app.get("/")
def root():
    """
    Root endpoint.
    """
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