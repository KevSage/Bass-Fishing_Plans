# apps/api/app/services/weather.py
"""
Weather service using OpenWeather API.
Fetches current conditions + daily high/low temps.
"""
import os
from typing import Any, Dict
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


async def get_weather_snapshot(lat: float, lon: float) -> Dict[str, Any]:
    """
    Get current weather conditions + daily high/low temps.
    
    Uses OpenWeather OneCall API 3.0 (or falls back to current + forecast).
    Requires env: OPENWEATHER_API_KEY
    
    Returns:
        {
            "temp_f": float,           # Current temp
            "temp_high": float,        # Today's high
            "temp_low": float,         # Today's low
            "wind_mph": float,
            "cloud_cover": str,        # "clear", "partly cloudy", "overcast"
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
        "exclude": "minutely,hourly,alerts",  # Only need current + daily
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
    
    return {
        "temp_f": float(temp_f),
        "temp_high": float(temp_high),
        "temp_low": float(temp_low),
        "wind_mph": float(wind_mph),
        "cloud_cover": cloud_cover,
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
    
    temp_f = main.get("temp")
    wind_mph = wind.get("speed")
    clouds_pct = clouds.get("all")
    
    # Try to get high/low from forecast
    forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
    forecast_params = {"lat": lat, "lon": lon, "appid": api_key, "units": "imperial", "cnt": 8}  # Next 24 hours
    
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
    except Exception:
        # If forecast fails, use estimates
        temp_high = temp_f + 5
        temp_low = temp_f - 5
    
    if temp_f is None or wind_mph is None:
        raise RuntimeError("Weather provider response missing temp/wind")
    
    cloud_cover = _cloud_cover_from_pct(clouds_pct)
    
    return {
        "temp_f": float(temp_f),
        "temp_high": float(temp_high),
        "temp_low": float(temp_low),
        "wind_mph": float(wind_mph),
        "cloud_cover": cloud_cover,
    }
