from typing import Dict, Any, List
from app.render.retrieve_rules import build_retrieve_bullets

def _pick(items: List[str], n: int) -> List[str]:
    return [x for x in items if x][:n]


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
        bullets.append("If the bite feels tough, trim bulk (shorter skirt / smaller trailer) and extend pauses to keep it in the strike zone.")
    elif isinstance(temp, (int, float)) and temp >= 72:
        bullets.append("If fish are active, keep a fuller profile and speed up slightly to trigger reaction bites—then slow down if you miss them.")

    # Wind / visibility bias
    if float(wind) >= 12:
        bullets.append("Wind is your friend: lean into more vibration/pressure and make repeated passes on the windiest high-percentage stretches.")
    elif float(wind) <= 3:
        bullets.append("Calm water: downshift cadence, make longer casts, and hit the cleanest lanes with quieter presentations.")

    # Sky / silhouette bias
    if "clear" in sky:
        bullets.append("Bright skies: tighten the profile and target shade/edges; subtle movement often outperforms aggressive action.")
    else:
        bullets.append("Low light/cloud cover: a stronger silhouette and steadier cadence can help fish track the bait while they roam.")

    # Lure-specific knobs (only for the lure we already recommended)
    if "spinnerbait" in lure0:
        bullets.append("Blade cue: clearer/brighter → willow for tighter flash; stained/overcast → Colorado/Indiana for more thump.")
    if "jig" in lure0:
        bullets.append("Jig cue: tough bite → trim the skirt slightly; roaming/windy → keep it fuller for presence.")
    if "crankbait" in lure0:
        bullets.append("Crank cue: if you’re ticking cover, pause briefly after contact; if you’re not contacting anything, adjust depth/angle before changing baits.")

    # Keep deterministic + short
    # Prefer 3 bullets; allow 2–4
    if len(bullets) > 4:
        bullets = bullets[:4]
    if len(bullets) < 2:
        return []

    return bullets


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
    elite_refinements = build_elite_refinements(data)
    work_it = build_retrieve_bullets(data)

    # placeholder day progression (V1)
    day_prog = data.get("day_progression") or []    
    trip_date = c.get("trip_date")    
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

    is_preview = bool((c.get("is_preview") is True))
    if elite_refinements and not is_preview:
        md.append("")
        md.append("### Optional refinements")
        for b in elite_refinements:
            md.append(f"- {b}")

    md.append("")
    md.append("### As the day progresses")
    for line in day_prog:
        md.append(f"- {line}")
    return "\n".join(md).strip() + "\n"