import os
import asyncio
from datetime import datetime, date as dt_date
from zoneinfo import ZoneInfo
from pathlib import Path
from time import perf_counter
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from app.services.geo import resolve_zip
from app.services.weather import get_weather_snapshot
from fastapi import Depends, Header, HTTPException, Request
from app.services.subscribers import SubscriberStore
from app.services.stripe_billing import (
    create_checkout_session,
    verify_webhook_and_parse_event,
    extract_subscription_state,
)
# ----------------------------------------
# ENV (single, explicit .env location)
# ----------------------------------------
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"  # apps/api/.env
load_dotenv(dotenv_path=ENV_PATH, override=True)

ET = ZoneInfo("America/New_York")

def et_today() -> dt_date:
    return datetime.now(ET).date()

def require_api_key(x_api_key: Optional[str] = Header(default=None)) -> None:
    expected = (os.getenv("BFP_API_KEY") or "").strip()
    if not expected:
        # If you forgot to set it, fail closed (safer)
        raise HTTPException(status_code=500, detail="Server auth not configured")
    if not x_api_key or x_api_key.strip() != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
def should_rewrite() -> bool:
    return str(os.getenv("LLM_REWRITE", "")).strip().lower() in (
        "1", "true", "yes", "on"
    )

def require_dev_key(x_dev_key: Optional[str] = Header(default=None)) -> None:
    expected = (os.getenv("BFP_DEV_KEY") or "").strip()
    if not expected:
        raise HTTPException(status_code=500, detail="Dev key not configured")
    if not x_dev_key or x_dev_key.strip() != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
app = FastAPI(title="Bass Fishing Plans API")
subs = SubscriberStore()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


# ----------------------------
# Requests
# ----------------------------

class PreviewRequest(BaseModel):
    zip: str
    email: Optional[str] = None
    trip_date: Optional[dt_date] = None
    is_preview: bool = True


class MemberPlanRequest(BaseModel):
    email: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    trip_date: Optional[dt_date] = None

    # optional hints (non-dominant)
    clarity: Optional[str] = None
    bottom_composition: Optional[str] = None
    depth_ft: Optional[float] = None
    forage: Optional[List[str]] = None


# ----------------------------
# Shared Outputs
# ----------------------------

class GeoOut(BaseModel):
    zip: str
    lat: float
    lon: float
    name: Optional[str] = None


# ----------------------------
# Timing (LOCKED)
# ----------------------------

class TimingOut(BaseModel):
    generated_at: str
    build_ms: Optional[int] = None
    snapshot_hash: Optional[str] = None


class PreviewTimingOut(BaseModel):
    total_ms: int
    rewrite_ms: Optional[int] = None


# ----------------------------
# Responses
# ----------------------------

class PreviewResponse(BaseModel):
    geo: GeoOut
    plan: Dict[str, Any]
    markdown: str
    rewritten: bool
    day_progression: List[str]
    timing: PreviewTimingOut


class MemberPlanResponse(BaseModel):
    geo: Dict[str, Any]
    plan: Dict[str, Any]
    markdown: str
    rewritten: bool
    day_progression: List[str]
    timing: TimingOut


class SubscribeRequest(BaseModel):
    email: str


class SubscribeResponse(BaseModel):
    checkout_url: str



# --- DEV MEMBERS (bypass sub + allow primary_index) ---
@app.post("/plan/members/dev", dependencies=[Depends(require_dev_key)])
async def plan_members_dev(
    body: MemberPlanRequest,
    primary_index: int = 0,
):
    return await plan_members(
        body=body,
        bypass_sub_check=True,
        primary_index=primary_index,
    )


# --- REAL MEMBERS ---
@app.post("/plan/members", response_model=MemberPlanResponse)
async def plan_members(
    body: MemberPlanRequest,
    bypass_sub_check: bool = False,
    primary_index: int = 0,
):
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")

    if (not bypass_sub_check) and (not subs.is_active(email)):
        raise HTTPException(status_code=403, detail="Subscription required")

    t0 = perf_counter()

    from .patterns.pattern_logic import build_pro_pattern
    from .patterns.schemas import ProPatternRequest
    from .render.plan_markdown import render_plan_markdown
    from .render.day_progression import build_day_progression

    geo = {
        "name": body.location_name or "Subscriber plan",
        "lat": body.latitude,
        "lon": body.longitude,
    }

    effective_date = body.trip_date or et_today()

    req = ProPatternRequest(
        latitude=body.latitude,
        longitude=body.longitude,
        location_name=body.location_name,
        clarity=body.clarity,
        bottom_composition=body.bottom_composition,
        depth_ft=body.depth_ft,
        forage=body.forage,
        weather_snapshot=await get_weather_snapshot(body.latitude, body.longitude)
        if (body.latitude and body.longitude)
        else None,
        month=effective_date.month,
        trip_date=effective_date,
    )

    result = build_pro_pattern(req)
    payload = result.model_dump()

    if "conditions" not in payload or not isinstance(payload["conditions"], dict):
        raise RuntimeError("Pattern engine did not return conditions")

    payload["conditions"]["trip_date"] = effective_date.isoformat()
    payload["conditions"]["is_future_trip"] = (effective_date > et_today())
    payload["conditions"]["is_preview"] = False
    payload["conditions"]["subscriber_email"] = email

    day_prog = build_day_progression(payload)
    payload["day_progression"] = day_prog

    # -----------------------------
    # DEV-ONLY: force primary lure
    # -----------------------------
    if bypass_sub_check and primary_index == 1:
        rl = payload.get("recommended_lures") or []
        cr = payload.get("color_recommendations") or []
        ls = payload.get("lure_setups") or []

        if len(rl) > 1:
            rl[0], rl[1] = rl[1], rl[0]
        if len(cr) > 1:
            cr[0], cr[1] = cr[1], cr[0]
        if len(ls) > 1:
            ls[0], ls[1] = ls[1], ls[0]

        payload["recommended_lures"] = rl
        payload["color_recommendations"] = cr
        payload["lure_setups"] = ls

    markdown = render_plan_markdown(payload)

    total_ms = int((perf_counter() - t0) * 1000)

    return {
        "geo": geo,
        "plan": payload,
        "markdown": markdown,
        "rewritten": False,
        "day_progression": day_prog,
        "timing": {
            "generated_at": datetime.utcnow().isoformat(),
            "build_ms": total_ms,
            "snapshot_hash": payload["conditions"].get("snapshot_hash"),
        },
    }


@app.post("/plan/preview", response_model=PreviewResponse, dependencies=[Depends(require_api_key)])
async def plan_preview(body: PreviewRequest):
    t0 = perf_counter()
    geo = await resolve_zip(body.zip)

    from .patterns.pattern_logic import build_pro_pattern
    from .patterns.schemas import ProPatternRequest
    from .render.plan_markdown import render_plan_markdown
    from .render.day_progression import build_day_progression

    # ✅ Capture "today" once per request (prevents drift)
    effective_date = body.trip_date or et_today()   

    weather=await get_weather_snapshot(geo["lat"], geo["lon"]),

    req = ProPatternRequest(
        latitude=geo["lat"],
        longitude=geo["lon"],
        location_name=geo["name"] or f"ZIP {geo['zip']}",
        weather_snapshot=weather,
        month=effective_date.month,
        trip_date=effective_date,  # optional pass-through
    )

    result = build_pro_pattern(req)
    payload = result.model_dump()


    # Preview-only flags live here (not in pattern_logic)
    if "conditions" not in payload or not isinstance(payload["conditions"], dict):
        raise RuntimeError("Pattern engine did not return conditions")

    payload["conditions"]["trip_date"] = effective_date.isoformat()
    payload["conditions"]["is_preview"] = True

    day_prog = build_day_progression(payload)
    

    rewritten = False
    rewrite_ms = None

    if should_rewrite():
        t_rewrite = perf_counter()
        try:
            from .services.openai_rewrite import rewrite_day_progression

            maybe = await asyncio.wait_for(
                rewrite_day_progression(payload, day_prog),
                timeout=8.0,
            )
            rewrite_ms = int((perf_counter() - t_rewrite) * 1000)

            if isinstance(maybe, list) and len(maybe) == 3 and all(isinstance(x, str) for x in maybe):
                day_prog = maybe
                rewritten = True

        except asyncio.TimeoutError:
            rewrite_ms = int((perf_counter() - t_rewrite) * 1000)
        except Exception as e:
            rewrite_ms = int((perf_counter() - t_rewrite) * 1000)
            print("OPENAI REWRITE ERROR(main.py):", repr(e))

    payload["day_progression"] = day_prog
    markdown = render_plan_markdown(payload)

    total_ms = int((perf_counter() - t0) * 1000)

    return {
        "geo": geo,
        "plan": payload,
        "markdown": markdown,
        "rewritten": rewritten,
        "day_progression": day_prog,
        "timing": {"total_ms": total_ms, "rewrite_ms": rewrite_ms},
    }


@app.post("/plan/members", response_model=MemberPlanResponse)
async def plan_members(body: MemberPlanRequest, bypass_sub_check: bool = False):
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")

    # ✅ Gate by subscriber status (MVP) — but bypassable for /dev
    if (not bypass_sub_check) and (not subs.is_active(email)):
        raise HTTPException(status_code=403, detail="Subscription required")

    t0 = perf_counter()

    from .patterns.pattern_logic import build_pro_pattern
    from .patterns.schemas import ProPatternRequest
    from .render.plan_markdown import render_plan_markdown
    from .render.day_progression import build_day_progression

    geo = {
        "name": body.location_name or "Subscriber plan",
        "lat": body.latitude,
        "lon": body.longitude,
    }

    effective_date = body.trip_date or et_today()

    req = ProPatternRequest(
        latitude=body.latitude,
        longitude=body.longitude,
        location_name=body.location_name,
        clarity=body.clarity,
        bottom_composition=body.bottom_composition,
        depth_ft=body.depth_ft,
        forage=body.forage,
        weather_snapshot=await get_weather_snapshot(body.latitude, body.longitude)
        if (body.latitude is not None and body.longitude is not None)
        else None,
        month=effective_date.month,
        trip_date=effective_date,
    )

    result = build_pro_pattern(req)
    payload = result.model_dump()

    if "conditions" not in payload or not isinstance(payload["conditions"], dict):
        raise RuntimeError("Pattern engine did not return conditions")

    payload["conditions"]["trip_date"] = effective_date.isoformat()
    payload["conditions"]["is_future_trip"] = (effective_date > et_today())
    payload["conditions"]["is_preview"] = False
    payload["conditions"]["subscriber_email"] = email

    day_prog = build_day_progression(payload)

    rewritten = False
    rewrite_ms = None
    if should_rewrite():
        try:
            from .services.openai_rewrite import rewrite_day_progression
            t_rewrite = perf_counter()
            maybe = await asyncio.wait_for(
                rewrite_day_progression(payload, day_prog),
                timeout=8.0
            )
            rewrite_ms = int((perf_counter() - t_rewrite) * 1000)
            if maybe:
                day_prog = maybe
                rewritten = True
        except Exception:
            rewrite_ms = int((perf_counter() - t_rewrite) * 1000)

    payload["day_progression"] = day_prog
    markdown = render_plan_markdown(payload)

    total_ms = int((perf_counter() - t0) * 1000)

    return {
        "geo": geo,
        "plan": payload,
        "markdown": markdown,
        "rewritten": rewritten,
        "day_progression": day_prog,
        "timing": {"generated_at": datetime.utcnow().isoformat(), "build_ms": total_ms, "snapshot_hash": payload["conditions"].get("snapshot_hash")},
    }


@app.post("/billing/subscribe", response_model=SubscribeResponse)
def billing_subscribe(body: SubscribeRequest):
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email")

    url = create_checkout_session(email=email)

    return {"checkout_url": url}

@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()

    # Stripe sends "Stripe-Signature" header, but Starlette normalizes access.
    sig = request.headers.get("stripe-signature") or request.headers.get("Stripe-Signature")

    try:
        event = verify_webhook_and_parse_event(payload=payload, stripe_signature=sig)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    update = extract_subscription_state(event)

    # Print only meaningful lifecycle events (keeps logs clean)
    etype = event.get("type")
    if etype in (
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    ):
        print("STRIPE EVENT:", etype, "UPDATE:", update)

    if update:
        email, active, customer_id, subscription_id = update
        subs.upsert_active(
            email,
            active=active,
            stripe_customer_id=customer_id,
            stripe_subscription_id=subscription_id,
        )

    return {"ok": True}