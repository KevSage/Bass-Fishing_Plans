# apps/api/app/services/llm_plan_service.py
"""
LLM Plan Generator with Strict Guardrails
100% LLM-driven, but ONLY chooses from canonical pools.
"""
from __future__ import annotations

import os
import json
from typing import Any, Dict, List, Optional, Tuple
import httpx
import random
import asyncio
import time

from app.canon.pools import (
    LURE_POOL,
    COLOR_POOL,  # Legacy - still used for fallback
    PRESENTATIONS,
    LURE_TO_PRESENTATION,
    TERMINAL_PLASTIC_MAP,
    TRAILER_BUCKET_BY_LURE,
    CHATTER_SWIMJIG_TRAILERS,
    SPINNER_BUZZ_TRAILERS,
    JIG_TRAILERS,
    HARDBAIT_ONLY_COLORS,
    HARDBAIT_LURES,
    expand_color_zones,
    validate_color_zones,
    # Lure-specific color pools
    get_color_pool_for_lure,
    RIG_COLORS,
    BLADED_SKIRTED_COLORS,
    SOFT_SWIMBAIT_COLORS,
    CRANKBAIT_COLORS,
    JERKBAIT_COLORS,
    TOPWATER_COLORS,
    FROG_COLORS,
    LURE_COLOR_POOL_MAP,
)
from app.canon.targets import CANONICAL_TARGETS
from app.canon.validate import (
    validate_lure_and_presentation,
    validate_colors_for_lure,
    validate_targets,
)


# ----------------------------------------
# System Prompt (LOCKED RULES)
# ----------------------------------------

def build_system_prompt(include_pattern_2: bool = False) -> str:
    """
    Lean system prompt: strict JSON, shorter text fields, canonical pools enforced.
    """

    # terminal plastics
    terminal_rules = []
    for lure, plastics in TERMINAL_PLASTIC_MAP.items():
        terminal_rules.append(f"- {lure}: {sorted(plastics)}")

    # trailer rules (keep concise)
    trailer_rules = [
        "REQUIRED:",
        f"- chatterbait, swim jig: {CHATTER_SWIMJIG_TRAILERS}",
        f"- casting jig, football jig: {JIG_TRAILERS}",
        "OPTIONAL:",
        f"- spinnerbait, buzzbait: {SPINNER_BUZZ_TRAILERS}",
    ]

    # compact dumps (save tokens)
    def jdump(obj) -> str:
        return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))

    if include_pattern_2:
        output_format = """

If the chosen base_lure is terminal tackle, invert: set trailer: null and use soft_plastic.
        
RETURN JSON ONLY:
{
  "primary":{
    "presentation":"<from PRESENTATIONS>",
    "base_lure":"<from LURE_POOL>",
    "soft_plastic":null | "<allowed>",
    "soft_plastic_why":null | "< 2 sentences>",
    "trailer":"<ONLY if lure uses trailer>",
    "trailer_why": "<ONLY if trailer used>"",
    "color_recommendations":["<color1>","<color2?>"],
    "targets":["<target>","<target>","<target>"],
    "why_this_works":"<4-5 sentences total. MUST include: Choose X if Y. Choose X if Y.>",
    "pattern_summary":"4 sentences>",
    "strategy":" 3-4 sentences>",
    "work_it":["<3 items>"],
    "work_it_cards":[{"name":"<target>","definition":" 2 sentences>","how_to_fish":"3-4 sentences>"}, "3 total cards based on preselected targets"],
  },
  "secondary":{
    "presentation":"<different from primary>",
    "base_lure":"<from LURE_POOL>",
    "soft_plastic":null | "<allowed>",
    "soft_plastic_why":null | "2 sentences>",
    "trailer":"<ONLY if lure uses trailer>",
    "trailer_why": "<ONLY if trailer used>",
    "color_recommendations":["<color1>","<color2?>"],
    "targets":["<target>","<target>","<target>"],
    "why_this_works":"4-5 sentences total. MUST include: Choose X if Y. Choose X if Y.>",
    "pattern_summary":"4 sentences>",
    "strategy":"3-4 sentences>",
    "work_it":["<3 items>"],
    "work_it_cards":[{"name":"<target>","definition":" 2 sentences>","how_to_fish":"3-4 sentences>"}, "3 total cards based on preselected targets"],
  },
  "day_progression":[
    "Morning: 3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize",
    "Midday: 3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize>",
    "Evening: 3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize>"
  ],
  "outlook_blurb":"3-4 sentences of weather, condition and phase related analysis and how it may effect bass activity. No exact numbers or strategy>"
}
"""
    else:
        output_format = """
RETURN JSON ONLY:
{
  "presentation":"<from PRESENTATIONS>",
  "base_lure":"<from LURE_POOL>",
  "soft_plastic":null | "<allowed>",
  "soft_plastic_why":null | "2 sentences>",
  "trailer":"<ONLY if lure uses trailer>",
  "trailer_why": "<ONLY if trailer used>",
  "color_recommendations":["<color1>","<color2?>"],
  "targets":["<target>","<target>","<target>"],
  "why_this_works":"4-5 sentences total. MUST include: Choose X if Y. Choose X if Y.>",
  "pattern_summary":"4 sentences>",
  "strategy":" 3-4 sentences>",
  "work_it":["<3 items>"],
  "work_it_cards":[{"name":"<target>","definition":" 2 sentences>","how_to_fish":"3-4 sentences>"}, "3 total cards based on preselected targets"],
  "day_progression":[
    "Morning: 3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize",
    "Midday: 3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize>",
    "Evening: 3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize>"
  ],
  "outlook_blurb":"3-4 sentences of weather, condition and phase related analysis and how it may effect bass activity. No exact numbers or strategy>"
}
"""

    return f"""You are BassFishingPlans (BFP), an expert bass fishing guide.

CRITICAL: Return a SINGLE JSON OBJECT only. No markdown. No extra keys. No "combo_a"/"combo_b".

HARD RULES (validator enforced):
- Add a space after every period. "word. Word" not "word.Word"
- No specific depths in feet for water depth (e.g., "in 10 feet of water").
- outlook_blurb: weather-only, no exact numbers (no "55°F", no "8 mph"), no fishing strategy.
- day_progression: exactly 3 lines (Morning/Midday/Evening). No colors mentioned.
- Present in a conversational tone. Do not get overly technical, but also respect the intelligence of the user.

PRESENTATIONS: {jdump(PRESENTATIONS)}
LURES: {jdump(LURE_POOL)}
LURE_TO_PRESENTATION: {jdump(LURE_TO_PRESENTATION)}
CANONICAL_TARGETS: {jdump(CANONICAL_TARGETS)}

COLOR POOLS (must use the correct pool for chosen lure):
RIG_COLORS: {jdump(RIG_COLORS)}
BLADED_SKIRTED_COLORS: {jdump(BLADED_SKIRTED_COLORS)}
SOFT_SWIMBAIT_COLORS: {jdump(SOFT_SWIMBAIT_COLORS)}
CRANKBAIT_COLORS: {jdump(CRANKBAIT_COLORS)}
JERKBAIT_COLORS: {jdump(JERKBAIT_COLORS)}
TOPWATER_COLORS: {jdump(TOPWATER_COLORS)}
FROG_COLORS: {jdump(FROG_COLORS)}

COLOR VARIETY:
- If you provide 2 colors, make them meaningfully different (not two near-identical greens, not shad+ghost shad, etc.).

TERMINAL TACKLE:
- If base_lure is terminal tackle, you MUST set soft_plastic and soft_plastic_why.
Allowed plastics:
{chr(10).join(terminal_rules)}

TRAILERS:
- If base_lure needs a trailer, you MUST set trailer and trailer_why.
Allowed trailers:
{chr(10).join(trailer_rules)}

✅ CRITICAL FIELD-USAGE RULE (must be impossible to miss)
Terminal tackle (texas rig, carolina rig, dropshot, neko rig, wacky rig, ned rig, shaky head):
✅ uses soft_plastic
❌ must set trailer: null
Jig / skirted / bladed (football jig, casting jig, swim jig, chatterbait, spinnerbait, buzzbait):
✅ uses trailer (required/optional per lure)
❌ must set soft_plastic: null
If you violate this, the plan is rejected.


MEMBER PLANS (if include_pattern_2): primary + secondary MUST have different presentations.
Secondary is a complement: it should target bass differently than primary (not just a minor swap).

{output_format}
"""




# ----------------------------------------
# LLM Caller
# ----------------------------------------

def _normalize_llm_output(
    raw: Dict[str, Any],
    *,
    is_member: bool,
    combo_a_weight: float = 0.80,      # 80/20
    preview_alt_color_weight: float = 0.15,  # ~15% swap
) -> Dict[str, Any]:
    """
    Normalize new LLM formats back into the legacy API contract expected by
    validate_llm_plan() and the frontend.

    - Members: accept either {primary, secondary, ...} OR {combo_a, combo_b, ...}
      and return ONLY the chosen combo as {primary, secondary, ...}.
    - Previews: accept either flat legacy OR optional color_recommendations_alt;
      occasionally swap colors for variety.
    """
    if not isinstance(raw, dict):
        return raw

    # -------------------------
    # MEMBER: combo_a/combo_b -> primary/secondary
    # -------------------------
    if is_member:
        # If already normalized, do nothing.
        if "primary" in raw and "secondary" in raw:
            return raw

        if "combo_a" in raw and "combo_b" in raw:
            chosen_key = "combo_a" if random.random() < combo_a_weight else "combo_b"
            chosen = raw.get(chosen_key, {}) or {}

            # Chosen combo MUST contain primary/secondary blocks
            primary = chosen.get("primary")
            secondary = chosen.get("secondary")

            # Build normalized member plan
            normalized = {
                "primary": primary,
                "secondary": secondary,
                "day_progression": raw.get("day_progression", []),
                "outlook_blurb": raw.get("outlook_blurb", ""),
            }

            # Pass through optional shared fields if you ever add them later
            for k in ("notes", "debug"):
                if k in raw:
                    normalized[k] = raw[k]

            return normalized

        # Unknown member shape; return as-is (validator will fail loudly)
        return raw

    # -------------------------
    # PREVIEW: optional alt colors
    # -------------------------
    # If prompt returns a wrapper, normalize it here (optional; safe no-op if absent)
    # Example accepted: {"plan": { ...flat... }}
    if "plan" in raw and isinstance(raw["plan"], dict):
        raw = raw["plan"]

    # Occasionally swap in alt color pair if present
    alt = raw.get("color_recommendations_alt")
    if (
        alt
        and isinstance(alt, list)
        and 1 <= len(alt) <= 2
        and random.random() < preview_alt_color_weight
    ):
        # Only swap if it won't obviously violate your validator later.
        # (Full validation still happens after this.)
        raw["color_recommendations"] = alt

    # Never leak the alt field to downstream consumers
    if "color_recommendations_alt" in raw:
        raw.pop("color_recommendations_alt", None)

    return raw

def extract_json_object(text: str) -> str:
    text = text.strip()

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in LLM output")

    return text[start:end + 1]


def _extract_first_json_object(text: str) -> Optional[str]:
    if not text:
        return None
    s = text.strip()

    # strip code fences
    if s.startswith("```"):
        lines = s.splitlines()
        # drop first fence line
        lines = lines[1:]
        # drop last fence if present
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        s = "\n".join(lines).strip()

    # fast path
    if s.startswith("{") and s.endswith("}"):
        return s

    # find first balanced object
    start = s.find("{")
    if start == -1:
        return None

    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(s)):
        ch = s[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return s[start : i + 1]
    return None

async def call_openai_plan(
    weather: Dict[str, Any],
    location: str,
    trip_date: str,
    phase: str,
    is_member: bool = False,
) -> Optional[Dict[str, Any]]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("LLM_PLAN: No API key")
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    # 80/20 variety without memory:
    # 80% = "best", 20% = "alternate" (still must be good + valid)
    variety_bias = "best" if random.random() < 0.8 else "alternate"

    # trip_date is irrelevant now — keep signature, omit from payload to reduce tokens
    user_input = {
        "location": location,
        "phase": phase,
        "variety_bias": variety_bias,
        "weather": {
            "temp_f": weather.get("temp_f"),
            "temp_high": weather.get("temp_high"),
            "temp_low": weather.get("temp_low"),
            "wind_mph": weather.get("wind_mph") or weather.get("wind_speed"),
            "cloud_cover": weather.get("cloud_cover") or weather.get("sky_condition"),
            "clarity_estimate": weather.get("clarity_estimate"),
        },
        "instructions": (
            "If variety_bias=best: choose the best primary + best complement secondary. "
            "If variety_bias=alternate: choose a strong second-best primary + best complement secondary. "
            "Do NOT output multiple combos."
        ),
    }

    system_prompt = build_system_prompt(include_pattern_2=is_member)

    max_tokens = 1700 if is_member else 1100

    try:
        t0 = time.time()
        async with httpx.AsyncClient(timeout=70.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": json.dumps(user_input, ensure_ascii=False)},
                    ],
                    # key fix: force JSON object output
                    "response_format": {"type": "json_object"},
                    # keep it calmer for schema compliance, variety comes from variety_bias
                    "temperature": 0.3,
                    "max_completion_tokens": max_tokens,
                },
            )

        dt = time.time() - t0
        print(f"LLM_PLAN: OpenAI call took {dt:.2f}s (bias={variety_bias})")

        if response.status_code != 200:
            print(f"LLM_PLAN: HTTP {response.status_code}")
            print(f"LLM_PLAN BODY: {response.text[:800]}")
            return None

        data = response.json()
        if "choices" not in data or not data["choices"]:
            print(f"LLM_PLAN ERROR: No choices in response")
            return None

        content = data["choices"][0]["message"].get("content", "")
        if not content or not content.strip():
            print("LLM_PLAN ERROR: Empty content from OpenAI")
            return None

        extracted = _extract_first_json_object(content)
        if not extracted:
            print("LLM_PLAN ERROR: Could not extract JSON object")
            print(f"LLM_PLAN: Content preview: {content[:400]}")
            return None

        try:
            plan = json.loads(extracted)
        except json.JSONDecodeError as e:
            print("LLM_PLAN ERROR: JSONDecodeError after extraction")
            print(f"LLM_PLAN JSON ERROR: {repr(e)}")
            print(f"LLM_PLAN: Extracted preview: {extracted[:500]}")
            return None

        return plan

    except Exception as e:
        print(f"LLM_PLAN ERROR: {type(e).__name__} {repr(e)}")
        return None





# ----------------------------------------
# Validation
# ----------------------------------------
def validate_llm_plan(plan: Dict[str, Any], is_member: bool = False) -> Tuple[bool, List[str]]:
    """
    Validate LLM output against canonical rules.
    Returns (is_valid, list_of_errors)
    
    Args:
        plan: LLM output to validate
        is_member: If True, expects primary + secondary patterns
    """
    import re
    
    errors = []
    
    # Determine which structure to expect
    if is_member:
        # Member plans have primary + secondary + shared fields
        if "primary" not in plan or "secondary" not in plan:
            errors.append("Member plan must have 'primary' and 'secondary' patterns")
            return False, errors
        
        # Validate both patterns
        primary_errors = _validate_pattern(plan["primary"], "primary")
        secondary_errors = _validate_pattern(plan["secondary"], "secondary")
        errors.extend(primary_errors)
        errors.extend(secondary_errors)
        
        # Validate presentations are different
        if plan.get("primary", {}).get("presentation") == plan.get("secondary", {}).get("presentation"):
            errors.append("Primary and secondary must have DIFFERENT presentations")
        
        # Validate shared fields
        shared_required = ["day_progression", "outlook_blurb"]
        for field in shared_required:
            if field not in plan:
                errors.append(f"Missing required shared field: {field}")
    else:
        # Preview plans have flat structure
        required = ["presentation", "base_lure", "color_recommendations", "targets", 
                   "why_this_works", "work_it", "day_progression", "outlook_blurb"]
        for field in required:
            if field not in plan:
                errors.append(f"Missing required field: {field}")
        
        if not errors:
            pattern_errors = _validate_pattern(plan, "plan")
            errors.extend(pattern_errors)
    
    # Validate day progression (shared for both member and preview)
    day_prog = plan.get("day_progression", [])
    if not isinstance(day_prog, list) or len(day_prog) != 3:
        errors.append(f"day_progression must have exactly 3 lines, got {len(day_prog) if isinstance(day_prog, list) else 'not a list'}")
    else:
        # Check each time block - third one can be either "Evening:" or "Late:"
        for i, line in enumerate(day_prog):
            if i == 0 and not line.startswith("Morning:"):
                errors.append(f"day_progression line 0 must start with 'Morning:'")
            elif i == 1 and not line.startswith("Midday:"):
                errors.append(f"day_progression line 1 must start with 'Midday:'")
            elif i == 2 and not (line.startswith("Evening:") or line.startswith("Late:")):
                errors.append(f"day_progression line 2 must start with 'Evening:' or 'Late:'")
            # Check for colors (shouldn't have parentheses or color names)
            if "(" in line or ") in " in line.lower():
                errors.append(f"day_progression line {i} contains color (not allowed)")
    
    # Validate outlook blurb
    outlook = plan.get("outlook_blurb", "")
    if not outlook or len(outlook.strip()) < 20:
        errors.append("outlook_blurb is too short (need 2-3 sentences)")
    
    # Check for exact temp/wind mentions in outlook (not allowed)
    temp_pattern = r'\d+\s*°?F'
    wind_pattern = r'\d+\s*mph'
    if re.search(temp_pattern, outlook):
        errors.append("outlook_blurb contains exact temperature (use descriptive language instead)")
    if re.search(wind_pattern, outlook):
        errors.append("outlook_blurb contains exact wind speed (use descriptive language instead)")
    
    # Check for depth mentions (but allow retrieve distance like "drag 2-3 feet")
    # Block: "in 10 feet of water", "fish 6 feet deep", "target 15-foot depths"
    # Allow: "drag 2-3 feet", "hop 3 feet", "swim 5 feet"
    depth_pattern = r'(?<!drag\s)(?<!hop\s)(?<!swim\s)(?<!move\s)(?<!pull\s)\d+[-–]?\d*\s*[-–]?\s*(feet|ft|foot)\s+(of\s+water|deep|depth|down)'
    all_text_fields = []
    
    if is_member:
        all_text_fields.extend([
            plan.get("outlook_blurb", ""),
            plan.get("primary", {}).get("why_this_works", ""),
            " ".join(plan.get("primary", {}).get("work_it", [])),
            plan.get("secondary", {}).get("why_this_works", ""),
            " ".join(plan.get("secondary", {}).get("work_it", [])),
            " ".join(plan.get("day_progression", [])),
        ])
    else:
        all_text_fields.extend([
            plan.get("outlook_blurb", ""),
            plan.get("why_this_works", ""),
            " ".join(plan.get("work_it", [])),
            " ".join(plan.get("day_progression", [])),
        ])
    
    for text in all_text_fields:
        if re.search(depth_pattern, str(text), re.IGNORECASE):
            errors.append(f"Plan contains specific depth mention (not allowed): {re.search(depth_pattern, str(text), re.IGNORECASE).group()}")
            break  # Only report once
    
    return len(errors) == 0, errors


def _validate_pattern(pattern: Dict[str, Any], pattern_name: str) -> List[str]:
    """Validate a single pattern (primary or secondary)"""
    errors = []
    
    # Required fields
    required = ["presentation", "base_lure", "color_recommendations", "targets", "why_this_works", "work_it"]
    for field in required:
        if field not in pattern:
            errors.append(f"{pattern_name}: Missing required field: {field}")
    
    if errors:
        return errors
    
    # Validate presentation
    if pattern["presentation"] not in PRESENTATIONS:
        errors.append(f"{pattern_name}: Invalid presentation: {pattern['presentation']}")
    
    # Validate lure
    base_lure = pattern["base_lure"]
    if base_lure not in LURE_POOL:
        errors.append(f"{pattern_name}: Invalid base_lure: {base_lure}")
    
    # Validate lure matches presentation
    lure_errs = validate_lure_and_presentation(base_lure, pattern["presentation"])
    errors.extend([f"{pattern_name}: {err}" for err in lure_errs])
    
    # Validate colors
    colors = pattern["color_recommendations"]
    if not isinstance(colors, list) or not (1 <= len(colors) <= 2):
        errors.append(f"{pattern_name}: color_recommendations must be 1-2 colors, got {len(colors) if isinstance(colors, list) else 'not a list'}")
    else:
        # Get the correct color pool for this lure
        soft_plastic = pattern.get("soft_plastic", None)
        valid_colors = get_color_pool_for_lure(base_lure, soft_plastic)
        
        for color in colors:
            if color not in valid_colors:
                errors.append(f"{pattern_name}: Invalid color '{color}' for {base_lure}. Allowed colors: {valid_colors}")
        
        # Additional validation for lure/color compatibility (hardbaits, etc.)
        color_errs = validate_colors_for_lure(base_lure, colors, soft_plastic)
        errors.extend([f"{pattern_name}: {err}" for err in color_errs])
    
    # Validate targets
    targets = pattern["targets"]
    target_errs = validate_targets(targets)
    errors.extend([f"{pattern_name}: {err}" for err in target_errs])
    
    # Validate soft_plastic if present
    if "soft_plastic" in pattern and pattern["soft_plastic"]:
        if base_lure in TERMINAL_PLASTIC_MAP:
            allowed_plastics = TERMINAL_PLASTIC_MAP[base_lure]
            if pattern["soft_plastic"] not in allowed_plastics:
                errors.append(f"{pattern_name}: soft_plastic '{pattern['soft_plastic']}' not allowed for {base_lure}. Allowed: {allowed_plastics}")
        else:
            errors.append(f"{pattern_name}: {base_lure} does not use soft_plastic field")
    
    # Validate trailer if present
    if "trailer" in pattern and pattern["trailer"]:
        if base_lure in TRAILER_BUCKET_BY_LURE:
            bucket_name = TRAILER_BUCKET_BY_LURE[base_lure]
            # Resolve bucket name to actual list
            if bucket_name == "JIG_TRAILERS":
                allowed_trailers = JIG_TRAILERS
            elif bucket_name == "CHATTER_SWIMJIG_TRAILERS":
                allowed_trailers = CHATTER_SWIMJIG_TRAILERS
            elif bucket_name == "SPINNER_BUZZ_TRAILERS":
                allowed_trailers = SPINNER_BUZZ_TRAILERS
            else:
                errors.append(f"{pattern_name}: Unknown trailer bucket '{bucket_name}'")
                allowed_trailers = []
            
            if pattern["trailer"] not in allowed_trailers:
                errors.append(f"{pattern_name}: trailer '{pattern['trailer']}' not allowed for {base_lure}. Allowed: {allowed_trailers}")
        else:
            errors.append(f"{pattern_name}: {base_lure} does not use trailer field")
    
    # Validate work_it mentions valid plastics/trailers (legacy check)
    work_it = pattern.get("work_it", [])
    if isinstance(work_it, list):
        work_it_text = " ".join(work_it).lower()
        
        # Check if terminal tackle mentions invalid plastics
        if base_lure in TERMINAL_PLASTIC_MAP:
            allowed_plastics = TERMINAL_PLASTIC_MAP[base_lure]
            # Check for invalid plastics (simple check - could be more sophisticated)
            all_plastics = set()
            for plastics in TERMINAL_PLASTIC_MAP.values():
                all_plastics.update(plastics)
            
            for plastic in all_plastics:
                if plastic.lower() in work_it_text and plastic not in allowed_plastics:
                    errors.append(f"{pattern_name}: work_it mentions '{plastic}' but that's not valid for {base_lure}")
    
    return errors



# ----------------------------------------
# Public API
# ----------------------------------------
async def generate_llm_plan_with_retries(
    weather: Dict[str, Any],
    location: str,
    trip_date: str,
    phase: str,
    is_member: bool = False,
    max_retries: int = 2,
) -> Optional[Dict[str, Any]]:
    """
    Generate LLM plan with validation and retries.
    Returns validated plan with expanded color zones or None.
    
    Args:
        weather: Weather data
        location: Location name
        trip_date: Date string
        phase: Bass phase
        is_member: If True, generates Pattern 1 + Pattern 2
        max_retries: Number of retry attempts
    """
    for attempt in range(max_retries):
        plan = await call_openai_plan(weather, location, trip_date, phase, is_member=is_member)
        
        if not plan:
            await asyncio.sleep(0.75 * (attempt + 1))
            print(f"LLM_PLAN: Attempt {attempt + 1} failed (no response)")
            continue
        
        is_valid, errors = validate_llm_plan(plan, is_member=is_member)
        
        if is_valid:
            print(f"LLM_PLAN: Success on attempt {attempt + 1}")
            
            # Expand color zones for frontend
            try:
                plan = expand_plan_color_zones(plan, is_member=is_member)
            except Exception as e:
                print(f"LLM_PLAN: Color zone expansion failed: {e}")
                continue
            
            return plan
        else:
            print(f"LLM_PLAN: Attempt {attempt + 1} validation failed:")
            for err in errors[:5]:  # Print first 5 errors
                print(f"  - {err}")
    
    print("LLM_PLAN: All attempts failed")
    return None


def expand_plan_color_zones(plan: Dict[str, Any], is_member: bool) -> Dict[str, Any]:
    """
    Expand LLM color arrays into full zone payloads.
    
    LLM returns: ["chartreuse/white", "white"]
    This expands to: {primary_color, secondary_color, accent_color, asset_key}
    
    Args:
        plan: Validated LLM plan
        is_member: Whether this is a member plan (dual patterns)
    
    Returns:
        Plan with expanded color zones
    """
    if is_member:
        # Expand both patterns
        if "primary" in plan:
            lure = plan["primary"]["base_lure"]
            colors = plan["primary"]["color_recommendations"]
            plan["primary"]["colors"] = expand_color_zones(lure, colors)
        
        if "secondary" in plan:
            lure = plan["secondary"]["base_lure"]
            colors = plan["secondary"]["color_recommendations"]
            plan["secondary"]["colors"] = expand_color_zones(lure, colors)
    else:
        # Expand single pattern
        lure = plan["base_lure"]
        colors = plan["color_recommendations"]
        plan["colors"] = expand_color_zones(lure, colors)
    
    return plan


def llm_enabled() -> bool:
    """Check if LLM plan generation is enabled"""
    return os.getenv("LLM_PLAN_ENABLED", "").strip().lower() in ("1", "true", "yes", "on")