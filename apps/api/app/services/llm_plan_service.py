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
    "trailer": "<OPTIONAL - only for: chatterbait, swim jig, spinnerbait, casting jig, football jig, buzzbait>",
    "trailer_why": "<OPTIONAL - contextual explanation why THIS trailer for THESE conditions>",
    "color_recommendations": ["<color1>", "<color2>"],
    "targets": ["<target1>", "<target2>", "<target3>"],
    "why_this_works": "<3-4 sentences: lure choice + MANDATORY 'Choose X if Y' color format + optional trailer color>",
    "pattern_summary": "<2-3 sentences: presentation type + water column context + why this lure>",
    "strategy": "<3-4 sentences: conversational, 'bass are likely' logic, proper spacing after periods>",
    "work_it": ["<target + specific retrieve for this lure>", "...", "..."],
    "work_it_cards": [
      {
        "name": "<TARGET NAME from targets list>",
        "definition": "<1 sentence - what this target is>",
        "how_to_fish": "<2-3 sentences - how to fish THIS target with THIS lure>"
      }
    ]
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
    "why_this_works": "<3-4 sentences: lure choice + MANDATORY 'Choose X if Y' color format + optional trailer color>",
    "pattern_summary": "<2-3 sentences: presentation type + water column context + why this lure>",
    "strategy": "<3-4 sentences: conversational, 'bass are likely' logic, proper spacing after periods>",
    "work_it": ["<target + retrieve>", "...", "..."],
    "work_it_cards": [
      {
        "name": "<TARGET NAME>",
        "definition": "<what this target is>",
        "how_to_fish": "<how to fish it>"
      }
    ]
  },
  "day_progression": [
    "Morning: <2-3 sentences with proper spacing>",
    "Midday: <2-3 sentences with proper spacing>",
    "Evening: <2-3 sentences with proper spacing>"
  ],
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
  "why_this_works": "<2-3 sentences: lure choice + MANDATORY 'Choose X if Y' color format>",
  "work_it": [
    "<target name + specific retrieve cadence for this lure>",
    "<target name + specific retrieve cadence>",
    "<target name + specific retrieve cadence>"
  ],
  "work_it_cards": [
    {
      "name": "<TARGET NAME from targets list>",
      "definition": "<1 sentence - what this target is>",
      "how_to_fish": "<2-3 sentences - how to fish THIS target with THIS lure>"
    }
  ],
  "day_progression": [
    "Morning: <2-3 sentences with proper spacing after periods>",
    "Midday: <2-3 sentences with proper spacing after periods>",
    "Evening: <2-3 sentences with proper spacing after periods>"
  ],
  "outlook_blurb": "<weather forecast only - You can inlcude phase and regional logic related to bass activity, but NO bass strategy>"
}
"""
    
    return f"""You are BassFishingPlans (BFP), an expert bass fishing guide.

Your job: Generate a complete bass fishing plan based on weather, location, and date.

CRITICAL RULES - VIOLATE THESE AND THE PLAN IS REJECTED:

0. CRITICAL FORMATTING RULES (STRICTLY ENFORCED):
   - ALWAYS add a space after every period: "word. Word" NOT "word.Word"
   - This is tested automatically - missing spaces = INSTANT REJECTION
   - Check EVERY sentence in strategy, day_progression, why_this_works
   
1. COLOR EXPLANATION FORMAT (MANDATORY IN "why_this_works"):
   - You MUST use "Choose X if Y" format for colors
   - Format: "Choose [Color 1] if [water conditions]—[why it works]. Choose [Color 2] if [water conditions]—[why it works]."
   - Example: "Choose pro blue if fishing clear water—realistic baitfish pattern triggers strikes from bass keying on shad. Choose chartreuse if water is stained—high visibility creates strong contrast bass can see from distance."
   - This is NOT optional - every plan MUST include this color guidance
   - Missing this format = INSTANT REJECTION

2. PRESENTATIONS (choose ONE for primary pattern):
{json.dumps(PRESENTATIONS, indent=2)}

3. ALLOWED LURES (choose from this list ONLY - exact strings):
{json.dumps(LURE_POOL, indent=2)}

4. LURE → PRESENTATION MAPPING (lure MUST match its presentation):
{json.dumps(LURE_TO_PRESENTATION, indent=2)}

5. LURE-SPECIFIC COLOR POOLS (choose 1-2 colors based on YOUR CHOSEN LURE):

   RIG COLORS (for texas rig, carolina rig, shaky head, ned rig, neko rig, wacky rig, dropshot w/ finesse worm):
   {json.dumps(RIG_COLORS, indent=2)}
   
   BLADED/SKIRTED COLORS (for chatterbait, spinnerbait, buzzbait, underspin, swim jig, football jig, casting jig):
   {json.dumps(BLADED_SKIRTED_COLORS, indent=2)}
   
   SOFT SWIMBAIT COLORS (for soft jerkbait, paddle tail swimbait, dropshot w/ minnow):
   {json.dumps(SOFT_SWIMBAIT_COLORS, indent=2)}
   
   CRANKBAIT COLORS (for shallow crankbait, mid crankbait, deep crankbait, lipless crankbait, wake bait, blade bait):
   {json.dumps(CRANKBAIT_COLORS, indent=2)}
   
   JERKBAIT COLORS (for jerkbait ONLY):
   {json.dumps(JERKBAIT_COLORS, indent=2)}
   
   TOPWATER COLORS (for walking bait, whopper plopper, popper):
   {json.dumps(TOPWATER_COLORS, indent=2)}
   
   FROG COLORS (for hollow body frog, popping frog):
   {json.dumps(FROG_COLORS, indent=2)}
   
   CRITICAL: You MUST use colors from the pool that matches YOUR CHOSEN LURE.
   Example: If you choose "jerkbait", use JERKBAIT_COLORS only.
   Example: If you choose "texas rig", use RIG_COLORS only.

6. COLOR VARIETY RULE:
   - When choosing 2 colors, they MUST be from different color families
   - BAD: "watermelon" + "green pumpkin" (both natural greens)
   - BAD: "shad" + "natural shad" (both shad colors)
   - BAD: "chartreuse" + "chartreuse/white" (same base)
   - GOOD: "watermelon" + "black/blue" (natural + contrast)
   - GOOD: "shad" + "firetiger" (natural + high-contrast)
   - GOOD: "green pumpkin" + "white" (natural + pelagic)
   
7. COLOR RESTRICTIONS:
   - Metallic/firetiger colors (gold, bronze, silver, firetiger) can ONLY be used on hard baits: {sorted(HARDBAIT_LURES)}
   - black/blue is NOT allowed on hard baits or jerkbaits
   - For spinnerbait, color refers to SKIRT color (not blade finish)

8. TERMINAL TACKLE SOFT PLASTIC RULES:
   If you choose terminal tackle (texas rig, carolina rig, dropshot, neko rig, wacky rig, ned rig, shaky head), you MUST include:
   - soft_plastic: choose from allowed plastics for that lure
   - soft_plastic_why: 1-2 sentences explaining why THIS plastic for THESE conditions (phase, temp, clarity)
   
   Allowed soft plastics by lure:
    {chr(10).join(terminal_rules)}
   
   IMPORTANT: soft_plastic_why must be CONTEXTUAL, not generic
   ✅ GOOD: "In late-fall with 68° water, creature baits create maximum displacement in stained conditions where bass locate by feel."
   ❌ BAD: "Creature baits have lots of appendages" (this is generic knowledge)

10. TRAILER RULES:
   If you choose lures that need trailers (chatterbait, swim jig, spinnerbait, casting jig, football jig), you MUST include:
   - trailer: choose from allowed trailers for that lure
   - trailer_why: 1-2 sentences explaining why THIS trailer for THESE conditions
   
   Allowed trailers by lure:
{chr(10).join(trailer_rules)}
   
   IMPORTANT: trailer_why must relate to current conditions
   ✅ GOOD: "With clear skies and calm water, a craw trailer keeps the profile compact for less aggressive fish in 68° water."
   ❌ BAD: "Craws look like crawfish" (generic)

   CRITICAL - FIELD USAGE:
   ❌ NEVER put soft_plastic on jigs (casting jig, football jig, swim jig) - they use "trailer" field
   ❌ NEVER put trailer on terminal tackle (carolina rig, texas rig, drop shot) - they use "soft_plastic" field
   
   When you choose a jig (casting jig, football jig, swim jig)  → set soft_plastic to null, use trailer field
   When you choose terminal tackle → set trailer to null, use soft_plastic field

11. CANONICAL TARGETS (choose 3-5 from this list ONLY - exact strings):
{json.dumps(CANONICAL_TARGETS, indent=2)}
    CRITICAL - FIELD USAGE:
    You must only use targets from the CANNONICAL_TARGETS pool
    ❌ NEVER use "insulated target"

12. DAY PROGRESSION (EXTENDED FORMAT):
   - Exactly 3 time blocks: Morning / Midday / Evening (or Late)
   - Length: 2-3 sentences PER time block (not just 1 sentence)
   - Each time block MUST start with "Morning:", "Midday:", or "Evening:" (or "Late:")
   - NO colors in day progression (no parentheses, no "in green pumpkin")
   
   Each time block should cover:
   - Where + Why: Location/target type and bass behavior at this time
   - How: Tactical adjustment specific to this time period
   - Key insight: What to expect or prioritize
   
   CRITICAL FORMATTING:
   - Proper spacing after periods (this is frequently missed - ensure spaces!)
   - Conversational tone
   - Vary sentence structure (don't start multiple sentences the same way)
   
   GOOD Example:
   ✅ "Morning: Start on main lake points where bass position to ambush baitfish moving with first light. Low light conditions allow fish to roam more aggressively, so cover water efficiently and focus on wind-blown banks where bait concentrates. Most strikes happen in the first hour as fish are actively feeding."
   
   BAD Examples:
   ❌ "Morning: Main lake points" - way too brief
   ❌ "Midday: Fish deeper using green pumpkin" - mentions colors (not allowed)
   ❌ "Low light: hover higher.Set countdown rule..." - missing space after period
   ❌ "Low light: hover higher. Low light extends roaming..." - repetitive starts

13. WEATHER FORECAST (outlook_blurb):
   - 3-4 sentences describing the WEATHER FORECAST for the fishing day
   - Focus ONLY on weather conditions - General seasonal bass behavior, NO fishing strategy, NO lure advice
   - Include: current conditions, how they might change throughout the day, and any factors that affect fishing
   - Use descriptive weather language but DO NOT repeat exact numbers from conditions
   - Mention things like: cloud cover changes, wind shifts, temperature trends, precipitation, pressure changes
   - Max ~80 words
   
   GOOD Examples:
   ✅ "Expect overcast skies throughout the morning with cloud cover gradually breaking up by early afternoon. Temperatures will climb from the low 50s to upper 60s as the day progresses. Light winds from the south will pick up to moderate speeds around midday. A warming trend is in effect, making afternoon conditions noticeably milder than morning."
   ✅ "Clear skies and bright sun dominate the forecast with minimal cloud cover expected. Temperatures remain stable in the mid-70s throughout the day. Calm morning conditions will give way to a steady southerly breeze by late morning. No precipitation expected, with high pressure keeping conditions stable."
   ✅ "Cloudy conditions persist all day with occasional breaks of filtered sunlight. A cold front passed overnight, leaving cooler temperatures and shifting winds. Morning starts calm but expect northwest winds to build through midday. Temperatures drop slightly as the day progresses - cooler afternoon than morning."
   
   BAD Examples (DO NOT DO THIS):
   ❌ "Perfect for moving baits" - NO fishing strategy
   ❌ "With 55°F and 8 mph winds..." - NO exact numbers
   ❌ "Fish will be on points" - NO location advice

14. WORK IT / HOW TO FISH:
   - 3-5 tactical steps combining target + specific retrieve cadence
   - Each step should reference a target and explain HOW to fish it with THIS lure
   - Use specific retrieve instructions (drag-pause timing, twitch patterns, etc.)
   - Example: "On secondary points, drag 2-3 feet then pause 3-5 seconds - most bites come when the bait settles into the contour."
   - Example: "Work channel swings with a steady swim and brief stall when you tick cover - the pause triggers followers."
   - Use natural capitalization (not ALL CAPS)

15. WHY THIS WORKS:
   - ONLY explain why THIS SPECIFIC LURE was chosen for these conditions
   - Focus on: lure characteristics, presentation style
   - MUST include color explanation using "Choose X if Y" format:
     * "Choose [Color 1] if [conditions] — [bass behavior/why it works]. Choose [Color 2] if [conditions] — [bass behavior/why it works]."
     * Example: "Choose sexy shad if fishing clear to slightly stained water—realistic shad pattern triggers strikes from bass feeding on natural baitfish. Choose chartreuse/black back if your water is stained or muddy—high visibility chartreuse creates strong contrast bass can see from distance."
   - Add ONE sentence about soft plastic/trailer color choice if applicable.
   - Length: 4-5 sentences total (lure choice + color explanation + optional trailer color)
   - Format: End with something like "Go with [color1] in clearer water, [color2] when it's stained."
   - 4-5 sentences total
   
   GOOD Examples:
   ✅ "A chatterbait's vibration and flash mimics distressed baitfish, triggering reaction strikes from roaming bass in windward zones. Natural shad works in clear conditions, while chartreuse/white shines when visibility drops."
   ✅ "The carolina rig allows slow bottom contact with a natural presentation, perfect for pressured fish holding on structure. Lean toward watermelon in clear water, black/blue when it's stained."
   ✅ "Lipless cranks cover water fast and call fish from a distance with rattles—ideal for locating active winter bass. Ghost shad in clearer water, firetiger when visibility is low."
   
   BAD Examples:
   ❌ "Bass are positioning around spawning areas" - this is strategic overview, not lure-specific
   ❌ No mention of color guidance - MUST casually explain which color for which clarity
   ❌ "The conditions favor moving baits" - too general, explain why THIS lure specifically

16. PATTERN SUMMARY:
   - 2-3 sentences introducing the presentation and lure choice
   - MUST cover:
     * What this presentation family is (e.g., "Vertical Reaction")
     * If lure is for vertical/suspended presentations: mention water column ("works the water column", "targets suspended fish")
     * Why THIS LURE was chosen for current conditions
     * Key behavioral trigger
   - Use positive framing only (don't say what it's NOT)
   
   GOOD Example:
   ✅ "Vertical Reaction presentations work the water column with erratic stop-and-go action, targeting suspended bass and fish holding along depth transitions. A jerkbait excels in these post-frontal conditions because its suspending capability and darting motion pulls reaction strikes from fish in open water."
   
   BAD Examples:
   ❌ "Vertical Reaction is not a bottom presentation" - negative framing
   ❌ Missing water column context for vertical presentations

17. STRATEGY PARAGRAPH:
   - 3-4 sentences covering environmental/positional tactics
   - Use "Bass are likely doing X because Y, so you do Z" logic
   - CONVERSATIONAL tone: "give each spot a fair shake", "don't bail too quick", "if things go quiet"
   - Must complement (NOT contradict) targets and day_progression sections
   - Cover: mobility/pacing, light/shade, positioning, casting angles, adjustment protocol
   - NO specific structure types (use "high-percentage areas", "productive water")
   - NO retrieve mechanics (that's in work_it_cards)
   - CRITICAL: Proper spacing after periods, vary sentence structure
   
   GOOD Example:
   ✅ "Post-frontal conditions tend to scatter bass and push them into a neutral mood, so give each spot a fair shake—10 to 15 casts usually tells you if fish are home. Look for shade lines and depth breaks where bass can sit without working too hard, and position yourself to cast along these edges rather than across them. If things go quiet, don't bail too quick—bass often shift position with changing light, so try different angles and adjust where you're casting before moving on."
   
   BAD Examples:
   ❌ "Fish points and ledges" - mentions specific structures
   ❌ "Use a slow retrieve" - mentions retrieve mechanics
   ❌ "Low light: hover higher.Set countdown rule..." - missing spaces, bad formatting
   ❌ "Low light: hover higher. Low light extends..." - repetitive sentence starts

18. CRITICAL DEPTH RULE:
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

Use your bass fishing expertise to choose the BEST options from these pools based on bass seasonal phase and the user's local weather, conditions, and regional location for the day.
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