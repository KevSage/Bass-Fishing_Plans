# apps/api/app/canon/validate.py
from __future__ import annotations

from typing import Optional

from .pools import (
    PRESENTATIONS,
    COLOR_POOL,
    HARDBAIT_ONLY_COLORS,
    HARDBAIT_LURES,
    LURE_POOL,
    LURE_TO_PRESENTATION,
    TERMINAL_PLASTIC_MAP,
    TRAILER_REQUIREMENT,
    TRAILER_BUCKET_BY_LURE,
    JIG_TRAILERS,
    CHATTER_SWIMJIG_TRAILERS,
    SPINNER_BUZZ_TRAILERS,
    CHUNK_ALLOWED_BASE_LURES,
    BOTTOM_JIGS,
    BAITFISH_SET,
)
from .targets import CANONICAL_TARGETS  # ✅ Import from targets.py

# ----------------------------------------
# CORE VALIDATORS
# ----------------------------------------

def validate_lure_and_presentation(base_lure: str, presentation: str) -> list[str]:
    errs: list[str] = []
    
    # Validate lure exists
    if base_lure not in LURE_POOL:
        errs.append(f"Invalid lure: {base_lure!r} (not in LURE_POOL)")
        return errs
    
    # Validate presentation exists
    if presentation not in PRESENTATIONS:
        errs.append(f"Invalid presentation: {presentation!r} (not in PRESENTATIONS)")
        return errs
    
    # Check lure-presentation mapping
    expected = LURE_TO_PRESENTATION.get(base_lure)
    
    # Handle both single presentation and list of allowed presentations
    if isinstance(expected, list):
        if presentation not in expected:
            errs.append(f"Presentation mismatch for {base_lure!r}: expected one of {expected}, got {presentation!r}")
    else:
        if expected != presentation:
            errs.append(f"Presentation mismatch for {base_lure!r}: expected {expected!r}, got {presentation!r}")
    
    return errs

def validate_colors(colors: list[str], valid_colors: list[str] = None) -> list[str]:
    """
    Validate color list.
    If valid_colors is provided, check against that list (lure-specific).
    Otherwise, use old COLOR_POOL for backwards compatibility.
    """
    errs: list[str] = []
    if not isinstance(colors, list):
        return ["color_recommendations must be a list"]
    if len(colors) == 0 or len(colors) > 2:
        errs.append("color_recommendations must contain 1-2 colors")
    
    # If lure-specific colors provided, validate against those
    if valid_colors is not None:
        for c in colors:
            if c not in valid_colors:
                errs.append(f"Invalid color: {c!r} (not in allowed colors for this lure)")
    else:
        # Fallback to old COLOR_POOL for backwards compatibility
        for c in colors:
            if c not in COLOR_POOL:
                errs.append(f"Invalid color: {c!r} (not in COLOR_POOL)")
    return errs


def validate_colors_for_lure(base_lure: str, colors: list[str], soft_plastic: str = None) -> list[str]:
    """
    Validate colors for a specific lure using lure-specific color pools.
    """
    # Import locally to avoid circular dependency if pools imports validate
    from app.canon.pools import get_color_pool_for_lure
    
    errs: list[str] = []
    
    # Get the correct color pool for this lure (e.g. gets RIG_COLORS for texas rig)
    try:
        valid_colors = get_color_pool_for_lure(base_lure, soft_plastic)
    except ValueError as e:
        return [str(e)]
    
    # Validate against lure-specific pool
    errs.extend(validate_colors(colors, valid_colors))
    if errs:
        return errs

    # HARD-BAIT-ONLY colors must stay on hard baits
    if any(c in HARDBAIT_ONLY_COLORS for c in colors):
        if base_lure not in HARDBAIT_LURES:
            errs.append(
                f"{base_lure} cannot use metallic/firetiger colors "
                f"(silver/gold/bronze/firetiger are hardbait-only)."
            )

    # black/blue not allowed for jerkbaits/hardbaits in V1 (+ soft jerkbait)
    if "black/blue" in colors:
        if base_lure in HARDBAIT_LURES or base_lure in {"soft jerkbait"}:
            errs.append("black/blue is not allowed for jerkbaits/hardbaits in V1.")

    # spinnerbait: color refers to skirt, so metallic labels are not valid "colors" here
    if base_lure == "spinnerbait":
        if any(c in {"silver", "gold", "bronze", "firetiger"} for c in colors):
            errs.append("spinnerbait color_recommendations must describe the skirt, not blade finish.")

    return errs


def validate_targets(targets: list[str]) -> list[str]:
    errs: list[str] = []
    if not isinstance(targets, list):
        return ["recommended_targets must be a list"]
    if not (3 <= len(targets) <= 5):
        errs.append("recommended_targets must contain 3-5 targets")
    allowed = set(CANONICAL_TARGETS)
    for t in targets:
        if t not in allowed:
            errs.append(f"Invalid target: {t!r} (not in CANONICAL_TARGETS)")
    return errs


def validate_terminal_plastic(base_lure: str, plastic: Optional[str]) -> list[str]:
    errs: list[str] = []
    if base_lure not in TERMINAL_PLASTIC_MAP:
        return errs  # not terminal tackle

    if not plastic:
        return [f"{base_lure} requires a plastic choice."]

    allowed = TERMINAL_PLASTIC_MAP[base_lure]
    if plastic not in allowed:
        errs.append(f"{base_lure} plastic must be one of: {sorted(allowed)}")

    # baitfish ban on bottom-contact terminal tackle
    if plastic in BAITFISH_SET:
        errs.append("Baitfish plastics are not allowed on bottom-contact terminal tackle.")

    # dropshot strict (if/when used)
    if base_lure == "dropshot" and plastic not in TERMINAL_PLASTIC_MAP["dropshot"]:
        errs.append("Dropshot plastics must be: finesse worm OR small minnow.")

    return errs


def validate_trailer(base_lure: str, trailer: Optional[str]) -> list[str]:
    errs: list[str] = []
    req = TRAILER_REQUIREMENT.get(base_lure, "none")

    if req == "required" and not trailer:
        return [f"{base_lure} requires a trailer."]

    if req in ("none", "terminal") and trailer:
        return [f"{base_lure} must not include a trailer field."]

    if not trailer:
        return errs

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

    return errs