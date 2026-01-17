# /app/canon/seasonal_policies/fall.py
"""
Fall seasonal policy for Bass Clarity.
Contains bass behavior baseline, lure rankings, and condition modifiers.

Rules:
- All lure names must match LURE_POOL in pools.py exactly.
- Water clarity is NOT used to gate lure selection (clarity remains color-only context).
- Fall is baitfish-driven: bass feed up and use wind, current, and low light to extend chase windows.
"""

FALL_SEASON = {
    "bass_behavior_baseline": {
        "metabolism": "moderate_to_high",
        "positioning": "baitfish_routes_shallow_to_mid_depths_wind_blown_edges_creeks_flats",
        "feeding_windows": "extended_with_wind_overcast_peak_afternoon_warming_early_late_also_valid",
        "aggression": "high_opportunistic",
        "movement": "high_roaming_schooling",
        "summary": (
            "Fall bass follow baitfish and feed aggressively. Wind and low light expand movement and extend windows. "
            "Cover water efficiently with reaction tools, then clean up key targets with a slower precision bait. "
            "Fall is the season where speed and coverage often win—when conditions support it."
        ),
    },

    "lure_rankings": {
        "strong": [
            # Primary fall coverage tools
            "lipless crankbait",
            "shallow crankbait",
            "mid crankbait",
            "spinnerbait",
            "chatterbait",
            "paddle tail swimbait",
            "underspin",

            # Complementary / cleanup
            "texas rig",
            "shaky head",
            "ned rig",
        ],
        "conditional": [
            # Topwater (conditional; strongest with activity/low light)
            "walking bait",
            "whopper plopper",
            "buzzbait",
            "wake bait",
            "popper",
            "hollow body frog",
            "popping frog",

            # Situational depth/structure
            "deep crankbait",
            "football jig",
            "casting jig",
            "carolina rig",
            "dropshot",

            # Suspended/clear windows or cold snaps
            "jerkbait",
            "soft jerkbait",
            "jighead minnow",

            # Rare fall (mostly for colder late-fall)
            "blade bait",
            "flat-sided crankbait",
            "swim jig",
            "wacky rig",
            "neko rig",
        ],
        "avoid": [],
    },

    "condition_modifiers": {
        "wind": {
            "description": "Wind or current influence / surface disturbance present",
            "bias_toward": [
                "lipless crankbait",
                "spinnerbait",
                "chatterbait",
                "shallow crankbait",
                "mid crankbait",
                "paddle tail swimbait",
                "underspin",
            ],
            "topwater_allowed": [
                "walking bait",
                "whopper plopper",
                "buzzbait",
            ],
            "note": (
                "Wind positions baitfish and triggers feeding. Prioritize fast coverage on wind-blown banks, "
                "points, and creek arms. Use moving baits first, then slow down on high-percentage stretches."
            ),
        },

        "overcast": {
            "description": "Cloud cover / lower light",
            "bias_toward": [
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
                "paddle tail swimbait",
                "walking bait",
                "whopper plopper",
                "popper",
            ],
            "note": (
                "Lower light extends chase windows. Use reaction and topwater longer into the day."
            ),
        },

        "calm_conditions": {
            "description": "Calm surface, minimal wind",
            "priority_shift": [
                "shallow crankbait",
                "mid crankbait",
                "paddle tail swimbait",
                "underspin",
                "texas rig",
                "shaky head",
            ],
            "deemphasize": [
                "lipless crankbait",
                "spinnerbait",
                "chatterbait",
                "buzzbait",
                "whopper plopper",
            ],
            "topwater_hierarchy": [
                "popper",
                "wake bait",
                "walking bait",
            ],
            "note": (
                "Calm conditions reduce the 'chaos' that fall feeding thrives on. Keep presentations believable: "
                "use subtler moving baits and rely more on cleanup baits when activity is not obvious."
            ),
        },

        "sunny_high_pressure": {
            "description": "Bright skies and/or high or rising pressure",
            "priority_shift": [
                "shaky head",
                "ned rig",
                "texas rig",
                "paddle tail swimbait",
                "shallow crankbait",
            ],
            "deemphasize": [
                "lipless crankbait",
                "spinnerbait",
                "chatterbait",
                "buzzbait",
                "whopper plopper",
            ],
            "note": (
                "High pressure can tighten fall fish, especially in clear water. Use a realistic baitfish profile "
                "and slow down with cleanup baits when the reaction bite fades."
            ),
        },

        "falling_pressure": {
            "description": "Pressure dropping; storm/front approach",
            "bias": "more_opportunistic",
            "bias_toward": [
                "lipless crankbait",
                "chatterbait",
                "spinnerbait",
                "walking bait",
                "whopper plopper",
                "buzzbait",
            ],
            "note": (
                "Dropping pressure often boosts the fall bite and can create sustained feeding. "
                "Lean into coverage and topwater when activity is present."
            ),
        },

        "rising_pressure": {
            "description": "Post-front; pressure climbing",
            "difficulty": "more_difficult",
            "priority_shift": [
                "shaky head",
                "ned rig",
                "texas rig",
                "dropshot",
            ],
            "deemphasize": [
                "all_topwater_fast",
                "lipless crankbait",
                "chatterbait",
                "spinnerbait",
            ],
            "note": (
                "Post-front conditions can sharply reduce chase. Keep one moving bait for scouting, "
                "but expect cleanup baits to do the work."
            ),
        },

        "cold_snap": {
            "description": "Unseasonably cold stretch / late-fall transition",
            "priority_shift": [
                "flat-sided crankbait",
                "jerkbait",
                "blade bait",
                "shaky head",
                "ned rig",
            ],
            "deemphasize": [
                "buzzbait",
                "whopper plopper",
                "walking bait",
            ],
            "note": (
                "Cold snaps compress windows and reduce speed tolerance. Shift to tighter wobble and pause-based tools."
            ),
        },
    },

    "lure_caveats": {
        "lipless crankbait": {
            "why": "Fall workhorse for covering water and finding schooling fish",
            "best_when": "wind, overcast, falling pressure, baitfish activity",
            "technique": "Steady retrieve or yo-yo; rip free from cover; avoid forcing in slick high pressure",
        },
        "shallow crankbait": {
            "why": "Primary fall baitfish imitator around shallow cover and hard edges",
            "best_when": "baitfish shallow; rock/riprap/wood edges; calm to moderate wind",
            "technique": "Deflect off cover; vary speed; pause after contact",
        },
        "chatterbait": {
            "why": "All-season and excellent in fall when fish are feeding; can be out of place in slick calm",
            "emphasize_when": "wind, overcast, falling pressure, visible perimeter activity",
            "deemphasize_when": "calm slick conditions or post-front high pressure",
            "technique": "Moderate retrieve; let it hunt; target edges and lanes",
        },
        "underspin": {
            "why": "Subtle baitfish tool when you want flash without bulk vibration",
            "best_when": "calm or clear water; pressured fish; schooling baitfish",
            "technique": "Steady retrieve; keep in mid column; match bait depth",
        },
        "topwater": {
            "rule": (
                "Topwater is conditional in fall. It is strongest in low light, overcast, and falling pressure, "
                "or when bait is actively being chased on the surface."
            ),
            "surface_match": {
                "calm": ["popper", "wake bait"],
                "light_chop": ["walking bait", "popper", "wake bait"],
                "windy": ["whopper plopper", "buzzbait", "walking bait"],
            },
        },
        "flat-sided crankbait": {
            "note": "Best for late-fall/cold snaps when a tighter wobble outperforms wide wobble cranks.",
        },
        "blade bait": {
            "note": "Primarily late-fall/cold snap tool when fish slide deeper and prefer vertical vibration.",
        },
    },
}


FALL_POLICY_PROSE = r"""
FALL SEASONAL POLICY

Fall bass are baitfish-driven and often roam and school. Wind and low light extend chase windows,
making reaction baits the primary tools for finding active fish. Use a fast coverage bait first,
then clean up productive stretches with a slower precision option.

In calm or post-front conditions, the reaction bite can fade quickly. Keep presentations believable,
lean into subtler baitfish tools, and rely more on cleanup baits when activity is not obvious.

Water clarity affects color selection only, not lure eligibility.
"""
