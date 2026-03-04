# app/services/llm_plan_service.py

"""
LLM Plan Generator with Strict Guardrails
100% LLM-driven, but ONLY chooses from canonical pools.

Bass Clarity updates (LOCKED):
- ALWAYS dump pools into the system prompt (deterministic selection from canonical lists)
- ALWAYS return primary + secondary for member plans
- NO dynamic lure color zones / NO expand_color_zones / NO "colors: {primary_color,...}" payloads
- Color recommendations are ONLY simple strings from the lure-specific color pools in pools.py
- Never state what bass ARE doing; suggest what they MAY be doing
"""
from __future__ import annotations

import os
import json
import time
import random
import asyncio
from typing import Any, Dict, List, Optional, Tuple

import httpx

from app.canon.pools import (
    # core pools
    LURE_POOL,
    PRESENTATIONS,
    LURE_TO_PRESENTATION,
    # terminal + trailer pools
    TERMINAL_PLASTIC_MAP,
    TRAILER_REQUIREMENT,
    TRAILER_BUCKET_BY_LURE,
    CHATTER_SWIMJIG_TRAILERS,
    SPINNER_BUZZ_TRAILERS,
    JIG_TRAILERS,
    # lure-specific color pools (ONLY colors allowed)
    get_color_pool_for_lure,
    get_fallback_color,
    RIG_COLORS,
    BLADED_SKIRTED_COLORS,
    SOFT_SWIMBAIT_COLORS,
    CRANKBAIT_COLORS,
    JERKBAIT_COLORS,
    TOPWATER_COLORS,
    FROG_COLORS,
    LURE_COLOR_POOL_MAP,
    expand_color_zones,
)
from app.canon.target_definitions import (
    TARGET_DEFINITIONS,           # For system prompt dump
    filter_targets_by_access,     # For access filtering
)
from app.canon.validate import (
    validate_lure_and_presentation,
    validate_colors_for_lure,
)
from app.canon.retrieve_rules import LURE_TIP_BANK

from app.canon.lure_selection_policy import LURE_SELECTION_POLICY_PROMPT


# -----------------------------------------------------------------------------
# Presentation family helpers (V1)
#
# Bass Clarity rule: primary + secondary must come from DIFFERENT presentation
# families (not just different presentation strings).
#
# Families:
#   - Bottom Contact: Dragging / Hopping
#   - Topwater: Horizontal / Precision
#   - Otherwise: the presentation itself (Horizontal Reaction, Vertical Reaction,
#     Hovering / Mid-Column Finesse)
# -----------------------------------------------------------------------------


def _presentation_family(presentation: Any) -> str:
    p = str(presentation or "").strip()
    if p.startswith("Bottom Contact"):
        return "Bottom Contact"
    if p.startswith("Topwater"):
        return "Topwater"
    return p

# -----------------------------------------------------------------------------
# Seasonal policy integration (V1, non-breaking)
#
# Goals:
# - Provide the LLM explicit phase-specific lure constraints (strong/conditional/avoid).
# - Optionally preselect 3 targets deterministically, with a diversity constraint
#   on TARGET_DEFINITIONS[*].get('strategic_category').
#
# Safety:
# - If seasonal policy modules are missing or malformed, we fall back to legacy
#   behavior (no extra constraints) so plan generation never hard-fails.
# -----------------------------------------------------------------------------

def _load_seasonal_policy(phase: str) -> Dict[str, Any]:
    """Best-effort loader for /app/canon/seasonal_policies/<phase>.py.

    Expected shape (see winter.py style):
      WINTER_SEASON = {"lure_rankings": {"strong": [...], "conditional": [...], "avoid": [...]}, ...}

    Returns a dict with keys: strong, conditional, avoid, raw (original object).
    Never raises.
    """
    phase_key = (phase or "").strip().lower()
    # Normalize legacy naming
    if phase_key in ("pre_spawn", "pre-spawn", "pre spawn"):
        phase_key = "prespawn"
    if phase_key in ("post_spawn", "post-spawn", "post spawn"):
        phase_key = "postspawn"

    module_name_map = {
        "winter": "app.canon.seasonal_policies.winter",
        "prespawn": "app.canon.seasonal_policies.prespawn",
        "spawn": "app.canon.seasonal_policies.spawn",
        "postspawn": "app.canon.seasonal_policies.postspawn",
        "summer": "app.canon.seasonal_policies.summer",
        "fall": "app.canon.seasonal_policies.fall",
    }

    mod_name = module_name_map.get(phase_key)
    if not mod_name:
        return {"strong": [], "conditional": [], "avoid": [], "raw": None, "phase": phase_key}

    try:
        import importlib

        mod = importlib.import_module(mod_name)
        # Common constants by file
        season_obj = getattr(mod, "WINTER_SEASON", None) or getattr(mod, "PRESPAWN_SEASON", None) \
            or getattr(mod, "SPAWN_SEASON", None) or getattr(mod, "POSTSPAWN_SEASON", None) \
            or getattr(mod, "SEASON", None)

        if not isinstance(season_obj, dict):
            # Fallback to WINTER_SEASON style in modules created in this chat
            season_obj = getattr(mod, "WINTER_SEASON", None)
        if not isinstance(season_obj, dict):
            return {"strong": [], "conditional": [], "avoid": [], "raw": None, "phase": phase_key}

        lure_rankings = season_obj.get("lure_rankings", {}) if isinstance(season_obj, dict) else {}
        strong = lure_rankings.get("strong", []) if isinstance(lure_rankings, dict) else []
        conditional = lure_rankings.get("conditional", []) if isinstance(lure_rankings, dict) else []
        avoid = lure_rankings.get("avoid", []) if isinstance(lure_rankings, dict) else []

        # Ensure list[str] and stable ordering
        def _as_list(v: Any) -> List[str]:
            if v is None:
                return []
            if isinstance(v, (list, tuple)):
                return [str(x) for x in v]
            return [str(v)]

        return {
            "phase": phase_key,
            "strong": _as_list(strong),
            "conditional": _as_list(conditional),
            "avoid": _as_list(avoid),
            "raw": season_obj,
        }
    except Exception:
        return {"strong": [], "conditional": [], "avoid": [], "raw": None, "phase": phase_key}


def _determine_active_temp_band(
    raw_policy: Optional[Dict[str, Any]],
    estimated_water_temp_f: Optional[float],
) -> Optional[Dict[str, Any]]:
    """Determine which temp_band applies based on estimated water temperature.

    Uses estimated_water_temp_f (calculated from 5-day air temp history in weather service).
    Returns the matching temp_band dict with its key, or None if no match.
    """
    if not raw_policy or not isinstance(raw_policy, dict):
        return None

    temp_bands = raw_policy.get("temp_bands")
    if not temp_bands or not isinstance(temp_bands, dict):
        return None

    if estimated_water_temp_f is None:
        return None

    # Find matching band using backend-calculated water temp
    for band_key, band_data in temp_bands.items():
        if not isinstance(band_data, dict):
            continue
        temp_range = band_data.get("range")
        if not temp_range or len(temp_range) != 2:
            continue
        low, high = temp_range
        if low <= estimated_water_temp_f <= high:
            return {"band_key": band_key, **band_data}

    return None


def _extract_active_condition_modifiers(
    raw_policy: Optional[Dict[str, Any]],
    weather: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Extract condition_modifiers that apply based on current weather.

    Returns a list of active modifier dicts with their keys.
    """
    if not raw_policy or not isinstance(raw_policy, dict):
        return []

    condition_modifiers = raw_policy.get("condition_modifiers")
    if not condition_modifiers or not isinstance(condition_modifiers, dict):
        return []

    active = []

    # Extract weather signals
    wind_mph = weather.get("wind_mph") or weather.get("wind_speed") or 0
    try:
        wind_mph = float(wind_mph)
    except (ValueError, TypeError):
        wind_mph = 0

    cloud_cover = weather.get("cloud_cover") or weather.get("sky_condition") or ""
    pressure_trend = str(weather.get("pressure_trend") or "").lower()
    temp_high = weather.get("temp_high")
    temp_low = weather.get("temp_low")

    # Determine if warm_trend (high above 60°F and rising from low)
    warm_trend = False
    if temp_high is not None and temp_low is not None:
        try:
            warm_trend = float(temp_high) >= 60 and (float(temp_high) - float(temp_low)) >= 10
        except (ValueError, TypeError):
            pass

    # Check each modifier
    for mod_key, mod_data in condition_modifiers.items():
        if not isinstance(mod_data, dict):
            continue

        applies = False

        if mod_key == "warm_trend" and warm_trend:
            applies = True
        elif mod_key == "wind" and wind_mph >= 10:
            applies = True
        elif mod_key == "cold_stable" and not warm_trend and wind_mph < 10:
            applies = True
        elif mod_key == "sunny_high_pressure" and "rising" in pressure_trend:
            applies = True
        elif mod_key == "overcast" and any(x in str(cloud_cover).lower() for x in ["overcast", "cloudy", "cloud"]):
            applies = True
        elif mod_key == "falling_pressure" and "falling" in pressure_trend:
            applies = True
        elif mod_key == "rising_pressure" and "rising" in pressure_trend:
            applies = True

        if applies:
            active.append({"modifier_key": mod_key, **mod_data})

    return active


def _get_target_meta(name: str) -> Dict[str, Any]:
    """Safe lookup for TARGET_DEFINITIONS[name], returning dict with defaults."""
    meta = TARGET_DEFINITIONS.get(name, {}) if isinstance(TARGET_DEFINITIONS, dict) else {}
    if not isinstance(meta, dict):
        meta = {}
    return meta


def _select_diverse_targets(
    *,
    accessible_targets: List[str],
    phase: str,
    access_type: str,
    weather: Dict[str, Any],
    k: int = 3,
) -> List[str]:
    """Deterministically pick k targets with strategic_category diversity.

    Never raises; if metadata is missing, falls back to first k alphabetical.
    """
    targets = [t for t in (accessible_targets or []) if isinstance(t, str)]
    targets = sorted(set(targets))
    if not targets:
        return []

    # Phase → category bias (light-touch, safe defaults)
    phase_key = (phase or "").strip().lower()
    if phase_key in ("pre_spawn", "pre-spawn", "pre spawn"):
        phase_key = "prespawn"
    if phase_key in ("post_spawn", "post-spawn", "post spawn"):
        phase_key = "postspawn"

    category_priority_by_phase: Dict[str, List[str]] = {
        "winter": ["deep_structure", "transitions", "precision_shade", "ambush_cover", "aggressive_zones"],
        "prespawn": ["transitions", "aggressive_zones", "ambush_cover", "deep_structure", "precision_shade"],
        "spawn": ["precision_shade", "ambush_cover", "transitions", "aggressive_zones", "deep_structure"],
        "postspawn": ["ambush_cover", "aggressive_zones", "transitions", "precision_shade", "deep_structure"],
        "summer": ["deep_structure", "transitions", "ambush_cover", "precision_shade", "aggressive_zones"],
        "fall": ["aggressive_zones", "ambush_cover", "transitions", "precision_shade", "deep_structure"],
    }
    category_priority = category_priority_by_phase.get(phase_key, [
        "transitions", "ambush_cover", "aggressive_zones", "precision_shade", "deep_structure"
    ])
    category_rank = {c: i for i, c in enumerate(category_priority)}

    # Simple condition flags (optional; do not overfit)
    wind_mph = weather.get("wind_mph") or weather.get("wind_speed")
    try:
        wind_val = float(wind_mph) if wind_mph is not None else 0.0
    except Exception:
        wind_val = 0.0
    is_windy = wind_val >= 10.0
    is_calm = wind_val <= 5.0

    # Score targets
    scored: List[Tuple[Tuple[int, int, str], str]] = []
    for t in targets:
        meta = _get_target_meta(t)
        cat = str(meta.get("strategic_category") or "")
        # Unknown categories go to the back
        cat_idx = category_rank.get(cat, 999)

        # Boat: prefer at least one non-bank_friendly (often offshore) if available
        bank_friendly = bool(meta.get("bank_friendly", False))
        boat_bonus = 0
        if access_type == "boat" and not bank_friendly:
            boat_bonus = -1

        # Wind bias: slight preference for aggressive_zones on windy days, precision_shade on calm
        wind_bias = 0
        if is_windy and cat == "aggressive_zones":
            wind_bias = -1
        if is_calm and cat == "precision_shade":
            wind_bias = -1

        key = (cat_idx + wind_bias, boat_bonus, t)
        scored.append((key, t))

    scored.sort(key=lambda x: x[0])

    # Select with category diversity
    picked: List[str] = []
    used_cats: set[str] = set()
    for _, t in scored:
        meta = _get_target_meta(t)
        cat = str(meta.get("strategic_category") or "")
        if cat and cat in used_cats:
            continue
        if access_type == "bank":
            # Bank plans should prioritize bank-friendly targets, but don't hard-fail.
            if not bool(meta.get("bank_friendly", False)) and any(
                bool(_get_target_meta(t2).get("bank_friendly", False)) for _, t2 in scored[:5]
            ):
                continue

        picked.append(t)
        if cat:
            used_cats.add(cat)
        if len(picked) >= k:
            break

    # If we couldn't fill k with unique cats, fill remaining in score order
    if len(picked) < k:
        for _, t in scored:
            if t in picked:
                continue
            picked.append(t)
            if len(picked) >= k:
                break

    return picked[:k]


def _validate_policy_constraints(
    plan: Dict[str, Any],
    seasonal_policy: Dict[str, Any],
    primary_targets: Optional[List[str]] = None,
    secondary_targets: Optional[List[str]] = None,
    user_primary_lure: Optional[str] = None,
    user_secondary_lure: Optional[str] = None,
) -> List[str]:
    """Extra validation layered on top of validate_llm_plan.

    Returns list of human-readable errors. Never raises.

    When user_primary_lure or user_secondary_lure is provided, seasonal policy
    validation is skipped for that lure (user choice overrides seasonal constraints).
    """
    errors: List[str] = []
    if not isinstance(plan, dict):
        return ["Plan is not a dict"]

    strong = set(seasonal_policy.get("strong") or [])
    conditional = set(seasonal_policy.get("conditional") or [])
    avoid = set(seasonal_policy.get("avoid") or [])
    allowed = strong | conditional

    def _check_pattern(obj: Dict[str, Any], label: str) -> None:
        if not isinstance(obj, dict):
            return
        lure = obj.get("base_lure")

        # Skip seasonal validation if user explicitly selected this lure
        user_selected_lure = user_primary_lure if label == "primary" else user_secondary_lure
        if user_selected_lure and isinstance(lure, str):
            # User chose this lure - skip seasonal policy check entirely
            # (We trust the user knows what they want)
            pass
        elif allowed and isinstance(lure, str):
            if lure in avoid:
                errors.append(f"{label}.base_lure '{lure}' is in seasonal AVOID list")
            elif lure not in allowed:
                errors.append(f"{label}.base_lure '{lure}' is not in seasonal STRONG/CONDITIONAL lists")
        # Target locking (only when we pre-split targets)
        expected_targets: Optional[List[str]] = None
        if label == "primary":
            expected_targets = primary_targets
        elif label == "secondary":
            expected_targets = secondary_targets
        else:
            # root/non-member plans: if a target set was provided, use primary_targets as the expected set
            expected_targets = primary_targets

        if expected_targets:
            tlist = obj.get("targets")
            if isinstance(tlist, list):
                # Require targets to be exactly the expected set (order-insensitive)
                try:
                    got = [str(x) for x in tlist]
                except Exception:
                    got = []
                if set(got) != set(expected_targets):
                    errors.append(
                        f"{label}.targets must match expected targets exactly. expected={expected_targets} got={got}"
                    )

    # Member plans have primary/secondary
    if isinstance(plan.get("primary"), dict) or isinstance(plan.get("secondary"), dict):
        _check_pattern(plan.get("primary", {}), "primary")
        _check_pattern(plan.get("secondary", {}), "secondary")
    else:
        _check_pattern(plan, "root")

    return errors


# ----------------------------------------
# Debug + deterministic color coercion (shape-safe)
# ----------------------------------------

def _log_color_intent(stage: str, plan: Dict[str, Any]) -> None:
    """Lightweight debug log for lure + 2-color selection behavior."""
    try:
        if not isinstance(plan, dict):
            return
        p = plan.get("primary", {}) if isinstance(plan.get("primary", {}), dict) else {}
        s = plan.get("secondary", {}) if isinstance(plan.get("secondary", {}), dict) else {}
        # Non-member plans may not have primary/secondary
        if not p and not s:
            # fall back to root shape
            lure = plan.get("base_lure")
            cols = plan.get("color_recommendations")
            print(f"LLM_PLAN [{stage}] lure={lure} colors={cols}")
            return

        print(
            f"LLM_PLAN [{stage}] "
            f"primary_lure={p.get('base_lure')} primary_colors={p.get('color_recommendations')} | "
            f"secondary_lure={s.get('base_lure')} secondary_colors={s.get('color_recommendations')}"
        )
    except Exception:
        pass


def _normalize_color_token(s: str) -> str:
    return (
        str(s or "")
        .strip()
        .lower()
        .replace("—", "-")
        .replace("–", "-")
    )


def _coerce_two_colors_to_pool(
    lure: Optional[str],
    soft_plastic: Optional[str],
    colors: Any,
) -> Tuple[List[str], bool, List[str]]:
    """
    Ensure exactly 2 color tokens and that both are from the correct lure-specific pool.
    Returns: (final_colors, changed, reasons)
    """
    reasons: List[str] = []
    if not lure:
        return ["", ""], False, ["missing_lure"]

    try:
        allowed = list(get_color_pool_for_lure(lure, soft_plastic))
    except Exception:
        allowed = []

    if not allowed:
        # No pool => leave as-is (validator should catch if needed)
        base = colors if isinstance(colors, list) else []
        base2 = [str(x) for x in base[:2]]
        if len(base2) == 1:
            base2 = [base2[0], base2[0]]
        if len(base2) == 0:
            base2 = ["", ""]
        return base2, False, ["empty_allowed_pool"]

    # Normalize allowed lookup
    allowed_norm = {_normalize_color_token(a): a for a in allowed}

    raw = colors if isinstance(colors, list) else []
    raw2 = [str(x) for x in raw[:2]]

    coerced: List[str] = []
    changed = False

    for c in raw2:
        if c in allowed:
            coerced.append(c)
            continue

        cn = _normalize_color_token(c)

        # direct normalized match
        if cn in allowed_norm:
            coerced.append(allowed_norm[cn])
            changed = True
            reasons.append(f"norm:{c}->{allowed_norm[cn]}")
            continue

        # slash reorder match (treat a/b and b/a as equivalent)
        if "/" in cn:
            parts = [p.strip() for p in cn.split("/") if p.strip()]
            parts_set = set(parts)
            found = None
            for a in allowed:
                an = _normalize_color_token(a)
                if "/" in an:
                    aparts = [p.strip() for p in an.split("/") if p.strip()]
                    if set(aparts) == parts_set:
                        found = a
                        break
            if found:
                coerced.append(found)
                changed = True
                reasons.append(f"swap:{c}->{found}")
                continue

        # intent-preserving snap: dark / high-vis / natural
        intent = "natural"
        if any(k in cn for k in ["black", "blue", "junebug"]):
            intent = "dark"
        elif any(k in cn for k in ["chartreuse", "fire", "tiger"]):
            intent = "high_vis"

        fallback = None
        if intent == "dark":
            for a in allowed:
                an = _normalize_color_token(a)
                if "black" in an or "junebug" in an:
                    fallback = a
                    break
        elif intent == "high_vis":
            for a in allowed:
                an = _normalize_color_token(a)
                if "chartreuse" in an or "fire" in an or "tiger" in an:
                    fallback = a
                    break
        else:
            for a in allowed:
                an = _normalize_color_token(a)
                if any(k in an for k in ["ghost", "sexy shad", "shad", "natural", "baby bass", "watermelon", "green pumpkin", "bluegill", "brown"]):
                    fallback = a
                    break

        if fallback is None:
            fallback = allowed[0]

        coerced.append(fallback)
        changed = True
        reasons.append(f"snap:{c}->{fallback}")

    # If we didn't get 2, deterministically fill using heuristic buckets
    if len(coerced) != 2:
        changed = True
        reasons.append("fallback_fill")
        # buckets
        natural_kw = {"green pumpkin", "watermelon", "baby bass", "ghost", "sexy shad", "shad", "white", "pearl", "bluegill", "brown"}
        highvis_kw = {"chartreuse", "black", "black/blue", "junebug", "fire", "red craw", "peanut butter", "green pumpkin orange"}

        def score(token: str, kws: set) -> int:
            tn = _normalize_color_token(token)
            return sum(1 for k in kws if k in tn)

        a = max(allowed, key=lambda t: (score(t, natural_kw), -allowed.index(t)))
        b = max(allowed, key=lambda t: (score(t, highvis_kw), -allowed.index(t)))
        if a == b:
            for cand in allowed:
                if cand != a:
                    b = cand
                    break
        coerced = [a, b]

    # Ensure exactly two strings (never None)
    coerced = [str(coerced[0]), str(coerced[1])]

    return coerced, changed, reasons


# ----------------------------------------
# System Prompt (LOCKED RULES) — Bass Clarity
# ----------------------------------------
def build_system_prompt(include_pattern_2: bool = False) -> str:
    """
    Bass Clarity system prompt:
    - strict JSON
    - canonical pools dumped into prompt (deterministic selection)
    - Members return primary + secondary (complement/pivot)
    - NO dynamic lure color zones; colors are simple strings from pools only
    """

    # ---------- deterministic, set-safe JSON dumping ----------
    def _json_default(o: Any):
        # sets appear in canon pools; convert deterministically
        if isinstance(o, set):
            return sorted(list(o))
        # tuples also appear sometimes
        if isinstance(o, tuple):
            return list(o)
        return str(o)

    def jdump(obj: Any) -> str:
        return json.dumps(
            obj,
            ensure_ascii=False,
            separators=(",", ":"),
            default=_json_default,
            sort_keys=True,
        )

    # ---------- terminal plastics (human-readable list) ----------
    terminal_rules: List[str] = []
    for lure, plastics in TERMINAL_PLASTIC_MAP.items():
        # plastics may be set; sort for stable prompt output
        terminal_rules.append(f"- {lure}: {sorted(list(plastics))}")

    # ---------- trailer rules (human-readable list) ----------
    required_trailer_lures = sorted([k for k, v in TRAILER_REQUIREMENT.items() if v == "required"])
    optional_trailer_lures = sorted([k for k, v in TRAILER_REQUIREMENT.items() if v == "optional"])

    trailer_rules = [
        "TRAILER REQUIREMENT (MUST FOLLOW):",
        f"- REQUIRED base_lure values (MUST include trailer + trailer_why): {required_trailer_lures}",
        f"- OPTIONAL base_lure values (may include trailer + trailer_why; if omitted, omit both keys): {optional_trailer_lures}",
        "",
        "ALLOWED TRAILERS (if trailer is included, MUST be from the allowed list for that base_lure):",
        f"- chatterbait, swim jig: {sorted(list(CHATTER_SWIMJIG_TRAILERS))}",
        f"- casting jig, football jig: {sorted(list(JIG_TRAILERS))}",
        f"- spinnerbait, buzzbait: {sorted(list(SPINNER_BUZZ_TRAILERS))}",
        "",
        "STRICT RULES:",
        "- If base_lure requires a trailer, you MUST include both keys trailer and trailer_why (do not omit; do not set null).",
        "- If base_lure is terminal or has no trailer, you MUST OMIT trailer and trailer_why keys entirely.",
        "- Chunk trailer is only valid for casting jig or football jig.",
    ]

    # ---------- output format ----------
    if include_pattern_2:
        output_format = r"""
RETURN JSON ONLY:
{
  "primary":{
    "presentation":"<from PRESENTATIONS>",
    "base_lure":"<from LURE_POOL>",

    "soft_plastic": "<OMIT KEY unless base_lure in TERMINAL_PLASTIC_MAP. If included, choose from TERMINAL_PLASTIC_MAP[base_lure]>",
    "soft_plastic_why": "<OMIT KEY unless soft_plastic included. 1-2 sentences>",

    "trailer": "<REQUIRED if TRAILER_REQUIREMENT[base_lure]==required. OPTIONAL if ==optional. OMIT KEY if ==none or ==terminal. If included, choose from allowed trailers for this base_lure (see trailer rules above).>",
    "trailer_why": "<OMIT KEY unless trailer included. 1-2 sentences>",


    "color_recommendations":["<COLOR_CLEAR_OR_AVG>","<COLOR_STAINED_OR_MUDDY>"],

    "targets":["<target>","<target>","<target>"],

    "why_this_works":"2-3 sentences total. MUST explain why THIS lure + presentation fits phase/conditions AND include color guidance in Choose A if... Choose B if... color guidance.",
    "pattern_summary":"2-3 sentences. Suggestive language only (may/might/can/suggests).",
    "strategy":"2-3 sentences explaining FISHING STYLE that matches your Day Lean (Section J). Connect Day Lean → approach. Examples: Power Search='adopt search-oriented approach, cover water to locate zones' | Finesse='fish with precision mindset, thorough coverage of fewer spots' | Control='penetrate cover, commit to heavy structure' | Reaction='target visible cover, work edges systematically'. Practical, calm tone.",

    "work_it":[
      "<Target 1>: <specific cadence using LURE_TIP_BANK>",
      "<Target 2>: <specific cadence using LURE_TIP_BANK>",
      "<Target 3>: <specific cadence using LURE_TIP_BANK>"
    ],

    "work_it_cards":[
      {"name":"<Target 1>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 2>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 3>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"}
    ]
  },

  "secondary":{
    "presentation":"<from PRESENTATIONS; MUST be different from primary.presentation>",
    "base_lure":"<from LURE_POOL>",

    "soft_plastic": null | "<REQUIRED for terminal tackle ONLY. MUST be null for jigs/bladed baits. If primary used soft_plastic, secondary MUST use DIFFERENT soft_plastic>",
    "soft_plastic_why": null | "<1-2 sentences explaining soft plastic choice; only if soft_plastic is set>",

    "trailer": "<REQUIRED if TRAILER_REQUIREMENT[base_lure]==required. OPTIONAL if ==optional. OMIT KEY if ==none or ==terminal. If included, choose from allowed trailers for this base_lure (see trailer rules above).>",
    "trailer_why": "<REQUIRED if trailer included. 1 sentence explaining trailer choice. OMIT if trailer omitted.>",

    "color_recommendations":["<COLOR_CLEAR_OR_AVG>","<COLOR_STAINED_OR_MUDDY>"],

    "targets":["<target>","<target>","<target>"],

    "why_this_works":"2-3 sentences total. MUST reference primary and explain the pivot assumption (different presentation family). Include Choose A if... Choose B if... color guidance.",
    "pattern_summary":"2-3 sentences. Suggestive language only.",
    "strategy":"2-3 sentences explaining pivot APPROACH. Reference how this differs from primary pattern and what conditions/assumption justify this alternative. Use Day Lean language from Section J if applicable. Practical, calm tone.",

    "work_it":[
      "<Target 1>: <specific cadence using LURE_TIP_BANK>",
      "<Target 2>: <specific cadence using LURE_TIP_BANK>",
      "<Target 3>: <specific cadence using LURE_TIP_BANK>"
    ],

    "work_it_cards":[
      {"name":"<Target 1>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 2>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"},
      {"name":"<Target 3>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"2-3 sentences"}
    ]
  },

  "forecast_rating": {
    "score": <integer 1-10>,
    "rating": "<AGGRESSIVE | ACTIVE | OPPORTUNISTIC | SELECTIVE | DEFENSIVE>",
    "explanation": "<1 short sentence justifying the score based on pressure/weather/phase>"
  },

  "day_progression":[
    "Morning: 2-3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize",
    "Midday: 2-3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize>",
    "Evening: 2-3 sentences describing location, target type, bass behavior, tactical adjustments and what to expect and prioritize>"
  ],

  "weather_card_insights":{
    "temperature":"2 sentences. Use weather.temp_trend and weather.temp_season_context. First sentence: describe the seasonal pattern (spawn window, post-spawn, summer pattern, etc.) and what that means for bass positioning. Second sentence: describe the temperature trend (warming/cooling/stable) and how that shift influences bass metabolism and feeding willingness. No exact numbers. No tactics or lures.",
    "wind":"2 sentences. Use forecast_narrative wind context (building/calming/sustained). First sentence: describe how current wind conditions affect baitfish movement and water surface disruption. Second sentence: explain how bass positioning and ambush behavior changes in response to wind-driven current and chop. No exact numbers. No tactics or lures.",
    "pressure":"2 sentences. Use weather.pressure_trend (Rising/Falling/Stable). First sentence: describe how the current barometric state affects bass swim bladder comfort and willingness to move vertically. Second sentence: explain the feeding window implications - falling pressure often triggers pre-frontal feeding, rising pressure creates post-frontal lockjaw or cautious behavior. No exact numbers. No tactics or lures.",
    "sky_uv":"2 sentences. First sentence: describe how current light penetration (overcast vs bright) affects bass vision, comfort level, and positioning relative to cover and shade. Second sentence: explain how these light conditions influence feeding confidence - low light often emboldens bass to roam, while bright skies push them tight to structure. No exact numbers. No tactics or lures."
  },

  "outlook_blurb":"3 sentences of weather, condition and phase related analysis and how it may effect bass activity. No exact numbers or strategy>"
}
"""
    else:
        # kept for compatibility; Bass Clarity can still generate a single pattern if needed
        output_format = r"""
RETURN JSON ONLY:
{
  "presentation":"<from PRESENTATIONS>",
  "base_lure":"<from LURE_POOL>",

  "soft_plastic": "<OMIT KEY unless base_lure in TERMINAL_PLASTIC_MAP. If included, choose from TERMINAL_PLASTIC_MAP[base_lure]>",
  "soft_plastic_why": "<OMIT KEY unless soft_plastic included. 1-2 sentences>",

    "trailer": "<REQUIRED if TRAILER_REQUIREMENT[base_lure]==required. OPTIONAL if ==optional. OMIT KEY if ==none or ==terminal. If included, choose from allowed trailers for this base_lure (see trailer rules above).>",
  "trailer_why": "<OMIT KEY unless trailer included. 1-2 sentences>",


  "color_recommendations":["<COLOR_CLEAR_OR_AVG>","<COLOR_STAINED_OR_MUDDY>"],

  "targets":["<target>","<target>","<target>"],

  "why_this_works":"Max 28–32 words total. MUST explain why THIS lure + presentation fits phase/conditions AND include Choose A if... Choose B if... color guidance.",
  "pattern_summary":"Max 28–32 words. Suggestive language only (may/might/can/suggests).",
  "strategy":"Max 28–32 words. Practical, calm, no hype.",

  "work_it":[
    "<Target 1>: <specific cadence using LURE_TIP_BANK>",
    "<Target 2>: <specific cadence using LURE_TIP_BANK>",
    "<Target 3>: <specific cadence using LURE_TIP_BANK>"
  ],

  "work_it_cards":[
    {"name":"<Target 1>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"Max 28–32 words"},
    {"name":"<Target 2>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"Max 28–32 words"},
    {"name":"<Target 3>","definition":"<EXACT from TARGET_DEFINITIONS>","how_to_fish":"Max 28–32 words"}
  ],

  "forecast_rating": {
    "score": <integer 1-10>,
    "rating": "<AGGRESSIVE | ACTIVE | OPPORTUNISTIC | SELECTIVE | DEFENSIVE>",
    "explanation": "<1 short sentence justifying the score based on pressure/weather/phase>"
  },

  "day_progression":[
    "Morning: Max 28–32 words. Where+why + tactical adjustment. No colors. No exact numbers.",
    "Midday: Max 28–32 words. Where+why + tactical adjustment. No colors. No exact numbers.",
    "Evening: Max 28–32 words. Where+why + tactical adjustment. No colors. No exact numbers."
  ],

  "weather_card_insights":{
  "temperature":"2 sentences. Use weather.temp_trend and weather.temp_season_context. First sentence: describe the seasonal pattern (spawn window, post-spawn, summer pattern, etc.) and what that means for bass positioning. Second sentence: describe the temperature trend (warming/cooling/stable) and how that shift influences bass metabolism and feeding willingness. No exact numbers. No tactics or lures.",
  "wind":"2 sentences. Use forecast_narrative wind context (building/calming/sustained). First sentence: describe how current wind conditions affect baitfish movement and water surface disruption. Second sentence: explain how bass positioning and ambush behavior changes in response to wind-driven current and chop. No exact numbers. No tactics or lures.",
  "pressure":"2 sentences. Use weather.pressure_trend (Rising/Falling/Stable). First sentence: describe how the current barometric state affects bass swim bladder comfort and willingness to move vertically. Second sentence: explain the feeding window implications - falling pressure often triggers pre-frontal feeding, rising pressure creates post-frontal lockjaw or cautious behavior. No exact numbers. No tactics or lures.",
  "sky_uv":"2 sentences. First sentence: describe how current light penetration (overcast vs bright) affects bass vision, comfort level, and positioning relative to cover and shade. Second sentence: explain how these light conditions influence feeding confidence - low light often emboldens bass to roam, while bright skies push them tight to structure. No exact numbers. No tactics or lures."
},

"outlook_blurb":"3 sentences analyzing weather/conditions/phase. MUST implicitly explain Day Lean reasoning by connecting conditions → fish behavior → approach. Use Day Lean language from Section J without saying 'Day Lean'. Examples: Power Search='active feeding windows, roaming fish, aggressive feeding lanes' | Finesse='neutral positioning, precision needed, cautious behavior' | Control='tight to cover, defensive mode, seeking security'. No exact numbers. No fishing tactics."
}
"""

    return f"""You are Bass Clarity, an expert bass fishing guide.

CRITICAL: Return a SINGLE JSON OBJECT only. No markdown. No extra keys. No wrapper objects.
CRITICAL: When evaluating temperature-dependent behavior, prioritize weather.temp_window_f.

🚨 COLOR POOL INTEGRITY RULE (CRITICAL):
YOU MUST FOLLOW THE LOOKUP PROCEDURE IN LURE SELECTION POLICY SECTION H.

Step 1: Look up your base_lure in LURE_COLOR_POOL_MAP
Step 2: Use ONLY colors from that specific pool
Step 3: Copy exact strings (no variations, no inventions)

Common Hallucinations to AVOID:
❌ "chartreuse/black" for chatterbait → WRONG POOL. Chatterbait uses BLADED_SKIRTED_COLORS which has "chartreuse/white"
❌ "chartreuse/black" for spinnerbait → WRONG POOL. Use "chartreuse/white" from BLADED_SKIRTED_COLORS
❌ "sexy shad" for texas rig → WRONG POOL. That's in CRANKBAIT_COLORS, not RIG_COLORS
❌ "chartreuse" alone for crankbaits → Must use exact string "chartreuse/black" from CRANKBAIT_COLORS
❌ "shad" for crankbaits → Must use "sexy shad" or "ghost shad" or "citrus shad" from CRANKBAIT_COLORS
❌ "pearl" for texas rig → Must use "watermelon" or "baby bass" from RIG_COLORS
❌ "green pumpkin" for frogs → Must use "green" or "brown" from FROG_COLORS
❌ Mixing pools or inventing combinations → SYSTEM FAILURE. Each lure has ONE pool only.

✅ CORRECT PROCESS:
1. Selected "chatterbait" → Look up LURE_COLOR_POOL_MAP["chatterbait"] = "BLADED_SKIRTED_COLORS"
2. Find BLADED_SKIRTED_COLORS: ["white", "shad", "chartreuse/white", "chartreuse", "black/blue", ...]
3. Choose from this list only: e.g., ["chartreuse/white", "black/blue"]
🚨 CRITICAL VALIDATION RULE #1 - ONLY ONE BOTTOM CONTACT LURE PER PLAN:

⚠️ LURE FAMILY QUICK REFERENCE (memorize this):
BOTTOM_CONTACT_LURES = ["football jig", "casting jig", "texas rig", "carolina rig", "shaky head", "ned rig"]
HORIZONTAL_LURES = ["chatterbait", "spinnerbait", "swim jig", "shallow crankbait", "mid crankbait", "deep crankbait", "lipless crankbait", "flat-sided crankbait", "underspin", "paddle tail swimbait"]
VERTICAL_LURES = ["jerkbait", "blade bait", "jighead minnow"]
FINESSE_LURES = ["dropshot", "neko rig", "wacky rig", "soft jerkbait"]
TOPWATER_LURES = ["walking bait", "buzzbait", "whopper plopper", "wake bait", "hollow body frog", "popping frog", "popper"]

🛑 RULE: Primary and secondary MUST be from DIFFERENT families above.
🛑 If you pick football jig (BOTTOM_CONTACT), secondary CANNOT be ned rig, shaky head, texas rig, etc.
🛑 If you pick ned rig (BOTTOM_CONTACT), secondary CANNOT be football jig, casting jig, carolina rig, etc.

Bottom Contact presentations are:
  • "Bottom Contact - Dragging"
  • "Bottom Contact - Hopping / Targeted"

RULE: If primary uses EITHER bottom contact presentation, secondary MUST use a DIFFERENT presentation family.

Valid alternatives for secondary:
  • "Horizontal Reaction"
  • "Vertical Reaction"
  • "Hovering / Mid-Column Finesse"
  • "Topwater - Horizontal"
  • "Topwater - Precision / Vertical Surface Work"

✅ VALID EXAMPLES:
  primary.presentation = "Bottom Contact - Dragging", secondary.presentation = "Horizontal Reaction"
  primary.presentation = "Horizontal Reaction", secondary.presentation = "Bottom Contact - Hopping / Targeted"
  primary.presentation = "Vertical Reaction", secondary.presentation = "Bottom Contact - Dragging"

❌ INVALID EXAMPLES (PLAN WILL BE REJECTED):
  primary.presentation = "Bottom Contact - Dragging", secondary.presentation = "Bottom Contact - Hopping / Targeted"
  primary.presentation = "Bottom Contact - Hopping / Targeted", secondary.presentation = "Bottom Contact - Dragging"

🚨 CRITICAL VALIDATION RULE #2 - LURE MUST MATCH PRESENTATION:

Check LURE_TO_PRESENTATION before selecting. Common mistakes:
  ❌ football jig + "Vertical Reaction" (football jig ONLY does bottom contact)
  ❌ jerkbait + "Horizontal Reaction" (jerkbait ONLY does vertical reaction)
  ❌ chatterbait + "Bottom Contact" (chatterbait ONLY does horizontal reaction)

🚨 CRITICAL VALIDATION RULE #3 - NO DUPLICATE SOFT PLASTICS OR TRAILERS:

If primary uses a soft_plastic, secondary MUST use a DIFFERENT soft_plastic.
If primary uses a trailer, secondary MUST use a DIFFERENT trailer.

Examples:
✅ VALID:
  primary: carolina rig + finesse worm
  secondary: dropshot + small minnow (different soft plastic)

❌ INVALID (PLAN WILL BE REJECTED):
  primary: carolina rig + finesse worm
  secondary: dropshot + finesse worm (same soft plastic ❌)

🚨 CRITICAL VALIDATION RULE #4 — TARGETS MUST DIFFER

primary.targets and secondary.targets MUST NOT be identical.
They may share at most ONE target. At least TWO targets must differ.
Choose targets that make sense for the presentation family (Vertical/Bottom/Horizontal).
Do not repeat the same three “default” targets unless conditions strongly justify it.  

🚨 SEASONAL LURE POLICY (HARD CONSTRAINT):
- The user message includes a `seasonal_policy` object with STRONG / CONDITIONAL / AVOID.
- You MUST choose base_lure ONLY from STRONG or CONDITIONAL.
- You MUST NOT choose any lure in AVOID.
- Water clarity affects COLOR choice only, not lure eligibility.

🔥 ENHANCED SEASONAL POLICY (PRE-SPAWN SPECIFIC):
When `seasonal_policy` includes these optional fields, USE THEM to refine your selections:

1. `active_temp_band`: The current temperature band with specific guidance
   - `presentation_rule`: SLOW_WITH_PAUSE vs CONTROLLED_MOVING vs MATCH_THE_MOOD
   - `pause_requirement`: Specific pause timing for jerkbait/jigs
   - `primary_lures`: Lures that excel in this temp range (bias toward these)
   - `forage_profile`: bottom_protein vs mixed_craw_baitfish vs opportunistic

2. `active_conditions`: List of weather conditions currently in effect
   - `bias_toward`: Lures to prioritize under these conditions
   - `bias_away_from`: Lures to deprioritize under these conditions
   - `priority_shift`: Lures that become primary options

3. `staging_targets`: Where bass stage during pre-spawn migration
   - Use in day_progression and target selection
   - Match targets to the active_temp_band affinity

4. `color_overrides`: Seasonal color biases (e.g., spring_craw_bias)
   - `priority_colors`: Prioritize these colors for applicable lures
   - `clarity_interaction`: How clarity affects color choice

5. `lure_caveats`: Technique-specific guidance per lure
   - `temp_band_technique`: How to work the lure in each temp band
   - `why`: The reasoning behind the lure's effectiveness

🚨 TARGET LOCK (HARD CONSTRAINT when provided):
- The user message may include `primary_targets` and `secondary_targets`.
- If present, you MUST use EXACTLY `primary_targets` for primary.targets and EXACTLY `secondary_targets` for secondary.targets.
- Do not invent targets or pull from outside the provided lists.

  
AUTHORITY / LANGUAGE (LOCKED):
- Never state certainty about fish behavior. Use: may, might, can, suggests, tends to.
- Do NOT say what bass ARE doing; suggest what they MAY be doing.

NO RANKINGS (LOCKED):
- Targets, presentations, and lures do not have inherent ranks.
- Determine the best strategy conditionally based on the provided phase + conditions.
- Variety is intentional (freedom within structure), never random.

ANALYSIS ORDER (NON-NEGOTIABLE):
{LURE_SELECTION_POLICY_PROMPT}
Season/Phase → Current Conditions → Targets → Presentation Family → Lure → Retrieves

{LURE_SELECTION_POLICY_PROMPT}


PRESENTATION
- Max 28–32 words providing a description of the presentation and why this particular presentation is chosen based on the current weather/condition/phase analysis and how it relates to the selected targets.

SECONDARY PATTERN (COMPLEMENT / PIVOT):
Secondary is not a backup lure. It assumes the initial read may be slightly off and attacks bass a different way.
- MUST use a different presentation family than primary
- May change targets or fish the same targets differently
- MUST reference primary in why_this_works and explain the pivot assumption

WEATHER CARD INSIGHTS (UI) (LOCKED):
- You MUST populate weather_card_insights with 4 keys: temperature, wind, pressure, sky_uv.
- Each value must be 2 sentences that demonstrate expert bass fishing knowledge.
- Do NOT include any exact numbers (no mph, mb, °F, UV values, ranges).
- Do NOT mention lures, techniques, targets, or locations.
- Use suggestive language only (may/might/can/tends to).
- Do NOT restate the metric value; the UI already shows it.
- TEMPERATURE: Use weather.temp_trend (Warming/Cooling/Stable) and weather.temp_season_context to explain seasonal bass behavior and how the trend affects metabolism/feeding.
- WIND: Use forecast_narrative wind context to explain how wind direction/intensity affects baitfish movement and bass positioning.
- PRESSURE: Use weather.pressure_trend to explain how barometric changes trigger feeding windows or defensive behavior.
- SKY_UV: Explain how light penetration affects bass positioning and visibility for ambush feeding.

FORECAST SCORING RULES (Mental Model):
Assign a score (1-10) and rating based on these strict tier definitions:
🚨 SEASONAL CEILING RULE:
- If Season is WINTER or COLD WATER:
  - MAX SCORE is 6 (OPPORTUNISTIC).
  - EXCEPTION: If 'warm_trend' is present, you may score up to 8.
  - DO NOT rate a snowstorm or freezing front as "ACTIVE" (7+). It is "DEFENSIVE" or "SELECTIVE" (1-4) despite falling pressure.

  1-2: DEFENSIVE
   • Conditions: Severe cold front, bluebird skies, rapid temperature drop, high rising pressure (>1025mb).
   • Mood: Bass are buried in cover, non-active.
   
3-4: SELECTIVE
   • Conditions: Post-frontal, slick calm water, bright sun, high pressure.
   • Mood: Bass are finicky, require precision and patience.
   
5-6: OPPORTUNISTIC
   • Conditions: Stable high pressure, average days, no distinct weather advantage or disadvantage.
   • Mood: Neutral activity; bass feed if presented correctly.
   
7-8: ACTIVE
   • Conditions: Stable low pressure, overcast skies, steady wind, minor pre-frontal warming.
   • Mood: Bass are roaming and willing to chase.
   
9-10: AGGRESSIVE
   • Conditions: Major pre-frontal pressure drop, storm approaching, perfect "Power Search" wind + cloud alignment, major lunar window.
   • Mood: Feeding frenzy, reaction strikes are dominant.

HARD RULES (validator enforced):
- Add a space after every period. "word. Word" not "word.Word"
- No specific depths in feet for water depth (e.g., "in 10 feet of water").
- outlook_blurb: weather/phase only, no exact numbers (no "55°F", no "8 mph"), no fishing strategy.
- day_progression: exactly 3 lines (Morning/Midday/Evening or Late). No colors.
- Use natural capitalization (not ALL CAPS).

TARGETS (LOCKED):
⚠️ See LURE SELECTION POLICY Section I for complete target selection procedure.
- You MUST select exactly 3 targets from accessible_targets list
- Follow TARGET SELECTION POLICY strategic guidance:
  • STEP 1: Identify Day Lean target preferences
  • STEP 2: Apply seasonal modifiers
  • STEP 3: Check lure compatibility
  • STEP 4: Ensure tactical variety (different approaches, not redundant)
  • STEP 5: If Search and Pick Apart, consider target pairing strategy
- Each target MUST be an exact key from accessible_targets (match spelling and spacing)



WORK_IT_CARDS (STRICT)
- You MUST generate exactly 3 cards.
- For each card index i:
- work_it_cards[i].name MUST equal targets[i] exactly (same string).
- work_it_cards[i].definition MUST equal the value from target_definitions dict provided in user message:
- definition = target_definitions[targets[i]]
- definition is never the target label; it is the full definition text stored in target_definitions.
Example
If targets[0] = "grass edges" then:
work_it_cards[0].name = "grass edges"
work_it_cards[0].definition = target_definitions["grass edges"] (the full definition sentence from user message)


COLOR SELECTION:
⚠️ See LURE SELECTION POLICY Section H for complete color selection procedure.
Key points:
- You MUST look up your lure in LURE_COLOR_POOL_MAP first
- You MUST only use colors from that specific pool (see canonical pools below)
- Provide exactly TWO colors: one for clear water, one for stained water
- In why_this_works, explain colors in "Choose A if… Choose B if…" format
- Do NOT output any other color structure (no zones, no asset keys, no nested color objects)


WHERE & HOW
   - 3 tactical steps combining target + specific retrieve cadence
   - Each step should reference a target and explain HOW to fish it with THIS lure
   - Use specific retrieve instructions (Locate lure specific retrieves from LURE TIP BANK)
   - Use natural capitalization (not ALL CAPS)

WHY THIS WORKS:
   - ONLY explain why THIS SPECIFIC LURE was chosen for these conditions
   - Focus on: lure characteristics, presentation style
   - MUST include color explanation using "Choose X if Y" format:
     * "Choose [Color 1] if [conditions] — [bass behavior/why it works]. Choose [Color 2] if [conditions] — [bass behavior/why it works]."
     * Example: "Choose sexy shad if fishing clear to slightly stained water—realistic shad pattern triggers strikes from bass feeding on natural baitfish. Choose chartreuse/black if your water is stained or muddy—high visibility chartreuse creates strong contrast bass can see from distance."
   - Add ONE sentence about soft plastic/trailer color choice if applicable.
   - Length: Max 28-32 words total (lure choice + color explanation + optional trailer color)


DAY PROGRESSION (EXTENDED FORMAT) - TACTICAL & WEATHER AWARE:
   - Exactly 3 time blocks: Morning / Midday / Evening (or Late)
   - Length: Max 28-32 words PER time block.
   - NO colors in day progression.

   🚨 WEATHER CONTEXT RULES (MUST FOLLOW):
   1. IF OVERCAST / RAIN / SNOW:
      - YOU ARE FORBIDDEN from using the words "shade", "shadows", "sun", or "retreat from light".
      - Instead, focus on "roaming", "active lanes", or "low-light advantage".
   2. IF COLD / WINTER / SNOWSTORM:
      - Bass are seeking STABILITY and WARMTH, not "avoiding sun".
      - Midday focus should be on "peak warmth window" or "solar gain" (if sun breaks through), NOT "seeking shade".
      - If snowing/storming: Focus on "tight to cover" and "easy meals". Bass will NOT be "active/chasing" in freezing turbulence.

   CONTENT REQUIREMENTS (Do not list these bullets, just follow them):
   - Where + Why: Location/target type and bass behavior at this time.
   - How: Tactical adjustment specific to this time period.
   - Key insight: What to expect or prioritize. Reference which technique to use and when. Suggest when to switch from one presentation to another based on weather forecast and conditions.

   Format:
   Morning: [Text]
   Midday: [Text]
   Evening: [Text]

TERMINAL TACKLE:
- If base_lure is terminal tackle (texas rig, carolina rig, dropshot, ned rig, shakey head, wacky rig, neko rig), you MUST set soft_plastic and soft_plastic_why.
- Terminal tackle does NOT use trailer field (must be null).
Allowed plastics:
{chr(10).join(terminal_rules)}

JIGS AND BLADED BAITS (TRAILER REQUIRED):
- If base_lure is jig or bladed bait (casting jig, football jig, swim jig, chatterbait, spinnerbait, buzzbait), you MUST set trailer and trailer_why.
- Jigs and bladed baits do NOT use soft_plastic field (must be null).
Allowed trailers:
{chr(10).join(trailer_rules)}

CRITICAL RULE - soft_plastic vs trailer:
  ❌ WRONG: casting jig with soft_plastic="craw" → This will FAIL validation
  ✅ CORRECT: casting jig with trailer="craw"
  
  ❌ WRONG: texas rig with trailer="creature bait" → This will FAIL validation
  ✅ CORRECT: texas rig with soft_plastic="creature bait"

COMPLETE JSON EXAMPLES (Follow These Patterns):

Example 1 - Casting Jig (uses trailer):
{{
  "base_lure": "casting jig",
  "soft_plastic": null,
  "soft_plastic_why": null,
  "trailer": "craw",
  "trailer_why": "Craw profile matches bottom-protein forage for Control lean."
}}

Example 2 - Texas Rig (uses soft_plastic):
{{
  "base_lure": "texas rig",
  "soft_plastic": "creature bait",
  "soft_plastic_why": "Creature bait bulk penetrates heavy cover.",
  "trailer": null,
  "trailer_why": null
}}

Example 3 - Chatterbait (uses trailer):
{{
  "base_lure": "chatterbait",
  "soft_plastic": null,
  "soft_plastic_why": null,
  "trailer": "paddle tail swimbait",
  "trailer_why": "Swimming action enhances blade vibration."
}}

Example 4 - Shallow Crankbait (uses neither):
{{
  "base_lure": "shallow crankbait",
  "soft_plastic": null,
  "soft_plastic_why": null,
  "trailer": null,
  "trailer_why": null
}}

DROPSHOT SPECIAL CASE (STRICT):
- If base_lure is "dropshot", you MUST set:
  - presentation: "Hovering / Mid-Column Finesse"  
  - soft_plastic: REQUIRED and must be exactly ONE of:
    • "finesse worm"
    • "small minnow"

🚨 DROPSHOT COLOR RULES (CRITICAL - Follow EXACTLY):

If soft_plastic == "finesse worm":
  - Colors MUST come from RIG_COLORS pool
  - Allowed: green pumpkin, black/blue, junebug, baby bass, watermelon red, red craw, black, green pumpkin orange, peanut butter & jelly
  - DO NOT use: pearl, white, shad (these are minnow colors only)

If soft_plastic == "small minnow":
  - Colors MUST come from SOFT_SWIMBAIT_COLORS pool
  - Allowed: white, shad, pearl, bluegill, green pumpkin
  - DO NOT use: junebug, peanut butter & jelly, red craw (these are worm colors only)

COMMON ERROR:
❌ dropshot + small minnow + junebug (WRONG - junebug is for worms)
❌ dropshot + finesse worm + pearl (WRONG - pearl is for minnows)
✅ dropshot + small minnow + pearl (CORRECT)
✅ dropshot + finesse worm + green pumpkin (CORRECT)

If you pick dropshot as a pattern, carefully check:
1. What soft_plastic did you choose?
2. Does your color match that soft_plastic's pool?
3. If not, either change color OR change soft_plastic

Never omit soft_plastic for dropshot. Null/blank soft_plastic = invalid plan.
TRAILERS:
- If base_lure uses a trailer, you MUST set trailer and trailer_why.
Allowed trailers:
{chr(10).join(trailer_rules)}

✅ CRITICAL FIELD-USAGE RULE (must be impossible to miss)

You MUST follow the canon maps exactly. These rules are enforced by server validators.

A) Presentation is NOT free text.
- You MUST set `presentation` by LOOKUP:
  presentation := LURE_TO_PRESENTATION[base_lure]
- Copy the string EXACTLY. Do NOT paraphrase (e.g., never invent "Bottom Contact - Hopping").
- If you cannot comply, you must choose a different base_lure that you can map correctly.

B) Terminal tackle vs Trailer usage is mutually exclusive by lure family.
Use these canon maps:

1) Terminal tackle (base_lure in TERMINAL_PLASTIC_MAP):
✅ include `soft_plastic` AND `soft_plastic_why`
❌ DO NOT include `trailer` or `trailer_why` keys AT ALL (omit them)

2) Trailer-required lures (base_lure in TRAILER_BUCKET_BY_LURE):
✅ include `trailer` AND `trailer_why` (choose ONLY from the allowed trailer list for that lure)
❌ DO NOT include `soft_plastic` or `soft_plastic_why` keys AT ALL (omit them)

3) All other lures (base_lure in neither map):
❌ DO NOT include any of: soft_plastic, soft_plastic_why, trailer, trailer_why (omit all)

C) Hard fail rule:
If you output a lure that requires trailer but you include soft_plastic (even null), the plan will be rejected.
If you output a terminal tackle lure and omit soft_plastic, the plan will be rejected.

CANONICAL POOLS (MUST USE EXACT VALUES — NO INVENTION):
PRESENTATIONS: {jdump(PRESENTATIONS)}
LURES: {jdump(LURE_POOL)}
LURE_TO_PRESENTATION: {jdump(LURE_TO_PRESENTATION)}

COLOR POOL MAP (choose the correct pool for the selected base_lure):
LURE_COLOR_POOL_MAP: {jdump(LURE_COLOR_POOL_MAP)}

COLOR POOLS (colors MUST come from the correct pool):
RIG_COLORS: {jdump(RIG_COLORS)}
BLADED_SKIRTED_COLORS: {jdump(BLADED_SKIRTED_COLORS)}
SOFT_SWIMBAIT_COLORS: {jdump(SOFT_SWIMBAIT_COLORS)}
CRANKBAIT_COLORS: {jdump(CRANKBAIT_COLORS)}
JERKBAIT_COLORS: {jdump(JERKBAIT_COLORS)}
TOPWATER_COLORS: {jdump(TOPWATER_COLORS)}
FROG_COLORS: {jdump(FROG_COLORS)}

LURE_TIP_BANK: {jdump(LURE_TIP_BANK)}

NOTE: Available targets will be provided in the user message based on access type (boat or bank).
You MUST choose targets ONLY from the accessible_targets list provided.

{output_format}
"""


# ----------------------------------------
# LLM Caller
# ----------------------------------------
def _extract_first_json_object(text: str) -> Optional[str]:
    if not text:
        return None
    s = text.strip()

    # strip code fences if present
    if s.startswith("```"):
        lines = s.splitlines()
        lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        s = "\n".join(lines).strip()

    # fast path
    if s.startswith("{") and s.endswith("}"):
        return s

    # find first balanced object
    start = s.find("{")
    if start == -1:
        return None

    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(s)):
        ch = s[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return s[start : i + 1]
    return None

def expand_plan_color_zones(plan: Dict[str, Any], is_member: bool) -> Dict[str, Any]:
    """
    V1 SAFETY VERSION:
    - Dynamic lure color zones are NOT used.
    - Swatches are driven by color_recommendations (two strings).
    - We only attach a stable asset_key so the frontend can render the lure image.
    - Must never crash (no retry needed just because asset enrichment failed).
    """

    def _apply(obj: Dict[str, Any]) -> None:
        if not isinstance(obj, dict):
            return

        lure = obj.get("base_lure")
        if not lure:
            return

        # Stable lure silhouette/image key (no soft_plastic dependency)
        asset_key = f"{str(lure).replace(' ', '_')}.png"

        # Keep both keys for backward compatibility
        obj["colors"] = {"asset_key": asset_key}
        obj["color"] = {"asset_key": asset_key}

        # IMPORTANT: do not modify color_recommendations here

    if is_member:
        _apply(plan.get("primary", {}) or {})
        _apply(plan.get("secondary", {}) or {})
    else:
        _apply(plan)

    return plan

async def call_openai_plan(
    weather: dict,
    phase: str,
    location: str,
    latitude: float,
    longitude: float,
    access_type: str = "boat",
    is_member: bool = False,
    current_lake_name: str = "",
    recent_primary_lures: list[str] = None,
    recent_secondary_lures: list[str] = None,
    regen_context: dict = None,
    seasonal_policy: Optional[Dict[str, Any]] = None,
    primary_targets: Optional[List[str]] = None,
    secondary_targets: Optional[List[str]] = None,
    user_primary_lure: Optional[str] = None,
    user_secondary_lure: Optional[str] = None,
) -> dict:
    """
    Generate LLM plan with access filtering and variety system.
    
    Flow:
    1. Filter targets by access type (boat vs bank)
    2. Get variety mode
    3. LLM analyzes conditions → picks from accessible targets → presentation → lure
    4. Return plan (variety swaps happen in generate_llm_plan_with_retries)
    
    Args:
        weather: Weather data (enhanced with pressure, moon, precipitation, UV, humidity)
        location: Location name
        latitude: Latitude
        longitude: Longitude
        access_type: "boat" or "bank" - determines which targets are accessible
        is_member: All users are members now (kept for compatibility)
        recent_primary_lures: List of recently used primary lures
        recent_secondary_lures: List of recently used secondary lures
    
    Returns:
        LLM-generated plan or None
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("LLM_PLAN: No API key")
        return None

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()

    # ✅ STEP 1: Filter targets by access type
    accessible_targets = filter_targets_by_access(access_type)
    print("LLM_PLAN: Access=" + access_type + ", " + str(len(accessible_targets)) + " accessible targets")

    # ✅ STEP 1b: Load seasonal policy (best-effort; non-breaking)
    if seasonal_policy is None:
        seasonal_policy = _load_seasonal_policy(phase)

    # ✅ STEP 1c: Deterministically preselect & split targets for primary vs secondary (best-effort; non-breaking)
    # If caller didn't provide targets, build a small diverse pool and split it deterministically.
    # if primary_targets is None or secondary_targets is None:
    #     targets_pool = _select_diverse_targets(
    #         accessible_targets=accessible_targets,
    #         phase=phase,
    #         access_type=access_type,
    #         weather={
    #             "wind_mph": weather.get("wind_mph") or weather.get("wind_speed"),
    #             "wind_speed": weather.get("wind_speed"),
    #         },
    #         k=5,
    #     )

    #     # Primary gets first 3; Secondary shares at most 1 target (targets_pool[0]) when possible.
    #     if len(targets_pool) >= 5:
    #         primary_targets = targets_pool[:3]
    #         secondary_targets = [targets_pool[0], targets_pool[3], targets_pool[4]]
    #     else:
    #         # Safe fallback: not enough unique targets available
    #         primary_targets = targets_pool[:3]
    #         secondary_targets = targets_pool[:3]

    # Build target definitions dict
    from app.canon.target_definitions import TARGET_DEFINITIONS
    # Prefer selected targets (if we have them), otherwise fall back to accessible targets
    _targets_for_defs = (primary_targets or []) + (secondary_targets or [])
    if not _targets_for_defs:
        _targets_for_defs = accessible_targets
    accessible_target_defs = {
        target: TARGET_DEFINITIONS[target]
        for target in _targets_for_defs
        if target in TARGET_DEFINITIONS
    }

    # ✅ STEP 2: Build user input with accessible targets and ENHANCED WEATHER
    # ✅ STEP 2: Build user input with accessible targets and ENHANCED WEATHER
    temp_f = weather.get("temp_f")
    temp_high = weather.get("temp_high")
    temp_low = weather.get("temp_low")

    # Derive daylight-window temperature (used for lure biasing, not display)
    if temp_f is not None and temp_high is not None:
        temp_window_f = (temp_f + temp_high) / 2
    elif temp_f is not None:
        temp_window_f = temp_f
    elif temp_high is not None:
        temp_window_f = temp_high
    else:
        temp_window_f = None


    # ✅ SURGICAL UPDATE: Enhanced user_input with Trend Data
    # Extract rich policy data from raw
    raw_policy = seasonal_policy.get("raw")
    # Use backend-calculated water temp (based on 5-day air temp history)
    estimated_water_temp = weather.get("estimated_water_temp_f")
    active_temp_band = _determine_active_temp_band(raw_policy, estimated_water_temp)
    active_modifiers = _extract_active_condition_modifiers(raw_policy, weather)

    # Build enhanced seasonal_policy with new fields
    enhanced_seasonal_policy = {
        "phase": seasonal_policy.get("phase"),
        "strong": seasonal_policy.get("strong", []),
        "conditional": seasonal_policy.get("conditional", []),
        "avoid": seasonal_policy.get("avoid", []),
    }

    # Add temp_band guidance if available (pre-spawn specific)
    if active_temp_band:
        enhanced_seasonal_policy["active_temp_band"] = {
            "name": active_temp_band.get("band_key"),
            "description": active_temp_band.get("description"),
            "presentation_rule": active_temp_band.get("presentation_rule"),
            "pause_requirement": active_temp_band.get("pause_requirement"),
            "primary_lures": active_temp_band.get("primary_lures", []),
            "forage_profile": active_temp_band.get("forage_profile"),
            "note": active_temp_band.get("note"),
        }

    # Add active condition modifiers if any apply
    if active_modifiers:
        enhanced_seasonal_policy["active_conditions"] = [
            {
                "condition": mod.get("modifier_key"),
                "description": mod.get("description"),
                "bias_toward": mod.get("bias_toward", []),
                "bias_away_from": mod.get("bias_away_from", []),
                "priority_shift": mod.get("priority_shift", []),
                "note": mod.get("note"),
            }
            for mod in active_modifiers
        ]

    # Add staging targets if available (pre-spawn specific)
    if raw_policy and isinstance(raw_policy, dict):
        staging_targets = raw_policy.get("staging_targets")
        if staging_targets and isinstance(staging_targets, dict):
            enhanced_seasonal_policy["staging_targets"] = staging_targets

        # Add color overrides (spring craw bias)
        color_overrides = raw_policy.get("color_overrides")
        if color_overrides and isinstance(color_overrides, dict):
            enhanced_seasonal_policy["color_overrides"] = color_overrides

        # Add lure-specific caveats
        lure_caveats = raw_policy.get("lure_caveats")
        if lure_caveats and isinstance(lure_caveats, dict):
            enhanced_seasonal_policy["lure_caveats"] = lure_caveats

    user_input = {
        "location": location,
        "phase": phase,
        "seasonal_policy": enhanced_seasonal_policy,
        "weather": {
            # Temperature
            "temp_f": weather.get("temp_f"),
            "temp_high": temp_high,
            "temp_low": temp_low,
            "temp_window_f": temp_window_f,

            # Wind & Sky
            "wind_mph": weather.get("wind_mph") or weather.get("wind_speed"),
            "wind_gust_mph": weather.get("wind_gust_mph"),  # <-- NEW
            "wind_direction": weather.get("wind_direction"), # <-- NEW
            "cloud_cover": weather.get("cloud_cover") or weather.get("sky_condition"),
            "sky_condition": weather.get("sky_condition"),
            "cloud_pct": weather.get("cloud_pct", 0),
            
            # Barometric Pressure
            "pressure_mb": weather.get("pressure_mb"),
            "pressure_trend": weather.get("pressure_trend"),
            
            # Precipitation
            "precipitation_1h": weather.get("precipitation_1h", 0),
            "has_recent_rain": weather.get("has_recent_rain", False),
            
            # Light & Moon
            "uv_index": weather.get("uv_index"),
            "moon_phase": weather.get("moon_phase"),
            "moon_illumination": weather.get("moon_illumination"),
            "is_major_period": weather.get("is_major_period", False),
            
            # Other
            "humidity": weather.get("humidity"),
            "dew_point": weather.get("dew_point"),
            "clarity_estimate": weather.get("clarity_estimate"),

            # ✅ NEW: Forecast & Trends (The "Time Machine" Data)
            "forecast_narrative": weather.get("forecast_narrative", ""),
            "past_wind_mph": weather.get("past_wind_mph"),
            "future_wind_mph": weather.get("future_wind_mph"),
            "forecast_wind_max": weather.get("forecast_wind_max"),

            # Temperature Trend (for premium card insights)
            "past_temp_f": weather.get("past_temp_f"),
            "temp_trend": weather.get("temp_trend", "Stable"),
            "temp_season_context": weather.get("temp_season_context", "transitional"),

            # Water Temperature (estimated from 5-day air temp history)
            "estimated_water_temp_f": weather.get("estimated_water_temp_f"),
        },
        "accessible_targets": accessible_targets,
        "primary_targets": None,
        "secondary_targets": None,

        "target_definitions": accessible_target_defs,
        "instructions": "",
    }

    user_input["forbidden_combinations"] = []           
    # Build context-aware regeneration note
# 1. NEW: Inject Structured Constraint (The LLM respects data keys highly)
    user_input["forbidden_combinations"] = []

    # Build context-aware regeneration note
    regeneration_note = ""
    # DYNAMIC TEMPERATURE: Increase temp if regeneration context exists to encourage variety
    current_temperature = 0.6
    
    if recent_primary_lures or recent_secondary_lures:
        current_temperature = 0.65  # Lower temp to reduce hallucinations while still encouraging variety
        
        if not regen_context:
            regen_context = { "last_lake_name": None, "minutes_since_last_gen": None, "last_combination": None }
        
        last_lake = regen_context.get("last_lake_name")
        minutes_ago = regen_context.get("minutes_since_last_gen")
        last_combo = regen_context.get("last_combination")
        
        # ADD TO STRUCTURED INPUT
        if last_combo:
             user_input["forbidden_combinations"].append(list(last_combo))

        same_location = (last_lake == current_lake_name) if last_lake and current_lake_name else False
        
        # 2. UPGRADED: "Burned" Framing (Stronger than Forbidden)
        regeneration_note = "\n\n🚨 FINAL SYSTEM OVERRIDE - VARIETY ENFORCEMENT 🚨\n"
        
        if last_combo:
            p_lure = str(last_combo[0]).upper()
            s_lure = str(last_combo[1]).upper()
            regeneration_note += f"1. THE PAIR [{p_lure} + {s_lure}] IS BURNED (UNAVAILABLE).\n"
            regeneration_note += f"   - This specific combination was just used. It is physically unavailable.\n"
            regeneration_note += f"   - You MUST calculate the 2nd Best Optimal Strategy.\n"
        
        if minutes_ago is not None and minutes_ago < 60 and same_location:
             regeneration_note += "2. RAPID REGENERATION DETECTED:\n"
             regeneration_note += f"   - The user is asking for OPTIONS.\n"
             regeneration_note += f"   - AVOID these recent lures if possible: {recent_primary_lures + recent_secondary_lures}\n"
             regeneration_note += "   - Dig deeper into the tackle box.\n"

        regeneration_note += "\n"
        
        # Show recent lures
        if recent_primary_lures:
            regeneration_note += f"Recent primary lures: {', '.join(recent_primary_lures)}\n"
        if recent_secondary_lures:
            regeneration_note += f"Recent secondary lures: {', '.join(recent_secondary_lures)}\n"
        
        # Absolute rule: never repeat combination
        if last_combo:
            regeneration_note += f"\n🚨 CRITICAL: Do NOT use combination ({last_combo[0]}, {last_combo[1]}). Combinations must never repeat.\n"
        
        # Context-based guidance - EXTENDED TO 24 HOURS FORBIDDEN WINDOW
        if minutes_ago is not None:
            if minutes_ago < 1440:  # <24 hours - HARD FORBIDDEN regardless of location
                regeneration_note += "\nUser Intent: FORCE VARIETY (Within 24-hour window)\n"
                regeneration_note += "1. You are FORBIDDEN from selecting: " + str(recent_primary_lures + recent_secondary_lures) + "\n"
                regeneration_note += "2. You MUST select the NEXT BEST optimal lure that is NOT in the list above.\n"
                regeneration_note += "3. If the 'Day Lean' logic forces a forbidden lure, you MUST pivot to the secondary appropriate presentation family.\n"
                regeneration_note += "4. This is a HARD CONSTRAINT - do not use 'optimal for conditions' as justification to repeat lures.\n"

            else:  # 24+ hours
                regeneration_note += "\nUser Intent: NEW DAY / FRESH CONDITIONS (24+ hours later)\n"
                regeneration_note += "- Treat this as a fresh analysis of current conditions\n"
                regeneration_note += "- Same lures are acceptable if conditions strongly support them\n"
                regeneration_note += "- Still prefer variety when multiple lures are equally valid\n"
        else:
            # No timing info, default to FORBIDDEN to be safe
            regeneration_note += "\nVARIETY ENFORCEMENT (No timing info - defaulting to strict):\n"
            regeneration_note += "1. You are FORBIDDEN from selecting: " + str(recent_primary_lures + recent_secondary_lures) + "\n"
            regeneration_note += "2. You MUST select the NEXT BEST optimal lure that is NOT in the list above.\n"
            regeneration_note += "3. If the 'Day Lean' logic forces a forbidden lure, you MUST pivot to a different presentation family.\n"
        
        regeneration_note += "\n"
    
    
    # Seasonal lure constraints (hard)
    seasonal_note = ""
    try:
        sp_strong = seasonal_policy.get("strong") or []
        sp_cond = seasonal_policy.get("conditional") or []
        sp_avoid = seasonal_policy.get("avoid") or []

        if sp_strong or sp_cond or sp_avoid:
            seasonal_note += "\n\n🎯 SEASONAL LURE POLICY (HARD CONSTRAINTS):\n"
            seasonal_note += "- You MUST choose base_lure ONLY from STRONG or CONDITIONAL lists below.\n"
            seasonal_note += "- You MUST NOT choose any lure in AVOID.\n"
            seasonal_note += "- Water clarity affects COLOR choice only, not lure eligibility.\n\n"
            seasonal_note += f"STRONG: {sp_strong}\n"
            seasonal_note += f"CONDITIONAL: {sp_cond}\n"
            seasonal_note += f"AVOID: {sp_avoid}\n"
            seasonal_note += "\n"
    except Exception:
        seasonal_note = ""

    # Target lock (hard) if we have selected targets
    target_lock_note = ""
    if primary_targets or secondary_targets:
        target_lock_note += "\n🎯 TARGET SELECTION (HARD CONSTRAINTS):\n"
        target_lock_note += "- PRIMARY must use EXACTLY primary_targets for primary.targets.\n"
        target_lock_note += "- SECONDARY must use EXACTLY secondary_targets for secondary.targets.\n"
        target_lock_note += "- Do not invent targets or pull from outside these lists.\n"
        target_lock_note += "- Do not use any targets outside this list.\n"
        target_lock_note += f"- primary_targets: {primary_targets}\n"
        target_lock_note += f"- secondary_targets: {secondary_targets}\n\n"

    # ... existing regeneration_note code ...

    # ✅ SURGICAL INSERT: Trend Analysis Directive
    trend_instructions = """
    
    🔍 WEATHER TREND ANALYSIS (CRITICAL):
    You have access to 'forecast_narrative', 'past_wind_mph', and 'future_wind_mph'. USE THEM.
    1. ANALYZE THE TREND, NOT JUST THE SNAPSHOT.
    - If wind is building (future > current): Plan for reaction bites peaking later in the day.
    - If wind is dying (past > current): The "Lag Effect" applies—mudlines and chop may still favor reaction baits even if current wind is low.
    - If pressure is falling fast: This is an aggressive feeding window; prioritize power fishing.
    - If pressure is rising fast (post-front): Fish are tightening to cover; downsize and slow down.

    2. MATCH DAY PROGRESSION TO FORECAST:
    - Your 'day_progression' logic MUST match the wind/weather forecast. 
    - Example: If wind spikes to 20mph in the afternoon, your "Evening" block should switch to wind-blown tactics.
    """
    
    # Append to existing instructions
    user_input["instructions"] += trend_instructions

    
    # Add boat advantage strategic requirements
    if access_type == "boat":
        boat_instructions = """
        
🚤 BOAT ACCESS STRATEGIC REQUIREMENTS:
You have """ + str(len(accessible_targets)) + """ targets available (including offshore/transition structure).

Required strategic approach:
- Include at least 1 transition or offshore target in your 3 targets:
  * Transition: points, channel swings, breaks, first depth break, outside bends, transitions
  * Offshore: humps, ledges, main-lake points, roadbeds, saddles, basin-adjacent structure
- Don't default to bank-fishing techniques from a boat
- Leverage boat positioning advantages (can fish multiple zones, access deeper water)

Good boat plans demonstrate:
- Offshore structure usage when appropriate (humps, ledges, main-lake points)
- Deep transition zones (channel swings, steep breaks, outside bends)
- Vertical or deep presentations when conditions warrant

Avoid: Selecting only shoreline cover (banks, docks, laydowns) when boat access provides offshore options
"""
        user_input["instructions"] += boat_instructions

    # =========================================================================
    # USER-SELECTED LURES OVERRIDE
    # =========================================================================
    # If user has selected their own lures, override the normal lure selection
    user_lure_override_note = ""
    if user_primary_lure or user_secondary_lure:
        user_lure_override_note = "\n\n🎣 USER LURE SELECTION (LOCKED - HIGHEST PRIORITY) 🎣\n"
        user_lure_override_note += "The user has selected their own lures. You MUST use these EXACT lures.\n"
        user_lure_override_note += "DO NOT substitute, suggest alternatives, or override these selections.\n\n"

        if user_primary_lure:
            user_lure_override_note += f"PRIMARY LURE (LOCKED): {user_primary_lure}\n"
            user_lure_override_note += "- Use this exact lure for primary.base_lure\n"
            user_lure_override_note += "- Build the primary strategy around this lure choice\n"

        if user_secondary_lure:
            user_lure_override_note += f"\nSECONDARY LURE (LOCKED): {user_secondary_lure}\n"
            user_lure_override_note += "- Use this exact lure for secondary.base_lure\n"
            user_lure_override_note += "- Build the secondary strategy around this lure choice\n"

        # When BOTH lures are user-selected, relax the presentation family constraint
        if user_primary_lure and user_secondary_lure:
            user_lure_override_note += "\n⚠️ PRESENTATION FAMILY OVERRIDE:\n"
            user_lure_override_note += "Since the user selected BOTH lures, the normal 'different presentation family' rule is WAIVED.\n"
            user_lure_override_note += "Assign each lure its natural presentation (from LURE_TO_PRESENTATION) even if both are in the same family.\n"
            user_lure_override_note += "Example: If user picks texas rig + shaky head, both use Bottom Contact presentations - that's OK.\n\n"

        user_lure_override_note += "\nYOUR JOB WITH USER-SELECTED LURES:\n"
        user_lure_override_note += "1. Accept the user's lure choices without question\n"
        user_lure_override_note += "2. Select appropriate TARGETS that work with these lures\n"
        user_lure_override_note += "3. Select optimal COLORS (color_recommendations) based on water clarity and conditions\n"
        user_lure_override_note += "4. STILL FOLLOW terminal tackle and trailer rules:\n"
        user_lure_override_note += "   - If base_lure is in TERMINAL_PLASTIC_MAP → MUST include soft_plastic + soft_plastic_why\n"
        user_lure_override_note += "   - If TRAILER_REQUIREMENT[base_lure]=='required' → MUST include trailer + trailer_why\n"
        user_lure_override_note += "   - If TRAILER_REQUIREMENT[base_lure]=='optional' → include trailer if conditions warrant\n"
        user_lure_override_note += "5. Generate RETRIEVE GUIDANCE (work_it) optimized for today's conditions\n"
        user_lure_override_note += "6. Build STRATEGY and DAY PROGRESSION around these lures\n"
        user_lure_override_note += "7. Explain how to fish these lures effectively in current conditions\n"
        user_lure_override_note += "\n📝 TONE & PHRASING GUIDANCE FOR USER-SELECTED LURES:\n"
        user_lure_override_note += "The user chose these lures deliberately. Write copy that RESPECTS their expertise.\n\n"
        user_lure_override_note += "FOR 'why_this_works' FIELD:\n"
        user_lure_override_note += "- Frame as 'how to maximize this lure today' NOT 'why this lure fits conditions'\n"
        user_lure_override_note += "- Focus on retrieve speed, depth adjustments, and timing for current conditions\n"
        user_lure_override_note += "- Example: 'Slow your texas rig cadence in cool water - longer pauses let bass commit.'\n"
        user_lure_override_note += "- NEVER: 'While conditions might favor reaction baits, your texas rig can still...'\n\n"
        user_lure_override_note += "FOR 'pattern_summary' FIELD:\n"
        user_lure_override_note += "- Describe how bass may relate to structure with THIS lure's strengths in mind\n"
        user_lure_override_note += "- Connect the lure's action to bass positioning and behavior\n\n"
        user_lure_override_note += "FOR 'strategy' FIELD:\n"
        user_lure_override_note += "- Describe the APPROACH for fishing this lure effectively today\n"
        user_lure_override_note += "- Reference Day Lean but adapt to the lure's natural strengths\n\n"
        user_lure_override_note += "FOR SECONDARY 'why_this_works' (when both lures user-selected):\n"
        user_lure_override_note += "- Frame as 'complementing' the primary, not 'pivoting' from it\n"
        user_lure_override_note += "- Example: 'Pairs well with your primary - covers different water column.'\n\n"
        user_lure_override_note += "CRITICAL: Never imply the user made a suboptimal choice. Write as if coaching\n"
        user_lure_override_note += "an angler who knows exactly what they want and just needs execution guidance.\n"

        # Clear the regeneration note since user is overriding lure selection
        regeneration_note = ""

        # Clear seasonal constraints if BOTH lures are user-selected
        # (If only one is selected, keep constraints for the AI-selected lure)
        if user_primary_lure and user_secondary_lure:
            seasonal_note = ""  # User selected both - no seasonal restrictions apply

        # Add user lures to user_input for structured access
        user_input["user_selected_primary_lure"] = user_primary_lure
        user_input["user_selected_secondary_lure"] = user_secondary_lure

    # We use += to append this to the Trend/Boat instructions we just added above.
    user_input["instructions"] += (
        "\n" +
        seasonal_note +
        target_lock_note +
        "\nACCESSIBLE TARGETS (based on " + access_type + " access):\n" +
        "- These are the targets the angler can realistically reach from " + access_type + "\n" +
        "- Accessible targets: " + str(accessible_targets) + "\n" +
        "- For work_it_cards definitions, use target_definitions[target_name]\n" +
        "\n" +
        LURE_SELECTION_POLICY_PROMPT +
        "\n" +
        user_lure_override_note +  # User-selected lures (if any) - highest priority
        regeneration_note  # Burn list enforcement (if no user override)
    )
    system_prompt = build_system_prompt(include_pattern_2=True)
    max_tokens = 1700

    try:
        t0 = time.time()
        async with httpx.AsyncClient(timeout=70.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": "Bearer " + api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": json.dumps(user_input, ensure_ascii=False)},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": current_temperature,
                    "max_completion_tokens": max_tokens,
                },
            )

        dt = time.time() - t0
        print(f"LLM_PLAN: OpenAI call took {round(dt, 2)}s | Temp: {current_temperature}")

        if response.status_code != 200:
            print("LLM_PLAN: HTTP " + str(response.status_code))
            print("LLM_PLAN BODY: " + response.text[:800])
            return None

        data = response.json()
        if "choices" not in data or not data["choices"]:
            print("LLM_PLAN ERROR: No choices in response")
            return None

        content = data["choices"][0]["message"].get("content", "")
        if not content or not content.strip():
            print("LLM_PLAN ERROR: Empty content from OpenAI")
            return None

        extracted = _extract_first_json_object(content)
        if not extracted:
            print("LLM_PLAN ERROR: Could not extract JSON object")
            print("LLM_PLAN: Content preview: " + content[:400])
            return None

        try:
            plan = json.loads(extracted)
        except json.JSONDecodeError as e:
            print("LLM_PLAN ERROR: JSONDecodeError after extraction")
            print("LLM_PLAN JSON ERROR: " + repr(e))
            print("LLM_PLAN: Extracted preview: " + extracted[:500])
            return None
      


        def _dbg_pattern(label: str, p: dict) -> None:
            if not isinstance(p, dict):
                print(f"LLM_PLAN DBG {label}: <not dict> {type(p)}")
                return

            lure = p.get("base_lure")
            pres = p.get("presentation")

            # key presence matters for your validator
            has_soft = "soft_plastic" in p
            has_trailer = "trailer" in p

            soft_val = p.get("soft_plastic")
            trailer_val = p.get("trailer")

            # canon expectations (if these maps are imported in this file)
            expected_pres = LURE_TO_PRESENTATION.get(lure) if lure else None
            trailer_req = TRAILER_REQUIREMENT.get(lure) if lure else None
            trailer_bucket = TRAILER_BUCKET_BY_LURE.get(lure) if lure else None

            print(
                "LLM_PLAN DBG "
                f"{label} lure={lure!r} "
                f"presentation={pres!r} expected_presentation={expected_pres!r} "
                f"soft_key={has_soft} soft_val={soft_val!r} "
                f"trailer_key={has_trailer} trailer_val={trailer_val!r} "
                f"trailer_req={trailer_req!r} trailer_bucket={trailer_bucket!r}"
            )

        # ---- call this once per request, right after JSON parse ----
        _dbg_pattern("primary", plan.get("primary", {}))
        _dbg_pattern("secondary", plan.get("secondary", {}))

        # Return plan
        return plan

    except Exception as e:
        print(f"LLM_PLAN ERROR: {type(e).__name__} {repr(e)}")
        return None


# ============================================================================
# PART 3: Post-processing and Validation functions
# ============================================================================

# ----------------------------------------
# Validation (service-level, aligned to Bass Clarity rules)
# - Uses TARGET_DEFINITIONS.keys() as canonical targets
# ----------------------------------------
def validate_llm_plan(
    plan: Dict[str, Any],
    is_member: bool = False,
    user_primary_lure: Optional[str] = None,
    user_secondary_lure: Optional[str] = None,
) -> Tuple[bool, List[str]]:
    """
    Validate LLM output against canonical rules.
    Returns (is_valid, list_of_errors)

    Args:
        plan: LLM output to validate
        is_member: If True, expects primary + secondary patterns
        user_primary_lure: If set, user selected this lure (bypass some validations)
        user_secondary_lure: If set, user selected this lure (bypass some validations)
    """
    import re

    errors: List[str] = []

    # Determine which structure to expect
    if is_member:
        if "primary" not in plan or "secondary" not in plan:
            errors.append("Member plan must have 'primary' and 'secondary' patterns")
            return False, errors

        errors.extend(_validate_pattern(plan["primary"], "primary"))
        errors.extend(_validate_pattern(plan["secondary"], "secondary"))

        # Presentations must differ (exact string) AND must come from different
        # presentation families (e.g., no Bottom Contact + Bottom Contact).
        # EXCEPTION: If user selected BOTH lures, they chose intentionally - skip this check.
        p1 = plan.get("primary", {}).get("presentation")
        p2 = plan.get("secondary", {}).get("presentation")
        user_selected_both = user_primary_lure and user_secondary_lure
        if not user_selected_both:
            if p1 == p2:
                errors.append("Primary and secondary must have DIFFERENT presentations")
            if _presentation_family(p1) == _presentation_family(p2):
                errors.append(
                    "Primary and secondary must be from DIFFERENT presentation families"
                )

        # shared fields
        for field in ("day_progression", "outlook_blurb"):
            if field not in plan:
                errors.append("Missing required shared field: " + field)
    else:
        required = [
            "presentation",
            "base_lure",
            "color_recommendations",
            "targets",
            "why_this_works",
            "work_it",
            "day_progression",
            "outlook_blurb",
        ]
        for field in required:
            if field not in plan:
                errors.append("Missing required field: " + field)
        if not errors:
            errors.extend(_validate_pattern(plan, "plan"))

    # day progression
    day_prog = plan.get("day_progression", [])
    if not isinstance(day_prog, list) or len(day_prog) != 3:
        length_str = str(len(day_prog)) if isinstance(day_prog, list) else "not a list"
        errors.append("day_progression must have exactly 3 lines, got " + length_str)
    else:
        for i, line in enumerate(day_prog):
            if i == 0 and not str(line).startswith("Morning:"):
                errors.append("day_progression line 0 must start with 'Morning:'")
            elif i == 1 and not str(line).startswith("Midday:"):
                errors.append("day_progression line 1 must start with 'Midday:'")
            elif i == 2 and not (str(line).startswith("Evening:") or str(line).startswith("Late:")):
                errors.append("day_progression line 2 must start with 'Evening:' or 'Late:'")

            # crude color check (no parentheses / no "in green pumpkin" patterns)
            if "(" in str(line) or ") in " in str(line).lower():
                errors.append("day_progression line " + str(i) + " contains color (not allowed)")

    # outlook blurb
    outlook = plan.get("outlook_blurb", "")
    if not outlook or len(str(outlook).strip()) < 20:
        errors.append("outlook_blurb is too short (need 2-3 sentences)")

    # block exact temp/wind mentions in outlook
    temp_pattern = r"\d+\s*°?F"
    wind_pattern = r"\d+\s*mph"
    if re.search(temp_pattern, str(outlook)):
        errors.append("outlook_blurb contains exact temperature (use descriptive language instead)")
    if re.search(wind_pattern, str(outlook)):
        errors.append("outlook_blurb contains exact wind speed (use descriptive language instead)")

    # block specific depth-in-water phrasing (allow retrieve distance like "drag 2-3 feet")
    depth_pattern = r"(?<!drag\s)(?<!hop\s)(?<!swim\s)(?<!move\s)(?<!pull\s)\d+[-–]?\d*\s*[-–]?\s*(feet|ft|foot)\s+(of\s+water|deep|depth|down)"

    all_text_fields: List[str] = []
    if is_member:
        all_text_fields.extend(
            [
                str(plan.get("outlook_blurb", "")),
                str(plan.get("primary", {}).get("why_this_works", "")),
                " ".join([str(x) for x in plan.get("primary", {}).get("work_it", [])]),
                str(plan.get("secondary", {}).get("why_this_works", "")),
                " ".join([str(x) for x in plan.get("secondary", {}).get("work_it", [])]),
                " ".join([str(x) for x in plan.get("day_progression", [])]),
            ]
        )
    else:
        all_text_fields.extend(
            [
                str(plan.get("outlook_blurb", "")),
                str(plan.get("why_this_works", "")),
                " ".join([str(x) for x in plan.get("work_it", [])]),
                " ".join([str(x) for x in plan.get("day_progression", [])]),
            ]
        )

    for text in all_text_fields:
        m = re.search(depth_pattern, text, re.IGNORECASE)
        if m:
            errors.append("Plan contains specific depth mention (not allowed): " + m.group())
            break

    return (len(errors) == 0), errors


def _validate_pattern(pattern: Dict[str, Any], pattern_name: str) -> List[str]:
    """Validate a single pattern (primary/secondary/flat plan)"""
    errors: List[str] = []

    required = ["presentation", "base_lure", "color_recommendations", "targets", "why_this_works", "work_it"]
    for field in required:
        if field not in pattern:
            errors.append(pattern_name + ": Missing required field: " + field)

    if errors:
        return errors

    # presentation validity
    if pattern["presentation"] not in PRESENTATIONS:
        errors.append(pattern_name + ": Invalid presentation: " + pattern["presentation"])

    # lure validity
    base_lure = pattern["base_lure"]
    if base_lure not in LURE_POOL:
        errors.append(pattern_name + ": Invalid base_lure: " + base_lure)

    # AUTO-CORRECT presentation BEFORE validation (most common LLM hallucination)
    if base_lure in LURE_POOL and "presentation" in pattern:
        expected_pres = LURE_TO_PRESENTATION.get(base_lure)
        current_pres = pattern.get("presentation")
        if expected_pres and current_pres:
            if isinstance(expected_pres, list):
                if current_pres not in expected_pres:
                    print(f"AUTO-CORRECTED {pattern_name}: presentation '{current_pres}' -> '{expected_pres[0]}' for {base_lure}")
                    pattern["presentation"] = expected_pres[0]
            else:
                if current_pres != expected_pres:
                    print(f"AUTO-CORRECTED {pattern_name}: presentation '{current_pres}' -> '{expected_pres}' for {base_lure}")
                    pattern["presentation"] = expected_pres

    # lure matches presentation
    lure_errs = validate_lure_and_presentation(base_lure, pattern["presentation"])
    errors.extend([pattern_name + ": " + err for err in lure_errs])

    # colors: 1-2 allowed by validator, but Bass Clarity prompt should provide exactly 2
    colors = pattern["color_recommendations"]
    if not isinstance(colors, list) or not (1 <= len(colors) <= 2):
        length_str = str(len(colors)) if isinstance(colors, list) else "not a list"
        errors.append(pattern_name + ": color_recommendations must be 1-2 colors, got " + length_str)
    else:
        soft_plastic = pattern.get("soft_plastic", None)
        valid_colors = get_color_pool_for_lure(base_lure, soft_plastic)

        # AUTO-CORRECT: Replace invalid colors with fallbacks
        corrected_colors = []
        for i, color in enumerate(colors):
            if color not in valid_colors:
                fallback = get_fallback_color(color, valid_colors)
                if fallback:
                    print(f"AUTO-CORRECTED {pattern_name}: color '{color}' -> '{fallback}' for {base_lure}")
                    corrected_colors.append(fallback)
                else:
                    # No fallback found - this will still error
                    corrected_colors.append(color)
                    errors.append(pattern_name + ": Invalid color '" + color + "' for " + base_lure + ". Allowed colors: " + str(valid_colors))
            else:
                corrected_colors.append(color)

        # Update pattern with corrected colors
        pattern["color_recommendations"] = corrected_colors
        colors = corrected_colors

        # additional lure/color compatibility checks
        color_errs = validate_colors_for_lure(base_lure, colors, soft_plastic)
        errors.extend([pattern_name + ": " + err for err in color_errs])

    # targets: canonical = TARGET_DEFINITIONS.keys()
    targets = pattern["targets"]
    if not isinstance(targets, list):
        errors.append(pattern_name + ": targets must be a list")
    else:
        if len(targets) != 3:
            errors.append(pattern_name + ": targets must have exactly 3 items, got " + str(len(targets)))
        canonical_targets = set(TARGET_DEFINITIONS.keys())
        for t in targets:
            if t not in canonical_targets:
                errors.append(pattern_name + ": Invalid target '" + t + "' (must be from TARGET_DEFINITIONS keys)")

    # ============================================================================
    # AUTO-CORRECTION: Fix LLM field confusion before validation
    # ============================================================================

    # If LLM set soft_plastic for a jig/bladed bait, handle it
    if base_lure in TRAILER_BUCKET_BY_LURE:
        if pattern.get("soft_plastic"):
            if not pattern.get("trailer"):
                # LLM set wrong field - move to trailer
                pattern["trailer"] = pattern["soft_plastic"]
                pattern["trailer_why"] = pattern.get("soft_plastic_why", "")
                print(f"AUTO-CORRECTED {pattern_name}: Moved soft_plastic='{pattern['trailer']}' to trailer field for {base_lure}")
            else:
                # LLM set BOTH fields - just clear soft_plastic since trailer is correct field
                print(f"AUTO-CORRECTED {pattern_name}: Cleared invalid soft_plastic='{pattern['soft_plastic']}' (trailer already set) for {base_lure}")
            pattern["soft_plastic"] = None
            pattern["soft_plastic_why"] = None
    
    # If LLM set trailer for terminal tackle, move it to soft_plastic field  
    if base_lure in TERMINAL_PLASTIC_MAP:
        if pattern.get("trailer") and not pattern.get("soft_plastic"):
            # LLM set wrong field - auto-correct
            pattern["soft_plastic"] = pattern["trailer"]
            pattern["soft_plastic_why"] = pattern.get("trailer_why", "")
            pattern["trailer"] = None
            pattern["trailer_why"] = None
            print(f"AUTO-CORRECTED {pattern_name}: Moved trailer='{pattern['soft_plastic']}' to soft_plastic field for {base_lure}")

    # soft_plastic rules
    if "soft_plastic" in pattern and pattern["soft_plastic"]:
        if base_lure in TERMINAL_PLASTIC_MAP:
            allowed_plastics = TERMINAL_PLASTIC_MAP[base_lure]
            if pattern["soft_plastic"] not in allowed_plastics:
                errors.append(pattern_name + ": soft_plastic '" + pattern["soft_plastic"] + "' not allowed for " + base_lure + ". Allowed: " + str(sorted(list(allowed_plastics))))
        else:
            errors.append(pattern_name + ": " + base_lure + " does not use soft_plastic field")

    # trailer rules
    if "trailer" in pattern and pattern["trailer"]:
        if base_lure in TRAILER_BUCKET_BY_LURE:
            bucket_name = TRAILER_BUCKET_BY_LURE[base_lure]

            if bucket_name == "JIG_TRAILERS":
                allowed_trailers = JIG_TRAILERS
            elif bucket_name == "CHATTER_SWIMJIG_TRAILERS":
                allowed_trailers = CHATTER_SWIMJIG_TRAILERS
            elif bucket_name == "SPINNER_BUZZ_TRAILERS":
                allowed_trailers = SPINNER_BUZZ_TRAILERS
            else:
                allowed_trailers = []
                errors.append(pattern_name + ": Unknown trailer bucket '" + bucket_name + "'")

            if pattern["trailer"] not in allowed_trailers:
                errors.append(pattern_name + ": trailer '" + pattern["trailer"] + "' not allowed for " + base_lure + ". Allowed: " + str(sorted(list(allowed_trailers))))
        else:
            errors.append(pattern_name + ": " + base_lure + " does not use trailer field")

    return errors

# ============================================================================
# PART 4: Main generation function with retries
# ============================================================================

# async def generate_llm_plan_with_retries(
#     weather: dict,
#     phase: str,
#     location: str,
#     latitude: float,
#     longitude: float,
#     access_type: str = "boat",
#     is_member: bool = False,
#     current_lake_name: str = "",
#     recent_primary_lures: list[str] = None,
#     recent_secondary_lures: list[str] = None,
#     regen_context: dict = None,
#     max_attempts: int = 5,
# ) -> dict:
#     """
#     Generate LLM plan with validation and retries.
#     Returns validated plan or None.

#     Args:
#         weather: Weather data
#         location: Location name
#         latitude: Latitude
#         longitude: Longitude
#         access_type: "boat" or "bank" - filters accessible targets
#         is_member: All users are members now (kept for compatibility)
#         current_lake_name: Current lake name for regeneration context
#         recent_primary_lures: List of recently used primary lures
#         recent_secondary_lures: List of recently used secondary lures
#         regen_context: Context dict with last_lake_name, minutes_since_last_gen, last_combination
#         max_attempts: Number of retry attempts
#     """
#     # Best-effort: load seasonal policy and preselect targets once for the retry loop
#     seasonal_policy = _load_seasonal_policy(phase)
#     print(f"LLM_PLAN [{phase}]")
#     print(seasonal_policy["phase"])
    
#     accessible_targets = filter_targets_by_access(access_type)
#     # targets_pool = _select_diverse_targets(
#     #     accessible_targets=accessible_targets,
#     #     phase=phase,
#     #     access_type=access_type,
#     #     weather={
#     #         "wind_mph": weather.get("wind_mph") or weather.get("wind_speed"),
#     #         "wind_speed": weather.get("wind_speed"),
#     #     },
#     #     k=5,
#     # )
#     # primary_targets = targets_pool[:3]
#     # secondary_targets = [targets_pool[0], targets_pool[3], targets_pool[4]]

#     for attempt in range(max_attempts):
#         plan = await call_openai_plan(
#             weather=weather,
#             phase=phase,
#             location=location,
#             latitude=latitude,
#             longitude=longitude,
#             access_type=access_type,
#             is_member=is_member,
#             current_lake_name=current_lake_name,
#             recent_primary_lures=recent_primary_lures,
#             recent_secondary_lures=recent_secondary_lures,
#             regen_context=regen_context,
#             seasonal_policy=seasonal_policy,
#             primary_targets= None,
#             secondary_targets= None
#         )
#         if plan is not None:
#          _log_color_intent(f"raw_llm_attempt_{attempt + 1}", plan)

#         if not plan:
#             await asyncio.sleep(0.75 * (attempt + 1))
#             print("LLM_PLAN: Attempt " + str(attempt + 1) + " failed (no response)")
#             continue
        

#         # Validate plan
#         is_valid, errors = validate_llm_plan(plan, is_member=is_member)
#         # Layer seasonal/target constraints on top (non-breaking; only enforced when present)
#         extra_errors = _validate_policy_constraints(plan, seasonal_policy, primary_targets, secondary_targets)
#         if extra_errors:
#             is_valid = False
#             errors.extend(extra_errors)

#         if is_valid:
#             try:
#                 plan = expand_plan_color_zones(plan, is_member=is_member)
#             except Exception as e:
#                 print("LLM_PLAN: Color zone expansion failed: " + str(e))
#                 return plan  # return valid plan without enrichment


#             return plan

#         print("LLM_PLAN: Attempt " + str(attempt + 1) + " validation failed:")
#         for err in errors[:6]:
#             print("  - " + err)

#         await asyncio.sleep(0.75 * (attempt + 1))

#     print("LLM_PLAN: All attempts failed")
#     return None

# In app/services/llm_plan_service.py

async def generate_llm_plan_with_retries(
    weather: dict,
    phase: str,
    location: str,
    latitude: float,
    longitude: float,
    access_type: str = "boat",
    is_member: bool = False,
    current_lake_name: str = "",
    recent_primary_lures: list[str] = None,
    recent_secondary_lures: list[str] = None,
    regen_context: dict = None,
    max_attempts: int = 5,
    user_primary_lure: Optional[str] = None,
    user_secondary_lure: Optional[str] = None,
) -> dict:
    """
    Generate LLM plan with validation and retries.
    Returns validated plan or None.
    """
    # Best-effort: load seasonal policy
    seasonal_policy = _load_seasonal_policy(phase)
    print(f"LLM_PLAN [{phase}]")
    print(seasonal_policy["phase"])
    
    accessible_targets = filter_targets_by_access(access_type)

    # ✅ FIX: Explicitly define these as None. 
    # This prevents the "name 'primary_targets' is not defined" error in the validation step below.
    primary_targets = None
    secondary_targets = None

    # ❌ PREVIOUSLY COMMENTED OUT BLOCK (Kept commented for reference)
    # targets_pool = _select_diverse_targets(...)
    # primary_targets = targets_pool[:3]
    # secondary_targets = [targets_pool[0], targets_pool[3], targets_pool[4]]

    for attempt in range(max_attempts):
        plan = await call_openai_plan(
            weather=weather,
            phase=phase,
            location=location,
            latitude=latitude,
            longitude=longitude,
            access_type=access_type,
            is_member=is_member,
            current_lake_name=current_lake_name,
            recent_primary_lures=recent_primary_lures,
            recent_secondary_lures=recent_secondary_lures,
            regen_context=regen_context,
            seasonal_policy=seasonal_policy,
            primary_targets=primary_targets,
            secondary_targets=secondary_targets,
            user_primary_lure=user_primary_lure,
            user_secondary_lure=user_secondary_lure,
        )

        if plan is not None:
             _log_color_intent(f"raw_llm_attempt_{attempt + 1}", plan)

        if not plan:
            await asyncio.sleep(0.75 * (attempt + 1))
            print("LLM_PLAN: Attempt " + str(attempt + 1) + " failed (no response)")
            continue
        
        # Validate plan (user-selected lures bypass some constraints)
        is_valid, errors = validate_llm_plan(
            plan, is_member=is_member,
            user_primary_lure=user_primary_lure, user_secondary_lure=user_secondary_lure
        )
        
        # ✅ FIX: Now this line works because primary_targets is defined (as None)
        # The validator handles None gracefully by skipping the target check.
        # User-selected lures bypass seasonal policy validation.
        extra_errors = _validate_policy_constraints(
            plan, seasonal_policy, primary_targets, secondary_targets,
            user_primary_lure=user_primary_lure, user_secondary_lure=user_secondary_lure
        )
        
        if extra_errors:
            is_valid = False
            errors.extend(extra_errors)

        if is_valid:
            try:
                plan = expand_plan_color_zones(plan, is_member=is_member)
            except Exception as e:
                print("LLM_PLAN: Color zone expansion failed: " + str(e))
                return plan  # return valid plan without enrichment

            return plan

        print("LLM_PLAN: Attempt " + str(attempt + 1) + " validation failed:")
        for err in errors[:6]:
            print("  - " + err)

        await asyncio.sleep(0.75 * (attempt + 1))

    print("LLM_PLAN: All attempts failed")
    return None

def llm_enabled() -> bool:
    """Check if LLM plan generation is enabled"""
    return os.getenv("LLM_PLAN_ENABLED", "").strip().lower() in ("1", "true", "yes", "on")