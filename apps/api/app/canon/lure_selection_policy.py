# app/canon/lure_selection_policy.py
"""
Lure selection policy prompt block for Bass Clarity.
This file contains ONLY LLM-facing lure selection policy instructions (prompt text).
SINGLE SOURCE OF TRUTH for all lure, soft plastic, trailer, and color decisions.
"""

LURE_SELECTION_POLICY_PROMPT = r"""
LURE SELECTION POLICY (LOCKED) — Deterministic Weather Lean + Season + Forage Profile
Goal: Create an exciting, trustworthy "read of the day" using ONLY conditions/season/trends (no user feedback). Variety must be earned, never random.

You MUST decide selections deterministically using this order:
1) Inference (Clarity/Phase) → 2) Season/Phase → 3) Day Lean → 4) Hero Moments (Overrides) → 5) Presentation/Lure → 6) Soft Plastic/Trailer → 7) Colors → 8) Targets

NOTE: Canonical pools (PRESENTATIONS, LURE_POOL, LURE_TO_PRESENTATION, color pools, etc.) are provided separately in the system prompt as JSON.
Use those exact values when selecting lures, presentations, colors, soft plastics, and trailers.

🔄 REGENERATION & VARIETY (HARD CONSTRAINTS - NO EXCEPTIONS):
When user context includes "Recent lures" or explicit "FORBIDDEN" constraints:
1. ABSOLUTE HARD CONSTRAINT: You MUST NOT select any lure listed as "Recent" or "Forbidden" as your Primary OR Secondary choice. There are NO exceptions to this rule.
2. TACTICAL PIVOT REQUIRED: If the "Day Lean" strongly points to a Forbidden lure (e.g. Jerkbait is optimal but forbidden), you MUST pivot to:
   - The "Next Best" lure within the same Lean (e.g. Blade Bait, Flat-Sided Crankbait, or Underspin for Reaction lean).
   - OR a different Presentation Family entirely (e.g. switching from Reaction to Control or Finesse).
3. "OPTIMAL" IS NEVER AN EXCUSE: Seasonal bias or conditions-based preference does NOT override the FORBIDDEN constraint. The "Next Best" valid option is ALWAYS the correct answer.
4. JERKBAIT BIAS CHECK: If Jerkbait is forbidden and you're in a cold-water Reaction lean, consider: Blade Bait, Flat-Sided Crankbait, Lipless Crankbait (yo-yo), Underspin, or pivot to Football Jig / Ned Rig.

═══════════════════════════════════════════════════════════════════════════════
A) INFERENCE LAYER (DERIVING HIDDEN VARIABLES)
═══════════════════════════════════════════════════════════════════════════════
You do not have direct water clarity or spawn data. You MUST infer them from weather signals to unlock specific lures.

1. CLARITY INFERENCE (The "Visual" Environment):
   - MUDDY SIGNAL: IF recent_rain > 0.5" OR precipitation_1h > 0.1 → Assume Runoff/Stain.
     * Effect: KILL visual baits (Jerkbait, Spybait). BOOST vibration (Chatterbait, Squarebill).
   - TURBID SIGNAL: IF wind_mph > 15 OR past_wind_mph > 15 → Assume Wind-Blown Turbidity.
     * Effect: BOOST Flash (Spinnerbait, Underspin). BOOST Noise (Crankbait).
   - CLEAR SIGNAL: IF wind < 8mph AND No Recent Rain → Assume Settling/Clear.
     * Effect: UNLOCK Visual baits (Jerkbait, Spybait, Topwater). FORCE Natural colors.

2. BIOLOGICAL PHASE INFERENCE (The "Mood"):
   - HIGH PRESSURE (Bluebird Sky) + COLD FRONT (Temp Drop):
     * Effect: Fish are glued to bottom or buried in cover. INACTIVE.
     * Force: Finesse (Ned/Drop Shot) OR Reaction-on-Fish (Blade Bait/Football Jig).
   - LOW PRESSURE (Storm/Cloud) + STABLE/WARM:
     * Effect: Fish are roaming/hunting. ACTIVE.
     * Force: Power Search (Chase baits).

═══════════════════════════════════════════════════════════════════════════════
B) SEASON / PHASE (BROAD, TRUST-SAFE)
═══════════════════════════════════════════════════════════════════════════════
- You do NOT have lake ecology or spawn confirmation. Do NOT claim certainty (no "they are spawning").
- Use broad seasonal framing based on date + temperature behavior only:
  • Winter / Cold Water
  • Early Spring Transition
  • Late Spring Transition
  • Summer
  • Fall Transition
- Season controls plausibility:
  • Winter / cold trends: slower, tighter windows; reaction baits must be more measured (pause/trigger).
  • Fall transition: baitfish-style windows open more often; wind matters more.
  • Summer: early/late reaction windows; midday control/finesse more often under bright/high pressure.

═══════════════════════════════════════════════════════════════════════════════
C) FORAGE PROFILE (PROFILE ONLY — NO SPECIES CLAIMS)
═══════════════════════════════════════════════════════════════════════════════
You do NOT know exact forage species. Use ONLY profile language:
- "baitfish-style profile" (flash/chase)
- "bottom-protein profile" (contact/crawl/drag)
- "compact profile" (smaller meal around cover)
- "micro profile" (tiny/finesse)

Forage profile is inferred from season + light + wind + pressure:
- Wind + cloud + fall-ish cues → baitfish-style profile
- Bright + calm + rising pressure OR very cold/calm → micro profile
- Neutral/cold or bottom-control cues → bottom-protein profile
- Warm/bright transition days → compact profile (do not mention bluegill)

═══════════════════════════════════════════════════════════════════════════════
D) DETERMINE TODAY'S "DAY LEAN" (ONE WINNER — DETERMINISTIC)
═══════════════════════════════════════════════════════════════════════════════
Pick exactly ONE lean. This is the day's personality:
1) POWER SEARCH (Wind Lean)
2) REACTION (Low Light / Trigger Lean)
3) FINESSE (High Pressure / Calm / Bright Lean)
4) FRONT / INSTABILITY (Falling Pressure / Swingy Conditions Lean)
5) CONTROL (Neutral Lean — default)

Use these deterministic cues (no random):

1. POWER SEARCH:
   - IF wind is strong (>12mph) OR gusty (>20mph).
   - IF 'past_wind' was strong (>15mph) and current is moderate (Lag Effect).
   
2. REACTION:
   - IF low light/overcast is dominant (Cloud Cover > 60%).
   - IF pressure is "Falling Fast" (Storm Front) -> Fish become aggressive even in cold.
   - IF "Snow/Rain" is present -> Active feeding window.
   
3. FINESSE:
   - IF pressure trend is "Rising" or "High/Stable".
   - AND Sky is Clear/Bright.
   - AND Wind is Light (<8mph).
   
4. FRONT / INSTABILITY:
   - IF pressure is "Falling" but wind is not dominant.
   - IF rapid temperature drop (Cold Front) -> forces defensive posture.
   
5. CONTROL:
   - Default if no extreme conditions exist.
   - Winter baseline (unless warming trend exists).

═══════════════════════════════════════════════════════════════════════════════
E) LEAN → PREFERRED PRESENTATION FAMILIES + LURE FAMILIES
═══════════════════════════════════════════════════════════════════════════════
When multiple options are valid, the lean decides which correct answer to LEAN INTO.

🚨 COLD WATER VARIETY RULE (Below 55°F):
- Do NOT auto-default to Jerkbait for every Reaction read.
- Do NOT auto-default to Dropshot for every Finesse read.
- USE THE FULL MENU below to match specific conditions (Wind/Stain/Depth).

POWER SEARCH (Wind Lean):
- Cold Water Options: 
  • Lipless Crankbait (Yo-Yo/Lift-Drop) -> Best for grass/flats.
  • Medium/Deep Crankbait (Tight Wobble) -> Best for rock/channel swings.
  • Spinnerbait (Slow Roll) -> Best for wind-blown wood/stumps.
  • Underspin -> Best for suspended fish in wind.
- Warm Water Options: Chatterbait, Squarebill, Swim Jig, Topwater, Mid Crankbait (Transitions).

REACTION (Low Light / Trigger Lean):
- Cold Water Options:
  • Jerkbait -> Visual trigger, clear water, suspending fish.
  • Flat-Sided Crankbait -> Thumping trigger, stained water, rock.
  • Blade Bait (Silver Buddy) -> Vertical reaction, deep water.
  • Underspin -> Subtle flash, finesse reaction.
- Warm Water Options: Chatterbait, Spinnerbait, Topwater, Wake Bait (High Water).

FINESSE (High Pressure / Calm / Bright Lean):
- Cold Water Options:
  • Ned Rig -> Deadsticking on bottom (better than dropshot for pinning to floor).
  • Neko Rig -> Deep structure, soft bottom (won't bury in silt).
  • Dropshot -> Suspended fish or vertical brush.
  • Jighead Minnow -> Suspended fish, "Damiki" style.
- Warm Water Options: Wacky Rig, Shaky Head, Weightless Senko, Neko Rig.

FRONT / INSTABILITY Lean:
- Cold Water Options:
  • Jerkbait -> The pause triggers hesitant fish.
  • Football Jig -> Dragging deep structure (defensive but big meal).
  • Lipless Crankbait -> Reaction strike from defensive fish.
  • Blade Bait -> Triggering dormant fish via vibration.

CONTROL (Neutral Lean):
- Cold Water Options:
  • Football Jig -> Deep rock/ledges (The "Winter Standard").
  • Casting Jig -> Wood/Docks.
  • Texas Rig (Creature) -> Penetrating heavy cover.
  • Shaky Head -> Rock transitions.

═══════════════════════════════════════════════════════════════════════════════
F) HERO MOMENT UNLOCKS (WEATHER-DRIVEN OVERRIDES)
═══════════════════════════════════════════════════════════════════════════════
Use these triggers to unlock "Specialist" lures over the "Generals" defined in Section E.
🚨 IMPORTANT: If you select a Hero Lure, you MUST explicitly recommend its required TARGET in the strategy.

1. FLAT-SIDED CRANKBAIT (The "Cold Stain" Specialist)
   - WEATHER TRIGGER: Temp < 55°F AND (Recent Rain OR Wind > 15mph).
   - WHY: Jerkbait fails because fish can't see the pause in inferred stain. Flat-Side wins via tight vibration.
   - TARGET REQUIREMENT: Rock, Riprap, 45° Banks.

2. BLADE BAIT / SILVER BUDDY (The "Deep Shock" Specialist)
   - WEATHER TRIGGER: Winter (< 50°F) AND High Pressure (Bluebird Sky) AND Low Wind.
   - WHY: Fish are glued to bottom and inactive (Won't chase). They ignore a drag (Jig) but react to the vertical "Snap-Fall" right in their face.
   - TARGET REQUIREMENT: Deep Structure, Clean Bottom (Gravel/Shell) - *Must avoid wood*.

3. UNDERSPIN (The "Windy Suspension" Specialist)
   - WEATHER TRIGGER: Winter/Pre-Spawn AND Wind > 12mph AND Sun.
   - WHY: A standard swimbait gets lost in the chop. The blade adds flash to cut through the turbidity/wave action.
   - TARGET REQUIREMENT: Suspended off Points, Bridge Pilings, Creek Channels.

4. WAKE BAIT (The "Flooded Cover" Specialist)
   - WEATHER TRIGGER: Post-Spawn/Summer AND Recent Rain > 1.0" (Inferred High Water) AND Wind < 8mph.
   - WHY: High water floods bushes. Squarebills snag the middle; Buzzbaits move too fast. Wake bait crawls *over* the top.
   - TARGET REQUIREMENT: Flooded Bushes, High Water Line.

5. NEKO RIG (The "Silt" Specialist)
   - WEATHER TRIGGER: Post-Frontal (High Sun) AND (Summer OR Winter).
   - WHY: Fish are deep and negative. A Shaky Head buries in the soft bottom/silt. Neko Rig stays visible on top of the muck.
   - TARGET REQUIREMENT: Deep Docks, Deep Brush, Soft Bottom Structure.

6. MID-DEPTH CRANKBAIT (The "Transition" Specialist)
   - WEATHER TRIGGER: Temp 50-65°F (Transition) AND Cloud Cover > 50%.
   - WHY: Fish are staging on the "First Break" (8-12ft). Squarebill is too shallow; Deep Diver digs too hard.
   - TARGET REQUIREMENT: Channel Swings, Transition Banks.

═══════════════════════════════════════════════════════════════════════════════
G) PRIMARY + SECONDARY SELECTION RULES
═══════════════════════════════════════════════════════════════════════════════
PRIMARY:
- Apply HERO MOMENTS first. If a Weather Trigger hits, that is your Primary.
- If no Hero Moment, apply STANDARD LOGIC based on Day Lean:
  • Clear + Open -> Jerkbait, Underspin, Dropshot.
  • Stained + Rock -> Crankbait, Football Jig.
  • Stained + Wood -> Spinnerbait, Casting Jig.

SECONDARY (PIVOT) - BREAK THE "DEFAULT PAIRS":
- **ANTI-BOREDOM RULE:** If Primary is Jerkbait, Secondary should NOT be Dropshot unless conditions are extreme (slick calm/high pressure).
- TRY THESE PIVOTS INSTEAD:
  • Jerkbait (Suspended) → Football Jig (Bottom Pinned) [Depth Pivot]
  • Jerkbait (Visual) → Crankbait (Vibration) [Speed Pivot]
  • Lipless Crankbait (Speed) → Ned Rig (Deadstick) [Tempo Pivot]
  • Football Jig (Slow) → Blade Bait (Reaction) [Trigger Pivot]

- MUST be a different presentation family.
- MUST represent a plausible "counter-lean" for today.

SEARCH AND PICK APART (CONDITIONAL STRATEGY):
- If Primary is Fast (Crankbait/Lipless), Secondary can be Slow (Jig/Ned).
- This is the classic 1-2 punch.

═══════════════════════════════════════════════════════════════════════════════
H) SPECIALIZED LONG-LINE RIGS (GENERAL RULE — NO ESSAYS)
═══════════════════════════════════════════════════════════════════════════════
- Avoid over-selecting specialized slow long-line rigs when versatile bottom-contact options are equally valid.
- If multiple bottom-contact options fit, prefer texas rig / jigs / shaky head over carolina rig unless conditions clearly favor slow, methodical dragging and targets support it.

═══════════════════════════════════════════════════════════════════════════════
I) SOFT PLASTIC & TRAILER SELECTION (MATCHES DAY LEAN + FORAGE PROFILE)
═══════════════════════════════════════════════════════════════════════════════

🚨🚨🚨 CRITICAL: FIELD SELECTION DECISION TREE 🚨🚨🚨

STEP 1: Look at your base_lure
STEP 2: Follow this decision tree EXACTLY:

IF base_lure is texas rig, carolina rig, dropshot, ned rig, shakey head, wacky rig, OR neko rig:
  → SET soft_plastic = "<choose from options below>"
  → SET soft_plastic_why = "<explanation>"
  → SET trailer = null
  → SET trailer_why = null
  
IF base_lure is casting jig, football jig, swim jig, chatterbait, spinnerbait, OR buzzbait:
  → SET soft_plastic = null
  → SET soft_plastic_why = null
  → SET trailer = "<choose from options below>"
  → SET trailer_why = "<explanation>"
  
IF base_lure is ANY OTHER lure (crankbaits, jerkbaits, topwaters, frogs, blade bait, jighead minnow, etc.):
  → SET soft_plastic = null
  → SET soft_plastic_why = null
  → SET trailer = null
  → SET trailer_why = null

MATCHING PROFILE TO INFERENCE:
- If CLARITY INFERENCE is MUDDY/TURBID → Use bulky profiles, active trailers (paddle tails, active claws).
- If CLARITY INFERENCE is CLEAR → Use micro profiles, subtle trailers (chunks, straight tails).

VALIDATION WILL FAIL IF YOU:
❌ Set soft_plastic for a jig (casting jig, football jig, swim jig) → Use trailer field instead!
❌ Set trailer for terminal tackle (texas rig, carolina rig, etc.) → Use soft_plastic field instead!
❌ Set soft_plastic="craw" for football jig → WRONG FIELD! Should be trailer="craw"
❌ Set trailer="creature bait" for texas rig → WRONG FIELD! Should be soft_plastic="creature bait"

✅ CORRECT EXAMPLES:
  football jig: soft_plastic=null, trailer="craw"
  texas rig: soft_plastic="creature bait", trailer=null
  chatterbait: soft_plastic=null, trailer="paddle tail swimbait"
  shallow crankbait: soft_plastic=null, trailer=null

Soft plastics and trailers must express the same read as the lure.
Selection follows: Day Lean → Forage Profile → Target Structure

🚨 USE EXACT STRINGS FROM CANONICAL POOLS ABOVE

TERMINAL TACKLE SOFT PLASTICS:

POWER SEARCH / REACTION Leans:
- Baitfish-style profile → ribbon tail worm (action/swimming tail)
- Bottom-protein profile → creature bait (bulk, appendages, active)
- Moving presentation, current/chop advantage

FINESSE Lean:
- Micro profile → finesse worm, stickbait (subtle, natural, minimal action)
- Bottom-protein profile → finesse worm, craw (compact, natural)
- Avoid bulk - use minimal profile, slow/dead presentation

CONTROL / FRONT Leans:
- Bottom-protein profile → craw, creature bait (defensive posture, natural)
- Cover-oriented targets → creature bait, lizard (bulk for flipping heavy cover)
- Structure-oriented targets → craw (natural bottom dweller)

TRAILER SELECTION (Jigs & Bladed Baits):

POWER SEARCH Lean:
- Baitfish-style profile → paddle tail swimbait, soft jerkbait (swimming/kicking action)
- Bottom-protein profile → craw with action appendages

REACTION / FRONT Leans:
- Baitfish-style → paddle tail swimbait, soft jerkbait (active kicking)
- Aggressive feeding → craw with claws (profile change triggers strikes)

FINESSE Lean:
- Subtle profile → chunk (compact, minimal action)
- Avoid large paddle tail swimbait or active trailers

CONTROL Lean:
- Bottom-protein → craw, chunk (mimics natural forage)
- Heavy cover → chunk (compact for penetration)

DROPSHOT SPECIAL CASES:
- Baitfish-style profile → small minnow (suspended baitfish imitation)
- Micro profile → finesse worm (subtle hovering presentation)

NED RIG SPECIAL CASE:
- Always use ned worm or ned craw (required for buoyancy)
- Micro profile → ned worm
- Bottom-protein profile → ned craw

RULES:
- Soft plastic/trailer MUST be EXACT string from canonical pools above
- Soft plastic/trailer MUST match lure's Day Lean role
- Do NOT pick creature bait for finesse presentations
- Do NOT pick paddle tail swimbait trailers for finesse/control leans when fishing slow
- Match profile size to forage profile

═══════════════════════════════════════════════════════════════════════════════
J) COLOR SELECTION (MANDATORY LOOKUP + INFERENCE OPTIMIZATION)
═══════════════════════════════════════════════════════════════════════════════

🚨 CRITICAL: This is the ONLY authoritative source for color selection. Follow exactly.
You MUST return exactly TWO colors for each lure, both copied EXACTLY from the lure's canonical color pool.

OUTPUT CONTRACT (NON-NEGOTIABLE):
- Option A: CLEAR-TO-AVERAGE water color (user chooses this if the water looks clear or lightly stained)
- Option B: STAINED-TO-MUDDY water color (user chooses this if visibility is reduced / stained / muddy)

OPTIMIZATION RULES (USING INFERENCE FROM SECTION A):
1. IF "MUDDY SIGNAL" (Rain/Runoff):
   - Shift Option B to MAXIMUM SHOCK (Chartreuse/Black, Fire Craw).
   - Even Option A should be bolder (Solid opaque colors, not ghost).

2. IF "TURBID SIGNAL" (Wind):
   - Shift Option B to FLASH/METALLIC (White/Chartreuse, Gold, Chrome).
   - Wind hides detail, so flash is key.

3. IF "CLEAR SIGNAL" (Settling):
   - Shift Option A to GHOST/TRANSLUCENT (Ghost Minnow, Green Pumpkin Natural).
   - Option B should be moderate (Opaque but natural, e.g., Sexy Shad).

STEP 1: LOOKUP YOUR LURE'S COLOR POOL (REQUIRED - DO THIS FIRST)
1) Find your base_lure in LURE_COLOR_POOL_MAP
2) This tells you which pool list to use (e.g., BLADED_SKIRTED_COLORS, CRANKBAIT_COLORS, etc.)

STEP 2: CONSTRAIN TO THAT POOL ONLY (ABSOLUTE RULE)
- You may ONLY select colors from that pool.
- Copy color strings EXACTLY as they appear (no invented names, no reordering slash tokens).

STEP 3: USE DETECTABILITY TAGS + POOL PREFERENCES (MANDATORY)
Canonical tag sets are provided:
- COLOR_DETECTABILITY_TAGS: maps color string -> tag in {REALISM, SILHOUETTE, REFLECTIVE, SIGNAL}
- POOL_DETECTABILITY_PREFERENCE: maps pool name -> prioritized tag order

Tag meaning:
- REALISM = credible/forage-aligned, low noise
- SILHOUETTE = dark value / outline detectability (can be "natural" especially for bottom-contact)
- REFLECTIVE = flash/edge definition (IMPORTANT: "chartreuse/white" is REFLECTIVE, NOT SIGNAL)
- SIGNAL = true fluorescent / loud (last resort only)

STEP 4: BUILD A "CONTRAST PROFILE" FROM CONDITIONS (BEFORE PICKING COLORS)
Use these deterministic modifiers to decide WHICH TAGS are preferred today:
- Bright sun / high penetration → bias toward REALISM (A) and controlled contrast; penalize SIGNAL
- Overcast / low light → increase SILHOUETTE value; allow stronger contrast
- Wind / chop → increase REFLECTIVE value (especially for bladed/reaction baits)
- Staining/runoff trend → increase detectability strength for Option B (may allow SIGNAL if truly severe)
- Clearing trend → increase REALISM strength for Option A

STEP 5: SELECT EXACTLY TWO COLORS (A and B) WITHIN THE POOL
A) Option A (Clear-to-Average):
- Choose the best REALISM-leaning choice for current light, with SILHOUETTE allowed when low light makes it the credible read.
- Use the pool's detectability preferences + tags; do NOT jump to SIGNAL.

B) Option B (Stained-to-Muddy):
- Choose the most detectable choice using the preferred mechanism for today:
  • Bladed/reaction pools: prefer REFLECTIVE first (flash/edge)
  • Bottom-contact pools: prefer SILHOUETTE first (dark outline)
  • Hardbait pools: prefer REALISM pattern first, then REFLECTIVE, then SILHOUETTE
- SIGNAL is allowed ONLY when visibility is severely compromised (strong staining trend / muddy conditions).
- Never treat "stained" as "bright by default."

STEP 6: DAY LEAN IS A TIEBREAKER ONLY (ABSOLUTE LIMIT)
- Day Lean may break ties BETWEEN equally valid colors of the SAME TAG within the pool.
- Day Lean must NEVER escalate intensity, override tag preferences, or redefine Option A/B.

EARNED VARIETY (STILL POOL-BOUND):
- If primary and secondary share the same color pool, prefer different color pairs when reasonable.
- Do not duplicate the same two colors for both lures unless the pool is very small or conditions strongly demand it.

ABSOLUTE RULES (NON-NEGOTIABLE):
- Colors MUST be exact strings from the pool you looked up in STEP 1
- Do NOT invent tokens, combine tokens, or reorder slash tokens
- Do NOT use weather to guess clarity; weather only optimizes A and B internally
- Do NOT over-weight Day Lean for color selection

═══════════════════════════════════════════════════════════════════════════════
K) TARGET SELECTION POLICY
═══════════════════════════════════════════════════════════════════════════════

DECISION ORDER:
You have determined your Day Lean and selected your lures based on conditions.
Now select 3 targets that align with your Day Lean strategy and are compatible with your lures.

STEP 1: IDENTIFY DAY LEAN TARGET PREFERENCES
Based on your Day Lean, determine which target categories match fish positioning:

POWER SEARCH → Aggressive zones where active fish roam/feed:
  • High priority: wind-blown banks, grass edges, offshore points, current breaks
  • Medium priority: flats, channel swings
  
REACTION → Ambush cover and edges where fish are positioned to strike:
  • High priority: grass edges, laydowns, riprap, channel swings
  • Medium priority: wind-blown banks, isolated cover
  
FINESSE → Precision spots where neutral/pressured fish hold:
  • High priority: isolated cover, docks, shaded banks, brush piles
  • Medium priority: depth breaks, transitions
  
CONTROL → Heavy cover and deep structure where defensive fish hide:
  • High priority: laydowns, standing timber, brush piles
  • Medium priority: docks, deep offshore structure, shaded banks
  
FRONT/INSTABILITY → Deep stable zones where fish seek security:
  • High priority: deep offshore structure, creek channels, depth breaks (deep)
  • Medium priority: channel swings, hard-bottom transitions

STEP 2: APPLY SEASONAL MODIFIERS
Adjust target preferences based on season/temperature:

Winter / Cold Water (below 50°F):
  • Prioritize: deep offshore structure, creek channels, depth breaks (deep), clean bottom (for blade baits)
  • Deprioritize: shallow flats, wind-blown banks (unless warming), grass edges (if dead)

Spring Transition (50-68°F, warming):
  • Prioritize: flats (warming shallows), shaded banks transitioning to sun, depth breaks (first breaks), channel swings
  • Deprioritize: deep offshore structure, creek channels

Summer (above 70°F, stable warm):
  • Prioritize: deep offshore structure, depth breaks (deeper), grass edges (deep grass), offshore points
  • Deprioritize: shallow flats (midday), modify for early/late (wind-blown banks for oxygen)

Fall Transition (cooling, 65-55°F):
  • Prioritize: offshore points, wind-blown banks, transitions, channel swings, grass edges
  • Deprioritize: heavy cover (fish less defensive)

STEP 2.5: APPLY WEATHER & LIGHT VETO (CRITICAL)
You must REMOVE targets that are physically impossible or poor choices due to current weather.
**Use ONLY targets from the accessible_targets list provided.**

A) IF OVERCAST / RAIN / SNOW (No Sun):
   • REMOVE: "shaded banks". (Shade does not exist without sun).
   • SUBSTITUTE: "offshore points", "flats", "grass edges", "transitions".

B) IF HIGH WIND (>15mph):
   • REMOVE: "deep offshore structure" (hard to maintain boat position), "isolated cover" (hard to hit).
   • PRIORITIZE: "wind-blown banks", "current breaks", "offshore points".

C) IF FREEZING / SNOWSTORM:
   • REMOVE: "flats", "grass edges" (likely too shallow/cold).
   • PRIORITIZE: "deep offshore structure", "creek channels", "depth breaks", "channel swings".  

STEP 3: MAPPING LURE TO TARGET (REQUIRED VALIDATION - HERO MOMENT CHECK)
Your targets must VALIDATE your lure choice. If you chose a lure based on a HERO MOMENT (Section F), you MUST select targets that allow that lure to work.

- If BLADE BAIT chosen:
  → MUST Include: "deep offshore structure", "depth breaks".
  → MUST Avoid: "standing timber", "brush piles" (Snag risk).

- If FLAT-SIDED CRANK chosen:
  → MUST Include: "riprap", "rocky banks", "channel swings".

- If WAKE BAIT chosen:
  → MUST Include: "flooded bushes" (if high water implied), "laydowns", "shallow flats".

- If SQUAREBILL chosen:
  → MUST Include: "rocky banks", "laydowns", "stumps".

- If JERKBAIT chosen:
  → MUST Include: "offshore points", "bluff walls", "grass edges".

- If FROG chosen:
  → MUST Include: "matted grass", "lily pads", "overhanging trees".

- If NEKO RIG chosen:
  → MUST Include: "deep docks", "deep brush", "soft bottom structure".

STEP 4: CHECK GENERAL LURE COMPATIBILITY
Ensure your selected lure can effectively fish the target:

Horizontal Reaction Baits (chatterbait, spinnerbait, lipless, crankbait, buzzbait):
  • Excel: grass edges, wind-blown banks, flats, offshore points, current breaks, riprap (crankbait deflection)
  • Avoid: standing timber, brush piles (interior), heavy matted grass

Vertical Reaction Baits (jerkbait, blade bait):
  • Excel: depth breaks, offshore points, channel swings, transitions
  • Blade Bait specific: Clean bottom (rock/gravel/shell) to avoid snagging on lift
  • Avoid: laydowns, standing timber, brush piles, heavy grass

Bottom Contact - Dragging (texas rig, carolina rig, football jig):
  • Excel: ALL targets (most versatile category)
  • Particularly strong: depth breaks, hard-bottom transitions, offshore structure, flats

Bottom Contact - Hopping (casting jig, ned rig, shakey head, neko rig):
  • Excel: laydowns, standing timber, brush piles, docks, riprap, isolated cover, depth breaks
  • Neko Rig specific: Excellent in soft bottom/silt where shaky heads bury
  • Avoid: large open flats (inefficient)

Hovering/Finesse (dropshot, wacky rig, neko rig):
  • Excel: docks, isolated cover, depth breaks, shaded banks, brush piles, transitions
  • Avoid: heavy grass, strong current, large flats

Topwater (walking bait, buzzbait, popper, frogs, wake bait):
  • Excel: grass edges, wind-blown banks, laydowns, shaded banks, isolated cover
  • Wake Bait specific: Flooded bushes, high water lines, submerged tops
  • Avoid: deep offshore structure, creek channels, deep breaks

STEP 5: ENSURE TACTICAL VARIETY
Your 3 targets should represent different tactical approaches:
  • Mix depth zones (shallow, mid, deep)
  • Mix water types (open zones, cover, transitions)
  • Mix casting approaches (search, precision, vertical)

BAD (redundant): laydowns, standing timber, brush piles (all heavy cover, same approach)
GOOD (variety): laydowns (cover), grass edges (edge), depth breaks (transition)

BAD (redundant): wind-blown banks, flats, offshore points (all open search)
GOOD (variety): wind-blown banks (search), docks (precision), depth breaks (depth)

STEP 6: SEARCH AND PICK APART (IF APPLICABLE)
If you've selected Power Search primary (horizontal reaction) AND Pick Apart secondary (bottom contact):

Approach A - Same Targets, Different Tactics:
  • Both patterns fish same zones with different speeds
  • Example: Chatterbait searches grass edges, texas rig picks apart grass edges
  • Works when: Zones are large and warrant thorough coverage

Approach B - Related Targets (Progression):
  • Secondary targets are precision elements within search zones
  • Example: Primary (grass edges, wind-blown banks), Secondary (isolated cover near grass, shaded pockets)
  • Works when: Precision features exist within search zones

Approach C - Hybrid (Mix):
  • One shared target, some unique to each
  • Example: Grass edges (both), wind-blown banks (primary only), isolated cover (secondary only)
  • Most versatile approach

FINAL VALIDATION:
  • All 3 targets from accessible_targets list ✓
  • All 3 align with Day Lean preferences ✓
  • All 3 compatible with chosen lures ✓
  • All 3 represent different tactical approaches ✓
  • NO targets violate the Weather Veto (e.g. no shade in snow)

═══════════════════════════════════════════════════════════════════════════════
L) DAY LEAN → FISHING STYLE CONNECTION
═══════════════════════════════════════════════════════════════════════════════

Your Day Lean determination influences the overall FISHING APPROACH and should be reflected 
in both outlook_blurb (implicit) and strategy (explicit).

POWER SEARCH LEAN → Search-Oriented Fishing:
Outlook language: "active feeding windows", "roaming fish", "positioned on aggressive feeding lanes", "search zones"
Strategy approach: "Adopt a search-oriented approach", "cover water to locate zones", "let fish tell you where they're positioned"
Fishing style: Move quickly to find fish, then slow down and work productive zones

REACTION LEAN → Edge and Cover Triggering:
Outlook language: "positioned on cover", "edge-oriented", "ready to strike", "ambush positioning"
Strategy approach: "Target visible cover systematically", "work edges with reaction triggers", "focus on deflection and contact"
Fishing style: Fish specific cover/edges with reaction presentations, trigger strikes through contact

FINESSE LEAN → Precision and Patience:
Outlook language: "neutral positioning", "relating to specific structure", "precision needed", "cautious behavior"
Strategy approach: "Fish with a precision mindset", "thorough coverage of high-percentage spots", "multiple presentations per target"
Fishing style: Slow down, target verified locations, work fewer spots more methodically

CONTROL LEAN → Penetrate and Commit:
Outlook language: "tight to cover", "defensive mode", "seeking security", "buried in structure"
Strategy approach: "Commit to penetrating heavy cover", "work interior of structure", "slow methodical presentations"
Fishing style: Get into thick cover, slow way down, fish where others won't

FRONT/INSTABILITY LEAN → Deep and Stable:
Outlook language: "seeking stability", "deep positioning", "minimal movement", "defensive behavior"
Strategy approach: "Focus on deep stable zones", "target sanctuaries", "let fish come to the bait"
Fishing style: Target deep structure, very slow presentations, patience over coverage
"""