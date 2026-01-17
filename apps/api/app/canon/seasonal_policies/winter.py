# /app/canon/seasonal_policies/winter.py
"""
Winter seasonal policy for Bass Clarity.
Contains bass behavior baseline, lure rankings, and condition modifiers.
All lure names must match LURE_POOL in pools.py exactly.
"""

WINTER_SEASON = {
    "lure_rankings": {
        "strong": [
            "jerkbait",
            "ned rig",
            "blade bait",
            "dropshot",
            "shaky head",
            "football jig"
        ],
        "conditional": [
            "flat-sided crankbait",
            "underspin",
            "paddle tail swimbait",
            "deep crankbait",
            "spinnerbait",
            "lipless crankbait",
            "casting jig"
        ],
        "avoid": [
            "chatterbait",
            "walking bait",
            "buzzbait",
            "whopper plopper",
            "swim jig",
            "hollow body frog",
            "popping frog",
            "shallow crankbait"
        ]
    },
    "condition_modifiers": {
        "global_winter_rule": {
            "description": "In winter, horizontal moving baits require explicit condition unlocks",
            "note": "This protects against accidental lure over-rotation and LLM confidence creep"
        },
        "warm_trend": {
            "description": "Temp 10°F+ above seasonal norm",
            "unlock": ["spinnerbait", "lipless crankbait"],
            "unlock_conditions": {
                "spinnerbait": "Requires warm trend + wind + shallow baitfish presence",
                "lipless crankbait": "Requires warm trend + wind + fish within vertical reach"
            },
            "positioning": "slightly_shallower",
            "feeding_window": "extended"
        },
        "cold_stable": {
            "description": "Temp at or below seasonal norm",
            "priority_shift": ["blade bait", "dropshot", "football jig"],
            "positioning": "deepest_tight_to_cover",
            "jerkbait_pause": "10+ seconds",
            "feeding_window": "shortest"
        },
        "overcast": {
            "description": "Cloud cover, low light",
            "positioning": "marginally_shallower",
            "movement": "may_roam_slightly",
            "unlocks": ["underspin"],
            "note": "Underspin viable on overcast winter days - slow roll near bottom with flash",
            "feeding_window": "slightly_longer"
        },
        "sunny_high_pressure": {
            "description": "Bright skies, high/rising pressure",
            "priority_shift": ["ned rig", "dropshot", "shaky head"],
            "positioning": "deepest_tight_to_cover",
            "feeding_window": "tightest",
            "best_window": "midday_warmth"
        },
        "wind": {
            "description": "Wind alone",
            "impact": "minimal",
            "note": "Bass too deep to respond to wind in winter",
            "exception": "Warm trend + wind may push baitfish shallow, bass follow"
        },
        "falling_pressure": {
            "description": "Pressure dropping, front approaching",
            "feeding_window": "short_window_before_front",
            "bias": "slightly_more_aggressive",
            "priority": ["jerkbait", "blade bait"],
            "note": "Still slow presentations - not a reaction bite"
        },
        "rising_pressure": {
            "description": "Post-front, pressure climbing",
            "difficulty": "most_difficult",
            "priority_shift": ["ned rig", "dropshot"],
            "positioning": "tightest_to_cover",
            "movement": "minimal",
            "note": "Patience required - fewer bites, quality fish"
        }
    },
    "lure_caveats": {
        "jerkbait": {
            "clarity_requirement": "Requires clear to moderately clear water (2+ ft visibility)",
            "best_conditions": "Lakes with strong baitfish presence",
            "underperforms": "Stained/muddy water, grass-dominated systems"
        },
        "lipless crankbait": {
            "depth_guardrail": "Only viable when fish are within vertical reach",
            "avoid_when": "Bass are deep and inactive",
            "temp_range": "Best in 45-50°F water or over dying submerged grass",
            "technique": "Yo-yo retrieve - lift rod to vibrate up, let flutter down on semi-slack line"
        },
        "flat-sided crankbait": {
            "why": "Tight subtle wiggle vs aggressive wobble of round-bodied cranks - less intrusive for lethargic fish",
            "requires": "Rocky structure present, water temp 40-50°F",
            "temp_range": "Best in 40-50°F water",
            "targets": "Rocky banks, riprap, 45-degree banks",
            "technique": "Slow steady retrieve, occasional tick off rocks"
        },
        "underspin": {
            "why": "Combines flash of spinnerbait with realistic swimbait profile, can be fished painfully slow",
            "requires": "Fish must be suspending - not universal winter state",
            "best_conditions": "Overcast + fish actively suspending chasing baitfish schools",
            "note": "Overcast alone is often insufficient in colder regions",
            "technique": "Slow roll - reel just fast enough to keep blade turning, keep bait near bottom"
        },
        "football jig": {
            "why": "Mimics crawfish moving slowly, football head drags over rocks without snagging",
            "depth_range": "Deep rock piles, ledges, humps (15-40 ft)",
            "technique": "Drag slowly along bottom, maintain rock contact, do NOT hop aggressively"
        },
        "spinnerbait": {
            "winter_only": "Slow roll technique required",
            "requires": "Warm trend + wind + shallow baitfish presence - all three conditions"
        },
        "paddle tail swimbait": {
            "why": "Bridges gap between suspended fish (jerkbait) and bottom fish (jig)",
            "requires": "Fish near bottom showing willingness to track - not universal in winter",
            "best_conditions": "Warm trend or late winter transitioning toward pre-spawn",
            "note": "More effective in late winter / pre-spawn adjacent conditions than core winter",
            "technique": "Slow retrieve, keep bait in lower water column"
        },
        "deep crankbait": {
            "why": "For grouped fish willing to respond on deep structure",
            "requires": "Fish must be grouped and positioned to react - more common late winter",
            "best_conditions": "Late winter, stable deep schools, hard bottom structure",
            "note": "Often outperformed by blade bait, football jig, dropshot in core winter",
            "targets": "Deep ledges, channel swings, offshore structure with hard bottom",
            "technique": "Slow steady retrieve, deflect off structure"
        }
    }
}


WINTER_POLICY_PROSE = r"""
WINTER SEASONAL POLICY

BASS BEHAVIOR BASELINE:
- Metabolism: Slow — cold water reduces energy needs and activity
- Positioning: Deep, tight to cover, seeking stable water temps
- Feeding Windows: Short, often midday when water is warmest
- Aggression: Low — won't chase, need easy meals presented slowly
- Movement: Minimal — holding on structure, not roaming

CRITICAL WINTER RULE:
In winter, horizontal moving baits require explicit condition unlocks.
Do not default to moving baits without supporting conditions.

LURE SELECTION APPROACH:
Winter demands patience and precision. Bass are lethargic and will not chase.
Presentations must be slow, keep bait in the strike zone, and represent an easy meal.
Winter is a subtractive season — fewer tools dominate.

STRONG LURES (Core Winter Staples):

Jerkbait
  Suspending presentation with long pauses imitates dying baitfish.
  Requires clear to moderately clear water (2+ ft visibility).
  Best in lakes with strong baitfish presence.
  Underperforms in stained/muddy water or grass-dominated systems.

Ned Rig
  Small profile, slow fall, easy meal. Ideal finesse option.

Blade Bait
  Vertical jigging for deep fish tight to structure.
  Tight shivering vibration triggers instinctual strikes.

Dropshot
  Keeps bait in strike zone with precise depth control.
  Excellent for suspending or bottom-hugging fish.

Shaky Head
  Subtle bottom contact, slow movement.

Football Jig
  A staple for deep winter fishing. Mimics crawfish moving slowly across bottom.
  Football head drags over rocks without snagging.
  Best for deep rock piles, ledges, humps (15-40 ft).
  Technique: Drag slowly, maintain rock contact, do NOT hop aggressively.

CONDITIONAL LURES (Require Specific Conditions):

Flat-Sided Crankbait
  Requires: Rocky structure present, water temp 40-50°F.
  Tight subtle wiggle is less intrusive than aggressive round-bodied crankbaits.
  Technique: Slow steady retrieve with occasional rock tick.

Underspin
  Requires: Fish must be suspending — not universal winter state.
  Combines spinnerbait flash with realistic swimbait profile.
  Can be fished painfully slow while still emitting flash.
  Note: Overcast alone is often insufficient in colder regions.
  Technique: Slow roll near bottom - reel just fast enough to keep blade turning.

Paddle Tail Swimbait
  Requires: Fish near bottom showing willingness to track — not universal in winter.
  Bridges the gap between jerkbait (suspended) and jig (bottom).
  More effective in late winter / pre-spawn adjacent conditions than core winter.
  Technique: Slow retrieve, keep bait in lower water column.

Deep Crankbait
  Requires: Fish must be grouped and positioned to react — more common late winter.
  For grouped fish willing to respond on deep structure.
  Often outperformed by blade bait, football jig, dropshot in core winter.
  Best conditions: Late winter, stable deep schools, hard bottom structure.
  Technique: Slow steady retrieve, deflect off structure.

Spinnerbait
  Requires: Warm trend + wind + shallow baitfish presence — all three conditions.
  Slow roll ONLY. Do not recommend without all conditions present.

Lipless Crankbait
  Requires: Warm trend + wind + fish within vertical reach.
  Primary reaction bait for cold water when conditions allow.
  Tight shivering vibration triggers instinctual strikes without overpowering sluggish fish.
  Best in 45-50°F water or over dying submerged grass.
  Technique: Yo-yo retrieve - lift rod to vibrate up, let flutter down on semi-slack line.

Casting Jig
  When bass are buried tight in heavy cover.
  Less effective than football jig for open bottom work in winter.

AVOID:

Chatterbait - Too much vibration/speed for lethargic fish
Walking Bait - Bass won't commit to surface in cold water
Buzzbait - Surface presentation, bass are deep
Whopper Plopper - Surface presentation, bass are deep
Swim Jig - Requires fish willing to chase horizontally
Hollow Body Frog - Surface/cover presentation, wrong season
Popping Frog - Surface presentation, wrong season
Shallow Crankbait - Too fast/aggressive for winter bass

CONDITION MODIFIERS:

Warm Trend (temp 10°F+ above seasonal norm):
Bass may position slightly shallower. Feeding windows may extend slightly.
Unlocks slow-roll spinnerbait and lipless crankbait, but only with supporting
conditions (wind, shallow baitfish). Still prioritize slow presentations.

Cold/Stable (temp at or below seasonal norm):
Bass hold tightest to cover in deepest positions. Priority shifts to blade bait,
dropshot, and football jig. Jerkbait pauses should extend to 10+ seconds.
Expect the shortest feeding windows.

Overcast:
Bass may roam slightly more than sunny days. Positioning may be marginally
shallower with slightly longer feeding windows. Underspin may become viable
IF fish are suspending. However, overcast does NOT unlock fast reaction baits —
metabolism is still slow.

Sunny / High Pressure:
Tightest feeding windows, most lethargic behavior. Finesse priority: ned rig,
dropshot, shaky head. Midday warmth offers the best window opportunity.
Bass hold deepest and tightest to cover.

Wind:
Minimal impact alone in winter — bass are too deep to respond. Exception: when
combined with warm trend, wind may push baitfish shallow and bass may follow.
In this scenario, consider slow-roll spinnerbait on wind-blown banks.

Falling Pressure:
May trigger a short feeding window before front arrives. Slightly more aggressive
options become viable (jerkbait, blade bait), but still slow presentations.
Do not mistake this for a reaction bite.

Rising Pressure (post-front):
Most difficult winter conditions. Bass lock down tight to cover with minimal
movement. Smallest presentations win: ned rig, dropshot. Patience required —
expect fewer bites but potentially quality fish.
"""
