# /app/canon/seasonal_policies/spawn.py
"""
Spawn seasonal policy for Bass Clarity.
Contains bass behavior baseline, lure rankings, and condition modifiers.

Rules:
- All lure names must match LURE_POOL in pools.py exactly.
- Water clarity is NOT used to gate lure selection (clarity remains color-only context).
- Spawn bites are defensive/territorial, not feeding-driven.
"""

SPAWN_SEASON = {
    "bass_behavior_baseline": {
        "metabolism": "moderate",
        "positioning": "shallow_locked_to_beds_or_immediate_perimeter",
        "feeding_windows": "not_feeding_driven",
        "aggression": "high_defensive_selective",
        "movement": "minimal",
        "summary": (
            "Spawn is not a feeding season. Bass are shallow and locked to beds or immediate "
            "perimeter cover. Bites are driven by territory and irritation, not hunger. "
            "Precision, repetition, and patience outperform speed and coverage."
        ),
    },

    "lure_rankings": {
        "strong": [
            "texas rig",
            "wacky rig",
            "neko rig",
            "dropshot",
            "shaky head",
            "casting jig",
            "soft jerkbait",
            "chatterbait",
        ],
        "conditional": [
            # Topwater (all conditional – effectiveness depends on surface conditions)
            "walking bait",
            "buzzbait",
            "whopper plopper",
            "wake bait",
            "hollow body frog",
            "popping frog",
            "popper",

            # Perimeter / roaming / reaction
            "jerkbait",
            "spinnerbait",
            "lipless crankbait",
            "paddle tail swimbait",
            "underspin",
            "jighead minnow",
            "ned rig",
            "football jig",
            "carolina rig",
            "flat-sided crankbait",
            "mid crankbait",
            "shallow crankbait",
            "deep crankbait",
            "blade bait",
        ],
        "avoid": [],
    },

    "condition_modifiers": {
        "calm_conditions": {
            "description": "Calm surface, minimal wind, slick water",
            "priority_shift": [
                "texas rig",
                "wacky rig",
                "neko rig",
                "dropshot",
                "shaky head",
            ],
            "deemphasize": [
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
                "buzzbait",
                "whopper plopper",
            ],
            "topwater_hierarchy": [
                "popper",
                "popping frog",
                "walking bait",
            ],
            "note": (
                "Calm conditions favor subtle, precise intrusion. Loud or fast reaction baits "
                "appear unnatural and should be visually down-ranked."
            ),
        },

        "wind": {
            "description": "Wind or surface disturbance present",
            "bias_toward": [
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
                "paddle tail swimbait",
            ],
            "topwater_allowed": [
                "walking bait",
                "buzzbait",
                "whopper plopper",
                "hollow body frog",
            ],
            "note": (
                "Wind increases perimeter movement and makes reaction tools viable. "
                "This targets roaming or edge fish, not bed-locked fish."
            ),
        },

        "overcast": {
            "description": "Cloud cover / lower light",
            "bias_toward": [
                "soft jerkbait",
                "chatterbait",
                "spinnerbait",
                "popper",
            ],
            "note": (
                "Lower light reduces visual pressure and can increase roaming. "
                "Still prioritize precision over speed."
            ),
        },

        "sunny_high_pressure": {
            "description": "Bright skies and/or high or rising pressure",
            "priority_shift": [
                "neko rig",
                "wacky rig",
                "dropshot",
                "shaky head",
                "texas rig",
            ],
            "deemphasize": [
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
                "buzzbait",
                "whopper plopper",
            ],
            "note": (
                "High pressure tightens the bite and increases selectivity. "
                "Slow, repetitive presentations dominate."
            ),
        },

        "falling_pressure": {
            "description": "Pressure dropping; front approaching",
            "bias_toward": [
                "soft jerkbait",
                "chatterbait",
                "popper",
            ],
            "note": (
                "Falling pressure can briefly increase defensive aggression, especially "
                "on perimeter fish. Bed tools remain primary."
            ),
        },

        "rising_pressure": {
            "description": "Post-front; pressure climbing",
            "priority_shift": [
                "neko rig",
                "wacky rig",
                "dropshot",
                "shaky head",
                "ned rig",
            ],
            "deemphasize": [
                "chatterbait",
                "spinnerbait",
                "lipless crankbait",
                "all_topwater",
            ],
            "note": (
                "Post-front spawn conditions are difficult. Fish lock down tightly; "
                "patience and finesse are required."
            ),
        },
    },

    "lure_caveats": {
        "chatterbait": {
            "why": (
                "All-season lure and viable during spawn, but effectiveness depends on "
                "surface disturbance and perimeter movement."
            ),
            "emphasize_when": "wind or surface disturbance",
            "deemphasize_when": "calm slick conditions",
            "technique": "Slow to moderate retrieve; avoid burning over beds",
        },
        "topwater": {
            "rule": (
                "All topwater is conditional during spawn. Effectiveness depends on surface "
                "conditions and fish positioning. Subtle topwater excels in calm conditions; "
                "loud/fast topwater requires wind or broken surface."
            ),
        },
        "soft jerkbait": {
            "why": "Excellent perimeter and cruiser tool during spawn",
            "best_when": "Overcast, falling pressure, or cruising males",
            "technique": "Short twitches with pauses; target bed edges and lanes",
        },
        "ned rig": {
            "why": "Finesse option for stubborn or pressured spawn fish",
            "best_when": "High pressure or post-front conditions",
            "technique": "Minimal movement; repeated casts to target",
        },
    },
}


SPAWN_POLICY_PROSE = r"""
SPAWN SEASONAL POLICY

Spawn is not a feeding season. Bass are shallow and locked to beds or immediate
perimeter cover. Bites are driven by territory and irritation, not hunger.

Precision, repetition, and patience are more important than covering water.
Use bed tools first, and only lean into reaction or topwater options when
conditions justify movement or surface disturbance.

Calm conditions favor subtle intrusion. Wind, overcast, and falling pressure
can expand perimeter activity, but bed tools remain the foundation of spawn fishing.
"""
