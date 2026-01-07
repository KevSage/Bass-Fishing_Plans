# apps/api/app/patterns/pattern_logic.py
from datetime import datetime
from typing import Any, Dict, List, Optional
from datetime import date as date_type

from .schemas import ProPatternRequest, ProPatternResponse, LureSetup
from .context import WeatherContext
from app.services.snapshot_hash import SnapshotHashConfig, snapshot_hash
from app.render.lure_specs import (
    build_primary_and_alternate_lure_specs,
    trailer_notes_for_lures,
)
from app.services.phase_logic import determine_phase
# ✅ NEW: Import specific lure tips from your rules file
from app.canon.retrieve_rules import LURE_TIP_BANK

"""
WEATHER CONTRACT (V1 – LOCKED)
- Weather is resolved ONLY via app/services/weather.py
- logic_* modules NEVER call external APIs
- WeatherContext is derived from a lake-centered snapshot
"""

PRESENTATION_FAMILIES = [
    "surface_chase", "surface_ambush", "horizontal_moving", 
    "slow_roll_glide", "bottom_dragging", "bottom_lift_drop", "vertical_hover"
]

BEHAVIOR_GROUP = {
    "surface_chase": "roaming_top", "surface_ambush": "precision_top",
    "horizontal_moving": "roaming_mid", "slow_roll_glide": "roaming_subtle",
    "bottom_dragging": "holding_bottom", "bottom_lift_drop": "bottom_trigger",
    "vertical_hover": "holding_vertical",
}

# Canonical swatches (Synced with pools.py)
COLOR_SWATCHES = {
    "green_pumpkin": "green pumpkin", "bream": "bluegill", "black_blue": "black/blue",
    "shad": "shad", "shad_chart": "sexy shad", "red_craw": "red craw",
    "white": "white", "chart_white": "chartreuse/white", "baby_bass": "baby bass",
    "watermelon_red" :"watermelon red", "green_pumpkin_orange" : "green pumpkin orange",
    "peanut butter_jelly" :  "peanut butter & jelly", "chartreuse_black_back" : "chartreuse/black back",
    "ghost_shad" : "ghost shad", "citrus_shad": "citrus shad", "pro_blue" :  "pro blue",
    "table_rock" : "table rock", "ghost_minnow": "ghost minnow", "natural_shad": "natural shad",
    "junebug": "junebug", "brown": "brown", "translucent": "translucent",
    "chrome": "chrome", "gold": "gold", "firetiger": "firetiger", "chartreuse": "chartreuse",
}

def _stub_weather_context() -> WeatherContext:
    return WeatherContext(
        temp_f=60.0, wind_speed=5.0, sky_condition="partly_cloudy", timestamp=datetime.utcnow()
    )

def _get_weather_from_request(req: ProPatternRequest) -> WeatherContext:
    snap = getattr(req, "weather_snapshot", None)
    if isinstance(snap, dict):
        temp_f = snap.get("temp_f")
        wind = snap.get("wind_mph") or snap.get("wind_speed")
        cloud = snap.get("cloud_cover") or snap.get("sky_condition")
        
        # ✅ NEW: Capture OpenWeather 3.0 Advanced Metrics
        pressure = snap.get("pressure") # hPa
        visibility = snap.get("visibility") # meters
        uvi = snap.get("uvi") # 0-11+

        if temp_f is not None and wind is not None:
            sky = (cloud or "partly_cloudy").strip().lower().replace(" ", "_")
            ctx = WeatherContext(
                temp_f=float(temp_f), wind_speed=float(wind), sky_condition=sky, timestamp=datetime.utcnow()
            )
            # Attach advanced metrics (monkey-patching onto context for internal use)
            ctx.pressure = float(pressure) if pressure is not None else 1015.0
            ctx.visibility = float(visibility) if visibility is not None else 10000.0
            ctx.uvi = float(uvi) if uvi is not None else 0.0
            return ctx

    # Legacy fallback
    if hasattr(req, "temp_f") and hasattr(req, "wind_speed") and hasattr(req, "sky_condition"):
        ctx = WeatherContext(
            temp_f=getattr(req, "temp_f"), wind_speed=getattr(req, "wind_speed"),
            sky_condition=getattr(req, "sky_condition"), timestamp=datetime.utcnow()
        )
        ctx.pressure = 1015.0; ctx.visibility = 10000.0; ctx.uvi = 0.0
        return ctx
    return _stub_weather_context()

def _weather_for_hash(weather: WeatherContext) -> Dict[str, Any]:
    cloud_cover = (weather.sky_condition or "").replace("_", " ").strip().lower() or None
    return {
        "temp_f": weather.temp_f, "wind_mph": weather.wind_speed, "cloud_cover": cloud_cover,
        "clarity_estimate": None, "season_phase": None,
    }

def _resolve_month(req: ProPatternRequest, weather: WeatherContext) -> int:
    trip_date: Optional[date_type] = getattr(req, "trip_date", None)
    if isinstance(trip_date, date_type): return int(trip_date.month)
    m = getattr(req, "month", None)
    if m is not None:
        try: return int(m)
        except: pass
    return int(weather.timestamp.month)

def _signals(weather: WeatherContext, month: int) -> Dict[str, Any]:
    temp_f = weather.temp_f
    wind_speed = weather.wind_speed
    sky = (weather.sky_condition or "").lower().replace("_", " ")
    
    # ✅ NEW: Access Advanced Metrics
    pressure = getattr(weather, "pressure", 1015.0)
    visibility = getattr(weather, "visibility", 10000.0)
    uvi = getattr(weather, "uvi", 0.0)

    # Logic V2 Definitions
    is_foggy = visibility < 2000
    is_cloudy = any(k in sky for k in ["cloud", "overcast", "rain", "storm", "fog"])
    # Low light = Clouds OR Fog OR Low Winter Sun
    is_low_light = is_cloudy or is_foggy or (month in (12, 1) and temp_f > 40)
    
    is_falling_pressure = pressure < 1012
    is_high_pressure = pressure > 1022
    is_high_uv = uvi > 6

    return {
        "temp_f": temp_f, "wind_speed": wind_speed, "sky": sky, "month": month,
        "is_cold": temp_f <= 50, "is_hot": temp_f >= 80,
        "is_windy": wind_speed >= 12, "is_calm": wind_speed <= 3,
        "is_low_light": is_low_light, "is_foggy": is_foggy,
        "is_falling_pressure": is_falling_pressure, "is_high_pressure": is_high_pressure,
        "is_high_uv": is_high_uv,
        "pressure_val": pressure, "uvi_val": uvi, "vis_val": visibility, # Store raw for text generation
        "is_winter": month in (12, 1, 2), "is_spring": month in (3, 4, 5),
        "is_summer": month in (6, 7, 8), "is_fall": month in (9, 10, 11),
    }

def _score_families(sig: Dict[str, Any]) -> Dict[str, int]:
    score = {fam: 0 for fam in PRESENTATION_FAMILIES}
    score["bottom_dragging"] += 2
    score["bottom_lift_drop"] += 1

    if sig["is_winter"]:
        score["vertical_hover"] += 4; score["bottom_dragging"] += 2
        score["horizontal_moving"] -= 2; score["surface_chase"] -= 99; score["surface_ambush"] -= 99
    if sig["is_spring"]:
        score["horizontal_moving"] += 2; score["bottom_lift_drop"] += 2
        score["bottom_dragging"] += 1; score["surface_ambush"] += 1
    if sig["is_summer"]:
        score["horizontal_moving"] += 2; score["bottom_dragging"] += 1
        score["vertical_hover"] += 2; score["surface_chase"] += 1
    if sig["is_fall"]:
        score["horizontal_moving"] += 3; score["surface_chase"] += 2; score["bottom_dragging"] += 1

    if sig["is_windy"]:
        score["horizontal_moving"] += 2; score["surface_chase"] += 1; score["bottom_dragging"] += 1
    if sig["is_calm"]:
        score["vertical_hover"] += 2; score["slow_roll_glide"] += 2; score["horizontal_moving"] -= 1

    if sig["is_low_light"]:
        score["horizontal_moving"] += 1; score["surface_chase"] += 1
    else:
        score["slow_roll_glide"] += 1

    if sig["is_cold"]:
        score["vertical_hover"] += 3; score["bottom_dragging"] += 2
        score["surface_chase"] -= 99; score["surface_ambush"] -= 99
    if sig["is_hot"]:
        score["vertical_hover"] += 2; score["bottom_dragging"] += 1
        
    # ✅ NEW: Pressure Logic
    if sig["is_falling_pressure"]:
        score["horizontal_moving"] += 3; score["surface_chase"] += 2; score["slow_roll_glide"] -= 1
    elif sig["is_high_pressure"]:
        score["vertical_hover"] += 4; score["bottom_dragging"] += 2; score["horizontal_moving"] -= 3; score["surface_chase"] -= 2

    return score

def _pick_primary_family(sig: Dict[str, Any]) -> str:
    score = _score_families(sig)
    return max(PRESENTATION_FAMILIES, key=lambda f: (score[f], -PRESENTATION_FAMILIES.index(f)))

def _pick_counter_family(sig: Dict[str, Any], primary: str) -> str:
    score = _score_families(sig)
    primary_group = BEHAVIOR_GROUP[primary]
    eligible = [f for f in PRESENTATION_FAMILIES if f != primary and BEHAVIOR_GROUP[f] != primary_group]
    if not eligible: eligible = [f for f in PRESENTATION_FAMILIES if f != primary]
    return max(eligible, key=lambda f: (score[f], -PRESENTATION_FAMILIES.index(f)))

def _depth_zone_for_family(family: str, phase: str) -> str:
    if family in ("surface_chase", "surface_ambush"): return "ultra_shallow"
    if family in ("horizontal_moving", "slow_roll_glide"):
        return "mid_depth" if phase in ("summer", "late-summer") else "mid_shallow"
    if family in ("bottom_dragging", "bottom_lift_drop"):
        return "deep" if phase == "winter" else ("mid_depth" if phase in ("summer", "late-summer") else "mid_shallow")
    if family == "vertical_hover": return "deep"
    return "mid_depth"

# ✅ NEW: Context-Aware Color Logic
def _colors_for_family(family: str, sig: Dict[str, Any]) -> List[str]:
    is_stained = sig["is_low_light"] or sig["is_windy"] or sig["is_foggy"]
    is_high_uv = sig["is_high_uv"]

    # 1. MOVING / REACTION
    if family in ("horizontal_moving", "surface_chase", "slow_roll_glide"):
        if is_stained:
            return [
                COLOR_SWATCHES["chart_white"],
                COLOR_SWATCHES["shad_chart"],
                COLOR_SWATCHES["black_blue"],
                COLOR_SWATCHES["firetiger"] if "firetiger" in COLOR_SWATCHES else "chartreuse"
            ]
        if is_high_uv:
            return [
                COLOR_SWATCHES["ghost_shad"],
                COLOR_SWATCHES["translucent"],
                COLOR_SWATCHES["ghost_minnow"],
                COLOR_SWATCHES["natural_shad"]
            ]
        return [
            COLOR_SWATCHES["shad"],
            COLOR_SWATCHES["shad_chart"],
            COLOR_SWATCHES["bream"],
            COLOR_SWATCHES["chrome"]
        ]

    # 2. TOPWATER AMBUSH
    if family == "surface_ambush":
        if is_stained:
            return [COLOR_SWATCHES["black_blue"], COLOR_SWATCHES["white"], COLOR_SWATCHES["bream"]]
        return [COLOR_SWATCHES["white"], COLOR_SWATCHES["shad"], COLOR_SWATCHES["bream"]]

    # 3. BOTTOM CONTACT / FINESSE
    if is_stained:
        return [COLOR_SWATCHES["black_blue"], COLOR_SWATCHES["junebug"], COLOR_SWATCHES["green_pumpkin_orange"]]
    return [COLOR_SWATCHES["green_pumpkin"], COLOR_SWATCHES["watermelon_red"], COLOR_SWATCHES["peanut butter_jelly"], COLOR_SWATCHES["bream"]]

def _family_to_lures(primary_family: str, phase: str, sig: Dict[str, Any] = None) -> List[str]:
    winter_block_top = (phase == "winter")
    is_foggy = sig.get("is_foggy", False) if sig else False

    if primary_family == "surface_chase":
        return ["lipless crankbait", "spinnerbait", "chatterbait"] if winter_block_top else ["buzzbait", "whopper plopper", "wake bait"]
    if primary_family == "surface_ambush":
        return ["jerkbait", "soft jerkbait", "paddle tail swimbait"] if winter_block_top else ["hollow body frog", "walking bait", "popper"]
    
    if primary_family == "horizontal_moving":
        if is_foggy: return ["chatterbait", "spinnerbait", "squarebill"] # ✅ FOG FILTER
        if phase in ("pre-spawn", "fall", "late-fall"): return ["chatterbait", "spinnerbait", "lipless crankbait"]
        if phase in ("summer", "late-summer"): return ["deep crankbait", "underspin", "paddle tail swimbait"]
        if phase == "winter": return ["jerkbait", "mid crankbait", "chatterbait"]
        return ["shallow crankbait", "spinnerbait", "chatterbait"]

    if primary_family == "slow_roll_glide":
        return ["wacky rig", "soft jerkbait", "jighead minnow"] if phase == "winter" else ["wacky rig", "soft jerkbait", "paddle tail swimbait"]
    if primary_family == "bottom_dragging":
        if phase in ("summer", "late-summer"): return ["carolina rig", "football jig", "texas rig"]
        return ["football jig", "texas rig", "casting jig"] if phase == "winter" else ["texas rig", "football jig", "casting jig"]
    if primary_family == "bottom_lift_drop":
        return ["blade bait", "shaky head", "neko rig"] if phase == "winter" else ["casting jig", "shaky head", "neko rig"]
    if primary_family == "vertical_hover":
        return ["dropshot", "jighead minnow", "ned rig"]
    return ["spinnerbait", "casting jig", "shaky head"]

def _family_targets(primary_family: str, phase: str, bottom_composition: str) -> List[str]:
    targets = []
    if primary_family in ("surface_chase", "surface_ambush"):
        targets += ["shade lines and calm pockets near cover", "shallow cover lanes (docks, laydowns, grass edges)"]
        if phase in ("summer", "late-summer"): targets.append("early/late low-light stretches")
    elif primary_family in ("horizontal_moving", "slow_roll_glide"):
        targets += ["secondary points and channel swings", "wind-blown banks and long stretches"]
        if phase in ("fall", "late-fall"): targets.append("backs of creeks and pockets")
    elif primary_family in ("bottom_dragging", "bottom_lift_drop"):
        targets += ["breaks, edges, and staging structure", "bottom-oriented cover (wood/rock/grass edges)"]
        if phase == "winter": targets.append("steeper swings and deeper edges")
    elif primary_family == "vertical_hover":
        targets += ["vertical structure near deep water", "areas where contour, cover, and bait intersect"]
    
    if bottom_composition in ("rock", "gravel"): targets.append("rock transitions, riprap, and hard spots")
    elif bottom_composition in ("sand", "clay"): targets.append("subtle contour changes and bottom edges")
    return list(set(targets))

# ✅ NEW: Helper to get specific lure tips from retrieve_rules.py
def _get_lure_specific_tips(lure: str, sig: Dict[str, Any]) -> List[str]:
    """
    Look up the lure in retrieve_rules.py and return 1-2 tips matching current weather.
    """
    lure_key = lure.lower().replace(" ", " ") 
    candidates = LURE_TIP_BANK.get(lure_key)
    if not candidates:
        for k, v in LURE_TIP_BANK.items():
            if k in lure_key:
                candidates = v
                break
    
    if not candidates:
        return []

    valid_tips = []
    for text, category, tags in candidates:
        if "any" in tags:
            valid_tips.append(text)
            continue
        if "windy" in tags and sig["is_windy"]: valid_tips.append(text)
        elif "calm" in tags and sig["is_calm"]: valid_tips.append(text)
        elif "bright" in tags and not sig["is_low_light"]: valid_tips.append(text)
        elif "low_light" in tags and sig["is_low_light"]: valid_tips.append(text)
        elif "winter" in tags and sig["is_winter"]: valid_tips.append(text)
        elif "clear" in tags and not sig["is_low_light"]: valid_tips.append(text)
        elif "stained" in tags and sig["is_low_light"]: valid_tips.append(text)

    return valid_tips[:2]

def _strategy_tips(primary_family: str, phase: str, sig: Dict[str, Any], lure_name: str = None) -> List[str]:
    """
    Combines General Family Logic (Pressure, Season) with Specific Lure Logic.
    """
    tips = []
    
    # 1. High-Level Pressure/Weather Context
    if sig["is_falling_pressure"]: 
        tips.append("Falling pressure detected: fish should be chasing. Speed up your retrieve.")
    elif sig["is_high_pressure"]: 
        tips.append("High pressure detected: fish may hold tight to cover. Slow down and be precise.")
    
    if sig["is_windy"]: tips.append("Focus on wind-blown banks where bait is pushed.")
    
    # 2. General Family Tips
    if primary_family == "horizontal_moving": tips.append("Cover water until you intersect active fish, then make repeated passes.")
    elif primary_family == "bottom_dragging": tips.append("Stay in contact with bottom—small pauses often trigger the bite.")
    elif primary_family == "bottom_lift_drop": tips.append("Hop/raise it over cover and let it fall on semi-slack line.")
    elif primary_family == "vertical_hover": tips.append("Keep the bait in place longer than feels natural—time-in-zone wins.")
    elif primary_family in ("surface_chase", "surface_ambush"): tips.append("Treat surface strikes as timing windows—work the best lanes.")

    # 3. ✅ NEW: Specific Lure Tips (Integrated from retrieve_rules.py)
    if lure_name:
        lure_tips = _get_lure_specific_tips(lure_name, sig)
        tips.extend(lure_tips)
    
    return list(dict.fromkeys(tips))[:6]

def _build_lure_setups(lures: List[str], primary_family: str) -> List[LureSetup]:
    setups = []
    def add(lure, rod, reel, line, hook, size, tech="casting"):
        setups.append(LureSetup(lure=lure, technique=tech, rod=rod, reel=reel, line=line, hook_or_leader=hook, lure_size=size))
    
    for lure in lures:
        lu = (lure or "").lower()
        if primary_family == "vertical_hover" or lu in ("dropshot", "damiki rig", "ned rig", "shaky head", "neko rig"):
            add(lure, '7\'0" medium spinning', "2500 spinning", "10lb braid to 8lb floro", "finesse hook", "1/8–3/8 oz", "spinning")
        elif primary_family in ("bottom_dragging", "bottom_lift_drop") or "jig" in lu or "carolina" in lu or "texas" in lu:
            add(lure, '7\'1" medium-heavy casting', "7.3:1 baitcaster", "15–17 lb floro", "3/0–4/0 EWG", "3/8–3/4 oz")
        elif primary_family in ("surface_chase", "surface_ambush"):
            add(lure, '7\'0" medium-heavy casting', "7.3–8.1:1 baitcaster", "30–50 lb braid", "factory trebles", "standard")
        else:
            add(lure, '7\'0" medium-heavy casting', "7.1:1 baitcaster", "15 lb floro", "stock hardware", "standard")
    return setups

def _family_label_for_user(family: str) -> str:
    return family.replace("_", " ").title().replace("Bottom ", "Bottom-")

def _pattern_summary(family: str, phase: str, sig: Dict[str, Any]) -> str:
    light_phrase = "lower light" if bool(sig.get("is_low_light")) else "brighter skies"
    wind_phrase = "wind-driven activity" if sig.get("is_windy") else ("calm conditions" if sig.get("is_calm") else "steady conditions")

    if family == "bottom_dragging":
        return (
            f"Today’s {wind_phrase} and {phase} timing favor a bottom-contact plan that stays in the strike zone. "
            "Work it methodically along breaks, edges, and bottom-oriented cover instead of relying on pure chase."
        )

    if family == "horizontal_moving":
        return (
            f"With {light_phrase} and {wind_phrase}, bass are more likely to roam and react. "
            "Cover water efficiently along points, banks, and edges until you intersect active fish."
        )

    if family == "vertical_hover":
        return (
            f"In {phase} conditions, a slower hold can outperform chase. "
            "Keep the bait in place longer around steep edges, isolated cover, and depth-access areas."
        )

    if family in ("surface_chase", "surface_ambush"):
        return (
            f"When surface windows open (especially with {light_phrase}), top presentations can produce the cleanest bites. "
            "Commit to the best lanes and give fish a clear target near cover and shade."
        )

    if family == "bottom_lift_drop":
        return (
            f"With {wind_phrase} and {phase} timing, a lift-drop plan can trigger fish that won’t track a steady retrieve. "
            "Use contact and controlled falls to create reaction near cover and edges."
        )

    if family == "slow_roll_glide":
        return (
            f"Under {light_phrase} and {wind_phrase}, a subtler horizontal look often draws better commitment. "
            "Keep it smooth and believable around edges, transitions, and roaming fish lanes."
        )

    return "Today’s conditions favor a focused presentation that keeps your plan simple and repeatable."

# ✅ NEW: Insight Generator for UI Cards
def _generate_weather_insights(sig: Dict[str, Any]) -> List[str]:
    insights = []
    
    # UV Insights
    uvi = sig.get("uvi_val", 0)
    if sig["is_high_uv"]:
        insights.append(f"High UV Index ({uvi:.0f}): Light penetration is deep. Use translucent/ghost shades to avoid looking unnatural.")
    elif uvi < 3:
        insights.append(f"Low UV Index ({uvi:.0f}): Light is diffused. Solid, opaque colors will silhouette better against the surface.")

    # Pressure Insights
    press = sig.get("pressure_val", 1015)
    if sig["is_falling_pressure"]:
        insights.append(f"Falling Pressure ({press:.0f} hPa): Fish air bladders expand, often triggering aggressive chasing behavior.")
    elif sig["is_high_pressure"]:
        insights.append(f"High Pressure ({press:.0f} hPa): Fish typically hold tighter to cover and reduce strike zones.")

    # Visibility/Fog Insights
    vis = sig.get("vis_val", 10000)
    if sig["is_foggy"]:
        insights.append(f"Low Visibility ({int(vis)}m): Fog reduces light drastically. Prioritize lures with vibration (thump) over sight-baits.")
    
    return insights

# -----------------------------
# Main builder
# -----------------------------

def build_pro_pattern(req: ProPatternRequest) -> ProPatternResponse:
    weather = _get_weather_from_request(req)
    latitude = getattr(req, "latitude", None)
    longitude = getattr(req, "longitude", None)
    
    weather_hash_input = _weather_for_hash(weather)
    env_snapshot_hash = snapshot_hash(weather=weather_hash_input, config=SnapshotHashConfig(), lat=latitude, lon=longitude, time_bucket=None, water_view_id=None)

    month = _resolve_month(req, weather)
    
    # ✅ NEW: Use Smart Phase Logic if lat provided, else fallback
    if latitude:
        phase = determine_phase(weather.temp_f, month, float(latitude))
    else:
        phase = _classify_phase(weather.temp_f, month)

    bottom_composition = getattr(req, "bottom_composition", None) or "mixed"
    forage = getattr(req, "forage", None) or ["shad"]
    clarity_hint = getattr(req, "clarity", None)

    sig = _signals(weather, month)

    primary_family = _pick_primary_family(sig)
    counter_family = _pick_counter_family(sig, primary_family)
    depth_zone = _depth_zone_for_family(primary_family, phase)

    primary_lures = _family_to_lures(primary_family, phase, sig)
    counter_lures = _family_to_lures(counter_family, phase, sig)
    
    colors = _colors_for_family(primary_family, sig)
    counter_colors = _colors_for_family(counter_family, sig)

    recommended_targets = _family_targets(primary_family, phase, bottom_composition)
    
    # ✅ UPDATED: Pass specific lure to get granular "How" tips
    strategy_tips = _strategy_tips(primary_family, phase, sig, lure_name=primary_lures[0])
    
    lure_setups = _build_lure_setups(primary_lures[:2], primary_family)
    weather_insights = _generate_weather_insights(sig)

    primary_lure_spec, alternate_lure_specs = build_primary_and_alternate_lure_specs(
        primary_lures=primary_lures[:3], color_recommendations=colors[:2],
        primary_presentation_family=primary_family, phase=phase
    )
    trailer_notes = trailer_notes_for_lures(primary_lures[:2])

    counter_lure_spec, counter_alt_specs = build_primary_and_alternate_lure_specs(
        primary_lures=counter_lures[:3], color_recommendations=counter_colors[:2],
        primary_presentation_family=counter_family, phase=phase
    )

    if counter_family == primary_family:
        counter_family = "bottom_dragging" if primary_family == "horizontal_moving" else "horizontal_moving"

    conditions = {
        "location_name": getattr(req, "location_name", None),
        "latitude": latitude, "longitude": longitude,
        "temp_f": weather.temp_f, "wind_speed": weather.wind_speed, "sky_condition": weather.sky_condition,
        "timestamp": weather.timestamp.isoformat(), "month": month, "clarity": clarity_hint,
        "bottom_composition": bottom_composition, "forage": forage, "depth_ft": getattr(req, "depth_ft", None),
        "snapshot_hash": env_snapshot_hash, "snapshot_weather": weather_hash_input,
        
        "primary_presentation_family": primary_family,
        "counter_presentation_family": counter_family,
        "primary_lure_spec": primary_lure_spec,
        "alternate_lure_specs": alternate_lure_specs,
        "trailer_notes": trailer_notes,
        
        # ✅ NEW FIELD for UI Reverse Card
        "weather_insights": weather_insights,

        "pattern_2": {
            "presentation_family": counter_family,
            "recommended_lures": counter_lures[:2],
            "color_recommendations": counter_colors[:2],
            "recommended_targets": _family_targets(counter_family, phase, bottom_composition),
            "primary_lure_spec": counter_lure_spec,
            "alternate_lure_specs": counter_alt_specs,
            "trailer_notes": trailer_notes_for_lures(counter_lures[:2]),
        },
    }

    notes = "Pattern generated using rules-based logic and a lake-centered weather snapshot."
    primary_technique = _family_label_for_user(primary_family)
    featured_lure_name = (primary_lure_spec.get("display_name") if isinstance(primary_lure_spec, dict) else None) or (primary_lures[0] if primary_lures else "spinnerbait")
    pattern_summary = _pattern_summary(primary_family, phase, sig)

    return ProPatternResponse(
        phase=phase, depth_zone=depth_zone, recommended_lures=primary_lures[:2],
        recommended_targets=recommended_targets[:4], strategy_tips=strategy_tips[:6],
        color_recommendations=colors[:2], lure_setups=lure_setups, conditions=conditions,
        notes=notes, primary_technique=primary_technique, featured_lure_name=featured_lure_name,
        featured_lure_family=primary_family, pattern_summary=pattern_summary,
    )