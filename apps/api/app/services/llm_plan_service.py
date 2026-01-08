"""
llm_plan_service.py - FULL PRODUCTION VERSION
Features:
1. DENSE PROMPT: Creative guide voice + detailed day progression.
2. HISTORY AWARENESS: Passes recent lures to prevent repetition (Variety).
3. WEATHER INSIGHTS: Injects deterministic data for the frontend UI.
"""
from __future__ import annotations

import os
import json
import time
import random
import asyncio
import traceback
import re
from typing import Any, Dict, List, Optional, Tuple

import httpx

# ----------------------------------------
# CANONICAL IMPORTS
# ----------------------------------------
from app.canon.pools import (
    LURE_POOL,
    PRESENTATIONS,
    LURE_TO_PRESENTATION,
    TERMINAL_PLASTIC_MAP,
    TRAILER_BUCKET_BY_LURE,
    CHATTER_SWIMJIG_TRAILERS,
    SPINNER_BUZZ_TRAILERS,
    JIG_TRAILERS,
    get_color_pool_for_lure,
    RIG_COLORS,
    BLADED_SKIRTED_COLORS,
    SOFT_SWIMBAIT_COLORS,
    CRANKBAIT_COLORS,
    JERKBAIT_COLORS,
    TOPWATER_COLORS,
    FROG_COLORS,
    LURE_COLOR_POOL_MAP,
    expand_color_zones,
)
from app.canon.target_definitions import (
    TARGET_DEFINITIONS,
    filter_targets_by_access,
)
from app.canon.variety import (
    get_variety_mode,
    get_lure_tiers_for_presentation,
    get_color_candidates,
)
from app.canon.validate import (
    validate_lure_and_presentation,
    validate_colors_for_lure,
)
from app.canon.retrieve_rules import LURE_TIP_BANK

# ✅ REVERSE CARD IMPORT: Using the logic engine ONLY for weather insights
from app.patterns.pattern_logic import generate_weather_insights


# ----------------------------------------
# SYSTEM PROMPT (DENSE / GUIDE VOICE)
# ----------------------------------------
def build_system_prompt(include_pattern_2: bool = False) -> str:
    """
    Bass Clarity System Prompt - DENSE VERSION.
    Restores the specific instructions for day_progression, strategy, and temperature swings.
    """

    def _json_default(o: Any):
        if isinstance(o, set): return sorted(list(o))
        if isinstance(o, tuple): return list(o)
        return str(o)

    def jdump(obj: Any) -> str:
        return json.dumps(
            obj,
            ensure_ascii=False,
            separators=(",", ":"),
            default=_json_default,
            sort_keys=True,
        )

    # ---------- terminal plastics (human-readable list) ----------
    terminal_rules: List[str] = []
    for lure, plastics in TERMINAL_PLASTIC_MAP.items():
        terminal_rules.append(f"- {lure}: {sorted(list(plastics))}")

    # ---------- trailer rules (human-readable list) ----------
    trailer_rules = [
        "REQUIRED:",
        f"- chatterbait, swim jig: {sorted(list(CHATTER_SWIMJIG_TRAILERS))}",
        f"- casting jig, football jig: {sorted(list(JIG_TRAILERS))}",
        "OPTIONAL:",
        f"- spinnerbait, buzzbait: {sorted(list(SPINNER_BUZZ_TRAILERS))}",
    ]

    # ---------- output format (DENSE) ----------
    if include_pattern_2:
        output_format = r"""
RETURN JSON ONLY:
{
  "primary":{
    "presentation":"<from PRESENTATIONS>",
    "base_lure":"<from LURE_POOL>",

    "soft_plastic": null | "<ONLY for terminal tackle rigs; MUST be null for any jig/skirted/bladed>",
    "soft_plastic_why": null | "<1-2 sentences>",

    "trailer": null | "<ONLY if lure uses a trailer; MUST be null for terminal tackle>",
    "trailer_why": null | "<1 sentence only if trailer used>",

    "color_recommendations":["<COLOR_CLEAR_OR_AVG>","<COLOR_STAINED_OR_MUDDY>"],

    "targets":["<target>","<target>","<target>"],

    "why_this_works":"2-3 sentences total. MUST explain why THIS lure + presentation fits phase/conditions AND include color guidance in Choose A if... Choose B if... format.",
    "pattern_summary":"2-3 sentences. Suggestive language only (may/might/can/suggests).",
    "strategy":"2-3 sentences. Practical, calm, no hype.",

    "work_it":[
      "<Target 1>: <specific cadence using LURE_TIP_BANK>",
      "<Target 2>: <specific cadence using LURE_TIP_BANK>",
      "<Target 3>: <specific cadence using LURE_TIP_BANK>"
    ],

    "work_it_cards":[
      {"name":"<Target 1>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences. Specific advice on cadence and feel."},
      {"name":"<Target 2>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences. Specific advice on cadence and feel."},
      {"name":"<Target 3>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences. Specific advice on cadence and feel."}
    ]
  },

  "secondary":{
    "presentation":"<from PRESENTATIONS; MUST be different from primary.presentation>",
    "base_lure":"<from LURE_POOL>",

    "soft_plastic": null | "<same rules as primary>",
    "soft_plastic_why": null | "<1-2 sentences>",

    "trailer": null | "<same rules as primary>",
    "trailer_why": null | "<1 sentence only if trailer used>",

    "color_recommendations":["<COLOR_CLEAR_OR_AVG>","<COLOR_STAINED_OR_MUDDY>"],

    "targets":["<target>","<target>","<target>"],

    "why_this_works":"2-3 sentences total. MUST reference primary and explain the pivot assumption. Include Choose A if... Choose B if... color guidance.",
    "pattern_summary":"2-3 sentences. Suggestive language only.",
    "strategy":"2-3 sentences. Practical pivot, no hype.",

    "work_it":[
      "<Target 1>: <specific cadence>",
      "<Target 2>: <specific cadence>",
      "<Target 3>: <specific cadence>"
    ],

    "work_it_cards":[
      {"name":"<Target 1>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 2>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 3>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"}
    ]
  },

  "day_progression":[
    "Morning: 2-3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize",
    "Midday: 2-3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize",
    "Evening: 2-3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize"
  ],

  "outlook_blurb":"3 sentences of weather, condition and phase related analysis and how it may effect bass activity. No exact numbers or strategy"
}
"""
    else:
        # Single pattern fallback
        output_format = r"""
RETURN JSON ONLY:
{
  "presentation":"<from PRESENTATIONS>",
  "base_lure":"<from LURE_POOL>",
  "soft_plastic": null,
  "trailer": null,
  "color_recommendations":["<COLOR_CLEAR>","<COLOR_STAINED>"],
  "targets":["<target>","<target>","<target>"],
  "why_this_works":"2-3 sentences.",
  "strategy":"2-3 sentences.",
  "work_it_cards":[
    {"name":"<Target 1>","definition":"...","how_to_fish":"2-3 sentences"}
  ],
  "day_progression":["Morning: ...","Midday: ...","Evening: ..."],
  "outlook_blurb":"2-3 sentences."
}
"""

    return f"""You are Bass Clarity, an expert bass fishing guide.
CRITICAL: Return a SINGLE JSON OBJECT only. No markdown.

🚨 VALIDATION RULES (LOCKED):
1. ONE BOTTOM CONTACT MAX: If primary is bottom contact, secondary MUST be reaction/moving.
2. LURE MATCH: Check LURE_TO_PRESENTATION.
3. NO DUPLICATES: Primary and Secondary must have DIFFERENT lures.
4. TARGETS: Exactly 3 targets from the accessible_targets list provided.

🚨 COLOR INTEGRITY:
- Use LURE_COLOR_POOL_MAP to find the correct pool.
- Output exactly 2 colors (Clear option, Stained option).

CANONICAL POOLS:
PRESENTATIONS: {jdump(PRESENTATIONS)}
LURES: {jdump(LURE_POOL)}
LURE_TO_PRESENTATION: {jdump(LURE_TO_PRESENTATION)}
LURE_COLOR_POOL_MAP: {jdump(LURE_COLOR_POOL_MAP)}

COLOR POOLS:
RIG_COLORS: {jdump(RIG_COLORS)}
BLADED_SKIRTED_COLORS: {jdump(BLADED_SKIRTED_COLORS)}
SOFT_SWIMBAIT_COLORS: {jdump(SOFT_SWIMBAIT_COLORS)}
CRANKBAIT_COLORS: {jdump(CRANKBAIT_COLORS)}
JERKBAIT_COLORS: {jdump(JERKBAIT_COLORS)}
TOPWATER_COLORS: {jdump(TOPWATER_COLORS)}
FROG_COLORS: {jdump(FROG_COLORS)}

LURE_TIP_BANK: {jdump(LURE_TIP_BANK)}

{output_format}
"""


# ----------------------------------------
# Helpers: Extraction & Signals
# ----------------------------------------
def _extract_first_json_object(text: str) -> Optional[str]:
    if not text: return None
    s = text.strip()
    if s.startswith("```"):
        lines = s.splitlines()[1:]
        if lines and lines[-1].strip().startswith("```"): lines = lines[:-1]
        s = "\n".join(lines).strip()
    if s.startswith("{") and s.endswith("}"): return s
    start = s.find("{")
    if start == -1: return None
    depth = 0
    in_str = False
    for i in range(start, len(s)):
        if s[i] == '"' and (i == 0 or s[i-1] != '\\'): in_str = not in_str
        if not in_str:
            if s[i] == "{": depth += 1
            elif s[i] == "}":
                depth -= 1
                if depth == 0: return s[start : i + 1]
    return None

def _reconstruct_signals(weather: dict, phase: str) -> dict:
    """Hardened Signal Context for the Weather UI (Reverse Card)."""
    def safe_f(val, default=0.0):
        try: return float(val) if val is not None else default
        except: return default

    pressure = safe_f(weather.get("pressure_mb"), 1013.0)
    uvi = safe_f(weather.get("uv_index"), 0.0)
    wind = safe_f(weather.get("wind_mph") or weather.get("wind_speed"), 0.0)
    vis = safe_f(weather.get("visibility"), 10000.0)
    
    return {
        # ✅ PASSTHROUGH: Required for Logic Engine specific checks
        "pressure_trend": weather.get("pressure_trend"), 
        "wind_speed": wind,
        "cloud_cover": weather.get("cloud_cover") or weather.get("sky_condition"),
        
        # Derived Booleans
        "is_falling_pressure": weather.get("pressure_trend") == "falling",
        "is_high_pressure": pressure > 1022,
        "is_high_uv": uvi > 6,
        "is_windy": wind >= 12,
        "is_winter": "winter" in str(phase).lower(),
        "is_foggy": vis < 2000,
        "is_calm": wind < 5, # Added for explicit safety
        "is_low_light": (weather.get("cloud_cover") or "").lower() in ["overcast", "rain"],
        "pressure_val": pressure,
        "uvi_val": uvi
    }

def expand_plan_color_zones(plan: Dict[str, Any], is_member: bool) -> Dict[str, Any]:
    def _apply(obj: Dict[str, Any]) -> None:
        if not isinstance(obj, dict): return
        lure = obj.get("base_lure")
        colors = obj.get("color_recommendations") or []
        if lure:
            expanded = expand_color_zones(lure, colors)
            obj["colors"] = expanded
            obj["color"] = expanded

    if is_member:
        _apply(plan.get("primary", {}))
        _apply(plan.get("secondary", {}))
    else:
        _apply(plan)
    return plan


# ----------------------------------------
# CORE: OpenAI Call (WITH HISTORY RESTORED)
# ----------------------------------------
async def call_openai_plan(
    weather: dict,
    phase: str,
    location: str,
    latitude: float,
    longitude: float,
    access_type: str = "boat",
    is_member: bool = False,
    recent_primary_lures: list[str] = None,
    recent_secondary_lures: list[str] = None,
) -> dict:
    
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("LLM_PLAN: No API key")
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    # 1. Filter Targets
    accessible_targets = filter_targets_by_access(access_type)
    accessible_target_defs = {t: TARGET_DEFINITIONS[t] for t in accessible_targets if t in TARGET_DEFINITIONS}
    variety_mode = get_variety_mode()

    # 2. Build User Input
    user_input = {
        "location": location,
        "phase": phase,
        "weather": {
            "temp_f": weather.get("temp_f"),
            "temp_high": weather.get("temp_high"),
            "temp_low": weather.get("temp_low"),
            "wind_mph": weather.get("wind_mph") or weather.get("wind_speed"),
            "cloud_cover": weather.get("cloud_cover") or weather.get("sky_condition"),
            "pressure_mb": weather.get("pressure_mb"),
            "pressure_trend": weather.get("pressure_trend"),
            "uv_index": weather.get("uv_index"),
            "moon_phase": weather.get("moon_phase"),
            "is_major_period": weather.get("is_major_period", False),
            "clarity_estimate": weather.get("clarity_estimate"),
        },
        "accessible_targets": accessible_targets,
        "target_definitions": accessible_target_defs,
        "variety_mode": variety_mode,
        "instructions": "", # Populated below
    }

    # =========================================================
    # ✅ RESTORED: VARIETY & RECENT HISTORY LOGIC
    # This prevents the LLM from suggesting the same lures repeatedly
    # =========================================================
    variety_instructions = f"VARIETY MODE: {variety_mode.upper()}\n"
    
    if recent_primary_lures or recent_secondary_lures:
        variety_instructions += "🚨 HISTORY CONSTRAINT (Avoid Repetition):\n"
        if recent_primary_lures:
             variety_instructions += f"User recently used PRIMARY: {', '.join(recent_primary_lures)}\n"
             variety_instructions += "⛔ DO NOT use these for Primary unless conditions are absolutely perfect for them.\n"
        if recent_secondary_lures:
             variety_instructions += f"User recently used SECONDARY: {', '.join(recent_secondary_lures)}\n"
             variety_instructions += "⛔ DO NOT use these for Secondary.\n"
    
    if variety_mode == "deep_cut":
        variety_instructions += "🎯 DEEP CUT MODE: Prioritize under-utilized, high-skill lures over common staples if valid.\n"
    
    # Prepend variety rules to the instructions
    user_input["instructions"] = variety_instructions + "\n" + "Be specific. Connect lure selection to pressure/UV."
    # =========================================================

    # Enhanced Weather Analysis Injection
    pressure_mb = weather.get("pressure_mb")
    pressure_trend = weather.get("pressure_trend")
    if pressure_mb and pressure_trend:
         user_input["instructions"] += f"\nBAROMETRIC PRESSURE: {pressure_mb}mb ({pressure_trend}).\n"
         if pressure_trend == "falling":
             user_input["instructions"] += "FALLING PRESSURE = AGGRESSIVE FEEDING. Power fish.\n"
         elif pressure_trend == "rising":
             user_input["instructions"] += "RISING PRESSURE = ACTIVE FEEDING. Reaction baits.\n"

    # 3. Build System Prompt
    system_prompt = build_system_prompt(include_pattern_2=True)
    
    try:
        t0 = time.time()
        async with httpx.AsyncClient(timeout=70.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": "Bearer " + api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": json.dumps(user_input, default=str)}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.6,
                },
            )

        if response.status_code != 200:
            print(f"LLM_PLAN ERROR: HTTP {response.status_code} - {response.text[:200]}")
            return None

        # 4. Parse Response
        data = response.json()
        content = data["choices"][0]["message"].get("content", "")
        extracted = _extract_first_json_object(content)
        
        if not extracted: return None
        
        plan = json.loads(extracted)
        plan["_variety_mode"] = variety_mode
        return plan

    except Exception as e:
        print(f"LLM_PLAN CRITICAL ERROR: {e}")
        traceback.print_exc()
        return None


# ----------------------------------------
# VALIDATION LOGIC
# ----------------------------------------
def validate_llm_plan(plan: Dict[str, Any], is_member: bool = False) -> Tuple[bool, List[str]]:
    """Strict validation against pools."""
    errors = []
    
    if is_member and ("primary" not in plan or "secondary" not in plan):
        return False, ["Member plan must have primary and secondary patterns"]

    def _validate_pattern(pattern, name):
        pat_errors = []
        if pattern["base_lure"] not in LURE_POOL:
            pat_errors.append(f"{name}: Invalid lure {pattern['base_lure']}")
        
        # Validate targets
        for t in pattern.get("targets", []):
            if t not in TARGET_DEFINITIONS:
                pat_errors.append(f"{name}: Invalid target {t}")
        
        # Validate colors
        colors = pattern.get("color_recommendations", [])
        valid_colors = get_color_pool_for_lure(pattern["base_lure"], pattern.get("soft_plastic"))
        for c in colors:
            if c not in valid_colors:
                pat_errors.append(f"{name}: Invalid color {c}")
        
        return pat_errors

    if is_member:
        errors.extend(_validate_pattern(plan["primary"], "primary"))
        errors.extend(_validate_pattern(plan["secondary"], "secondary"))

    return (len(errors) == 0), errors


# ----------------------------------------
# MAIN ENTRY POINT (Hybrid)
# ----------------------------------------
async def generate_llm_plan_with_retries(
    weather: dict,
    phase: str,
    location: str,
    latitude: float,
    longitude: float,
    access_type: str = "boat",
    is_member: bool = False,
    recent_primary_lures: list[str] = None,
    recent_secondary_lures: list[str] = None,
    max_attempts: int = 3,
) -> dict:
    """
    Hybrid Logic:
    1. Gets DENSE, detailed plan from OpenAI (including day_progression and history-aware variety).
    2. Injects deterministic 'weather_insights' (Reverse Card) for UI.
    3. Validates and Expands Colors.
    """
    print(f"DEBUG: Generating DENSE Hybrid Plan for {location}")
    
    # ✅ STEP A: Prepare the Weather Context (Reverse Card)
    sig_context = _reconstruct_signals(weather, phase)

    for attempt in range(max_attempts):
        plan = await call_openai_plan(
            weather, phase, location, latitude, longitude,
            access_type, is_member, recent_primary_lures, recent_secondary_lures
        )

        if not plan:
            print(f"DEBUG: Attempt {attempt+1} failed (OpenAI None)")
            continue

        try:
            # ✅ STEP B: Inject Weather Insights (The UI Logic)
            plan["weather_insights"] = generate_weather_insights(sig_context)
            
            # ✅ STEP C: Validate
            is_valid, errors = validate_llm_plan(plan, is_member)
            if not is_valid:
                print(f"DEBUG: Validation failed: {errors}")
                continue

            # ✅ STEP D: Expand Color Zones (Visuals)
            return expand_plan_color_zones(plan, is_member)

        except Exception as e:
            print(f"DEBUG: Hybrid Injection Error: {e}")
            traceback.print_exc()
            continue

    print("DEBUG: All attempts failed.")
    return None

def llm_enabled() -> bool:
    return os.getenv("LLM_PLAN_ENABLED", "").strip().lower() in ("1", "true", "yes", "on")