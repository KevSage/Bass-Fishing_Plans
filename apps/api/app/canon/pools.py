# apps/api/app/canon/pools.py
"""
CANONICAL POOLS - SINGLE SOURCE OF TRUTH
All lures, colors, presentations, and rules for BFP.
Merged from patterns/catalog.py and original canon/pools.py.
"""
from typing import Optional, List

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
# LURES (UNIFIED CATALOG)
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
    "blade bait",
    "jighead minnow",

    # Bottom Contact - Both Dragging AND Hopping (except ned rig)
    "texas rig",
    "carolina rig",
    "football jig",
    "casting jig",
    "shaky head",
    
    # Bottom Contact - Dragging ONLY (exposed hook = snag risk)
    "ned rig",

    # Hovering / Mid-Column Finesse
    "neko rig",
    "wacky rig",
    "soft jerkbait",
    "dropshot",

    # Topwater - Horizontal
    "walking bait",
    "buzzbait",
    "whopper plopper",
    "wake bait",

    # Topwater - Precision / Vertical Surface Work
    "hollow body frog",
    "popping frog",
    "popper",
]

# ----------------------------------------
# COLOR ZONE SYSTEM
# ----------------------------------------

# Metallic colors (used for hardware finishes and blade bait body)
METALLIC_COLORS = {
    "gold",
    "bronze", 
    "silver",
    "firetiger",  # Treated as metallic for hardbait restrictions
}

# Define which zones each lure supports
# True = required, False = optional (may be null), not present = not supported
LURE_ZONE_SCHEMA = {
    # ========================================
    # A) HARDBAITS (Non-Frog) - 9 lures
    # ========================================
    # Zones: primary (body sides), secondary optional (back), accent optional (belly/throat)
    # Metallic: Paint-style highlights allowed, but NOT full metallic body recolors
    
    "shallow crankbait": {"primary": True, "secondary": False, "accent": False},
    "mid crankbait": {"primary": True, "secondary": False, "accent": False},
    "deep crankbait": {"primary": True, "secondary": False, "accent": False},
    "lipless crankbait": {"primary": True, "secondary": False, "accent": False},
    "jerkbait": {"primary": True, "secondary": False, "accent": False},
    "popper": {"primary": True, "secondary": False, "accent": False},
    "walking bait": {"primary": True, "secondary": False, "accent": False},
    "wake bait": {"primary": True, "secondary": False, "accent": False},
    "whopper plopper": {"primary": True, "secondary": False, "accent": False},
    
    # ========================================
    # B) FROGS (Topwater Soft Body) - 2 lures
    # ========================================
    # Zones: primary (top body), secondary optional (legs), accent optional (belly)
    # Metallic: NONE - frogs are soft-bodied, no metallics anywhere
    
    "hollow body frog": {"primary": True, "secondary": False, "accent": False},
    "popping frog": {"primary": True, "secondary": False, "accent": False},
    
    # ========================================
    # C) BLADED / METAL HARDWARE LURES - 5 lures
    # ========================================
    
    # Chatterbait, Spinnerbait, Underspin: skirt + blade finish
    # primary = skirt/body, secondary optional = skirt accent, accent = blade finish (metallic)
    "chatterbait": {"primary": True, "secondary": False, "accent": True},
    "spinnerbait": {"primary": True, "secondary": False, "accent": True},
    
    # Buzzbait: body + hardware/prop finish
    # primary = body, accent = hardware/prop finish (metallic)
    "buzzbait": {"primary": True, "secondary": False, "accent": True},
    
    # Blade bait: METAL BODY PLATE
    # primary = metal body plate (IS metallic), accent optional = minimal marking
    # CRITICAL: Uses primary_material = "metallic", NOT accent_material
    "blade bait": {"primary": True, "secondary": False, "accent": False, "primary_is_metal": True},
    
    # ========================================
    # D) RIG ICONS (Presentation Icons) - 7 lures
    # ========================================
    # Visual representation of bait, not terminal tackle
    # Zones: primary (implied soft plastic), secondary optional (back/flake)
    # Metallic: FORBIDDEN (weights/hooks not color-zoned)
    
    "texas rig": {"primary": True, "secondary": False, "accent": False},
    "carolina rig": {"primary": True, "secondary": False, "accent": False},
    "shaky head": {"primary": True, "secondary": False, "accent": False},
    "neko rig": {"primary": True, "secondary": False, "accent": False},
    "wacky rig": {"primary": True, "secondary": False, "accent": False},
    "ned rig": {"primary": True, "secondary": False, "accent": False},
    "dropshot": {"primary": True, "secondary": False, "accent": False},
    
    # ========================================
    # E) SOFT PLASTIC BODIES - 4 lures
    # ========================================
    # Standalone plastic (not rigs)
    # Zones: primary, secondary optional, accent optional (tail/belly)
    # Metallic: ABSOLUTELY FORBIDDEN
    
    "soft jerkbait": {"primary": True, "secondary": False, "accent": False},
    "paddle tail swimbait": {"primary": True, "secondary": False, "accent": False},
    "jighead minnow": {"primary": True, "secondary": False, "accent": False},
    "underspin": {"primary": True, "secondary": False, "accent": True},

    # ========================================
    # F) JIGS - 3 lures
    # ========================================
    # Zones: primary = skirt, secondary optional = skirt accent
    # Metallic: FORBIDDEN in color zones (head remains neutral, trailers in work_it)
    
    "football jig": {"primary": True, "secondary": False, "accent": False},
    "casting jig": {"primary": True, "secondary": False, "accent": False},
    "swim jig": {"primary": True, "secondary": False, "accent": False},
}

# Default values for optional zones
# Only applies to metallic hardware finishes (blades, props)
LURE_ZONE_DEFAULTS = {
    # Blade finishes
    "chatterbait": {"accent": "gold", "accent_material": "metallic"},
    "spinnerbait": {"accent": "gold", "accent_material": "metallic"},
    "underspin": {"accent": "silver", "accent_material": "metallic"},
    
    # Hardware finish (prop/blade)
    "buzzbait": {"accent": "silver", "accent_material": "metallic"},
    
    # Blade bait has NO defaults - LLM must specify metallic color for primary
}

# Lures that are RIG ICONS (not the plastic itself)
# These show hook/weight/presentation, not a standalone soft plastic
RIG_ICON_LURES = {
    "texas rig",
    "carolina rig",
    "shaky head",
    "neko rig",
    "wacky rig",
    "ned rig",
    "dropshot",
}

# Lures that are SOFT PLASTIC BODIES (standalone plastic, not rigs)
SOFT_PLASTIC_BODY_LURES = {
    "soft jerkbait",
    "paddle tail swimbait",
    "jighead minnow"
}

# Lures that are FROGS (soft-bodied topwater, NO metallics)
FROG_LURES = {
    "hollow body frog",
    "popping frog",
}

# Lures that are JIGS (skirt-based, NO metallics in zones)
JIG_LURES = {
    "football jig",
    "casting jig",
    "swim jig",
}

# ----------------------------------------
# LURE-SPECIFIC COLOR POOLS
# ----------------------------------------
# Each lure group gets its own curated color pool

# Group 1: Rigs (Soft Plastics)
# AUDIT: Added watermelon (classic staple). Verified all 10 have descriptions.
RIG_COLORS = [
    "green pumpkin",
    "black/blue",
    "junebug",
    "baby bass",
    "watermelon red",
    "red craw",
    "black",
    "green pumpkin orange",
    "peanut butter & jelly",
    "watermelon",
    "morning dawn",  # <--- Keep this (Worm color)
    "green pumpkin orange", # <--- ADDED: Fixes football jig validation error
]

# Group 2: Bladed/Skirted (Jigs/Chatterbaits)
# AUDIT: Added staples (junebug, pb&j, black, brown, sexy shad) to fix validation errors.
BLADED_SKIRTED_COLORS = [
    "white",
    "shad",
    "chartreuse/white",
    "chartreuse",
    "black/blue",
    "green pumpkin",
    "red craw",
    "bluegill",
    "junebug",
    "peanut butter & jelly",
    "black",
    "brown",
    "sexy shad",
    "green pumpkin orange", # <--- ADDED: Fixes football jig validation error
  
]

# Group 3: Soft Swimbaits (5 colors)
# AUDIT: Verified all 5 have descriptions.
SOFT_SWIMBAIT_COLORS = [
    "white",
    "shad",
    "pearl",
    "bluegill",
    "green pumpkin",
]

# Group 4: Crankbaits (11 colors)
# AUDIT: Added craw, black/blue (for squarebills). Verified descriptions.
CRANKBAIT_COLORS = [
    "sexy shad",
    "chartreuse/black",
    "red craw",
    "craw",
    "bluegill",
    "ghost shad",
    "citrus shad",
    "firetiger",
    "black/blue",
    "chrome",
    "gold",
]

# Group 5: Jerkbaits (10 colors)
JERKBAIT_COLORS = [
    "pro blue",
    "table rock",
    "ghost minnow",
    "transparent",
    "bone",
    "natural shad",
    "chrome",
    "gold",
    "white",
    "red craw",
]

# Group 6: Topwater (6 colors)
TOPWATER_COLORS = [
    "bone",
    "chrome",
    "black",
    "shad",
    "bluegill",
    "translucent",
]

# Group 7: Frogs (6 colors)
FROG_COLORS = [
    "green",
    "brown",
    "yellow",
    "black",
    "white",
    "bluegill",
]

# Map lures to their color pools
LURE_COLOR_POOL_MAP = {
    # Rigs
    "texas rig": RIG_COLORS,
    "carolina rig": RIG_COLORS,
    "shaky head": RIG_COLORS,
    "ned rig": RIG_COLORS,
    "neko rig": RIG_COLORS,
    "wacky rig": RIG_COLORS,
    # dropshot is conditional - see get_color_pool_for_lure()
    
    # Bladed/Skirted
    "chatterbait": BLADED_SKIRTED_COLORS,
    "spinnerbait": BLADED_SKIRTED_COLORS,
    "buzzbait": BLADED_SKIRTED_COLORS,
    "swim jig": BLADED_SKIRTED_COLORS,
    "football jig": BLADED_SKIRTED_COLORS,
    "casting jig": BLADED_SKIRTED_COLORS,
    
    # Soft Swimbaits
    "underspin": SOFT_SWIMBAIT_COLORS,
    "soft jerkbait": SOFT_SWIMBAIT_COLORS,
    "paddle tail swimbait": SOFT_SWIMBAIT_COLORS,
    "jighead minnow": SOFT_SWIMBAIT_COLORS,

    # dropshot with minnow uses SOFT_SWIMBAIT_COLORS
    
    # Crankbaits
    "shallow crankbait": CRANKBAIT_COLORS,
    "mid crankbait": CRANKBAIT_COLORS,
    "deep crankbait": CRANKBAIT_COLORS,
    "lipless crankbait": CRANKBAIT_COLORS,
    "wake bait": CRANKBAIT_COLORS,
    "blade bait": CRANKBAIT_COLORS,
    
    # Jerkbaits
    "jerkbait": JERKBAIT_COLORS,
    
    # Topwater
    "walking bait": TOPWATER_COLORS,
    "whopper plopper": TOPWATER_COLORS,
    "popper": TOPWATER_COLORS,
    
    # Frogs
    "hollow body frog": FROG_COLORS,
    "popping frog": FROG_COLORS,
}

def get_color_pool_for_lure(lure: str, soft_plastic: Optional[str] = None) -> List[str]:
    """
    Get the appropriate color pool for a lure.
    
    Special case: dropshot depends on soft_plastic type
    - finesse worm/trick worm/straight tail worm → RIG_COLORS
    - small minnow/fluke/jerkbait → SOFT_SWIMBAIT_COLORS
    
    Args:
        lure: Base lure name
        soft_plastic: Soft plastic type (for dropshot conditional logic)
    
    Returns:
        List of allowed colors for this lure
    
    Raises:
        ValueError: If lure not found or dropshot without soft_plastic
    """
    if lure == "dropshot":
        # Fallback to RIG_COLORS if no plastic specified, to be safe
        if not soft_plastic:
            return RIG_COLORS
        
        sp = soft_plastic.lower()
        # Broad keyword check for baitfish/minnow types
        if any(k in sp for k in ["minnow", "fluke", "jerk", "shad", "swimbait", "fish", "dropshot minnow"]):
            return SOFT_SWIMBAIT_COLORS
        
        # Default to worm/creature colors
        return RIG_COLORS
    
    if lure not in LURE_COLOR_POOL_MAP:
        raise ValueError(f"No color pool defined for lure: {lure}")
    
    return LURE_COLOR_POOL_MAP[lure]

# ----------------------------------------
# COLOR DESCRIPTIONS (for LLM reasoning)
# ----------------------------------------
# These descriptions help the LLM explain color choices in "why_this_works"
# Format: "Choose [Color] if [conditions] — [bass behavior/why it works]"

COLOR_DESCRIPTIONS = {
    # Rig Colors
    "green pumpkin": "Natural crawfish/creature imitation, works in most water clarities, standard choice for bottom contact",
    "black/blue": "High contrast for stained water or low light, triggers reaction strikes from aggressive bass",
    "junebug": "Dark profile for murky water or night fishing, strong silhouette creates clear target",
    "baby bass": "Translucent with subtle flake, imitates small bass/bluegill in clear water",
    "watermelon red": "Clear water crawfish with red flake imitating eggs or gills, natural in clean conditions",
    "watermelon": "Classic clear water green, very natural presentation",
    "red craw": "Bright crawfish imitation for stained water or aggressive feeding, high visibility",
    "black": "Maximum contrast for dirty water or night, creates strongest silhouette",
    "green pumpkin orange": "Natural green with orange highlights mimicking egg-bearing crawfish",
    "peanut butter & jelly": "Purple/brown translucent for clear water, imitates bluegill or natural forage",
    "brown": "Natural crawfish or bottom forage, great for clear to stained water",
    
    # Bladed/Skirted Colors
    "white": "Clean baitfish imitation for clear water or when bass are keyed on shad",
    "shad": "Natural shad pattern with dark back, works in most water clarities",
    "chartreuse/white": "High visibility for stained water while maintaining baitfish profile",
    "chartreuse": "Maximum visibility in muddy water or low light, triggers reaction strikes",
    "sexy shad": "Shad pattern with chartreuse stripe, great for stained water reaction",
    "bluegill": "Natural bluegill imitation with purple/orange highlights",
    
    # Soft Swimbait Colors
    "pearl": "Translucent white for ultra-clear water, realistic baitfish with subtle flash",
    
    # Crankbait Colors
    "chartreuse/black": "High visibility chartreuse with dark back for stained water",
    "ghost shad": "Translucent white/blue for clear water, mimics natural shad perfectly",
    "citrus shad": "Chartreuse belly with shad profile for slightly off-colored water",
    "firetiger": "Extreme contrast pattern for muddy water or aggressive feeding windows",
    "chrome": "Silver metallic finish reflects light in any water clarity, mimics shad flash",
    "gold": "Gold metallic for stained water or low light, creates warm flash",
    "craw": "General crawfish pattern for spring or bottom grinding",
    
    # Jerkbait Colors
    "pro blue": "Transparent with blue/purple back imitating shad in clear to stained water",
    "table rock": "Translucent chartreuse with purple and orange accents, triggers strikes in overcast or off-colored water",
    "ghost minnow": "Translucent with olive back and blue accent for gin-clear water, ultra-realistic",
    "transparent": "Completely clear for extreme clarity or highly pressured fish, nearly invisible",
    "bone": "Off-white/cream natural finish for clear water",
    "natural shad": "White/silver with dark back, standard shad imitation",
    
    # Topwater Colors
    "translucent": "Clear/transparent for clear water when bass inspect closely",
    
    # Frog Colors
    "green": "Natural frog green for vegetated areas",
    "yellow": "High visibility for stained water or thick cover",
}

# ----------------------------------------
# LEGACY COLOR POOL (for backwards compatibility)
# ----------------------------------------
# This is the old unified pool - kept for now but will be deprecated
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
HARDBAIT_ONLY_COLORS = {
    "gold",
    "bronze",
    "silver",
    "firetiger",
}

HARDBAIT_LURES = {
    "shallow crankbait",
    "mid crankbait",
    "deep crankbait",
    "lipless crankbait",
    "jerkbait",
    "walking bait",
    "whopper plopper",
    "blade bait",  # Metal lure - can use metallic colors
}

# ----------------------------------------
# SOFT PLASTICS (LOCKED)
# ----------------------------------------
BOTTOM_CONTACT_PLASTICS = [
    "creature bait",
    "craw",
    "ribbon tail worm",
    "stickbait",
    "finesse worm",
    "lizard",
    "ned worm"
]

BAITFISH_PLASTICS = [
    "small minnow",
    "soft jerkbait",
    "paddle tail swimbait",
    "dropshot minnow",  # <--- ADD THIS
]

JIG_TRAILERS = [
    "craw",
    "chunk",
]

# ----------------------------------------
# TERMINAL TACKLE PLASTIC RULES (STRICT)
# ----------------------------------------
TERMINAL_PLASTIC_MAP = {
    "texas rig": {
        "creature bait", "craw", "ribbon tail worm",
        "stickbait", "finesse worm", "lizard",
    },
    "carolina rig": {
        "creature bait", "craw", "ribbon tail worm",
        "stickbait", "finesse worm", "lizard",
    },
    "shaky head": {"stickbait", "finesse worm"},
    "ned rig": {"ned worm", "ned craw"},
    "neko rig": {"stickbait", "finesse worm"},
    "wacky rig": {"stickbait", "finesse worm"},
    "dropshot": {"finesse worm", "small minnow"},  # STRICT
}

# ----------------------------------------
# TRAILER RULES (LOCKED)
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

    # terminal tackle (handled separately)
    "texas rig": "terminal",
    "carolina rig": "terminal",
    "shaky head": "terminal",
    "neko rig": "terminal",
    "wacky rig": "terminal",
    "dropshot": "terminal",
    "ned rig": "terminal",

    # no trailers
    "shallow crankbait": "none",
    "mid crankbait": "none",
    "deep crankbait": "none",
    "lipless crankbait": "none",
    "underspin": "none",
    "paddle tail swimbait": "none",
    "jerkbait": "none",
    "blade bait": "none",
    "soft jerkbait": "none",
    "walking bait": "none",
    "whopper plopper": "none",
    "wake bait": "none",
    "hollow body frog": "none",
    "popping frog": "none",
    "popper": "none",
}

TRAILER_BUCKET_BY_LURE = {
    # jig-style only: craw OR chunk
    "casting jig": "JIG_TRAILERS",
    "football jig": "JIG_TRAILERS",

    # chatterbait/swim jig: craw allowed + baitfish-style trailers
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
# LURE → PRESENTATION MAP (LOCKED)
# ----------------------------------------

LURE_TO_PRESENTATION = {
    # ========================================
    # HORIZONTAL REACTION
    # ========================================
    "shallow crankbait": "Horizontal Reaction",
    "mid crankbait": "Horizontal Reaction",
    "deep crankbait": "Horizontal Reaction",
    "lipless crankbait": "Horizontal Reaction",
    "chatterbait": "Horizontal Reaction",
    "spinnerbait": "Horizontal Reaction",
    "underspin": "Horizontal Reaction",
    "paddle tail swimbait": "Horizontal Reaction",
    
    # Swim jig - primarily horizontal but can drag bottom
    "swim jig": [
        "Horizontal Reaction",
        "Bottom Contact - Dragging",
    ],

    # ========================================
    # VERTICAL REACTION
    # ========================================
    "jerkbait": "Vertical Reaction",
    "blade bait": "Vertical Reaction",
    "jighead minnow": "Vertical Reaction",

    # ========================================
    # BOTTOM CONTACT - Both Dragging AND Hopping
    # (All except ned rig can be hopped or dragged)
    # ========================================
    "texas rig": [
        "Bottom Contact - Dragging",
        "Bottom Contact - Hopping / Targeted",
    ],
    "carolina rig": [
        "Bottom Contact - Dragging",
        "Bottom Contact - Hopping / Targeted",
    ],
    "football jig": [
        "Bottom Contact - Dragging",
        "Bottom Contact - Hopping / Targeted",
    ],
    "casting jig": [
        "Bottom Contact - Dragging",
        "Bottom Contact - Hopping / Targeted",
    ],
    "shaky head": [
        "Bottom Contact - Dragging",
        "Bottom Contact - Hopping / Targeted",
    ],
    
    # Ned rig - HOPPING ONLY (exposed hook = snag risk when dragging on bottom)
    "ned rig": "Bottom Contact - Hopping / Targeted",

    # ========================================
    # HOVERING / MID-COLUMN FINESSE
    # (Most can also work as vertical reaction)
    # ========================================
    
    # Neko rig - can hover OR vertical jig
    "neko rig": [
        "Hovering / Mid-Column Finesse",
        "Vertical Reaction",
    ],
    
    # Wacky rig - can hover OR vertical shake
    "wacky rig": [
        "Hovering / Mid-Column Finesse",
        "Vertical Reaction",
    ],
    
    # Soft jerkbait - can hover OR dart/twitch
    "soft jerkbait": [
        "Hovering / Mid-Column Finesse",
        "Vertical Reaction",
    ],
    
    # Dropshot - can hover OR vertical jig (KEY FIX for LLM errors)
    "dropshot": [
        "Hovering / Mid-Column Finesse",
        "Vertical Reaction",
    ],

    # ========================================
    # TOPWATER - HORIZONTAL
    # ========================================
    "walking bait": "Topwater - Horizontal",
    "buzzbait": "Topwater - Horizontal",
    "whopper plopper": "Topwater - Horizontal",
    "wake bait": "Topwater - Horizontal",

    # ========================================
    # TOPWATER - PRECISION / VERTICAL SURFACE WORK
    # ========================================
    "hollow body frog": "Topwater - Precision / Vertical Surface Work",
    "popping frog": "Topwater - Precision / Vertical Surface Work",
    "popper": "Topwater - Precision / Vertical Surface Work",
}


# ----------------------------------------
# HARD RESTRICTIONS (LOCKED)
# ----------------------------------------
CHUNK_ALLOWED_BASE_LURES = {"casting jig", "football jig"}
BOTTOM_JIGS = {"casting jig", "football jig"}
BAITFISH_SET = {"soft jerkbait", "small minnow", "paddle tail swimbait", "dropshot minnow"}


# ----------------------------------------
# COLOR ZONE EXPANSION
# ----------------------------------------

def expand_color_zones(lure: str, llm_colors: List[str]) -> dict:
    """
    Expand LLM color output into full zone payload.
    
    The LLM returns 1-2 "angler shorthand" colors.
    This function expands them into the full zone structure needed for:
    - Pre-rendered image selection
    - Frontend display
    - Asset key generation
    
    Args:
        lure: Base lure name (e.g., "spinnerbait")
        llm_colors: List of 1-2 colors from LLM (e.g., ["chartreuse/white"])
    
    Returns:
        {
            "primary_color": str,
            "secondary_color": str | None,
            "accent_color": str | None,
            "accent_material": "metallic" | None,
            "primary_material": "metallic" | None,  # Only for blade bait
            "asset_key": str,  # Filename for pre-rendered image
            "warnings": list[str]  # Non-fatal issues (extra colors ignored, etc.)
        }
    
    Raises:
        ValueError: If lure not found or colors invalid for this lure
    """
    if lure not in LURE_ZONE_SCHEMA:
        raise ValueError(f"Unknown lure: {lure}")
    
    schema = LURE_ZONE_SCHEMA[lure]
    defaults = LURE_ZONE_DEFAULTS.get(lure, {})
    warnings = []
    
    # Initialize zones
    zones = {
        "primary_color": None,
        "secondary_color": None,
        "accent_color": None,
        "accent_material": None,
        "primary_material": None,  # For blade bait
        "warnings": [],
    }
    
    # Primary color (always required)
    if not llm_colors or len(llm_colors) == 0:
        raise ValueError(f"LLM must provide at least one color for {lure}")
    
    zones["primary_color"] = llm_colors[0]
    
    # Secondary color (if lure supports it and LLM provided 2 colors)
    if len(llm_colors) >= 2:
        if schema.get("secondary") is not False:  # Supports secondary
            zones["secondary_color"] = llm_colors[1]
        else:
            # LLM provided secondary but lure doesn't support it
            warnings.append(f"{lure} does not support secondary_color; ignored '{llm_colors[1]}'")
    
    # Accent color (hardware finish - blade, prop, etc.)
    if schema.get("accent") is not False:  # Supports accent
        # Use default if available (blade finishes, hardware)
        if "accent" in defaults:
            zones["accent_color"] = defaults["accent"]
            zones["accent_material"] = defaults.get("accent_material")
    
    # Validate: CRITICAL - metallic restrictions
    # Categorize the lure
    is_rig_icon = lure in RIG_ICON_LURES
    is_soft_body = lure in SOFT_PLASTIC_BODY_LURES
    is_frog = lure in FROG_LURES
    is_jig = lure in JIG_LURES
    is_blade_bait = lure == "blade bait"
    
    # Check if any metallics are forbidden for this lure type
    metallics_forbidden = is_rig_icon or is_soft_body or is_frog or is_jig
    
    # Validate primary color
    if zones["primary_color"] in METALLIC_COLORS:
        if is_blade_bait:
            # SPECIAL CASE: Blade bait primary IS the metal body plate
            zones["primary_material"] = "metallic"
        elif metallics_forbidden:
            # Frogs, rigs, soft plastics, jigs CANNOT have metallic
            lure_type = "frog" if is_frog else "jig" if is_jig else "rig icon" if is_rig_icon else "soft plastic"
            raise ValueError(f"Metallic color '{zones['primary_color']}' not allowed on {lure} ({lure_type})")
        # Hardbaits can have metallic primary (firetiger, etc.) - allowed
    
    # Validate secondary color (if present)
    if zones.get("secondary_color") and zones["secondary_color"] in METALLIC_COLORS:
        # Metallic in secondary is almost never valid (back of lure)
        raise ValueError(f"Metallic color '{zones['secondary_color']}' not allowed in secondary_color for {lure}")
    
    # Generate asset key (filename for pre-rendered image)
    zones["asset_key"] = generate_asset_key(lure, zones)
    zones["warnings"] = warnings
    
    return zones


def generate_asset_key(lure: str, zones: dict) -> str:
    """
    Generate filename for pre-rendered lure image.
    
    Since we only have one image per lure type (no color variations),
    just use the lure name.
    
    Format: {lure}.png
    
    Examples:
        spinnerbait.png
        texas_rig.png
        popper.png
    
    Args:
        lure: Base lure name
        zones: Expanded zone dict (unused but kept for compatibility)
    
    Returns:
        Asset filename (no path, just name.png)
    """
    # Normalize lure name for filename (replace spaces with underscores)
    normalized_lure = lure.replace(" ", "_")
    return f"{normalized_lure}.png"


def validate_color_zones(lure: str, zones: dict) -> List[str]:
    """
    Validate expanded color zones for a lure using LURE-SPECIFIC pools.
    """
    errors = []
    
    if lure not in LURE_ZONE_SCHEMA:
        errors.append(f"Unknown lure: {lure}")
        return errors
    
    schema = LURE_ZONE_SCHEMA[lure]
    
    # Get the specific allowable pool for this lure
    try:
        specific_pool = get_color_pool_for_lure(lure, zones.get("soft_plastic"))
    except ValueError as e:
        errors.append(str(e))
        return errors

    # Validate primary
    if not zones.get("primary_color"):
        errors.append(f"{lure} requires primary_color")
    elif zones["primary_color"] not in specific_pool:
        errors.append(f"Invalid primary_color: {zones['primary_color']} (not in allowed pool for {lure})")
    
    # Validate secondary
    if zones.get("secondary_color"):
        if schema.get("secondary") is None:
            errors.append(f"{lure} does not support secondary_color")
        elif zones["secondary_color"] not in specific_pool:
            errors.append(f"Invalid secondary_color: {zones['secondary_color']} (not in allowed pool for {lure})")
    
    # Validate accent
    if zones.get("accent_color"):
        if schema.get("accent") is None:
            errors.append(f"{lure} does not support accent_color")
        # Accents (e.g. blades) often use METALLIC_COLORS or defaults, not necessarily the lure's body pool
        # For simplicity, we can check if it's in the legacy pool OR metallic set
        elif zones["accent_color"] not in COLOR_POOL and zones["accent_color"] not in METALLIC_COLORS:
            errors.append(f"Invalid accent_color: {zones['accent_color']}")
    
    # Validate metallic restrictions
    is_rig_icon = lure in RIG_ICON_LURES
    is_soft_body = lure in SOFT_PLASTIC_BODY_LURES
    is_frog = lure in FROG_LURES
    is_jig = lure in JIG_LURES
    is_blade_bait = lure == "blade bait"
    
    metallics_forbidden = is_rig_icon or is_soft_body or is_frog or is_jig
    
    if zones.get("primary_color") in METALLIC_COLORS:
        if is_blade_bait:
            if not zones.get("primary_material") == "metallic":
                errors.append(f"blade bait with metallic primary must have primary_material='metallic'")
        elif metallics_forbidden:
            lure_type = "frog" if is_frog else "jig" if is_jig else "rig icon" if is_rig_icon else "soft plastic"
            errors.append(f"Metallic color '{zones['primary_color']}' not allowed on {lure} ({lure_type})")
    
    if zones.get("secondary_color") in METALLIC_COLORS:
        errors.append(f"Metallic color '{zones['secondary_color']}' not allowed in secondary_color for {lure}")
    
    return errors