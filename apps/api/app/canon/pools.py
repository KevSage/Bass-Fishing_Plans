# apps/api/app/canon/pools.py
from __future__ import annotations

# ----------------------------------------
# PRESENTATIONS (LOCKED)
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
# COLORS (LOCKED)
# ----------------------------------------

COLOR_POOL = [
    # Natural / Clear Water
    "green pumpkin",
    "watermelon",
    "watermelon red",
    "smoke",
    "natural shad",
    "ghost shad",
    "baitfish",

    # Shad / Pelagic
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

    # High-Contrast / Dirty Water
    "chartreuse",
    "chartreuse/white",
    "firetiger",

    # Metallic / Blade Context
    "gold",
    "bronze",
    "silver",
]

# ----------------------------------------
# HARD BAIT RESTRICTIONS (LOCKED)
# ----------------------------------------
# Rule:
# - These colors may ONLY be used on hard baits.
HARDBAIT_ONLY_COLORS = {
    "gold",
    "bronze",
    "silver",
    "firetiger",
}

# Rule:
# - Hard bait lures in our current catalog.
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

# ----------------------------------------
# TARGETS (LOCKED) — exact strings only
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
# SOFT PLASTICS / TRAILERS (LOCKED)
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
    "soft jerkbait",        # fluke-style
    "paddle tail swimbait",
]

JIG_TRAILERS = [
    "craw",
    "chunk",                # jig-only (restricted below)
]

# Terminal tackle buckets (strict)
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
    "dropshot": set(["finesse worm", "small minnow"]),   # STRICT
}

# ----------------------------------------
# LURE CATALOG (LOCKED STRINGS)
# - these exact strings are what the LLM may output
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
    # Horizontal Reaction
    "shallow crankbait": "Horizontal Reaction",
    "mid crankbait": "Horizontal Reaction",
    "deep crankbait": "Horizontal Reaction",
    "lipless crankbait": "Horizontal Reaction",
    "chatterbait": "Horizontal Reaction",
    "swim jig": "Horizontal Reaction",
    "spinnerbait": "Horizontal Reaction",
    "underspin": "Horizontal Reaction",
    "paddle tail swimbait": "Horizontal Reaction",

    # Vertical Reaction
    "jerkbait": "Vertical Reaction",
    "damiki rig": "Vertical Reaction",
    "blade bait": "Vertical Reaction",

    # Bottom Contact - Dragging
    "texas rig": "Bottom Contact - Dragging",
    "carolina rig": "Bottom Contact - Dragging",
    "football jig": "Bottom Contact - Dragging",
    "shaky head": "Bottom Contact - Dragging",

    # Bottom Contact - Hopping / Targeted
    "casting jig": "Bottom Contact - Hopping / Targeted",

    # Hovering / Mid-Column Finesse
    "neko rig": "Hovering / Mid-Column Finesse",
    "wacky rig": "Hovering / Mid-Column Finesse",
    "weightless soft jerkbait": "Hovering / Mid-Column Finesse",

    # Topwater - Horizontal
    "walking bait": "Topwater - Horizontal",
    "buzzbait": "Topwater - Horizontal",
    "whopper plopper": "Topwater - Horizontal",

    # Topwater - Precision / Vertical Surface Work
    "hollow body frog": "Topwater - Precision / Vertical Surface Work",
    "popping frog": "Topwater - Precision / Vertical Surface Work",
}

# ----------------------------------------
# TRAILER / PLASTIC REQUIREMENTS (LOCKED)
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

    # terminal tackle
    "texas rig": "terminal",
    "carolina rig": "terminal",
    "shaky head": "terminal",
    "neko rig": "terminal",
    "wacky rig": "terminal",
    "dropshot": "terminal",  # reserved
    "ned rig": "terminal",   # reserved

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
    # jig-style only: craw OR chunk
    "casting jig": "JIG_TRAILERS",
    "football jig": "JIG_TRAILERS",

    # chatterbait/swim jig: craw allowed + baitfish-style trailers
    # (grub removed; soft jerkbait allowed here)
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

# Hard restrictions sets
CHUNK_ALLOWED_BASE_LURES = {"casting jig", "football jig"}  # chunk is jig-only
BOTTOM_JIGS = {"casting jig", "football jig"}
BAITFISH_SET = {"soft jerkbait", "small minnow", "paddle tail swimbait"}