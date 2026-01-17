# /app/canon/seasonal_policies/postspawn.py
"""
Post-spawn seasonal policy for Bass Clarity.
Contains bass behavior baseline, lure rankings, and condition modifiers.

Rules:
- All lure names must match LURE_POOL in pools.py exactly.
- Water clarity is NOT used to gate lure selection (clarity remains color-only context).
- Post-spawn includes two common populations:
  (1) Recovery fish (negative/neutral, prefer easy meals)
  (2) Perimeter / fry-guard / opportunistic fish (more chase/defensive windows)
"""

POSTSPAWN_SEASON = {
    "bass_behavior_baseline": {
        "metabolism": "rising",
        "positioning": "transitional_first_break_first_cover_shade_some_fry_guard",
        "feeding_windows": "improving_early_late_and_wind_driven",
        "aggression": "medium_to_high_variable",
        "movement": "increasing_not_fully_summer",
        "summary": (
            "Post-spawn is a transition phase. Some bass are recovering and prefer slow, easy meals, "
            "while others are guarding fry or roaming the perimeter and will respond to faster presentations. "
            "The goal is to cover both lanes: one precision option for recovery fish and one higher-tempo option "
            "for perimeter activity when conditions support it."
        ),
    },

    "lure_rankings": {
        "strong": [
            # Precision / recovery lane
            "wacky rig",
            "neko rig",
            "dropshot",
            "shaky head",
            "texas rig",
            "ned rig",

            # Perimeter / opportunistic lane
            "paddle tail swimbait",
            "spinnerbait",
            "chatterbait",

            # Targeted topwater (post-spawn staple)
            "popper",
        ],
        "conditional": [
            # Topwater (all conditional except popper which is strong here)
            "walking bait",
            "buzzbait",
            "whopper plopper",
            "wake bait",
            "hollow body frog",
            "popping frog",

            # Reaction / coverage (situational)
            "lipless crankbait",
            "shallow crankbait",
            "mid crankbait",
            "deep crankbait",
            "flat-sided crankbait",
            "underspin",
            "jighead minnow",
            "soft jerkbait",
            "jerkbait",

            # Bottom contact expansions
            "casting jig",
            "football jig",
            "carolina rig",

            # Rare post-spawn (only if unseasonably cold)
            "blade bait",
        ],
        "avoid": [],
    },

    "condition_modifiers": {
        "calm_conditions": {
            "description": "Calm surface, minimal wind, slick water",
            "priority_shift": [
                "wacky rig",
                "neko rig",
                "dropshot",
                "shaky head",
                "ned rig",
                "texas rig",
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
                "popping frog",
                "walking bait",
            ],
            "note": (
                "Calm conditions favor recovery fish and precise presentations. "
                "Keep topwater subtle and targeted. Reaction baits should be visually down-ranked "
                "when the surface is slick and bass are unlikely to chase."
            ),
        },

        "wind": {
            "description": "Wind or surface disturbance present",
            "bias_toward": [
                "chatterbait",
                "spinnerbait",
                "paddle tail swimbait",
                "lipless crankbait",
            ],
            "topwater_allowed": [
                "walking bait",
                "buzzbait",
                "whopper plopper",
            ],
            "note": (
                "Wind increases perimeter movement and opens chase windows. "
                "Prioritize moving baits and faster surface options on wind-blown edges."
            ),
        },

        "overcast": {
            "description": "Cloud cover / lower light",
            "bias_toward": [
                "chatterbait",
                "spinnerbait",
                "paddle tail swimbait",
                "popper",
                "soft jerkbait",
            ],
            "note": (
                "Lower light reduces visual pressure and can keep fish active longer. "
                "Topwater and moving baits become more believable when light is low."
            ),
        },

        "sunny_high_pressure": {
            "description": "Bright skies and/or high or rising pressure",
            "priority_shift": [
                "wacky rig",
                "neko rig",
                "dropshot",
                "shaky head",
                "ned rig",
            ],
            "deemphasize": [
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
                "buzzbait",
                "whopper plopper",
                "walking bait",
            ],
            "note": (
                "High pressure tightens the bite. Recovery fish dominate and perimeter activity shrinks. "
                "Downshift to finesse and keep presentations slow and precise."
            ),
        },

        "falling_pressure": {
            "description": "Pressure dropping; front approaching",
            "bias": "more_opportunistic",
            "bias_toward": [
                "chatterbait",
                "spinnerbait",
                "paddle tail swimbait",
                "popper",
            ],
            "note": (
                "Falling pressure can extend feeding windows and increase perimeter aggression. "
                "Keep one precision option available, but lean into higher-tempo tools when conditions support it."
            ),
        },

        "rising_pressure": {
            "description": "Post-front; pressure climbing",
            "difficulty": "more_difficult",
            "priority_shift": [
                "wacky rig",
                "neko rig",
                "dropshot",
                "shaky head",
                "ned rig",
            ],
            "deemphasize": [
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
                "all_topwater_fast",
            ],
            "note": (
                "Post-front conditions reduce movement and shrink windows. "
                "Finesse dominates; keep topwater minimal and only if activity is obvious."
            ),
        },
    },

    "lure_caveats": {
        "chatterbait": {
            "why": (
                "All-season lure and a strong post-spawn option, especially when perimeter fish are active."
            ),
            "emphasize_when": "wind or surface disturbance or overcast",
            "deemphasize_when": "calm slick conditions or high pressure",
            "technique": "Moderate retrieve; slow down in calm water; target perimeter cover and lanes",
        },
        "popper": {
            "why": (
                "Post-spawn staple for targeted surface disturbance. Effective for fry-guard or bluegill-focused fish "
                "and remains believable even in calmer conditions."
            ),
            "best_when": "calm to light chop; overcast; early/late",
            "technique": "Targeted pops with pauses; fish around shade edges and cover points",
        },
        "lipless crankbait": {
            "why": "High-tempo coverage tool when fish are willing to chase",
            "best_when": "windy or overcast conditions; active perimeter fish",
            "technique": "Steady retrieve or lift-and-drop around cover; avoid forcing in calm/high pressure",
        },
        "paddle tail swimbait": {
            "why": "Bridges finesse and reaction; covers water without excessive vibration",
            "best_when": "perimeter activity; slight wind; fish tracking in mid column",
            "technique": "Steady slow to moderate retrieve; keep in lower-mid column near cover edges",
        },
        "ned rig": {
            "why": "Recovery and high-pressure problem-solver; easy meal presentation",
            "best_when": "calm, high pressure, post-front, tough bite",
            "technique": "Minimal movement; short drags; repeated casts to high-percentage targets",
        },
        "topwater": {
            "rule": (
                "Topwater is conditional in post-spawn except popper which is a targeted staple. "
                "Match topwater choice to surface conditions: subtle in calm; louder/faster only with disturbance."
            ),
            "surface_match": {
                "calm": ["popper", "wake bait", "popping frog"],
                "light_chop": ["walking bait", "wake bait", "popper"],
                "windy": ["whopper plopper", "buzzbait", "walking bait"],
            },
        },
    },
}


POSTSPAWN_POLICY_PROSE = r"""
POST-SPAWN SEASONAL POLICY

Post-spawn is a transition phase. Some bass are recovering and prefer slow, easy meals,
while others are guarding fry or roaming the perimeter and will respond to faster presentations.

Approach post-spawn with two lanes in mind:
1) A precision option for recovery fish (finesse and bottom contact)
2) A higher-tempo option for perimeter activity when conditions support it (wind, overcast, falling pressure)

Calm, sunny, high-pressure days favor finesse and targeted presentations.
Wind, overcast, and falling pressure increase movement and open reaction and topwater windows.

Water clarity affects color selection only, not lure eligibility.
"""
