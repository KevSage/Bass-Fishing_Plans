

# NEW FILE: apps/api/app/render/lure_specs.py
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple

# For rigs/soft-plastics, the "image" is the plastic + a rig-style allusion.
# Color is still data; you can wire color zones in later (kept optional here).

@dataclass(frozen=True)
class LureSpec:
    display_name: str
    lure_family: str  # stable key for UI/art mapping (not presentation family)
    rig_style: Optional[str] = None  # "dropshot" | "wacky" | "texas" | "shaky" | "ned" | "damiki" | None

    # optional color zones (keep flexible; backend can populate later)
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None

    # text components shown in "How to fish" (NOT alternates)
    components: Optional[List[str]] = None


# --- Trailer guidance (NOT alternates) ---
_TRAILER_NOTES: Dict[str, List[str]] = {
    "chatterbait": [
        "Trailer optional: paddletail/minnow for a baitfish look; craw-style for more lift and push.",
        "Keep it simple—trailer choice is preference unless you need a specific lift/speed change.",
    ],
    "casting jig": [
        "Trailer is part of the jig profile: craw-style = bulk/lift; chunk = compact fall.",
        "Deep water or heavy cover may justify a heavier jig for control and fall rate.",
    ],
    "football jig": [
        "Craw/creature trailer; maintain bottom contact and pause after rock/cover deflections.",
        "Deeper water → heavier head to keep bottom feel and a quicker fall.",
    ],
    "spinnerbait": [
        "Trailer optional and angler preference (often none). If used, keep it simple (small swimbait/grub).",
    ],
    "buzzbait": [
        "Trailer optional and angler preference (often none). If used, keep it small so you don’t kill lift/action.",
    ],
}


def trailer_notes_for_lures(recommended_lures: List[str]) -> List[str]:
    out: List[str] = []
    for lure in (recommended_lures or []):
        key = (lure or "").lower().strip()
        # normalize common names
        key = key.replace("mid-depth ", "").replace("deep ", "").replace("suspending ", "")
        if "chatterbait" in key:
            out += _TRAILER_NOTES.get("chatterbait", [])
        elif "spinnerbait" in key:
            out += _TRAILER_NOTES.get("spinnerbait", [])
        elif "buzzbait" in key:
            out += _TRAILER_NOTES.get("buzzbait", [])
        elif "football jig" in key:
            out += _TRAILER_NOTES.get("football jig", [])
        elif "casting jig" in key or (("jig" in key) and ("swim" not in key) and ("finesse" not in key)):
            out += _TRAILER_NOTES.get("casting jig", [])
    # de-dupe, preserve order
    seen = set()
    deduped: List[str] = []
    for line in out:
        if line not in seen:
            deduped.append(line)
            seen.add(line)
    return deduped


def _colors_to_zones(colors: List[str]) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    # V1: keep minimal. If you later encode "chartreuse/white" etc, split here.
    if not colors:
        return (None, None, None)
    c0 = (colors[0] or "").strip() or None
    c1 = (colors[1] or "").strip() if len(colors) > 1 else None
    return (c0, c1, None)


def build_primary_and_alternate_lure_specs(
    *,
    primary_lures: List[str],
    color_recommendations: List[str],
    primary_presentation_family: str,
    phase: str,
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Build:
      - primary_lure_spec (hero image driver)
      - alternate_lure_specs (same-family alternates ONLY)
    Does NOT change logic; purely presentation enrichment.

    Rules enforced:
      - Soft-plastic rigs: plastic is the "lure image"
      - Drop shot: primary = small minnow, alternate = finesse worm
      - Texas rig: primary plastic is the image; other plastics can be alternates
      - No trailers as alternates (handled separately)
    """
    lures = [x for x in (primary_lures or []) if x]
    lure0 = (lures[0].lower().strip() if lures else "")

    primary_color, secondary_color, accent_color = _colors_to_zones(color_recommendations or [])

    # --- Rigged techniques / soft plastics ---
    if "dropshot" in lure0:
        primary = LureSpec(
            display_name="Drop Shot — Small Minnow",
            lure_family="dropshot",
            rig_style="dropshot",
            primary_color=primary_color,
            secondary_color=secondary_color,
            accent_color=accent_color,
            components=[
                "Weight anchors to bottom; bait rides ~6–18 inches above bottom",
                "Nose-hook or short-shank dropshot hook (keep it clean and vertical)",
            ],
        )
        alts = [
            LureSpec(
                display_name="Drop Shot — Finesse Worm",
                lure_family="dropshot",
                rig_style="dropshot",
                primary_color=primary_color,
                secondary_color=secondary_color,
                accent_color=accent_color,
                components=[
                    "Same rig; swap to a finesse worm if fish won’t commit to the minnow profile",
                ],
            )
        ]
        return (asdict(primary), [asdict(a) for a in alts])

    if "wacky" in lure0:
        primary = LureSpec(
            display_name="Wacky Rig — Stick Bait",
            lure_family="wacky_rig",
            rig_style="wacky",
            primary_color=primary_color,
            secondary_color=secondary_color,
            accent_color=accent_color,
            components=[
                "Hook through the middle (rubber band optional)",
                "Let it fall; add tiny lifts on slack so it flares on the way down",
            ],
        )
        alts: List[LureSpec] = []
        return (asdict(primary), [asdict(a) for a in alts])

    if "texas" in lure0:
        # Texas rig is not the "image" — the plastic is.
        # We pick a default plastic based on phase, but keep it deterministic and simple.
        phase_key = (phase or "").lower()
        if phase_key in ("winter",):
            primary_plastic = "Finesse Worm"
            alt_plastics = ["Small Creature", "Compact Craw"]
        elif phase_key in ("summer", "late-summer"):
            primary_plastic = "Ribbon Tail Worm"
            alt_plastics = ["Creature Bait", "Craw"]
        else:
            primary_plastic = "Creature Bait"
            alt_plastics = ["Ribbon Tail Worm", "Craw"]

        primary = LureSpec(
            display_name=f"Texas Rig — {primary_plastic}",
            lure_family="texas_rig",
            rig_style="texas",
            primary_color=primary_color,
            secondary_color=secondary_color,
            accent_color=accent_color,
            components=[
                "Bullet weight + EWG hook",
                "Weight depends on depth and cover; heavier for vegetation/punching and deep water control",
            ],
        )
        alts = [
            LureSpec(
                display_name=f"Texas Rig — {p}",
                lure_family="texas_rig",
                rig_style="texas",
                primary_color=primary_color,
                secondary_color=secondary_color,
                accent_color=accent_color,
            )
            for p in alt_plastics
        ]
        return (asdict(primary), [asdict(a) for a in alts])

    if "shaky head" in lure0:
        primary = LureSpec(
            display_name="Shaky Head — Finesse Worm",
            lure_family="shaky_head",
            rig_style="shaky",
            primary_color=primary_color,
            secondary_color=secondary_color,
            accent_color=accent_color,
            components=[
                "Maintain bottom contact; slow drag with short pauses",
                "Minimal rod movement—let the worm stand up and do the work",
            ],
        )
        return (asdict(primary), [])

    if "ned rig" in lure0:
        primary = LureSpec(
            display_name="Ned Rig — Small Stick Bait",
            lure_family="ned_rig",
            rig_style="ned",
            primary_color=primary_color,
            secondary_color=secondary_color,
            accent_color=accent_color,
            components=[
                "Small mushroom jig head + 3–4 inch stick bait",
                "Deadstick or short hops; keep it subtle and close to bottom",
            ],
        )
        # Your note: true substitute is limited; Shaky Head is the closest “finesse cousin”
        # But alternates must be same presentation family, so we leave this empty here.
        return (asdict(primary), [])

    if "damiki" in lure0:
        primary = LureSpec(
            display_name="Damiki Rig — Small Minnow Bait",
            lure_family="damiki_rig",
            rig_style="damiki",
            primary_color=primary_color,
            secondary_color=secondary_color,
            accent_color=accent_color,
            components=[
                "Small jighead (often 90° tie) + minnow-style plastic",
                "Mid-column/vertical: subtle twitches or deadstick; not a bottom-drag bait",
            ],
        )
        return (asdict(primary), [])

    # --- Default (hard baits / skirted baits) ---
    # Hero image is the lure itself
    hero_name = (lures[0] if lures else "spinnerbait")
    primary = LureSpec(
        display_name=hero_name,
        lure_family=primary_presentation_family,  # OK for non-rig lures; UI can still map by string
        rig_style=None,
        primary_color=primary_color,
        secondary_color=secondary_color,
        accent_color=accent_color,
    )

    # Same-family alternates only: use remaining lures (do NOT inject trailers here)
    alts = []
    for alt in lures[1:]:
        alts.append(
            LureSpec(
                display_name=alt,
                lure_family=primary_presentation_family,
                rig_style=None,
                primary_color=primary_color,
                secondary_color=secondary_color,
                accent_color=accent_color,
            )
        )

    return (asdict(primary), [asdict(a) for a in alts])