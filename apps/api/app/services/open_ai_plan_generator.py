# apps/api/app/services/open_ai_plan_generator.py
from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import httpx

OPENAI_API_URL = "https://api.openai.com/v1/responses"


# ------------------------------------------------------------
# Feature flag
# ------------------------------------------------------------
def llm_plan_enabled() -> bool:
    """
    Single source of truth for enabling AI plan generation.
    Env vars are strings, so normalize.
    """
    return os.getenv("LLM_PLAN", "").strip().lower() in ("1", "true", "yes", "on")


# ------------------------------------------------------------
# Prompt (LOCKED RULES)
# ------------------------------------------------------------

SYSTEM_PROMPT = """
You are BassFishingPlans (BFP), a paid on-demand bass fishing plan generator.

GOAL
Generate a highly-specific, weather-aware bass fishing plan for the user’s provided location and trip date.

OUTPUT FORMAT (STRICT)
Return ONE JSON object that matches the PlanResponse schema provided. Do not include any extra keys.

STYLE
- Crisp, practical, “do this next” tone.
- No hype, no jokes, no filler.
- No generic fishing encyclopedia content.
- Everything must be consistent with the provided inputs.

HARD RULES
1) Use the provided weather snapshot and location details. The plan must reflect temp/wind/sky/clarity/depth signals when present.
2) Never invent lakes, ramps, or named spots.
3) Never invent additional lures outside the allowed lure list in inputs.
4) If a lure is a rig/terminal technique (texas rig, dropshot, shaky head, neko, wacky, carolina, ned):
   - The “featured lure name” must be a technique-influenced display name (ex: “Drop Shot — Small Minnow”, “Texas Rig — Creature Bait”).
   - The plan must include technique identifier cues in Work It (weight/leader/line angle/rig behavior).
5) Trailers are NOT alternates. Trailer notes only belong in Work It.
6) Pattern 2 must be meaningfully different from Pattern 1:
   - Different fish positioning AND different presentation family.
   - It is a counter-condition option, not a “backup lure”.
7) Day progression is a 3-line timeline (Morning/Midday/Late) and must use at most 2 lures total across all 3 lines:
   - One is the featured lure (Pattern 1).
   - The other (optional) is the Pattern 2 lure if needed.
   - Each line must explicitly name exactly ONE lure/rig near the start of the line.
   - Do NOT write “switch to / then switch / transition to / rotate to / or …”.
   - Do NOT include color in Day Progression.
8) Colors:
   - Choose from allowed colors provided.
   - Avoid defaulting to “green pumpkin” unless conditions strongly justify it.
9) If targets or tips are empty, still produce usable Target and Work It sections using only the given environmental facts and general structure guidance (no new facts).
10) Keep Pattern 1 as the primary plan focus. Pattern 2 is shorter.

VALIDATION CHECK BEFORE RETURNING JSON
- Featured lure display name appears in Day Progression Morning line exactly once (NO color).
- Work It bullets match the lure type (no “bottom dragging” guidance on chatterbait, etc.).
- Pattern summary matches inferred/declared phase (no “pre-spawn” if phase isn’t pre-spawn).
""".strip()



# ------------------------------------------------------------
# Minimal “PlanResponse” shape used by BFP today
# Keep this aligned with main.py response models.
# ------------------------------------------------------------
PLAN_RESPONSE_KEYS = {"geo", "plan", "markdown", "rewritten", "day_progression", "timing"}

# REQUIRED keys inside plan
# IMPORTANT: day_progression is stored BOTH:
#  - top-level: obj["day_progression"]
#  - plan-level: obj["plan"]["day_progression"]
REQUIRED_PLAN_KEYS = {
    "phase",
    "depth_zone",
    "recommended_lures",
    "recommended_targets",
    "strategy_tips",
    "color_recommendations",
    "lure_setups",
    "conditions",
    "notes",
    "primary_technique",
    "featured_lure_name",
    "featured_lure_family",
    "pattern_summary",
    "day_progression",
}

RIG_KEYWORDS = ("texas", "drop shot", "dropshot", "shaky", "neko", "wacky", "carolina", "ned")


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def _lower(s: Any) -> str:
    return str(s or "").strip().lower()


def _normalize_lure_key(s: Any) -> str:
    """
    Convert model display names into canonical catalog keys used by allowed_lures.
    Examples:
      - "Texas Rig — Creature Bait" -> "texas rig (creature)"
      - "Medium-Diving Crankbait"   -> "medium-diving crankbait"
      - "Drop Shot — Small Minnow"  -> "dropshot (minnow)"
    """
    t = str(s or "").strip().lower()
    if not t:
        return ""

    # normalize separators / punctuation
    t = t.replace("—", " ").replace("–", " ")
    t = re.sub(r"\s+", " ", t).strip()

    # rigs / terminal
    if "texas rig" in t:
        if "creature" in t:
            return "texas rig (creature)"
        if "craw" in t:
            return "texas rig (craw)"
        return "texas rig (worm)"

    if "drop shot" in t or "dropshot" in t:
        if "minnow" in t:
            return "dropshot (minnow)"
        return "dropshot (finesse worm)"

    # crankbaits
    if "crank" in t:
        if "squarebill" in t:
            return "squarebill crankbait"
        if "lipless" in t:
            return "lipless crankbait"
        if "deep" in t:
            return "deep-diving crankbait"
        if "medium" in t:
            return "medium-diving crankbait"
        return "medium-diving crankbait"  # safe default if generic "crankbait"

    # keep common ones as-is
    for k in (
        "spinnerbait",
        "chatterbait",
        "jerkbait",
        "buzzbait",
        "prop bait",
        "underspin",
        "carolina rig",
        "punch rig",
        "shaky head",
        "ned rig",
        "wacky rig",
        "neko rig",
        "damiki rig",
        "hover rig",
        "walking bait",
        "popper",
        "hollow-body frog",
        "casting jig",
        "football jig",
        "finesse jig",
        "swing-head jig",
        "swim jig",
        "swimbait (hard body)",
        "swimbait (paddle-tail soft plastic)",
    ):
        if k in t:
            return k

    return t


def _canonical_featured_phrase(plan: Dict[str, Any]) -> str:
    # ✅ 1) authoritative: conditions.primary_lure_spec.display_name
    conditions = plan.get("conditions") if isinstance(plan, dict) else None
    if isinstance(conditions, dict):
        pls = conditions.get("primary_lure_spec")
        if isinstance(pls, dict):
            dn = str(pls.get("display_name") or "").strip()
            if dn:
                return dn

    # 2) fallback: featured_lure_name
    featured = str(plan.get("featured_lure_name") or "").strip()
    if featured:
        return featured

    # 3) fallback: recommended_lures[0]
    lures = plan.get("recommended_lures") or []
    if isinstance(lures, list) and lures:
        return str(lures[0]).strip()

    return ""


def _safe_first_color(plan: Dict[str, Any]) -> Optional[str]:
    cols = plan.get("color_recommendations") or []
    if not cols:
        return None
    c0 = str(cols[0]).strip()
    return c0 or None


def _normalize_colors(plan: Dict[str, Any], allowed_colors: Optional[List[str]]) -> None:
    """
    Force plan.color_recommendations into canonical, valid values.
    - clamps to allowed_colors when provided (preferred)
    - otherwise soft-normalizes blended strings like 'shad/albino' or 'green pumpkin/black flake'
    - strips lure-prefix drift like 'chatterbait — chartreuse'
    """

    def _clean_token(s: str) -> str:
        s = (s or "").strip().lower()
        s = s.strip(" \t\n\r\"'`()[]{}")
        for sep in ("—", "–", ":", "-"):
            if sep in s:
                s = s.split(sep)[-1].strip()
        s = re.sub(r"\s+", " ", s).strip()
        return s

    def _candidates(s: str) -> List[str]:
        s = _clean_token(s)
        if not s:
            return []
        out = [s]
        if "/" in s:
            parts = [p.strip() for p in s.split("/") if p.strip()]
            out.extend([p for p in parts if p not in out])
        return out

    cols = plan.get("color_recommendations")
    if not isinstance(cols, list) or not cols:
        return

    raw_candidates: List[str] = []
    for c in cols:
        if c is None:
            continue
        for cand in _candidates(str(c)):
            if cand and cand not in raw_candidates:
                raw_candidates.append(cand)

    if not raw_candidates:
        return

    if allowed_colors:
        allowed = {_lower(x) for x in allowed_colors if str(x).strip()}
        chosen: List[str] = []
        for cand in raw_candidates:
            if _lower(cand) in allowed and cand not in chosen:
                chosen.append(cand)
            if len(chosen) == 2:
                break

        if not chosen:
            fallback0 = _clean_token(str(allowed_colors[0])) if allowed_colors else None
            chosen = [fallback0] if fallback0 else []

        plan["color_recommendations"] = chosen[:2]

    else:
        first = raw_candidates[0]
        if "/" in first:
            first = first.split("/")[0].strip()
        out = [first] + [c for c in raw_candidates[1:] if c != first]
        plan["color_recommendations"] = out[:2]

    cnd = plan.get("conditions")
    if isinstance(cnd, dict):
        pls = cnd.get("primary_lure_spec")
        if isinstance(pls, dict):
            fixed = plan.get("color_recommendations") or []
            pls["primary_color"] = fixed[0] if len(fixed) > 0 else pls.get("primary_color")
            pls["secondary_color"] = fixed[1] if len(fixed) > 1 else pls.get("secondary_color")


def _normalize_color_key(x: Any) -> str:
    s = str(x or "").strip().lower()
    s = s.replace("—", "-").replace("–", "-")
    s = s.strip("()[]{} ")

    if " - " in s:
        s = s.split(" - ", 1)[1].strip()

    if ":" in s and len(s.split(":", 1)[0]) <= 10:
        s = s.split(":", 1)[1].strip()

    s = re.sub(r"\s+", " ", s)
    return s


def _pick_allowed_color(raw: str, allowed_set: set) -> Optional[str]:
    k = _normalize_color_key(raw)
    if k in allowed_set:
        return k

    if "/" in k:
        parts = [p.strip() for p in k.split("/") if p.strip()]
        for p in parts:
            if p in allowed_set:
                return p

    return None


def _looks_like_rig_or_terminal(display_name: str) -> bool:
    d = _lower(display_name)
    return any(k in d for k in RIG_KEYWORDS)


def _extract_output_text(data: Dict[str, Any]) -> Optional[str]:
    for item in data.get("output", []) or []:
        for c in item.get("content", []) or []:
            if c.get("type") == "output_text" and c.get("text"):
                return str(c["text"])
    return None


def _strip_code_fences(s: str) -> str:
    t = s.strip()
    if t.startswith("```"):
        lines = t.splitlines()
        lines = lines[1:] if lines else lines
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        return "\n".join(lines).strip()
    return t


def _infer_rig_style(featured: str) -> Optional[str]:
    f = _lower(featured)
    if "texas rig" in f:
        return "texas"
    if "drop shot" in f or "dropshot" in f:
        return "dropshot"
    if "shaky" in f:
        return "shaky_head"
    if "neko" in f:
        return "neko"
    if "wacky" in f:
        return "wacky"
    if "carolina" in f:
        return "carolina"
    if "ned" in f:
        return "ned"
    return None


def _ensure_primary_lure_spec_for_rigs(plan: Dict[str, Any]) -> None:
    featured = _canonical_featured_phrase(plan).strip()
    if not featured or not _looks_like_rig_or_terminal(featured):
        return

    c = plan.get("conditions")
    if not isinstance(c, dict):
        plan["conditions"] = {}
        c = plan["conditions"]

    pls = c.get("primary_lure_spec")
    if isinstance(pls, dict) and (pls.get("components") or pls.get("rig_style")):
        return

    rig_style = _infer_rig_style(featured) or "rig"
    colors = plan.get("color_recommendations") or []
    primary_color = str(colors[0]).strip() if len(colors) > 0 and colors[0] else None
    secondary_color = str(colors[1]).strip() if len(colors) > 1 and colors[1] else None

    c["primary_lure_spec"] = {
        "display_name": featured,
        "lure_family": rig_style,
        "rig_style": rig_style,
        "primary_color": (primary_color.lower() if primary_color else None),
        "secondary_color": (secondary_color.lower() if secondary_color else None),
        "accent_color": None,
        "components": [
            "Technique cues required: weight/leader/line angle/rig behavior (keep it concise)."
        ],
    }


def _strip_color_parens_from_day_progression(plan: Dict[str, Any], allowed_colors: Optional[List[str]]) -> None:
    dp = plan.get("day_progression")
    if not (isinstance(dp, list) and dp):
        return

    if not allowed_colors:
        return

    allowed = {_normalize_color_key(c) for c in allowed_colors if str(c).strip()}

    def is_color_token(tok: str) -> bool:
        k = _normalize_color_key(tok)
        if k in allowed:
            return True
        if "/" in k:
            for p in [p.strip() for p in k.split("/") if p.strip()]:
                if p in allowed:
                    return True
        return False

    out: List[str] = []
    for line in dp:
        if not isinstance(line, str):
            out.append(line)
            continue

        def repl(m: re.Match) -> str:
            inside = m.group(1)
            return "" if is_color_token(inside) else m.group(0)

        fixed = re.sub(r"$begin:math:text$\(\[\^\)\]\*\)$end:math:text$", repl, line)
        fixed = re.sub(r"\s+", " ", fixed).strip()
        fixed = fixed.replace("— —", "—")
        out.append(fixed)

    plan["day_progression"] = out


def _strip_color_in_phrases_from_day_progression(plan: Dict[str, Any], allowed_colors: Optional[List[str]]) -> None:
    dp = plan.get("day_progression")
    if not (isinstance(dp, list) and dp):
        return
    if not allowed_colors:
        return

    allowed = {_normalize_color_key(c) for c in allowed_colors if str(c).strip()}
    allowed_sorted = sorted(allowed, key=len, reverse=True)

    out: List[str] = []
    for line in dp:
        if not isinstance(line, str):
            out.append(line)
            continue

        fixed = line
        for col in allowed_sorted:
            pat = re.compile(rf"\s+in\s+{re.escape(col)}(\b)", re.IGNORECASE)
            fixed = pat.sub(" ", fixed)

        fixed = re.sub(r"\s+", " ", fixed).strip()
        out.append(fixed)

    plan["day_progression"] = out


def _strip_colors_from_day_progression(plan: Dict[str, Any]) -> None:
    """
    Remove color mentions from ALL day_progression lines (no exceptions).
    Handles:
      - "(green pumpkin blue)"
      - "in green pumpkin blue"
    """
    dp = plan.get("day_progression")
    if not (isinstance(dp, list) and dp):
        return

    for i in range(0, len(dp)):
        line = dp[i]
        if not isinstance(line, str) or not line.strip():
            continue

        line = re.sub(r"\s*[$begin:math:text$\\（\]\[\^\)\\）\]\{1\,40\}\[$end:math:text$\）]\s*", " ", line)

        line = re.sub(
            r"\s+\bin\b\s+[a-z0-9][a-z0-9 /_-]{1,40}(?=\s*(—|--|-|,|;|:|\.|\s))",
            " ",
            line,
            flags=re.IGNORECASE,
        )

        line = re.sub(r"\s+", " ", line).strip()
        dp[i] = line

    plan["day_progression"] = dp


def _normalize_lure_setups(plan: Dict[str, Any]) -> None:
    if not isinstance(plan, dict):
        return

    setups = plan.get("lure_setups")
    if not isinstance(setups, list):
        plan["lure_setups"] = []
        return

    featured = _canonical_featured_phrase(plan).strip() or "the featured bait"

    for i, item in enumerate(setups):
        if not isinstance(item, dict):
            continue

        nm = (item.get("name") or item.get("type") or item.get("lure") or "").strip()
        if not nm:
            nm = featured

        if not str(item.get("name") or "").strip():
            item["name"] = nm

        details = item.get("details")
        if details is None:
            item["details"] = {}
        elif isinstance(details, str):
            item["details"] = {"notes": details}
        elif not isinstance(details, dict):
            item["details"] = {"notes": str(details)}

        setups[i] = item

    plan["lure_setups"] = setups


def _ensure_min_lure_blocks(plan: Dict[str, Any]) -> None:
    if not isinstance(plan, dict):
        return

    featured = _canonical_featured_phrase(plan).strip() or "the featured bait"

    c = plan.get("conditions")
    if not isinstance(c, dict):
        plan["conditions"] = {}
        c = plan["conditions"]

    pls = c.get("primary_lure_spec")
    if not isinstance(pls, dict):
        colors = plan.get("color_recommendations") or []
        primary_color = str(colors[0]).strip().lower() if len(colors) > 0 and colors[0] else None
        secondary_color = str(colors[1]).strip().lower() if len(colors) > 1 and colors[1] else None

        c["primary_lure_spec"] = {
            "display_name": featured,
            "lure_family": _infer_rig_style(featured) or "lure",
            "rig_style": _infer_rig_style(featured) or None,
            "primary_color": primary_color,
            "secondary_color": secondary_color,
            "accent_color": None,
            "components": [],
        }

    setups = plan.get("lure_setups")
    if not isinstance(setups, list):
        setups = []
        plan["lure_setups"] = setups

    if len(setups) == 0:
        setups.append(
            {
                "name": featured,
                "details": {"notes": "Use the plan’s Targets + Work It guidance for execution."},
            }
        )


def _build_featured_phrase(plan: Dict[str, Any]) -> str:
    """
    The phrase that MUST appear in the Morning line.
    Prefer the primary_lure_spec.display_name when available (strongest canonical label),
    else fall back to featured_lure_name.
    """
    conditions = plan.get("conditions") if isinstance(plan, dict) else None
    if isinstance(conditions, dict):
        spec = conditions.get("primary_lure_spec")
        if isinstance(spec, dict):
            dn = str(spec.get("display_name") or "").strip()
            if dn:
                return dn

    featured = str(plan.get("featured_lure_name") or "").strip()
    if featured:
        return _canonical_featured_phrase(featured)

    return ""

def _force_morning_must_phrase(plan: Dict[str, Any]) -> None:
    """
    Enforce Morning line contains EXACTLY ONE '{featured}' (NO COLOR).
    Also ensures lure is immediately after "Morning:".
    """
    dp = plan.get("day_progression")
    if not (isinstance(dp, list) and dp and isinstance(dp[0], str)):
        return

    featured = _canonical_featured_phrase(plan).strip()
    if not featured:
        return

    must = _build_featured_phrase(plan).strip()
    if not must:
        return

    morning = dp[0].strip()

    # Remove any plain featured mentions (case-insensitive)
    pat_featured_plain = re.compile(re.escape(featured), re.IGNORECASE)
    morning = pat_featured_plain.sub("", morning).strip()

    # Remove stray parens tokens the model sprinkled
    morning = re.sub(r"\s*$begin:math:text$\[\^\)\]\*$end:math:text$\s*", " ", morning).strip()
    morning = re.sub(r"\s+", " ", morning).strip()

    # Ensure it starts with "Morning:"
    if not morning.lower().startswith("morning:"):
        morning = "Morning: " + morning

    prefix, _, rest = morning.partition(":")
    rest = rest.strip(" —-").strip()

    rebuilt = f"{prefix.strip()}: {must}"
    if rest:
        rebuilt += f" — {rest}"

    dp[0] = rebuilt
    plan["day_progression"] = dp


def _coerce_day_progression(value: Any) -> Optional[List[str]]:
    if isinstance(value, list) and all(isinstance(x, str) for x in value):
        return value

    if isinstance(value, str):
        lines = [ln.strip(" \t•-*") for ln in value.splitlines() if ln.strip()]
        picked = [ln for ln in lines if ln.lower().startswith(("morning:", "midday:", "late:"))]
        if len(picked) >= 3:
            return picked[:3]
        if len(lines) == 3:
            return lines
    return None


def _normalize_plan_response(obj: Any, *, allowed_colors: Optional[List[str]] = None) -> Any:
    if not isinstance(obj, dict):
        return obj

    if not isinstance(obj.get("rewritten"), bool):
        obj["rewritten"] = False

    if not isinstance(obj.get("timing"), dict):
        obj["timing"] = {}

    plan = obj.get("plan")
    if not isinstance(plan, dict):
        return obj

    # day_progression sync + coercion
    top_dp_raw = obj.get("day_progression")
    plan_dp_raw = plan.get("day_progression")

    top_dp = _coerce_day_progression(top_dp_raw)
    plan_dp = _coerce_day_progression(plan_dp_raw)

    if top_dp is None and plan_dp is not None:
        obj["day_progression"] = plan_dp
        top_dp = plan_dp

    if plan_dp is None and top_dp is not None:
        plan["day_progression"] = top_dp
        plan_dp = top_dp

    # Always mirror from plan after coercion
    obj["day_progression"] = list(plan.get("day_progression") or [])

    _normalize_colors(plan, allowed_colors)
    _strip_color_parens_from_day_progression(plan, allowed_colors)
    _strip_color_in_phrases_from_day_progression(plan, allowed_colors)

    # Ensure lure specs exist BEFORE we pick/clean featured name
    _ensure_primary_lure_spec_for_rigs(plan)
    _ensure_min_lure_blocks(plan)

    # --- featured lure normalization (authoritative-first) ---
    conditions = plan.get("conditions") if isinstance(plan, dict) else None
    primary_spec = None
    if isinstance(conditions, dict):
        primary_spec = conditions.get("primary_lure_spec")

    featured = ""
    if isinstance(primary_spec, dict):
        featured = str(primary_spec.get("display_name") or "").strip()

    if not featured:
        featured = str(plan.get("featured_lure_name") or "").strip()

    # Strip literal placeholder tokens the model may echo
    featured = featured.replace("(NO COLOR HERE)", "").strip()

    # Remove trailing "(color)" if present
    color0 = _safe_first_color(plan)
    if featured and color0:
        suffix = f"({str(color0).strip()})"
        if featured.endswith(suffix):
            featured = featured[: -len(suffix)].strip()

    plan["featured_lure_name"] = featured

    # DEDUPE: primary_technique should not equal featured_lure_name
    pt = str(plan.get("primary_technique") or "").strip()
    fn = str(plan.get("featured_lure_name") or "").strip()

    if pt and fn and _normalize_lure_key(pt) == _normalize_lure_key(fn):
        k = _normalize_lure_key(fn)
        if k.startswith("texas rig"):
            plan["primary_technique"] = "Bottom Contact (Texas Rig)"
        elif k.startswith("dropshot"):
            plan["primary_technique"] = "Vertical Finesse"
        elif "jerkbait" in k or "crankbait" in k or "chatterbait" in k or "spinnerbait" in k:
            plan["primary_technique"] = "Horizontal Moving"
        else:
            plan["primary_technique"] = "Primary Pattern"

    _normalize_lure_setups(plan)

    return obj


def _validate_plan_response_shape(obj: Dict[str, Any]) -> Tuple[bool, str]:
    if not isinstance(obj, dict):
        return False, "Root is not a JSON object"

    extra = set(obj.keys()) - PLAN_RESPONSE_KEYS
    if extra:
        return False, f"Extra top-level keys not allowed: {sorted(list(extra))}"

    missing = PLAN_RESPONSE_KEYS - set(obj.keys())
    if missing:
        return False, f"Missing top-level keys: {sorted(list(missing))}"

    if not isinstance(obj.get("geo"), dict):
        return False, "geo must be an object"

    if not isinstance(obj.get("plan"), dict):
        return False, "plan must be an object"

    if not isinstance(obj.get("day_progression"), list):
        return False, "day_progression must be a list"

    plan = obj["plan"]
    missing_plan = REQUIRED_PLAN_KEYS - set(plan.keys())
    if missing_plan:
        return False, f"Missing plan keys: {sorted(list(missing_plan))}"

    return True, "ok"


# apps/api/app/services/open_ai_plan_generator.py
# PATCH: make the “featured lure in Morning” check dash/whitespace tolerant,
# because the model will sometimes output "-" or "–" instead of "—".

def _norm_text(s: Any) -> str:
    t = str(s or "").strip().lower()
    t = t.replace("—", "-").replace("–", "-")
    t = re.sub(r"\s+", " ", t)
    return t


def _validate_featured_lure_in_morning(plan: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    expected = _build_featured_phrase(plan)
    if not expected:
        return True, None  # nothing to enforce

    dp = plan.get("day_progression") or []
    if not isinstance(dp, list) or not dp:
        return False, "Missing day_progression for featured-lure validation"

    morning = str(dp[0])
    count = _norm_text(morning).count(_norm_text(expected))

    if count != 1:
        return False, f"Morning line must contain '{expected}' exactly once (found {count})"

    return True, None

def _force_morning_must_phrase(plan: Dict[str, Any]) -> None:
    """
    Enforce Morning line contains EXACTLY ONE '{featured_display}' (NO color).
    """
    dp = plan.get("day_progression")
    if not (isinstance(dp, list) and dp and isinstance(dp[0], str)):
        return

    featured = _canonical_featured_phrase(plan).strip()
    if not featured:
        return

    must = _build_featured_phrase(plan).strip()
    if not must:
        return

    morning_raw = dp[0].strip()

    # Ensure it starts with "Morning:"
    if not morning_raw.lower().startswith("morning:"):
        morning_raw = "Morning: " + morning_raw

    prefix, _, rest = morning_raw.partition(":")
    rest = rest.strip()

    # Strip any existing featured mentions (dash tolerant) + any parenthetical right after it
    # e.g. "Chatterbait (green pumpkin)" -> ""
    feat_rx = re.compile(
        re.escape(_norm_text(featured)).replace("-", r"[-—–]") + r"(\s*\([^)]*\))?",
        re.IGNORECASE,
    )
    rest_norm = feat_rx.sub("", rest)
    rest_norm = re.sub(r"\s+", " ", rest_norm).strip(" —-").strip()

    rebuilt = f"{prefix.strip().title()}: {must}"
    if rest_norm:
        rebuilt += f" — {rest_norm}"

    dp[0] = rebuilt
    plan["day_progression"] = dp



def _validate_allowed_lures(plan: Dict[str, Any], allowed_lures: List[str]) -> Tuple[bool, str]:
    if not allowed_lures:
        return True, "skipped"

    allowed = {_normalize_lure_key(x) for x in allowed_lures if str(x).strip()}

    recs = plan.get("recommended_lures") or []
    for r in recs:
        key = _normalize_lure_key(r)
        if key not in allowed:
            return False, f"recommended_lure '{r}' not in allowed_lures"

    c = plan.get("conditions") or {}
    p2 = c.get("pattern_2") if isinstance(c, dict) else None
    if isinstance(p2, dict):
        p2_recs = p2.get("recommended_lures") or []
        for r in p2_recs:
            key = _normalize_lure_key(r)
            if key not in allowed:
                return False, f"pattern_2 recommended_lure '{r}' not in allowed_lures"

    return True, "ok"


def _clamp_day_progression_to_two_lures(plan: Dict[str, Any]) -> None:
    """
    Enforce: Day progression uses at most 2 lures total.
    - Lure #1: featured (Pattern 1)
    - Lure #2: Pattern 2 first recommended lure (if present)
    Also removes "or <lure>" forks + disallowed 'switch/transition' phrasing.
    """
    dp = plan.get("day_progression")
    if not (isinstance(dp, list) and len(dp) >= 3):
        return

    featured = _canonical_featured_phrase(plan).strip()
    if not featured:
        return

    c = plan.get("conditions") or {}
    p2 = c.get("pattern_2") if isinstance(c, dict) else None

    secondary: Optional[str] = None
    if isinstance(p2, dict):
        recs = p2.get("recommended_lures") or []
        if isinstance(recs, list) and recs:
            secondary = str(recs[0]).strip()
        elif p2.get("lure"):
            secondary = str(p2["lure"]).strip()

    # Normalize the two allowed lure strings for simple substring checks
    allowed1 = featured
    allowed2 = secondary

    forbidden = re.compile(r"\b(switch to|then switch|transition to|rotate to)\b", re.IGNORECASE)

    def _keep_only_one_lure_header(line: str, allow_secondary: bool) -> str:
        # Remove "or <...>" forks (common 3rd-bait injection)
        line = re.sub(r"\s+\bor\b\s+[A-Za-z0-9 \-—–()]{3,60}", "", line, flags=re.IGNORECASE)
        # Remove forbidden switch verbs (prompt says none)
        line = forbidden.sub("", line)
        # Cleanup spacing artifacts
        line = re.sub(r"\s+", " ", line).strip()
        return line

    # Midday/Late: allow either featured or secondary, but not both in one line.
    for i in (1, 2):
        line = dp[i]
        if not isinstance(line, str):
            continue

        line = _keep_only_one_lure_header(line, allow_secondary=bool(allowed2))

        # If both lure strings appear, keep only the first header lure and drop the rest.
        if allowed2 and (allowed1 in line) and (allowed2 in line):
            # Prefer keeping whatever appears immediately after the prefix
            # (we expect "Midday: <lure> — ...")
            prefix, _, rest = line.partition(":")
            rest = rest.strip()
            if rest.lower().startswith(allowed2.lower()):
                # Keep secondary, remove featured occurrences in rest
                rest = re.sub(re.escape(allowed1), "", rest, flags=re.IGNORECASE).strip()
            else:
                # Keep featured, remove secondary occurrences in rest
                rest = re.sub(re.escape(allowed2), "", rest, flags=re.IGNORECASE).strip()
            rest = re.sub(r"\s+", " ", rest).strip(" —-")
            line = f"{prefix.strip()}: {rest}"

        dp[i] = line

    plan["day_progression"] = dp


def _validate_allowed_colors(plan: Dict[str, Any], allowed_colors: List[str]) -> Tuple[bool, str]:
    if not allowed_colors:
        return True, "skipped"

    allowed = {_normalize_color_key(c) for c in allowed_colors if str(c).strip()}

    cols = plan.get("color_recommendations") or []
    for c in cols:
        picked = _pick_allowed_color(str(c), allowed)
        if not picked:
            return False, f"color '{c}' not in allowed_colors"

    return True, "ok"


# ------------------------------------------------------------
# Public API
# ------------------------------------------------------------
async def generate_plan_via_openai(
    *,
    geo: Dict[str, Any],
    weather_snapshot: Dict[str, Any],
    trip_date_iso: str,
    clarity: Optional[str] = None,
    bottom_composition: Optional[str] = None,
    depth_ft: Optional[float] = None,
    forage: Optional[List[str]] = None,
    allowed_lures: Optional[List[str]] = None,
    allowed_colors: Optional[List[str]] = None,
    is_preview: bool,
    subscriber_email: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Returns a FULL PlanResponse-shaped dict (geo + plan + markdown + day_progression + timing),
    or None to allow deterministic fallback.
    """
    if not llm_plan_enabled():
        return None

    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        print("OPENAI PLAN ERROR: Missing OPENAI_API_KEY")
        return None

    model = (os.getenv("OPENAI_MODEL") or "gpt-5-mini").strip() or "gpt-5-mini"

    inputs: Dict[str, Any] = {
        "geo": geo,
        "trip_date": trip_date_iso,
        "weather_snapshot": weather_snapshot,
        "hints": {
            "clarity": clarity,
            "bottom_composition": bottom_composition,
            "depth_ft": depth_ft,
            "forage": forage,
        },
        "allowed_lures": allowed_lures or [],
        "allowed_colors": allowed_colors or [],
        "flags": {
            "is_preview": bool(is_preview),
            "subscriber_email": subscriber_email,
        },
        "plan_schema_hint": {
            "plan": {
                "phase": "string",
                "depth_zone": "string",
                "recommended_lures": ["string", "string"],
                "recommended_targets": ["string", "..."],
                "strategy_tips": ["string", "..."],
                "color_recommendations": ["string", "string"],
                "lure_setups": ["object", "..."],
                "conditions": {"...": "...", "pattern_2": {"...": "..."}},
                "notes": "string",
                "primary_technique": "string",
                "featured_lure_name": "string  (NO COLOR HERE)",
                "featured_lure_family": "string",
                "pattern_summary": "string",
                "day_progression": ["Morning: ...", "Midday: ...", "Late: ..."],
            },
            "top_level": ["geo", "plan", "markdown", "rewritten", "day_progression", "timing"],
        },
    }

    body: Dict[str, Any] = {
        "model": model,
        "input": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(inputs, ensure_ascii=False)},
        ],
        "text": {"verbosity": "low"},
        "reasoning": {"effort": "minimal"},
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(OPENAI_API_URL, headers=headers, json=body)
            if r.status_code >= 400:
                print("OPENAI PLAN HTTP ERROR:", r.status_code)
                print("OPENAI PLAN BODY:", r.text[:2000])
                return None
            data = r.json()

        text_out = _extract_output_text(data)
        if not text_out:
            print("OPENAI PLAN ERROR: No output_text found. Keys:", list(data.keys()))
            return None

        raw = _strip_code_fences(text_out)
        obj = json.loads(raw)

        # Normalize common drift BEFORE validating
        obj = _normalize_plan_response(obj, allowed_colors=allowed_colors)

        ok, msg = _validate_plan_response_shape(obj)
        if not ok:
            print("OPENAI PLAN SHAPE INVALID:", msg)
            return None

        plan = obj["plan"]

        # Patch Morning line so strict validation can’t fail on formatting drift
        _force_morning_must_phrase(plan)

        if not _validate_featured_lure_in_morning(plan):
            must_phrase = _build_featured_phrase(plan)
            found = 0
            try:
                dp = plan.get("day_progression") or []
                if dp:
                    found = str(dp[0] or "").count(must_phrase) if must_phrase else 0
            except Exception:
                found = 0

            print(
                "OPENAI PLAN VALIDATION WARNING: Morning line must contain "
                f"{must_phrase!r} exactly once (found {found}). Continuing with forced fallback."
            )



        # Enforce at-most-2-lures behavior in DP
        _clamp_day_progression_to_two_lures(plan)

        # Remove colors from ALL day progression lines (per canon)
        _strip_colors_from_day_progression(plan)

        # Keep top-level DP aligned to plan DP (plan is canonical)
        if isinstance(obj.get("day_progression"), list):
            obj["day_progression"] = list(plan.get("day_progression") or [])

        ok, msg = _validate_featured_lure_in_morning(plan)
        if not ok:
            print("OPENAI PLAN VALIDATION FAILED:", msg)
            return None

        if allowed_lures:
            ok, msg = _validate_allowed_lures(plan, allowed_lures)
            if not ok:
                print("OPENAI PLAN VALIDATION FAILED:", msg)
                return None

        if allowed_colors:
            ok, msg = _validate_allowed_colors(plan, allowed_colors)
            if not ok:
                print("OPENAI PLAN VALIDATION FAILED:", msg)
                return None

        # Final safety: ensure types are FastAPI-friendly
        if not isinstance(obj.get("rewritten"), bool):
            obj["rewritten"] = False
        if not isinstance(obj.get("timing"), dict):
            obj["timing"] = {}

        return obj

    except Exception as e:
        print("OPENAI PLAN ERROR:", repr(e))
        return None