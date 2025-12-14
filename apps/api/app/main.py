from dotenv import load_dotenv
from typing import Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .patterns.pattern_logic import build_pro_pattern
from pydantic import BaseModel
from app.services.geo import resolve_zip
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

@app.post("/plan/preview")
async def plan_preview(body: PreviewRequest):
    # 1) Resolve ZIP -> lat/lon + simple place name
    geo = await resolve_zip(body.zip)

    # 2) Build pattern request using resolved lat/lon
    from .patterns.pattern_logic import build_pro_pattern
    from .patterns.schemas import ProPatternRequest

    req = ProPatternRequest(
        latitude=geo["lat"],
        longitude=geo["lon"],
        location_name=geo["name"] or f"ZIP {geo['zip']}",
        # TEMP weather snapshot still (next step replaces this with real weather)
        weather_snapshot={"temp_f": 62, "wind_mph": 6, "cloud_cover": "partly cloudy"},
    )

    result = build_pro_pattern(req)
    payload = result.model_dump() if hasattr(result, "model_dump") else result.dict()

    # 3) Include resolved geo in response so we can verify localization
    return {"geo": geo, "plan": payload}