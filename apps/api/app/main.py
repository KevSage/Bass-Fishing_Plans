# apps/api/app/main.py
"""
Bass Fishing Plans API - Complete Backend
Unified plan generation with LLM, rate limiting, emails, and downloads.
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict, Optional

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, EmailStr

# Services
from app.services.subscribers import SubscriberStore
from app.services.rate_limits import RateLimitStore
from app.services.plan_links import PlanLinkStore
from app.services.weather import get_weather_snapshot
from app.services.phase_logic import determine_phase
from app.services.llm_plan_service import generate_llm_plan_with_retries
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
    verify_webhook_and_parse_event,
    extract_subscription_state,
)

# Initialize stores
subs = SubscriberStore()
rate_limits = RateLimitStore()
plan_links = PlanLinkStore()

# FastAPI app
app = FastAPI(title="Bass Fishing Plans API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment
WEB_BASE_URL = os.getenv("WEB_BASE_URL", "https://bassfishingplans.com")


# ========================================
# REQUEST MODELS
# ========================================

class PlanGenerateRequest(BaseModel):
    email: EmailStr
    latitude: float
    longitude: float
    location_name: str


class SubscribeRequest(BaseModel):
    email: EmailStr


# ========================================
# PLAN GENERATION (UNIFIED ENDPOINT)
# ========================================

@app.post("/plan/generate")
async def plan_generate(body: PlanGenerateRequest):
    """
    Unified plan generation endpoint.
    
    Flow:
    1. Check if user is subscriber
    2. Check rate limits (30-day preview OR 3-hour member cooldown)
    3. Get weather + determine phase
    4. Generate plan (LLM with Pattern 2 for members)
    5. Save plan link
    6. Send email (preview only)
    7. Return plan URL + data
    """
    email = body.email.lower().strip()
    
    # 1. Check subscription status
    is_member = subs.is_active(email)
    
    # 2. Rate limiting
    if is_member:
        # Members: 3-hour cooldown
        allowed, seconds_remaining = rate_limits.check_member_cooldown(email)
        if not allowed:
            hours = seconds_remaining / 3600
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit_member",
                    "message": f"Please wait {hours:.1f} hours between plan requests",
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
    
    # 3. Get weather and determine phase
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
    
    # 4. Generate plan (LLM with retries)
    trip_date = datetime.now().strftime("%B %d, %Y")
    
    try:
        plan = await generate_llm_plan_with_retries(
            weather=weather,
            location=body.location_name,
            trip_date=trip_date,
            phase=phase,
            is_member=is_member,
            max_retries=2,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation error: {e}")
    
    if not plan:
        raise HTTPException(
            status_code=503,
            detail="Plan generation temporarily unavailable. Please try again."
        )
    
    # Add conditions to plan
    plan["conditions"] = {
        "location_name": body.location_name,
        "latitude": body.latitude,
        "longitude": body.longitude,
        "trip_date": trip_date,
        "phase": phase,
        "temp_f": weather["temp_f"],
        "temp_high": weather["temp_high"],
        "temp_low": weather["temp_low"],
        "wind_speed": weather["wind_mph"],
        "sky_condition": weather["cloud_cover"],
        "subscriber_email": email if is_member else None,
    }
    
    # 5. Save plan link
    token = plan_links.save_plan(
        email=email,
        is_member=is_member,
        plan_data=plan,
    )
    
    plan_url = f"{WEB_BASE_URL}/plan/view/{token}"
    
    # 6. Record request and send email (preview only)
    email_sent = False
    
    if is_member:
        # Record member request
        rate_limits.record_member_request(email)
    else:
        # Record preview request
        rate_limits.record_preview(email)
        
        # Send preview email
        try:
            send_preview_plan_email(
                to_email=email,
                plan_url=plan_url,
                location_name=body.location_name,
                date=trip_date,
            )
            email_sent = True
            
            # Add to marketing audience
            add_to_audience(
                email=email,
                tags=["preview_user", "not_subscribed"],
                is_member=False,
            )
        except Exception as e:
            print(f"Email send failed: {e}")
            # Don't fail the request if email fails
    
    # 7. Return response
    return {
        "plan_url": plan_url,
        "token": token,
        "is_member": is_member,
        "email_sent": email_sent,
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
        "is_member": plan_data["is_member"],
        "created_at": plan_data["created_at"],
        "views": plan_data["views"],
        "download_urls": {
            "mobile_dark": f"/plan/download/{token}/mobile",
            "a4_printable": f"/plan/download/{token}/a4",
        }
    }


# ========================================
# PLAN DOWNLOADS
# ========================================

@app.get("/plan/download/{token}/mobile")
async def plan_download_mobile(token: str):
    """
    Download mobile-optimized dark theme HTML.
    Can be converted to PDF client-side or served as HTML.
    """
    plan_data = plan_links.get_plan(token)
    
    if not plan_data:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    html = generate_mobile_dark_html(plan_data["plan"])
    
    return HTMLResponse(
        content=html,
        headers={
            "Content-Disposition": f'attachment; filename="fishing_plan_mobile_{token[:8]}.html"'
        }
    )


@app.get("/plan/download/{token}/a4")
async def plan_download_a4(token: str):
    """
    Download A4 printable HTML.
    Can be converted to PDF client-side or printed directly.
    """
    plan_data = plan_links.get_plan(token)
    
    if not plan_data:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    html = generate_a4_printable_html(plan_data["plan"])
    
    return HTMLResponse(
        content=html,
        headers={
            "Content-Disposition": f'attachment; filename="fishing_plan_a4_{token[:8]}.html"'
        }
    )


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


@app.get("/")
def root():
    """
    Root endpoint.
    """
    return {
        "service": "Bass Fishing Plans API",
        "version": "2.0",
        "endpoints": {
            "generate_plan": "POST /plan/generate",
            "view_plan": "GET /plan/view/{token}",
            "download_mobile": "GET /plan/download/{token}/mobile",
            "download_a4": "GET /plan/download/{token}/a4",
            "subscribe": "POST /billing/subscribe",
            "health": "GET /health",
        }
    }