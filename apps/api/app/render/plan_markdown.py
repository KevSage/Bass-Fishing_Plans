from typing import Dict, Any, List
from app.render.retrieve_rules import build_retrieve_bullets
from app.render.day_progression import build_day_progression

def _pick(items: List[str], n: int) -> List[str]:
    return [x for x in items if x][:n]

def render_plan_markdown(data: Dict[str, Any]) -> str:
    c = data.get("conditions") or {}
    loc = c.get("location_name") or "Your Area"
    temp = c.get("temp_f")
    wind = c.get("wind_speed")
    sky = c.get("sky_condition")

    lures = data.get("recommended_lures") or []
    colors = data.get("color_recommendations") or []
    targets = data.get("recommended_targets") or []
    tips = data.get("strategy_tips") or []
    setups = data.get("lure_setups") or []

    lure = lures[0] if lures else "spinnerbait"
    color = colors[0] if colors else "white"

    # use first setup for gear line
    gear = setups[0] if setups else {}
    gear_line = " • ".join([x for x in [
        gear.get("rod"),
        gear.get("reel"),
        gear.get("line"),
        gear.get("hook_or_leader"),
        gear.get("lure_size"),
    ] if x])

    work_it = build_retrieve_bullets(data)

    # placeholder day progression (V1)
    day_prog = data.get("day_progression") or []    
    trip_date = data.get("trip_date")  # "YYYY-MM-DD" or None
    date_line = f"Date: **{trip_date}**" if trip_date else ""
    pattern_name = data.get("primary_technique") or "Primary Pattern"
    summary = (data.get("pattern_summary") or "").strip()
    if summary.count(".") >= 2:
        summary = summary.split(".")[0].strip() + "."

    md = []
    md.append(f"**TODAY’S BASS PLAN — {loc}**")
    if date_line:
       md.append(date_line)
    md.append(f"Conditions: **{temp}°F**, **{wind} mph wind**, **{sky}**")
    md.append("")
    md.append(f"### Pattern 1 — {pattern_name}")
    if summary:
        md.append(f"**Why:** {summary}")
        md.append("")
    md.append(f"**Throw:** **{lure}** — **{color}**")
    md.append("")
    md.append("**Target:**")
    for t in _pick(targets, 3):
        md.append(f"- {t}")
    md.append("")
    md.append("**Work it:**")
    for w in work_it:
        md.append(f"- {w}")
    if gear_line:
        md.append("")
        md.append(f"**Gear:** {gear_line}")
    md.append("")
    md.append("### As the day progresses")
    for line in day_prog:
        md.append(f"- {line}")
    return "\n".join(md).strip() + "\n"