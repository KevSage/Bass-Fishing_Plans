from typing import Any, Dict, List

def build_retrieve_bullets(plan: Dict[str, Any]) -> List[str]:
    c = plan.get("conditions") or {}
    phase = (plan.get("phase") or "").lower()
    clarity = (c.get("clarity") or "stained").lower()
    wind = float(c.get("wind_speed") or 0)
    sky = (c.get("sky_condition") or "").lower().replace("_", " ")

    lures = plan.get("recommended_lures") or []
    lure = (lures[0] if lures else "").lower()

    bullets: List[str] = []

    # Base lure family guidance
    if "crank" in lure or "lipless" in lure:
        bullets.append("Cover water with steady casts; change retrieve speed every few casts to trigger reactions.")
        bullets.append("Deflect off cover when possible—contact is a feature, not a mistake.")
    elif "spinner" in lure or "chatter" in lure or "swim jig" in lure:
        bullets.append("Keep the bait moving with a consistent thump; bump cover and briefly pause to make it flare.")
        bullets.append("Use a slightly higher rod angle in shallow water to keep it above grass/wood.")
    elif "jig" in lure or "texas" in lure or "carolina" in lure or "worm" in lure:
        bullets.append("Work it on the bottom with short drags and pauses—let it sit long enough to get bit.")
        bullets.append("When you hit rock/wood, stop it for a beat, then ease it forward again.")
    elif "jerk" in lure:
        bullets.append("Use a twitch-twitch-pause cadence; lengthen pauses if bites are subtle.")
        bullets.append("Make casts parallel to depth changes and keep it in the strike zone longer.")
    elif "topwater" in lure or "frog" in lure or "popper" in lure:
        bullets.append("Start with a steady cadence; pause near targets and after any missed blowups.")
        bullets.append("Prioritize shade lines, isolated cover, and calm pockets near wind.")
    else:
        bullets.append("Start with a steady cadence, then vary speed and pauses until you get a clear response.")

    # Clarity bias
    if "dirty" in clarity:
        bullets.append("In dirty water, fish it tighter to cover and lean on vibration/contrast to help bass track it.")
    elif "clear" in clarity:
        bullets.append("In clear water, make longer casts and use a more subtle cadence around the target.")
    else:
        bullets.append("In stained water, keep the retrieve confident—moderate speed with occasional cadence changes.")

    # Wind / sky bias (lightweight)
    if wind >= 12:
        bullets.append("Use the wind: cast into it or quartering, and target wind-blown banks/points first.")
    elif wind <= 3:
        bullets.append("In calm conditions, slow your cadence slightly and be more precise with your casts.")

    if "clear" in sky:
        bullets.append("Bright skies: focus on shade and the first depth change; slow down if bites are scarce.")
    else:
        bullets.append("Cloud cover: cover water and rotate targets faster until you find active fish.")

    # Phase bias (simple)
    if phase in ("winter",):
        bullets.append("Cold water: shorten moves, slow down, and keep the bait in the strike zone longer.")
    elif phase in ("summer", "late-summer"):
        bullets.append("As the sun gets up, probe deeper structure or shade and slow the presentation slightly.")

    # Cap to 4–5 bullets max
    return bullets[:5]