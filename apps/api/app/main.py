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

# ✅ PRODUCTION CORS CONFIGURATION
origins = [
    "https://www.bassclarity.com",
    "https://bassclarity.com",
    "https://bassclarity.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
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

def get_recent_lures(email: str, limit: int = 3) -> dict[str, list[str]]:
    """Get user's N most recent primary AND secondary lures from plan history."""
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
        if not token: continue
        
        try:
            full_plan_data = plan_links.get_plan(token)
            if not full_plan_data: continue
            
            plan = full_plan_data.get("plan", {})
            p_lure = plan.get("primary", {}).get("base_lure")
            if p_lure: primary_lures.append(p_lure)
            
            s_lure = plan.get("secondary", {}).get("base_lure")
            if s_lure: secondary_lures.append(s_lure)
                
        except Exception as e:
            print(f"Failed to extract lures from plan {token}: {e}")
            continue
    
    return {"primary": primary_lures, "secondary": secondary_lures}

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
    is_member = subs.is_active(email)
    
    if not admin_override:
        if not is_member:
            raise HTTPException(
                status_code=403,
                detail="Subscription required to generate scouting reports."
            )
            
        if not rate_limits.is_within_daily_limit(email):
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit_daily",
                    "message": "You've used your 10 daily scouting reports. New insights reset at midnight."
                }
            )
    
    try:
        weather = await get_weather_snapshot(latitude, longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather service error: {e}")
    
    current_month = datetime.now().month
    phase = determine_phase(temp_f=weather["temp_f"], month=current_month, latitude=latitude)
    
    recent_lures = get_recent_lures(email, limit=2)
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
            recent_primary_lures=recent_lures["primary"],
            recent_secondary_lures=recent_lures["secondary"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation error: {e}")
    
    if not plan:
        raise HTTPException(status_code=503, detail="Plan generation temporarily unavailable.")
    
    if is_member:
        plan = enrich_member_plan(plan, weather, phase)
    
    plan["conditions"] = {
        "location_name": body.location_name,
        "latitude": latitude,
        "longitude": longitude,
        "trip_date": trip_date,
        "access_type": access_type,
        "subscriber_email": email if is_member else None,
        "phase": phase,
        "temp_f": weather["temp_f"],
        "temp_high": weather["temp_high"],
        "temp_low": weather["temp_low"],
        "wind_mph": weather["wind_mph"],
        "cloud_cover": weather["cloud_cover"],
        "pressure_mb": weather["pressure_mb"],
        "pressure_trend": weather["pressure_trend"],
        "uv_index": weather["uv_index"],
        "precipitation_1h": weather["precipitation_1h"],
        "has_recent_rain": weather["has_recent_rain"],
        "moon_phase": weather["moon_phase"],
        "moon_illumination": weather["moon_illumination"],
        "is_major_period": weather["is_major_period"],
        "humidity": weather["humidity"],
        "wind_speed": weather["wind_mph"],  
        "sky_condition": weather["cloud_cover"],  
    }
    
    token = plan_links.save_plan(
        email=email,
        is_member=is_member,
        plan_data=plan,
    )
    
    plan_url = f"{WEB_BASE_URL}/plan/view/{token}"
    
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

# apps/api/app/main.py

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
from app.routes import clerk_webhooks, members

app.include_router(clerk_webhooks.router, tags=["clerk"])
app.include_router(members.router, tags=["members"])