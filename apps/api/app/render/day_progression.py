from typing import Any, Dict, List

def build_day_progression(plan: Dict[str, Any]) -> List[str]:
    c = plan.get("conditions") or {}
    phase = (plan.get("phase") or "").lower()
    depth_zone = (plan.get("depth_zone") or "").lower()
    wind = float(c.get("wind_speed") or 0)
    sky = (c.get("sky_condition") or "").lower().replace("_", " ")
    clarity = (c.get("clarity") or "stained").lower()

    # Pull 1-2 targets for specificity (optional)
    targets = plan.get("recommended_targets") or []
    top_targets = [t for t in targets[:2] if isinstance(t, str) and t.strip()]

    # Pull primary lure+color for Morning (only once)
    lures = plan.get("recommended_lures") or []
    colors = plan.get("color_recommendations") or []
    lure_phrase = None
    if lures:
        lure_phrase = lures[0]
        if colors:
            lure_phrase = f"{lures[0]} ({colors[0]})"

    # Defaults (tight)
    morning = "Morning: Start by covering your most active water first."
    midday  = "Midday: Slow down and tighten targets as fish settle into cover or the first break."
    late    = "Late: Re-check your best stretch and adjust speed/angle to match the late bite."

    # Phase bias
    if phase == "winter":
        morning = "Morning: Start deeper and slower; keep the bait near bottom and soak key spots."
        midday  = "Midday: Lean into the warmest water and best sun exposure; fish methodically."
        late    = "Late: Stay slow—revisit the best contour/cover and extend pauses."
    elif phase == "pre-spawn":
        morning = "Morning: Start on staging water—secondary points and channel swings close to flats."
        midday  = "Midday: Slide shallower on the best warming banks; slow slightly and pick apart cover."
        late    = "Late: Revisit wind-influenced staging; increase pace only if you see bait moving."
    elif phase == "spawn":
        morning = "Morning: Cover water until you see spawners; then slow down and work key targets."
        midday  = "Midday: Focus on the cleanest pockets and protected cover; repeat casts to the best spots."
        late    = "Late: Check nearby shade and the first break for post-spawners and roamers."
    elif phase in ("summer", "late-summer"):
        morning = "Morning: Use the first hour shallow or shade-related to catch active fish quickly."
        midday  = "Midday: Move to the first break/offshore structure; slow down and stay in the strike zone."
        late    = "Late: Hit wind-facing cover again; speed up slightly as fish reposition to feed."
    elif phase in ("fall", "late-fall"):
        morning = "Morning: Start where bait is visible—creek arms, pockets, and wind-blown banks."
        midday  = "Midday: Keep moving until you intersect activity; rotate targets faster than you think."
        late    = "Late: Re-check the best bait areas; adjust depth to stay with the schools."

    # Lure mention once (Morning)
    if lure_phrase:
        morning = f"{morning} Start with {lure_phrase}."

    # Targets: inject 1-2 without stacking
    if top_targets:
        if top_targets[0] not in morning:
            morning = f"{morning} Focus on {top_targets[0]}."
        if len(top_targets) > 1 and top_targets[1] not in late:
            late = f"{late} Re-check {top_targets[1]}."

    # Wind bias
    if wind <= 3:
        midday = f"{midday} Calm water: downshift cadence and make more precise casts."

    # Clarity bias (minor)
    if clarity == "clear":
        morning = f"{morning} Clear water: keep distance and make longer casts."
    elif clarity == "dirty":
        midday = f"{midday} Dirty water: fish tighter to cover and prioritize vibration/contrast."

    # Depth zone bias
    if depth_zone in ("deep", "offshore"):
        morning = f"{morning} Prioritize the first deep stopping points."
    elif depth_zone in ("ultra_shallow", "mid_shallow"):
        late = f"{late} End your day shallow around cover and the warmest water available."

    # Sky bias (minor)
    if "clear" in sky:
        midday = f"{midday} Bright skies: lean into shade and the first depth change."
    else:
        morning = f"{morning} Cloud cover: cover water efficiently until you hit a bite window."

    return [morning, midday, late]