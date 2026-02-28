# /app/canon/seasonal_policies/prespawn.py
"""
Pre-spawn seasonal policy for Bass Clarity.
Contains bass behavior baseline, lure rankings, and condition modifiers.

Rules:
- All lure names must match LURE_POOL in pools.py exactly.
- Water clarity is NOT used to gate lure selection in V1 (clarity remains color-only context).
"""

PRESPAWN_SEASON = {
    "bass_behavior_baseline": {
        "metabolism": "rising",
        "positioning": "transitioning_to_staging",
        "feeding_windows": "expanding",
        "aggression": "medium_variable",
        "movement": "increasing",
        "summary": (
            "Pre-spawn is a staging and migration season. Bass move between wintering areas and "
            "spawning flats, and can be caught with moving baits when conditions support it. "
            "Fronts and high pressure still tighten the bite and require downshifts."
        ),
    },

    # =========================================================================
    # TEMPERATURE BANDS: The "Biological Clock" within Pre-Spawn
    # Pre-spawn is not monolithic - behavior changes significantly across temp ranges
    # =========================================================================
    "temp_bands": {
        "cold_staging": {
            "range": (50, 55),  # 50-55°F
            "description": "Early pre-spawn; bass transitioning from winter sanctuaries to staging areas",
            "metabolism": "still_slow",
            "positioning": "deep_staging_secondary_points",
            "movement": "deliberate_not_roaming",
            "feeding_window": "tight_midday_warmth",
            "presentation_rule": "SLOW_WITH_PAUSE",
            "pause_requirement": "8-12 seconds on jerkbait; let jigs sit",
            "primary_lures": [
                "jerkbait",
                "flat-sided crankbait",
                "football jig",
                "blade bait",
                "dropshot",
            ],
            "forage_profile": "bottom_protein",  # Crawfish emerging
            "note": (
                "Metabolism is still suppressed. Fish are moving but not chasing. "
                "Extended pauses and bottom contact outperform steady retrieves. "
                "Target secondary points and channel swings where fish 'rest' during migration."
            ),
        },
        "warm_staging": {
            "range": (55, 62),  # 55-62°F
            "description": "Active pre-spawn; bass staged shallow and willing to feed",
            "metabolism": "rising_active",
            "positioning": "shallow_staging_flats_edges",
            "movement": "roaming_feeding",
            "feeding_window": "extended_multiple_windows",
            "presentation_rule": "CONTROLLED_MOVING",
            "pause_requirement": "4-6 seconds on jerkbait; moderate retrieve on moving baits",
            "primary_lures": [
                "lipless crankbait",
                "spinnerbait",
                "jerkbait",
                "flat-sided crankbait",
                "chatterbait",
                "texas rig",
            ],
            "forage_profile": "mixed_craw_baitfish",
            "note": (
                "Metabolism supports tracking moving baits. Fish position on flats edges, "
                "grass lines, and wind-blown banks. Search baits become primary tools, "
                "but still avoid burning retrieves - controlled movement wins."
            ),
        },
        "spawn_transition": {
            "range": (62, 68),  # 62-68°F
            "description": "Late pre-spawn; bass moving to spawning flats, some already on beds",
            "metabolism": "high",
            "positioning": "spawning_flats_shallow_cover",
            "movement": "territorial",
            "feeding_window": "aggressive_but_mood_dependent",
            "presentation_rule": "MATCH_THE_MOOD",
            "primary_lures": [
                "texas rig",
                "casting jig",
                "shallow crankbait",
                "spinnerbait",
                "soft jerkbait",
            ],
            "forage_profile": "opportunistic",
            "note": (
                "Fish are shallow and aggressive but mood shifts quickly. "
                "Target spawning flats, pockets, and shallow cover. "
                "Be ready to switch between reaction and finesse based on response."
            ),
        },
    },

    # =========================================================================
    # STAGING TARGETS: The Pre-Spawn "Highway" and Rest Stops
    # Bass migrate along predictable routes - target the rest areas
    # =========================================================================
    "staging_targets": {
        "primary_staging": {
            "description": "High-percentage targets where bass stage during migration",
            "locations": [
                "secondary points",      # Not main lake points - the smaller ones along migration routes
                "channel swings",        # Where deep water bends toward shallow flats
                "inside grass edges",    # Protected side of grass lines
                "transition banks",      # Where bottom composition changes (rock to mud, etc.)
            ],
            "why": "Bass 'rest' at these locations during the staging-to-shallow migration",
            "temp_band_affinity": "cold_staging",
        },
        "heat_banks": {
            "description": "Sun-warmed structure that can be 3-5°F warmer than main lake",
            "locations": [
                "riprap",               # Rocks absorb and radiate heat
                "rocky banks",          # Northern exposure in Southern hemisphere, etc.
                "shallow dark bottom",  # Dark substrate absorbs heat
                "protected pockets",    # Wind-sheltered areas that warm faster
            ],
            "why": "Warmth accelerates metabolism and concentrates both bass and forage",
            "temp_band_affinity": "cold_staging",
            "condition_boost": "sunny_calm",  # Heat banks matter most on sunny, calm days
        },
        "feeding_flats": {
            "description": "Shallow areas where staged bass move to feed",
            "locations": [
                "grass flats",
                "spawning pockets",
                "creek arm flats",
                "wind-blown banks",
            ],
            "why": "Bass roam these areas during feeding windows, especially in warm_staging",
            "temp_band_affinity": "warm_staging",
        },
    },

    # =========================================================================
    # SPRING COLOR OVERRIDES: The "Red Craw" Rule
    # Crawfish emergence = high-protein forage = red/orange bias
    # =========================================================================
    "color_overrides": {
        "spring_craw_bias": {
            "description": "Prioritize red/craw patterns for bottom contact baits in pre-spawn",
            "applies_to": [
                "jig",
                "football jig",
                "casting jig",
                "texas rig",
                "lipless crankbait",
                "flat-sided crankbait",
                "shallow crankbait",
                "mid crankbait",
            ],
            "priority_colors": [
                "red craw",
                "craw",
                "green pumpkin orange",
                "peanut butter jelly",
                "brown/orange",
            ],
            "why": (
                "Early spring crawfish are emerging and represent a primary protein source. "
                "They often exhibit reddish/orange tints. Bass key on this forage profile."
            ),
            "clarity_interaction": {
                "clear": "Subtle craw patterns (green pumpkin orange, natural craw)",
                "stained": "Bolder craw patterns (red craw, orange belly)",
                "muddy": "Dark silhouette with orange accents",
            },
        },
        "baitfish_secondary": {
            "description": "Baitfish patterns remain viable, especially for suspending lures",
            "applies_to": [
                "jerkbait",
                "spinnerbait",
                "underspin",
                "paddle tail swimbait",
            ],
            "priority_colors": [
                "shad",
                "ghost minnow",
                "chrome/blue",
                "pearl white",
            ],
            "why": "Shad and other baitfish are present; suspending baits mimic dying/struggling baitfish",
        },
    },

    # =========================================================================
    # LURE RANKINGS
    # NOTE ON CHATTERBAIT:
    # - Chatterbait is included as STRONG so it is always "available" as an all-season lure.
    # - However, it should be DE-EMPHASIZED unless warm_trend + wind are present.
    # - Use condition_modifiers (bias/deemphasize) + lure_caveats to enforce this behavior.
    # =========================================================================
    "lure_rankings": {
        "strong": [
            "jerkbait",
            "flat-sided crankbait",
            "lipless crankbait",
            "spinnerbait",
            "chatterbait",
            "football jig",
            "casting jig",
            "texas rig",
            "shaky head",
            "dropshot",
        ],
        "conditional": [
            "underspin",
            "paddle tail swimbait",
            "deep crankbait",
            "mid crankbait",
            "shallow crankbait",
            "carolina rig",
            "ned rig",
            "blade bait",
            "jighead minnow",
            "soft jerkbait",
        ],
        "avoid": [
            "walking bait",
            "buzzbait",
            "whopper plopper",
            "wake bait",
            "hollow body frog",
            "popping frog",
            "popper",
        ],
    },

    "condition_modifiers": {
        "warm_trend": {
            "description": "Sustained warming; temps meaningfully above seasonal norm",
            "positioning": "shallower_staging_more_roam",
            "feeding_window": "extended",
            "bias_toward": [
                "spinnerbait",
                "lipless crankbait",
                "shallow crankbait",
                "chatterbait",
                "texas rig",
            ],
            "unlock": [
                "mid crankbait",
                "paddle tail swimbait",
                "soft jerkbait",
            ],
            "bias_away_from": [
                "jerkbait",
                "blade bait",
                "football jig",
            ],
            "note": (
                "Warm trend shifts bass toward shallower staging and active feeding. "
                "Prioritize search baits and shallow presentations. Hard jerkbait becomes less effective "
                "as water temps exceed 62°F - fish are more willing to chase."
            ),
        },

        "wind": {
            "description": "Wind / wind-driven positioning",
            "positioning": "wind_blown_edges_points_staging",
            "feeding_window": "often_longer_if_stable",
            "bias_toward": [
                "spinnerbait",
                "lipless crankbait",
                "flat-sided crankbait",
            ],
            "note": (
                "Wind helps position fish and concentrate forage. On its own it biases search baits; "
                "combined with a warm trend it can turn on a stronger chatterbait bite."
            ),
        },

        # Explicit chatterbait emphasis rule
        "chatterbait_emphasis": {
            "description": "Controls chatterbait emphasis during pre-spawn",
            "emphasize_if": {
                "requires": ["warm_trend", "wind"],
                "emphasize": ["chatterbait"],
                "why": "Warm trend increases willingness to track; wind positions fish and concentrates forage.",
            },
            "deemphasize_if_not": {
                "requires": ["warm_trend", "wind"],
                "deemphasize": ["chatterbait"],
                "why": "Without warm_trend + wind, chatterbait remains available but should not be prioritized.",
            },
        },

        "cold_stable": {
            "description": "Cold or stable conditions; at/below seasonal norm or after a cooling event",
            "positioning": "deeper_staging_tight_to_cover",
            "feeding_window": "shorter_midday",
            "priority_shift": [
                "blade bait",
                "football jig",
                "dropshot",
                "shaky head",
                "ned rig",
                "jerkbait",
            ],
            "jerkbait_pause": "longer_pauses",
            "bias_away_from": [
                "shallow crankbait",
                "mid crankbait",
                "paddle tail swimbait",
            ],
            "note": (
                "Cold-stable periods revert pre-spawn behavior toward winter. Downshift presentation "
                "speed and prioritize strike-zone control."
            ),
        },

        "sunny_high_pressure": {
            "description": "Bright skies and/or rising/high pressure",
            "positioning": "tight_to_cover_less_roam",
            "feeding_window": "tightest",
            "priority_shift": [
                "dropshot",
                "shaky head",
                "ned rig",
                "texas rig",
                "casting jig",
                "jerkbait",
            ],
            "bias_away_from": [
                "shallow crankbait",
                "mid crankbait",
                "paddle tail swimbait",
                "underspin",
            ],
            "note": (
                "High pressure tightens the bite. Favor bottom contact and hovering finesse, "
                "and slow the cadence on jerkbait and jigs."
            ),
        },

        "overcast": {
            "description": "Cloud cover / lower light",
            "positioning": "more_roam_shallower_staging",
            "feeding_window": "slightly_longer",
            "bias_toward": [
                "lipless crankbait",
                "spinnerbait",
                "jerkbait",
            ],
            "note": (
                "Overcast can extend feeding windows and increase roaming. Keep retrieves controlled "
                "and use it as a search-bite multiplier rather than a speed license."
            ),
        },

        "falling_pressure": {
            "description": "Pressure dropping; front approaching",
            "feeding_window": "pre_front_window",
            "bias": "more_aggressive_but_controlled",
            "bias_toward": [
                "lipless crankbait",
                "spinnerbait",
                "shallow crankbait",
                "chatterbait",
            ],
            "conditional_bias": {
                "cold_staging": ["jerkbait", "flat-sided crankbait"],
                "warm_staging": ["lipless crankbait", "spinnerbait"],
                "spawn_transition": ["shallow crankbait", "spinnerbait", "chatterbait"],
            },
            "note": (
                "Falling pressure creates a feeding window. In cold staging, jerkbait shines. "
                "In warmer temps, bass are more willing to chase - prioritize search baits."
            ),
        },

        "rising_pressure": {
            "description": "Post-front; pressure climbing",
            "difficulty": "difficult",
            "positioning": "lock_down_tight",
            "feeding_window": "shortest",
            "priority_shift": [
                "ned rig",
                "dropshot",
                "shaky head",
                "texas rig",
                "football jig",
                "jerkbait",
            ],
            "bias_away_from": [
                "shallow crankbait",
                "mid crankbait",
                "paddle tail swimbait",
                "deep crankbait",
            ],
            "note": (
                "Post-front conditions demand finesse and patience. Slow down and focus on high-percentage "
                "targets rather than covering water."
            ),
        },
    },

    "lure_caveats": {
        "jerkbait": {
            "why": (
                "THE pre-spawn staple. Suspending action keeps bait in strike zone for lethargic fish. "
                "Pause length is the critical variable - it changes everything."
            ),
            "temp_band_technique": {
                "cold_staging": {
                    "pause": "8-12 seconds minimum",
                    "cadence": "Twitch-twitch-LONG PAUSE. Let it sit. Fish are not chasing.",
                    "targets": "Secondary points, channel swings, bluff walls",
                },
                "warm_staging": {
                    "pause": "4-6 seconds",
                    "cadence": "Twitch-twitch-pause-twitch. More erratic, shorter pauses.",
                    "targets": "Grass edges, transition banks, wind-blown points",
                },
            },
            "clarity_requirement": "Clear to moderately stained (2+ ft visibility)",
            "best_when": "Stable or falling pressure; overcast; cold_staging temp band",
            "guardrail": "If no bites after extended pauses, fish may want bottom contact instead",
        },
        "chatterbait": {
            "why": (
                "All-season lure and useful pre-spawn tool, but it is not always the best default. "
                "During pre-spawn it becomes a true priority when fish are positioned and willing to track."
            ),
            "deemphasize_unless": "warm_trend + wind",
            "temp_band_requirement": "warm_staging (55°F+) - too aggressive for cold_staging",
            "technique": "Slow to moderate retrieve; keep it in the lower water column; avoid burning in cool water",
            "best_when": "Warm trend + wind; wind-blown banks/points; bait positioned shallow",
        },
        "blade bait": {
            "why": "Cold pre-spawn specialist for deep staging fish; vertical presentation for lethargic bass",
            "temp_band_requirement": "cold_staging (50-55°F) - this is its prime window",
            "best_when": "Cold/stable conditions; fish relating to deeper structure; secondary points and channel swings",
            "technique": "Vertical lift-and-drop with controlled cadence; keep it tight to structure; let it flutter",
            "targets": "Deep staging areas, channel swings, points with deep access",
        },
        "lipless crankbait": {
            "why": "Pre-spawn search bait that can cover water and trigger reaction bites",
            "temp_band_technique": {
                "cold_staging": {
                    "technique": "Yo-yo retrieve - lift and flutter down on semi-slack line",
                    "targets": "Grass edges, flats with emerging vegetation",
                    "color_bias": "Red craw patterns for grass flat ripping",
                },
                "warm_staging": {
                    "technique": "Steady retrieve with occasional rips through grass",
                    "targets": "Wind-blown flats, grass lines, shallow staging areas",
                    "color_bias": "Shad or craw depending on forage",
                },
            },
            "best_when": "Wind, overcast, or falling pressure; also during warm trend windows",
            "guardrail": "If post-front/high pressure and bites die, downshift to finesse/bottom contact",
        },
        "flat-sided crankbait": {
            "why": (
                "Tighter, subtler action than wider-wobble cranks. The tight wiggle mimics lethargic baitfish "
                "and doesn't overpower cold-water bass. THE crankbait for rocky pre-spawn structure."
            ),
            "temp_band_requirement": "Ideal for cold_staging (50-55°F); effective through warm_staging",
            "best_when": "Rocky banks, riprap, transition banks, secondary points with rock",
            "technique": "Slow steady retrieve; occasional deflection off cover; don't burn it",
            "targets": "Riprap, rocky banks, 45-degree banks, channel swing rock",
            "color_bias": "Shad patterns for clear; craw/orange belly for stained",
        },
        "deep crankbait": {
            "why": "Situational tool for fish set up deeper on structure willing to respond",
            "avoid_when": "Post-front/high pressure lock-down or fish unwilling to react",
            "technique": "Slow steady retrieve; target structure contact/deflection",
        },
        "paddle tail swimbait": {
            "why": "Targets fish willing to track a moving bait; good bridge between reaction and finesse",
            "best_when": "Warm trend, stable conditions, or when fish are roaming staging areas",
            "technique": "Slow roll in the lower water column; avoid fast retrieves in cool water",
        },
        "jighead minnow": {
            "why": "Useful when fish are suspended or relating slightly off bottom",
            "best_when": "Stable conditions; overcast/wind lanes; suspended baitfish behavior",
            "technique": "Controlled swim/hover near target depth; avoid aggressive snapping",
        },
        "ned rig": {
            "why": "Get-bit tool during tough post-front/high-pressure pre-spawn windows",
            "best_when": "Rising pressure, cold-stable, tough bite; when fish refuse larger profiles",
            "technique": "Slow drag/creep; minimal hops",
        },
    },
}


PRESPAWN_POLICY_PROSE = r"""
PRE-SPAWN SEASONAL POLICY

BASS BEHAVIOR BASELINE:
- Metabolism: Rising — bass feed more consistently as water warms
- Positioning: Transitioning toward staging areas and spawning flats
- Feeding Windows: Expanding — midday is strong; afternoons often improve during warming
- Aggression: Medium — can chase at times, but mood changes quickly on fronts
- Movement: Increasing — fish move between deep and shallow staging lanes

==============================================================================
TEMPERATURE BANDS: THE BIOLOGICAL CLOCK
Pre-spawn is NOT monolithic. Behavior changes significantly across temp ranges.
==============================================================================

COLD STAGING (50-55°F):
- Metabolism is still suppressed; fish are moving but NOT chasing
- Bass "rest" at secondary points and channel swings during migration
- PRESENTATION RULE: SLOW WITH PAUSE
- Jerkbait pause: 8-12 seconds minimum
- Primary lures: Jerkbait, flat-sided crankbait, football jig, blade bait, dropshot
- Forage profile: Bottom protein (crawfish emerging)

WARM STAGING (55-62°F):
- Metabolism supports tracking moving baits
- Bass roam flats edges, grass lines, wind-blown banks
- PRESENTATION RULE: CONTROLLED MOVING (not burning)
- Jerkbait pause: 4-6 seconds
- Primary lures: Lipless crankbait, spinnerbait, jerkbait, chatterbait
- Forage profile: Mixed craw and baitfish

SPAWN TRANSITION (62-68°F):
- Fish are shallow and aggressive but mood shifts quickly
- Target spawning flats, pockets, shallow cover
- Be ready to switch between reaction and finesse based on response

==============================================================================
STAGING TARGETS: THE PRE-SPAWN HIGHWAY
Bass migrate along predictable routes - target the "rest stops"
==============================================================================

PRIMARY STAGING (Cold Staging Priority):
- Secondary points (not main lake points - the smaller ones along migration routes)
- Channel swings (where deep water bends toward shallow flats)
- Inside grass edges (protected side of grass lines)
- Transition banks (where bottom composition changes)

HEAT BANKS (Cold Staging + Sunny Conditions):
- Riprap (rocks absorb and radiate heat - can be 3-5°F warmer)
- Rocky banks (especially with sun exposure)
- Shallow dark bottom (absorbs heat)
- Protected pockets (wind-sheltered areas that warm faster)

FEEDING FLATS (Warm Staging Priority):
- Grass flats
- Spawning pockets
- Creek arm flats
- Wind-blown banks

==============================================================================
SPRING COLOR RULE: THE RED CRAW BIAS
Crawfish emergence = high-protein forage = red/orange priority
==============================================================================

FOR BOTTOM CONTACT BAITS (jigs, texas rig, crankbaits, lipless):
- Priority colors: Red craw, craw, green pumpkin orange, peanut butter jelly
- Clear water: Subtle craw patterns (green pumpkin orange, natural craw)
- Stained water: Bolder craw patterns (red craw, orange belly)
- Muddy water: Dark silhouette with orange accents

FOR SUSPENDING BAITS (jerkbait, spinnerbait, underspin):
- Baitfish patterns remain primary: Shad, ghost minnow, chrome/blue

==============================================================================
LURE SELECTION APPROACH
==============================================================================

STRONG LURES:
Jerkbait
  THE pre-spawn staple. Pause length is the critical variable.
  Cold staging: 8-12 second pauses. Warm staging: 4-6 second pauses.

Flat-Sided Crankbait
  Tight action for cooler water. THE crankbait for rocky pre-spawn structure.
  Best on riprap, rocky banks, transition banks, secondary points.

Lipless Crankbait
  High-coverage search bait. Yo-yo in cold staging, steady retrieve in warm staging.
  Red craw patterns for ripping through grass.

Spinnerbait
  Reliable search bait when fish position on wind and staging edges.

Chatterbait
  DE-EMPHASIZE unless warm_staging (55°F+) + wind are both present.
  Too aggressive for cold_staging.

Football Jig / Blade Bait
  Bottom contact specialists for cold_staging. Target secondary points and channel swings.

CONDITION MODIFIERS:
Warm Trend (IMPORTANT FOR EARLY SPRING):
  When temps are meaningfully above seasonal norm (e.g., 70°F in late Feb):
  - BIAS TOWARD: Spinnerbait, lipless crankbait, shallow crankbait, chatterbait, texas rig
  - BIAS AWAY FROM: Hard jerkbait, blade bait, football jig
  - Bass shift to shallower staging and active feeding - they will chase
  - Warm trend + wind is the key combo that elevates chatterbait priority

Cold/Stable or Post-Front:
  Reverts behavior toward cold_staging. Downshift speed and prioritize pause/bottom contact.

Falling Pressure:
  Creates a feeding window. Lure selection should match temp band:
  - Cold staging (50-55°F): Jerkbait, flat-sided crankbait shine
  - Warm staging (55-62°F): Lipless crankbait, spinnerbait
  - Spawn transition (62-68°F): Shallow crankbait, spinnerbait, chatterbait
"""
