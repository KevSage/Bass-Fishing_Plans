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

from app.canon.pools import (
    LURE_POOL,
    COLOR_POOL,
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
    Build the system prompt with all canonical rules embedded.
    
    Args:
        include_pattern_2: If True, request both primary and secondary patterns (for members)
    """
    
    # Format terminal plastics for prompt
    terminal_rules = []
    for lure, plastics in TERMINAL_PLASTIC_MAP.items():
        terminal_rules.append(f"  - {lure}: {sorted(plastics)}")
    
    # Format trailer rules for prompt
    trailer_rules = []
    trailer_rules.append("  REQUIRED trailers:")
    trailer_rules.append(f"    - chatterbait, swim jig: {CHATTER_SWIMJIG_TRAILERS}")
    trailer_rules.append(f"    - casting jig, football jig: {JIG_TRAILERS}")
    trailer_rules.append("  OPTIONAL trailers:")
    trailer_rules.append(f"    - spinnerbait, buzzbait: {SPINNER_BUZZ_TRAILERS}")
    
    pattern_2_section = ""
    if include_pattern_2:
        pattern_2_section = """
PATTERN 2 (SECONDARY) - THE PIVOT PLAN (MEMBERS ONLY):
This is NOT a backup lure. This assumes your initial read was slightly off.

CRITICAL PATTERN ORDERING RULE:
When you're choosing a SEARCH/MOVING bait (Horizontal Reaction, Topwater) paired with a BOTTOM CONTACT bait:
- Pattern 1 MUST be the search/moving bait
- Pattern 2 MUST be the bottom contact bait
- This is the classic "search and destroy" → "pick apart" combo
- In "why_this_works" for Pattern 2, explain: "Once you locate active fish with the [P1 lure], switch to this [P2 lure] to methodically pick apart the area."

Example Search → Pick Apart Combos:
✅ P1: Lipless crankbait (search) → P2: Texas rig (pick apart)
✅ P1: Chatterbait (search) → P2: Jig (pick apart)
✅ P1: Spinnerbait (search) → P2: Carolina rig (pick apart)
✅ P1: Buzzbait (search) → P2: Texas rig (pick apart)

For OTHER pattern combos (not search → bottom contact):
- Use normal pivot logic (different assumption about fish position)
- Explain in "why_this_works" what different assumption you're making

Pattern 2 Rules:
- MUST use a different presentation family than Pattern 1
- If it's a search → pick apart combo, explain the sequential relationship
- If it's a different combo type, explain the pivot assumption

Pattern 2 output format (add to JSON):
"secondary": {
  "presentation": "<different from primary>",
  "base_lure": "<from LURE_POOL>",
  "soft_plastic": "<OPTIONAL - only for terminal tackle>",
  "soft_plastic_why": "<OPTIONAL - 1-2 sentences contextual to phase/temp/clarity>",
  "trailer": "<OPTIONAL - only for jigs/chatterbait/etc>",
  "trailer_why": "<OPTIONAL - 1-2 sentences contextual to conditions>",
  "color_recommendations": ["<color1>", "<color2>"],
  "targets": ["<target1>", "<target2>", "<target3>"],
  "why_this_works": "<CONTEXT-DEPENDENT: If search→pick apart combo, explain the sequential relationship. Otherwise, explain the pivot assumption.>",
  "work_it": ["<target + specific retrieve cadence>", "...", "..."],
  "strategy": "<2-3 sentence paragraph - NO bullets>"
}
"""
    
    output_format = ""
    if include_pattern_2:
        output_format = """
OUTPUT FORMAT (JSON only - no markdown, no explanation):
{
  "primary": {
    "presentation": "<one from PRESENTATIONS>",
    "base_lure": "<one from LURE_POOL>",
    "soft_plastic": "<OPTIONAL - only for terminal tackle: texas rig, carolina rig, dropshot, neko rig, wacky rig, ned rig, shaky head>",
    "soft_plastic_why": "<OPTIONAL - contextual explanation why THIS plastic for THESE conditions>",
    "trailer": "<OPTIONAL - only for: chatterbait, swim jig, spinnerbait, casting jig, football jig>",
    "trailer_why": "<OPTIONAL - contextual explanation why THIS trailer for THESE conditions>",
    "color_recommendations": ["<color1>", "<color2>"],
    "targets": ["<target1>", "<target2>", "<target3>"],
    "why_this_works": "<1-2 sentences why THIS lure for these conditions>",
    "work_it": ["<target + specific retrieve for this lure>", "...", "..."],
    "strategy": "<2-3 sentence paragraph about positioning/angles/conditions - NO bullets>"
  },
  "secondary": {
    "presentation": "<different from primary>",
    "base_lure": "<from LURE_POOL>",
    "soft_plastic": "<OPTIONAL>",
    "soft_plastic_why": "<OPTIONAL>",
    "trailer": "<OPTIONAL>",
    "trailer_why": "<OPTIONAL>",
    "color_recommendations": ["<color1>", "<color2>"],
    "targets": ["<target1>", "<target2>", "<target3>"],
    "why_this_works": "<explain the pivot>",
    "work_it": ["<target + retrieve>", "...", "..."],
    "strategy": "<2-3 sentence paragraph - NO bullets>"
  },
  "day_progression": ["Morning: ...", "Midday: ...", "Late: ..."],
  "outlook_blurb": "<weather forecast only>"
}
"""
    else:
        output_format = """
OUTPUT FORMAT (JSON only - no markdown, no explanation):
{
  "presentation": "<one from PRESENTATIONS>",
  "base_lure": "<one from LURE_POOL - must match presentation>",
  "soft_plastic": "<OPTIONAL - only if terminal tackle>",
  "soft_plastic_why": "<OPTIONAL - contextual to conditions>",
  "trailer": "<OPTIONAL - only if needs trailer>",
  "trailer_why": "<OPTIONAL - contextual to conditions>",
  "color_recommendations": ["<color1>", "<color2>"],
  "targets": ["<target1>", "<target2>", "<target3>"],
  "why_this_works": "<1-2 sentences explaining why this lure fits conditions>",
  "work_it": [
    "<target name + specific retrieve cadence for this lure>",
    "<target name + specific retrieve cadence>",
    "<target name + specific retrieve cadence>"
  ],
  "day_progression": [
    "Morning: <tactical sentence using same targets from above>",
    "Midday: <tactical sentence using same targets>",
    "Late: <tactical sentence using same targets>"
  ],
  "outlook_blurb": "<weather forecast only - NO bass strategy>"
}
"""
    
    return f"""You are BassFishingPlans (BFP), an expert bass fishing guide.

Your job: Generate a complete bass fishing plan based on weather, location, and date.

CRITICAL RULES - VIOLATE THESE AND THE PLAN IS REJECTED:

1. PRESENTATIONS (choose ONE for primary pattern):
{json.dumps(PRESENTATIONS, indent=2)}

2. ALLOWED LURES (choose from this list ONLY - exact strings):
{json.dumps(LURE_POOL, indent=2)}

3. LURE → PRESENTATION MAPPING (lure MUST match its presentation):
{json.dumps(LURE_TO_PRESENTATION, indent=2)}

4. ALLOWED COLORS (choose 1-2 from this list ONLY - exact strings):
{json.dumps(COLOR_POOL, indent=2)}

5. COLOR VARIETY RULE:
   - When choosing 2 colors, they MUST be from different color families
   - BAD: "watermelon" + "green pumpkin" (both natural greens)
   - BAD: "shad" + "natural shad" (both shad colors)
   - BAD: "chartreuse" + "chartreuse/white" (same base)
   - GOOD: "watermelon" + "black/blue" (natural + contrast)
   - GOOD: "shad" + "firetiger" (natural + high-contrast)
   - GOOD: "green pumpkin" + "white" (natural + pelagic)
   
6. COLOR RESTRICTIONS:
   - Metallic/firetiger colors (gold, bronze, silver, firetiger) can ONLY be used on hard baits: {sorted(HARDBAIT_LURES)}
   - black/blue is NOT allowed on hard baits or jerkbaits
   - For spinnerbait, color refers to SKIRT color (not blade finish)

7. TERMINAL TACKLE SOFT PLASTIC RULES:
   If you choose terminal tackle (texas rig, carolina rig, dropshot, neko rig, wacky rig, ned rig, shaky head), you MUST include:
   - soft_plastic: choose from allowed plastics for that lure
   - soft_plastic_why: 1-2 sentences explaining why THIS plastic for THESE conditions (phase, temp, clarity)
   
   Allowed soft plastics by lure:
{chr(10).join(terminal_rules)}
   
   IMPORTANT: soft_plastic_why must be CONTEXTUAL, not generic
   ✅ GOOD: "In late-fall with 68° water, creature baits create maximum displacement in stained conditions where bass locate by feel."
   ❌ BAD: "Creature baits have lots of appendages" (this is generic knowledge)

8. TRAILER RULES:
   If you choose lures that need trailers (chatterbait, swim jig, spinnerbait, casting jig, football jig), you MUST include:
   - trailer: choose from allowed trailers for that lure
   - trailer_why: 1-2 sentences explaining why THIS trailer for THESE conditions
   
   Allowed trailers by lure:
{chr(10).join(trailer_rules)}
   
   IMPORTANT: trailer_why must relate to current conditions
   ✅ GOOD: "With clear skies and calm water, a craw trailer keeps the profile compact for less aggressive fish in 68° water."
   ❌ BAD: "Craws look like crawfish" (generic)

8. CANONICAL TARGETS (choose 3-5 from this list ONLY - exact strings):
{json.dumps(CANONICAL_TARGETS, indent=2)}

9. DAY PROGRESSION RULES:
   - Exactly 3 lines: Morning/Midday/Late
   - Each line MUST start with "Morning:", "Midday:", or "Late:"
   - NO colors in day progression (no parentheses, no "in green pumpkin")
   - Be specific and tactical about what to do, not just "fish here"

10. WEATHER FORECAST (outlook_blurb):
   - 3-4 sentences describing the WEATHER FORECAST for the fishing day
   - Focus ONLY on weather conditions - NO bass behavior, NO fishing strategy, NO lure advice
   - Include: current conditions, how they might change throughout the day, and any factors that affect fishing
   - Use descriptive weather language but DO NOT repeat exact numbers from conditions
   - Mention things like: cloud cover changes, wind shifts, temperature trends, precipitation, pressure changes
   - Max ~80 words
   
   GOOD Examples:
   ✅ "Expect overcast skies throughout the morning with cloud cover gradually breaking up by early afternoon. Temperatures will climb from the low 50s to upper 60s as the day progresses. Light winds from the south will pick up to moderate speeds around midday. A warming trend is in effect, making afternoon conditions noticeably milder than morning."
   ✅ "Clear skies and bright sun dominate the forecast with minimal cloud cover expected. Temperatures remain stable in the mid-70s throughout the day. Calm morning conditions will give way to a steady southerly breeze by late morning. No precipitation expected, with high pressure keeping conditions stable."
   ✅ "Cloudy conditions persist all day with occasional breaks of filtered sunlight. A cold front passed overnight, leaving cooler temperatures and shifting winds. Morning starts calm but expect northwest winds to build through midday. Temperatures drop slightly as the day progresses - cooler afternoon than morning."
   
   BAD Examples (DO NOT DO THIS):
   ❌ "Bass will be active in these conditions" - NO bass behavior
   ❌ "Perfect for moving baits" - NO fishing strategy
   ❌ "With 55°F and 8 mph winds..." - NO exact numbers
   ❌ "Fish will be on points" - NO location advice

11. WORK IT / HOW TO FISH:
   - 3-5 tactical steps combining target + specific retrieve cadence
   - Each step should reference a target and explain HOW to fish it with THIS lure
   - Use specific retrieve instructions (drag-pause timing, twitch patterns, etc.)
   - Example: "On secondary points, drag 2-3 feet then pause 3-5 seconds - most bites come when the bait settles into the contour."
   - Example: "Work channel swings with a steady swim and brief stall when you tick cover - the pause triggers followers."
   - Use natural capitalization (not ALL CAPS)

12. WHY THIS WORKS:
   - ONLY explain why THIS SPECIFIC LURE was chosen for these conditions
   - Focus on: lure characteristics, presentation style
   - ALWAYS include a brief, casual mention of the two color options and when to use each
   - Format: End with something like "Go with [color1] in clearer water, [color2] when it's stained."
   - 2-3 sentences total
   
   GOOD Examples:
   ✅ "A chatterbait's vibration and flash mimics distressed baitfish, triggering reaction strikes from roaming bass in windward zones. Natural shad works in clear conditions, while chartreuse/white shines when visibility drops."
   ✅ "The carolina rig allows slow bottom contact with a natural presentation, perfect for pressured fish holding on structure. Lean toward watermelon in clear water, black/blue when it's stained."
   ✅ "Lipless cranks cover water fast and call fish from a distance with rattles—ideal for locating active winter bass. Ghost shad in clearer water, firetiger when visibility is low."
   
   BAD Examples:
   ❌ "Bass are positioning around spawning areas" - this is strategic overview, not lure-specific
   ❌ No mention of color guidance - MUST casually explain which color for which clarity
   ❌ "The conditions favor moving baits" - too general, explain why THIS lure specifically

13. STRATEGY PARAGRAPH (MEMBERS ONLY):
   - MUST be a flowing 2-3 sentence paragraph (NOT bullet points, NOT numbered list)
   - Cover positioning, wind adaptation, angle considerations, conditions-based adjustments
   - This is the big-picture tactical approach
   
   GOOD Example:
   ✅ "Start on windward points where bait concentrates and fish position to ambush. Use the wind to drift naturally along depth changes, repositioning for clean casts when you get a cue. In brighter conditions, prioritize shade edges and the first depth break rather than open flats."
   
   BAD Examples:
   ❌ "• Fish windward banks\n• Target points\n• Focus on shade" - These are bullets, not a paragraph
   ❌ "Fish the points. Then move to banks." - Too choppy, needs to flow

13. CRITICAL DEPTH RULE:
   - NEVER mention specific depths in feet (e.g., "15-30 feet", "8-12 feet")
   - You don't know the depth of the user's water body
   - Use RELATIVE depth language instead:
     ✅ "deeper water"
     ✅ "the first break"
     ✅ "transition zones"
     ✅ "offshore structure"
     ✅ "shallow water"
     ❌ "15-30 feet"
     ❌ "8-12 feet deep"

{pattern_2_section}

{output_format}

VALIDATION BEFORE RETURNING:
- presentation is from PRESENTATIONS
- base_lure is from LURE_POOL
- base_lure matches its presentation in LURE_TO_PRESENTATION
- colors are from COLOR_POOL (1-2 only)
- colors follow hardbait/black-blue restrictions
- targets are from CANONICAL_TARGETS (3-5 only)
- soft plastics mentioned in work_it are valid for the chosen lure
- trailers mentioned in work_it are valid for the chosen lure
- day_progression has no colors
- outlook_blurb has no exact temperature/wind numbers
- NO specific depth mentions anywhere

Use your bass fishing expertise to choose the BEST options from these pools based on conditions.
"""


# ----------------------------------------
# LLM Caller
# ----------------------------------------
async def call_openai_plan(
    weather: Dict[str, Any],
    location: str,
    trip_date: str,
    phase: str,
    is_member: bool = False,
) -> Optional[Dict[str, Any]]:
    """
    Call OpenAI to generate a plan.
    Returns None if LLM is disabled or call fails.
    
    Args:
        weather: Weather data dict
        location: Location name
        trip_date: Date string
        phase: Bass phase (winter, spawn, etc.)
        is_member: If True, generates primary + secondary patterns
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("LLM_PLAN: No API key")
        return None
    
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    
    # Build user input
    user_input = {
        "location": location,
        "trip_date": trip_date,
        "phase": phase,
        "weather": {
            "temp_f": weather.get("temp_f"),
            "temp_high": weather.get("temp_high"),
            "temp_low": weather.get("temp_low"),
            "wind_mph": weather.get("wind_mph") or weather.get("wind_speed"),
            "cloud_cover": weather.get("cloud_cover") or weather.get("sky_condition"),
            "clarity_estimate": weather.get("clarity_estimate"),
        }
    }
    
    system_prompt = build_system_prompt(include_pattern_2=is_member)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
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
                        {"role": "user", "content": json.dumps(user_input, indent=2)},
                    ],
                    "max_completion_tokens": 2500 if is_member else 1500,  # More tokens for Pattern 2
                },
            )
            
            if response.status_code != 200:
                print(f"LLM_PLAN: HTTP {response.status_code}")
                print(f"LLM_PLAN BODY: {response.text[:500]}")
                return None
            
            data = response.json()
            
            # Debug: Log the raw response
            print(f"LLM_PLAN: OpenAI response keys: {list(data.keys())}")
            
            if "choices" not in data or not data["choices"]:
                print(f"LLM_PLAN ERROR: No choices in response: {data}")
                return None
            
            content = data["choices"][0]["message"]["content"]
            
            # Debug: Log content length
            print(f"LLM_PLAN: Content length: {len(content)} chars")
            
            if not content or not content.strip():
                print(f"LLM_PLAN ERROR: Empty content from OpenAI")
                return None
            
            # Strip markdown fences if present
            content = content.strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(lines[1:-1] if lines[-1].strip().startswith("```") else lines[1:])
            
            # Debug: Show first 200 chars before parsing
            print(f"LLM_PLAN: Parsing JSON (first 200 chars): {content[:200]}")
            
            plan = json.loads(content)
            return plan
            
    except Exception as e:
        print(f"LLM_PLAN ERROR: {e}")
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
        prefixes = ["Morning:", "Midday:", "Late:"]
        for i, line in enumerate(day_prog):
            if not isinstance(line, str) or not line.startswith(prefixes[i]):
                errors.append(f"day_progression line {i} must start with '{prefixes[i]}'")
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
        for color in colors:
            if color not in COLOR_POOL:
                errors.append(f"{pattern_name}: Invalid color: {color}")
        
        # Validate colors for this lure
        color_errs = validate_colors_for_lure(base_lure, colors)
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