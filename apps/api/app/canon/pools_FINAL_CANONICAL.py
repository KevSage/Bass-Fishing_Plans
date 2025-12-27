# apps/api/app/canon/pools.py
"""
CANONICAL POOLS - SINGLE SOURCE OF TRUTH
All lures, colors, presentations, and rules for BFP.
Merged from patterns/catalog.py and original canon/pools.py.
"""

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
    "soft jerkbait",
    "ned rig",
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
    "underspin": {"primary": True, "secondary": False, "accent": True},
    
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
    # E) SOFT PLASTIC BODIES - 2 lures
    # ========================================
    # Standalone plastic (not rigs)
    # Zones: primary, secondary optional, accent optional (tail/belly)
    # Metallic: ABSOLUTELY FORBIDDEN
    
    "soft jerkbait": {"primary": True, "secondary": False, "accent": False},
    "paddle tail swimbait": {"primary": True, "secondary": False, "accent": False},
    
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
    "ned rig": {"finesse worm", "stickbait"},
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
    "soft jerkbait": "Hovering / Mid-Column Finesse",
    "ned rig": "Hovering / Mid-Column Finesse",
    "dropshot": "Hovering / Mid-Column Finesse",

    # Topwater - Horizontal
    "walking bait": "Topwater - Horizontal",
    "buzzbait": "Topwater - Horizontal",
    "whopper plopper": "Topwater - Horizontal",
    "wake bait": "Topwater - Horizontal",

    # Topwater - Precision / Vertical Surface Work
    "hollow body frog": "Topwater - Precision / Vertical Surface Work",
    "popping frog": "Topwater - Precision / Vertical Surface Work",
    "popper": "Topwater - Precision / Vertical Surface Work",
}

# ----------------------------------------
# HARD RESTRICTIONS (LOCKED)
# ----------------------------------------
CHUNK_ALLOWED_BASE_LURES = {"casting jig", "football jig"}
BOTTOM_JIGS = {"casting jig", "football jig"}
BAITFISH_SET = {"soft jerkbait", "small minnow", "paddle tail swimbait"}


# ----------------------------------------
# COLOR ZONE EXPANSION
# ----------------------------------------

def expand_color_zones(lure: str, llm_colors: list[str]) -> dict:
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
    
    Format: {lure}__{primary}__{accent}.png
    
    Examples:
        spinnerbait__chartreuse_white__gold.png
        texas_rig__green_pumpkin__watermelon_red.png
        popper__white__null.png
    
    Args:
        lure: Base lure name
        zones: Expanded zone dict
    
    Returns:
        Asset filename (no path, just name.png)
    """
    # Normalize color names for filenames (replace / and spaces with _)
    def normalize(color):
        if not color:
            return "null"
        return color.replace("/", "_").replace(" ", "_")
    
    primary = normalize(zones["primary_color"])
    secondary = normalize(zones.get("secondary_color"))
    accent = normalize(zones.get("accent_color"))
    
    # Build key based on what zones are populated
    if accent and accent != "null":
        # Has accent (blade finish)
        key = f"{lure}__{primary}__{accent}"
    elif secondary and secondary != "null":
        # Has secondary (back/flake on soft plastic)
        key = f"{lure}__{primary}__{secondary}"
    else:
        # Primary only
        key = f"{lure}__{primary}"
    
    return f"{key}.png"


def validate_color_zones(lure: str, zones: dict) -> list[str]:
    """
    Validate expanded color zones for a lure.
    
    Returns:
        List of error strings (empty if valid)
    """
    errors = []
    
    if lure not in LURE_ZONE_SCHEMA:
        errors.append(f"Unknown lure: {lure}")
        return errors
    
    schema = LURE_ZONE_SCHEMA[lure]
    
    # Validate primary (always required)
    if not zones.get("primary_color"):
        errors.append(f"{lure} requires primary_color")
    elif zones["primary_color"] not in COLOR_POOL:
        errors.append(f"Invalid primary_color: {zones['primary_color']}")
    
    # Validate secondary (if present)
    if zones.get("secondary_color"):
        if schema.get("secondary") is None:  # Zone not supported
            errors.append(f"{lure} does not support secondary_color")
        elif zones["secondary_color"] not in COLOR_POOL:
            errors.append(f"Invalid secondary_color: {zones['secondary_color']}")
    
    # Validate accent (if present)
    if zones.get("accent_color"):
        if schema.get("accent") is None:  # Zone not supported
            errors.append(f"{lure} does not support accent_color")
        elif zones["accent_color"] not in COLOR_POOL:
            errors.append(f"Invalid accent_color: {zones['accent_color']}")
    
    # Validate metallic restrictions
    is_rig_icon = lure in RIG_ICON_LURES
    is_soft_body = lure in SOFT_PLASTIC_BODY_LURES
    is_frog = lure in FROG_LURES
    is_jig = lure in JIG_LURES
    is_blade_bait = lure == "blade bait"
    
    metallics_forbidden = is_rig_icon or is_soft_body or is_frog or is_jig
    
    # Check primary
    if zones.get("primary_color") in METALLIC_COLORS:
        if is_blade_bait:
            # OK - primary IS metal, should have primary_material set
            if not zones.get("primary_material") == "metallic":
                errors.append(f"blade bait with metallic primary must have primary_material='metallic'")
        elif metallics_forbidden:
            lure_type = "frog" if is_frog else "jig" if is_jig else "rig icon" if is_rig_icon else "soft plastic"
            errors.append(f"Metallic color '{zones['primary_color']}' not allowed on {lure} ({lure_type})")
    
    # Check secondary (metallics almost never valid in secondary)
    if zones.get("secondary_color") in METALLIC_COLORS:
        errors.append(f"Metallic color '{zones['secondary_color']}' not allowed in secondary_color for {lure}")
    
    # Accent can be metallic (hardware finishes) - no restriction
    
    return errors

