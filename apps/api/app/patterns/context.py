# app/domain/pattern/context.py
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Literal
import json
import hashlib

@dataclass
class WeatherContext:
    """
    Shared weather context used by Pro/Elite/Vision/fusion logic.
    """
    temp_f: float
    wind_speed: float
    sky_condition: str
    timestamp: datetime
    
    def snapshot_hash(self) -> str:
        """
        Deterministic hash of environmental state.
        Used for pattern stability + regeneration checks.
        """
        payload = {
            "temp_f": round(self.temp_f, 1),
            "wind_speed": round(self.wind_speed, 1),
            "sky_condition": self.sky_condition,
        }

        encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
        return hashlib.sha256(encoded).hexdigest()

@dataclass
class VisionContext:
    """
    Distilled sonar/vision info coming from your Vision pipeline.
    This is intentionally small for V1 fusion.
    """
    depth_ft: float
    arch_count: int
    activity_level: Literal["low", "medium", "high"]
    bait_present: bool
    bottom_hardness: Literal["soft", "medium", "hard"]
    stop_or_keep_moving: Literal["stop", "keep_moving"]


@dataclass
class FusedContext:
    """
    The fused view that Elite / Vision tiers will use.
    Fusion will produce this from WeatherContext + VisionContext.
    """
    weather: WeatherContext
    vision: VisionContext

    should_camp: bool               # stop vs keep moving based on fusion
    likely_quality_bite_zone: Literal["shallow", "mid", "deep"]
    confidence_level: Literal["low", "medium", "high"]
