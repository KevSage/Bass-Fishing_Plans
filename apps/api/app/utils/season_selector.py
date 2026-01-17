# /app/utils/season_selector.py
"""
Season selector for Bass Clarity.
Determines fishing season from date and lake coordinates.
"""

from datetime import date

# Region definitions based on latitude/longitude
# Florida is checked first as a special case (state boundary)
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

# Season date ranges by region (month-day format)
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


def get_region(lat: float, lng: float) -> str:
    """
    Determines region from lake coordinates.
    
    Args:
        lat: Latitude of lake
        lng: Longitude of lake
        
    Returns:
        Region string: 'florida', 'gulf_south', 'deep_south', 
                       'mid_south', 'north', 'west', 'pacific_nw'
    """
    # Florida special case (state boundary check)
    if lat <= 31.0 and -87.6 <= lng <= -80.0:
        return "florida"
    
    # Also catch south Florida
    if lat <= 28.0 and -83.0 <= lng <= -80.0:
        return "florida"
    
    # Pacific Northwest (OR, WA, ID, MT)
    if lat >= 42.0 and lng <= -104.0:
        return "pacific_nw"
    
    # West (CA, AZ, NM, NV, UT, CO, West TX)
    if lng <= -105.0 and lat < 42.0:
        return "west"
    
    # East of Rockies regions (by latitude bands)
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
    """
    Check if date falls within a season range.
    Handles year wraparound (e.g., winter: 12-01 to 02-15).
    """
    year = check_date.year
    start = _parse_month_day(start_md, year)
    end = _parse_month_day(end_md, year)
    
    # Handle year wraparound (winter spans Dec-Feb)
    if start > end:
        # Check if date is in Dec portion or Jan-Feb portion
        end_next_year = _parse_month_day(end_md, year + 1)
        start_prev_year = _parse_month_day(start_md, year - 1)
        
        return check_date >= start or check_date <= end
    else:
        return start <= check_date <= end


def get_season(plan_date: date, lat: float, lng: float) -> str:
    """
    Determines fishing season from date and lake coordinates.
    
    Args:
        plan_date: Date for the fishing plan
        lat: Latitude of lake
        lng: Longitude of lake
        
    Returns:
        Season string: 'winter', 'pre_spawn', 'spawn', 
                       'post_spawn', 'summer', 'fall'
    """
    region = get_region(lat, lng)
    season_ranges = SEASON_DATES[region]
    
    # Check each season (order matters for overlapping dates)
    # Priority: spawn > pre_spawn > post_spawn > summer > fall > winter
    season_priority = ["spawn", "pre_spawn", "post_spawn", "summer", "fall", "winter"]
    
    for season in season_priority:
        start_md, end_md = season_ranges[season]
        if _is_date_in_range(plan_date, start_md, end_md):
            return season
    
    # Fallback (should not reach here if ranges cover full year)
    return "winter"


def get_season_with_region(plan_date: date, lat: float, lng: float) -> tuple[str, str]:
    """
    Returns both season and region for logging/debugging.
    
    Args:
        plan_date: Date for the fishing plan
        lat: Latitude of lake
        lng: Longitude of lake
        
    Returns:
        Tuple of (season, region)
    """
    region = get_region(lat, lng)
    season_ranges = SEASON_DATES[region]
    
    season_priority = ["spawn", "pre_spawn", "post_spawn", "summer", "fall", "winter"]
    
    for season in season_priority:
        start_md, end_md = season_ranges[season]
        if _is_date_in_range(plan_date, start_md, end_md):
            return (season, region)
    
    return ("winter", region)