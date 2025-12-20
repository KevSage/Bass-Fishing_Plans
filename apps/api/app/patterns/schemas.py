from __future__ import annotations

from datetime import date
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


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


class ProPatternRequest(BaseModel):
    """
    Pro = rules-based pattern engine with upstream-provided weather snapshot.

    IMPORTANT:
    - The app (not the user) provides latitude/longitude.
    - location_name is optional (debug / UI convenience).
    - trip_date controls season/phase; month is optional fallback if trip_date omitted.
    """

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None

    # Optional hints about the water (not location)
    clarity: Optional[str] = None
    bottom_composition: Optional[str] = None  # "rock", "sand", "mud", etc.
    depth_ft: Optional[float] = None
    forage: Optional[List[str]] = None

    # Upstream-provided snapshot (session / API layer)
    weather_snapshot: Optional[Dict[str, Any]] = None

    # Date controls phase/season
    trip_date: Optional[date] = None
    month: Optional[int] = None


class ProPatternResponse(BaseModel):
    phase: str
    depth_zone: str

    recommended_lures: List[str]
    recommended_targets: List[str]
    strategy_tips: List[str]
    color_recommendations: List[str]
    lure_setups: List[LureSetup]

    conditions: Dict[str, Any]
    notes: str

    # Additive UI-friendly fields (optional)
    primary_technique: Optional[str] = None
    featured_lure_name: Optional[str] = None
    featured_lure_family: Optional[str] = None
    pattern_summary: Optional[str] = None


class ElitePatternRequest(ProPatternRequest):
    """
    Elite = Pro + session context (no vision, no manual weather/date).
    """
    time_of_day: Optional[str] = None  # "dawn" | "midday" | ...


class ElitePatternResponse(BaseModel):
    phase: str
    depth_zone: str

    recommended_lures: List[str]
    recommended_targets: List[str]
    strategy_tips: List[str]
    color_recommendations: List[str]
    lure_setups: List[LureSetup]
    notes: str

    gameplan: List[str]
    adjustments: List[str]
    conditions: Dict[str, Any]