# apps/api/app/services/weather_alerts.py
"""
Weather alerts service for Bass Clarity.
Evaluates weather conditions and sends notifications when fishing conditions are favorable.
"""
from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

import httpx

from app.services.notifications import NotificationService
from app.services.user_regions import UserRegionStore, UserRegionService
from app.services.device_tokens import DeviceTokenStore


OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")


@dataclass
class WeatherConditions:
    """Current weather conditions for a location."""
    lat: float
    lng: float
    temp_f: float
    wind_mph: float
    pressure_mb: float
    humidity: int
    description: str
    is_precipitating: bool


@dataclass
class FishingConditionScore:
    """Evaluation of fishing conditions."""
    score: int  # 0-100
    is_favorable: bool  # True if score >= 65
    reasons: List[str]
    alert_message: str


async def get_weather(lat: float, lng: float) -> Optional[WeatherConditions]:
    """
    Fetch current weather for a location using OpenWeatherMap API.
    """
    if not OPENWEATHER_API_KEY:
        print("[weather_alerts] No OPENWEATHER_API_KEY configured")
        return None

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat,
        "lon": lng,
        "appid": OPENWEATHER_API_KEY,
        "units": "imperial",  # Fahrenheit and mph
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)

            if response.status_code != 200:
                print(f"[weather_alerts] Weather API error: {response.status_code}")
                return None

            data = response.json()

            # Extract weather data
            main = data.get("main", {})
            wind = data.get("wind", {})
            weather = data.get("weather", [{}])[0]

            # Check for precipitation
            is_precipitating = False
            weather_id = weather.get("id", 800)
            # Weather IDs: 2xx=thunderstorm, 3xx=drizzle, 5xx=rain, 6xx=snow
            if weather_id < 700:
                is_precipitating = True

            return WeatherConditions(
                lat=lat,
                lng=lng,
                temp_f=main.get("temp", 70),
                wind_mph=wind.get("speed", 0),
                pressure_mb=main.get("pressure", 1013),
                humidity=main.get("humidity", 50),
                description=weather.get("description", "clear"),
                is_precipitating=is_precipitating,
            )

    except Exception as e:
        print(f"[weather_alerts] Error fetching weather: {e}")
        return None


def evaluate_fishing_conditions(weather: WeatherConditions) -> FishingConditionScore:
    """
    Evaluate weather conditions for bass fishing.
    Returns a score (0-100) and whether conditions are favorable.

    Scoring:
    - Barometric pressure: stable (1010-1020mb) = +20, rising = +20
    - Wind: <10mph = +25, 10-15mph = +10, >15mph = 0
    - Temperature: 55-80F = +25, 45-55F or 80-90F = +15, otherwise = 0
    - No precipitation = +15
    - Humidity 40-70% = +5
    """
    score = 0
    reasons = []

    # Pressure scoring
    if 1010 <= weather.pressure_mb <= 1020:
        score += 20
        reasons.append("Stable barometric pressure")
    elif weather.pressure_mb > 1020:
        score += 15
        reasons.append("High pressure system")
    elif weather.pressure_mb < 1005:
        score += 5
        reasons.append("Low pressure (fish may be active)")

    # Wind scoring
    if weather.wind_mph < 10:
        score += 25
        reasons.append("Light winds")
    elif weather.wind_mph <= 15:
        score += 10
        reasons.append("Moderate winds")
    else:
        reasons.append("Strong winds may affect fishing")

    # Temperature scoring
    if 55 <= weather.temp_f <= 80:
        score += 25
        reasons.append(f"Ideal temperature ({int(weather.temp_f)}°F)")
    elif 45 <= weather.temp_f < 55 or 80 < weather.temp_f <= 90:
        score += 15
        reasons.append(f"Good temperature ({int(weather.temp_f)}°F)")
    else:
        reasons.append(f"Temperature ({int(weather.temp_f)}°F) not ideal")

    # Precipitation scoring
    if not weather.is_precipitating:
        score += 15
        reasons.append("No precipitation")
    else:
        reasons.append("Precipitation expected")

    # Humidity bonus
    if 40 <= weather.humidity <= 70:
        score += 5

    # Determine favorability
    is_favorable = score >= 65

    # Generate alert message
    if score >= 80:
        alert_message = "Perfect fishing conditions today!"
    elif score >= 70:
        alert_message = "Great conditions for bass fishing!"
    elif score >= 65:
        alert_message = "Good fishing weather - conditions are favorable."
    else:
        alert_message = "Fishing conditions are moderate."

    return FishingConditionScore(
        score=score,
        is_favorable=is_favorable,
        reasons=reasons,
        alert_message=alert_message,
    )


async def check_region_and_notify(
    state: str,
    lat: float,
    lng: float,
    users: List[str],
) -> int:
    """
    Check weather for a region and notify users if favorable.
    Returns count of notifications sent.
    """
    # Get weather
    weather = await get_weather(lat, lng)
    if not weather:
        return 0

    # Evaluate conditions
    conditions = evaluate_fishing_conditions(weather)

    if not conditions.is_favorable:
        print(f"[weather_alerts] {state}: Score {conditions.score} - not favorable")
        return 0

    print(f"[weather_alerts] {state}: Score {conditions.score} - FAVORABLE!")

    # Send notifications
    notification_service = NotificationService()
    today = datetime.now().strftime("%Y-%m-%d")
    notification_key = f"weather:{state}:{today}"

    sent_count = 0
    for email in users:
        try:
            sent = await notification_service.send_to_user(
                email=email,
                title="Great Fishing Weather Today",
                body=f"{conditions.alert_message} {', '.join(conditions.reasons[:2])} in the {state} area.",
                notification_type="weather_alert",
                notification_key=notification_key,
                data={
                    "type": "weather_alert",
                    "state": state,
                    "score": conditions.score,
                    "temp_f": weather.temp_f,
                    "wind_mph": weather.wind_mph,
                },
            )
            sent_count += sent
        except Exception as e:
            print(f"[weather_alerts] Failed to notify {email}: {e}")

    return sent_count


async def run_weather_alert_job() -> Dict:
    """
    Main entry point for weather alert cron job.
    Runs 2x/week (Wed & Sat mornings).

    1. Get all unique states/regions with users
    2. For each region, check weather
    3. If favorable, notify users in that region
    """
    print("[weather_alerts] Starting weather alert job...")

    region_store = UserRegionStore()
    device_store = DeviceTokenStore()

    # Get states with active users (who have device tokens)
    active_emails = set(device_store.get_unique_emails())

    # Get all user regions
    all_regions = region_store.get_all_with_coordinates()

    # Group by state
    state_data: Dict[str, Dict] = {}
    for region in all_regions:
        if region.email not in active_emails:
            continue

        state = region.state or "Unknown"
        if state not in state_data:
            state_data[state] = {
                "lat": region.region_lat,
                "lng": region.region_lng,
                "users": [],
            }
        state_data[state]["users"].append(region.email)

    print(f"[weather_alerts] Found {len(state_data)} states with active users")

    # Check each state
    results = {
        "states_checked": 0,
        "states_favorable": 0,
        "notifications_sent": 0,
    }

    for state, data in state_data.items():
        results["states_checked"] += 1

        sent = await check_region_and_notify(
            state=state,
            lat=data["lat"],
            lng=data["lng"],
            users=data["users"],
        )

        if sent > 0:
            results["states_favorable"] += 1
            results["notifications_sent"] += sent

        # Small delay between API calls
        await asyncio.sleep(0.5)

    print(f"[weather_alerts] Job complete: {results}")
    return results


async def test_weather_alert(email: str) -> Dict:
    """
    Test weather alert for a specific user.
    Useful for debugging and manual testing.
    """
    region_service = UserRegionService()
    region = region_service.get_or_compute_region(email)

    if not region:
        return {"error": "No region found for user"}

    weather = await get_weather(region.region_lat, region.region_lng)
    if not weather:
        return {"error": "Failed to fetch weather"}

    conditions = evaluate_fishing_conditions(weather)

    return {
        "email": email,
        "region": region.region_name,
        "state": region.state,
        "weather": {
            "temp_f": weather.temp_f,
            "wind_mph": weather.wind_mph,
            "pressure_mb": weather.pressure_mb,
            "description": weather.description,
        },
        "conditions": {
            "score": conditions.score,
            "is_favorable": conditions.is_favorable,
            "reasons": conditions.reasons,
            "message": conditions.alert_message,
        },
    }
