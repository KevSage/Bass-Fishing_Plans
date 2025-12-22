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

Rules:
- MUST use a different presentation family than Pattern 1
- MUST assume fish are positioned differently (if P1 assumes bottom, P2 assumes suspended or shallow)
- Explain in "why_this_works" what different assumption you're making

Example logic:
- If P1 is bottom-dragging (assumes fish on bottom), P2 could be vertical hover (assumes fish suspended)
- If P1 is horizontal reaction (assumes roaming fish), P2 could be bottom contact (assumes staged fish)
- If P1 is topwater (assumes surface feeding), P2 could be bottom contact (assumes fish pulled deeper)

Pattern 2 output format (add to JSON):
"secondary": {
  "presentation": "<different from primary>",
  "base_lure": "<from LURE_POOL>",
  "color_recommendations": ["<color1>", "<color2>"],
  "targets": ["<target1>", "<target2>", "<target3>"],
  "why_this_works": "<explain the pivot - what assumption changed>",
  "work_it": ["<tactical tip 1 with capitalized targets>", "...", "..."]
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
    "color_recommendations": ["<color1>", "<color2>"],
    "targets": ["<target1>", "<target2>", "<target3>"],
    "why_this_works": "<1-2 sentences>",
    "work_it": ["<tactical tip with Capitalized Targets>", "...", "..."]
  },
  "secondary": {
    "presentation": "<different from primary>",
    "base_lure": "<from LURE_POOL>",
    "color_recommendations": ["<color1>", "<color2>"],
    "targets": ["<target1>", "<target2>", "<target3>"],
    "why_this_works": "<explain the pivot>",
    "work_it": ["<tactical tip with Capitalized Targets>", "...", "..."]
  },
  "day_progression": ["Morning: ...", "Midday: ...", "Late: ..."],
  "outlook_blurb": "<2-3 sentences, descriptive weather, no exact temps/wind>"
}
"""
    else:
        output_format = """
OUTPUT FORMAT (JSON only - no markdown, no explanation):
{
  "presentation": "<one from PRESENTATIONS>",
  "base_lure": "<one from LURE_POOL - must match presentation>",
  "color_recommendations": ["<color1>", "<color2>"],
  "targets": ["<target1>", "<target2>", "<target3>"],
  "why_this_works": "<1-2 sentences explaining why this pattern fits conditions>",
  "work_it": [
    "<tactical tip 1 - include Capitalized Targets>",
    "<tactical tip 2>",
    "<tactical tip 3>",
    "<tactical tip 4>",
    "<tactical tip 5>",
    "<tactical tip 6>"
  ],
  "day_progression": [
    "Morning: <tactical sentence>",
    "Midday: <tactical sentence>",
    "Late: <tactical sentence>"
  ],
  "outlook_blurb": "<2-3 sentences about weather and fish behavior>"
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

5. COLOR RESTRICTIONS:
   - Metallic/firetiger colors (gold, bronze, silver, firetiger) can ONLY be used on hard baits: {sorted(HARDBAIT_LURES)}
   - black/blue is NOT allowed on hard baits or jerkbaits
   - For spinnerbait, color refers to SKIRT color (not blade finish)

6. TERMINAL TACKLE SOFT PLASTIC RULES:
   When suggesting soft plastics in "work_it" section for terminal tackle, you can ONLY mention plastics from these lists:
{chr(10).join(terminal_rules)}
   
   Example: For texas rig, you can suggest "creature bait" or "craw" but NOT "chunk" (that's jig-only)

7. TRAILER RULES:
   When suggesting trailers in "work_it" section:
{chr(10).join(trailer_rules)}
   
   Example: For chatterbait, you can suggest "craw" or "paddle tail swimbait" but NOT "chunk"

8. CANONICAL TARGETS (choose 3-5 from this list ONLY - exact strings):
{json.dumps(CANONICAL_TARGETS, indent=2)}

9. DAY PROGRESSION RULES:
   - Exactly 3 lines: Morning/Midday/Late
   - Each line MUST start with "Morning:", "Midday:", or "Late:"
   - NO colors in day progression (no parentheses, no "in green pumpkin")
   - Be specific and tactical about what to do, not just "fish here"

10. OUTLOOK BLURB:
   - 2-3 sentences explaining conditions and expected fish behavior
   - Use DESCRIPTIVE weather language (e.g., "cool water temperatures and overcast skies")
   - DO NOT repeat exact numbers shown in conditions (e.g., NOT "With 48°F and 8 mph wind...")
   - Reference the phase and what that means for bass activity
   - Max ~60 words
   - NO lure names in outlook
   
   Example: "Cool water temperatures and overcast skies have bass in deep winter mode. Fish will be lethargic and grouped on main-lake structure. Expect slow, methodical fishing with subtle bites - patience is key today."

11. WORK IT / HOW TO FISH:
   - Include SPECIFIC target names from your chosen targets
   - CAPITALIZE targets when mentioning them (e.g., "Focus on Secondary Points and First Depth Break")
   - Be tactical and actionable
   - Example: "Start on Secondary Points, dragging slowly along the First Depth Break where bass stage."

12. CRITICAL DEPTH RULE:
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
    
    # Check for depth mentions anywhere
    depth_pattern = r'\d+[-–]?\d*\s*(feet|ft|foot)\b'
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
    
    # Validate work_it mentions valid plastics/trailers
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