# apps/api/app/canon/variety.py
"""
Variety System for Bass Clarity - CONDITION-AWARE TIERS

CRITICAL: Tiers are DYNAMIC based on season, temperature, and conditions.
A lure's tier changes based on when/where it excels.

Philosophy:
- Tier 1 = Optimal for THESE specific conditions
- Tier 2 = Good alternative for THESE conditions
- Tier 3 = Valid but less ideal for THESE conditions

Example: Soft jerkbait
- Spring/post-spawn (55-65°F): TIER 1 (suspended bass feeding)
- Summer (75°F+): TIER 3 (bass deeper, less suspended)
- Cold water (<50°F): TIER 2 (works but slower retrieves needed)
"""
from typing import Dict, List, Optional
import random

from app.canon.pools import (
    PRESENTATIONS,
    LURE_POOL,
    LURE_TO_PRESENTATION,
    RIG_COLORS,
    BLADED_SKIRTED_COLORS,
    SOFT_SWIMBAIT_COLORS,
    CRANKBAIT_COLORS,
    JERKBAIT_COLORS,
    TOPWATER_COLORS,
    FROG_COLORS,
    get_color_pool_for_lure,
)


# ============================================================================
# CONDITION-AWARE LURE TIER FUNCTIONS
# ============================================================================

def get_lure_tiers_for_presentation(
    presentation: str,
    weather: Dict,
    phase: str,
) -> Dict[str, List[str]]:
    """
    Get dynamic lure tiers for a presentation based on conditions.
    
    Args:
        presentation: Presentation family
        weather: Weather data (temp_f, wind_mph, clarity_estimate)
        phase: Bass phase (pre-spawn, spawn, post-spawn, summer, fall, winter)
    
    Returns:
        {
            "tier1": [lure1, lure2],  # Best for these conditions
            "tier2": [lure3, lure4],  # Good alternatives
            "tier3": [lure5],         # Valid but less ideal
        }
    """
    temp = weather.get("temp_f", 60)
    wind = weather.get("wind_mph", 0) or weather.get("wind_speed", 0)
    clarity = weather.get("clarity_estimate", "average")
    phase_lower = phase.lower()
    
    # Route to presentation-specific logic
    if presentation == "Horizontal Reaction":
        return _tiers_horizontal_reaction(temp, wind, clarity, phase_lower)
    elif presentation == "Vertical Reaction":
        return _tiers_vertical_reaction(temp, wind, clarity, phase_lower)
    elif presentation == "Bottom Contact - Dragging":
        return _tiers_bottom_dragging(temp, wind, clarity, phase_lower)
    elif presentation == "Bottom Contact - Hopping / Targeted":
        return _tiers_bottom_hopping(temp, wind, clarity, phase_lower)
    elif presentation == "Hovering / Mid-Column Finesse":
        return _tiers_hovering_finesse(temp, wind, clarity, phase_lower)
    elif presentation == "Topwater - Horizontal":
        return _tiers_topwater_horizontal(temp, wind, clarity, phase_lower)
    elif presentation == "Topwater - Precision / Vertical Surface Work":
        return _tiers_topwater_precision(temp, wind, clarity, phase_lower)
    else:
        # Fallback: all lures for this presentation, no tiers
        valid_lures = _get_all_lures_for_presentation(presentation)
        return {"tier1": valid_lures, "tier2": [], "tier3": []}


def _get_all_lures_for_presentation(presentation: str) -> List[str]:
    """Get all valid lures for a presentation."""
    valid = []
    for lure, pres in LURE_TO_PRESENTATION.items():
        if isinstance(pres, list):
            if presentation in pres:
                valid.append(lure)
        elif pres == presentation:
            valid.append(lure)
    return valid


# ============================================================================
# PRESENTATION-SPECIFIC TIER LOGIC
# ============================================================================

def _tiers_horizontal_reaction(temp: float, wind: float, clarity: str, phase: str) -> Dict:
    """
    Horizontal Reaction: chatterbait, spinnerbait, swim jig, lipless, cranks, underspin, paddle tail
    
    Conditions that matter:
    - Wind: Bladed (chatterbait/spinner) excel in wind
    - Temp: Warm = faster retrieves, cold = slower
    - Clarity: Stained = vibration (bladed), clear = profile (jigs/swimbaits)
    - Phase: Spawn = shallow cranks, post-spawn = swimbaits
    """
    
    # Pre-spawn / Spawn (50-65°F) - Shallow, aggressive
    if "pre-spawn" in phase or "spawn" in phase:
        if clarity in ["stained", "muddy"]:
            return {
                "tier1": ["chatterbait", "spinnerbait"],  # Vibration for stained water
                "tier2": ["shallow crankbait", "lipless crankbait"],
                "tier3": ["swim jig", "paddle tail swimbait"],
            }
        else:  # Clear water
            return {
                "tier1": ["swim jig", "shallow crankbait"],  # Natural profile
                "tier2": ["chatterbait", "paddle tail swimbait"],
                "tier3": ["spinnerbait", "underspin"],
            }
    
    # Post-spawn (65-70°F) - Suspended, recovering
    elif "post-spawn" in phase:
        return {
            "tier1": ["paddle tail swimbait", "swim jig"],  # Target suspended bass
            "tier2": ["underspin", "shallow crankbait"],
            "tier3": ["chatterbait", "spinnerbait"],
        }
    
    # Summer (70°F+) - Active, chasing
    elif temp >= 70:
        if wind > 10:  # Windy conditions
            return {
                "tier1": ["chatterbait", "spinnerbait"],  # Bladed excels in wind
                "tier2": ["lipless crankbait"],
                "tier3": ["swim jig", "shallow crankbait"],
            }
        else:  # Calm conditions
            return {
                "tier1": ["swim jig", "paddle tail swimbait"],
                "tier2": ["chatterbait", "shallow crankbait"],
                "tier3": ["spinnerbait", "underspin"],
            }
    
    # Fall (55-70°F) - Feeding up
    elif "fall" in phase or (55 <= temp < 70):
        return {
            "tier1": ["chatterbait", "lipless crankbait"],  # Aggressive feeding
            "tier2": ["spinnerbait", "swim jig"],
            "tier3": ["shallow crankbait", "paddle tail swimbait"],
        }
    
    # Cold water (<55°F) - Slower
    else:
        return {
            "tier1": ["lipless crankbait", "shallow crankbait"],  # Slower retrieves
            "tier2": ["swim jig", "underspin"],
            "tier3": ["chatterbait", "spinnerbait"],
        }


def _tiers_vertical_reaction(temp: float, wind: float, clarity: str, phase: str) -> Dict:
    """
    Vertical Reaction: jerkbait, blade bait
    
    Jerkbait excels: Cold water (40-60°F), clear water, suspended bass
    Blade bait excels: Deep, cold water, vertical jigging
    """
    
    # Cold water (40-60°F) - Prime jerkbait conditions
    if 40 <= temp <= 60:
        if clarity in ["clear", "average"]:
            return {
                "tier1": ["jerkbait"],  # Prime conditions
                "tier2": ["blade bait"],
                "tier3": [],
            }
        else:  # Stained/muddy
            return {
                "tier1": ["blade bait"],  # Vibration over visual
                "tier2": ["jerkbait"],
                "tier3": [],
            }
    
    # Warm water (>70°F) - Less effective
    elif temp > 70:
        return {
            "tier1": [],
            "tier2": ["jerkbait"],  # Can work early morning
            "tier3": ["blade bait"],
        }
    
    # Default
    else:
        return {
            "tier1": ["jerkbait"],
            "tier2": ["blade bait"],
            "tier3": [],
        }


def _tiers_bottom_dragging(temp: float, wind: float, clarity: str, phase: str) -> Dict:
    """
    Bottom Contact - Dragging: texas rig, carolina rig, football jig, shaky head, casting jig
    
    Texas rig: Year-round, versatile (maybe TOO common - force variety)
    Carolina rig: Deeper water, covering ground
    Football jig: Rocks/hard bottom
    Shaky head: Finesse, pressured bass
    """
    
    # Cold water (<50°F) - Slow, finesse
    if temp < 50:
        return {
            "tier1": ["shaky head", "football jig"],  # Finesse for cold bass
            "tier2": ["texas rig", "carolina rig"],
            "tier3": ["casting jig"],
        }
    
    # Pre-spawn (50-60°F) - Staging deeper
    elif "pre-spawn" in phase or (50 <= temp < 60):
        return {
            "tier1": ["carolina rig", "football jig"],  # Cover deep staging areas
            "tier2": ["texas rig", "shaky head"],
            "tier3": ["casting jig"],
        }
    
    # Spawn (60-70°F) - Shallow, cover
    elif "spawn" in phase:
        return {
            "tier1": ["texas rig", "casting jig"],  # Flip/pitch to cover
            "tier2": ["carolina rig"],
            "tier3": ["football jig", "shaky head"],
        }
    
    # Summer/Fall (warm) - Active
    else:
        return {
            "tier1": ["texas rig", "football jig"],  # Versatile, productive
            "tier2": ["carolina rig", "shaky head"],
            "tier3": ["casting jig"],
        }


def _tiers_bottom_hopping(temp: float, wind: float, clarity: str, phase: str) -> Dict:
    """
    Bottom Contact - Hopping / Targeted: Same lures, different retrieve
    
    Hopping = aggressive, targeted strikes
    Dragging = covering ground
    """
    
    # Warm water (>65°F) - Aggressive
    if temp >= 65:
        return {
            "tier1": ["football jig", "casting jig"],  # Hopping works best
            "tier2": ["texas rig"],
            "tier3": ["carolina rig", "shaky head"],
        }
    
    # Cold water - Less aggressive hopping
    else:
        return {
            "tier1": ["football jig", "shaky head"],  # Subtle hops
            "tier2": ["texas rig", "casting jig"],
            "tier3": ["carolina rig"],
        }


def _tiers_hovering_finesse(temp: float, wind: float, clarity: str, phase: str) -> Dict:
    """
    Hovering / Mid-Column Finesse: dropshot, ned rig, neko rig, wacky rig, soft jerkbait
    
    KEY INSIGHT: Soft jerkbait is TIER 1 in spring (post-spawn suspended bass)
    
    Post-spawn: Soft jerkbait dominates (suspended, feeding)
    Cold water: Dropshot, ned rig (vertical, finesse)
    Summer: Neko, wacky (pressured bass)
    """
    
    # Post-spawn (60-70°F) - SOFT JERKBAIT PRIME TIME
    if "post-spawn" in phase or (60 <= temp <= 70 and "spring" in phase):
        return {
            "tier1": ["soft jerkbait", "dropshot"],  # Suspended bass feeding
            "tier2": ["ned rig", "neko rig"],
            "tier3": ["wacky rig"],
        }
    
    # Cold water (<55°F) - Vertical finesse
    elif temp < 55:
        return {
            "tier1": ["dropshot", "ned rig"],  # Precise vertical presentation
            "tier2": ["neko rig"],
            "tier3": ["soft jerkbait", "wacky rig"],
        }
    
    # Summer (>75°F) - Pressured, finesse
    elif temp > 75:
        return {
            "tier1": ["neko rig", "wacky rig"],  # Subtle, natural
            "tier2": ["dropshot", "ned rig"],
            "tier3": ["soft jerkbait"],
        }
    
    # Default
    else:
        return {
            "tier1": ["dropshot", "ned rig"],
            "tier2": ["soft jerkbait", "neko rig"],
            "tier3": ["wacky rig"],
        }


def _tiers_topwater_horizontal(temp: float, wind: float, clarity: str, phase: str) -> Dict:
    """
    Topwater - Horizontal: walking bait, buzzbait, whopper plopper, wake bait
    
    KEY: Topwater needs warm water (65°F+)
    
    Walking bait: Clear water, calm
    Buzzbait: Stained water, wind, low light
    Whopper plopper: Versatile, early morning/evening
    Wake bait: Subtle, pressured fish
    """
    
    # Cold water (<65°F) - Not ideal for topwater
    if temp < 65:
        return {
            "tier1": [],
            "tier2": ["whopper plopper"],  # Most versatile in marginal temps
            "tier3": ["walking bait", "buzzbait"],
        }
    
    # Warm water (65°F+) - Topwater prime time
    else:
        if clarity in ["stained", "muddy"] or wind > 8:
            return {
                "tier1": ["buzzbait", "whopper plopper"],  # Sound/vibration
                "tier2": ["walking bait"],
                "tier3": ["wake bait"],
            }
        else:  # Clear, calm
            return {
                "tier1": ["walking bait", "whopper plopper"],  # Visual
                "tier2": ["wake bait"],
                "tier3": ["buzzbait"],
            }


def _tiers_topwater_precision(temp: float, wind: float, clarity: str, phase: str) -> Dict:
    """
    Topwater - Precision: hollow body frog, popping frog, popper
    
    Frogs: Heavy cover, pads, grass
    Popper: Open water pockets
    """
    
    # Warm water (65°F+)
    if temp >= 65:
        # Spawn/summer with vegetation
        if "spawn" in phase or "summer" in phase:
            return {
                "tier1": ["hollow body frog", "popping frog"],  # Vegetation present
                "tier2": ["popper"],
                "tier3": [],
            }
        else:
            return {
                "tier1": ["popper", "hollow body frog"],
                "tier2": ["popping frog"],
                "tier3": [],
            }
    
    # Cold water - Not effective
    else:
        return {
            "tier1": [],
            "tier2": ["popper"],
            "tier3": ["hollow body frog", "popping frog"],
        }


# ============================================================================
# COLOR TIER LOGIC (Simplified - colors less seasonal than lures)
# ============================================================================

# Color tiers are relatively static since they're more about clarity than season
# But I'll include them for completeness

COLOR_TIERS = {
    # RIG_COLORS lures
    "texas rig": {
        "clear": {
            "tier1": ["green pumpkin", "baby bass"],
            "tier2": ["watermelon red", "green pumpkin orange"],
            "tier3": ["peanut butter & jelly", "red craw"],
        },
        "stained": {
            "tier1": ["black/blue", "junebug"],
            "tier2": ["black", "watermelon red"],
            "tier3": ["green pumpkin orange"],
        },
    },
    "carolina rig": {
        "clear": {
            "tier1": ["green pumpkin", "baby bass"],
            "tier2": ["watermelon red"],
            "tier3": ["peanut butter & jelly"],
        },
        "stained": {
            "tier1": ["black/blue", "junebug"],
            "tier2": ["black"],
            "tier3": ["watermelon red"],
        },
    },
    "shaky head": {
        "clear": {
            "tier1": ["green pumpkin", "watermelon red"],
            "tier2": ["baby bass", "peanut butter & jelly"],
            "tier3": ["green pumpkin orange"],
        },
        "stained": {
            "tier1": ["black/blue", "junebug"],
            "tier2": ["black"],
            "tier3": ["watermelon red"],
        },
    },
    "ned rig": {
        "clear": {
            "tier1": ["green pumpkin", "baby bass"],
            "tier2": ["watermelon red"],
            "tier3": ["peanut butter & jelly"],
        },
        "stained": {
            "tier1": ["black/blue", "junebug"],
            "tier2": ["black"],
            "tier3": ["green pumpkin orange"],
        },
    },
    "neko rig": {
        "clear": {
            "tier1": ["green pumpkin", "watermelon red"],
            "tier2": ["baby bass"],
            "tier3": ["peanut butter & jelly"],
        },
        "stained": {
            "tier1": ["junebug", "black/blue"],
            "tier2": ["black"],
            "tier3": ["watermelon red"],
        },
    },
    "wacky rig": {
        "clear": {
            "tier1": ["green pumpkin", "watermelon red"],
            "tier2": ["baby bass"],
            "tier3": ["peanut butter & jelly"],
        },
        "stained": {
            "tier1": ["junebug", "black"],
            "tier2": ["black/blue"],
            "tier3": ["green pumpkin orange"],
        },
    },
    "football jig": {
        "clear": {
            "tier1": ["white", "shad"],  # ← BLADED_SKIRTED_COLORS (correct!)
            "tier2": ["bluegill", "green pumpkin"],
            "tier3": ["red craw"],
        },
        "stained": {
            "tier1": ["chartreuse/white", "black/blue"],
            "tier2": ["chartreuse"],
            "tier3": ["green pumpkin"],
        },
    },
    "casting jig": {
        "clear": {
            "tier1": ["white", "shad"],  # ← BLADED_SKIRTED_COLORS (correct!)
            "tier2": ["bluegill", "green pumpkin"],
            "tier3": ["red craw"],
        },
        "stained": {
            "tier1": ["chartreuse/white", "black/blue"],
            "tier2": ["chartreuse"],
            "tier3": ["green pumpkin"],
        },
    },
    
    # BLADED_SKIRTED_COLORS lures
    "chatterbait": {
        "clear": {
            "tier1": ["white", "shad"],
            "tier2": ["bluegill", "green pumpkin"],
            "tier3": ["red craw"],
        },
        "stained": {
            "tier1": ["chartreuse/white", "black/blue"],
            "tier2": ["chartreuse"],
            "tier3": ["green pumpkin"],
        },
    },
    "spinnerbait": {
        "clear": {
            "tier1": ["white", "shad"],
            "tier2": ["bluegill"],
            "tier3": ["green pumpkin"],
        },
        "stained": {
            "tier1": ["chartreuse/white", "chartreuse"],
            "tier2": ["black/blue"],
            "tier3": ["white"],
        },
    },
    "swim jig": {
        "clear": {
            "tier1": ["white", "shad"],
            "tier2": ["bluegill", "green pumpkin"],
            "tier3": ["red craw"],
        },
        "stained": {
            "tier1": ["chartreuse/white", "black/blue"],
            "tier2": ["chartreuse"],
            "tier3": ["white"],
        },
    },
    "buzzbait": {
        "clear": {
            "tier1": ["white", "shad"],
            "tier2": ["bluegill"],
            "tier3": ["chartreuse"],
        },
        "stained": {
            "tier1": ["chartreuse/white", "chartreuse"],
            "tier2": ["black/blue"],
            "tier3": ["white"],
        },
    },
    "underspin": {
        "clear": {
            "tier1": ["white", "shad"],
            "tier2": ["bluegill"],
            "tier3": ["green pumpkin"],
        },
        "stained": {
            "tier1": ["chartreuse/white"],
            "tier2": ["chartreuse"],
            "tier3": ["black/blue"],
        },
    },
    "blade bait": {
        "clear": {
            "tier1": ["white", "shad"],
            "tier2": ["bluegill"],
            "tier3": ["chartreuse"],
        },
        "stained": {
            "tier1": ["chartreuse/white", "chartreuse"],
            "tier2": ["black/blue"],
            "tier3": ["white"],
        },
    },
    
    # SOFT_SWIMBAIT_COLORS
    "paddle tail swimbait": {
        "clear": {
            "tier1": ["white", "shad"],
            "tier2": ["pearl", "bluegill"],
            "tier3": ["green pumpkin"],
        },
        "stained": {
            "tier1": ["white", "pearl"],
            "tier2": ["shad"],
            "tier3": ["green pumpkin"],
        },
    },
    "soft jerkbait": {
        "clear": {
            "tier1": ["white", "shad"],
            "tier2": ["pearl"],
            "tier3": ["bluegill"],
        },
        "stained": {
            "tier1": ["white", "pearl"],
            "tier2": ["shad"],
            "tier3": ["green pumpkin"],
        },
    },
    
    # CRANKBAIT_COLORS
    "shallow crankbait": {
        "clear": {
            "tier1": ["sexy shad", "ghost shad"],
            "tier2": ["bluegill", "citrus shad"],
            "tier3": ["chrome"],
        },
        "stained": {
            "tier1": ["chartreuse/black", "firetiger"],
            "tier2": ["red craw"],
            "tier3": ["gold"],
        },
    },
    "mid crankbait": {
        "clear": {
            "tier1": ["sexy shad", "ghost shad"],
            "tier2": ["bluegill", "citrus shad"],
            "tier3": ["chrome"],
        },
        "stained": {
            "tier1": ["chartreuse/black", "firetiger"],
            "tier2": ["red craw"],
            "tier3": ["gold"],
        },
    },
    "deep crankbait": {
        "clear": {
            "tier1": ["sexy shad", "citrus shad"],
            "tier2": ["ghost shad", "bluegill"],
            "tier3": ["chrome"],
        },
        "stained": {
            "tier1": ["chartreuse/black", "firetiger"],
            "tier2": ["red craw"],
            "tier3": ["gold"],
        },
    },
    "lipless crankbait": {
        "clear": {
            "tier1": ["sexy shad", "citrus shad"],
            "tier2": ["ghost shad", "bluegill"],
            "tier3": ["chrome"],
        },
        "stained": {
            "tier1": ["chartreuse/black", "firetiger"],
            "tier2": ["red craw"],
            "tier3": ["gold"],
        },
    },
    "blade bait": {  # ← NEW: Uses CRANKBAIT_COLORS
        "clear": {
            "tier1": ["sexy shad", "ghost shad"],
            "tier2": ["bluegill", "citrus shad"],
            "tier3": ["chrome", "gold"],
        },
        "stained": {
            "tier1": ["chartreuse/black", "firetiger"],
            "tier2": ["red craw"],
            "tier3": ["sexy shad"],
        },
    },
    
    # JERKBAIT_COLORS
    "jerkbait": {
        "clear": {
            "tier1": ["ghost minnow", "transparent"],
            "tier2": ["bone", "natural shad"],
            "tier3": ["chrome", "white"],
        },
        "stained": {
            "tier1": ["pro blue", "table rock"],
            "tier2": ["red craw"],
            "tier3": ["gold"],
        },
    },
    
    # TOPWATER_COLORS
    "walking bait": {
        "clear": {
            "tier1": ["bone", "chrome"],
            "tier2": ["shad", "translucent"],
            "tier3": ["bluegill"],
        },
        "stained": {
            "tier1": ["black", "bone"],
            "tier2": ["chrome"],
            "tier3": ["shad"],
        },
    },
    "whopper plopper": {
        "clear": {
            "tier1": ["bone", "translucent"],
            "tier2": ["shad"],
            "tier3": ["bluegill"],
        },
        "stained": {
            "tier1": ["black", "bone"],
            "tier2": ["chrome"],
            "tier3": ["shad"],
        },
    },
    "wake bait": {
        "clear": {
            "tier1": ["bone", "shad"],
            "tier2": ["translucent"],
            "tier3": ["chrome"],
        },
        "stained": {
            "tier1": ["black", "bone"],
            "tier2": ["shad"],
            "tier3": ["chrome"],
        },
    },
    "popper": {
        "clear": {
            "tier1": ["bone", "chrome"],
            "tier2": ["shad"],
            "tier3": ["translucent"],
        },
        "stained": {
            "tier1": ["black", "bone"],
            "tier2": ["chrome"],
            "tier3": ["shad"],
        },
    },
    
    # FROG_COLORS
    "hollow body frog": {
        "clear": {
            "tier1": ["green", "brown"],
            "tier2": ["bluegill"],
            "tier3": ["white"],
        },
        "stained": {
            "tier1": ["black", "green"],
            "tier2": ["yellow"],
            "tier3": ["white"],
        },
    },
    "popping frog": {
        "clear": {
            "tier1": ["green", "brown"],
            "tier2": ["bluegill"],
            "tier3": ["white"],
        },
        "stained": {
            "tier1": ["black", "yellow"],
            "tier2": ["green"],
            "tier3": ["white"],
        },
    },
}


# ============================================================================
# PUBLIC API
# ============================================================================

def get_lure_candidates(
    presentation: str,
    weather: Dict,
    phase: str,
    variety_mode: str = "best",
) -> List[str]:
    """
    Get lure candidates with condition-aware tiers.
    
    Args:
        presentation: Presentation family
        weather: Weather conditions
        phase: Bass phase
        variety_mode: "best" | "alternate" | "deep_cut"
    
    Returns:
        List of lures appropriate for these conditions
    """
    tiers = get_lure_tiers_for_presentation(presentation, weather, phase)
    
    if variety_mode == "best":
        return tiers.get("tier1", []) or tiers.get("tier2", []) or tiers.get("tier3", [])
    elif variety_mode == "alternate":
        return tiers.get("tier2", []) or tiers.get("tier3", []) or tiers.get("tier1", [])
    else:  # deep_cut
        return tiers.get("tier3", []) or tiers.get("tier2", []) or tiers.get("tier1", [])


def get_color_candidates(
    lure: str,
    soft_plastic: Optional[str] = None,
    variety_mode: str = "best",
) -> Dict[str, List[str]]:
    """
    Get color candidates with variety control.
    Returns separate pools for clear and stained lanes.
    """
    if lure not in COLOR_TIERS:
        # Fallback
        try:
            full_pool = list(get_color_pool_for_lure(lure, soft_plastic))
            mid = len(full_pool) // 2
            return {
                "clear": full_pool[:mid] if full_pool else [],
                "stained": full_pool[mid:] if full_pool else [],
            }
        except:
            return {"clear": [], "stained": []}
    
    tiers = COLOR_TIERS[lure]
    
    if variety_mode == "best":
        clear_options = tiers["clear"]["tier1"]
        stained_options = tiers["stained"]["tier1"]
    elif variety_mode == "alternate":
        clear_options = tiers["clear"]["tier2"]
        stained_options = tiers["stained"]["tier2"]
    else:  # deep_cut
        clear_options = tiers["clear"]["tier3"]
        stained_options = tiers["stained"]["tier3"]
    
    return {
        "clear": clear_options,
        "stained": stained_options,
    }


def get_variety_mode() -> str:
    """
    Determine variety mode with weighted randomness.
    
    Returns:
        "best" (40%) | "alternate" (40%) | "deep_cut" (20%)
    """
    roll = random.random()
    if roll < 0.40:
        return "best"
    elif roll < 0.80:
        return "alternate"
    else:
        return "deep_cut"


def get_variety_context(
    weather: Dict,
    phase: str,
) -> Dict:
    """
    Main entry point: Get variety context with condition-aware lure constraints.
    
    This builds a constrained lure pool by getting tier-appropriate lures
    from EACH presentation, then combining them.
    
    Returns:
        {
            "variety_mode": str,
            "constrained_lure_pool": List[str],
        }
    """
    variety_mode = get_variety_mode()
    
    # Build constrained pool from all presentations
    constrained_pool = []
    
    for presentation in PRESENTATIONS:
        lures = get_lure_candidates(presentation, weather, phase, variety_mode)
        constrained_pool.extend(lures)
    
    # Remove duplicates (lures can appear in multiple presentations)
    constrained_pool = list(set(constrained_pool))
    
    return {
        "variety_mode": variety_mode,
        "constrained_lure_pool": constrained_pool,
    }