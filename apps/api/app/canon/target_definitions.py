# apps/api/app/canon/target_definitions.py
"""
Canonical target definitions for bass fishing.
REVISED: Consolidated redundant targets while preserving strategic differences.

Total targets: 34 (down from 48)
- Removed: True duplicates with no strategic difference
- Kept: Targets with distinct tactical approaches (e.g., wind-blown vs shaded banks)
"""
from typing import Dict, List

# Export these for external use
__all__ = [
    'TARGET_DEFINITIONS',
    'filter_targets_by_access',
    'get_bank_friendly_targets',
    'get_boat_only_targets',
    'get_target_definition',
    'get_all_definitions',
    'get_all_targets_with_metadata',
    'get_target_stats',
]

# Full target definitions with access metadata
TARGET_DEFINITIONS = {
    # ========================================
    # SHORELINE FEATURES
    # ========================================
    
    "banks": {
        "definition": "The shoreline edge - can hold shallow or deep water",
        "bank_friendly": True,
    },
    "wind-blown banks": {
        "definition": "Shorelines getting hit by wind - concentrates bait and oxygen",
        "bank_friendly": True,
        "strategic_difference": "Active, oxygenated water with pushed-in baitfish vs calm banks",
    },
    "shaded banks": {
        "definition": "Shorelines with overhead cover from trees or bluffs",
        "bank_friendly": True,
        "strategic_difference": "Comfort zone for inactive fish vs open sunny banks",
    },
    "chunk rock banks": {
        "definition": "Shorelines with large scattered rocks",
        "bank_friendly": True,
    },
    "riprap": {
        "definition": "Large rocks along shorelines - hard cover and shade",
        "bank_friendly": True,
    },
    
    # ========================================
    # SHALLOW COVER
    # ========================================
    
    "laydowns": {
        "definition": "Fallen trees lying in the water - prime ambush cover",
        "bank_friendly": True,
    },
    "standing timber": {
        "definition": "Upright dead trees in the water - vertical structure bass relate to",
        "bank_friendly": True,
    },
    "brush piles": {
        "definition": "Submerged brush or trees placed as fish habitat",
        "bank_friendly": True,
    },
    "docks": {
        "definition": "Boat docks and piers - provide shade and vertical structure",
        "bank_friendly": True,
    },
    "isolated cover": {
        "definition": "Single pieces of cover away from other structure",
        "bank_friendly": True,
    },
    "grass edges": {
        "definition": "Transition zone between grass and open water",
        "bank_friendly": True,
        "note": "Consolidates: grass lines, edges of vegetation (all mean the same)",
    },
    
    # ========================================
    # SHALLOW AREAS
    # ========================================
    
    "pockets": {
        "definition": "Small coves or indentations in the shoreline - protected shallow areas",
        "bank_friendly": True,
        "note": "Consolidates: spawning pockets, shallow warm pockets (context explains purpose)",
    },
    "flats": {
        "definition": "Large shallow areas with relatively even depth",
        "bank_friendly": True,
        "note": "Consolidates: shallow flats (redundant modifier)",
    },
    
    # ========================================
    # POINTS
    # ========================================
    
    "points": {
        "definition": "Fingers of land extending into the water - key ambush and travel routes",
        "bank_friendly": True,
        "note": "Consolidates: secondary points, wind-blown points (LLM explains staging/wind context)",
    },
    "main-lake points": {
        "definition": "Primary points on the main body of the lake - major feeding and transition zones",
        "bank_friendly": False,
        "strategic_difference": "Offshore positioning required vs shore-accessible points",
    },
    
    # ========================================
    # DEPTH TRANSITIONS
    # ========================================
    
    "first depth break": {
        "definition": "The first significant drop from shallow to deeper water",
        "bank_friendly": True,
        "strategic_difference": "Initial transition vs deeper breaks - different bass positioning",
    },
    "breaks": {
        "definition": "Any distinct change in bottom contour or depth",
        "bank_friendly": True,
        "note": "Consolidates: drop-offs, steeper breaks (degree of change is contextual)",
    },
    "transitions": {
        "definition": "Where one type of bottom or cover changes to another",
        "bank_friendly": True,
    },
    "hard-bottom transitions": {
        "definition": "Where soft mud or sand meets hard rock or clay - feeding zones",
        "bank_friendly": True,
    },
    
    # ========================================
    # CHANNELS & BENDS
    # ========================================
    
    "channel swings": {
        "definition": "Where the creek channel bends or curves - natural ambush zones",
        "bank_friendly": True,
    },
    "inside turns": {
        "definition": "Inside bend of creek channels or shorelines - shallower, calmer areas",
        "bank_friendly": True,
    },
    "outside bends": {
        "definition": "Outside bend of creek channels - deeper water with current deflection",
        "bank_friendly": True,
    },
    "creek channels": {
        "definition": "Submerged creek beds - deep water highways",
        "bank_friendly": False,
    },
    
    # ========================================
    # CURRENT & FLOW
    # ========================================
    
    "current seams": {
        "definition": "Where moving water meets still water - feeding lanes",
        "bank_friendly": True,
    },
    "current-influenced areas": {
        "definition": "Zones with water movement from wind, inflow, or dam discharge",
        "bank_friendly": True,
    },
    "eddies": {
        "definition": "Calm pockets behind structure in current",
        "bank_friendly": True,
    },
    
    # ========================================
    # OFFSHORE STRUCTURE (BOAT ONLY)
    # ========================================
    
    "humps": {
        "definition": "Underwater mounds that rise from the bottom - isolated feeding stations",
        "bank_friendly": False,
    },
    "ledges": {
        "definition": "Underwater shelves or drop-offs - major depth transitions bass use",
        "bank_friendly": False,
    },
    "saddles": {
        "definition": "Low spots between two high points underwater",
        "bank_friendly": False,
    },
    "roadbeds": {
        "definition": "Old submerged roads - deep structure highways",
        "bank_friendly": False,
    },
    "main lake structure": {
        "definition": "Points, humps, and ledges on the main body of the lake",
        "bank_friendly": False,
    },
    "mid-lake structure": {
        "definition": "Isolated structure in the middle sections of the lake",
        "bank_friendly": False,
    },
    "basin-adjacent structure": {
        "definition": "Structure (points, humps, ledges) positioned near the deepest parts of the lake",
        "bank_friendly": False,
    },
    "flats adjacent to deep water": {
        "definition": "Shallow areas next to channels or deep basins - requires boat to fish both zones",
        "bank_friendly": False,
        "strategic_difference": "Offshore flat/deep combo vs simple shallow flats",
    },
}


# ============================================================================
# REMOVED TARGETS (Consolidated into others)
# ============================================================================

REMOVED_TARGETS = {
    # These were removed because they're redundant with existing targets:
    
    "secondary points": "Consolidated into 'points' - LLM can explain staging areas",
    "wind-blown points": "Consolidated into 'points' - LLM can explain wind influence",
    "grass lines": "Duplicate of 'grass edges'",
    "edges of vegetation": "Duplicate of 'grass edges'",
    "shallow flats": "Redundant modifier - consolidated into 'flats'",
    "spawning pockets": "Consolidated into 'pockets' - spawning context is seasonal",
    "shallow warm pockets": "Consolidated into 'pockets' - warmth is seasonal context",
    "docks and man-made structure": "Duplicate of 'docks'",
    "drop-offs": "Consolidated into 'breaks'",
    "steeper breaks": "Consolidated into 'breaks' - steepness is contextual",
    "shade lines and shadow edges": "Not a target - it's a positioning detail within other targets",
    "bottom-oriented cover: wood/rock/grasslines": "Redundant - covered by laydowns/riprap/grass edges",
    "intersections": "Vague and offshore-biased - removed",
    "staging structure near spawning pockets": "Too specific - covered by 'flats adjacent to deep water'",
}


# ============================================================================
# ACCESS FILTERING
# ============================================================================

def filter_targets_by_access(access_type: str) -> List[str]:
    """
    Filter targets based on angler access type.
    
    Args:
        access_type: "boat" or "bank"
    
    Returns:
        List of accessible target names
    """
    if access_type == "boat":
        return list(TARGET_DEFINITIONS.keys())
    
    elif access_type == "bank":
        return [
            target_name
            for target_name, target_data in TARGET_DEFINITIONS.items()
            if target_data.get("bank_friendly", False)
        ]
    
    else:
        # Default to boat if unknown
        return list(TARGET_DEFINITIONS.keys())


def get_bank_friendly_targets() -> List[str]:
    """Get list of all bank-friendly targets."""
    return [
        target_name
        for target_name, target_data in TARGET_DEFINITIONS.items()
        if target_data.get("bank_friendly", False)
    ]


def get_boat_only_targets() -> List[str]:
    """Get list of targets that require boat access."""
    return [
        target_name
        for target_name, target_data in TARGET_DEFINITIONS.items()
        if not target_data.get("bank_friendly", False)
    ]


# ============================================================================
# BACKWARD COMPATIBILITY
# ============================================================================

def get_target_definition(target: str) -> str:
    """
    Get the definition for a target.
    
    Args:
        target: Target name (case-insensitive)
        
    Returns:
        Definition string, or empty string if not found
    """
    target_lower = target.lower().strip()
    target_data = TARGET_DEFINITIONS.get(target_lower, {})
    
    if isinstance(target_data, dict):
        return target_data.get("definition", "")
    else:
        return str(target_data)


def get_all_definitions() -> Dict[str, str]:
    """
    Get all target definitions (definition text only).
    
    Returns:
        Dict mapping target name to definition string
    """
    return {
        target_name: target_data.get("definition", "")
        for target_name, target_data in TARGET_DEFINITIONS.items()
    }


def get_all_targets_with_metadata() -> Dict[str, Dict]:
    """
    Get all targets with full metadata (definition + bank_friendly + notes).
    
    Returns:
        Dict mapping target name to target data dict
    """
    return TARGET_DEFINITIONS.copy()


# ============================================================================
# STATISTICS & DEBUGGING
# ============================================================================

def get_target_stats() -> Dict[str, int]:
    """Get statistics about target access distribution."""
    total = len(TARGET_DEFINITIONS)
    bank_friendly = len(get_bank_friendly_targets())
    boat_only = len(get_boat_only_targets())
    
    return {
        "total_targets": total,
        "bank_friendly": bank_friendly,
        "boat_only": boat_only,
        "bank_percentage": round(bank_friendly / total * 100, 1),
    }


if __name__ == "__main__":
    # Print statistics
    stats = get_target_stats()
    print("=" * 60)
    print("REVISED TARGET STATISTICS")
    print("=" * 60)
    print(f"Total targets: {stats['total_targets']} (was 48)")
    print(f"Bank-friendly: {stats['bank_friendly']} ({stats['bank_percentage']}%)")
    print(f"Boat-only: {stats['boat_only']}")
    print()
    
    # Show removed targets
    print("REMOVED TARGETS (13):")
    for target, reason in REMOVED_TARGETS.items():
        print(f"  ❌ {target}")
        print(f"     → {reason}")
    print()
    
    # Test filtering
    print("BANK-ACCESSIBLE TARGETS:")
    bank_targets = filter_targets_by_access("bank")
    for target in sorted(bank_targets):
        print(f"  ✅ {target}")
    print()
    
    print("BOAT-ONLY TARGETS:")
    boat_only = get_boat_only_targets()
    for target in sorted(boat_only):
        print(f"  🚤 {target}")