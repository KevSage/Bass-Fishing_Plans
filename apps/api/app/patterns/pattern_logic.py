from datetime import datetime
from typing import Any, Dict, List, Optional
from datetime import date as date_type

from .schemas import ProPatternRequest, ProPatternResponse, LureSetup
from .context import WeatherContext
from app.services.snapshot_hash import SnapshotHashConfig, snapshot_hash

"""
WEATHER CONTRACT (V1 – LOCKED)

- Weather is resolved ONLY via app/services/weather.py (UPSTREAM / session layer)
- logic_* modules NEVER call external APIs (directly or indirectly)
- WeatherContext is derived from a lake-centered snapshot
- No background refresh logic lives here
- Snapshot update cadence is handled upstream (app/session layer)
"""

# Internal-only; never printed literally to users
PRESENTATION_FAMILIES = [
    "surface_chase",        # plopper, buzzbait, prop (steady on top)
    "surface_ambush",       # frog, walking bait, popper (pause/cadence)
    "horizontal_moving",    # crank, spinnerbait, chatterbait, underspin, swimbait
    "slow_roll_glide",      # glidebait, slow swimbait, weightless fluke swim
    "bottom_dragging",      # texas rig drag, football jig drag, carolina drag
    "bottom_lift_drop",     # jig hop, shaky, neko, blade yo-yo
    "vertical_hover",       # dropshot, damiki, ned deadstick
]

# Enforces Pattern 2 validity: must be different "behavior / water" than Pattern 1
BEHAVIOR_GROUP = {
    "surface_chase": "roaming_top",
    "surface_ambush": "precision_top",
    "horizontal_moving": "roaming_mid",
    "slow_roll_glide": "roaming_subtle",
    "bottom_dragging": "holding_bottom",
    "bottom_lift_drop": "bottom_trigger",
    "vertical_hover": "holding_vertical",
}

# Canonical swatches (user-facing strings)
COLOR_SWATCHES = {
    "green_pumpkin": "green pumpkin",
    "bream": "bream/bluegill",
    "black_blue": "black/blue",
    "shad": "shad",
    "shad_chart": "shad w/chartreuse",
    "red_craw": "red craw",
    "white": "white",
    "chart_white": "white/chartreuse",
}


def _stub_weather_context() -> WeatherContext:
    return WeatherContext(
        temp_f=60.0,
        wind_speed=5.0,
        sky_condition="partly_cloudy",
        timestamp=datetime.utcnow(),
    )


def _get_weather_from_request(req: ProPatternRequest) -> WeatherContext:
    """
    WEATHER CONTRACT COMPLIANCE:
    - This logic module must NOT call live weather APIs (directly or indirectly).
    - It only consumes a lake-centered snapshot prepared upstream (session layer).

    Supported request inputs (in priority order):
    1) req.weather_snapshot (preferred): dict-like snapshot already resolved upstream
       Expected keys: temp_f, wind_mph (or wind_speed), cloud_cover (or sky_condition)
    2) Legacy fields: temp_f, wind_speed, sky_condition (old tests only)
    3) Stub fallback
    """
    snap = getattr(req, "weather_snapshot", None)
    if isinstance(snap, dict):
        temp_f = snap.get("temp_f")
        wind = snap.get("wind_mph", None)
        if wind is None:
            wind = snap.get("wind_speed", None)

        cloud = snap.get("cloud_cover", None)
        if cloud is None:
            cloud = snap.get("sky_condition", None)

        if temp_f is not None and wind is not None:
            sky = (cloud or "partly_cloudy").strip().lower().replace(" ", "_")
            return WeatherContext(
                temp_f=float(temp_f),
                wind_speed=float(wind),
                sky_condition=sky,
                timestamp=datetime.utcnow(),  # runtime timestamp OK; NOT part of deterministic hash
            )

    # Legacy fallback for old tests only
    if hasattr(req, "temp_f") and hasattr(req, "wind_speed") and hasattr(req, "sky_condition"):
        return WeatherContext(
            temp_f=getattr(req, "temp_f"),
            wind_speed=getattr(req, "wind_speed"),
            sky_condition=getattr(req, "sky_condition"),
            timestamp=datetime.utcnow(),
        )

    return _stub_weather_context()


def _weather_for_hash(weather: WeatherContext) -> Dict[str, Any]:
    """
    Minimal weather shape for deterministic hashing.
    Mirrors app/services/weather.py snapshot keys to avoid drift.
    """
    cloud_cover = (weather.sky_condition or "").replace("_", " ").strip().lower() or None
    return {
        "temp_f": weather.temp_f,
        "wind_mph": weather.wind_speed,
        "cloud_cover": cloud_cover,
        "clarity_estimate": None,
        "season_phase": None,
    }


# -----------------------------
# Season / phase (unchanged)
# -----------------------------

def _classify_phase(temp_f: float, month: int) -> str:
    if month in (12, 1, 2):
        season = "winter"
    elif month in (3, 4, 5):
        season = "spring"
    elif month in (6, 7, 8):
        season = "summer"
    else:
        season = "fall"

    if season == "winter":
        if temp_f >= 50:
            return "pre-spawn"
        return "winter"

    if season == "spring":
        if temp_f < 50:
            return "pre-spawn"
        if 50 <= temp_f < 60:
            return "pre-spawn"
        if 60 <= temp_f <= 72:
            return "spawn"
        return "post-spawn"

    if season == "summer":
        if temp_f < 70:
            return "post-spawn"
        if 70 <= temp_f <= 82:
            return "summer"
        return "late-summer"

    # fall
    if temp_f >= 60:
        return "late-summer"
    if 50 <= temp_f < 60:
        return "fall"
    if temp_f < 50:
        return "late-fall"

    return "post-spawn"


def _resolve_month(req: ProPatternRequest, weather: WeatherContext) -> int:
    """
    Priority:
    1) trip_date.month
    2) req.month
    3) weather.timestamp.month
    """
    trip_date: Optional[date_type] = getattr(req, "trip_date", None)
    if isinstance(trip_date, date_type):
        return int(trip_date.month)

    m = getattr(req, "month", None)
    if m is not None:
        try:
            return int(m)
        except Exception:
            pass

    return int(weather.timestamp.month)


# -----------------------------
# Presentation-family selection
# -----------------------------

def _signals(temp_f: float, wind_speed: float, sky_condition: str, month: int) -> Dict[str, Any]:
    sky = (sky_condition or "").lower().replace("_", " ")

    is_cold = isinstance(temp_f, (int, float)) and temp_f <= 50
    is_hot = isinstance(temp_f, (int, float)) and temp_f >= 80
    is_windy = float(wind_speed) >= 12
    is_calm = float(wind_speed) <= 3

    is_low_light = any(k in sky for k in ["cloud", "overcast", "rain", "storm", "fog"])
    is_winter = month in (12, 1, 2)
    is_spring = month in (3, 4, 5)
    is_summer = month in (6, 7, 8)
    is_fall = month in (9, 10, 11)

    return {
        "temp_f": temp_f,
        "wind_speed": wind_speed,
        "sky": sky,
        "month": month,
        "is_cold": is_cold,
        "is_hot": is_hot,
        "is_windy": is_windy,
        "is_calm": is_calm,
        "is_low_light": is_low_light,
        "is_winter": is_winter,
        "is_spring": is_spring,
        "is_summer": is_summer,
        "is_fall": is_fall,
    }


def _score_families(sig: Dict[str, Any]) -> Dict[str, int]:
    score = {fam: 0 for fam in PRESENTATION_FAMILIES}

    # Year-round anchors
    score["bottom_dragging"] += 2
    score["bottom_lift_drop"] += 1

    # Season shaping
    if sig["is_winter"]:
        score["vertical_hover"] += 4
        score["bottom_dragging"] += 2
        score["horizontal_moving"] -= 2
        score["surface_chase"] -= 99
        score["surface_ambush"] -= 99

    if sig["is_spring"]:
        score["horizontal_moving"] += 2
        score["bottom_lift_drop"] += 2
        score["bottom_dragging"] += 1
        score["surface_ambush"] += 1

    if sig["is_summer"]:
        score["horizontal_moving"] += 2
        score["bottom_dragging"] += 1
        score["vertical_hover"] += 2
        score["surface_chase"] += 1

    if sig["is_fall"]:
        score["horizontal_moving"] += 3
        score["surface_chase"] += 2
        score["bottom_dragging"] += 1

    # Wind / calm shaping
    if sig["is_windy"]:
        score["horizontal_moving"] += 2
        score["surface_chase"] += 1
        score["bottom_dragging"] += 1

    if sig["is_calm"]:
        score["vertical_hover"] += 2
        score["slow_roll_glide"] += 2
        score["horizontal_moving"] -= 1

    # Light shaping
    if sig["is_low_light"]:
        score["horizontal_moving"] += 1
        score["surface_chase"] += 1
    else:
        score["slow_roll_glide"] += 1

    # Temperature shaping
    if sig["is_cold"]:
        score["vertical_hover"] += 3
        score["bottom_dragging"] += 2
        score["surface_chase"] -= 99
        score["surface_ambush"] -= 99

    if sig["is_hot"]:
        score["vertical_hover"] += 2
        score["bottom_dragging"] += 1

    return score


def _pick_primary_family(sig: Dict[str, Any]) -> str:
    score = _score_families(sig)
    # deterministic tie-break: PRESENTATION_FAMILIES order
    return max(PRESENTATION_FAMILIES, key=lambda f: (score[f], -PRESENTATION_FAMILIES.index(f)))


def _pick_counter_family(sig: Dict[str, Any], primary: str) -> str:
    score = _score_families(sig)
    primary_group = BEHAVIOR_GROUP[primary]

    eligible = [f for f in PRESENTATION_FAMILIES if f != primary and BEHAVIOR_GROUP[f] != primary_group]
    if not eligible:
        eligible = [f for f in PRESENTATION_FAMILIES if f != primary]

    return max(eligible, key=lambda f: (score[f], -PRESENTATION_FAMILIES.index(f)))


def _depth_zone_for_family(family: str, phase: str) -> str:
    """
    Depth zone here is a simple bucket (not “water column feet”).
    It exists for continuity + light downstream filtering.
    """
    if family in ("surface_chase", "surface_ambush"):
        return "ultra_shallow"

    if family in ("horizontal_moving", "slow_roll_glide"):
        # spring/fall tends to live shallow-to-mid; summer can be mid
        if phase in ("summer", "late-summer"):
            return "mid_depth"
        return "mid_shallow"

    if family in ("bottom_dragging", "bottom_lift_drop"):
        if phase == "winter":
            return "deep"
        if phase in ("summer", "late-summer"):
            return "mid_depth"
        return "mid_shallow"

    if family == "vertical_hover":
        return "deep"

    return "mid_depth"


# -----------------------------
# Lures/colors as expression of family
# -----------------------------

def _default_colors(sig: Dict[str, Any]) -> List[str]:
    """
    Default color expresses optimal visibility given sky/wind/low-light.
    (Not claiming true clarity.)
    """
    if sig["is_low_light"] or sig["is_windy"]:
        return [
            COLOR_SWATCHES["black_blue"],
            COLOR_SWATCHES["chart_white"],
            COLOR_SWATCHES["shad_chart"],
        ]
    return [
        COLOR_SWATCHES["green_pumpkin"],
        COLOR_SWATCHES["shad"],
        COLOR_SWATCHES["bream"],
    ]


def _family_to_lures(primary_family: str, phase: str) -> List[str]:
    """
    Canon strings only (must match your taxonomy / UI labels).
    Returns 2–3 lures max (deterministic ordering).
    """
    # Hard seasonal constraint: no true topwater in winter
    winter_block_top = (phase == "winter")

    if primary_family == "surface_chase":
        if winter_block_top:
            # surface chase is invalid in winter; fall back to safe movers
            return ["lipless crankbait", "spinnerbait", "chatterbait"]
        return ["buzzbait", "whopper plopper", "prop bait"]

    if primary_family == "surface_ambush":
        if winter_block_top:
            # surface ambush invalid in winter; use cold-window “pause/cadence” substitutes
            return ["suspending jerkbait", "soft jerkbait", "finesse swimbait"]
        return ["frog", "walking bait", "popper"]

    if primary_family == "horizontal_moving":
        # Moving/search — depth nuance via crank/jerk labels
        if phase in ("pre-spawn", "fall", "late-fall"):
            return ["chatterbait", "spinnerbait", "lipless crankbait"]
        if phase in ("summer", "late-summer"):
            return ["deep crankbait", "underspin", "swimbait"]
        if phase == "winter":
            # keep it season-sane: no “burn”; prioritize mid + suspend style movers
            return ["suspending jerkbait", "mid-depth crankbait", "chatterbait"]
        # spring/spawn/post-spawn default
        return ["squarebill", "spinnerbait", "chatterbait"]

    if primary_family == "slow_roll_glide":
        # Subtle horizontal / non-chase look
        if phase == "winter":
            return ["glide bait", "soft jerkbait", "finesse swimbait"]
        return ["glide bait", "soft jerkbait", "swimbait"]

    if primary_family == "bottom_dragging":
        # Year-round anchor
        if phase in ("summer", "late-summer"):
            return ["carolina rig", "football jig", "texas-rig worm"]
        if phase == "winter":
            return ["football jig", "texas-rig worm", "finesse jig"]
        return ["texas-rig worm", "football jig", "casting jig"]

    if primary_family == "bottom_lift_drop":
        # Hop/yo-yo/lift-drop / bottom-trigger
        if phase == "winter":
            return ["blade bait", "shaky head", "neko rig"]
        return ["casting jig", "shaky head", "neko rig"]

    if primary_family == "vertical_hover":
        # True vertical / hold-in-place
        return ["dropshot", "damiki rig", "ned rig"]

    # safe fallback
    return ["spinnerbait", "casting jig", "shaky head"]



def _family_targets(primary_family: str, phase: str, bottom_composition: str) -> List[str]:
    targets: List[str] = []

    if primary_family in ("surface_chase", "surface_ambush"):
        targets += [
            "shade lines and calm pockets near cover",
            "shallow cover lanes (docks, laydowns, grass edges) where fish can ambush",
        ]
        if phase in ("summer", "late-summer"):
            targets.append("early/late low-light stretches and wind-blown surface zones")

    elif primary_family in ("horizontal_moving", "slow_roll_glide"):
        targets += [
            "secondary points and channel swings that intersect flats",
            "wind-blown banks and long stretches that concentrate bait",
        ]
        if phase in ("fall", "late-fall"):
            targets.append("backs of creeks and pockets with visible baitfish")

    elif primary_family in ("bottom_dragging", "bottom_lift_drop"):
        targets += [
            "breaks, edges, and staging structure near spawning pockets",
            "bottom-oriented cover (wood/rock/grass edges) where fish hold",
        ]
        if phase == "winter":
            targets.append("steeper swings and deeper edges close to basin access")

    elif primary_family == "vertical_hover":
        targets += [
            "vertical structure near deep water access (timber, docks, steep breaks)",
            "areas where contour, cover, and bait intersect",
        ]

    if bottom_composition in ("rock", "gravel"):
        targets.append("rock transitions, riprap, and isolated hard spots")
    elif bottom_composition in ("sand", "clay"):
        targets.append("subtle contour changes and edges where bottom shifts")

    seen = set()
    out: List[str] = []
    for t in targets:
        if t not in seen:
            out.append(t)
            seen.add(t)
    return out


def _strategy_tips(primary_family: str, phase: str, sig: Dict[str, Any]) -> List[str]:
    tips: List[str] = []

    if primary_family == "horizontal_moving":
        tips.append("Cover water until you intersect active fish, then make repeated passes through the best stretch.")
    elif primary_family == "bottom_dragging":
        tips.append("Stay in contact with bottom—small pauses and angle changes often trigger the bite.")
    elif primary_family == "bottom_lift_drop":
        tips.append("Hop/raise it over cover and let it fall back on semi-slack line to trigger reaction.")
    elif primary_family == "vertical_hover":
        tips.append("Keep the bait in place longer than feels natural—vertical wins by time-in-zone, not distance.")
    elif primary_family in ("surface_chase", "surface_ambush"):
        tips.append("Treat surface strikes as timing windows—work the best lanes and give fish a clean target near cover.")

    if sig["is_windy"]:
        tips.append("Use the wind: focus on wind-blown banks/points where bait is pushed and fish are more willing to chase.")
    if sig["is_calm"]:
        tips.append("On calm water, extend cast distance and tighten cadence—subtle presentations often outperform noise.")
    if sig["is_low_light"]:
        tips.append("Low light extends roaming windows—keep moving until you find the most active water.")
    else:
        tips.append("Bright conditions: prioritize shade/edges and make your best casts count before cycling targets.")

    tips.append("If the pattern stalls, change one variable at a time—angle, cadence, or a similar lure within the same presentation.")
    return tips


def _build_lure_setups(lures: List[str], primary_family: str) -> List[LureSetup]:
    """
    Minimal, deterministic setups by family (schema requires reel/line etc).
    """
    setups: List[LureSetup] = []

    def add(
        lure: str,
        rod: str,
        reel: str,
        line: str,
        hook_or_leader: str,
        lure_size: str,
        technique: str = "casting",
    ):
        setups.append(
            LureSetup(
                lure=lure,
                technique=technique,
                rod=rod,
                reel=reel,
                line=line,
                hook_or_leader=hook_or_leader,
                lure_size=lure_size,
            )
        )

    for lure in lures:
        lu = (lure or "").lower()

        # Spinning-leaning
        if primary_family == "vertical_hover" or lu in ("dropshot", "damiki rig", "ned rig", "shaky head", "neko rig"):
            add(
                lure=lure,
                rod='7\'0" medium spinning',
                reel="2500 spinning",
                line="10 lb braid to 8 lb fluorocarbon leader",
                hook_or_leader="finesse hook / dropshot hook as needed",
                lure_size="1/8–3/8 oz",
                technique="spinning",
            )
            continue

        # Bottom contact
        if primary_family in ("bottom_dragging", "bottom_lift_drop") or "jig" in lu or "carolina" in lu or "texas" in lu:
            add(
                lure=lure,
                rod='7\'1" medium-heavy casting',
                reel="7.3:1 baitcaster",
                line="15–17 lb fluorocarbon",
                hook_or_leader="3/0–4/0 EWG or jig trailer hook as needed",
                lure_size="3/8–3/4 oz",
                technique="casting",
            )
            continue

        # Topwater
        if primary_family in ("surface_chase", "surface_ambush"):
            add(
                lure=lure,
                rod='7\'0" medium-heavy casting',
                reel="7.3–8.1:1 baitcaster",
                line="30–50 lb braid",
                hook_or_leader="factory trebles or frog hooks",
                lure_size="standard",
                technique="casting",
            )
            continue

        # Moving/horizontal default
        add(
            lure=lure,
            rod='7\'0" medium-heavy casting',
            reel="7.1:1 baitcaster",
            line="15 lb fluorocarbon",
            hook_or_leader="stock hardware / snaps as needed",
            lure_size="standard",
            technique="casting",
        )

    return setups


def _family_label_for_user(family: str) -> str:
    return {
        "surface_chase": "Surface chase",
        "surface_ambush": "Surface ambush",
        "horizontal_moving": "Horizontal moving",
        "slow_roll_glide": "Slow-roll / glide",
        "bottom_dragging": "Bottom-contact dragging",
        "bottom_lift_drop": "Bottom lift-drop",
        "vertical_hover": "Vertical hover",
    }.get(family, "Primary pattern")


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


# -----------------------------
# Main builder
# -----------------------------

def build_pro_pattern(req: ProPatternRequest) -> ProPatternResponse:
    weather = _get_weather_from_request(req)

    latitude = getattr(req, "latitude", None)
    longitude = getattr(req, "longitude", None)

    weather_hash_input = _weather_for_hash(weather)
    env_snapshot_hash = snapshot_hash(
        weather=weather_hash_input,
        config=SnapshotHashConfig(),
        lat=float(latitude) if latitude is not None else None,
        lon=float(longitude) if longitude is not None else None,
        time_bucket=None,
        water_view_id=None,
    )

    month = _resolve_month(req, weather)
    phase = _classify_phase(weather.temp_f, month)

    bottom_composition = getattr(req, "bottom_composition", None) or "mixed"
    forage = getattr(req, "forage", None) or ["shad"]

    # Keep clarity in schema, but treat as optional hint only (not used as “truth”)
    clarity_hint = getattr(req, "clarity", None)

    sig = _signals(weather.temp_f, weather.wind_speed, weather.sky_condition, month)
    
    primary_family = _pick_primary_family(sig)
    counter_family = _pick_counter_family(sig, primary_family)

    depth_zone = _depth_zone_for_family(primary_family, phase)

    primary_lures = _family_to_lures(primary_family, phase)
    colors = _default_colors(sig)

    counter_lures = _family_to_lures(counter_family, phase)
    counter_colors = _default_colors(sig)

    recommended_targets = _family_targets(primary_family, phase, bottom_composition)
    strategy_tips = _strategy_tips(primary_family, phase, sig)

    lure_setups = _build_lure_setups(primary_lures[:2], primary_family)

    conditions: Dict[str, Any] = {
        "location_name": getattr(req, "location_name", None),
        "latitude": latitude,
        "longitude": longitude,
        "temp_f": weather.temp_f,
        "wind_speed": weather.wind_speed,
        "sky_condition": weather.sky_condition,
        "timestamp": weather.timestamp.isoformat(),
        "month": month,
        "clarity": clarity_hint,  # optional hint only
        "bottom_composition": bottom_composition,
        "forage": forage,
        "depth_ft": getattr(req, "depth_ft", None),
        "snapshot_hash": env_snapshot_hash,
        "snapshot_weather": weather_hash_input,
        "primary_presentation_family": primary_family,
        "counter_presentation_family": counter_family,
        "pattern_2": {
            "presentation_family": counter_family,
            "recommended_lures": counter_lures[:2],
            "color_recommendations": counter_colors[:2],
            "recommended_targets": _family_targets(counter_family, phase, bottom_composition),
        },
    }

    notes = (
        "Pattern generated using rules-based logic and a lake-centered weather snapshot. "
        "Selection is presentation-first; lures are chosen as expressions of the presentation."
    )

    primary_technique = _family_label_for_user(primary_family)
    featured_lure_name = primary_lures[0] if primary_lures else "spinnerbait"
    featured_lure_family = primary_family  # internal id is fine to store
    pattern_summary = _pattern_summary(primary_family, phase, sig)

    if counter_family == primary_family:
        # should never happen, but protects future edits
        counter_family = "bottom_dragging" if primary_family == "horizontal_moving" else "horizontal_moving"

    return ProPatternResponse(
        phase=phase,
        depth_zone=depth_zone,
        recommended_lures=primary_lures[:2],
        recommended_targets=recommended_targets[:4],
        strategy_tips=strategy_tips[:6],
        color_recommendations=colors[:2],
        lure_setups=lure_setups,
        conditions=conditions,
        notes=notes,
        primary_technique=primary_technique,
        featured_lure_name=featured_lure_name,
        featured_lure_family=featured_lure_family,
        pattern_summary=pattern_summary,
    )