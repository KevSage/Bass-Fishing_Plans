import os
import asyncio
from datetime import date
from pathlib import Path
from time import perf_counter
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.geo import resolve_zip
from app.services.weather import get_weather_snapshot

# ----------------------------------------
# ENV (single, explicit .env location)
# ----------------------------------------
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"  # apps/api/.env
load_dotenv(dotenv_path=ENV_PATH, override=True)


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
    trip_date: Optional[date] = None


@app.post("/plan/preview")
async def plan_preview(body: PreviewRequest):
    t0 = perf_counter()

    # ----------------------------------------
    # Resolve location
    # ----------------------------------------
    geo = await resolve_zip(body.zip)

    from .patterns.pattern_logic import build_pro_pattern
    from .patterns.schemas import ProPatternRequest
    from .render.plan_markdown import render_plan_markdown
    from .render.day_progression import build_day_progression

    # ----------------------------------------
    # Build pattern request
    # ----------------------------------------
    req = ProPatternRequest(
        latitude=geo["lat"],
        longitude=geo["lon"],
        location_name=geo["name"] or f"ZIP {geo['zip']}",
        weather_snapshot=await get_weather_snapshot(geo["lat"], geo["lon"]),
    )

    # ----------------------------------------
    # Deterministic pattern logic
    # ----------------------------------------
    result = build_pro_pattern(req)
    payload = result.model_dump()

    # ----------------------------------------
    # Day progression (rules-based)
    # ----------------------------------------
    day_prog = build_day_progression(payload)

    # ----------------------------------------
    # Optional OpenAI rewrite layer
    # ----------------------------------------
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
            rewritten = False

        except Exception as e:
            rewrite_ms = int((perf_counter() - t_rewrite) * 1000)
            print("OPENAI REWRITE ERROR(main.py):", repr(e))
            rewritten = False

    # ----------------------------------------
    # Attach progression + render output
    # ----------------------------------------
    payload["day_progression"] = day_prog
    markdown = render_plan_markdown(payload)

    total_ms = int((perf_counter() - t0) * 1000)

    return {
        "geo": geo,
        "plan": payload,
        "markdown": markdown,
        "rewritten": rewritten,
        "day_progression": day_prog,
        "timing": {
            "total_ms": total_ms,
            "rewrite_ms": rewrite_ms,
        },
    }