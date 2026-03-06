# apps/api/app/services/weather.py
"""
Weather service using OpenWeather API.
Fetches current conditions + daily high/low temps + fishing-critical data.

ENHANCED FOR BASS FISHING:
- Representative Wind Calculation (Smoothes out sensor lag/lulls)
- 3-Point Trend Analysis (Past T-4h / Current / Future T+4h)
- "Forecast Narrative" generation for LLM context
- Barometric pressure + dynamic trend detection
- Precipitation tracking (rain affects clarity/feeding)
- Moon phase calculation (spawn/feeding patterns)
- Solunar period detection
- UV index (light penetration)
- Humidity (insect activity → topwater)
"""
import os
import math
import time
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Tuple, Optional
import httpx


# --- HELPER FUNCTIONS ---

def degrees_to_cardinal(d):
    if d is None:
        return "VAR"
    dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    ix = round(d / (360. / 16))
    return dirs[ix % 16]


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
    Returns: (phase_name, illumination_percent)
    """
    if date is None:
        date = datetime.now(timezone.utc)
    
    # Known new moon: Jan 6, 2000 18:14 UTC
    known_new_moon = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
    lunar_cycle = 29.53058867
    
    days_since = (date - known_new_moon).total_seconds() / 86400
    phase_days = days_since % lunar_cycle
    illumination = (1 - math.cos(2 * math.pi * phase_days / lunar_cycle)) / 2 * 100
    
    if phase_days < 1.84566: phase_name = "new"
    elif phase_days < 7.38264: phase_name = "waxing crescent"
    elif phase_days < 9.22830: phase_name = "first quarter"
    elif phase_days < 14.76528: phase_name = "waxing gibbous"
    elif phase_days < 16.61094: phase_name = "full"
    elif phase_days < 22.14792: phase_name = "waning gibbous"
    elif phase_days < 23.99358: phase_name = "last quarter"
    else: phase_name = "waning crescent"
    
    return phase_name, round(illumination, 1)


def _is_major_solunar_period(date: datetime, lat: float, lon: float) -> bool:
    """
    Detect major solunar feeding periods.
    Simplified: Major periods correlate with full/new moon ±3 days
    OR strong gibbous phases with high illumination.
    """
    phase_name, illumination = _calculate_moon_phase(date)

    if phase_name in ["full", "new"]:
        return True

    # Waxing/waning gibbous near full moon also have strong activity
    if phase_name in ["waxing gibbous", "waning gibbous"] and illumination > 80:
        return True

    return False


def estimate_water_temp(daily_highs: list, current_temp: float) -> float:
    """
    Estimate water temperature based on recent air temperature history.

    Water temperature lags air temperature by 1-3 days and changes slowly.
    Uses a weighted average of recent daily highs with seasonal offset.

    Args:
        daily_highs: List of daily high temps for past 5 days [oldest...newest]
        current_temp: Current air temperature

    Returns:
        Estimated water temperature in °F
    """
    if not daily_highs:
        # Fallback: water temp is roughly current air temp - 5°F
        return round(max(32, current_temp - 5), 1)

    # Weights: more recent days have higher weight
    # Day -1 (yesterday): 35%, Day -2: 25%, Day -3: 20%, Day -4: 12%, Day -5: 8%
    weights = [0.08, 0.12, 0.20, 0.25, 0.35]

    # Pad or trim daily_highs to match weights
    temps = list(daily_highs[-5:])  # Take last 5 days
    while len(temps) < 5:
        temps.insert(0, temps[0])  # Pad with oldest value

    weighted_avg = sum(t * w for t, w in zip(temps, weights))

    # Water temp offset varies by season:
    # - Cold water (< 50°F air avg): water may actually be warmer (thermal mass)
    # - Moderate (50-70°F): water lags by ~3-5°F
    # - Hot (> 70°F): water lags by ~5-8°F (surface vs thermocline)
    if weighted_avg < 50:
        offset = 2  # Water holds heat in cold weather
    elif weighted_avg < 70:
        offset = 4
    else:
        offset = 6

    estimated = weighted_avg - offset

    # Clamp to reasonable bass fishing range (32°F - 90°F)
    return round(max(32, min(90, estimated)), 1)


def format_local_time(unix_ts: int, offset_seconds: int) -> str:
    """Formats unix timestamp to '6:42 AM' using local timezone offset."""
    if not unix_ts:
        return "--:--"
    tz = timezone(timedelta(seconds=offset_seconds))
    local_dt = datetime.fromtimestamp(unix_ts, tz=tz)
    return local_dt.strftime("%-I:%M %p")


# --- MAIN SERVICE LOGIC ---

async def get_weather_snapshot(lat: float, lon: float) -> Dict[str, Any]:
    """
    Primary entry point. Fetches weather data using Multi-Call Strategy:
    1. Standard Call: Current + Hourly Forecast + Daily Forecast (Future)
    2. History Call: T-4 Hours (Past) for trend analysis
    3. Historical Daily Calls: Past 5 days for water temperature estimation
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENWEATHER_API_KEY")

    client = httpx.AsyncClient()

    # 1. Prepare Standard Call (Current + Future)
    url_std = "https://api.openweathermap.org/data/3.0/onecall"
    params_std = {
        "lat": lat, "lon": lon, "appid": api_key,
        "units": "imperial", "exclude": "minutely"
    }

    # 2. Prepare History Call (Past T-4 Hours) for trend analysis
    dt_past = int(time.time()) - (4 * 3600)
    url_hist = "https://api.openweathermap.org/data/3.0/onecall/timemachine"
    params_hist = {
        "lat": lat, "lon": lon, "dt": dt_past,
        "appid": api_key, "units": "imperial"
    }

    # 3. Prepare Historical Daily Calls (Past 5 days) for water temp estimation
    # Timemachine returns hourly data for a specific day, we'll extract daily highs
    now_ts = int(time.time())
    historical_requests = []
    for days_ago in range(1, 6):  # 1 to 5 days ago
        dt_historical = now_ts - (days_ago * 86400)  # 86400 seconds = 1 day
        historical_requests.append({
            "lat": lat, "lon": lon, "dt": dt_historical,
            "appid": api_key, "units": "imperial"
        })

    try:
        # Execute standard + recent history in parallel
        resp_std, resp_hist = await asyncio.gather(
            client.get(url_std, params=params_std),
            client.get(url_hist, params=params_hist)
        )

        # Check standard response (History might fail on free tier, handle gracefully)
        if resp_std.status_code != 200:
            await client.aclose()
            return await _get_weather_fallback(lat, lon, api_key)

        data_std = resp_std.json()
        data_hist = resp_hist.json() if resp_hist.status_code == 200 else {}

        # Fetch historical daily data for water temp (in parallel)
        historical_responses = await asyncio.gather(
            *[client.get(url_hist, params=req) for req in historical_requests],
            return_exceptions=True
        )

        # Extract daily highs from historical data (reverse to get oldest first)
        daily_highs = []
        for resp in reversed(historical_responses):
            if isinstance(resp, Exception) or resp.status_code != 200:
                continue
            hist_data = resp.json()
            hourly_temps = [h.get("temp", 0) for h in hist_data.get("data", [])]
            if hourly_temps:
                daily_highs.append(max(hourly_temps))

    except Exception as e:
        print(f"Weather API Error: {e}")
        return await _get_weather_fallback(lat, lon, api_key)
    finally:
        await client.aclose()

    # --- DATA EXTRACTION ---
    current = data_std.get("current", {})
    daily_today = data_std.get("daily", [{}])[0]
    hourly = data_std.get("hourly", [])
    tz_offset = data_std.get("timezone_offset", 0)

    # Extract Past Data (T-4h)
    past_data = data_hist.get("data", [{}])[0] if data_hist.get("data") else {}
    
    # Extract Future Data (T+4h)
    future_idx = 4 if len(hourly) > 4 else len(hourly) - 1
    future_data = hourly[future_idx] if hourly else {}

    # --- REPRESENTATIVE WIND CALCULATION (The "Smart Wind" Logic) ---
    # Problem: Current snapshot often lags or hits a lull (e.g. 1mph) while a storm (30mph) is active.
    # Solution: Look at the immediate window (Current + Next 2 Hours) and take the MAX.
    # This ensures the Plan Generator sees the "Active State" of the wind, not a momentary lull.
    
    raw_curr_wind = current.get("wind_speed", 0)
    raw_curr_gust = current.get("wind_gust", 0)
    
    # Grab next 2 hours of forecast
    near_term_winds = [h.get("wind_speed", 0) for h in hourly[:2]]
    near_term_gusts = [h.get("wind_gust", 0) for h in hourly[:2]]
    
    # Calculate Representative Wind (The number that matters for fishing)
    representative_wind = max([raw_curr_wind] + near_term_winds)
    representative_gust = max([raw_curr_gust] + near_term_gusts)
    
    # Use these representative values as the "Current" wind for the rest of the logic
    curr_wind = representative_wind
    curr_gust = representative_gust

    # --- INTELLIGENCE: 3-POINT TREND ANALYSIS ---

    # 0. Temperature Trend Analysis (NEW - for premium insights)
    curr_temp = current.get("temp", 0)
    past_temp = past_data.get("temp", curr_temp)
    temp_diff = curr_temp - past_temp

    # Determine temperature trend narrative
    temp_trend_desc = "Stable"
    if temp_diff >= 8:
        temp_trend_desc = "Warming Rapidly"
    elif temp_diff >= 4:
        temp_trend_desc = "Warming"
    elif temp_diff <= -8:
        temp_trend_desc = "Cooling Rapidly"
    elif temp_diff <= -4:
        temp_trend_desc = "Cooling"

    # Seasonal context based on temperature ranges
    temp_season_context = "transitional"
    if curr_temp >= 75:
        temp_season_context = "summer pattern"
    elif curr_temp >= 65:
        temp_season_context = "post-spawn / early summer"
    elif curr_temp >= 55:
        temp_season_context = "spawn window"
    elif curr_temp >= 45:
        temp_season_context = "pre-spawn"
    else:
        temp_season_context = "cold water / winter"

    # 1. Wind Trend Analysis (Using our robust curr_wind)
    past_wind = past_data.get("wind_speed", raw_curr_wind) # Use raw for past comparison if needed, or consistent metric
    fut_wind = future_data.get("wind_speed", curr_wind)
    
    wind_narrative = "Stable"
    # Adjusted thresholds to match the more robust 'curr_wind'
    if past_wind > 15 and curr_wind < 8:
        wind_narrative = "Dying Down (Chop still present)"
    elif curr_wind > 10 and fut_wind > (curr_wind + 5):
        wind_narrative = "Building Fast"
    elif curr_wind > 10 and fut_wind < (curr_wind - 5):
        wind_narrative = "Dying Down"
    elif curr_wind > 15:
        wind_narrative = "Sustained High Winds"

    # 2. Pressure Analysis
    past_pressure = past_data.get("pressure", 1013)
    curr_pressure = current.get("pressure", 1013)
    pressure_diff = curr_pressure - past_pressure
    
    pressure_trend_desc = "Stable"
    if pressure_diff < -1.5:
        pressure_trend_desc = "Falling Fast (Front Approaching)"
    elif pressure_diff < -0.5:
        pressure_trend_desc = "Falling"
    elif pressure_diff > 1.5:
        pressure_trend_desc = "Rising Fast (Post-Frontal)"
    elif pressure_diff > 0.5:
        pressure_trend_desc = "Rising"

    # 3. Solunar
    is_major_period = _is_major_solunar_period(datetime.now(timezone.utc), lat, lon)

    # 4. Water Temperature Estimation (based on past 5 days of air temps)
    # Add today's high to daily_highs for most accurate estimate
    todays_high = daily_today.get("temp", {}).get("max", curr_temp)
    daily_highs_with_today = daily_highs + [todays_high]
    estimated_water_temp = estimate_water_temp(daily_highs_with_today, curr_temp)

    # 5. Construct Narrative for LLM (now includes water temp)
    forecast_narrative = (
        f"TEMP CONTEXT: {temp_trend_desc} ({int(past_temp)}°F -> {int(curr_temp)}°F over 4hrs). Season: {temp_season_context}. "
        f"ESTIMATED WATER TEMP: {estimated_water_temp}°F (based on 5-day air temp trend). "
        f"WIND CONTEXT: {wind_narrative}. Representative wind is {int(curr_wind)}mph (Gusts {int(curr_gust)}mph). "
        f"Was {int(past_wind)}mph 4hrs ago. "
        f"PRESSURE TREND: {pressure_trend_desc} ({past_pressure}mb -> {curr_pressure}mb). "
        f"SKY: {current.get('weather', [{}])[0].get('description')}."
    )

    # --- STANDARD FORMATTING ---
    sunrise_unix = daily_today.get("sunrise")
    sunset_unix = daily_today.get("sunset")
    solar_noon_unix = (sunrise_unix + sunset_unix) // 2 if (sunrise_unix and sunset_unix) else None
    
    wind_deg = current.get("wind_deg")
    vis_meters = current.get("visibility")
    vis_miles = round(vis_meters / 1609.34, 1) if vis_meters is not None else 10.0

    return {
        # Core Data
        "temp_f": current.get("temp"),
        "temp_high": daily_today.get("temp", {}).get("max"),
        "temp_low": daily_today.get("temp", {}).get("min"),
        "feels_like_f": current.get("feels_like"),
        
        # Wind (Now using Representative Values)
        "wind_mph": curr_wind,
        "wind_gust_mph": curr_gust,
        "wind_direction": degrees_to_cardinal(wind_deg),
        "wind_degrees": wind_deg,
        
        # Pressure
        "pressure_mb": curr_pressure,
        "pressure_trend": pressure_trend_desc,
        
        # Sky & Light
        "cloud_cover": current.get("weather", [{}])[0].get("description", "clear"),
        "sky_condition": current.get("weather", [{}])[0].get("main", "Clear"),
        "cloud_pct": current.get("clouds", 0),  # Cloud coverage percentage 0-100 (OneCall 3.0 returns direct int)
        "uv_index": current.get("uvi"),
        "visibility_miles": vis_miles,
        "humidity": current.get("humidity"),
        "dew_point": current.get("dew_point"),
        
        # Water/Rain
        "precipitation_1h": current.get("rain", {}).get("1h", 0),
        "has_recent_rain": daily_today.get("rain", 0) > 0,
        
        # Celestial
        "moon_phase": str(daily_today.get("moon_phase")),
        "moon_illumination": daily_today.get("moon_illumination"),
        "is_major_period": is_major_period,
        "sunriseTime": format_local_time(sunrise_unix, tz_offset),
        "solarNoonTime": format_local_time(solar_noon_unix, tz_offset),
        "sunsetTime": format_local_time(sunset_unix, tz_offset),
        
        # --- INTELLIGENCE KEYS ---
        "forecast_narrative": forecast_narrative,
        "past_wind_mph": past_wind,
        "future_wind_mph": fut_wind,
        "past_pressure_mb": past_pressure,
        "timezone_offset": tz_offset,
        # Max wind is now redundant as it's baked into wind_mph, but kept for compatibility
        "forecast_wind_max": max([h.get("wind_speed", 0) for h in hourly[:8]]) if hourly else curr_wind,

        # Temperature Trend (NEW - for premium card insights)
        "past_temp_f": past_temp,
        "temp_trend": temp_trend_desc,
        "temp_season_context": temp_season_context,

        # Water Temperature Estimation (NEW - for lure selection)
        "estimated_water_temp_f": estimated_water_temp,
        "daily_highs_history": daily_highs_with_today,  # For debugging/display

        # Hourly Forecast (next 12 hours for Apple-style display)
        "hourly_forecast": [
            {
                "time": format_local_time(h.get("dt"), tz_offset),
                "temp": round(h.get("temp", 0)),
                "icon": h.get("weather", [{}])[0].get("icon", "01d"),
                "description": h.get("weather", [{}])[0].get("main", "Clear"),
                "wind": round(h.get("wind_speed", 0)),
                "pop": round(h.get("pop", 0) * 100),  # Probability of precipitation %
            }
            for h in hourly[:12]
        ] if hourly else [],
    }


async def _get_weather_fallback(lat: float, lon: float, api_key: str) -> Dict[str, Any]:
    """
    Fallback: Use current weather + 5-day forecast (standard tier)
    """
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
    humidity = main.get("humidity", 50)
    
    # UV Estimate
    if clouds_pct < 20: uv_index = 7.0
    elif clouds_pct < 60: uv_index = 4.0
    else: uv_index = 2.0
    
    rain_1h = rain.get("1h", 0) * 0.0393701
    
    # Get High/Low from Forecast
    forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
    forecast_params = {"lat": lat, "lon": lon, "appid": api_key, "units": "imperial", "cnt": 8}
    
    temp_high = temp_f + 5
    temp_low = temp_f - 5
    has_recent_rain = rain_1h > 0
    
    # Get timezone offset from current weather data
    tz_offset = current_data.get("timezone", 0)
    hourly_forecast = []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(forecast_url, params=forecast_params)
            r.raise_for_status()
            forecast_data = r.json()

        temps = [item["main"]["temp"] for item in forecast_data.get("list", [])]
        if temps:
            temp_high = max(temps + [temp_f])
            temp_low = min(temps + [temp_f])

        for item in forecast_data.get("list", []):
            if item.get("rain", {}).get("3h", 0) > 0:
                has_recent_rain = True
                break

        # Build hourly_forecast from 3-hour forecast data
        for item in forecast_data.get("list", []):
            hourly_forecast.append({
                "time": format_local_time(item.get("dt"), tz_offset),
                "temp": round(item.get("main", {}).get("temp", 0)),
                "icon": item.get("weather", [{}])[0].get("icon", "01d"),
                "description": item.get("weather", [{}])[0].get("main", "Clear"),
                "wind": round(item.get("wind", {}).get("speed", 0)),
                "pop": round(item.get("pop", 0) * 100),
            })
    except Exception:
        pass
        
    cloud_cover = _cloud_cover_from_pct(clouds_pct)
    
    # Heuristic Pressure
    if pressure_mb > 1015: pressure_trend = "Rising"
    elif pressure_mb < 1010: pressure_trend = "Falling"
    else: pressure_trend = "Stable"
    
    # Heuristic Solunar
    is_major_period = _is_major_solunar_period(datetime.now(timezone.utc), lat, lon)

    # Fallback water temp estimate (no historical data available)
    # Use simple heuristic: water temp ~5°F below air temp high
    estimated_water_temp = estimate_water_temp([], temp_high)

    narrative = f"Current Wind: {wind_mph}mph. Pressure: {pressure_mb}mb ({pressure_trend}). Sky: {cloud_cover}. Est. Water: {estimated_water_temp}°F."

    return {
        "temp_f": float(temp_f),
        "temp_high": float(temp_high),
        "temp_low": float(temp_low),
        "wind_mph": float(wind_mph),
        "wind_direction": degrees_to_cardinal(wind.get("deg")),
        "cloud_cover": cloud_cover,
        "pressure_mb": float(pressure_mb),
        "pressure_trend": pressure_trend,
        "precipitation_1h": round(rain_1h, 2),
        "has_recent_rain": has_recent_rain,
        "uv_index": float(uv_index),
        "moon_phase": "unknown",
        "moon_illumination": 0,
        "is_major_period": is_major_period,
        "humidity": int(humidity),
        "forecast_narrative": narrative,
        "past_wind_mph": wind_mph,
        "future_wind_mph": wind_mph,
        "forecast_wind_max": wind_mph,
        "sunriseTime": "--:--",
        "sunsetTime": "--:--",
        "solarNoonTime": "--:--",
        # Water Temperature (fallback estimate)
        "estimated_water_temp_f": estimated_water_temp,
        "daily_highs_history": [temp_high],
        # Hourly forecast (3-hour intervals from fallback API)
        "hourly_forecast": hourly_forecast,
    }