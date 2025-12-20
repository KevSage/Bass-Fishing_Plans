# apps/api/app/canon/pools.py
from __future__ import annotations

"""
Canonical pools for BassFishingPlans / AnglerIQ.

RULES
- These are DATA ONLY.
- No validation logic.
- No imports from services or generators.
- Strings are LOCKED — LLM must match exactly.
"""

# ----------------------------------------
# PRESENTATION FAMILIES (LOCKED)
# ----------------------------------------

PRESENTATIONS = [
    "Horizontal Reaction",
    "Vertical Reaction",
    "Bottom Contact - Dragging",
    "Bottom Contact - Hopping / Targeted",
    "Hovering / Mid-Column Finesse",
    "Topwater - Horizontal",
    "Topwater - Precision / Vertical Surface Work",
]

# ----------------------------------------
# LURE CATALOG (LOCKED STRINGS)
# ----------------------------------------

LURE_POOL = [
    # Horizontal Reaction
    "shallow crankbait",
    "mid crankbait",
    "deep crankbait",
    "lipless crankbait",
    "chatterbait",
    "swim jig",
    "spinnerbait",
    "underspin",
    "paddle tail swimbait",

    # Vertical Reaction
    "jerkbait",
    "damiki rig",
    "blade bait",

    # Bottom Contact - Dragging
    "texas rig",
    "carolina rig",
    "football jig",
    "shaky head",

    # Bottom Contact - Hopping / Targeted
    "casting jig",

    # Hovering / Mid-Column Finesse
    "neko rig",
    "wacky rig",
    "weightless soft jerkbait",

    # Topwater - Horizontal
    "walking bait",
    "buzzbait",
    "whopper plopper",

    # Topwater - Precision / Vertical Surface Work
    "hollow body frog",
    "popping frog",
]

# ----------------------------------------
# LURE → PRESENTATION MAP (LOCKED)
# ----------------------------------------

LURE_TO_PRESENTATION = {
    "shallow crankbait": "Horizontal Reaction",
    "mid crankbait": "Horizontal Reaction",
    "deep crankbait": "Horizontal Reaction",
    "lipless crankbait": "Horizontal Reaction",
    "chatterbait": "Horizontal Reaction",
    "swim jig": "Horizontal Reaction",
    "spinnerbait": "Horizontal Reaction",
    "underspin": "Horizontal Reaction",
    "paddle tail swimbait": "Horizontal Reaction",

    "jerkbait": "Vertical Reaction",
    "damiki rig": "Vertical Reaction",
    "blade bait": "Vertical Reaction",

    "texas rig": "Bottom Contact - Dragging",
    "carolina rig": "Bottom Contact - Dragging",
    "football jig": "Bottom Contact - Dragging",
    "shaky head": "Bottom Contact - Dragging",

    "casting jig": "Bottom Contact - Hopping / Targeted",

    "neko rig": "Hovering / Mid-Column Finesse",
    "wacky rig": "Hovering / Mid-Column Finesse",
    "weightless soft jerkbait": "Hovering / Mid-Column Finesse",

    "walking bait": "Topwater - Horizontal",
    "buzzbait": "Topwater - Horizontal",
    "whopper plopper": "Topwater - Horizontal",

    "hollow body frog": "Topwater - Precision / Vertical Surface Work",
    "popping frog": "Topwater - Precision / Vertical Surface Work",
}

# ----------------------------------------
# COLORS (LOCKED — GENERIC POOL)
# ----------------------------------------

COLOR_POOL = [
    # Natural / Clear
    "green pumpkin",
    "watermelon",
    "watermelon red",
    "smoke",

    # Baitfish / Shad
    "natural shad",
    "ghost shad",
    "baitfish",
    "shad",
    "white",
    "pearl",
    "bone",

    # Craw / Bluegill
    "black/blue",
    "green pumpkin blue",
    "bluegill",
    "brown",
    "orange belly",

    # High-Contrast / Dirty
    "chartreuse",
    "chartreuse/white",
    "firetiger",

    # Metallic / Hardbait context
    "gold",
    "bronze",
    "silver",
]

# ----------------------------------------
# SOFT PLASTIC POOLS (LOCKED)
# ----------------------------------------

BOTTOM_CONTACT_PLASTICS = [
    "creature bait",
    "craw",
    "ribbon tail worm",
    "straight tail worm",
    "finesse worm",
    "lizard",
]

BAITFISH_PLASTICS = [
    "small minnow",
    "soft jerkbait",
    "paddle tail swimbait",
]

JIG_TRAILERS = [
    "craw",
    "chunk",
]

# ----------------------------------------
# CANONICAL TARGET POOL (LOCKED)
# ----------------------------------------

CANONICAL_TARGETS = [
    # Structural / Positional
    "secondary points",
    "main-lake points",
    "channel swings",
    "first depth break",
    "steeper breaks",
    "flats adjacent to deep water",
    "staging structure near spawning pockets",
    "basin-adjacent structure",
    "inside turns",
    "outside bends",

    # Cover-Oriented
    "bottom-oriented cover: wood/rock/grasslines",
    "isolated cover",
    "edges of vegetation",
    "hard-bottom transitions",
    "docks and man-made structure",

    # Environmental / Condition-Driven
    "wind-blown banks",
    "wind-blown points",
    "shallow warm pockets",
    "shade lines and shadow edges",
    "current-influenced areas",
]

# ----------------------------------------
# TERMINAL TACKLE → PLASTIC MAP (LOCKED)
# ----------------------------------------

TERMINAL_PLASTIC_MAP = {
    "texas rig": set([
        "creature bait", "craw", "ribbon tail worm",
        "straight tail worm", "finesse worm", "lizard",
    ]),
    "carolina rig": set([
        "creature bait", "craw", "ribbon tail worm",
        "straight tail worm", "finesse worm", "lizard",
    ]),
    "shaky head": set(["straight tail worm", "finesse worm"]),
    "ned rig": set(["finesse worm", "straight tail worm"]),
    "neko rig": set(["straight tail worm", "finesse worm"]),
    "wacky rig": set(["straight tail worm", "finesse worm"]),
    # STRICT: dropshot can ONLY be these
    "dropshot": set(["finesse worm", "small minnow"]),
}

# ----------------------------------------
# TRAILER REQUIREMENTS (LOCKED)
# - required: must include trailer field
# - optional: may include trailer field
# - terminal: must include terminal_plastic (not trailer)
# - none: must not include trailer field
# ----------------------------------------

TRAILER_REQUIREMENT = {
    # mandatory trailers
    "chatterbait": "required",
    "swim jig": "required",
    "casting jig": "required",
    "football jig": "required",

    # optional trailers
    "spinnerbait": "optional",
    "buzzbait": "optional",

    # terminal tackle rigs (use terminal_plastic instead)
    "texas rig": "terminal",
    "carolina rig": "terminal",
    "shaky head": "terminal",
    "ned rig": "terminal",
    "neko rig": "terminal",
    "wacky rig": "terminal",
    "dropshot": "terminal",

    # everything else
    "shallow crankbait": "none",
    "mid crankbait": "none",
    "deep crankbait": "none",
    "lipless crankbait": "none",
    "underspin": "none",
    "paddle tail swimbait": "none",
    "jerkbait": "none",
    "damiki rig": "none",
    "blade bait": "none",
    "weightless soft jerkbait": "none",
    "walking bait": "none",
    "whopper plopper": "none",
    "hollow body frog": "none",
    "popping frog": "none",
}

# For "required"/"optional": which trailer bucket is legal
TRAILER_BUCKET_BY_LURE = {
    # jig-style only: craw OR chunk (chunk restricted further)
    "casting jig": "JIG_TRAILERS",
    "football jig": "JIG_TRAILERS",

    # chatterbait/swim jig: craw OR baitfish-style (NO grub; you locked that)
    "chatterbait": "CHATTER_SWIMJIG_TRAILERS",
    "swim jig": "CHATTER_SWIMJIG_TRAILERS",

    # optional trailer baits: baitfish-style only (no chunk)
    "spinnerbait": "SPINNER_BUZZ_TRAILERS",
    "buzzbait": "SPINNER_BUZZ_TRAILERS",
}

CHATTER_SWIMJIG_TRAILERS = [
    "craw",
    "soft jerkbait",
    "paddle tail swimbait",
]

SPINNER_BUZZ_TRAILERS = [
    "soft jerkbait",
    "paddle tail swimbait",
]

# ----------------------------------------
# HARD BAIT RESTRICTIONS (LOCKED)
# ----------------------------------------
# Rule:
# - These colors may ONLY be used on hard baits.
# - If a plan selects one of these colors for a non-hard-bait lure, validation fails.
HARD_BAIT_ONLY_COLORS = {
    "gold",
    "bronze",
    "silver",
    "firetiger",
}

# Rule:
# - These are the "hard bait" lures in our current catalog.
# - (We are NOT treating frogs as hard baits.)
HARDBAIT_LURES = {
    "shallow crankbait",
    "mid crankbait",
    "deep crankbait",
    "lipless crankbait",
    "jerkbait",
    "walking bait",
    "whopper plopper",
}




CHUNK_ALLOWED_BASE_LURES = {"casting jig", "football jig"}  # chunk is jig-only
BOTTOM_JIGS = {"casting jig", "football jig"}
BAITFISH_SET = {"soft jerkbait", "small minnow", "paddle tail swimbait"}

# ----------------------------------------
# VALIDATION HELPERS (LOCKED)
# ----------------------------------------

def _lower(x) -> str:
    return str(x or "").strip().lower()

def validate_lure_and_presentation(lure: str, presentation: str) -> list[str]:
    errs: list[str] = []
    if lure not in LURE_POOL:
        errs.append(f"Invalid lure: {lure!r} (not in LURE_POOL)")
        return errs
    expected = LURE_TO_PRESENTATION.get(lure)
    if expected != presentation:
        errs.append(
            f"Presentation mismatch for {lure!r}: expected {expected!r}, got {presentation!r}"
        )
    return errs

def validate_terminal_plastic(base_lure: str, plastic: str | None) -> list[str]:
    """
    Terminal tackle uses terminal_plastic (NOT trailer).
    Also enforces your baitfish-ban on bottom/terminal rigs.
    """
    errs: list[str] = []
    if base_lure not in TERMINAL_PLASTIC_MAP:
        return errs  # not terminal tackle (or not enforced here)

    if not plastic:
        return [f"{base_lure} requires a terminal_plastic choice."]

    allowed = TERMINAL_PLASTIC_MAP[base_lure]
    if plastic not in allowed:
        errs.append(f"{base_lure} terminal_plastic must be one of: {sorted(allowed)}")

    # baitfish ban on bottom-contact terminal tackle
    if plastic in BAITFISH_SET:
        errs.append("Baitfish plastics are not allowed on bottom-contact terminal tackle.")

    # dropshot strict
    if base_lure == "dropshot" and plastic not in TERMINAL_PLASTIC_MAP["dropshot"]:
        errs.append("Dropshot terminal_plastic must be: finesse worm OR small minnow.")

    return errs

def validate_trailer(base_lure: str, trailer: str | None) -> list[str]:
    """
    Enforces:
    - required/optional/none/terminal behavior
    - chunk is jig-only
    - baitfish trailers banned on bottom jigs
    - bucket membership per lure
    """
    errs: list[str] = []
    req = TRAILER_REQUIREMENT.get(base_lure, "none")

    if req == "required" and not trailer:
        return [f"{base_lure} requires a trailer."]
    if req in ("none", "terminal") and trailer:
        return [f"{base_lure} must not include a trailer field."]

    if not trailer:
        return errs  # ok (either optional or none/terminal already handled)

    # chunk is jig-only
    if trailer == "chunk" and base_lure not in CHUNK_ALLOWED_BASE_LURES:
        errs.append("Chunk is only allowed for casting jig or football jig.")

    # ban baitfish-style trailers on bottom jigs
    if base_lure in BOTTOM_JIGS and trailer in BAITFISH_SET:
        errs.append("Soft jerkbaits/minnows/swimbaits are not allowed on bottom jigs.")

    # enforce trailer bucket membership
    bucket_key = TRAILER_BUCKET_BY_LURE.get(base_lure)
    if bucket_key == "JIG_TRAILERS":
        if trailer not in set(JIG_TRAILERS):
            errs.append(f"{base_lure} trailer must be one of: {JIG_TRAILERS}")
    elif bucket_key == "CHATTER_SWIMJIG_TRAILERS":
        if trailer not in set(CHATTER_SWIMJIG_TRAILERS):
            errs.append(f"{base_lure} trailer must be one of: {CHATTER_SWIMJIG_TRAILERS}")
    elif bucket_key == "SPINNER_BUZZ_TRAILERS":
        if trailer not in set(SPINNER_BUZZ_TRAILERS):
            errs.append(f"{base_lure} trailer must be one of: {SPINNER_BUZZ_TRAILERS}")
    else:
        # If the lure requires/permits a trailer but no bucket exists, that’s a config bug.
        if req in ("required", "optional"):
            errs.append(f"{base_lure} trailer bucket is not configured.")

    return errs


def validate_colors_for_lure(base_lure: str, colors: list[str]) -> list[str]:
    errs: list[str] = []
    # reuse existing basic checks
    errs.extend(validate_colors(colors))
    if errs:
        return errs

    # HARD-BAIT-ONLY colors must stay on HARDBAIT_LURES
    if any(c in HARD_BAIT_ONLY_COLORS for c in colors):
        if base_lure not in HARDBAIT_LURES:
            errs.append(
                f"{base_lure} cannot use metallic/fire tiger colors (silver/gold/bronze/firetiger are hardbait-only)."
            )

    # black/blue not allowed on jerkbait family + other hardbaits in V1
    if "black/blue" in colors:
        if base_lure in HARDBAIT_LURES or base_lure in {"weightless soft jerkbait"}:
            errs.append("black/blue is not allowed for jerkbaits/hardbaits in V1.")

    # spinnerbait: color refers to skirt, so metallic labels are not valid "colors" here
    if base_lure == "spinnerbait":
        if any(c in {"silver", "gold", "bronze"} for c in colors):
            errs.append("spinnerbait color_recommendations must describe the skirt, not blade finish.")

    return errs

# ----------------------------------------
# PLAN VALIDATION (LOCKED)
# ----------------------------------------
# LLM must output ONLY plan.plan.
# Backend validates against these canon pools.
#
# Rules:
# - LLM may only use exact strings from pools.
# - Lure must map to correct presentation.
# - Trailers/plastics must obey the hard restrictions.
# - Colors must obey COLOR_POOL (note: bait-specific color rules can be added later as a separate, explicit canon layer).
# - Targets must obey CANONICAL_TARGETS if you pass them as allowed targets.

from typing import Any, Dict, List, Optional

# Optional: if you keep CANONICAL_TARGETS in another file, import it here instead.
# If it's in this file, leave as-is.
try:
    CANONICAL_TARGETS  # type: ignore[name-defined]
except Exception:
    CANONICAL_TARGETS = None  # allow boot without targets until wired


def _is_str_list(x: Any) -> bool:
    return isinstance(x, list) and all(isinstance(i, str) for i in x)


def _req_str(plan: Dict[str, Any], key: str, errs: List[str]) -> Optional[str]:
    v = plan.get(key)
    if not isinstance(v, str) or not v.strip():
        errs.append(f"Missing/invalid '{key}' (must be non-empty string).")
        return None
    return v.strip()


def _req_list_str(plan: Dict[str, Any], key: str, errs: List[str], min_n: int = 0, max_n: Optional[int] = None) -> List[str]:
    v = plan.get(key)
    if not _is_str_list(v):
        errs.append(f"Missing/invalid '{key}' (must be list[str]).")
        return []
    out = [s.strip() for s in v if isinstance(s, str) and s.strip()]
    if len(out) < min_n:
        errs.append(f"'{key}' must contain at least {min_n} item(s).")
    if max_n is not None and len(out) > max_n:
        errs.append(f"'{key}' must contain at most {max_n} item(s).")
    return out


def validate_plan_plan(plan: Dict[str, Any]) -> List[str]:
    """
    Validates the LLM-returned plan.plan object only.

    Returns: list[str] errors. Empty = valid.
    """
    errs: List[str] = []
    if not isinstance(plan, dict):
        return ["plan.plan must be an object"]

    # --- Required high-level keys (minimal; keep permissive to avoid schema churn) ---
    presentation = _req_str(plan, "primary_presentation", errs)  # must be one of PRESENTATIONS
    primary_lure = _req_str(plan, "primary_lure", errs)          # must be one of LURE_POOL
    colors = _req_list_str(plan, "color_recommendations", errs, min_n=1, max_n=2)

    # Plan supports 1+ lures (preview may be 1; members typically 2; optional 3 only for search+pick-apart strategy later)
    lures = _req_list_str(plan, "recommended_lures", errs, min_n=1, max_n=3)

    # Targets: 3–5, must be canonical if CANONICAL_TARGETS exists
    targets = _req_list_str(plan, "recommended_targets", errs, min_n=3, max_n=5)
    if CANONICAL_TARGETS:
        allowed_targets = set(CANONICAL_TARGETS)
        for t in targets:
            if t not in allowed_targets:
                errs.append(f"Invalid target: {t!r} (not in CANONICAL_TARGETS)")

    # Optional: counter pattern (Pattern 2) — if present, validate similarly
    p2 = plan.get("pattern_2")
    if p2 is not None and not isinstance(p2, dict):
        errs.append("pattern_2 must be an object if present.")

    # --- Presentation validation ---
    if presentation and presentation not in PRESENTATIONS:
        errs.append(f"Invalid primary_presentation: {presentation!r} (not in PRESENTATIONS)")

    # --- Lure validation (primary + list) ---
    if primary_lure and primary_lure not in LURE_POOL:
        errs.append(f"Invalid primary_lure: {primary_lure!r} (not in LURE_POOL)")

    for lure in lures:
        if lure not in LURE_POOL:
            errs.append(f"Invalid recommended_lure: {lure!r} (not in LURE_POOL)")

    # Primary lure must match declared presentation
    if primary_lure and presentation:
        errs.extend(validate_lure_and_presentation(primary_lure, presentation))

    # --- Colors ---
    errs.extend(validate_colors(colors))

    # --- Trailer / terminal plastic logic (primary lure) ---
    # We support:
    # - terminal tackle (texas rig, carolina rig, shaky head...) => plan.primary_plastic required
    # - jig-style baits with required/optional trailers => plan.trailer optional/required based on TRAILER_REQUIREMENT
    primary_plastic = plan.get("primary_plastic")
    trailer = plan.get("trailer")

    if primary_lure:
        req = TRAILER_REQUIREMENT.get(primary_lure, "none")

        if req == "terminal":
            # Terminal tackle requires plastic, and must not have 'trailer' field
            errs.extend(validate_terminal_plastic(primary_lure, primary_plastic if isinstance(primary_plastic, str) else None))
            if trailer is not None:
                errs.append(f"{primary_lure} must not include 'trailer' (terminal tackle uses 'primary_plastic').")

        elif req in ("required", "optional"):
            # Jig-style: validate trailer; must not have primary_plastic (unless you *intentionally* allow both later)
            errs.extend(validate_trailer(primary_lure, trailer if isinstance(trailer, str) else None))
            if primary_plastic is not None:
                errs.append(f"{primary_lure} must not include 'primary_plastic' (use 'trailer' for jig-style baits).")

        else:
            # none
            if trailer is not None:
                errs.append(f"{primary_lure} must not include 'trailer'.")
            if primary_plastic is not None and primary_lure not in TERMINAL_PLASTIC_MAP:
                errs.append(f"{primary_lure} must not include 'primary_plastic'.")

    # --- Validate Pattern 2 if present ---
    if isinstance(p2, dict):
        p2_pres = p2.get("presentation")
        p2_lure = p2.get("lure")

        if p2_pres is not None and (not isinstance(p2_pres, str) or p2_pres not in PRESENTATIONS):
            errs.append(f"Invalid pattern_2.presentation: {p2_pres!r} (must be one of PRESENTATIONS)")

        if p2_lure is not None:
            if not isinstance(p2_lure, str) or p2_lure not in LURE_POOL:
                errs.append(f"Invalid pattern_2.lure: {p2_lure!r} (must be one of LURE_POOL)")
            elif isinstance(p2_pres, str):
                errs.extend(validate_lure_and_presentation(p2_lure, p2_pres))

        p2_cols = p2.get("colors")
        if p2_cols is not None:
            if not _is_str_list(p2_cols):
                errs.append("pattern_2.colors must be list[str] if present.")
            else:
                errs.extend(validate_colors([c.strip() for c in p2_cols if isinstance(c, str)]))

        # Pattern 2 trailer/plastic (optional)
        if isinstance(p2_lure, str):
            p2_req = TRAILER_REQUIREMENT.get(p2_lure, "none")
            p2_plastic = p2.get("plastic")
            p2_trailer = p2.get("trailer")

            if p2_req == "terminal":
                errs.extend(validate_terminal_plastic(p2_lure, p2_plastic if isinstance(p2_plastic, str) else None))
                if p2_trailer is not None:
                    errs.append(f"{p2_lure} must not include pattern_2.trailer (terminal tackle uses pattern_2.plastic).")

            elif p2_req in ("required", "optional"):
                errs.extend(validate_trailer(p2_lure, p2_trailer if isinstance(p2_trailer, str) else None))
                if p2_plastic is not None:
                    errs.append(f"{p2_lure} must not include pattern_2.plastic (use pattern_2.trailer).")

            else:
                if p2_trailer is not None:
                    errs.append(f"{p2_lure} must not include pattern_2.trailer.")
                if p2_plastic is not None and p2_lure not in TERMINAL_PLASTIC_MAP:
                    errs.append(f"{p2_lure} must not include pattern_2.plastic.")

    return errs


# Convenience: raise-style wrapper (optional)
def assert_valid_plan_plan(plan: Dict[str, Any]) -> None:
    errs = validate_plan_plan(plan)
    if errs:
        raise ValueError("; ".join(errs))
    
# ----------------------------------------
# VALIDATORS (LOCKED)
# Keep these in pools.py so nothing imports undefined functions.
# ----------------------------------------


def _is_str_list(x: Any) -> bool:
    return isinstance(x, list) and all(isinstance(i, str) for i in x)

def validate_colors(colors: list[str]) -> list[str]:
    """
    Validate 1-2 colors, must be in COLOR_POOL (exact string match).
    """
    errs: list[str] = []
    if not isinstance(colors, list):
        return ["color_recommendations must be a list"]
    if len(colors) == 0 or len(colors) > 2:
        errs.append("color_recommendations must contain 1-2 colors")
    for c in colors:
        if c not in COLOR_POOL:
            errs.append(f"Invalid color: {c!r} (not in COLOR_POOL)")
    return errs

def validate_lures(lures: list[str]) -> list[str]:
    """
    Validate lures are in LURE_POOL (exact string match).
    """
    errs: list[str] = []
    if not isinstance(lures, list):
        return ["recommended_lures must be a list"]
    if len(lures) == 0:
        errs.append("recommended_lures must contain at least 1 lure")
        return errs
    for l in lures:
        if l not in LURE_POOL:
            errs.append(f"Invalid lure: {l!r} (not in LURE_POOL)")
    return errs

def validate_targets(targets: list[str], *, min_n: int = 3, max_n: int = 5) -> list[str]:
    """
    Validate targets are selected from CANONICAL_TARGETS (exact match).
    """
    errs: list[str] = []
    if not isinstance(targets, list):
        return ["recommended_targets must be a list"]
    if len(targets) < min_n or len(targets) > max_n:
        errs.append(f"recommended_targets must contain {min_n}-{max_n} targets")
    allowed = set(CANONICAL_TARGETS or [])
    for t in targets:
        if t not in allowed:
            errs.append(f"Invalid target: {t!r} (not in CANONICAL_TARGETS)")
    return errs

def validate_plan_plan(plan: Dict[str, Any]) -> list[str]:
    """
    Validates ONLY the LLM-returned plan.plan object.

    Expected minimal keys (stable, not UI/markdown):
      - primary_presentation: str (must be in PRESENTATIONS)
      - recommended_lures: list[str] (1–3)
      - recommended_targets: list[str] (3–5, must be in CANONICAL_TARGETS)
      - color_recommendations: list[str] (1–2, must be in COLOR_POOL)

    Optional keys (allowed but validated if present):
      - pattern_2: { lure, presentation, color_recommendations, recommended_targets, trailer/plastic }
      - trailer / primary_plastic (validated via validate_trailer / validate_terminal_plastic)
    """
    errs: list[str] = []
    if not isinstance(plan, dict):
        return ["plan.plan must be an object"]

    # --- required ---
    pres = plan.get("primary_presentation")
    if not isinstance(pres, str) or pres not in PRESENTATIONS:
        errs.append("primary_presentation must be one of PRESENTATIONS")

    lures = plan.get("recommended_lures") or []
    if not _is_str_list(lures):
        errs.append("recommended_lures must be list[str]")
        lures = []
    errs.extend(validate_lures(list(lures)))

    targets = plan.get("recommended_targets") or []
    if not _is_str_list(targets):
        errs.append("recommended_targets must be list[str]")
        targets = []
    errs.extend(validate_targets(list(targets), min_n=3, max_n=5))

    colors = plan.get("color_recommendations") or []
    if not _is_str_list(colors):
        errs.append("color_recommendations must be list[str]")
        colors = []
    errs.extend(validate_colors(list(colors)))

    # --- trailer/plastic rules for primary lure (if we have one) ---
    primary_lure = lures[0] if isinstance(lures, list) and lures else None
    if isinstance(primary_lure, str) and primary_lure in LURE_POOL:
        req = TRAILER_REQUIREMENT.get(primary_lure, "none")
        trailer = plan.get("trailer")
        plastic = plan.get("primary_plastic")

        if req == "terminal":
            errs.extend(validate_terminal_plastic(primary_lure, plastic if isinstance(plastic, str) else None))
            if trailer is not None:
                errs.append(f"{primary_lure} must not include 'trailer' (terminal tackle uses 'primary_plastic').")

        elif req in ("required", "optional"):
            errs.extend(validate_trailer(primary_lure, trailer if isinstance(trailer, str) else None))
            if plastic is not None:
                errs.append(f"{primary_lure} must not include 'primary_plastic' (use 'trailer').")

        else:
            if trailer is not None:
                errs.append(f"{primary_lure} must not include 'trailer'.")
            if plastic is not None and primary_lure not in TERMINAL_PLASTIC_MAP:
                errs.append(f"{primary_lure} must not include 'primary_plastic'.")

    # --- pattern_2 (optional) ---
    p2 = plan.get("pattern_2")
    if p2 is not None:
        if not isinstance(p2, dict):
            errs.append("pattern_2 must be an object")
        else:
            p2_lure = p2.get("lure")
            p2_pres = p2.get("presentation")

            if not isinstance(p2_lure, str) or p2_lure not in LURE_POOL:
                errs.append("pattern_2.lure must be one of LURE_POOL")
            if not isinstance(p2_pres, str) or p2_pres not in PRESENTATIONS:
                errs.append("pattern_2.presentation must be one of PRESENTATIONS")

            if isinstance(p2_lure, str) and isinstance(p2_pres, str):
                errs.extend(validate_lure_and_presentation(p2_lure, p2_pres))

            p2_colors = p2.get("color_recommendations") or []
            if p2_colors:
                if not _is_str_list(p2_colors):
                    errs.append("pattern_2.color_recommendations must be list[str]")
                else:
                    errs.extend(validate_colors(list(p2_colors)))

            p2_targets = p2.get("recommended_targets") or []
            if p2_targets:
                if not _is_str_list(p2_targets):
                    errs.append("pattern_2.recommended_targets must be list[str]")
                else:
                    errs.extend(validate_targets(list(p2_targets), min_n=2, max_n=5))

            # trailer/plastic rules for pattern_2 lure (optional)
            if isinstance(p2_lure, str) and p2_lure in LURE_POOL:
                req2 = TRAILER_REQUIREMENT.get(p2_lure, "none")
                t2 = p2.get("trailer")
                pl2 = p2.get("plastic")

                if req2 == "terminal":
                    errs.extend(validate_terminal_plastic(p2_lure, pl2 if isinstance(pl2, str) else None))
                    if t2 is not None:
                        errs.append(f"{p2_lure} must not include pattern_2.trailer (terminal uses pattern_2.plastic).")

                elif req2 in ("required", "optional"):
                    errs.extend(validate_trailer(p2_lure, t2 if isinstance(t2, str) else None))
                    if pl2 is not None:
                        errs.append(f"{p2_lure} must not include pattern_2.plastic (use pattern_2.trailer).")

                else:
                    if t2 is not None:
                        errs.append(f"{p2_lure} must not include pattern_2.trailer.")
                    if pl2 is not None and p2_lure not in TERMINAL_PLASTIC_MAP:
                        errs.append(f"{p2_lure} must not include pattern_2.plastic.")

    return errs    