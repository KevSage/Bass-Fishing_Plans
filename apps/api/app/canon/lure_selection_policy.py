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
1) Season/Phase (broad, honest) → 2) Conditions + Trends → 3) Day Lean → 4) Forage Profile → 5) Presentation Family → 6) Lure → 7) Soft Plastic/Trailer → 8) Colors

NOTE: Canonical pools (PRESENTATIONS, LURE_POOL, LURE_TO_PRESENTATION, color pools, etc.) are provided separately in the system prompt as JSON.
Use those exact values when selecting lures, presentations, colors, soft plastics, and trailers.

═══════════════════════════════════════════════════════════════════════════════
A) SEASON / PHASE (BROAD, TRUST-SAFE)
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
B) FORAGE PROFILE (PROFILE ONLY — NO SPECIES CLAIMS)
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
C) DETERMINE TODAY'S "DAY LEAN" (ONE WINNER — DETERMINISTIC)
═══════════════════════════════════════════════════════════════════════════════
Pick exactly ONE lean. This is the day's personality:
1) POWER SEARCH (Wind Lean)
2) REACTION (Low Light / Trigger Lean)
3) FINESSE (High Pressure / Calm / Bright Lean)
4) FRONT / INSTABILITY (Falling Pressure / Swingy Conditions Lean)
5) CONTROL (Neutral Lean — default)

Use these deterministic cues (no random):
- POWER SEARCH if wind is clearly the headline (strong or gusty), especially with clouds/precip.
- REACTION if low light/overcast is dominant OR conditions suggest a trigger window (clouds + moderate wind).
- FINESSE if pressure trend is rising AND light is bright/clear AND wind is low-to-moderate.
- FRONT/INSTABILITY if pressure is falling OR precip/front is present/approaching OR temps are swinging rapidly.
- CONTROL otherwise.

═══════════════════════════════════════════════════════════════════════════════
D) LEAN → PREFERRED PRESENTATION FAMILIES + LURE FAMILIES
═══════════════════════════════════════════════════════════════════════════════
When multiple options are valid, the lean decides which correct answer to LEAN INTO. Do NOT default to a generalist lure.

POWER SEARCH (Wind Lean):
- Prefer Horizontal Reaction or fast coverage tools.
- Lure families: spinnerbait, chatterbait, swim jig, crankbait (if applicable).
- Stained water OR recent rain: Prioritize bladed baits (chatterbait, spinnerbait) for vibration advantage.
- Clear water: Profile baits (swim jig, paddle tail) work equally well.
- Bottom contact is allowed only if targets demand it OR season strongly indicates tight positioning; otherwise keep primary moving.

REACTION (Low Light / Trigger Lean):
- Prefer reaction tools that create commitment (change of direction, pause/trigger).
- Lure families: jerkbait (season-permitting), crankbait, spinnerbait, chatterbait.
- Falling pressure: Prioritize bladed baits for vibration trigger (chatterbait, spinnerbait).
- If very cold/neutral, reaction should be more controlled (jerkbait pauses, slower crank cadence).

FINESSE (High Pressure / Calm / Bright Lean):
- Prefer subtle, smaller profile, slower pace.
- Lure families: ned rig, shaky head, dropshot, neko rig, wacky rig.
- Texas rig can appear as a control alternative, but do NOT auto-default to jig/texas when true finesse lures are viable.
- Avoid vibration - bass are pressured.

FRONT / INSTABILITY Lean:
- Prefer trigger baits that can convert short windows (reaction + pause/deflection) OR controlled bottom contact as pivot.
- Lure families: jerkbait, crankbait, chatterbait, spinnerbait.
- Falling pressure = aggressive feeding: Prioritize vibration baits (chatterbait, spinnerbait).
- If conditions are post-front bright/high pressure, shift toward finesse as the secondary pivot.

CONTROL (Neutral Lean):
- Prefer versatile, high-control presentations.
- Lure families: casting jig, football jig, texas rig, shaky head.
- STILL avoid "jig every day": choose the lure that best matches season + forage profile + targets (not a default).

═══════════════════════════════════════════════════════════════════════════════
E) PRIMARY + SECONDARY SELECTION RULES (TO CREATE EARNED VARIETY)
═══════════════════════════════════════════════════════════════════════════════
PRIMARY:
- MUST express the Day Lean first (within season plausibility).
- If multiple lures fit: choose the lure that best matches forage profile:
  • baitfish-style → spinnerbait/jerkbait/crank style options
  • bottom-protein → jig/texas/drag/hop options
  • micro → ned/dropshot/shaky style options
  • compact → smaller, tighter-profile options within the lean
- Do NOT pick jig/texas as a reflex if a lean-appropriate moving or finesse lure is clearly viable.

SECONDARY (PIVOT):
- MUST be a different presentation family per the existing validation rules.
- MUST represent a plausible "counter-lean" for today:
  • Power Search primary → Reaction or Finesse pivot (depending on pressure/light)
  • Reaction primary → Control pivot OR Power Search pivot if wind is building
  • Finesse primary → Reaction pivot if clouds/wind may open a window OR Control pivot for structure/cover
  • Control primary → Reaction or Power Search pivot if wind/light supports it
  • Front/Instability primary → Control or Finesse pivot depending on whether conditions stabilize bright
- Secondary is not a backup; it is a different interpretation of the same day.

═══════════════════════════════════════════════════════════════════════════════
F) SPECIALIZED LONG-LINE RIGS (GENERAL RULE — NO ESSAYS)
═══════════════════════════════════════════════════════════════════════════════
- Avoid over-selecting specialized slow long-line rigs when versatile bottom-contact options are equally valid.
- If multiple bottom-contact options fit, prefer texas rig / jigs / shaky head over carolina rig unless conditions clearly favor slow, methodical dragging and targets support it.

═══════════════════════════════════════════════════════════════════════════════
G) SOFT PLASTIC & TRAILER SELECTION (MATCHES DAY LEAN + FORAGE PROFILE)
═══════════════════════════════════════════════════════════════════════════════
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
H) COLOR SELECTION (TWO-LANE SYSTEM: CLEAR + STAINED)
═══════════════════════════════════════════════════════════════════════════════
CRITICAL: Provide EXACTLY TWO color recommendations for each lure:
1. CLEAR LANE: For clear to average water clarity
2. STAINED LANE: For stained to muddy water clarity

🚨 USE LURE_COLOR_POOL_MAP to find the correct pool for your chosen base_lure
🚨 Colors MUST be exact strings from that pool (no variations, no inventions)

User selects based on actual conditions at the lake.

BASE CLARITY RULES (POOL-BOUND):
- Clear-to-average lane:
  • Choose the most natural / subtle option available in the lure's pool.
  • Prefer realistic baitfish/natural tones when they exist in that pool.
- Stained-to-muddy lane:
  • Choose the highest-visibility / strongest-contrast option available in the lure's pool.
  • Prefer brighter chartreuse-style, high-contrast dark, or strong pattern options when they exist in that pool.

ENVIRONMENTAL MODIFIERS (POOL-BOUND, ADJUST BOTH LANES):
- Recent rain / inflow / turbidity trend:
  • Shift BOTH lanes one step more visible within the same pool (stronger contrast / brighter / bolder).
- Bright sun / high light:
  • Shift BOTH lanes one step more subtle within the same pool (cleaner / more natural / less aggressive contrast).
- Overcast / low light:
  • Shift BOTH lanes one step bolder within the same pool (more visible / more contrast).

EARNED VARIETY (STILL POOL-BOUND):
- If primary and secondary share the same color pool, prefer DIFFERENT color pairs so the user sees two distinct options.
- Do not pick the same two colors for both patterns unless the pool is very small or the conditions strongly demand it.

CRITICAL RULES:
- Do NOT invent color tokens. Colors MUST be exact strings present in the selected pool for the chosen base_lure.
- Do NOT reorder slash tokens. Copy exact strings as-is from the pool (e.g., use "chartreuse/white" if that is the token).
- Choose colors based on Day Lean + conditions modifiers within the pool — not season reflexes.
"""
