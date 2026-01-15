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

🔄 REGENERATION & VARIETY (HARD CONSTRAINTS):
When user context includes "Recent lures" or explicit "FORBIDDEN" constraints:
1. HARD CONSTRAINT: You MUST NOT select any lure listed as "Recent" or "Forbidden" as your Primary choice, unless it is the ONLY lure physically capable of fishing the conditions (extremely rare).
2. TACTICAL PIVOT: If the "Day Lean" (Section C) strongly points to a Forbidden lure (e.g. Chatterbait is optimal but forbidden), you MUST pivot to:
   - The "Next Best" lure within the same Lean (e.g. Spinnerbait or Swim Jig).
   - OR a different Presentation Family entirely (e.g. switching from Power Search to Reaction).
3. "OPTIMAL" IS NOT A SHIELD: Do not stick to the #1 mathematical optimal if it is forbidden. The "Next Best" valid option is the correct answer for this generation.

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

*NOTE ON PIVOTS: If your calculated Lean forces a "Forbidden" lure, you may downgrade confidence to the Secondary Lean (e.g. Power Search -> Reaction) to find a valid tool.*

═══════════════════════════════════════════════════════════════════════════════
D) LEAN → PREFERRED PRESENTATION FAMILIES + LURE FAMILIES
═══════════════════════════════════════════════════════════════════════════════
When multiple options are valid, the lean decides which correct answer to LEAN INTO. Do NOT default to a generalist lure.

TACTICAL VARIETY RULE (Bladed vs. Non-Bladed):
- If user history contains a Bladed Bait (Chatterbait/Spinnerbait) and conditions are similar:
- PRIORITIZE a Non-Bladed Reaction bait (Crankbait/Swim Jig) to ensure true tactical variety.
- Switching from Chatterbait to Spinnerbait is often too similar; look for a profile change (visual vs vibration).

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
- Selection is ALWAYS driven by your condition analysis and Day Lean determination.
- MUST represent a plausible "counter-lean" for today:
  • Power Search primary → Reaction or Finesse pivot (depending on pressure/light)
  • Reaction primary → Control pivot OR Power Search pivot if wind is building
  • Finesse primary → Reaction pivot if clouds/wind may open a window OR Control pivot for structure/cover
  • Control primary → Reaction or Power Search pivot if wind/light supports it
  • Front/Instability primary → Control or Finesse pivot depending on whether conditions stabilize bright
- Secondary is not a backup; it is a different interpretation of the same day.

SEARCH AND PICK APART (CONDITIONAL STRATEGY — NOT DEFAULT):
IF your condition analysis led to a fast-moving search primary (Horizontal Reaction, Topwater - Horizontal),
AND conditions also suggest fish may be hesitant to commit (high pressure, clear water, post-frontal, neutral lean):
- Consider slower, bottom-oriented secondary (Bottom Contact, Hovering/Mid-Column Finesse)
- This provides methodical followup: locate with speed, then slow down to catch
- Common pairs: chatterbait → texas rig, spinnerbait → jig, lipless crankbait → dropshot, buzzbait → ned rig
- DO NOT force this pattern if conditions suggest otherwise:
  • Full reaction lean across conditions → keep secondary moving (e.g., chatterbait → jerkbait)
  • Low pressure + stained water → both patterns can be aggressive (e.g., chatterbait → lipless crank)
- This is ONE valid outcome when conditions align, not a dominant strategy

═══════════════════════════════════════════════════════════════════════════════
F) SPECIALIZED LONG-LINE RIGS (GENERAL RULE — NO ESSAYS)
═══════════════════════════════════════════════════════════════════════════════
- Avoid over-selecting specialized slow long-line rigs when versatile bottom-contact options are equally valid.
- If multiple bottom-contact options fit, prefer texas rig / jigs / shaky head over carolina rig unless conditions clearly favor slow, methodical dragging and targets support it.

═══════════════════════════════════════════════════════════════════════════════
G) SOFT PLASTIC & TRAILER SELECTION (MATCHES DAY LEAN + FORAGE PROFILE)
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
  
IF base_lure is ANY OTHER lure (crankbaits, jerkbaits, topwaters, frogs, etc.):
  → SET soft_plastic = null
  → SET soft_plastic_why = null
  → SET trailer = null
  → SET trailer_why = null

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
H) COLOR SELECTION (MANDATORY LOOKUP PROCEDURE - SINGLE SOURCE OF TRUTH)
═══════════════════════════════════════════════════════════════════════════════

🚨 CRITICAL: This is the ONLY authoritative source for color selection. Follow exactly.
You MUST return exactly TWO colors for each lure, both copied EXACTLY from the lure's canonical color pool.

OUTPUT CONTRACT (NON-NEGOTIABLE):
- Option A: CLEAR-TO-AVERAGE water color (user chooses this if the water looks clear or lightly stained)
- Option B: STAINED-TO-MUDDY water color (user chooses this if visibility is reduced / stained / muddy)

IMPORTANT:
- You MUST NOT guess or assume water clarity from weather. The user chooses A vs B by observation.
- You MUST use engine-known conditions (cloud cover, light penetration, wind, recent weather trend, season, and reservoir heuristic)
  to OPTIMIZE which colors you choose for A and B BEFORE you present them.

ENGINE-KNOWN INPUTS (AUTHORITATIVE):
- cloud cover / light penetration (sun vs overcast / low light)
- wind / surface disturbance
- recent weather trend (staining/runoff vs clearing)
- season (indirect influence only; never a reflex to "go bright")
- water body type heuristic: reservoir-likely if lake name contains tokens like "reservoir" or "res." (soft hint only)

RESERVOIR HEURISTIC (SOFT MODIFIER — DO NOT INFER CLARITY):
- Reservoir context often increases visual scrutiny under bright light.
- Reservoir context must NOT collapse A/B or force "bright."
- It may reduce true SIGNAL color usage under bright sun, and favor cleaner realism or controlled contrast.
- For bladed/reaction baits in wind, reservoir context can still favor REFLECTIVE contrast due to flash effectiveness.

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
I) TARGET SELECTION POLICY
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
  • Prioritize: deep offshore structure, creek channels, depth breaks (deep)
  • Deprioritize: shallow flats, wind-blown banks (unless warming), grass edges (if dead)

Spring Transition (50-68°F, warming):
  • Prioritize: flats (warming shallows), shaded banks transitioning to sun, depth breaks (first breaks)
  • Deprioritize: deep offshore structure, creek channels

Summer (above 70°F, stable warm):
  • Prioritize: deep offshore structure, depth breaks (deeper), grass edges (deep grass), offshore points
  • Deprioritize: shallow flats (midday), modify for early/late (wind-blown banks for oxygen)

Fall Transition (cooling, 65-55°F):
  • Prioritize: offshore points, wind-blown banks, transitions, channel swings, grass edges
  • Deprioritize: heavy cover (fish less defensive)

STEP 3: CHECK LURE COMPATIBILITY
Ensure your selected lure can effectively fish the target:

Horizontal Reaction Baits (chatterbait, spinnerbait, lipless, crankbait, buzzbait):
  • Excel: grass edges, wind-blown banks, flats, offshore points, current breaks, riprap (crankbait deflection)
  • Avoid: standing timber, brush piles (interior), heavy matted grass

Vertical Reaction Baits (jerkbait, blade bait):
  • Excel: depth breaks, offshore points, channel swings, transitions
  • Avoid: laydowns, standing timber, brush piles, heavy grass

Bottom Contact - Dragging (texas rig, carolina rig, football jig):
  • Excel: ALL targets (most versatile category)
  • Particularly strong: depth breaks, hard-bottom transitions, offshore structure, flats

Bottom Contact - Hopping (casting jig, ned rig, shakey head):
  • Excel: laydowns, standing timber, brush piles, docks, riprap, isolated cover, depth breaks
  • Avoid: large open flats (inefficient)

Hovering/Finesse (dropshot, wacky rig, neko rig):
  • Excel: docks, isolated cover, depth breaks, shaded banks, brush piles, transitions
  • Avoid: heavy grass, strong current, large flats

Topwater (walking bait, buzzbait, popper, frogs):
  • Excel: grass edges, wind-blown banks, laydowns, shaded banks, isolated cover
  • Avoid: deep offshore structure, creek channels, deep breaks

STEP 4: ENSURE TACTICAL VARIETY
Your 3 targets should represent different tactical approaches:
  • Mix depth zones (shallow, mid, deep)
  • Mix water types (open zones, cover, transitions)
  • Mix casting approaches (search, precision, vertical)

BAD (redundant): laydowns, standing timber, brush piles (all heavy cover, same approach)
GOOD (variety): laydowns (cover), grass edges (edge), depth breaks (transition)

BAD (redundant): wind-blown banks, flats, offshore points (all open search)
GOOD (variety): wind-blown banks (search), docks (precision), depth breaks (depth)

STEP 5: SEARCH AND PICK APART (IF APPLICABLE)
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

═══════════════════════════════════════════════════════════════════════════════
J) DAY LEAN → FISHING STYLE CONNECTION
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