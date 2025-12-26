# apps/api/app/canon/target_definitions.py
"""
Canonical target definitions for bass fishing.
Maps each target from CANONICAL_TARGETS to a brief, actionable definition.
"""

TARGET_DEFINITIONS = {
    # Primary Structure
    "points": "Fingers of land extending into the water - key ambush and travel routes",
    "secondary points": "Smaller points off main points - staging areas near deeper water",
    "main-lake points": "Primary points on the main body of the lake - major feeding and transition zones",
    "channel swings": "Where the creek channel bends or curves - natural ambush zones",
    "humps": "Underwater mounds that rise from the bottom - isolated feeding stations",
    "ledges": "Underwater shelves or drop-offs - major depth transitions bass use",
    "inside turns": "Inside bend of creek channels or shorelines - shallower, calmer areas",
    "outside bends": "Outside bend of creek channels - deeper water with current deflection",
    
    # Depth Transitions
    "first depth break": "The first significant drop from shallow to deeper water",
    "steeper breaks": "Sharp, pronounced depth changes - holding areas for suspended bass",
    "drop-offs": "Sharp depth changes where shallow meets deep water",
    "breaks": "Any distinct change in bottom contour or depth",
    "flats adjacent to deep water": "Shallow areas next to channels or deep basins",
    "basin-adjacent structure": "Structure (points, humps, ledges) positioned near the deepest parts of the lake",
    
    # Cover Types
    "laydowns": "Fallen trees lying in the water - prime ambush cover",
    "standing timber": "Upright dead trees in the water - vertical structure bass relate to",
    "brush piles": "Submerged brush or trees placed as fish habitat",
    "docks": "Boat docks and piers - provide shade and vertical structure",
    "docks and man-made structure": "Boat docks, piers, and other artificial cover - shade and vertical structure",
    "riprap": "Large rocks along shorelines - hard cover and shade",
    "grass lines": "Edge where vegetation meets open water",
    "grass edges": "Transition zone between grass and open water",
    "edges of vegetation": "Transition zone where grass or weeds meet open water",
    "isolated cover": "Single pieces of cover away from other structure",
    "bottom-oriented cover: wood/rock/grasslines": "Any cover on or near the bottom - wood, rock, or grass transitions",
    
    # Spawning Areas
    "pockets": "Small coves or indentations in the shoreline",
    "spawning pockets": "Protected shallow areas where bass build nests",
    "staging structure near spawning pockets": "Deep water adjacent to spawning areas where bass hold before moving shallow",
    "flats": "Large shallow areas with relatively even depth",
    "shallow flats": "Expansive shallow areas - feeding and spawning zones",
    "shallow warm pockets": "Protected shallow areas that warm faster - early season magnets",
    
    # Transition Zones
    "transitions": "Where one type of bottom or cover changes to another",
    "hard-bottom transitions": "Where soft mud or sand meets hard rock or clay - feeding zones",
    "creek channels": "Submerged creek beds - deep water highways",
    "main lake structure": "Points, humps, and ledges on the main body of the lake",
    "mid-lake structure": "Isolated structure in the middle sections of the lake",
    
    # Bank Features
    "banks": "The shoreline edge - can hold shallow or deep water",
    "wind-blown banks": "Shorelines getting hit by wind - concentrates bait and oxygen",
    "wind-blown points": "Points exposed to wind - increased oxygen and baitfish activity",
    "shaded banks": "Shorelines with overhead cover from trees or bluffs",
    "shade lines and shadow edges": "Where sunlight meets shade - ambush zones and comfort areas",
    "chunk rock banks": "Shorelines with large scattered rocks",
    
    # Current & Flow
    "current seams": "Where moving water meets still water - feeding lanes",
    "current-influenced areas": "Zones with water movement from wind, inflow, or dam discharge",
    "eddies": "Calm pockets behind structure in current",
    
    # Misc
    "roadbeds": "Old submerged roads - deep structure highways",
    "saddles": "Low spots between two high points underwater",
    "intersections": "Where multiple types of structure meet",
}


def get_target_definition(target: str) -> str:
    """
    Get the definition for a target.
    
    Args:
        target: Target name (case-insensitive)
        
    Returns:
        Definition string, or empty string if not found
    """
    target_lower = target.lower().strip()
    return TARGET_DEFINITIONS.get(target_lower, "")


def get_all_definitions() -> dict:
    """Get all target definitions."""
    return TARGET_DEFINITIONS.copy()