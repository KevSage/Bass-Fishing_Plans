# apps/api/app/services/weather.py
"""
Weather service using OpenWeather API.
Fetches current conditions + daily high/low temps + fishing-critical data.

ENHANCED FOR BASS FISHING:
- Barometric pressure + trend detection
- Precipitation tracking (rain affects clarity/feeding)
- Moon phase calculation (spawn/feeding patterns)
- UV index (light penetration)
- Humidity (insect activity → topwater)
"""
import os
import math
from datetime import datetime, timezone
from typing import Any, Dict, Tuple
import httpx


def _cloud_cover_from_pct(pct: float) -> str:
    """Convert cloud percentage to descriptive string"""
    if pct is None:
        return "partly cloudy"
    if pct < 20:
        return "clear"
    if pct < 60:
        return "partly cloudy"
    return "overcast"


def _calculate_moon_phase(date: datetime = None) -> Tuple[str, float]:
    """
    Calculate moon phase for given date (defaults to today).
    
    Returns:
        (phase_name, illumination_percent)
        
    Phase names:
        "new", "waxing crescent", "first quarter", "waxing gibbous",
        "full", "waning gibbous", "last quarter", "waning crescent"
    """
    if date is None:
        date = datetime.now(timezone.utc)
    
    # Known new moon: Jan 6, 2000 18:14 UTC
    known_new_moon = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
    
    # Lunar cycle is 29.53 days
    lunar_cycle = 29.53058867
    
    # Days since known new moon
    days_since = (date - known_new_moon).total_seconds() / 86400
    
    # Current position in cycle (0-29.53)
    phase_days = days_since % lunar_cycle
    
    # Illumination percentage (0-100)
    illumination = (1 - math.cos(2 * math.pi * phase_days / lunar_cycle)) / 2 * 100
    
    # Determine phase name
    if phase_days < 1.84566:
        phase_name = "new"
    elif phase_days < 7.38264:
        phase_name = "waxing crescent"
    elif phase_days < 9.22830:
        phase_name = "first quarter"
    elif phase_days < 14.76528:
        phase_name = "waxing gibbous"
    elif phase_days < 16.61094:
        phase_name = "full"
    elif phase_days < 22.14792:
        phase_name = "waning gibbous"
    elif phase_days < 23.99358:
        phase_name = "last quarter"
    else:
        phase_name = "waning crescent"
    
    return phase_name, round(illumination, 1)


def _detect_pressure_trend(current_pressure: float, lat: float, lon: float) -> str:
    """
    Detect barometric pressure trend.
    
    In production, you'd store historical pressure readings in DB.
    For now, we use a heuristic based on standard pressure.
    
    Standard pressure: 1013.25 mb
    Rising: > 1015 mb
    Falling: < 1010 mb
    Stable: 1010-1015 mb
    
    Returns: "rising", "falling", "stable"
    """
    # TODO: Store pressure history in DB for accurate 3-hour trend detection
    # For now, use simplified heuristic
    if current_pressure > 1015:
        return "rising"
    elif current_pressure < 1010:
        return "falling"
    else:
        return "stable"


def _is_major_solunar_period(date: datetime, lat: float, lon: float) -> bool:
    """
    Detect major solunar feeding periods (moon overhead or underfoot).
    
    Major periods: Moon is directly overhead or underfoot (±2 hours)
    Minor periods: Moon is rising or setting (±1 hour)
    
    For MVP, we use simplified moon phase correlation.
    Full implementation would calculate moon transit times.
    
    Returns: True if currently in major feeding period
    """
    # Simplified: Major periods correlate with full/new moon ±3 days
    phase_name, illumination = _calculate_moon_phase(date)
    
    if phase_name in ["full", "new"]:
        return True
    
    # Waxing/waning gibbous near full moon also have strong activity
    if phase_name in ["waxing gibbous", "waning gibbous"] and illumination > 80:
        return True
    
    return False


async def get_weather_snapshot(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get current weather conditions + daily high/low temps + fishing-critical data.
    
    Uses OpenWeather OneCall API 3.0 (or falls back to current + forecast).
    Requires env: OPENWEATHER_API_KEY
    
    Returns:
        {
            # Temperature
            "temp_f": float,           # Current temp
            "temp_high": float,        # Today's high
            "temp_low": float,         # Today's low
            
            # Wind & Sky
            "wind_mph": float,
            "cloud_cover": str,        # "clear", "partly cloudy", "overcast"
            
            # Barometric Pressure (CRITICAL for bass)
            "pressure_mb": float,      # Current pressure in millibars
            "pressure_trend": str,     # "rising", "falling", "stable"
            
            # Precipitation
            "precipitation_1h": float, # Rain in last hour (inches)
            "has_recent_rain": bool,   # Rain in last 24 hours
            
            # Light & Moon
            "uv_index": float,         # 0-11+ scale
            "moon_phase": str,         # "new", "waxing crescent", etc.
            "moon_illumination": float,# 0-100%
            "is_major_period": bool,   # Solunar major feeding period
            
            # Other
            "humidity": int,           # 0-100% (affects insect activity)
        }
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENWEATHER_API_KEY in environment")
    
    # Try OneCall API 3.0 first (includes current + daily forecast)
    # Falls back to current + forecast if OneCall not available
    try:
        return await _get_weather_onecall(lat, lon, api_key)
    except Exception as e:
        print(f"OneCall API failed ({e}), falling back to current + forecast")
        return await _get_weather_fallback(lat, lon, api_key)


async def _get_weather_onecall(lat: float, lon: float, api_key: str) -> Dict[str, Any]:
    """
    Use OneCall API 3.0 (requires subscription but more accurate).
    https://openweathermap.org/api/one-call-3
    """
    url = "https://api.openweathermap.org/data/3.0/onecall"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "imperial",
        "exclude": "minutely,alerts",  # Keep hourly for precipitation history
    }
    
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()
    
    # Current weather
    current = data.get("current", {})
    temp_f = current.get("temp")
    wind_mph = current.get("wind_speed")
    clouds_pct = current.get("clouds")
    pressure_mb = current.get("pressure")
    humidity = current.get("humidity")
    uv_index = current.get("uvi", 0)
    
    # Precipitation (convert mm to inches: 1mm = 0.0393701 inches)
    rain_1h = current.get("rain", {}).get("1h", 0) * 0.0393701
    
    # Check for rain in last 24h from hourly data
    has_recent_rain = rain_1h > 0
    hourly = data.get("hourly", [])
    if not has_recent_rain and hourly:
        # Check last 24 hours for any rain
        for hour in hourly[:24]:
            if hour.get("rain", {}).get("1h", 0) > 0:
                has_recent_rain = True
                break
    
    # Today's forecast (first item in daily array)
    daily = data.get("daily", [{}])[0]
    temp_high = daily.get("temp", {}).get("max")
    temp_low = daily.get("temp", {}).get("min")
    
    if temp_f is None or wind_mph is None:
        raise RuntimeError("OneCall response missing temp/wind")
    
    # Use forecast high/low if available, otherwise estimate from current
    if temp_high is None:
        temp_high = temp_f + 5  # Rough estimate
    if temp_low is None:
        temp_low = temp_f - 5  # Rough estimate
    
    cloud_cover = _cloud_cover_from_pct(clouds_pct)
    
    # Barometric pressure trend
    pressure_trend = _detect_pressure_trend(pressure_mb, lat, lon)
    
    # Moon phase
    moon_phase, moon_illumination = _calculate_moon_phase()
    is_major_period = _is_major_solunar_period(datetime.now(timezone.utc), lat, lon)
    
    return {
        # Temperature
        "temp_f": float(temp_f),
        "temp_high": float(temp_high),
        "temp_low": float(temp_low),
        
        # Wind & Sky
        "wind_mph": float(wind_mph),
        "cloud_cover": cloud_cover,
        
        # Barometric Pressure
        "pressure_mb": float(pressure_mb),
        "pressure_trend": pressure_trend,
        
        # Precipitation
        "precipitation_1h": round(rain_1h, 2),
        "has_recent_rain": has_recent_rain,
        
        # Light & Moon
        "uv_index": float(uv_index),
        "moon_phase": moon_phase,
        "moon_illumination": float(moon_illumination),
        "is_major_period": is_major_period,
        
        # Other
        "humidity": int(humidity),
    }


async def _get_weather_fallback(lat: float, lon: float, api_key: str) -> Dict[str, Any]:
    """
    Fallback: Use current weather + 5-day forecast (free tier).
    https://openweathermap.org/current
    https://openweathermap.org/forecast5
    """
    # Get current weather
    current_url = "https://api.openweathermap.org/data/2.5/weather"
    current_params = {"lat": lat, "lon": lon, "appid": api_key, "units": "imperial"}
    
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(current_url, params=current_params)
        r.raise_for_status()
        current_data = r.json()
    
    main = current_data.get("main", {})
    wind = current_data.get("wind", {})
    clouds = current_data.get("clouds", {})
    rain = current_data.get("rain", {})
    
    temp_f = main.get("temp")
    wind_mph = wind.get("speed")
    clouds_pct = clouds.get("all")
    pressure_mb = main.get("pressure")
    humidity = main.get("humidity", 50)  # Default to 50% if missing
    
    # UV index not available in free tier, estimate from cloud cover
    if clouds_pct < 20:
        uv_index = 7.0  # Clear day estimate
    elif clouds_pct < 60:
        uv_index = 4.0  # Partly cloudy
    else:
        uv_index = 2.0  # Overcast
    
    # Precipitation (convert mm to inches)
    rain_1h = rain.get("1h", 0) * 0.0393701
    
    # Try to get high/low from forecast
    forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
    forecast_params = {"lat": lat, "lon": lon, "appid": api_key, "units": "imperial", "cnt": 8}  # Next 24 hours
    
    has_recent_rain = rain_1h > 0
    
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(forecast_url, params=forecast_params)
            r.raise_for_status()
            forecast_data = r.json()
        
        # Extract high/low from next 24 hours
        temps = [item["main"]["temp"] for item in forecast_data.get("list", [])]
        if temps:
            temp_high = max(temps + [temp_f])
            temp_low = min(temps + [temp_f])
        else:
            # Fallback estimates
            temp_high = temp_f + 5
            temp_low = temp_f - 5
        
        # Check for rain in forecast
        if not has_recent_rain:
            for item in forecast_data.get("list", []):
                if item.get("rain", {}).get("3h", 0) > 0:
                    has_recent_rain = True
                    break
                    
    except Exception:
        # If forecast fails, use estimates
        temp_high = temp_f + 5
        temp_low = temp_f - 5
    
    if temp_f is None or wind_mph is None:
        raise RuntimeError("Weather provider response missing temp/wind")
    
    cloud_cover = _cloud_cover_from_pct(clouds_pct)
    
    # Barometric pressure trend
    pressure_trend = _detect_pressure_trend(pressure_mb, lat, lon)
    
    # Moon phase
    moon_phase, moon_illumination = _calculate_moon_phase()
    is_major_period = _is_major_solunar_period(datetime.now(timezone.utc), lat, lon)
    
    return {
        # Temperature
        "temp_f": float(temp_f),
        "temp_high": float(temp_high),
        "temp_low": float(temp_low),
        
        # Wind & Sky
        "wind_mph": float(wind_mph),
        "cloud_cover": cloud_cover,
        
        # Barometric Pressure
        "pressure_mb": float(pressure_mb),
        "pressure_trend": pressure_trend,
        
        # Precipitation
        "precipitation_1h": round(rain_1h, 2),
        "has_recent_rain": has_recent_rain,
        
        # Light & Moon
        "uv_index": float(uv_index),
        "moon_phase": moon_phase,
        "moon_illumination": float(moon_illumination),
        "is_major_period": is_major_period,
        
        # Other
        "humidity": int(humidity),
    }