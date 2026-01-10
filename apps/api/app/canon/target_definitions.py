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
    # CATEGORY A: AGGRESSIVE ZONE TARGETS (Power Search / Reaction)
    # ========================================
    
    "grass edges": {
        "definition": "Transition zone where vegetation meets open water",
        "bank_friendly": True,
        "strategic_category": "aggressive_zones",
        "note": "Consolidates: grass lines, edges of vegetation",
    },
    
    "wind-blown banks": {
        "definition": "Shorelines actively receiving wind and wave action",
        "bank_friendly": True,
        "strategic_category": "aggressive_zones",
        "note": "Consolidates: wind-blown points, active shorelines",
    },
    
    "offshore points": {
        "definition": "Points on main lake extending into deep water",
        "bank_friendly": False,
        "strategic_category": "aggressive_zones",
        "note": "Consolidates: main-lake points, secondary points, points",
    },
    
    "flats": {
        "definition": "Large shallow areas with relatively even depth",
        "bank_friendly": True,
        "strategic_category": "aggressive_zones",
        "note": "Consolidates: shallow flats, flats adjacent to deep water (context explains depth access)",
    },
    
    "channel swings": {
        "definition": "Where creek channels bend or curve",
        "bank_friendly": True,
        "strategic_category": "aggressive_zones",
        "note": "Consolidates: inside turns, outside bends, channel bends",
    },
    
    "current breaks": {
        "definition": "Where moving water meets still water or structure deflects current",
        "bank_friendly": True,
        "strategic_category": "aggressive_zones",
        "note": "Consolidates: current seams, current-influenced areas, eddies",
    },
    
    # ========================================
    # CATEGORY B: AMBUSH COVER TARGETS (Reaction / Control)
    # ========================================
    
    "laydowns": {
        "definition": "Fallen trees lying in the water",
        "bank_friendly": True,
        "strategic_category": "ambush_cover",
    },
    
    "standing timber": {
        "definition": "Upright dead trees in the water",
        "bank_friendly": True,
        "strategic_category": "ambush_cover",
    },
    
    "docks": {
        "definition": "Boat docks and piers",
        "bank_friendly": True,
        "strategic_category": "ambush_cover",
        "note": "Consolidates: docks and man-made structure",
    },
    
    "riprap": {
        "definition": "Large rocks along shorelines",
        "bank_friendly": True,
        "strategic_category": "ambush_cover",
        "note": "Consolidates: chunk rock banks, riprap",
    },
    
    "isolated cover": {
        "definition": "Single pieces of cover away from other structure",
        "bank_friendly": True,
        "strategic_category": "ambush_cover",
    },
    
    # ========================================
    # CATEGORY C: TRANSITION ZONE TARGETS (Finesse / Neutral)
    # ========================================
    
    "depth breaks": {
        "definition": "Any significant change from shallow to deeper water",
        "bank_friendly": True,
        "strategic_category": "transitions",
        "note": "Consolidates: first depth break, breaks, drop-offs, ledges, steeper breaks",
    },
    
    "hard-bottom transitions": {
        "definition": "Where soft bottom meets hard bottom",
        "bank_friendly": True,
        "strategic_category": "transitions",
    },
    
    "transitions": {
        "definition": "Where one type of cover or bottom changes to another",
        "bank_friendly": True,
        "strategic_category": "transitions",
    },
    
    # ========================================
    # CATEGORY D: DEEP STRUCTURE TARGETS (Control / Offshore)
    # ========================================
    
    "deep offshore structure": {
        "definition": "Underwater mounds, humps, deep points, and basin-adjacent structure",
        "bank_friendly": False,
        "strategic_category": "deep_structure",
        "note": "Consolidates: humps, main lake structure, mid-lake structure, basin-adjacent structure, roadbeds, saddles",
    },
    
    "creek channels": {
        "definition": "Submerged creek beds and deep-water highways",
        "bank_friendly": False,
        "strategic_category": "deep_structure",
    },
    
    # ========================================
    # CATEGORY E: PRECISION/SHADE TARGETS (Finesse)
    # ========================================
    
    "shaded banks": {
        "definition": "Shorelines with overhead cover from trees or bluffs",
        "bank_friendly": True,
        "strategic_category": "precision_shade",
    },
    
    "brush piles": {
        "definition": "Submerged brush or trees placed as fish habitat",
        "bank_friendly": True,
        "strategic_category": "precision_shade",
    },
}


# ============================================================================
# REMOVED TARGETS (Consolidated from 34 → 18)
# ============================================================================

REMOVED_TARGETS = {
    # Consolidated into strategic categories:
    
    "banks": "Too vague - consolidated into wind-blown banks, shaded banks, riprap",
    "chunk rock banks": "Consolidated into 'riprap'",
    "pockets": "Consolidated into 'flats' with seasonal context",
    "points": "Consolidated into 'offshore points'",
    "main-lake points": "Consolidated into 'offshore points'",
    "secondary points": "Consolidated into 'offshore points'",
    "wind-blown points": "Consolidated into 'offshore points' or 'wind-blown banks'",
    "grass lines": "Duplicate of 'grass edges'",
    "edges of vegetation": "Duplicate of 'grass edges'",
    "shallow flats": "Redundant modifier - consolidated into 'flats'",
    "flats adjacent to deep water": "Consolidated into 'flats' with depth context",
    "spawning pockets": "Consolidated into 'flats' - spawning context is seasonal",
    "shallow warm pockets": "Consolidated into 'flats' - warmth is seasonal context",
    "docks and man-made structure": "Duplicate of 'docks'",
    "first depth break": "Consolidated into 'depth breaks'",
    "breaks": "Consolidated into 'depth breaks'",
    "drop-offs": "Consolidated into 'depth breaks'",
    "ledges": "Consolidated into 'depth breaks' or 'deep offshore structure'",
    "steeper breaks": "Consolidated into 'depth breaks' - steepness is contextual",
    "inside turns": "Consolidated into 'channel swings'",
    "outside bends": "Consolidated into 'channel swings'",
    "current seams": "Consolidated into 'current breaks'",
    "current-influenced areas": "Consolidated into 'current breaks'",
    "eddies": "Consolidated into 'current breaks' - calm pocket context",
    "humps": "Consolidated into 'deep offshore structure'",
    "saddles": "Consolidated into 'deep offshore structure'",
    "roadbeds": "Consolidated into 'deep offshore structure' or 'creek channels'",
    "main lake structure": "Consolidated into 'deep offshore structure'",
    "mid-lake structure": "Consolidated into 'deep offshore structure'",
    "basin-adjacent structure": "Consolidated into 'deep offshore structure'",
    "shade lines and shadow edges": "Not a target - positioning detail",
    "bottom-oriented cover": "Redundant - covered by specific targets",
    "intersections": "Vague and offshore-biased - removed",
    "staging structure near spawning pockets": "Too specific - covered by other targets",
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