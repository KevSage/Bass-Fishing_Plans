from datetime import datetime
from typing import Any, Dict, List


from .schemas import ProPatternRequest, ProPatternResponse, LureSetup
from .context import WeatherContext
from app.services.snapshot_hash import SnapshotHashConfig, snapshot_hash
from app.patterns.schemas import ProPatternRequest, ProPatternResponse, LureSetup
from app.patterns.context import WeatherContext

"""
WEATHER CONTRACT (V1 – LOCKED)

- Weather is resolved ONLY via app/services/weather.py (UPSTREAM / session layer)
- logic_* modules NEVER call external APIs (directly or indirectly)
- WeatherContext is derived from a lake-centered snapshot
- No background refresh logic lives here
- Snapshot update cadence is handled upstream (app/session layer)
"""


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

    # 1) Preferred: upstream-provided snapshot (session-layer resolved)
    snap = getattr(req, "weather_snapshot", None) or getattr(req, "weather", None)
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

    # 2) Legacy fallback for old tests only
    if hasattr(req, "temp_f") and hasattr(req, "wind_speed") and hasattr(req, "sky_condition"):
        return WeatherContext(
            temp_f=getattr(req, "temp_f"),
            wind_speed=getattr(req, "wind_speed"),
            sky_condition=getattr(req, "sky_condition"),
            timestamp=datetime.utcnow(),
        )

    # 3) Stub fallback
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
# Pattern logic (rules engine)
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

    if temp_f >= 60:
        return "late-summer"
    if 50 <= temp_f < 60:
        return "fall"
    if temp_f < 50:
        return "late-fall"

    return "post-spawn"


def _classify_depth_zone(depth_ft: float) -> str:
    if depth_ft <= 2:
        return "ultra_shallow"
    if depth_ft <= 6:
        return "mid_shallow"
    if depth_ft <= 12:
        return "mid_depth"
    if depth_ft <= 20:
        return "deep"
    return "offshore"


def _pick_lures_and_colors(
    phase: str,
    depth_zone: str,
    clarity: str,
    bottom_composition: str,
    forage: List[str],
) -> (List[str], List[str]):
    lures: List[str] = []
    colors: List[str] = []

    if phase in ("pre-spawn", "post-spawn"):
        lures.append("jig")
        lures.append("mid-depth crankbait")
    elif phase == "spawn":
        lures.append("texas-rigged creature bait")
        lures.append("finesse worm")
    elif phase == "summer":
        lures.append("deep diving crankbait")
        lures.append("carolina rig")
    else:
        lures.append("spinnerbait")
        lures.append("lipless crankbait")

    if clarity == "clear":
        colors.append("green pumpkin")
        colors.append("natural shad")
    elif clarity == "stained":
        colors.append("chartreuse/blue")
        colors.append("white")
    elif clarity == "dirty":
        colors.append("black/blue")
        colors.append("firetiger")
    else:
        colors.append("green pumpkin")
        colors.append("white")

    return lures, colors


def _build_lure_setups(
    lures: List[str],
    depth_zone: str,
    clarity: str,
) -> List[LureSetup]:
    setups: List[LureSetup] = []
    for lure in lures:
        setups.append(
            LureSetup(
                lure=lure,
                technique="casting",
                rod='7\'0" medium-heavy',
                reel="7.1:1 baitcaster",
                line="15 lb fluorocarbon",
                hook_or_leader="3/0 EWG hook",
                lure_size="3/8 oz",
            )
        )
    return setups


def _build_targets_for(
    phase: str,
    depth_zone: str,
    bottom_composition: str,
) -> List[str]:
    targets: List[str] = []

    if phase in ("pre-spawn", "post-spawn"):
        targets.append("secondary points leading into spawning pockets")
        targets.append("channel swings close to flats")
    elif phase == "spawn":
        targets.append("protected pockets with hard bottom")
        targets.append("inside edges of grass and shallow flats")
    elif phase in ("summer", "late-summer"):
        targets.append("main-lake points with access to deep water")
        targets.append("humps, ledges, and offshore structure")
    elif phase in ("fall", "late-fall"):
        targets.append("backs of creeks with visible baitfish")
        targets.append("transition banks where rock meets clay or sand")
    elif phase == "winter":
        targets.append("steep channel swings near main-lake basins")
        targets.append("vertical structure close to deep water")
    else:
        targets.append("high-percentage structure near bait and depth changes")

    if bottom_composition in ("rock", "gravel"):
        targets.append("rock transitions, riprap, and isolated hard spots")
    elif bottom_composition in ("sand", "clay"):
        targets.append("subtle contour changes and edges where bottom composition shifts")

    if depth_zone in ("ultra_shallow", "mid_shallow"):
        targets.append("shallow cover such as laydowns, docks, and grass edges")
    elif depth_zone in ("deep", "offshore"):
        targets.append("offshore structure where contour, cover, and bait intersect")

    seen = set()
    unique_targets: List[str] = []
    for t in targets:
        if t not in seen:
            unique_targets.append(t)
            seen.add(t)

    return unique_targets


def _build_strategy_tips(
    phase: str,
    depth_zone: str,
    clarity: str,
    wind_speed: float,
    sky_condition: str,
) -> List[str]:
    tips: List[str] = []

    if phase in ("pre-spawn", "post-spawn"):
        tips.append(
            "Rotate between staging areas and nearby feeding flats, making multiple passes before leaving a good zone."
        )
    elif phase == "spawn":
        tips.append(
            "Cover water until you see signs of spawning, then slow down and make precise presentations to high-percentage spots."
        )
    elif phase in ("summer", "late-summer"):
        tips.append(
            "Use your first hour to cover shallow or shade-related targets, then spend time probing deeper structure."
        )
    elif phase in ("fall", "late-fall"):
        tips.append("Follow the bait into creeks and pockets and keep moving until you intersect active fish.")
    elif phase == "winter":
        tips.append("Fish slower and closer to the bottom, focusing on areas where contour, cover, and bait intersect.")

    if clarity == "clear":
        tips.append("In clear water, keep off the target, make longer casts, and lean on natural, subtle presentations.")
    elif clarity == "stained":
        tips.append("In stained water, use bolder colors and moderate vibration to help fish find the bait.")
    elif clarity == "dirty":
        tips.append("In dirty water, prioritize big profiles, strong vibration, and high-contrast colors close to cover.")

    if wind_speed >= 12.0:
        tips.append("Use the wind: focus on wind-blown banks and points where bait is pushed and bass are more aggressive.")
    elif wind_speed <= 3.0:
        tips.append("On calm days, downsize and make quieter, more precise presentations.")

    if sky_condition in ("clear",):
        tips.append("With bright skies, prioritize shade, deeper water, and low-light windows at dawn and dusk.")
    elif sky_condition in ("rain", "cloudy", "partly_cloudy"):
        tips.append("Cloud cover lets bass roam—cover water efficiently with moving baits to locate active fish.")

    tips.append("If the pattern stalls, change only one variable at a time—location, depth, or lure profile.")

    return tips


# NOTE: Caller is responsible for snapshot cadence.
# This function assumes weather is stable for the session.
def build_pro_pattern(req: ProPatternRequest) -> ProPatternResponse:
    weather = _get_weather_from_request(req)

    # Deterministic snapshot hash (V1)
    # - Uses canonical rounding and stable JSON encoding
    # - Timestamp is intentionally excluded
    latitude = getattr(req, "latitude", None)
    longitude = getattr(req, "longitude", None)

    weather_hash_input = _weather_for_hash(weather)
    env_snapshot_hash = snapshot_hash(
        weather=weather_hash_input,
        config=SnapshotHashConfig(),  # defaults: temp/wind to 0.1; lat/lon to 5 decimals
        lat=float(latitude) if latitude is not None else None,
        lon=float(longitude) if longitude is not None else None,
        time_bucket=None,  # keep out unless you explicitly add normalized buckets upstream
        water_view_id=None,  # keep out unless you have a stable identifier
    )

    if hasattr(req, "month"):
        month = int(getattr(req, "month"))
    else:
        month = weather.timestamp.month

    clarity = getattr(req, "clarity", None) or "stained"
    bottom_composition = getattr(req, "bottom_composition", None) or "mixed"
    forage = getattr(req, "forage", None) or ["shad"]

    phase = _classify_phase(weather.temp_f, month)

    depth_ft = getattr(req, "depth_ft", None)
    if depth_ft is not None:
        depth_zone = _classify_depth_zone(depth_ft)
    else:
        if phase in ("spawn", "pre-spawn", "post-spawn"):
            depth_zone = "mid_shallow"
        elif phase in ("summer", "late-summer"):
            depth_zone = "mid_depth"
        elif phase in ("fall", "late-fall"):
            depth_zone = "mid_depth"
        elif phase == "winter":
            depth_zone = "deep"
        else:
            depth_zone = "mid_depth"

    recommended_lures, color_recommendations = _pick_lures_and_colors(
        phase=phase,
        depth_zone=depth_zone,
        clarity=clarity,
        bottom_composition=bottom_composition,
        forage=forage,
    )

    lure_setups = _build_lure_setups(
        lures=recommended_lures,
        depth_zone=depth_zone,
        clarity=clarity,
    )

    recommended_targets = _build_targets_for(
        phase=phase,
        depth_zone=depth_zone,
        bottom_composition=bottom_composition,
    )

    strategy_tips = _build_strategy_tips(
        phase=phase,
        depth_zone=depth_zone,
        clarity=clarity,
        wind_speed=weather.wind_speed,
        sky_condition=weather.sky_condition,
    )

    conditions: Dict[str, Any] = {
        "tier": "pro",
        "location_name": getattr(req, "location_name", None),
        "latitude": latitude,
        "longitude": longitude,
        "temp_f": weather.temp_f,
        "wind_speed": weather.wind_speed,
        "sky_condition": weather.sky_condition,
        "timestamp": weather.timestamp.isoformat(),  # stored, but NOT used in hash
        "month": month,
        "clarity": clarity,
        "bottom_composition": bottom_composition,
        "depth_ft": depth_ft,
        "forage": forage,
        # Deterministic snapshot identity
        "snapshot_hash": env_snapshot_hash,
        # Optional debug: what we hashed (still deterministic)
        "snapshot_weather": weather_hash_input,
    }

    notes = (
        "Pro pattern generated using rules-based logic, current weather, and basic "
        "environmental context for this location."
    )

    # --- V1 UI-friendly summary fields (kept deterministic) ---
    primary_technique = "Bottom-Contact Dragging"
    featured_lure_name = "Texas-rigged finesse worm"
    featured_lure_family = "texas_rig"

    pattern_summary = (
        "Today’s stable conditions and moderate clarity favor a bottom-contact dragging presentation. "
        "A Texas-rigged finesse worm keeps the bait in the strike zone without overpowering pressured fish."
    )

    return ProPatternResponse(
        phase=phase,
        depth_zone=depth_zone,
        recommended_lures=recommended_lures,
        recommended_targets=recommended_targets,
        strategy_tips=strategy_tips,
        color_recommendations=color_recommendations,
        lure_setups=lure_setups,
        conditions=conditions,
        notes=notes,
        primary_technique=primary_technique,
        featured_lure_name=featured_lure_name,
        featured_lure_family=featured_lure_family,
        pattern_summary=pattern_summary,
    )