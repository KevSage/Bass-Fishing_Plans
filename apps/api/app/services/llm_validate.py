# apps/api/app/services/llm_validate.py
from __future__ import annotations
import re
from typing import Any, Dict, List, Tuple, Set, Optional
from app.canon.targets import CANONICAL_TARGETS

# ✅ UPDATED IMPORTS: Get the specific validation function
try:
    from app.canon.pools import LURE_POOL, COLOR_POOL, get_color_pool_for_lure
except Exception:
    LURE_POOL = []
    COLOR_POOL = []
    def get_color_pool_for_lure(lure, soft_plastic=None): return []

def _as_set(xs: List[str]) -> Set[str]:
    return set([x for x in xs if isinstance(x, str) and x.strip()])

def _is_list_str(xs: Any) -> bool:
    return isinstance(xs, list) and all(isinstance(x, str) for x in xs)

def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())

def _starts_with_day_prefix(lines: List[str]) -> bool:
    if len(lines) != 3: return False
    return lines[0].startswith("Morning:") and lines[1].startswith("Midday:") and lines[2].startswith("Late:")

def _collect_text_fields(plan: Dict[str, Any]) -> str:
    parts: List[str] = []
    def add(x: Any):
        if isinstance(x, str): parts.append(x)
        elif isinstance(x, list):
            for i in x:
                if isinstance(i, str): parts.append(i)
    add(plan.get("outlook_blurb"))
    add(plan.get("strategy_tips"))
    add(plan.get("day_progression"))
    for key in ("primary", "counter"):
        p = plan.get(key) or {}
        add(p.get("pattern_summary"))
        add(p.get("how_to_fish"))
    sp = plan.get("search_pick_apart") or {}
    add(sp.get("when_to_switch"))
    return "\n".join(parts)

def _contains_unknown_lure_tokens(text_blob: str, allowed_lures: Set[str]) -> List[str]:
    if not text_blob.strip(): return []
    blob = _norm(text_blob)
    candidates = [l for l in allowed_lures if len(l) >= 5]
    unknown_hits: List[str] = []
    bait_words = ["crank", "spinner", "chatter", "jerk", "dropshot", "drop shot", "texas", "carolina", "ned", "shaky", "jig", "buzz", "frog", "plopper", "walking", "popper", "swimbait", "underspin"]
    if not any(w in blob for w in bait_words): return []
    for lure in candidates:
        if _norm(lure) in blob: continue
    phrase_patterns = [r"\bfootball jig\b", r"\bcasting jig\b", r"\bspinnerbait\b", r"\bbuzzbait\b", r"\bchatterbait\b", r"\btexas rig\b", r"\bcarolina rig\b", r"\bned rig\b", r"\bshaky head\b", r"\bdrop shot\b", r"\bdropshot\b", r"\bjerkbait\b", r"\b(crankbait|lipless)\b", r"\b(swimbait|underspin)\b", r"\bwalking bait\b", r"\bpopper\b", r"\bfrog\b", r"\bplopper\b"]
    found_phrases: Set[str] = set()
    for pat in phrase_patterns:
        for m in re.finditer(pat, blob): found_phrases.add(m.group(0).strip())
    allowed_norm = set(_norm(x) for x in allowed_lures)
    for ph in sorted(found_phrases):
        if _norm(ph) not in allowed_norm: unknown_hits.append(ph)
    return unknown_hits

# ----------------------------
# Core validation
# ----------------------------

def validate_llm_plan_plan_only(plan: Dict[str, Any]) -> Tuple[bool, List[str]]:
    errors: List[str] = []
    allowed_lures = _as_set(LURE_POOL)
    allowed_targets = _as_set(CANONICAL_TARGETS)

    if not isinstance(plan.get("primary"), dict): errors.append("Missing required object: primary")
    if plan.get("counter") is not None and not isinstance(plan.get("counter"), dict): errors.append("counter must be an object or null")
    
    dp = plan.get("day_progression")
    if not _is_list_str(dp) or len(dp) != 3 or not _starts_with_day_prefix(dp):
        errors.append("day_progression must be 3 strings starting with Morning:/Midday:/Late:")

    def validate_pattern(block_name: str, p: Dict[str, Any]) -> None:
        lure = p.get("lure")
        if not isinstance(lure, str) or not lure.strip():
            errors.append(f"{block_name}.lure is required")
        elif allowed_lures and lure not in allowed_lures:
            errors.append(f"{block_name}.lure must be an exact member of LURE_POOL (got: {lure})")

        colors = p.get("colors")
        if not _is_list_str(colors) or not (1 <= len(colors) <= 2):
            errors.append(f"{block_name}.colors must be 1–2 strings")
        else:
            # ✅ UPDATED: Validate colors against the SPECIFIC LURE POOL
            if lure and lure in allowed_lures:
                try:
                    # Allow "junebug" for rigs, "sexy shad" for cranks, etc.
                    valid_pool = get_color_pool_for_lure(lure)
                    # Also include legacy pool as fallback if needed
                    full_valid_set = set(valid_pool) | set(COLOR_POOL)
                    
                    for c in colors:
                        if c not in full_valid_set:
                            errors.append(f"{block_name}.colors contains invalid color '{c}' for lure '{lure}'")
                except ValueError:
                    pass

        targets = p.get("targets")
        if not _is_list_str(targets) or not (3 <= len(targets) <= 5):
            errors.append(f"{block_name}.targets must be 3–5 strings")
        else:
            for t in targets:
                if t not in allowed_targets: errors.append(f"{block_name}.targets contains invalid target (got: {t})")

        htf = p.get("how_to_fish")
        if not _is_list_str(htf) or not (3 <= len(htf) <= 6): errors.append(f"{block_name}.how_to_fish must be 3–6 strings")

        gear = p.get("gear")
        if not isinstance(gear, dict): errors.append(f"{block_name}.gear is required")
        else:
            for k in ("rod", "reel", "line"):
                if not isinstance(gear.get(k), str) or not gear.get(k).strip(): errors.append(f"{block_name}.gear.{k} is required")

    primary = plan.get("primary") or {}
    if isinstance(primary, dict): validate_pattern("primary", primary)

    counter = plan.get("counter")
    if isinstance(counter, dict): validate_pattern("counter", counter)

    spa = plan.get("search_pick_apart")
    if spa is not None:
        if not isinstance(spa, dict): errors.append("search_pick_apart must be an object or null")
        else:
            for k in ("search_lure", "pick_apart_lure", "when_to_switch"):
                if not isinstance(spa.get(k), str) or not spa.get(k).strip(): errors.append(f"search_pick_apart.{k} is required")
            for k in ("search_lure", "pick_apart_lure"):
                v = spa.get(k)
                if isinstance(v, str) and allowed_lures and v not in allowed_lures: errors.append(f"search_pick_apart.{k} must be an exact member of LURE_POOL (got: {v})")
            for k in ("search_colors", "pick_apart_colors"):
                v = spa.get(k)
                if not _is_list_str(v) or not (1 <= len(v) <= 2): errors.append(f"search_pick_apart.{k} must be 1–2 strings")

    text_blob = _collect_text_fields(plan)
    unknown = _contains_unknown_lure_tokens(text_blob, allowed_lures)
    if unknown: errors.append("Text contains lure tokens not in LURE_POOL: " + ", ".join(sorted(set(unknown))))

    return (len(errors) == 0), errors

def build_repair_prompt(plan_json: Dict[str, Any], errors: List[str]) -> str:
    return (
        "You returned JSON that failed validation.\n"
        "Fix ONLY the listed issues. Do not add new fields.\n"
        "Return corrected JSON ONLY (no markdown, no prose).\n\n"
        f"VALIDATION_ERRORS:\n- " + "\n- ".join(errors) + "\n\n"
        f"YOUR_JSON:\n{plan_json}"
    )