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
from app.canon.target_definitions import (
    TARGET_DEFINITIONS,           # For system prompt dump
    filter_targets_by_access,     # For access filtering
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

🚨 CRITICAL VALIDATION RULE #1 - ONLY ONE BOTTOM CONTACT PRESENTATION PER PLAN:

Bottom Contact presentations are:
  • "Bottom Contact - Dragging"
  • "Bottom Contact - Hopping / Targeted"

RULE: If primary uses EITHER bottom contact presentation, secondary MUST use a DIFFERENT presentation family.

Valid alternatives for secondary:
  • "Horizontal Reaction"
  • "Vertical Reaction"
  • "Hovering / Mid-Column Finesse"
  • "Topwater - Horizontal"
  • "Topwater - Precision / Vertical Surface Work"

✅ VALID EXAMPLES:
  primary.presentation = "Bottom Contact - Dragging", secondary.presentation = "Horizontal Reaction"
  primary.presentation = "Horizontal Reaction", secondary.presentation = "Bottom Contact - Hopping / Targeted"
  primary.presentation = "Vertical Reaction", secondary.presentation = "Bottom Contact - Dragging"

❌ INVALID EXAMPLES (PLAN WILL BE REJECTED):
  primary.presentation = "Bottom Contact - Dragging", secondary.presentation = "Bottom Contact - Hopping / Targeted"
  primary.presentation = "Bottom Contact - Hopping / Targeted", secondary.presentation = "Bottom Contact - Dragging"

🚨 CRITICAL VALIDATION RULE #2 - LURE MUST MATCH PRESENTATION:

Check LURE_TO_PRESENTATION before selecting. Common mistakes:
  ❌ football jig + "Vertical Reaction" (football jig ONLY does bottom contact)
  ❌ jerkbait + "Horizontal Reaction" (jerkbait ONLY does vertical reaction)
  ❌ chatterbait + "Bottom Contact" (chatterbait ONLY does horizontal reaction)

🚨 CRITICAL VALIDATION RULE #3 - NO DUPLICATE SOFT PLASTICS OR TRAILERS:

If primary uses a soft_plastic, secondary MUST use a DIFFERENT soft_plastic.
If primary uses a trailer, secondary MUST use a DIFFERENT trailer.

Examples:
✅ VALID:
  primary: carolina rig + finesse worm
  secondary: dropshot + small minnow (different soft plastic)

❌ INVALID (PLAN WILL BE REJECTED):
  primary: carolina rig + finesse worm
  secondary: dropshot + finesse worm (same soft plastic ❌)

  
🚨 CRITICAL VALIDATION RULE #4 - CAROLINA RIG MUST BE EARNED:
⚠️ SPECIAL CAROLINA RIG RULE:
If user recently used Carolina rig (check VARIETY CONTEXT), you MUST use an alternative unless:
1. Water temp < 45°F AND offshore structure selected (humps, ledges) AND no wind
2. AND no other bottom-contact lure is viable

Valid alternatives to Carolina rig for cold water bottom contact:
✅ Texas rig (faster to fish, more versatile)
✅ Football jig (better feel on rocky bottom)
✅ Casting jig (can hop or drag)
✅ Shaky head (finesse alternative)

Default thought process:
"Carolina rig was recently used → Can texas rig or jig work? → YES → Pick texas rig or jig"
NOT: "Carolina rig works → Pick carolina rig"
Carolina rig as PRIMARY is only justified when:
✅ Conditions strongly indicate slow, methodical dragging (post-front, high pressure, very cold water <50°F)
✅ At least one offshore target selected (humps, ledges, main-lake points, basin-adjacent structure)
✅ Bass are clearly inactive or holding tight to deep structure

Do NOT default to Carolina rig when:
❌ Multiple bottom-contact options are equally valid → prefer texas rig, jig, shaky head
❌ Boat access with only transition targets (points, breaks) → use more versatile presentations
❌ Active conditions (wind, warming trend, pre-spawn movement) → choose reaction baits
❌ Water temp >55°F with feeding activity → use faster-moving presentations

Common mistake: "Carolina rig works everywhere, so I'll pick it"
Correct approach: "Conditions X, Y, Z specifically demand slow dragging at distance → Carolina rig"

If using Carolina rig as primary:
- Explain WHY slow dragging is optimal for THESE SPECIFIC conditions
- Reference which targets demand long-line presentations
- Justify why faster presentations won't work
  

AUTHORITY / LANGUAGE (LOCKED):
- Never state certainty about fish behavior. Use: may, might, can, suggests, tends to.
- Do NOT say what bass ARE doing; suggest what they MAY be doing.

NO RANKINGS (LOCKED):
- Targets, presentations, and lures do not have inherent ranks.
- Determine the best strategy conditionally based on the provided phase + conditions.
- Variety is intentional (freedom within structure), never random.

ANALYSIS ORDER (NON-NEGOTIABLE):
Season/Phase → Current Conditions → Targets → Presentation Family → Lure → Retrieves

PRESENTATION
- 2-3 sentences providing a description of the presentation and why this particular presentation is chosen based on the current weather/condition/phase analysis and how it relates to the selected targets.

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
- Each target MUST be from the accessible_targets list provided in the user message
- Each targets[i] MUST be an exact key from accessible_targets (match spelling and spacing)

WORK_IT_CARDS (STRICT)
- You MUST generate exactly 3 cards.
- For each card index i:
- work_it_cards[i].name MUST equal targets[i] exactly (same string).
- work_it_cards[i].definition MUST equal the value from target_definitions dict provided in user message:
- definition = target_definitions[targets[i]]
- definition is never the target label; it is the full definition text stored in target_definitions.
Example
If targets[0] = "grass edges" then:
work_it_cards[0].name = "grass edges"
work_it_cards[0].definition = target_definitions["grass edges"] (the full definition sentence from user message)


COLOR SYSTEM (LOCKED):
- You do not know real-time water clarity. Always output exactly TWO colors:
  1) Clear-to-average clarity option
  2) Stained-to-muddy clarity option
- Colors MUST come from the correct lure-specific color pool for the chosen base_lure.
- In why_this_works, you MUST explain colors in "Choose A if… Choose B if…" format.
- Light penetration can modify which color you pick within each clarity lane:
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

DROPSHOT SPECIAL CASE (STRICT):
- If base_lure is "dropshot", you MUST set:
  - presentation: "Hovering / Mid-Column Finesse"  
  - soft_plastic: REQUIRED and must be exactly ONE of:
    • "finesse worm"
    • "small minnow"

🚨 DROPSHOT COLOR RULES (CRITICAL - Follow EXACTLY):

If soft_plastic == "finesse worm":
  - Colors MUST come from RIG_COLORS pool
  - Allowed: green pumpkin, black/blue, junebug, baby bass, watermelon red, red craw, black, green pumpkin orange, peanut butter & jelly
  - DO NOT use: pearl, white, shad (these are minnow colors only)

If soft_plastic == "small minnow":
  - Colors MUST come from SOFT_SWIMBAIT_COLORS pool
  - Allowed: white, shad, pearl, bluegill, green pumpkin
  - DO NOT use: junebug, peanut butter & jelly, red craw (these are worm colors only)

COMMON ERROR:
❌ dropshot + small minnow + junebug (WRONG - junebug is for worms)
❌ dropshot + finesse worm + pearl (WRONG - pearl is for minnows)
✅ dropshot + small minnow + pearl (CORRECT)
✅ dropshot + finesse worm + green pumpkin (CORRECT)

If you pick dropshot as a pattern, carefully check:
1. What soft_plastic did you choose?
2. Does your color match that soft_plastic's pool?
3. If not, either change color OR change soft_plastic

Never omit soft_plastic for dropshot. Null/blank soft_plastic = invalid plan.
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

NOTE: Available targets will be provided in the user message based on access type (boat or bank).
You MUST choose targets ONLY from the accessible_targets list provided.

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

# ============================================================================
# PART 2: call_openai_plan function
# ============================================================================
# UPDATED: Now includes enhanced weather data (pressure, moon, precipitation, UV, humidity)

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
    """
    Generate LLM plan with access filtering and variety system.
    
    Flow:
    1. Filter targets by access type (boat vs bank)
    2. Get variety mode
    3. LLM analyzes conditions → picks from accessible targets → presentation → lure
    4. Return plan (variety swaps happen in generate_llm_plan_with_retries)
    
    Args:
        weather: Weather data (enhanced with pressure, moon, precipitation, UV, humidity)
        location: Location name
        latitude: Latitude
        longitude: Longitude
        access_type: "boat" or "bank" - determines which targets are accessible
        is_member: All users are members now (kept for compatibility)
        recent_primary_lures: List of recently used primary lures
        recent_secondary_lures: List of recently used secondary lures
    
    Returns:
        LLM-generated plan or None
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("LLM_PLAN: No API key")
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    # ✅ STEP 1: Filter targets by access type
    accessible_targets = filter_targets_by_access(access_type)
    print("LLM_PLAN: Access=" + access_type + ", " + str(len(accessible_targets)) + " accessible targets")
    
    # Build target definitions dict for only accessible targets
    from app.canon.target_definitions import TARGET_DEFINITIONS
    accessible_target_defs = {
        target: TARGET_DEFINITIONS[target]
        for target in accessible_targets
        if target in TARGET_DEFINITIONS
    }
    
    # ✅ STEP 2: Get variety mode (40% best, 40% alternate, 20% deep_cut)
    variety_mode = get_variety_mode()
    print("LLM_PLAN: Variety mode=" + variety_mode)

    # ✅ STEP 3: Build user input with accessible targets and ENHANCED WEATHER
    user_input = {
        "location": location,
        "phase": phase,
        "weather": {
            # Temperature
            "temp_f": weather.get("temp_f"),
            "temp_high": weather.get("temp_high"),
            "temp_low": weather.get("temp_low"),
            
            # Wind & Sky
            "wind_mph": weather.get("wind_mph") or weather.get("wind_speed"),
            "cloud_cover": weather.get("cloud_cover") or weather.get("sky_condition"),
            
            # Barometric Pressure (CRITICAL for bass activity)
            "pressure_mb": weather.get("pressure_mb"),
            "pressure_trend": weather.get("pressure_trend"),
            
            # Precipitation
            "precipitation_1h": weather.get("precipitation_1h", 0),
            "has_recent_rain": weather.get("has_recent_rain", False),
            
            # Light & Moon
            "uv_index": weather.get("uv_index"),
            "moon_phase": weather.get("moon_phase"),
            "moon_illumination": weather.get("moon_illumination"),
            "is_major_period": weather.get("is_major_period", False),
            
            # Other
            "humidity": weather.get("humidity"),
            "clarity_estimate": weather.get("clarity_estimate"),
        },
        "accessible_targets": accessible_targets,
        "target_definitions": accessible_target_defs,
        "variety_mode": variety_mode,
        "instructions": "",
    }
    
    # Build variety context for BOTH patterns
    variety_instructions = "🚨 VARIETY REQUIREMENT (ABSOLUTE PRIORITY):\n\n"
    
    if recent_primary_lures:
        variety_instructions += "RECENT PRIMARY LURES: " + ', '.join(recent_primary_lures) + "\n"
        variety_instructions += "⛔ DO NOT use these lures for PRIMARY pattern unless NO alternatives exist\n\n"
    
    if recent_secondary_lures:
        variety_instructions += "RECENT SECONDARY LURES: " + ', '.join(recent_secondary_lures) + "\n"
        variety_instructions += "⛔ DO NOT use these lures for SECONDARY pattern unless NO alternatives exist\n\n"
    
    if not recent_primary_lures and not recent_secondary_lures:
        variety_instructions += "No recent plan history - you have full freedom of lure selection.\n\n"
    else:
        primary_list = ', '.join(recent_primary_lures) if recent_primary_lures else 'none'
        secondary_list = ', '.join(recent_secondary_lures) if recent_secondary_lures else 'none'
        
        variety_instructions += """
DECISION RULE (APPLIES TO BOTH PATTERNS INDEPENDENTLY):

For PRIMARY pattern:
1. Evaluate conditions → identify viable presentation families
2. List ALL valid lures for chosen presentation
3. EXCLUDE recent primary lures: """ + primary_list + """
4. Pick from remaining lures
5. Only repeat if it's the SOLE viable option

For SECONDARY pattern:
1. Evaluate conditions → identify viable presentation families (DIFFERENT from primary)
2. List ALL valid lures for chosen presentation
3. EXCLUDE recent secondary lures: """ + secondary_list + """
4. Pick from remaining lures
5. Only repeat if it's the SOLE viable option

EXAMPLE:
Conditions: 37°F, no wind, winter
Recent Primary: [carolina rig, texas rig]
Recent Secondary: [jig, chatterbait]

PRIMARY Analysis:
- Bottom Contact optimal for conditions
- Valid lures: carolina rig, texas rig, jig (all work)
- Recent primary: carolina rig, texas rig
- ✅ CORRECT: Pick jig (avoid recent primary lures)
- ❌ WRONG: Pick carolina rig (ignores variety requirement)

SECONDARY Analysis:
- Reaction presentation for pivot
- Valid lures: jig, chatterbait, lipless crank
- Recent secondary: jig, chatterbait  
- ✅ CORRECT: Pick lipless crank (avoid recent secondary lures)
- ❌ WRONG: Pick jig (ignores variety requirement)

Both patterns should show variety INDEPENDENTLY.
"""
    
    user_input["instructions"] = (
        variety_instructions + "\n\n" +
        "ACCESSIBLE TARGETS (based on " + access_type + " access):\n" +
        "- You MUST choose 3 targets ONLY from the accessible_targets list\n" +
        "- Available targets: " + str(accessible_targets) + "\n" +
        "- These are the targets the angler can realistically reach from " + access_type + "\n" +
        "- For work_it_cards definitions, use target_definitions[target_name]\n" +
        "\n" +
        "ANALYSIS ORDER (NON-NEGOTIABLE):\n" +
        "1. Analyze season/phase and current conditions\n" +
        "2. Identify 3 targets from accessible_targets list where bass are likely positioned\n" +
        "3. Determine best presentation family for those targets\n" +
        "4. Select lure that best executes that presentation\n" +
        "\n" +
        "PRIMARY PATTERN (Confidence Anchor):\n" +
        "- Choose presentation that represents highest-probability way bass should feed\n" +
        "- This is the truth-telling pattern\n" +
        "\n" +
        "SECONDARY PATTERN (Intentional Complement):\n" +
        "- MUST use DIFFERENT presentation than primary\n" +
        "- Either: ALTERNATIVE (different bass position) OR COMPLEMENT (search + cleanup)\n" +
        "- Explain the relationship to primary in why_this_works\n" +
        "\n" +
        "VARIETY NOTE:\n" +
        "- Variety mode is '" + variety_mode + "' but you should choose the optimal lure\n" +
        "- Variety will be applied in post-processing\n"
    )
    
    # ===================================================================
    # ENHANCED WEATHER ANALYSIS INJECTION
    # ===================================================================
    
    # Extract enhanced weather data
    pressure_mb = weather.get("pressure_mb")
    pressure_trend = weather.get("pressure_trend")
    moon_phase = weather.get("moon_phase")
    is_major_period = weather.get("is_major_period", False)
    has_recent_rain = weather.get("has_recent_rain", False)
    uv_index = weather.get("uv_index")
    humidity = weather.get("humidity")
    
    # Build dynamic weather guidance based on actual conditions
    weather_guidance = "\n🌡️ ENHANCED WEATHER ANALYSIS:\n\n"
    
    # Barometric Pressure Analysis (HIGHEST PRIORITY)
    if pressure_mb and pressure_trend:
        weather_guidance += f"BAROMETRIC PRESSURE: {pressure_mb}mb ({pressure_trend})\n"
        
        if pressure_trend == "falling":
            weather_guidance += """
✅ FALLING PRESSURE = AGGRESSIVE FEEDING WINDOW
- Bass sense approaching weather change and feed heavily
- POWER FISHING optimal: chatterbait, lipless crank, swim jig, spinnerbait
- Faster retrieves, cover water quickly, reaction presentations
- Target shallow cover and transitions
- Strategy tone: "Falling pressure triggers aggressive feeding—bass will chase reaction baits"

"""
        elif pressure_trend == "rising":
            weather_guidance += """
✅ RISING PRESSURE = ACTIVE FEEDING
- Bass feed well before conditions stabilize
- REACTION BAITS effective: crankbait, chatterbait, spinnerbait, topwater (if warm)
- Normal to slightly faster retrieves
- Strategy tone: "Rising pressure indicates active bass—expect strikes on moving baits"

"""
        else:  # stable
            weather_guidance += """
✅ STABLE PRESSURE = NORMAL CONDITIONS
- Use PHASE-APPROPRIATE presentations
- Cold water (<50°F): Bottom contact (texas rig, jig, carolina rig)
- Warm water (>60°F): Reaction baits (chatterbait, crankbait, topwater)
- Transition temps (50-60°F): Match presentation to phase and structure

"""
    
    # Moon Phase & Solunar Analysis
    if moon_phase:
        weather_guidance += f"MOON PHASE: {moon_phase}"
        if is_major_period:
            weather_guidance += " (MAJOR SOLUNAR PERIOD - ACTIVE FEEDING WINDOW)\n"
            weather_guidance += """
🌙 CRITICAL FEEDING WINDOW ACTIVE
- You're fishing during peak solunar activity (moon overhead/underfoot)
- Bass will be actively feeding for next 2 hours
- Use aggressive presentations, don't be subtle
- Strategy tone: "You're fishing during a major solunar period—bass are in an active feeding window"

"""
        else:
            weather_guidance += "\n"
            if "full" in moon_phase or "gibbous" in moon_phase:
                weather_guidance += "- Increased feeding activity, especially dawn/dusk\n"
            elif "new" in moon_phase or "crescent" in moon_phase:
                weather_guidance += "- Minimal moonlight, bass feed during daylight hours\n"
            weather_guidance += "\n"
    
    # Precipitation Analysis
    if has_recent_rain:
        weather_guidance += """
💧 RECENT RAIN DETECTED
- Water clarity likely REDUCED (stained or muddy)
- Oxygen levels INCREASED (active bass)
- SHIFT COLORS toward high-visibility options:
  * Use chartreuse, white, bright colors for BOTH recommendations
  * Even in "clear water" lane, pick brighter options (white vs pearl, chartreuse vs green pumpkin)
- LOUDER BAITS more effective: chatterbait, spinnerbait (Colorado blade), lipless crank
- Target creek mouths, points, runoff areas (bass follow baitfish)
- Strategy tone: "Recent rain has stained the water—bright colors improve visibility in reduced clarity"

"""
    
    # UV Index Analysis
    if uv_index is not None:
        weather_guidance += f"UV INDEX: {uv_index}\n"
        if uv_index > 7:
            weather_guidance += """
☀️ HIGH UV = BASS SEEK SHADE
- Strong light penetration drives bass under cover
- PRIORITIZE shaded targets: docks, laydowns, overhangs, grass mats, undercut banks
- In target selection, favor cover-oriented structure over open water
- Natural/translucent colors in clear water
- Strategy tone: "High UV index drives bass to shade—focus on docks and overhead cover"

"""
        elif uv_index < 3:
            weather_guidance += """
☁️ LOW UV = BASS ROAM OPEN WATER
- Overcast/low light allows bass to leave heavy cover
- Can target flats, transitions, open-water structure
- REACTION BAITS more effective (bass less cover-dependent)
- Chatterbait, crankbait, spinnerbait excel in low light
- Strategy tone: "Low light conditions reduce cover dependency—bass will roam more freely"

"""
        weather_guidance += "\n"
    
    # Humidity Analysis (topwater indicator)
    if humidity is not None and humidity > 70:
        weather_guidance += f"""
💨 HIGH HUMIDITY ({humidity}%)
- Increased insect activity on water surface
- TOPWATER opportunities if water temp > 60°F
- Popper, walking bait, or frog (if grass/pads present)
- Strategy tone: "High humidity increases insect activity—topwater baits mimic surface prey"

"""
    
    # Integration rules
    weather_guidance += """
🎯 INTEGRATION RULES:
1. Pressure trend OVERRIDES moon phase for activity level
   - Falling pressure + new moon = STILL aggressive (pressure wins)
   - Rising pressure + full moon = EXTREMELY aggressive (both align)
   - Stable pressure + major period = normal to active

2. Recent rain MODIFIES all color selections
   - Shift BOTH color recommendations toward high-visibility
   - "Clear water" colors become "stained water" equivalents

3. UV index REFINES target selection
   - High UV (>7) → favor shaded targets in your 3 selections
   - Low UV (<3) → can include open-water targets

4. Combine indicators for strategy tone:
   - Falling pressure + major period = "Ideal feeding conditions"
   - Stable pressure + low UV = "Normal conditions with good roaming activity"
   - Rising pressure + recent rain = "Active bass in stained water—use bright reaction baits"

"""
    
    # Append weather guidance to instructions
    user_input["instructions"] += weather_guidance
    
    # ===================================================================
    # TEMPERATURE SWING ANALYSIS (existing logic)
    # ===================================================================
    
    temp_current = weather.get("temp_f", 60)
    temp_high = weather.get("temp_high", temp_current)
    temp_low = weather.get("temp_low", temp_current)
    temp_swing = temp_high - temp_low
    
    # Add temp swing guidance if significant
    if temp_swing >= 10:
        swing_category = (
            "MODERATE" if temp_swing < 15 else 
            "WIDE" if temp_swing < 20 else 
            "EXTREME"
        )
        
        temp_swing_instructions = """
🌡️ TEMPERATURE SWING DETECTED (""" + swing_category + """):
Current temp: """ + str(temp_current) + """°F
Today's range: """ + str(temp_low) + """°F (morning) → """ + str(temp_high) + """°F (afternoon)
Temperature swing: """ + str(temp_swing) + """°F

LURE SELECTION STRATEGY FOR TEMP SWINGS:

MODERATE SWING (10-15°F):
- Choose a lure that works effectively across the temperature range
- Versatile options are preferred over narrow-range specialists
- Example: Texas rig works 45-65°F (versatile) vs Carolina rig optimal <50°F only (narrow)

WIDE/EXTREME SWING (15°F+):
- PRIMARY LURE must work at BOTH morning and afternoon temps OR
- Day progression must explain when/how to transition between techniques
- Avoid narrow-range specialists unless you explain the transition strategy

Examples of versatile vs narrow-range lures:

VERSATILE (work across wide temp ranges):
✅ Texas rig (35-65°F)
✅ Jig (35-65°F)  
✅ Chatterbait (50-75°F)
✅ Spinnerbait (50-80°F)

NARROW-RANGE (optimal in specific conditions):
⚠️ Carolina rig (optimal 35-48°F, less effective >50°F)
⚠️ Blade bait (optimal 38-52°F, less effective >55°F)
⚠️ Jerkbait (optimal 45-58°F, less effective <45°F or >60°F)
⚠️ Topwater (optimal >65°F, ineffective <60°F)

DECISION RULE:
1. Calculate effective temp range for the day (""" + str(temp_low) + """°F - """ + str(temp_high) + """°F)
2. If considering a narrow-range lure (e.g., carolina rig):
   - Check if ENTIRE day's range falls within optimal window
   - If NO → choose versatile alternative OR explain transition in day progression
3. If swing is """ + str(temp_swing) + """°F, strongly prefer versatile lures

EXAMPLE for your conditions:
- If morning is """ + str(temp_low) + """°F and afternoon is """ + str(temp_high) + """°F:
- Carolina rig works morning but NOT afternoon → Choose texas rig instead (works all day)
- OR use carolina rig BUT explain "switch to jig as water warms past """ + str(temp_low + 12) + """°F" in day progression
"""
        user_input["instructions"] += temp_swing_instructions
    
    # Add boat advantage strategic requirements
    if access_type == "boat":
        boat_instructions = """
        
🚤 BOAT ACCESS STRATEGIC REQUIREMENTS:
You have """ + str(len(accessible_targets)) + """ targets available (including offshore/transition structure).

Required strategic approach:
- Include at least 1 transition or offshore target in your 3 targets:
  * Transition: points, channel swings, breaks, first depth break, outside bends, transitions
  * Offshore: humps, ledges, main-lake points, roadbeds, saddles, basin-adjacent structure
- Don't default to bank-fishing techniques from a boat
- Leverage boat positioning advantages (can fish multiple zones, access deeper water)

Good boat plans demonstrate:
- Offshore structure usage when appropriate (humps, ledges, main-lake points)
- Deep transition zones (channel swings, steep breaks, outside bends)
- Vertical or deep presentations when conditions warrant

Avoid: Selecting only shoreline cover (banks, docks, laydowns) when boat access provides offshore options
"""
        user_input["instructions"] += boat_instructions

    system_prompt = build_system_prompt(include_pattern_2=True)
    max_tokens = 1700

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
                        {"role": "user", "content": json.dumps(user_input, ensure_ascii=False)},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.6,
                    "max_completion_tokens": max_tokens,
                },
            )

        dt = time.time() - t0
        print("LLM_PLAN: OpenAI call took " + str(round(dt, 2)) + "s (mode=" + variety_mode + ")")

        if response.status_code != 200:
            print("LLM_PLAN: HTTP " + str(response.status_code))
            print("LLM_PLAN BODY: " + response.text[:800])
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
            print("LLM_PLAN: Content preview: " + content[:400])
            return None

        try:
            plan = json.loads(extracted)
        except json.JSONDecodeError as e:
            print("LLM_PLAN ERROR: JSONDecodeError after extraction")
            print("LLM_PLAN JSON ERROR: " + repr(e))
            print("LLM_PLAN: Extracted preview: " + extracted[:500])
            return None

        # Return plan with variety_mode attached for post-processing
        plan["_variety_mode"] = variety_mode
        return plan

    except Exception as e:
        print("LLM_PLAN ERROR: " + type(e).__name__ + " " + repr(e))
        return None





# PART 3: Post-processing and Validation functions
# ============================================================================

# ============================================================================
# POST-PROCESSING: LURE VARIETY SWAP
# ============================================================================

def swap_lures_for_variety(
    plan: Dict[str, Any],
    variety_mode: str,
    weather: Dict[str, Any],
    phase: str,
) -> Dict[str, Any]:
    """
    Swap lures to tier 2/3 options while maintaining presentation compatibility.
    
    This happens AFTER the LLM picks optimal lures, allowing us to add variety
    without compromising the target-first analysis.
    
    Args:
        plan: LLM-generated plan with primary + secondary patterns
        variety_mode: "best" | "alternate" | "deep_cut"
        weather: Weather conditions (for tier selection)
        phase: Bass phase (for tier selection)
    
    Returns:
        Plan with lures potentially swapped to tier 2/3
    """
    if variety_mode == "best":
        # No swap - LLM's choice is optimal
        return plan
    
    for pattern_name in ["primary", "secondary"]:
        if pattern_name not in plan:
            continue
        
        pattern = plan[pattern_name]
        current_lure = pattern.get("base_lure")
        presentation = pattern.get("presentation")
        
        if not current_lure or not presentation:
            continue
        
        # Get condition-aware tiers for this presentation
        tiers = get_lure_tiers_for_presentation(presentation, weather, phase)
        
        # Select alternative tier based on variety mode
        if variety_mode == "alternate":
            alternatives = tiers.get("tier2", [])
        else:  # deep_cut
            alternatives = tiers.get("tier3", [])
        
        # Only swap if:
        # 1. Alternatives exist
        # 2. Current lure is NOT already in that tier (avoid swapping tier2 to tier2)
        if alternatives and current_lure not in alternatives:
            new_lure = random.choice(alternatives)
            pattern["base_lure"] = new_lure
            print("LLM_PLAN: " + pattern_name + " lure swap: " + current_lure + " → " + new_lure + " (" + variety_mode + ")")
            
            # Important: Clear soft_plastic and trailer when swapping lures
            # The LLM will have set these for the original lure
            # Validation will enforce correct values for new lure
            if "soft_plastic" in pattern:
                pattern["soft_plastic"] = None
            if "soft_plastic_why" in pattern:
                pattern["soft_plastic_why"] = None
            if "trailer" in pattern:
                pattern["trailer"] = None
            if "trailer_why" in pattern:
                pattern["trailer_why"] = None
    
    return plan


# ============================================================================
# POST-PROCESSING: COLOR VARIETY
# ============================================================================

def apply_color_variety(
    plan: Dict[str, Any],
    variety_mode: str,
) -> Dict[str, Any]:
    """
    Apply color variety to LLM-selected colors.
    Swaps colors based on variety_mode to prevent repetition.
    
    Args:
        plan: LLM output with primary + secondary patterns
        variety_mode: "best" | "alternate" | "deep_cut"
    
    Returns:
        Modified plan with varied colors
    """
    def _swap_colors(pattern: Dict[str, Any], pattern_name: str) -> None:
        """Swap colors for a single pattern"""
        if "base_lure" not in pattern or "color_recommendations" not in pattern:
            return
        
        lure = pattern["base_lure"]
        soft_plastic = pattern.get("soft_plastic")
        current_colors = pattern["color_recommendations"]
        
        if not current_colors or len(current_colors) != 2:
            return  # LLM didn't provide 2 colors, skip variety
        
        # Get color candidates with variety
        color_candidates = get_color_candidates(lure, soft_plastic, variety_mode)
        
        # Replace colors if variety mode isn't "best"
        if variety_mode != "best" and color_candidates:
            clear_options = color_candidates.get("clear", [])
            stained_options = color_candidates.get("stained", [])
            
            if clear_options:
                pattern["color_recommendations"][0] = random.choice(clear_options)
            if stained_options:
                pattern["color_recommendations"][1] = random.choice(stained_options)
            
            print("LLM_PLAN: " + pattern_name + " color variety (" + variety_mode + "): " + str(pattern["color_recommendations"]))
    
    # Apply to both patterns (always dual-pattern now)
    if "primary" in plan:
        _swap_colors(plan["primary"], "primary")
    if "secondary" in plan:
        _swap_colors(plan["secondary"], "secondary")
    
    return plan


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
                errors.append("Missing required shared field: " + field)
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
                errors.append("Missing required field: " + field)
        if not errors:
            errors.extend(_validate_pattern(plan, "plan"))

    # day progression
    day_prog = plan.get("day_progression", [])
    if not isinstance(day_prog, list) or len(day_prog) != 3:
        length_str = str(len(day_prog)) if isinstance(day_prog, list) else "not a list"
        errors.append("day_progression must have exactly 3 lines, got " + length_str)
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
                errors.append("day_progression line " + str(i) + " contains color (not allowed)")

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
            errors.append("Plan contains specific depth mention (not allowed): " + m.group())
            break

    return (len(errors) == 0), errors


def _validate_pattern(pattern: Dict[str, Any], pattern_name: str) -> List[str]:
    """Validate a single pattern (primary/secondary/flat plan)"""
    errors: List[str] = []

    required = ["presentation", "base_lure", "color_recommendations", "targets", "why_this_works", "work_it"]
    for field in required:
        if field not in pattern:
            errors.append(pattern_name + ": Missing required field: " + field)

    if errors:
        return errors

    # presentation validity
    if pattern["presentation"] not in PRESENTATIONS:
        errors.append(pattern_name + ": Invalid presentation: " + pattern["presentation"])

    # lure validity
    base_lure = pattern["base_lure"]
    if base_lure not in LURE_POOL:
        errors.append(pattern_name + ": Invalid base_lure: " + base_lure)

    # lure matches presentation
    lure_errs = validate_lure_and_presentation(base_lure, pattern["presentation"])
    errors.extend([pattern_name + ": " + err for err in lure_errs])

    # colors: 1-2 allowed by validator, but Bass Clarity prompt should provide exactly 2
    colors = pattern["color_recommendations"]
    if not isinstance(colors, list) or not (1 <= len(colors) <= 2):
        length_str = str(len(colors)) if isinstance(colors, list) else "not a list"
        errors.append(pattern_name + ": color_recommendations must be 1-2 colors, got " + length_str)
    else:
        soft_plastic = pattern.get("soft_plastic", None)
        valid_colors = get_color_pool_for_lure(base_lure, soft_plastic)

        for color in colors:
            if color not in valid_colors:
                errors.append(pattern_name + ": Invalid color '" + color + "' for " + base_lure + ". Allowed colors: " + str(valid_colors))

        # additional lure/color compatibility checks
        color_errs = validate_colors_for_lure(base_lure, colors, soft_plastic)
        errors.extend([pattern_name + ": " + err for err in color_errs])

    # targets: canonical = TARGET_DEFINITIONS.keys()
    targets = pattern["targets"]
    if not isinstance(targets, list):
        errors.append(pattern_name + ": targets must be a list")
    else:
        if len(targets) != 3:
            errors.append(pattern_name + ": targets must have exactly 3 items, got " + str(len(targets)))
        canonical_targets = set(TARGET_DEFINITIONS.keys())
        for t in targets:
            if t not in canonical_targets:
                errors.append(pattern_name + ": Invalid target '" + t + "' (must be from TARGET_DEFINITIONS keys)")

    # soft_plastic rules
    if "soft_plastic" in pattern and pattern["soft_plastic"]:
        if base_lure in TERMINAL_PLASTIC_MAP:
            allowed_plastics = TERMINAL_PLASTIC_MAP[base_lure]
            if pattern["soft_plastic"] not in allowed_plastics:
                errors.append(pattern_name + ": soft_plastic '" + pattern["soft_plastic"] + "' not allowed for " + base_lure + ". Allowed: " + str(sorted(list(allowed_plastics))))
        else:
            errors.append(pattern_name + ": " + base_lure + " does not use soft_plastic field")

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
                errors.append(pattern_name + ": Unknown trailer bucket '" + bucket_name + "'")

            if pattern["trailer"] not in allowed_trailers:
                errors.append(pattern_name + ": trailer '" + pattern["trailer"] + "' not allowed for " + base_lure + ". Allowed: " + str(sorted(list(allowed_trailers))))
        else:
            errors.append(pattern_name + ": " + base_lure + " does not use trailer field")

    return errors

# ============================================================================
# PART 4: Main generation function with retries
# ============================================================================

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
    max_attempts: int = 5,
) -> dict:
    """
    Generate LLM plan with validation and retries.
    Returns validated plan or None.

    Args:
        weather: Weather data
        location: Location name
        latitude: Latitude
        longitude: Longitude
        access_type: "boat" or "bank" - filters accessible targets
        is_member: All users are members now (kept for compatibility)
        recent_primary_lures: List of recently used primary lures
        recent_secondary_lures: List of recently used secondary lures
        max_attempts: Number of retry attempts
    """
    for attempt in range(max_attempts):
        plan = await call_openai_plan(
            weather=weather,
            phase=phase,
            location=location,
            latitude=latitude,
            longitude=longitude,
            access_type=access_type,
            is_member=is_member,
            recent_primary_lures=recent_primary_lures,
            recent_secondary_lures=recent_secondary_lures,
        )

        if not plan:
            await asyncio.sleep(0.75 * (attempt + 1))
            print("LLM_PLAN: Attempt " + str(attempt + 1) + " failed (no response)")
            continue

        # Extract variety mode from plan (attached in call_openai_plan)
        variety_mode = plan.pop("_variety_mode", "best")

        # 🚨 VARIETY SWAPPING DISABLED - Use temperature for natural variety instead
        # Problem: Swapping colors/lures after LLM generates text creates mismatches
        # - LLM writes: "Choose green pumpkin if clear..."
        # - We swap colors to: watermelon red
        # - Text still says "green pumpkin" but shows "watermelon red" ❌
        #
        # Solution: Use temperature=0.6 for natural LLM variety
        # - LLM picks different lures/colors across requests
        # - Text always matches because LLM generated it
        # - Simpler, no post-processing needed
        if variety_mode != "best":
            pass  # No swapping - LLM handles variety via temperature
            # plan = swap_lures_for_variety(plan, variety_mode, weather, phase)  # ← DISABLED
            # plan = apply_color_variety(plan, variety_mode)  # ← DISABLED

        # Validate plan
        is_valid, errors = validate_llm_plan(plan, is_member=is_member)

        if is_valid:
            try:
                plan = expand_plan_color_zones(plan, is_member=is_member)
            except Exception as e:
                print("LLM_PLAN: Color zone expansion failed: " + str(e))
                continue   # retry LLM, do NOT return unexpanded plan

            return plan

        print("LLM_PLAN: Attempt " + str(attempt + 1) + " validation failed:")
        for err in errors[:6]:
            print("  - " + err)

        await asyncio.sleep(0.75 * (attempt + 1))

    print("LLM_PLAN: All attempts failed")
    return None


def llm_enabled() -> bool:
    """Check if LLM plan generation is enabled"""
    return os.getenv("LLM_PLAN_ENABLED", "").strip().lower() in ("1", "true", "yes", "on")