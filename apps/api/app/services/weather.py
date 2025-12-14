import os
from typing import Any, Dict
import httpx


def _cloud_cover_from_pct(pct: float) -> str:
    if pct is None:
        return "partly cloudy"
    if pct < 20:
        return "clear"
    if pct < 60:
        return "partly cloudy"
    return "cloudy"


async def get_weather_snapshot(lat: float, lon: float) -> Dict[str, Any]:
    """
    Minimal snapshot:
      { temp_f, wind_mph, cloud_cover }

    Uses OpenWeather /data/2.5/weather (widely available).
    Requires env: OPENWEATHER_API_KEY
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENWEATHER_API_KEY in environment")

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"lat": lat, "lon": lon, "appid": api_key, "units": "imperial"}

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, params=params)
        r.raise_for_status()
        data = r.json()

    main = data.get("main") or {}
    wind = data.get("wind") or {}
    clouds = data.get("clouds") or {}

    temp_f = main.get("temp")
    wind_mph = wind.get("speed")
    clouds_pct = clouds.get("all")

    if temp_f is None or wind_mph is None:
        raise RuntimeError("Weather provider response missing temp/wind")

    cloud_cover = _cloud_cover_from_pct(float(clouds_pct)) if clouds_pct is not None else "partly cloudy"

    return {"temp_f": float(temp_f), "wind_mph": float(wind_mph), "cloud_cover": cloud_cover}