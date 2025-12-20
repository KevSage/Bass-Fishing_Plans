# apps/api/app/services/llm_plan_schema.py

from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional, Literal

# ----------------------------
# Locked enums (string exactness enforced by validator using pools.py)
# ----------------------------

Presentation = Literal[
    "Horizontal Reaction",
    "Vertical Reaction",
    "Bottom Contact – Dragging",
    "Bottom Contact – Hopping / Targeted",
    "Hovering / Mid-Column Finesse",
    "Topwater – Horizontal",
    "Topwater – Precision / Vertical Surface Work",
]

# NOTE: We intentionally do NOT hard-enum lure/color/targets here.
# Those are enforced by the validator against LURE_POOL/COLOR_POOL/TARGET_POOL.

# ----------------------------
# Gear (LLM chooses, but must be plausible; you can later lock to a small pool)
# ----------------------------

class GearLLMOut(BaseModel):
    rod: str
    reel: str
    line: str


# ----------------------------
# Pattern block (1 lure/presentation per pattern)
# ----------------------------

class PatternLLMOut(BaseModel):
    # Must match pools.py LURE_POOL exactly (validator enforces)
    lure: str

    # Must match pools.py mapping for the lure (validator enforces)
    presentation: Presentation

    # Must be 1–2 colors from COLOR_POOL (validator enforces)
    colors: List[str] = Field(min_length=1, max_length=2)

    # 2–4 targets from TARGET_POOL (exact string match; validator enforces)
    targets: List[str] = Field(min_length=3, max_length=5)

    # Required “how” bullets; no new lures allowed inside text (validator will scan)
    how_to_fish: List[str] = Field(min_length=3, max_length=6)

    # Gear chosen by the LLM (later we can constrain to a pool)
    gear: GearLLMOut

    # Terminal tackle plastic (ONLY for terminal rigs; validator enforces bucket)
    # Examples: "creature bait", "finesse worm", "small minnow", "lizard"
    terminal_plastic: Optional[str] = None

    # Trailer (ONLY for jig-style / skirted baits per rules; validator enforces)
    # Examples: "craw", "chunk", "soft jerkbait", "paddle tail swimbait"
    trailer: Optional[str] = None

    # Optional short “why” for the pattern card (LLM)
    pattern_summary: Optional[str] = None


# ----------------------------
# Optional Search → Pick-Apart combo (only when justified)
# This is the ONLY way a “third” bait is allowed.
# ----------------------------

class SearchPickApartLLMOut(BaseModel):
    # Must be a faster/water-covering lure from LURE_POOL (validator enforces)
    search_lure: str
    search_presentation: Presentation
    search_colors: List[str] = Field(min_length=1, max_length=2)

    # Must be a slower/pick-apart lure from LURE_POOL (validator enforces)
    pick_apart_lure: str
    pick_apart_presentation: Presentation
    pick_apart_colors: List[str] = Field(min_length=1, max_length=2)

    # One factual sentence, no hype
    when_to_switch: str


# ----------------------------
# Top-level LLM output = plan ONLY
# - Preview: primary required, counter optional
# - Members: primary + counter required
# - Third bait: ONLY via search_pick_apart
# ----------------------------

class PlanLLMOut(BaseModel):
    # Deterministic (you may pass in / keep from your existing engine)
    # but allow LLM to echo them for UI consistency if you want.
    phase: Optional[str] = None
    depth_zone: Optional[str] = None

    # New field you asked for (LLM, constrained)
    outlook_blurb: Optional[str] = None

    # Always present
    primary: PatternLLMOut

    # Members: required. Preview: optional.
    counter: Optional[PatternLLMOut] = None

    # Optional “third” only as structured combo
    search_pick_apart: Optional[SearchPickApartLLMOut] = None

    # Exactly 3 lines: Morning/Midday/Late (validator enforces)
    day_progression: List[str] = Field(min_length=3, max_length=3)

    # Optional tips (validator will still scan for invented lure tokens)
    strategy_tips: List[str] = Field(default_factory=list, max_length=6)