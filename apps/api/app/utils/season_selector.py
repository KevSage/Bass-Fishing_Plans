# /app/utils/season_selector.py
"""
Season selector for Bass Clarity.
Determines fishing season from date, lake coordinates, AND biological conditions.

Logic Flow:
1. Determine Region (e.g., 'florida', 'north')
2. Determine 'Calendar Season' based on strict date ranges
3. Apply 'Biological Overrides' based on current weather (Temp/Moon)
   - Warm Winter -> Pre-Spawn
   - Cold Summer -> Fall
   - Warm Pre-Spawn + Moon -> Spawn
"""

from datetime import date
from typing import Optional, Dict, Any

# ==========================================================
# 1. REGION DEFINITIONS
# ==========================================================
REGIONS = {
    "florida": {
        "description": "FL state",
        "lat_max": 31.0,
        "lng_min": -87.6,
        "lng_max": -80.0,
    },
    "gulf_south": {
        "description": "Gulf coast, lat < 32°N",
        "lat_max": 32.0,
    },
    "deep_south": {
        "description": "lat 31°N - 34°N, east of Rockies",
        "lat_min": 31.0,
        "lat_max": 34.0,
        "lng_min": -105.0,
    },
    "mid_south": {
        "description": "lat 34°N - 38°N, east of Rockies",
        "lat_min": 34.0,
        "lat_max": 38.0,
        "lng_min": -105.0,
    },
    "north": {
        "description": "lat > 38°N, east of Rockies",
        "lat_min": 38.0,
        "lng_min": -105.0,
    },
    "west": {
        "description": "West of Rockies, south of OR/WA",
        "lat_max": 42.0,
        "lng_max": -105.0,
    },
    "pacific_nw": {
        "description": "OR, WA, ID, MT",
        "lat_min": 42.0,
        "lng_max": -104.0,
    },
}

# ==========================================================
# 2. CALENDAR DATE RANGES (Baseline)
# ==========================================================
SEASON_DATES = {
    "florida": {
        "winter": ("12-01", "02-15"),
        "pre_spawn": ("02-15", "03-31"),
        "spawn": ("03-15", "04-30"),
        "post_spawn": ("04-15", "05-31"),
        "summer": ("05-01", "10-01"),
        "fall": ("10-01", "12-01"),
    },
    "gulf_south": {
        "winter": ("12-01", "02-15"),
        "pre_spawn": ("02-15", "03-31"),
        "spawn": ("03-15", "04-30"),
        "post_spawn": ("04-15", "05-31"),
        "summer": ("05-15", "09-15"),
        "fall": ("09-15", "12-01"),
    },
    "deep_south": {
        "winter": ("12-01", "02-28"),
        "pre_spawn": ("03-01", "04-15"),
        "spawn": ("04-01", "05-15"),
        "post_spawn": ("05-01", "06-15"),
        "summer": ("06-01", "09-15"),
        "fall": ("09-15", "12-01"),
    },
    "mid_south": {
        "winter": ("11-15", "03-15"),
        "pre_spawn": ("03-15", "04-30"),
        "spawn": ("04-15", "05-31"),
        "post_spawn": ("05-15", "06-30"),
        "summer": ("06-15", "09-30"),
        "fall": ("09-30", "11-15"),
    },
    "north": {
        "winter": ("11-01", "03-31"),
        "pre_spawn": ("04-01", "05-15"),
        "spawn": ("05-01", "06-15"),
        "post_spawn": ("06-01", "07-15"),
        "summer": ("07-01", "09-15"),
        "fall": ("09-15", "11-15"),
    },
    "west": {
        "winter": ("12-01", "03-01"),
        "pre_spawn": ("03-01", "04-30"),
        "spawn": ("04-15", "06-01"),
        "post_spawn": ("05-15", "06-30"),
        "summer": ("06-15", "10-01"),
        "fall": ("10-01", "12-01"),
    },
    "pacific_nw": {
        "winter": ("11-01", "03-31"),
        "pre_spawn": ("04-01", "05-31"),
        "spawn": ("05-15", "06-30"),
        "post_spawn": ("06-15", "07-31"),
        "summer": ("07-01", "09-30"),
        "fall": ("09-30", "11-01"),
    },
}

# ==========================================================
# 3. HELPER FUNCTIONS
# ==========================================================

def get_region(lat: float, lng: float) -> str:
    """Determines region from lake coordinates."""
    # Florida special case
    if lat <= 31.0 and -87.6 <= lng <= -80.0:
        return "florida"
    if lat <= 28.0 and -83.0 <= lng <= -80.0:
        return "florida"
    
    # Pacific Northwest
    if lat >= 42.0 and lng <= -104.0:
        return "pacific_nw"
    
    # West
    if lng <= -105.0 and lat < 42.0:
        return "west"
    
    # East of Rockies
    if lat < 32.0:
        return "gulf_south"
    elif lat < 34.0:
        return "deep_south"
    elif lat < 38.0:
        return "mid_south"
    else:
        return "north"


def _parse_month_day(month_day: str, year: int) -> date:
    """Parse MM-DD string into date object for given year."""
    month, day = map(int, month_day.split("-"))
    return date(year, month, day)


def _is_date_in_range(check_date: date, start_md: str, end_md: str) -> bool:
    """Check if date falls within a season range (handles year wrap for Winter)."""
    year = check_date.year
    start = _parse_month_day(start_md, year)
    end = _parse_month_day(end_md, year)
    
    if start > end:
        # Wrap-around (e.g. Dec to Feb)
        # Check if date is after start OR before end
        return check_date >= start or check_date <= end
    else:
        return start <= check_date <= end


# ==========================================================
# 4. MAIN LOGIC (With Biological Overrides)
# ==========================================================

def get_season(plan_date: date, lat: float, lng: float, weather: Optional[Dict[str, Any]] = None) -> str:
    """
    Determines season based on Calendar + Biological Overrides.
    """
    
    # --- STEP 1: CALENDAR BASELINE ---
    region = get_region(lat, lng)
    season_ranges = SEASON_DATES[region]
    
    calendar_season = "winter" # Default fallback
    
    # Priority: spawn > pre > post > summer > fall > winter
    season_priority = ["spawn", "pre_spawn", "post_spawn", "summer", "fall", "winter"]
    
    for season in season_priority:
        start_md, end_md = season_ranges[season]
        if _is_date_in_range(plan_date, start_md, end_md):
            calendar_season = season
            break
            
    # If no weather data provided, return the calendar baseline
    if not weather:
        return calendar_season

    # --- STEP 2: BIOLOGICAL OVERRIDES ---
    # Bass are cold-blooded; temperature dictates behavior more than the calendar.
    
    temp_f = weather.get("temp_f", 0)
    temp_high = weather.get("temp_high", temp_f)
    moon_phase = str(weather.get("moon_phase", "")).lower()
    
    # ----------------------------------------------------
    # OVERRIDE A: WARM WINTER -> PRE-SPAWN
    # ----------------------------------------------------
    # Fixes Florida/South "Winter" issue.
    # If it's technically Winter, but the water is warm enough (approx > 58-60F),
    # bass will move shallow and chase (Pre-Spawn behavior).
    if calendar_season == "winter":
        if temp_f > 60.0:
            return "pre_spawn"

    # ----------------------------------------------------
    # OVERRIDE B: COLD SUMMER -> FALL
    # ----------------------------------------------------
    # "False Fall" / Early Cold Snap.
    # If it's technically Summer, but we get a cold snap (Highs < 70F),
    # bass will start feeding up for winter (Fall behavior).
    if calendar_season == "summer":
        if temp_high < 70.0:
            return "fall"

    # ----------------------------------------------------
    # OVERRIDE C: WARM PRE-SPAWN + MOON -> SPAWN
    # ----------------------------------------------------
    # The "Wave" Trigger.
    # If it's Pre-Spawn, temps are ideal (65+), and we have a Full/New moon,
    # a wave of fish is likely locking onto beds (Spawn behavior).
    if calendar_season == "pre_spawn":
        is_major_moon = "full" in moon_phase or "new" in moon_phase
        if temp_f > 65.0 and is_major_moon:
            return "spawn"

    # ----------------------------------------------------
    # OVERRIDE D: INDIAN SUMMER (FALL -> SUMMER)
    # ----------------------------------------------------
    # If it's technically Fall (Oct/Nov) but we get a heat wave (80F+),
    # fish may suspend or retreat to summer haunts.
    if calendar_season == "fall":
        if temp_high > 80.0:
            return "summer"

    return calendar_season


def get_season_with_region(plan_date: date, lat: float, lng: float, weather: Optional[Dict[str, Any]] = None) -> tuple[str, str]:
    """Helper for logging: returns (season, region) tuple."""
    region = get_region(lat, lng)
    season = get_season(plan_date, lat, lng, weather)
    return (season, region)