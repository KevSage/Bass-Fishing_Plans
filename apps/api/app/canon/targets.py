"""
Canonical Target Pool — V1

Rules:
- LLM may ONLY select targets from this list.
- Target strings must match exactly.
- No renaming, splitting, or inventing.
- 3-5 targets per plan.
"""

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