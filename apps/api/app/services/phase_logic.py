# apps/api/app/services/phase_logic.py
"""
Regional bass phase determination.
Bass biology varies by latitude - FL bass spawn in winter while MI bass are dormant.
"""


def determine_phase(temp_f: float, month: int, latitude: float) -> str:
    """
    Determine bass phase based on temperature, month, AND latitude.
    
    Regional differences matter:
    - Deep South (< 30°): FL, South TX, South LA - Bass spawn in winter!
    - Southeast (30-36°): GA, AL, SC, NC - Slightly earlier than traditional
    - Mid-Atlantic/Midwest (36-40°): VA, TN, KY, MO - Traditional calendar
    - North (> 40°): MI, WI, NY, PA - Late spawn, long winter
    
    Args:
        temp_f: Water temperature in Fahrenheit
        month: Month number (1-12)
        latitude: Latitude in degrees (positive for Northern hemisphere)
    
    Returns:
        Phase string: "winter", "pre-spawn", "spawn", "post-spawn", 
                     "summer", "late-summer", "fall", or "late-fall"
    """
    
    # ========================================
    # DEEP SOUTH (Florida, South Texas, South Louisiana)
    # Latitude < 30° - Bass spawn in winter!
    # ========================================
    if latitude < 30:
        if month in (12, 1, 2):  # Winter months
            if 58 <= temp_f <= 68:
                return "spawn"  # FL bass spawn when it's cold elsewhere
            elif temp_f > 68:
                # Warm December = late-fall transitioning, not post-spawn
                return "late-fall" if month == 12 else "pre-spawn"
            else:  # < 58
                return "pre-spawn"
        
        elif month in (3, 4):  # Spring
            return "post-spawn"  # Recovery period
        
        elif month in (5, 6, 7, 8, 9):  # Summer
            if temp_f >= 85:
                return "late-summer"
            return "summer"
        
        else:  # Oct, Nov - Fall
            return "fall"
    
    # ========================================
    # SOUTHEAST (Georgia, Alabama, Carolinas)
    # Latitude 30-36° - Slightly earlier spawn than north
    # ========================================
    elif latitude < 36:
        if month in (12, 1):  # Deep winter
            return "winter"
        
        elif month == 2:  # Late winter
            if temp_f >= 55:
                return "pre-spawn"  # Early staging
            return "winter"
        
        elif month in (3, 4):  # Spring - spawn season
            if temp_f < 55:
                return "pre-spawn"
            elif 55 <= temp_f <= 70:
                return "spawn"
            else:
                return "post-spawn"
        
        elif month == 5:  # Late spring
            if temp_f < 68:
                return "post-spawn"
            return "summer"
        
        elif month in (6, 7, 8):  # Summer
            if temp_f >= 82:
                return "late-summer"
            return "summer"
        
        elif month == 9:  # Early fall
            return "late-summer" if temp_f >= 75 else "fall"
        
        elif month in (10, 11):  # Fall
            if temp_f >= 65:
                return "fall"
            return "late-fall"
    
    # ========================================
    # MID-ATLANTIC / MIDWEST (Virginia to Missouri)
    # Latitude 36-40° - Traditional calendar
    # ========================================
    elif latitude < 40:
        if month in (12, 1, 2):  # Winter
            if temp_f >= 52:
                return "pre-spawn"  # Warm winter
            return "winter"
        
        elif month in (3, 4, 5):  # Spring
            if temp_f < 52:
                return "pre-spawn"
            elif 52 <= temp_f <= 72:
                return "spawn"
            else:
                return "post-spawn"
        
        elif month in (6, 7, 8):  # Summer
            if temp_f >= 82:
                return "late-summer"
            return "summer"
        
        elif month in (9, 10):  # Fall
            if temp_f >= 60:
                return "late-summer" if month == 9 else "fall"
            return "fall" if temp_f >= 50 else "late-fall"
        
        else:  # November
            return "late-fall" if temp_f < 50 else "fall"
    
    # ========================================
    # NORTH (Michigan, Wisconsin, New York, Pennsylvania)
    # Latitude > 40° - Late spawn, long winter
    # ========================================
    else:
        if month in (11, 12, 1, 2, 3):  # Long winter
            if temp_f >= 48:
                return "pre-spawn"
            return "winter"
        
        elif month in (4, 5, 6):  # Late spring spawn
            if temp_f < 50:
                return "pre-spawn"
            elif 50 <= temp_f <= 70:
                return "spawn"
            else:
                return "post-spawn"
        
        elif month in (7, 8):  # Short summer
            if temp_f >= 80:
                return "late-summer"
            return "summer"
        
        elif month == 9:  # Early fall
            return "late-summer" if temp_f >= 70 else "fall"
        
        else:  # October
            return "fall" if temp_f >= 50 else "late-fall"