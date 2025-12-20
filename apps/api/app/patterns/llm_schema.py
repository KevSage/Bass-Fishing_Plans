# apps/api/app/patterns/llm_schema.py
from __future__ import annotations

from typing import List, Optional, Literal
from pydantic import BaseModel, Field

# NOTE:
# - All string fields that map to canon pools must be EXACT matches.
# - We’ll validate against canon/pools.py after parsing.

class LLMGear(BaseModel):
    # Keep it simple + safe (no 100-combo explosion)
    setup_type: Literal["spinning", "baitcaster"]

    rod: str   # e.g., "7'1\" MH Fast casting" or "7'0\" ML Extra-Fast spinning"
    reel: str  # e.g., "7.1:1 baitcaster" or "2500 spinning"
    line: str  # e.g., "15–17 lb fluorocarbon" or "10–15 lb braid to 8–10 lb fluoro leader"


class LLMPattern(BaseModel):
    # Canon (exact match)
    presentation: str = Field(..., description="Must be one of PRESENTATIONS")

    # Canon (exact match)
    base_lure: str = Field(..., description="Must be one of LURE_POOL")

    # Optional: only allowed for terminal tackle and jig-style baits
    # - terminal rigs: must be in TERMINAL_PLASTIC_MAP[base_lure]
    # - required/optional trailers: must be in the correct trailer bucket for that lure
    plastic_or_trailer: Optional[str] = Field(
        default=None,
        description="Plastic for terminal rigs OR trailer for jig-style baits. Must obey pools + restrictions.",
    )

    # Canon colors (exact match, 1–2)
    color_recommendations: List[str] = Field(..., min_length=1, max_length=2)

    # Canon targets (exact match, 3–5)
    targets: List[str] = Field(..., min_length=3, max_length=5)

    # Execution
    why_this_works: str = Field(..., description="1–2 sentences. Must reflect provided conditions. No new facts.")
    work_it: List[str] = Field(..., min_length=3, max_length=6)

    gear: LLMGear


class LLMPlan(BaseModel):
    # Plan framing
    primary: LLMPattern
    secondary: LLMPattern

    # Optional “third” only if it is explicitly part of search + pick apart strategy
    # (We can keep it disabled initially by rejecting it in validation.)
    third_optional: Optional[LLMPattern] = None

    # Day progression: 3 lines. No colors. At most 2 lures total.
    # Each line must begin with Morning/Midday/Late and name exactly ONE lure near the start.
    day_progression: List[str] = Field(..., min_length=3, max_length=3)

    # NEW: commentary-only. Must NOT change decisions.
    outlook_blurb: Optional[str] = Field(
        default=None,
        description="1-2 sentences, <= ~35 words. No lure names. No new numbers beyond snapshot_weather.",
    )