from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Dict, Mapping, Optional, Union

from pydantic import BaseModel


def _round_float(val: Optional[float], *, ndigits: int) -> Optional[float]:
    if val is None:
        return None
    # Normalize -0.0 to 0.0 to prevent hash drift
    r = round(float(val), ndigits)
    return 0.0 if r == -0.0 else r


def _canonicalize_value(v: Any) -> Any:
    """
    Make values JSON-stable:
    - dict keys sorted
    - lists preserved in order (assume order matters unless caller sorts)
    - floats left as-is (caller should round beforehand)
    """
    if isinstance(v, Mapping):
        return {k: _canonicalize_value(v[k]) for k in sorted(v.keys())}
    if isinstance(v, (list, tuple)):
        return [_canonicalize_value(x) for x in v]
    if isinstance(v, set):
        # sets are nondeterministic; sort them
        return sorted(_canonicalize_value(x) for x in v)
    return v


def canonical_json_bytes(data: Mapping[str, Any]) -> bytes:
    """
    Canonical JSON encoding:
    - stable key ordering (we canonicalize first)
    - no whitespace
    """
    canonical = _canonicalize_value(dict(data))
    s = json.dumps(canonical, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    return s.encode("utf-8")


def sha256_hex(data: Mapping[str, Any]) -> str:
    return hashlib.sha256(canonical_json_bytes(data)).hexdigest()


@dataclass(frozen=True)
class SnapshotHashConfig:
    # Weather rounding
    temp_f_digits: int = 1
    wind_mph_digits: int = 1

    # Optional location rounding (if included)
    lat_digits: int = 5
    lon_digits: int = 5


def build_hash_input(
    *,
    weather: Union[BaseModel, Mapping[str, Any]],
    config: SnapshotHashConfig = SnapshotHashConfig(),
    # Optional context (only include if you actually want it to influence regen eligibility)
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    time_bucket: Optional[str] = None,
    water_view_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns the dict that will be hashed.
    Keep this as the *single* way hashes are built (pattern gen + regen checks).
    """
    if isinstance(weather, BaseModel):
        w = weather.model_dump()
    else:
        w = dict(weather)

    # Normalize weather floats
    w["temp_f"] = _round_float(w.get("temp_f"), ndigits=config.temp_f_digits)
    w["wind_mph"] = _round_float(w.get("wind_mph"), ndigits=config.wind_mph_digits)

    # Normalize weather strings (avoid whitespace drift)
    for k in ("cloud_cover", "clarity_estimate", "season_phase"):
        if w.get(k) is not None:
            w[k] = str(w[k]).strip().lower()

    out: Dict[str, Any] = {"weather": w}

    # Include optional context only if provided
    if lat is not None and lon is not None:
        out["location"] = {
            "lat": _round_float(lat, ndigits=config.lat_digits),
            "lon": _round_float(lon, ndigits=config.lon_digits),
        }

    if time_bucket is not None:
        out["time_bucket"] = str(time_bucket).strip().lower()

    if water_view_id is not None:
        out["water_view_id"] = str(water_view_id).strip()

    return out


def snapshot_hash(
    *,
    weather: Union[BaseModel, Mapping[str, Any]],
    config: SnapshotHashConfig = SnapshotHashConfig(),
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    time_bucket: Optional[str] = None,
    water_view_id: Optional[str] = None,
) -> str:
    return sha256_hex(
        build_hash_input(
            weather=weather,
            config=config,
            lat=lat,
            lon=lon,
            time_bucket=time_bucket,
            water_view_id=water_view_id,
        )
    )