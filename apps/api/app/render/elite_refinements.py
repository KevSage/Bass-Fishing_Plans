from __future__ import annotations

from typing import Any, Dict, List


def build_elite_refinements(data: Dict[str, Any]) -> List[str]:
    """
    Elite-only optional tuning knobs.
    Deterministic, capped to 2–4 bullets. No new lures introduced.
    """
    c = data.get("conditions") or {}

    temp = c.get("temp_f")
    wind = c.get("wind_speed") or 0
    sky = (c.get("sky_condition") or "").lower().replace("_", " ")

    lures = data.get("recommended_lures") or []
    lure0 = (lures[0].lower() if lures else "")

    bullets: List[str] = []

    # Profile / pace bias (safe, general)
    if isinstance(temp, (int, float)) and temp <= 52:
        bullets.append(
            "If the bite feels tough, trim bulk (shorter skirt / smaller trailer) and extend pauses to keep it in the strike zone."
        )
    elif isinstance(temp, (int, float)) and temp >= 72:
        bullets.append(
            "If fish are active, keep a fuller profile and speed up slightly to trigger reaction bites—then slow down if you miss them."
        )

    # Wind / visibility bias
    if float(wind) >= 12:
        bullets.append(
            "Wind is your friend: lean into more vibration/pressure and make repeated passes on the windiest high-percentage stretches."
        )
    elif float(wind) <= 3:
        bullets.append(
            "Calm water: downshift cadence, make longer casts, and hit the cleanest lanes with quieter presentations."
        )

    # Sky / silhouette bias
    if "clear" in sky:
        bullets.append(
            "Bright skies: tighten the profile and target shade/edges; subtle movement often outperforms aggressive action."
        )
    else:
        bullets.append(
            "Low light/cloud cover: a stronger silhouette and steadier cadence can help fish track the bait while they roam."
        )

    # Lure-specific knobs (only for the lure we already recommended)
    if "spinnerbait" in lure0:
        bullets.append(
            "Blade cue: clearer/brighter → willow for tighter flash; stained/overcast → Colorado/Indiana for more thump."
        )
    if "jig" in lure0:
        bullets.append(
            "Jig cue: tough bite → trim the skirt slightly; roaming/windy → keep it fuller for presence."
        )
    if "crankbait" in lure0:
        bullets.append(
            "Crank cue: if you’re ticking cover, pause briefly after contact; if you’re not contacting anything, adjust depth/angle before changing baits."
        )

    # Keep deterministic + short
    if len(bullets) > 4:
        bullets = bullets[:4]
    if len(bullets) < 2:
        return []

    return bullets