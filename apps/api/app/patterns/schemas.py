from typing import Any, Dict, List, Optional
from pydantic import BaseModel

# --- existing Basic + LureSetup stay as-is ---

class BasicPatternRequest(BaseModel):
    temp_f: float
    month: int
    clarity: str
    wind_speed: float


class BasicPatternResponse(BaseModel):
    phase: str
    depth_zone: str
    recommended_techniques: List[str]
    targets: List[str]
    notes: str


class LureSetup(BaseModel):
    lure: str
    technique: str
    rod: str
    reel: str
    line: str
    hook_or_leader: str
    lure_size: str


# --- UPDATED: ProPatternRequest / Response (no month, auto-weather) ---


# --- UPDATED: ProPatternRequest / Response (no month, auto-weather) ---


class ProPatternRequest(BaseModel):
    """
    Pro = rules-based pattern engine with auto weather.

    IMPORTANT:
    - The app (not the user) should provide latitude/longitude.
    - location_name is optional and mainly for debugging / future features.
    """
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None  # optional, can be omitted entirely

    # Optional user / app hints about the water, not about location
    clarity: Optional[str] = None
    bottom_composition: Optional[str] = None  # "rock", "sand", "mud", etc.
    depth_ft: Optional[float] = None
    forage: Optional[List[str]] = None


class ProPatternResponse(BaseModel):
    phase: str
    depth_zone: str
    recommended_lures: List[str]
    recommended_targets: List[str]
    strategy_tips: List[str]
    color_recommendations: List[str]
    lure_setups: List["LureSetup"]
    conditions: Dict[str, Any]
    notes: str
  # 🔹 NEW FIELDS (additive, all optional)
    primary_technique: Optional[str] = None
    featured_lure_name: Optional[str] = None
    featured_lure_family: Optional[str] = None  # e.g. "chatterbait", "texas_rig", "jerkbait"
    pattern_summary: Optional[str] = None       # Pattern blurb for UI

class ElitePatternRequest(ProPatternRequest):
    """
    Elite = Pro + session context (no vision, no manual weather/date).

    Location is still provided by the app (GPS), not the user typing.
    """
    time_of_day: Optional[str] = None        # "dawn" | "midday" | ...


class ElitePatternResponse(BaseModel):
    phase: str
    depth_zone: str
    recommended_lures: List[str]
    recommended_targets: List[str]
    strategy_tips: List[str]
    color_recommendations: List[str]
    lure_setups: List["LureSetup"]
    notes: str

    gameplan: List[str]
    adjustments: List[str]
    conditions: Dict[str, Any]