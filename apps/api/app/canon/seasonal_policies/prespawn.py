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

    """LURE RANKINGS

    NOTE ON CHATTERBAIT:
    - Chatterbait is included as STRONG so it is always "available" as an all-season lure.
    - However, it should be DE-EMPHASIZED unless warm_trend + wind are present.
    - Use condition_modifiers (bias/deemphasize) + lure_caveats to enforce this behavior.
    """
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
                "flat-sided crankbait",
                "jerkbait",
            ],
            "unlock": [
                "mid crankbait",
                "shallow crankbait",
                "paddle tail swimbait",
            ],
            "note": (
                "Warm trend expands the bite window and increases willingness to track moving baits. "
                "Keep retrieves controlled; do not assume an all-out reaction bite."
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
                "jerkbait",
                "flat-sided crankbait",
            ],
            "note": (
                "Falling pressure can create a short bite window. Lean into search baits and jerkbait, "
                "but keep retrieves moderate—don’t confuse this with a summer reaction bite."
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
        "chatterbait": {
            "why": (
                "All-season lure and useful pre-spawn tool, but it is not always the best default. "
                "During pre-spawn it becomes a true priority when fish are positioned and willing to track."
            ),
            "deemphasize_unless": "warm_trend + wind",
            "technique": "Slow to moderate retrieve; keep it in the lower water column; avoid burning in cool water",
            "best_when": "Warm trend + wind; wind-blown banks/points; bait positioned shallow",
        },
        "blade bait": {
            "why": "Cold pre-spawn specialist for deep staging fish; not required for every angler or lake",
            "best_when": "Cold/stable or winter-adjacent pre-spawn; fish relating to deeper structure",
            "technique": "Vertical lift-and-drop with controlled cadence; keep it tight to structure",
        },
        "lipless crankbait": {
            "why": "Pre-spawn search bait that can cover water and trigger bites when fish are staging/roaming",
            "best_when": "Wind, overcast, or falling pressure; also during warm trend windows",
            "technique": "Steady retrieve or controlled yo-yo depending on depth and mood",
            "guardrail": "If post-front/high pressure and bites die, downshift to finesse/bottom contact",
        },
        "flat-sided crankbait": {
            "why": "Tighter, subtler action than wider-wobble cranks; effective in cooler pre-spawn periods",
            "best_when": "Cooler pre-spawn, rocky banks, riprap, transition banks",
            "technique": "Slow steady retrieve; occasional deflection off cover",
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

LURE SELECTION APPROACH:
Pre-spawn is a staging and migration season. Use search baits to find active fish,
then slow down with bottom contact and finesse when pressure or cold snaps tighten the bite.

NOTE ON WATER CLARITY:
Water clarity is used for color selection only in V1 and does not gate lure eligibility.

STRONG LURES:
Jerkbait
  Pre-spawn staple for staging fish. Adjust pauses longer on tough days.

Flat-Sided Crankbait
  Tight action for cooler water. Best on rocky banks, riprap, and transition edges.

Lipless Crankbait
  High-coverage search bait. Especially strong with wind/overcast or pre-front windows.

Spinnerbait
  Reliable search bait when fish position on wind and staging edges.

Chatterbait
  Always available as an all-season lure, but DE-EMPHASIZE unless warm trend + wind are both present.
  Keep retrieves controlled; avoid burning in cool water.

Football Jig
  Bottom contact staple for staging fish on deeper structure and hard bottom.

Casting Jig / Texas Rig
  Precision tools when fish tighten to cover or hold on specific targets.

Shaky Head / Dropshot
  Finesse tools for pressured, post-front, or high-sun conditions.

CONDITIONAL LURES:
Blade Bait
  Cold pre-spawn specialist for deep staging fish. Not required for every angler or lake.

Deep / Mid / Shallow Crankbaits
  Use only when fish positioning supports that depth and they are willing to react.
  Downshift quickly after fronts or rising pressure.

Paddle Tail Swimbait / Underspin / Jighead Minnow
  Situational moving baits when fish are willing to track or are suspended.
  Keep speed controlled and stay near the lower water column.

Carolina Rig
  Situational for deeper staging areas when you need to cover bottom efficiently.

Ned Rig
  Tough-bite tool for post-front and high-pressure windows.

AVOID (DEFAULT):
Topwater (walking bait, buzzbait, plopper, wake bait, frogs, popper)
  Not a reliable pre-spawn baseline. Save for later seasonal phases.

CONDITION MODIFIERS:
Warm Trend:
  Expands feeding windows and increases willingness to track moving baits.
  Warm trend + wind is the key combo that elevates chatterbait priority.

Cold/Stable or Post-Front:
  Reverts behavior toward winter. Downshift speed and prioritize finesse/bottom contact.

Wind / Overcast / Falling Pressure:
  Improve search baits and increase roaming. Keep retrieves controlled.
"""
