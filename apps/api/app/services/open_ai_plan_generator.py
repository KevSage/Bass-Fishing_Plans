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
    return os.getenv("LLM_PLAN", "").strip().lower() in ("1", "true", "yes", "on")


# ------------------------------------------------------------
# Canon pools + validators (LOCKED)
# ------------------------------------------------------------
from app.canon.pools import (
    COLOR_POOL,
    CANONICAL_TARGETS,
    LURE_POOL,
)

from app.canon.validate import (
    validate_colors,
    validate_colors_for_lure,
    validate_targets,
)


# ------------------------------------------------------------
# Prompt (LOCKED RULES)
# ------------------------------------------------------------
SYSTEM_PROMPT = """
You are BassFishingPlans (BFP), a paid on-demand bass fishing plan generator.

GOAL
Generate a highly-specific, weather-aware bass fishing plan for the user’s provided location and trip date.

IMPORTANT
- The plan must NOT be random.
- It must be generated using real bass fishing knowledge that considers season, location, and current conditions.
- You MUST choose ONLY from the provided canonical buckets (allowed lures / allowed colors / canonical targets).
- Do not invent anything outside those buckets.

OUTPUT FORMAT (STRICT)
Return ONE JSON object matching the PlanOnly schema provided.
Do not include any extra keys. Do not include markdown. Do not include geo. Do not include timing.

STYLE
- Crisp, practical, “do this next” tone.
- No hype, no jokes, no filler.
- No generic fishing encyclopedia content.
- Everything must be consistent with the provided inputs.

HARD RULES
1) Use the provided weather snapshot and location details. The plan must reflect temp/wind/sky/clarity/depth signals when present.
2) Never invent lakes, ramps, or named spots.
3) Never invent lures outside allowed_lures.
4) Colors must be chosen from allowed_colors only.
5) Targets must be chosen from canonical_targets only. 3–5 targets.
6) Pattern 2 (if included) must be meaningfully different from Pattern 1:
   - different fish positioning AND different presentation family.
7) Day progression is a 3-line timeline (Morning/Midday/Late) and must use at most 2 lures total:
   - Lure #1 = featured lure (Pattern 1).
   - Lure #2 = Pattern 2 lure if present.
   - Each line must explicitly name exactly ONE lure/rig near the start of the line.
   - Do NOT write “switch to / then switch / transition to / rotate to / or …”.
   - Do NOT include any color in Day Progression.
8) Outlook blurb (if present):
   - 1–2 sentences, max ~35 words
   - no lure names
   - no new numbers beyond the provided weather values
   - commentary only; must not change any decisions

VALIDATION CHECK BEFORE RETURNING JSON
- All lures are from allowed_lures.
- All colors are from allowed_colors.
- All targets are from canonical_targets.
- Day Progression has no colors and uses at most 2 lures.
""".strip()


# ------------------------------------------------------------
# Plan-only schema keys (LOCKED)
# ------------------------------------------------------------
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

OPTIONAL_PLAN_KEYS = {
    "outlook_blurb",  # optional (LLM constrained)
}


# ------------------------------------------------------------
# Helpers
# ------------------------------------------------------------
def _lower(s: Any) -> str:
    return str(s or "").strip().lower()


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


def _normalize_colors_in_plan(plan: Dict[str, Any], allowed_colors: Optional[List[str]]) -> None:
    """
    Force plan.color_recommendations into canonical allowed values.
    Clamps to allowed_colors (preferred).
    """
    cols = plan.get("color_recommendations")
    if not isinstance(cols, list) or not cols:
        return

    # flatten candidates
    candidates: List[str] = []
    for c in cols:
        if c is None:
            continue
        token = _normalize_color_key(c)
        if not token:
            continue
        # split a/b
        parts = [token] + ([p.strip() for p in token.split("/") if p.strip()] if "/" in token else [])
        for p in parts:
            if p and p not in candidates:
                candidates.append(p)

    if not candidates:
        return

    if allowed_colors:
        allowed = {_normalize_color_key(x) for x in allowed_colors if str(x).strip()}
        chosen: List[str] = []
        for cand in candidates:
            pick = _pick_allowed_color(cand, allowed)
            if pick and pick not in chosen:
                chosen.append(pick)
            if len(chosen) == 2:
                break
        if not chosen:
            # deterministic fallback to first allowed
            fallback = _normalize_color_key(allowed_colors[0]) if allowed_colors else ""
            chosen = [fallback] if fallback else []
        plan["color_recommendations"] = chosen[:2]
    else:
        # soft normalize only
        plan["color_recommendations"] = candidates[:2]


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

        # remove parenthetical tokens
        line = re.sub(r"\s*\([^)]{1,40}\)\s*", " ", line)

        # remove "in <color...>" phrases
        line = re.sub(
            r"\s+\bin\b\s+[a-z0-9][a-z0-9 /_-]{1,40}(?=\s*(—|--|-|,|;|:|\.|\s))",
            " ",
            line,
            flags=re.IGNORECASE,
        )

        line = re.sub(r"\s+", " ", line).strip()
        dp[i] = line

    plan["day_progression"] = dp


def _build_featured_phrase(plan: Dict[str, Any]) -> str:
    """
    Phrase that MUST appear in the Morning line.
    Prefer conditions.primary_lure_spec.display_name if present, else featured_lure_name.
    """
    c = plan.get("conditions")
    if isinstance(c, dict):
        pls = c.get("primary_lure_spec")
        if isinstance(pls, dict):
            dn = str(pls.get("display_name") or "").strip()
            if dn:
                return dn

    featured = str(plan.get("featured_lure_name") or "").strip()
    return featured


def _norm_text(s: Any) -> str:
    t = str(s or "").strip().lower()
    t = t.replace("—", "-").replace("–", "-")
    t = re.sub(r"\s+", " ", t)
    return t


def _validate_featured_lure_in_morning(plan: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    expected = _build_featured_phrase(plan).strip()
    if not expected:
        return True, None

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
    Also ensures lure is immediately after "Morning:".
    """
    dp = plan.get("day_progression")
    if not (isinstance(dp, list) and dp and isinstance(dp[0], str)):
        return

    must = _build_featured_phrase(plan).strip()
    if not must:
        return

    morning_raw = dp[0].strip()

    if not morning_raw.lower().startswith("morning:"):
        morning_raw = "Morning: " + morning_raw

    prefix, _, rest = morning_raw.partition(":")
    rest = rest.strip()

    # strip any existing must phrase (dash tolerant) + optional parenthetical right after
    must_rx = re.compile(
        re.escape(_norm_text(must)).replace("-", r"[-—–]") + r"(\s*\([^)]*\))?",
        re.IGNORECASE,
    )
    rest2 = must_rx.sub("", rest)
    rest2 = re.sub(r"\s+", " ", rest2).strip(" —-").strip()

    rebuilt = f"{prefix.strip().title()}: {must}"
    if rest2:
        rebuilt += f" — {rest2}"

    dp[0] = rebuilt
    plan["day_progression"] = dp


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

    featured_phrase = _build_featured_phrase(plan).strip()
    if not featured_phrase:
        return

    # pattern_2 lure (optional)
    secondary: Optional[str] = None
    c = plan.get("conditions") or {}
    p2 = c.get("pattern_2") if isinstance(c, dict) else None
    if isinstance(p2, dict):
        recs = p2.get("recommended_lures") or []
        if isinstance(recs, list) and recs:
            secondary = str(recs[0]).strip()
        elif p2.get("lure"):
            secondary = str(p2["lure"]).strip()

    forbidden = re.compile(r"\b(switch to|then switch|transition to|rotate to)\b", re.IGNORECASE)

    def cleanup(line: str) -> str:
        line = re.sub(r"\s+\bor\b\s+[A-Za-z0-9 \-—–()]{3,60}", "", line, flags=re.IGNORECASE)
        line = forbidden.sub("", line)
        line = re.sub(r"\s+", " ", line).strip()
        return line

    for i in (1, 2):
        line = dp[i]
        if not isinstance(line, str):
            continue
        dp[i] = cleanup(line)

    plan["day_progression"] = dp


def _validate_plan_only_shape(plan: Any) -> Tuple[bool, str]:
    if not isinstance(plan, dict):
        return False, "Root is not a plan object"

    extra = set(plan.keys()) - (REQUIRED_PLAN_KEYS | OPTIONAL_PLAN_KEYS)
    if extra:
        return False, f"Extra plan keys not allowed: {sorted(list(extra))}"

    missing = REQUIRED_PLAN_KEYS - set(plan.keys())
    if missing:
        return False, f"Missing plan keys: {sorted(list(missing))}"

    if not isinstance(plan.get("conditions"), dict):
        return False, "conditions must be an object"

    if not isinstance(plan.get("recommended_lures"), list):
        return False, "recommended_lures must be a list"

    if not isinstance(plan.get("recommended_targets"), list):
        return False, "recommended_targets must be a list"

    if not isinstance(plan.get("day_progression"), list):
        return False, "day_progression must be a list"

    return True, "ok"


def _validate_allowed_lures(plan: Dict[str, Any], allowed_lures: List[str]) -> Tuple[bool, str]:
    if not allowed_lures:
        return True, "skipped"

    allowed = set(allowed_lures)

    recs = plan.get("recommended_lures") or []
    for r in recs:
        if r not in allowed:
            return False, f"recommended_lure '{r}' not in allowed_lures"

    c = plan.get("conditions") or {}
    p2 = c.get("pattern_2") if isinstance(c, dict) else None
    if isinstance(p2, dict):
        p2_recs = p2.get("recommended_lures") or []
        for r in p2_recs:
            if r not in allowed:
                return False, f"pattern_2 recommended_lure '{r}' not in allowed_lures"

    return True, "ok"


def _validate_allowed_colors(plan: Dict[str, Any], allowed_colors: List[str]) -> Tuple[bool, str]:
    if not allowed_colors:
        return True, "skipped"

    allowed = {_normalize_color_key(c) for c in allowed_colors if str(c).strip()}

    cols = plan.get("color_recommendations") or []
    for c in cols:
        picked = _pick_allowed_color(str(c), allowed)
        if not picked:
            return False, f"color '{c}' not in allowed_colors"

    # also enforce lure-specific color rules
    # (we validate against the *base lure* = first recommended lure when present)
    base_lure = None
    recs = plan.get("recommended_lures") or []
    if isinstance(recs, list) and recs:
        base_lure = str(recs[0]).strip()

    if base_lure:
        errs = validate_colors_for_lure(base_lure, [str(x) for x in cols if x is not None])
        if errs:
            return False, "; ".join(errs)

    return True, "ok"


def _validate_allowed_targets(plan: Dict[str, Any]) -> Tuple[bool, str]:
    targets = plan.get("recommended_targets") or []
    errs = validate_targets(targets)
    if errs:
        return False, "; ".join(errs)
    return True, "ok"


def _normalize_plan(plan: Dict[str, Any], *, allowed_colors: Optional[List[str]] = None) -> Dict[str, Any]:
    # normalize colors
    _normalize_colors_in_plan(plan, allowed_colors)

    # enforce no colors in DP
    _strip_colors_from_day_progression(plan)

    # enforce Morning lure phrase (format drift resistant)
    _force_morning_must_phrase(plan)

    # DP clamp: at most 2 lures and no switch language
    _clamp_day_progression_to_two_lures(plan)

    # strip colors again (in case force/clamp reintroduced tokens)
    _strip_colors_from_day_progression(plan)

    return plan


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
    canonical_targets: Optional[List[str]] = None,
    is_preview: bool,
    subscriber_email: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Returns ONLY the plan dict (plan.plan) or None to allow deterministic fallback.

    Deterministic pieces (geo, markdown, timing) stay outside this function.
    """
    if not llm_plan_enabled():
        return None

    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        print("OPENAI PLAN ERROR: Missing OPENAI_API_KEY")
        return None

    model = (os.getenv("OPENAI_MODEL") or "gpt-5-mini").strip() or "gpt-5-mini"

    # defaults to canonical pools if caller didn’t pass lists
    allowed_lures = allowed_lures or list(LURE_POOL)
    allowed_colors = allowed_colors or list(COLOR_POOL)
    canonical_targets = canonical_targets or list(CANONICAL_TARGETS)

    inputs: Dict[str, Any] = {
        "geo": {
            "name": geo.get("name"),
            "lat": geo.get("lat"),
            "lon": geo.get("lon"),
            "lake_name": geo.get("lake_name"),
        },
        "trip_date": trip_date_iso,
        "weather_snapshot": weather_snapshot,
        "hints": {
            "clarity": clarity,
            "bottom_composition": bottom_composition,
            "depth_ft": depth_ft,
            "forage": forage,
        },
        "allowed_lures": allowed_lures,
        "allowed_colors": allowed_colors,
        "canonical_targets": canonical_targets,
        "flags": {
            "is_preview": bool(is_preview),
            "subscriber_email": subscriber_email,
        },
        "plan_schema_hint": {
            "phase": "string",
            "depth_zone": "string",
            "recommended_lures": ["string", "string"],
            "recommended_targets": ["string", "..."],  # MUST be from canonical_targets, 3-5
            "strategy_tips": ["string", "..."],
            "color_recommendations": ["string", "string"],  # MUST be from allowed_colors
            "lure_setups": ["object", "..."],
            "conditions": {"...": "...", "pattern_2": {"...": "..."}},
            "notes": "string",
            "primary_technique": "string",
            "featured_lure_name": "string (NO COLOR HERE)",
            "featured_lure_family": "string",
            "pattern_summary": "string",
            "day_progression": ["Morning: ...", "Midday: ...", "Late: ..."],
            "outlook_blurb": "(optional) string",
        },
        "output_contract": "Return ONLY the plan object. No extra wrapper keys.",
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
        plan = json.loads(raw)

        # Normalize BEFORE validating
        if not isinstance(plan, dict):
            print("OPENAI PLAN ERROR: output is not an object")
            return None

        plan = _normalize_plan(plan, allowed_colors=allowed_colors)

        ok, msg = _validate_plan_only_shape(plan)
        if not ok:
            print("OPENAI PLAN SHAPE INVALID:", msg)
            return None

        # Validate lures
        ok, msg = _validate_allowed_lures(plan, allowed_lures)
        if not ok:
            print("OPENAI PLAN VALIDATION FAILED:", msg)
            return None

        # Validate targets
        ok, msg = _validate_allowed_targets(plan)
        if not ok:
            print("OPENAI PLAN VALIDATION FAILED:", msg)
            return None

        # Validate colors + lure-specific restrictions
        ok, msg = _validate_allowed_colors(plan, allowed_colors)
        if not ok:
            print("OPENAI PLAN VALIDATION FAILED:", msg)
            return None

        # Validate DP Morning lure phrase (post-force)
        ok, msg = _validate_featured_lure_in_morning(plan)
        if not ok:
            print("OPENAI PLAN VALIDATION FAILED:", msg)
            return None

        # Final safety: keep types stable
        if not isinstance(plan.get("color_recommendations"), list):
            plan["color_recommendations"] = []
        if not isinstance(plan.get("recommended_targets"), list):
            plan["recommended_targets"] = []
        if not isinstance(plan.get("day_progression"), list):
            plan["day_progression"] = []

        return plan

    except Exception as e:
        print("OPENAI PLAN ERROR:", repr(e))
        return None