

# apps/api/app/services/llm_plan_service.py
"""
LLM Plan Generator with Strict Guardrails
100% LLM-driven, but ONLY chooses from canonical pools.

Bass Clarity updates (LOCKED):
- ALWAYS dump pools into the system prompt (deterministic selection from canonical lists)
- ALWAYS return primary + secondary for member plans
- NO dynamic lure color zones / NO expand_color_zones / NO "colors: {primary_color,...}" payloads
- Color recommendations are ONLY simple strings from the lure-specific color pools in pools.py
- Never state what bass ARE doing; suggest what they MAY be doing
"""
from __future__ import annotations

import os
import json
import time
import random
import asyncio
from typing import Any, Dict, List, Optional, Tuple

import httpx

from app.canon.pools import (
    # core pools
    LURE_POOL,
    PRESENTATIONS,
    LURE_TO_PRESENTATION,
    # terminal + trailer pools
    TERMINAL_PLASTIC_MAP,
    TRAILER_BUCKET_BY_LURE,
    CHATTER_SWIMJIG_TRAILERS,
    SPINNER_BUZZ_TRAILERS,
    JIG_TRAILERS,
    # lure-specific color pools (ONLY colors allowed)
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
from app.canon.target_definitions import TARGET_DEFINITIONS
from app.canon.validate import (
    validate_lure_and_presentation,
    validate_colors_for_lure,
)
from app.render.retrieve_rules import LURE_TIP_BANK


# ----------------------------------------
# System Prompt (LOCKED RULES) — Bass Clarity
# ----------------------------------------
def build_system_prompt(include_pattern_2: bool = False) -> str:
    """
    Bass Clarity system prompt:
    - strict JSON
    - canonical pools dumped into prompt (deterministic selection)
    - Members return primary + secondary (complement/pivot)
    - NO dynamic lure color zones; colors are simple strings from pools only
    """

    # ---------- deterministic, set-safe JSON dumping ----------
    def _json_default(o: Any):
        # sets appear in canon pools; convert deterministically
        if isinstance(o, set):
            return sorted(list(o))
        # tuples also appear sometimes
        if isinstance(o, tuple):
            return list(o)
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
        # plastics may be set; sort for stable prompt output
        terminal_rules.append(f"- {lure}: {sorted(list(plastics))}")

    # ---------- trailer rules (human-readable list) ----------
    trailer_rules = [
        "REQUIRED:",
        f"- chatterbait, swim jig: {sorted(list(CHATTER_SWIMJIG_TRAILERS))}",
        f"- casting jig, football jig: {sorted(list(JIG_TRAILERS))}",
        "OPTIONAL:",
        f"- spinnerbait, buzzbait: {sorted(list(SPINNER_BUZZ_TRAILERS))}",
    ]

    # ---------- output format ----------
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
      {"name":"<Target 1>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 2>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 3>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"}
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

    "why_this_works":"2-3 sentences total. MUST reference primary and explain the pivot assumption (different presentation family). Include Choose A if... Choose B if... color guidance.",
    "pattern_summary":"2-3 sentences. Suggestive language only.",
    "strategy":"2-3 sentences. Practical pivot, no hype.",

    "work_it":[
      "<Target 1>: <specific cadence using LURE_TIP_BANK>",
      "<Target 2>: <specific cadence using LURE_TIP_BANK>",
      "<Target 3>: <specific cadence using LURE_TIP_BANK>"
    ],

    "work_it_cards":[
      {"name":"<Target 1>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 2>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 3>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"}
    ]
  },

  "day_progression":[
    "Morning: 2-3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize",
    "Midday: 2-3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize>",
    "Evening: 2-3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize>"
  ],

  "outlook_blurb":"3 sentences of weather, condition and phase related analysis and how it may effect bass activity. No exact numbers or strategy>"
}
"""
    else:
        # kept for compatibility; Bass Clarity can still generate a single pattern if needed
        output_format = r"""
RETURN JSON ONLY:
{
  "presentation":"<from PRESENTATIONS>",
  "base_lure":"<from LURE_POOL>",

  "soft_plastic": null | "<ONLY for terminal tackle rigs; MUST be null for any jig/skirted/bladed>",
  "soft_plastic_why": null | "<1-2 sentences>",

  "trailer": null | "<ONLY if lure uses a trailer; MUST be null for terminal tackle>",
  "trailer_why": null | "<1 sentence only if trailer used>",

  "color_recommendations":["<COLOR_CLEAR_OR_AVG>","<COLOR_STAINED_OR_MUDDY>"],

  "targets":["<target>","<target>","<target>"],

  "why_this_works":"2-3 sentences total. MUST explain why THIS lure + presentation fits phase/conditions AND include Choose A if... Choose B if... color guidance.",
  "pattern_summary":"2-3 sentences. Suggestive language only (may/might/can/suggests).",
  "strategy":"2-3 sentences. Practical, calm, no hype.",

  "work_it":[
    "<Target 1>: <specific cadence using LURE_TIP_BANK>",
    "<Target 2>: <specific cadence using LURE_TIP_BANK>",
    "<Target 3>: <specific cadence using LURE_TIP_BANK>"
  ],

  "work_it_cards":[
    {"name":"<Target 1>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
    {"name":"<Target 2>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
    {"name":"<Target 3>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"}
  ],

  "day_progression":[
    "Morning: 2-3 sentences. Where+why + tactical adjustment. No colors. No exact numbers.",
    "Midday: 2-3 sentences. Where+why + tactical adjustment. No colors. No exact numbers.",
    "Evening: 2-3 sentences. Where+why + tactical adjustment. No colors. No exact numbers."
  ],

  "outlook_blurb":"2-3 sentences of weather/phase context only. No exact numbers. No fishing strategy."
}
"""

    return f"""You are Bass Clarity, an expert bass fishing guide.

CRITICAL: Return a SINGLE JSON OBJECT only. No markdown. No extra keys. No wrapper objects.

AUTHORITY / LANGUAGE (LOCKED):
- Never state certainty about fish behavior. Use: may, might, can, suggests, tends to.
- Do NOT say what bass ARE doing; suggest what they MAY be doing.

NO RANKINGS (LOCKED):
- Targets, presentations, and lures do not have inherent ranks.
- Determine the best strategy conditionally based on the provided phase + conditions.
- Variety is intentional (freedom within structure), never random.

ANALYSIS ORDER (NON-NEGOTIABLE):
Season/Phase → Current Conditions → Targets → Presentation Family → Lure → Retrieves

SECONDARY PATTERN (COMPLEMENT / PIVOT):
Secondary is not a backup lure. It assumes the initial read may be slightly off and attacks bass a different way.
- MUST use a different presentation family than primary
- May change targets or fish the same targets differently
- MUST reference primary in why_this_works and explain the pivot assumption

HARD RULES (validator enforced):
- Add a space after every period. "word. Word" not "word.Word"
- No specific depths in feet for water depth (e.g., "in 10 feet of water").
- outlook_blurb: weather/phase only, no exact numbers (no "55°F", no "8 mph"), no fishing strategy.
- day_progression: exactly 3 lines (Morning/Midday/Evening or Late). No colors.
- Use natural capitalization (not ALL CAPS).

TARGETS (LOCKED):
- targets must be exactly 3 items
- Each target MUST be one of TARGET_DEFINITIONS keys (no invention, no paraphrase).
- Each targets[i] MUST be an exact key from TARGET_DEFINITIONS (match spelling and spacing).

WORK_IT_CARDS (STRICT)
- You MUST generate exactly 3 cards.
- For each card index i:
- work_it_cards[i].name MUST equal targets[i] exactly (same string).
- work_it_cards[i].definition MUST equal the value from the dictionary:
- definition = TARGET_DEFINITIONS[targets[i]]
- definition is never the target label; it is the full definition text stored in TARGET_DEFINITIONS.
Example
If targets[0] = "grass edges" then:
work_it_cards[0].name = "grass edges"
work_it_cards[0].definition = TARGET_DEFINITIONS["grass edges"] (the full definition sentence)

COLOR SYSTEM (LOCKED):
- You do not know real-time water clarity. Always output exactly TWO colors:
  1) Clear-to-average clarity option
  2) Stained-to-muddy clarity option
- Colors MUST come from the correct lure-specific color pool for the chosen base_lure.
- In why_this_works, you MUST explain colors in “Choose A if… Choose B if…” format.
- Light penetration `can modify which color you pick within each clarity lane:
  bright = subtler/cleaner; cloudy/low light = more visible/stronger contrast.
- Do NOT output any other color structure (no zones, no asset keys, no nested color objects).


WHERE & HOW
   - 3 tactical steps combining target + specific retrieve cadence
   - Each step should reference a target and explain HOW to fish it with THIS lure
   - Use specific retrieve instructions (Locate lure specific retrieves from LURE TIP BANK)
   - Use natural capitalization (not ALL CAPS)

WHY THIS WORKS:
   - ONLY explain why THIS SPECIFIC LURE was chosen for these conditions
   - Focus on: lure characteristics, presentation style
   - MUST include color explanation using "Choose X if Y" format:
     * "Choose [Color 1] if [conditions] — [bass behavior/why it works]. Choose [Color 2] if [conditions] — [bass behavior/why it works]."
     * Example: "Choose sexy shad if fishing clear to slightly stained water—realistic shad pattern triggers strikes from bass feeding on natural baitfish. Choose chartreuse/black back if your water is stained or muddy—high visibility chartreuse creates strong contrast bass can see from distance."
   - Add ONE sentence about soft plastic/trailer color choice if applicable.
   - Length: 2-3 sentences total (lure choice + color explanation + optional trailer color)

DAY PROGRESSION (EXTENDED FORMAT):
   - Exactly 3 time blocks: Morning / Midday / Evening (or Late)
   - Length: 2 sentences PER time block (not just 1 sentence)
   - Each time block MUST start with "Morning:", "Midday:", or "Evening:" (or "Late:")
   - NO colors in day progression (no parentheses, no "in green pumpkin")
   
   Each time block should cover:
   - Where + Why: Location/target type and bass behavior at this time
   - How: Tactical adjustment specific to this time period
   - Key insight: What to expect or prioritize. Reference which technique to use and when. Suggest when to switch from one presentation to another based on weather forecast and conditions. 


TERMINAL TACKLE:
- If base_lure is terminal tackle, you MUST set soft_plastic and soft_plastic_why.
Allowed plastics:
{chr(10).join(terminal_rules)}

If base_lure is dropshot, you MUST output soft_plastic and it must be one of the allowed dropshot plastics.
“If you choose dropshot and soft_plastic is null/missing → response is rejected.”
DROPSHOT SPECIAL CASE (STRICT):
- If base_lure is "dropshot", you MUST set:
  - presentation: "Hovering / Mid-Column Finesse"
  - soft_plastic: REQUIRED and must be exactly ONE of:
    • "finesse worm"
    • "small minnow"
- Dropshot colors depend on soft_plastic:
  - If soft_plastic == "finesse worm": choose colors ONLY from RIG_COLORS
  - If soft_plastic == "small minnow": choose colors ONLY from SOFT_SWIMBAIT_COLORS
- Never use JERKBAIT_COLORS for dropshot.
- Never omit soft_plastic for dropshot. Null/blank soft_plastic = invalid plan.

TRAILERS:
- If base_lure uses a trailer, you MUST set trailer and trailer_why.
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

CANONICAL POOLS (MUST USE EXACT VALUES — NO INVENTION):
PRESENTATIONS: {jdump(PRESENTATIONS)}
LURES: {jdump(LURE_POOL)}
LURE_TO_PRESENTATION: {jdump(LURE_TO_PRESENTATION)}

COLOR POOL MAP (choose the correct pool for the selected base_lure):
LURE_COLOR_POOL_MAP: {jdump(LURE_COLOR_POOL_MAP)}

COLOR POOLS (colors MUST come from the correct pool):
RIG_COLORS: {jdump(RIG_COLORS)}
BLADED_SKIRTED_COLORS: {jdump(BLADED_SKIRTED_COLORS)}
SOFT_SWIMBAIT_COLORS: {jdump(SOFT_SWIMBAIT_COLORS)}
CRANKBAIT_COLORS: {jdump(CRANKBAIT_COLORS)}
JERKBAIT_COLORS: {jdump(JERKBAIT_COLORS)}
TOPWATER_COLORS: {jdump(TOPWATER_COLORS)}
FROG_COLORS: {jdump(FROG_COLORS)}

LURE_TIP_BANK: {jdump(LURE_TIP_BANK)}
TARGET_DEFINITIONS: {jdump(TARGET_DEFINITIONS)}

{output_format}
"""


# ----------------------------------------
# LLM Caller
# ----------------------------------------
def _extract_first_json_object(text: str) -> Optional[str]:
    if not text:
        return None
    s = text.strip()

    # strip code fences if present
    if s.startswith("```"):
        lines = s.splitlines()
        lines = lines[1:]
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



# def expand_plan_color_zones(plan: Dict[str, Any], is_member: bool) -> Dict[str, Any]:
#     """
#     Expand LLM color arrays into the frontend-ready payload.
#     Adds `color.asset_key` so PatternCard can render images.
#     """
#     if is_member:
#         if "primary" in plan and isinstance(plan["primary"], dict):
#             lure = plan["primary"].get("base_lure")
#             colors = plan["primary"].get("color_recommendations", [])
#             plan["primary"]["color"] = expand_color_zones(lure, colors)

#         if "secondary" in plan and isinstance(plan["secondary"], dict):
#             lure = plan["secondary"].get("base_lure")
#             colors = plan["secondary"].get("color_recommendations", [])
#             plan["secondary"]["color"] = expand_color_zones(lure, colors)
#     else:
#         lure = plan.get("base_lure")
#         colors = plan.get("color_recommendations", [])
#         plan["color"] = expand_color_zones(lure, colors)

#     return plan

def expand_plan_color_zones(plan: Dict[str, Any], is_member: bool) -> Dict[str, Any]:
    """
    Expand LLM color arrays into the frontend-ready payload.

    Contract (frontend expects):
      - non-member: plan["colors"]["asset_key"]
      - member: plan["primary"]["colors"]["asset_key"] and plan["secondary"]["colors"]["asset_key"]
    """
    def _apply(obj: Dict[str, Any]) -> None:
        if not isinstance(obj, dict):
            return
        lure = obj.get("base_lure")
        colors = obj.get("color_recommendations") or []
        if not lure:
            return

        # expand_color_zones may raise if lure/colors invalid; let caller handle/log
        expanded = expand_color_zones(lure, colors)

        # ✅ Canonical key for PlanScreen.tsx: pattern.colors.asset_key
        obj["colors"] = expanded

        # 🔒 Back-compat: if other code still reads `color`, keep it in sync
        obj["color"] = expanded

    if is_member:
        _apply(plan.get("primary", {}))
        _apply(plan.get("secondary", {}))
    else:
        _apply(plan)

    return plan





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

    # Controlled variety without memory:
    # 70% = "best", 30% = "alternate" (still must be valid)
    variety_bias = "best" if random.random() < 0.7 else "alternate"

    # Keep signature (trip_date), but omit from payload to reduce tokens.
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
            "Do NOT output multiple combos. Output exactly the required JSON schema."
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
                    # force JSON object output
                    "response_format": {"type": "json_object"},
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
            print("LLM_PLAN ERROR: No choices in response")
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

        # ✅ CRITICAL: expand color zones BEFORE returning
        # This guarantees PatternCard can read pattern.colors.asset_key.
        try:
            plan = expand_plan_color_zones(plan, is_member=is_member)
        except Exception as e:
            print(f"LLM_PLAN ERROR: expand_plan_color_zones failed: {type(e).__name__} {repr(e)}")
            return None

        return plan

    except Exception as e:
        print(f"LLM_PLAN ERROR: {type(e).__name__} {repr(e)}")
        return None




# ----------------------------------------
# Validation (service-level, aligned to Bass Clarity rules)
# - Uses TARGET_DEFINITIONS.keys() as canonical targets
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

    errors: List[str] = []

    # Determine which structure to expect
    if is_member:
        if "primary" not in plan or "secondary" not in plan:
            errors.append("Member plan must have 'primary' and 'secondary' patterns")
            return False, errors

        errors.extend(_validate_pattern(plan["primary"], "primary"))
        errors.extend(_validate_pattern(plan["secondary"], "secondary"))

        # presentations must differ
        if plan.get("primary", {}).get("presentation") == plan.get("secondary", {}).get("presentation"):
            errors.append("Primary and secondary must have DIFFERENT presentations")

        # shared fields
        for field in ("day_progression", "outlook_blurb"):
            if field not in plan:
                errors.append(f"Missing required shared field: {field}")
    else:
        required = [
            "presentation",
            "base_lure",
            "color_recommendations",
            "targets",
            "why_this_works",
            "work_it",
            "day_progression",
            "outlook_blurb",
        ]
        for field in required:
            if field not in plan:
                errors.append(f"Missing required field: {field}")
        if not errors:
            errors.extend(_validate_pattern(plan, "plan"))

    # day progression
    day_prog = plan.get("day_progression", [])
    if not isinstance(day_prog, list) or len(day_prog) != 3:
        errors.append(
            f"day_progression must have exactly 3 lines, got {len(day_prog) if isinstance(day_prog, list) else 'not a list'}"
        )
    else:
        for i, line in enumerate(day_prog):
            if i == 0 and not str(line).startswith("Morning:"):
                errors.append("day_progression line 0 must start with 'Morning:'")
            elif i == 1 and not str(line).startswith("Midday:"):
                errors.append("day_progression line 1 must start with 'Midday:'")
            elif i == 2 and not (str(line).startswith("Evening:") or str(line).startswith("Late:")):
                errors.append("day_progression line 2 must start with 'Evening:' or 'Late:'")

            # crude color check (no parentheses / no "in green pumpkin" patterns)
            if "(" in str(line) or ") in " in str(line).lower():
                errors.append(f"day_progression line {i} contains color (not allowed)")

    # outlook blurb
    outlook = plan.get("outlook_blurb", "")
    if not outlook or len(str(outlook).strip()) < 20:
        errors.append("outlook_blurb is too short (need 2-3 sentences)")

    # block exact temp/wind mentions in outlook
    temp_pattern = r"\d+\s*°?F"
    wind_pattern = r"\d+\s*mph"
    if re.search(temp_pattern, str(outlook)):
        errors.append("outlook_blurb contains exact temperature (use descriptive language instead)")
    if re.search(wind_pattern, str(outlook)):
        errors.append("outlook_blurb contains exact wind speed (use descriptive language instead)")

    # block specific depth-in-water phrasing (allow retrieve distance like "drag 2-3 feet")
    depth_pattern = r"(?<!drag\s)(?<!hop\s)(?<!swim\s)(?<!move\s)(?<!pull\s)\d+[-–]?\d*\s*[-–]?\s*(feet|ft|foot)\s+(of\s+water|deep|depth|down)"

    all_text_fields: List[str] = []
    if is_member:
        all_text_fields.extend(
            [
                str(plan.get("outlook_blurb", "")),
                str(plan.get("primary", {}).get("why_this_works", "")),
                " ".join([str(x) for x in plan.get("primary", {}).get("work_it", [])]),
                str(plan.get("secondary", {}).get("why_this_works", "")),
                " ".join([str(x) for x in plan.get("secondary", {}).get("work_it", [])]),
                " ".join([str(x) for x in plan.get("day_progression", [])]),
            ]
        )
    else:
        all_text_fields.extend(
            [
                str(plan.get("outlook_blurb", "")),
                str(plan.get("why_this_works", "")),
                " ".join([str(x) for x in plan.get("work_it", [])]),
                " ".join([str(x) for x in plan.get("day_progression", [])]),
            ]
        )

    for text in all_text_fields:
        m = re.search(depth_pattern, text, re.IGNORECASE)
        if m:
            errors.append(f"Plan contains specific depth mention (not allowed): {m.group()}")
            break

    return (len(errors) == 0), errors


def _validate_pattern(pattern: Dict[str, Any], pattern_name: str) -> List[str]:
    """Validate a single pattern (primary/secondary/flat plan)"""
    errors: List[str] = []

    required = ["presentation", "base_lure", "color_recommendations", "targets", "why_this_works", "work_it"]
    for field in required:
        if field not in pattern:
            errors.append(f"{pattern_name}: Missing required field: {field}")

    if errors:
        return errors

    # presentation validity
    if pattern["presentation"] not in PRESENTATIONS:
        errors.append(f"{pattern_name}: Invalid presentation: {pattern['presentation']}")

    # lure validity
    base_lure = pattern["base_lure"]
    if base_lure not in LURE_POOL:
        errors.append(f"{pattern_name}: Invalid base_lure: {base_lure}")

    # lure matches presentation
    lure_errs = validate_lure_and_presentation(base_lure, pattern["presentation"])
    errors.extend([f"{pattern_name}: {err}" for err in lure_errs])

    # colors: 1-2 allowed by validator, but Bass Clarity prompt should provide exactly 2
    colors = pattern["color_recommendations"]
    if not isinstance(colors, list) or not (1 <= len(colors) <= 2):
        errors.append(
            f"{pattern_name}: color_recommendations must be 1-2 colors, got {len(colors) if isinstance(colors, list) else 'not a list'}"
        )
    else:
        soft_plastic = pattern.get("soft_plastic", None)
        valid_colors = get_color_pool_for_lure(base_lure, soft_plastic)

        for color in colors:
            if color not in valid_colors:
                errors.append(
                    f"{pattern_name}: Invalid color '{color}' for {base_lure}. Allowed colors: {valid_colors}"
                )

        # additional lure/color compatibility checks
        color_errs = validate_colors_for_lure(base_lure, colors, soft_plastic)
        errors.extend([f"{pattern_name}: {err}" for err in color_errs])

    # targets: canonical = TARGET_DEFINITIONS.keys()
    targets = pattern["targets"]
    if not isinstance(targets, list):
        errors.append(f"{pattern_name}: targets must be a list")
    else:
        if len(targets) != 3:
            errors.append(f"{pattern_name}: targets must have exactly 3 items, got {len(targets)}")
        canonical_targets = set(TARGET_DEFINITIONS.keys())
        for t in targets:
            if t not in canonical_targets:
                errors.append(f"{pattern_name}: Invalid target '{t}' (must be from TARGET_DEFINITIONS keys)")

    # soft_plastic rules
    if "soft_plastic" in pattern and pattern["soft_plastic"]:
        if base_lure in TERMINAL_PLASTIC_MAP:
            allowed_plastics = TERMINAL_PLASTIC_MAP[base_lure]
            if pattern["soft_plastic"] not in allowed_plastics:
                errors.append(
                    f"{pattern_name}: soft_plastic '{pattern['soft_plastic']}' not allowed for {base_lure}. Allowed: {sorted(list(allowed_plastics))}"
                )
        else:
            errors.append(f"{pattern_name}: {base_lure} does not use soft_plastic field")

    # trailer rules
    if "trailer" in pattern and pattern["trailer"]:
        if base_lure in TRAILER_BUCKET_BY_LURE:
            bucket_name = TRAILER_BUCKET_BY_LURE[base_lure]

            if bucket_name == "JIG_TRAILERS":
                allowed_trailers = JIG_TRAILERS
            elif bucket_name == "CHATTER_SWIMJIG_TRAILERS":
                allowed_trailers = CHATTER_SWIMJIG_TRAILERS
            elif bucket_name == "SPINNER_BUZZ_TRAILERS":
                allowed_trailers = SPINNER_BUZZ_TRAILERS
            else:
                allowed_trailers = []
                errors.append(f"{pattern_name}: Unknown trailer bucket '{bucket_name}'")

            if pattern["trailer"] not in allowed_trailers:
                errors.append(
                    f"{pattern_name}: trailer '{pattern['trailer']}' not allowed for {base_lure}. Allowed: {sorted(list(allowed_trailers))}"
                )
        else:
            errors.append(f"{pattern_name}: {base_lure} does not use trailer field")

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
    Returns validated plan or None.

    Args:
        weather: Weather data
        location: Location name
        trip_date: Date string (kept for signature compatibility)
        phase: Bass phase
        is_member: If True, generates primary + secondary patterns
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
            try:
                plan = expand_plan_color_zones(plan, is_member=is_member)
            except Exception as e:
                print(f"LLM_PLAN: Color zone expansion failed: {e}")
                continue   # retry LLM, do NOT return unexpanded plan

            return plan

        print(f"LLM_PLAN: Attempt {attempt + 1} validation failed:")
        for err in errors[:6]:
            print(f"  - {err}")

        await asyncio.sleep(0.75 * (attempt + 1))

    print("LLM_PLAN: All attempts failed")
    return None


def llm_enabled() -> bool:
    """Check if LLM plan generation is enabled"""
    return os.getenv("LLM_PLAN_ENABLED", "").strip().lower() in ("1", "true", "yes", "on")