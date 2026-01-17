# /app/canon/seasonal_policies/summer.py
"""
Summer seasonal policy for Bass Clarity.
Contains bass behavior baseline, lure rankings, and condition modifiers.

Rules:
- All lure names must match LURE_POOL in pools.py exactly.
- Water clarity is NOT used to gate lure selection (clarity remains color-only context).
- Summer emphasizes heat management, stable positioning, and timing (early/late + wind-driven windows).
- We do NOT model thermocline explicitly in V1; use depth/structure targets + condition modifiers.
"""

SUMMER_SEASON = {
    "bass_behavior_baseline": {
        "metabolism": "high",
        "positioning": "shade_cover_or_offshore_structure_edges_thermocline_adjacent_if_present",
        "feeding_windows": "strong_early_late_wind_driven_midday_shade",
        "aggression": "medium_to_high_variable",
        "movement": "moderate_schooling_possible",
        "summary": (
            "Summer bass seek stable oxygen and temperature: shade, deeper structure, and current/wind influence. "
            "Feeding windows are strongest early/late and during wind-driven activity. Midday bites concentrate "
            "around shade, cover edges, and offshore structure where bass can hold comfortably."
        ),
    },

    "lure_rankings": {
        "strong": [
            # Offshore / structure staples
            "dropshot",
            "football jig",
            "carolina rig",
            "deep crankbait",
            "mid crankbait",

            # Versatile structure + shade tools
            "texas rig",
            "shaky head",
            "ned rig",

            # Schooling / bait-driven options
            "paddle tail swimbait",
            "jighead minnow",
        ],
        "conditional": [
            # Shallow/upper-column windows (timing + surface conditions)
            "walking bait",
            "whopper plopper",
            "buzzbait",
            "wake bait",
            "popper",
            "hollow body frog",
            "popping frog",

            # Wind / coverage tools (situational in summer)
            "chatterbait",
            "spinnerbait",
            "lipless crankbait",
            "underspin",
            "swim jig",

            # Shallow cranking windows (early/late, shade edges)
            "shallow crankbait",
            "flat-sided crankbait",

            # Other finesse/precision
            "wacky rig",
            "neko rig",
            "soft jerkbait",
            "casting jig",

            # Rare summer (generally better earlier/later seasons)
            "jerkbait",
            "blade bait",
        ],
        "avoid": [],
    },

    "condition_modifiers": {
        "heat_high_sun": {
            "description": "Hot, bright summer day (high sun / low shade tolerance)",
            "priority_shift": [
                "dropshot",
                "carolina rig",
                "football jig",
                "texas rig",
                "shaky head",
                "ned rig",
            ],
            "deemphasize": [
                "lipless crankbait",
                "spinnerbait",
                "chatterbait",
                "buzzbait",
                "whopper plopper",
                "walking bait",
            ],
            "note": (
                "High sun concentrates fish: shade, deeper structure, and slower bottom/hover tools. "
                "Down-rank noisy reaction unless wind/current creates activity."
            ),
        },

        "calm_conditions": {
            "description": "Calm surface, minimal wind",
            "priority_shift": [
                "dropshot",
                "shaky head",
                "ned rig",
                "texas rig",
                "wacky rig",
                "neko rig",
            ],
            "deemphasize": [
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
                "buzzbait",
                "whopper plopper",
                "walking bait",
            ],
            "topwater_hierarchy": [
                "popper",
                "wake bait",
                "walking bait",
            ],
            "note": (
                "Calm summer conditions often require finesse and subtle surface work. "
                "Keep topwater targeted and avoid forcing fast reaction baits."
            ),
        },

        "wind": {
            "description": "Wind or current influence / surface disturbance present",
            "bias_toward": [
                "deep crankbait",
                "mid crankbait",
                "paddle tail swimbait",
                "underspin",
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
            ],
            "topwater_allowed": [
                "walking bait",
                "whopper plopper",
                "buzzbait",
            ],
            "note": (
                "Wind increases oxygenation and positions baitfish. This can create schooling and reaction windows "
                "even in summer. Use crankbaits and moving tools on wind-blown structure and edges."
            ),
        },

        "overcast": {
            "description": "Cloud cover / lower light",
            "bias_toward": [
                "paddle tail swimbait",
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
                "walking bait",
                "whopper plopper",
                "popper",
            ],
            "note": (
                "Lower light expands roaming and increases willingness to chase. "
                "Topwater and moving baits become more believable for longer windows."
            ),
        },

        "falling_pressure": {
            "description": "Pressure dropping; storm/front approach",
            "bias": "more_opportunistic",
            "bias_toward": [
                "walking bait",
                "whopper plopper",
                "popper",
                "chatterbait",
                "spinnerbait",
                "paddle tail swimbait",
                "deep crankbait",
            ],
            "note": (
                "Dropping pressure can open a broader bite window. Keep one structure/finesse option available, "
                "but it is reasonable to lean into faster tools if activity is present."
            ),
        },

        "rising_pressure": {
            "description": "Post-front; pressure climbing",
            "difficulty": "more_difficult",
            "priority_shift": [
                "dropshot",
                "shaky head",
                "ned rig",
                "texas rig",
                "carolina rig",
            ],
            "deemphasize": [
                "all_topwater_fast",
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
            ],
            "note": (
                "Post-front summer conditions often reduce chase windows. "
                "Return to bottom/hover tools and fish shade and structure precisely."
            ),
        },
    },

    "lure_caveats": {
        "deep crankbait": {
            "why": "Primary summer tool for covering offshore structure and triggering schooling fish",
            "best_when": "wind, current, or active fish on ledges/humps/channel swings",
            "technique": "Maintain bottom contact and deflection; steady retrieve; pause after contact",
        },
        "carolina rig": {
            "why": "Search + soak combo for offshore structure; keeps bait near bottom efficiently",
            "best_when": "structure fishing when fish are not actively chasing",
            "technique": "Slow drag with pauses; maintain bottom feel; probe hard spots and edges",
        },
        "dropshot": {
            "why": "Strike-zone control for suspended or bottom-adjacent summer fish",
            "best_when": "calm, high sun, post-front, tough bite, deep targets",
            "technique": "Hold in place or slow drag; keep bait above bottom; patient shakes",
        },
        "paddle tail swimbait": {
            "why": "Baitfish match that can be fished mid-column or near bottom; excellent schooling tool",
            "best_when": "windy points, bait activity, overcast, early/late",
            "technique": "Steady retrieve; adjust depth; avoid overpowering in calm/high pressure",
        },
        "topwater": {
            "rule": (
                "All topwater is conditional in summer. Topwater is strongest early/late, in overcast, "
                "or when wind/current creates surface activity. Match lure to surface conditions: subtle in calm; "
                "louder/faster only with disturbance."
            ),
            "surface_match": {
                "calm": ["popper", "wake bait"],
                "light_chop": ["walking bait", "wake bait", "popper"],
                "windy": ["whopper plopper", "buzzbait", "walking bait"],
            },
        },
        "chatterbait": {
            "why": "Strong tool when fish are willing to chase along edges; not a default in calm/high sun",
            "emphasize_when": "wind, overcast, falling pressure, visible perimeter activity",
            "deemphasize_when": "calm slick conditions or post-front high pressure",
            "technique": "Moderate retrieve; slow down in calm; target edges and lanes",
        },
        "jerkbait": {
            "note": "Summer jerkbait is situational (cool mornings, clear water, suspended bait). Do not default to it.",
        },
        "blade bait": {
            "note": "Blade bait is rarely a summer tool unless unseasonably cold or deep vertical fish are present.",
        },
    },
}


SUMMER_POLICY_PROSE = r"""
SUMMER SEASONAL POLICY

Summer bass position for comfort: shade, oxygen, and stable temperature. Expect the best
activity early and late, with additional windows created by wind, current, and overcast skies.

Structure staples (dropshot, football jig, Carolina rig, deep/mid crankbaits) form the foundation.
Topwater is conditional and should match surface conditions: subtle in calm water, louder and faster
only when the surface is broken and fish are active.

Water clarity affects color selection only, not lure eligibility.
"""
