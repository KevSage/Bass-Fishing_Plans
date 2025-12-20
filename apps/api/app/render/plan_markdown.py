# apps/api/app/render/plan_markdown.py

from typing import Dict, Any, List, Optional
import re

from app.render.retrieve_rules import build_retrieve_bullets
from app.render.elite_refinements import build_elite_refinements


# ----------------------------
# helpers
# ----------------------------

_STATE_RE = re.compile(r"^(.+?),?\s+([A-Z]{2})$")


def _pick(items: List[str], n: int) -> List[str]:
    return [x for x in items if x][:n]


def _lower(s: Optional[str]) -> str:
    return (s or "").strip().lower()


def _fmt_city_state(raw: Optional[str]) -> str:
    s = (raw or "").strip()
    if not s:
        return "Your Area"

    # Already "City, ST"
    if "," in s:
        parts = [p.strip() for p in s.split(",")]
        if len(parts) >= 2 and len(parts[-1]) == 2:
            return f"{', '.join(parts[:-1])}, {parts[-1].upper()}"
        return s

    # "City ST"
    m = _STATE_RE.match(s)
    if m:
        city = m.group(1).strip()
        st = m.group(2).strip().upper()
        return f"{city}, {st}"

    return s


def _title_line(geo: Dict[str, Any], conditions: Dict[str, Any]) -> str:
    """
    Deterministic title line:

    Always: City, ST
    If lake known: City, ST — Lake Name

    Sources:
      - geo.title_line (if you later choose to precompute)
      - geo.name (preferred)
      - conditions.location_name fallback
      - optional geo.lake_name
    """
    pre = (geo.get("title_line") or "").strip()
    if pre:
        return pre

    base_name = geo.get("name") or conditions.get("location_name") or "Your Area"
    city_state = _fmt_city_state(base_name)

    lake = (geo.get("lake_name") or "").strip()
    return f"{city_state} — {lake}" if lake else city_state


def _preview_subscribe_footer() -> str:
    return (
        "\n"
        "---\n"
        "**This is a preview plan.**\n"
        "Full plans include additional execution detail, expanded targets, gear setup guidance, and day-progression notes — all built specifically for your water.\n"
        "\n"
        "Subscribers can request a fresh, complete plan anytime they fish.\n"
        "\n"
        "**[Get unlimited full plans →]**\n"
    )


def _format_conditions_line(c: Dict[str, Any]) -> str:
    """
    Keep existing behavior, but avoid 'None°F' etc.
    Only uses values already present in payload.
    """
    temp = c.get("temp_f")
    wind = c.get("wind_speed")
    sky = c.get("sky_condition")

    parts: List[str] = []
    if temp is not None:
        parts.append(f"**{temp}°F**")
    if wind is not None:
        parts.append(f"**{wind} mph wind**")
    if sky:
        parts.append(f"**{sky}**")

    if not parts:
        return "Conditions: —"

    return "Conditions: " + ", ".join(parts)


# ----------------------------
# trailer logic (NOT alternates)
# ----------------------------

def _trailer_notes_for_lure(lure_family: str) -> List[str]:
    lf = _lower(lure_family)

    if "chatterbait" in lf:
        return [
            "Trailer (optional): minnow/fluke-style for a tighter baitfish look; craw-style for added lift and bulk.",
        ]

    if "jig" in lf:
        if "swim" in lf:
            return [
                "Trailer: small swimbait/minnow-style to keep the jig tracking straight.",
            ]
        return [
            "Trailer: craw-style is the default profile; downsize for tougher bites, upsize for a bigger presence.",
            "Deeper water → heavier jig for quicker fall and bottom contact.",
            "Heavy vegetation → heavier jig to penetrate and stay efficient.",
        ]

    if "spinnerbait" in lf:
        return [
            "Trailer (optional): preference only — add a small swimbait/grub for bulk or skip it for max flash.",
        ]

    if "buzzbait" in lf:
        return [
            "Trailer (optional): preference only — add a toad/swimbait for lift or skip it for a cleaner surface profile.",
        ]

    return []


# ----------------------------
# soft-plastic alternates (same technique only)
# ----------------------------

def _soft_plastic_alts_for_rig(lure_family: str) -> List[str]:
    lf = _lower(lure_family)

    if "dropshot" in lf:
        return ["Small minnow (nose-hooked)", "Finesse worm"]

    if "wacky" in lf:
        return ["Stick bait", "Finesse worm (wacky)"]

    if "shaky" in lf:
        return ["Finesse worm", "Compact stick bait"]

    if "neko" in lf:
        return ["Stick bait (neko)", "Finesse worm"]

    if "texas" in lf:
        return ["Craw", "Ribbon-tail worm"]

    if "carolina" in lf:
        return ["Ribbon-tail worm", "Craw"]

    if "ned" in lf:
        return ["Ned stick bait"]

    return []


# ----------------------------
# rendering blocks
# ----------------------------

def _gear_line(data: Dict[str, Any]) -> str:
    setups = data.get("lure_setups") or []
    gear = setups[0] if setups else {}
    return " • ".join(
        [
            x
            for x in [
                gear.get("rod"),
                gear.get("reel"),
                gear.get("line"),
                gear.get("hook_or_leader"),
                gear.get("lure_size"),
            ]
            if x
        ]
    )


def _render_pattern(
    *,
    title: str,
    lure_name: str,
    lure_family: str,
    color: str,
    targets: List[str],
    work_it: List[str],
    gear_line: str,
    why: Optional[str],
    alternates: List[str],
    reduce: bool,
) -> List[str]:
    md: List[str] = []
    md.append(f"### {title}")

    if why:
        md.append(f"**Why:** {why}")
        md.append("")

    md.append(f"**Throw:** **{lure_name}** — **{color}**")
    md.append("")

    md.append("**Target:**")
    for t in _pick(targets, 2 if reduce else 3):
        md.append(f"- {t}")

    md.append("")
    md.append("**Work it:**")
    for w in _pick(work_it, 3 if reduce else 6):
        md.append(f"- {w}")

    if gear_line:
        md.append("")
        md.append(f"**Gear:** {gear_line}")

    if alternates:
        md.append("")
        md.append("**Alternates (same presentation):**")
        for a in _pick(alternates, 2 if reduce else 3):
            md.append(f"- {a}")

    return md


# ----------------------------
# main renderer
# ----------------------------

def render_plan_markdown(data: Dict[str, Any]) -> str:
    c = data.get("conditions") or {}
    geo = data.get("geo") or {}

    # Deterministic title line (City, ST — Lake Name if present)
    title_line = _title_line(geo, c)

    lures = data.get("recommended_lures") or []
    colors = data.get("color_recommendations") or []
    targets = data.get("recommended_targets") or []

    lure1_name = data.get("featured_lure_name") or (lures[0] if lures else "spinnerbait")
    lure1_family = data.get("featured_lure_family") or lure1_name
    color1 = colors[0] if colors else "white"

    work_it_1 = list(build_retrieve_bullets(data) or [])
    work_it_1.extend(_trailer_notes_for_lure(lure1_family))

    alternates_1 = _soft_plastic_alts_for_rig(lure1_family)

    elite_refinements = build_elite_refinements(data)

    day_prog = data.get("day_progression") or []
    trip_date = c.get("trip_date")
    date_line = f"Date: **{trip_date}**" if trip_date else ""

    pattern_name = data.get("primary_technique") or "Primary Pattern"
    summary = (data.get("pattern_summary") or "").strip()
    if summary.count(".") >= 2:
        summary = summary.split(".")[0].strip() + "."

    # NEW (LLM, constrained, commentary-only). Fail-soft: only render if present.
    outlook = (data.get("outlook_blurb") or "").strip()

    is_preview = bool(c.get("is_preview") is True)

    md: List[str] = []
    md.append(f"**TODAY’S BASS PLAN — {title_line}**")
    if date_line:
        md.append(date_line)
    md.append(_format_conditions_line(c))

    if outlook:
        md.append(f"Outlook: {outlook}")

    md.append("")

    md.extend(
        _render_pattern(
            title=f"Pattern 1 — {pattern_name}",
            lure_name=lure1_name,
            lure_family=lure1_family,
            color=color1,
            targets=targets,
            work_it=work_it_1,
            gear_line=_gear_line(data),
            why=summary,
            alternates=alternates_1,
            reduce=False,
        )
    )

    if elite_refinements and not is_preview:
        md.append("")
        md.append("### Optional refinements")
        for r in _pick(elite_refinements, 4):
            md.append(f"- {r}")

    p2 = data.get("pattern_2") or {}
    if p2:
        lure2 = p2.get("primary_lure_spec", {}).get("display_name") or (p2.get("recommended_lures") or [""])[0]
        family2 = p2.get("presentation_family") or lure2
        color2 = (p2.get("color_recommendations") or colors or ["white"])[0]

        work_it_2 = list(build_retrieve_bullets({"conditions": c, "recommended_lures": [lure2]}) or [])
        work_it_2.extend(_trailer_notes_for_lure(family2))
        alternates_2 = _soft_plastic_alts_for_rig(family2)

        md.append("")
        md.extend(
            _render_pattern(
                title="Pattern 2 — Counter-condition",
                lure_name=lure2,
                lure_family=family2,
                color=color2,
                targets=p2.get("recommended_targets") or [],
                work_it=work_it_2,
                gear_line="",
                why=None,
                alternates=alternates_2,
                reduce=True,
            )
        )

    if (not is_preview) or (is_preview and day_prog):
        md.append("")
        md.append("### As the day progresses")
        for d in _pick(day_prog, 6):
            md.append(f"- {d}")

    if is_preview:
        md.append(_preview_subscribe_footer())

    return "\n".join(md).strip() + "\n"