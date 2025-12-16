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
from fastapi import Depends, Header, HTTPException
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


app = FastAPI(title="Bass Fishing Plans API")

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


class PreviewRequest(BaseModel):
    zip: str
    email: Optional[str] = None
    trip_date: Optional[dt_date] = None
    is_preview: bool = True   # ✅ default for /plan/preview

class GeoOut(BaseModel):
    zip: str
    lat: float
    lon: float
    name: Optional[str] = None

class TimingOut(BaseModel):
    total_ms: int
    rewrite_ms: Optional[int] = None

class PreviewResponse(BaseModel):
    geo: GeoOut
    plan: Dict[str, Any]            # keep flexible for now
    markdown: str
    rewritten: bool
    day_progression: List[str]
    timing: TimingOut


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
    req = ProPatternRequest(
        latitude=geo["lat"],
        longitude=geo["lon"],
        location_name=geo["name"] or f"ZIP {geo['zip']}",
        weather_snapshot=await get_weather_snapshot(geo["lat"], geo["lon"]),
        month=effective_date.month,
        trip_date=effective_date,  # optional pass-through
    )

    result = build_pro_pattern(req)
    payload = result.model_dump()


    # Preview-only flags live here (not in pattern_logic)
    if "conditions" not in payload or not isinstance(payload["conditions"], dict):
        raise RuntimeError("Pattern engine did not return conditions")

    payload["conditions"]["trip_date"] = effective_date.isoformat()
    payload["conditions"]["is_future_trip"] = (effective_date > et_today())
    payload["conditions"]["is_preview"] = True

    day_prog = build_day_progression(payload)
    

    rewritten = False
    rewrite_ms = None

    if should_rewrite():
        try:
            from .services.openai_rewrite import rewrite_day_progression
            t_rewrite = perf_counter()

            maybe = await asyncio.wait_for(
                rewrite_day_progression(payload, day_prog),
                timeout=8.0,
            )
            rewrite_ms = int((perf_counter() - t_rewrite) * 1000)

            if maybe:
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