# apps/api/app/services/plan_enrichment.py
"""
Post-LLM enrichment: Add gear recommendations and strategy tips deterministically.
"""
from typing import Any, Dict, List, Tuple
import hashlib
import json


PRESENTATION_TO_FAMILY = {
    "Surface Chase": "surface_chase",
    "Surface Ambush": "surface_ambush",
    "Horizontal Reaction": "horizontal_moving",
    "Slow Roll / Glide": "slow_roll_glide",
    "Bottom Contact - Dragging": "bottom_dragging",
    "Bottom Contact - Lift/Drop": "bottom_lift_drop",
    "Vertical Reaction": "vertical_hover",
    "Hovering / Mid-Column Finesse": "vertical_hover",
}


# -----------------------------
# Tip system
# -----------------------------

Tip = Tuple[str, str, Tuple[str, ...]]  # (text, category, tags)

TIP_BANK: Dict[str, List[Tip]] = {
    "horizontal_moving": [
        ("Start with a search cadence, then slow down only on the stretches where you get follows or bumps.", "cadence", ("any",)),
        ("Make repeat passes from different angles—fish often show you the best cast direction before they bite.", "angles", ("any",)),
        ("Prioritize 'choke points' (points, channel swings, inside turns) where movers naturally funnel bait.", "targets", ("any",)),
        ("If fish are slapping at it, shorten the pause and speed up—reaction bites often need a cleaner trigger.", "cadence", ("bright",)),
        ("In wind, set up so your bait tracks with the drift—natural speed + longer strike zone.", "positioning", ("windy",)),
        ("On calm water, downshift profile/sound and let the bait travel straighter—less commotion, more commitment.", "gear", ("calm",)),
        ("Run the bait past shade lines and isolated cover—treat shade as the 'lane,' not the destination.", "targets", ("bright",)),
        ("In low light, widen the search: cover the first 2–4 feet of depth changes before committing deeper.", "targets", ("low_light",)),
    ],
    "slow_roll_glide": [
        ("Keep it just above the level of the fish—tick the top of cover, don't plow through it.", "depth", ("any",)),
        ("Use 'contact checks': let it touch once, then lift and continue—those micro-breaks create the bite moment.", "cadence", ("any",)),
        ("In wind, slow-roll parallel to wind-blown structure so the bait stays in the strike zone longer.", "positioning", ("windy",)),
        ("In clear/brighter conditions, extend the glide window—longer hangs get more followers to commit.", "cadence", ("bright",)),
        ("If you're snagging, you're too low—raise the track line before you change anything else.", "depth", ("any",)),
        ("Aim for edges: grass line, rock-to-mud transitions, or the first hard break off the flat.", "targets", ("any",)),
    ],
    "bottom_dragging": [
        ("Drag with the rod, not the reel—reel only to regain slack so the bait stays 'alive' on bottom.", "cadence", ("any",)),
        ("When it feels 'too slow,' slow down more—bottom bites are often the pause after movement.", "cadence", ("any",)),
        ("Work transitions: gravel-to-mud, rock-to-sand, shell patches—bottom change is your strike trigger.", "targets", ("any",)),
        ("In wind, use it to your advantage: drag downwind so the bait maintains consistent bottom contact.", "positioning", ("windy",)),
        ("In calm/clear, lighten up and lengthen the leader/line—subtle bottom contact beats thumps.", "gear", ("calm", "bright")),
        ("If you're getting pecked, shorten the pause; if you're getting nothing, lengthen it.", "cadence", ("any",)),
        ("Fan-cast in a semi-circle before moving—bottom fish often sit on a tiny sweet spot.", "positioning", ("any",)),
    ],
    "bottom_lift_drop": [
        ("Lift just enough to clear cover, then let it fall on semi-slack—most bites happen on the drop.", "cadence", ("any",)),
        ("If cover is sparse, make the hops longer; if cover is thick, make them short and controlled.", "cadence", ("any",)),
        ("Target 'vertical stuff': dock posts, laydown ends, rock edges—lift/drop shines on hard edges.", "targets", ("any",)),
        ("In wind, tighten your line management—watch for jumps and 'stops' on the fall.", "gear", ("windy",)),
        ("Bright conditions: focus on the darkest shade and let it soak after each drop.", "targets", ("bright",)),
        ("Low light: speed up the rhythm—fish often eat lift/drop more aggressively when they roam.", "cadence", ("low_light",)),
    ],
    "vertical_hover": [
        ("Win by time-in-zone: hold it in place, then micro-shake—tiny movement, long exposure.", "cadence", ("any",)),
        ("Use your electronics/line angle as feedback—if the line drifts, reposition before you change the lure.", "positioning", ("windy", "any")),
        ("Set a 'countdown' rule: if you don't get a bite in 20–40 seconds, move 10–20 feet and repeat.", "positioning", ("any",)),
        ("Bright conditions: hover tighter to cover/structure edges—fish pin to the sharpest boundary.", "targets", ("bright",)),
        ("Low light: hover slightly higher in the column—fish often rise and meet it.", "depth", ("low_light",)),
        ("In wind, add just enough weight to stay vertical—control beats finesse when you can't hold position.", "gear", ("windy",)),
    ],
    "surface_chase": [
        ("Cover water fast until you get a show—then immediately re-cast the same lane and follow up behind it.", "cadence", ("any",)),
        ("Use wind seams and current-like edges—surface fish set up where speed changes.", "targets", ("windy",)),
        ("In low light, run the highest-percentage water first: points, pockets, and shallow flats near depth.", "targets", ("low_light",)),
        ("When they miss, don't overreact—keep it moving but add a brief hesitation at the miss point.", "cadence", ("any",)),
        ("Bright/calm: favor quieter walking/creeping actions and stay off the bank—long casts matter.", "gear", ("calm", "bright")),
    ],
    "surface_ambush": [
        ("Make the first cast your best cast—ambush bites are often first-look fish near cover.", "positioning", ("any",)),
        ("Work tight to targets: shade lines, laydowns, dock corners—precision beats speed here.", "targets", ("bright", "any")),
        ("In wind, choose protected pockets and 'quiet water' behind cover—ambushers sit where it's calmer.", "targets", ("windy",)),
        ("Pause longer beside cover than you want to—ambush fish commit during the dead stop.", "cadence", ("any",)),
        ("Low light: expand to the edges of cover—fish slide out and still ambush along the boundary.", "targets", ("low_light",)),
    ],
}

WEATHER_MODULES: List[Tip] = [
    ("Use the wind: fish the windward side of points/banks where bait gets pushed and bites trend more decisive.", "weather", ("windy",)),
    ("On calm water, reduce disturbance: longer casts, cleaner entries, and a tighter cadence often outperform noise.", "weather", ("calm",)),
    ("Low light extends roaming windows—lean into mobility and hit more 'high-percentage' spots per hour.", "weather", ("low_light",)),
    ("Bright skies: prioritize shade, hard edges, and the cleanest angles—efficiency matters more than volume.", "weather", ("bright",)),
    ("If rain/pressure shift is present, expect positioning changes—check the next depth line or the next piece of cover.", "weather", ("rain", "cold_front")),
]

STALL_VARIANTS: List[str] = [
    "If it stalls, change **one variable**: angle, cadence, or a close cousin within the same presentation.",
    "When bites fade, don't reset everything—rotate just one lever (angle → cadence → nearby target) and re-test.",
    "If the pattern cools off, keep the presentation and adjust the details: speed, pauses, and cast direction first.",
]


def _stable_seed(*parts: Any) -> int:
    s = json.dumps(parts, sort_keys=True, default=str)
    h = hashlib.sha256(s.encode("utf-8")).hexdigest()
    return int(h[:8], 16)


def _weather_flags(weather: Dict[str, Any]) -> Dict[str, bool]:
    wind_speed = float(weather.get("wind_mph", 0) or 0)
    sky = (weather.get("cloud_cover") or "").lower()
    precip = (weather.get("precip") or weather.get("precip_type") or "").lower()

    is_windy = wind_speed >= 12
    is_calm = wind_speed <= 3
    is_low_light = any(k in sky for k in ["cloud", "overcast", "rain", "storm", "fog"])
    is_bright = not is_low_light
    is_rain = "rain" in sky or "rain" in precip or "storm" in sky

    # Optional: if you already compute fronts elsewhere, pass it in.
    is_cold_front = bool(weather.get("cold_front", False))

    return {
        "windy": is_windy,
        "calm": is_calm,
        "low_light": is_low_light,
        "bright": is_bright,
        "rain": is_rain,
        "cold_front": is_cold_front,
    }


def get_presentation_family(presentation: str) -> str:
    return PRESENTATION_TO_FAMILY.get(presentation, "horizontal_moving")


def _score_tip(tags: Tuple[str, ...], flags: Dict[str, bool]) -> int:
    # Base score
    score = 1

    if "any" in tags:
        score += 1

    for t in tags:
        if t != "any" and flags.get(t, False):
            score += 3

    # Small penalty if tip requires calm but it's windy (or vice versa)
    if "calm" in tags and flags.get("windy", False):
        score -= 2
    if "windy" in tags and flags.get("calm", False):
        score -= 2

    return score


def _pick_tips_deterministic(
    candidates: List[Tip],
    seed: int,
    flags: Dict[str, bool],
    max_tips: int,
    used_categories: set,
) -> List[str]:
    # Score + deterministic shuffle
    scored = []
    for text, cat, tags in candidates:
        scored.append((_score_tip(tags, flags), cat, text))

    # Deterministic ordering: sort by score desc, then by seeded hash of text
    def key_fn(item):
        score, cat, text = item
        tie = _stable_seed(seed, text)
        return (-score, tie)

    scored.sort(key=key_fn)

    out: List[str] = []
    for score, cat, text in scored:
        if score <= 0:
            continue
        if cat in used_categories:
            continue
        out.append(text)
        used_categories.add(cat)
        if len(out) >= max_tips:
            break
    return out


def build_strategy_for_presentation(presentation: str, weather: Dict[str, Any]) -> List[str]:
    """
    Generate actionable strategy tips for a specific presentation.
    Deterministic, varied, and less templated.
    """
    family = get_presentation_family(presentation)
    flags = _weather_flags(weather)

    # Seed depends on presentation + meaningful weather fields
    seed = _stable_seed(
        presentation,
        family,
        weather.get("wind_mph"),
        weather.get("cloud_cover"),
        weather.get("precip"),
        weather.get("cold_front", False),
        weather.get("temp_f"),
    )

    used_categories = set()

    tips: List[str] = []

    # 1) Pull 2 family tips with category diversity
    family_candidates = TIP_BANK.get(family, TIP_BANK["horizontal_moving"])
    tips += _pick_tips_deterministic(
        candidates=family_candidates,
        seed=seed,
        flags=flags,
        max_tips=2,
        used_categories=used_categories,
    )

    # 2) Pull 1 weather module (if any match)
    tips += _pick_tips_deterministic(
        candidates=WEATHER_MODULES,
        seed=seed + 1,
        flags=flags,
        max_tips=1,
        used_categories=used_categories,
    )

    # 3) Add a stall variant (rotated deterministically)
    stall_line = STALL_VARIANTS[_stable_seed(seed, "stall") % len(STALL_VARIANTS)]
    tips.append(stall_line)

    # Max 4 tips
    return tips[:4]


# -----------------------------
# Pattern Summary System
# -----------------------------

def _pick(bank: List[str], seed: int, salt: str) -> str:
    if not bank:
        return ""
    idx = _stable_seed(seed, salt) % len(bank)
    return bank[idx]


def _flags_from_weather(weather: Dict[str, Any]) -> Dict[str, bool]:
    """Convert weather dict to boolean flags for pattern summary."""
    wind_speed = float(weather.get("wind_mph", 0) or 0)
    sky = (weather.get("cloud_cover") or "").lower()
    
    is_windy = wind_speed >= 12
    is_calm = wind_speed <= 3
    is_low_light = any(k in sky for k in ["cloud", "overcast", "rain", "storm", "fog"])
    
    return {
        "low_light": is_low_light,
        "windy": is_windy,
        "calm": is_calm,
        "bright": not is_low_light,
        "front": weather.get("cold_front", False),
        "warming": weather.get("warming_trend", False),
        "cooling": weather.get("cooling_trend", False),
        "rain": "rain" in sky,
    }


def _light_phrase(seed: int, f: Dict[str, bool]) -> str:
    low = [
        "lower light",
        "muted skies",
        "softer light",
        "cloud-filtered conditions",
    ]
    bright = [
        "brighter skies",
        "high sun conditions",
        "clearer light",
        "more exposed water",
    ]
    return _pick(low if f["low_light"] else bright, seed, "light")


def _wind_phrase(seed: int, f: Dict[str, bool]) -> str:
    windy = [
        "wind-driven activity",
        "wind-enhanced positioning",
        "moving-water feel from the wind",
        "choppier, higher-opportunity water",
    ]
    calm = [
        "calm conditions",
        "slick water",
        "quiet surface conditions",
        "low-disturbance water",
    ]
    steady = [
        "steady conditions",
        "neutral conditions",
        "consistent conditions",
    ]
    if f["windy"]:
        return _pick(windy, seed, "wind")
    if f["calm"]:
        return _pick(calm, seed, "wind")
    return _pick(steady, seed, "wind")


def _phase_phrase(seed: int, phase: str, f: Dict[str, bool]) -> str:
    base = [
        f"{phase} timing",
        f"the {phase} window",
        f"{phase} phase conditions",
        f"this {phase} stretch",
    ]
    
    overlay = []
    if f["front"]:
        overlay = ["post-front behavior", "a more cautious window", "tighter positioning"]
    elif f["warming"]:
        overlay = ["a warming push", "more active positioning", "a better chase window"]
    elif f["cooling"]:
        overlay = ["a cooling push", "shorter feeding windows", "more selective bites"]

    if overlay:
        return f"{_pick(base, seed, 'phase')} with {_pick(overlay, seed, 'overlay')}"
    return _pick(base, seed, "phase")


FAMILY_SUMMARY = {
    "bottom_dragging": {
        "why": [
            "Bottom fish want something they can pin down—slow, repeatable contact wins.",
            "When the bite compresses, staying connected to bottom keeps you in the highest-percentage zone.",
            "This is a 'make them notice it' day: small moves, long pauses, and bottom transitions.",
        ],
        "where": [
            "Lean on breaks, edges, and anything bottom-oriented (rock, shell, hard spots, the first depth change).",
            "Work the first clean drop near flats, inside turns, and transition lines where bass stop to feed.",
            "Treat bottom transitions like targets—drag across them instead of fishing random stretches.",
        ],
        "how": [
            "Keep it methodical: drag, pause, and re-cast key angles before you abandon a stretch.",
            "If it feels slow, you're close—let the pauses do the work.",
            "Prioritize clean contact and angle control over speed or distance.",
        ],
        "close": [
            "The goal isn't more casts—it's more time in the strike zone.",
            "Stay disciplined: contact first, then cadence.",
            "Make it repeatable and let the pattern build.",
        ],
    },

    "horizontal_moving": {
        "why": [
            "This is the kind of day where bass will show themselves by reacting—your job is to intersect them.",
            "Roaming fish respond to speed and presence; you're hunting the most active water, not every piece of cover.",
            "You're looking for a 'yes/no' response quickly—then you tighten the loop where it happens.",
        ],
        "where": [
            "Start on points, banks, and long edges that naturally funnel bait and give fish room to roam.",
            "Focus on high-percentage travel lanes: windward stretches, saddles, and the first break off the flat.",
            "Hit the cleanest stretch of bank with depth access and keep moving until the water 'talks back.'",
        ],
        "how": [
            "Cover water with purpose, then make repeat passes from better angles once you get a cue.",
            "Treat the first bite as a location clue—tighten to that stretch before you change lures.",
            "Keep the retrieve clean and consistent; let the conditions pick the speed.",
        ],
        "close": [
            "Find the active water first—then get surgical.",
            "Let movement reveal the pattern.",
            "Search wide, then narrow fast.",
        ],
    },

    "vertical_hover": {
        "why": [
            "When chase isn't clean, time-in-zone beats distance—hovering forces a decision.",
            "This window often rewards control: hold it in place and let fish commit on their schedule.",
            "If fish are present but not aggressive, hovering turns 'lookers' into biters.",
        ],
        "where": [
            "Work steep edges, isolated cover, and anything with quick depth access.",
            "Target the clean boundary: the outside edge, the last piece of cover, the hard line.",
            "Focus on spots that let you stay vertical—depth changes, corners, and 'stop points.'",
        ],
        "how": [
            "Hold longer than feels natural, then make micro-moves—not big hops.",
            "If you drift off-vertical, reposition before changing the presentation.",
            "Think in short hops of position, not long drifts of hope.",
        ],
        "close": [
            "Control and patience win this one.",
            "Make every minute feel intentional.",
            "Less travel. More exposure.",
        ],
    },

    "surface_chase": {
        "why": [
            "When the surface window opens, you can get the cleanest bites of the day—fast decisions, big commitment.",
            "Surface chase thrives on timing: you're looking for activity lanes, not isolated targets.",
            "This is a window game: capitalize while fish are willing to rise.",
        ],
        "where": [
            "Prioritize lanes: wind seams, shallow flats near depth, and edges that concentrate bait.",
            "Start where fish can trap bait—points, pocket mouths, and stretches with clean 'runway' water.",
            "Work the best roaming water first, then revisit the stretches that produced shows.",
        ],
        "how": [
            "Cover water until you get a show, then immediately re-cast the same lane.",
            "Keep it moving with controlled rhythm—hesitate only to convert misses.",
            "Treat misses as feedback: same lane, slightly different cadence.",
        ],
        "close": [
            "Commit to the window—don't half-fish it.",
            "When it's on, it's on. Make it count.",
            "Stay mobile and decisive.",
        ],
    },

    "surface_ambush": {
        "why": [
            "Ambush fish want a clear target near cover—precision creates commitment.",
            "This is a 'first-look' presentation: fish that live in cover often eat immediately or not at all.",
            "When positioning is tight, surface ambush can outproduce subsurface chase.",
        ],
        "where": [
            "Work shade lines, dock corners, laydowns, and any cover edge that creates a clean strike lane.",
            "Focus on protected pockets and the quiet side of cover when conditions are pushy.",
            "Treat isolated cover as a stop sign—hit it from multiple angles before moving on.",
        ],
        "how": [
            "Make the first cast the best cast: angle, distance, and placement matter more than volume.",
            "Pause beside cover longer than you want to—ambush bites often happen at the dead stop.",
            "Stay controlled: tight targets, consistent cadence.",
        ],
        "close": [
            "Precision over pace.",
            "Make it feel easy for them to commit.",
            "One clean lane at a time.",
        ],
    },

    "bottom_lift_drop": {
        "why": [
            "Lift/drop shines when fish won't track a steady retrieve—fall triggers do the heavy lifting.",
            "This is a reaction tool that still stays close to cover: contact + controlled fall = bites.",
            "When they're around cover but not chasing, the drop becomes the decision point.",
        ],
        "where": [
            "Target vertical stuff: posts, rock edges, laydown ends, and sharp cover boundaries.",
            "Work edges where you can 'reset' the bait on each fall—corners, breaks, isolated pieces.",
            "Focus on cover that lets you repeat the same fall path consistently.",
        ],
        "how": [
            "Lift just enough to clear, then let it fall on semi-slack—watch for the 'tick' or the stop.",
            "Short hops in thick cover, longer hops in sparse cover—match the environment.",
            "Keep it controlled: contact, lift, fall, reset.",
        ],
        "close": [
            "Let the fall do the talking.",
            "Controlled movement beats constant motion.",
            "Repeat the best fall path.",
        ],
    },

    "slow_roll_glide": {
        "why": [
            "A smoother, subtler horizontal look often converts more followers into commitment.",
            "This family wins by believability—steady track lines and clean speed changes.",
            "When fish are willing but cautious, glide/slow-roll keeps them engaged long enough to eat.",
        ],
        "where": [
            "Work edges and transitions: grass lines, rock-to-mud, and the first break off the flat.",
            "Target lanes where fish can follow: long points, contour edges, and clean corridors.",
            "Prioritize places you can keep the bait 'just above' cover without snagging.",
        ],
        "how": [
            "Track it just above the fish/cover and use small 'contact checks' to create the bite moment.",
            "If you're snagging, you're too low—raise the track line before you change anything else.",
            "Let speed changes be subtle; keep the movement believable.",
        ],
        "close": [
            "Smooth wins—don't overwork it.",
            "Believable is the trigger.",
            "Keep the track line clean.",
        ],
    },
}

FALLBACK_SUMMARY = {
    "why": [
        "Today favors a focused plan that keeps your decisions simple and repeatable.",
        "This is a 'do one thing well' window—execution will matter more than variety.",
    ],
    "where": [
        "Prioritize edges, depth access, and the cleanest high-percentage water available.",
        "Work structure and cover that let you repeat the same cast with confidence.",
    ],
    "how": [
        "Stay consistent long enough to learn from the water before you rotate options.",
        "Make small, deliberate adjustments instead of resetting everything.",
    ],
    "close": [
        "Simple and repeatable wins.",
        "Let the water confirm the plan.",
    ],
}


def build_pattern_summary(presentation: str, phase: str, weather: Dict[str, Any]) -> str:
    """
    Generate a dynamic, natural-sounding pattern summary.
    Explains the overall strategy for this presentation family.
    """
    family = get_presentation_family(presentation)
    f = _flags_from_weather(weather)
    
    seed = _stable_seed(
        family, 
        phase, 
        weather.get("wind_mph"),
        weather.get("cloud_cover"),
        weather.get("temp_f"),
        f.get("front"),
        f.get("warming"),
    )

    light = _light_phrase(seed, f)
    wind = _wind_phrase(seed, f)
    phase_line = _phase_phrase(seed, phase, f)

    bank = FAMILY_SUMMARY.get(family, FALLBACK_SUMMARY)

    # Build with varied openings
    openers = [
        f"With {light} and {wind},",
        f"In {phase_line},",
        f"Given {wind} and {light},",
        f"Right now—{phase_line}—",
    ]
    opener = _pick(openers, seed, "opener")

    why = _pick(bank["why"], seed, "why")
    where = _pick(bank["where"], seed, "where")
    how = _pick(bank["how"], seed, "how")
    close = _pick(bank["close"], seed, "close")

    # Compose with structure variation
    patterns = [
        f"{opener} {why} {where} {how} {close}",
        f"{opener} {why} {how} {where} {close}",
        f"{opener} {where} {why} {how} {close}",
    ]
    summary = _pick(patterns, seed, "compose")

    # Trim accidental double spaces
    return " ".join(summary.split())


def build_gear_for_lure(lure: str, presentation: str) -> Dict[str, str]:
    """
    Generate gear recommendations based on lure and presentation.
    Returns: {rod, reel, line, technique}
    """
    family = get_presentation_family(presentation)
    lure_lower = lure.lower()
    
    # Finesse/vertical presentations
    if family == "vertical_hover" or any(x in lure_lower for x in ["dropshot", "damiki", "ned rig", "shaky head", "neko rig", "wacky rig"]):
        return {
            "rod": '7\'0" medium spinning',
            "reel": "2500 spinning",
            "line": "10 lb braid to 8 lb fluorocarbon leader",
            "technique": "spinning"
        }
    
    # Bottom contact
    if family in ("bottom_dragging", "bottom_lift_drop") or any(x in lure_lower for x in ["jig", "carolina", "texas"]):
        return {
            "rod": '7\'1" medium-heavy casting',
            "reel": "7.3:1 baitcaster",
            "line": "15-17 lb fluorocarbon",
            "technique": "casting"
        }
    
    # Topwater
    if family in ("surface_chase", "surface_ambush") or any(x in lure_lower for x in ["frog", "buzzbait", "plopper", "popper", "walking bait"]):
        return {
            "rod": '7\'0" medium-heavy casting',
            "reel": "7.3-8.1:1 baitcaster",
            "line": "30-50 lb braid",
            "technique": "casting"
        }
    
    # Moving/horizontal default
    return {
        "rod": '7\'0" medium-heavy casting',
        "reel": "7.1:1 baitcaster",
        "line": "15 lb fluorocarbon",
        "technique": "casting"
    }




def enrich_member_plan(plan: Dict[str, Any], weather: Dict[str, Any], phase: str) -> Dict[str, Any]:
    """
    Add gear to a member plan (with primary + secondary).
    Note: strategy and pattern_summary are now generated by LLM, not added here.
    Modifies plan in place and returns it.
    
    Args:
        plan: The LLM-generated plan (already has strategy and pattern_summary from LLM)
        weather: Weather data dict
        phase: Bass phase (winter, spawn, etc.)
    """
    
    # Add gear to primary (strategy and pattern_summary come from LLM now)
    if "primary" in plan and "base_lure" in plan["primary"]:
        plan["primary"]["gear"] = build_gear_for_lure(
            plan["primary"]["base_lure"],
            plan["primary"]["presentation"]
        )
    
    # Add gear to secondary (strategy and pattern_summary come from LLM now)
    if "secondary" in plan and "base_lure" in plan["secondary"]:
        plan["secondary"]["gear"] = build_gear_for_lure(
            plan["secondary"]["base_lure"],
            plan["secondary"]["presentation"]
        )
    
    return plan