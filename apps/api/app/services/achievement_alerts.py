# apps/api/app/services/achievement_alerts.py
"""
Achievement proximity alerts service.
Checks if users are close to unlocking achievements and sends notifications.

Achievement thresholds match journeyUtils.ts on frontend:
- first_cast: 1 catch
- lake_hopper: 5 unique lakes
- lunker_5: 5lb+ bass
- technique_master: 5 unique techniques
- double_digit: 10lb+ bass
- century_club: 100 catches
"""
from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Dict, List, Optional

from app.services.catches import CatchStore
from app.services.notifications import NotificationService


# Achievement definitions (mirrors journeyUtils.ts)
ACHIEVEMENTS = {
    "first_cast": {
        "name": "First Cast",
        "description": "Log your first catch",
        "threshold": 1,
        "metric": "total_catches",
        "tier": "bronze",
    },
    "lake_hopper": {
        "name": "Lake Hopper",
        "description": "Log catches on 5 different lakes",
        "threshold": 5,
        "metric": "unique_lakes",
        "tier": "silver",
    },
    "lunker_5": {
        "name": "The 5lb Club",
        "description": "Catch a Bass over 5lbs",
        "threshold": 5.0,
        "metric": "max_weight",
        "tier": "gold",
    },
    "technique_master": {
        "name": "Technique Master",
        "description": "Catch fish using 5 different techniques",
        "threshold": 5,
        "metric": "unique_lures",
        "tier": "gold",
    },
    "double_digit": {
        "name": "Double Digit",
        "description": "Catch a Bass over 10lbs",
        "threshold": 10.0,
        "metric": "max_weight",
        "tier": "obsidian",
    },
    "century_club": {
        "name": "Century Club",
        "description": "Log 100 total catches",
        "threshold": 100,
        "metric": "total_catches",
        "tier": "platinum",
    },
}


@dataclass
class AchievementProximity:
    """Represents how close a user is to an achievement."""
    achievement_id: str
    achievement_name: str
    current: float
    threshold: float
    remaining: float
    percentage: float
    message: str


def calculate_achievement_metrics(catches: List) -> Dict:
    """
    Calculate all achievement-relevant metrics from a list of catches.
    Returns dict with metrics needed for achievement checking.
    """
    if not catches:
        return {
            "total_catches": 0,
            "unique_lakes": 0,
            "unique_lures": 0,
            "max_weight": 0.0,
        }

    unique_lakes = set()
    unique_lures = set()
    max_weight = 0.0

    for catch in catches:
        # Track unique lakes
        lake_name = getattr(catch, "lake_name", None) or getattr(catch, "lake_id", None)
        if lake_name:
            unique_lakes.add(lake_name)

        # Track unique lures/techniques
        lure = getattr(catch, "lure", None)
        if lure:
            unique_lures.add(lure)

        # Track max weight
        weight = getattr(catch, "weight", None)
        if weight and weight > max_weight:
            max_weight = weight

    return {
        "total_catches": len(catches),
        "unique_lakes": len(unique_lakes),
        "unique_lures": len(unique_lures),
        "max_weight": max_weight,
    }


def check_achievement_proximity(
    email: str,
    metrics: Dict,
    proximity_threshold: float = 0.8,
) -> Optional[AchievementProximity]:
    """
    Check if user is close to any achievement (80-99% complete).
    Returns the closest incomplete achievement if any are in proximity range.

    Args:
        email: User email
        metrics: Dict with total_catches, unique_lakes, unique_lures, max_weight
        proximity_threshold: Minimum completion percentage to trigger alert (0.8 = 80%)
    """
    proximities = []

    for achievement_id, achievement in ACHIEVEMENTS.items():
        metric_name = achievement["metric"]
        threshold = achievement["threshold"]
        current = metrics.get(metric_name, 0)

        # Skip if already achieved
        if current >= threshold:
            continue

        # Calculate percentage
        percentage = current / threshold if threshold > 0 else 0

        # Check if in proximity range (80-99%)
        if percentage >= proximity_threshold and percentage < 1.0:
            remaining = threshold - current

            # Generate message based on achievement type
            if metric_name == "total_catches":
                if remaining == 1:
                    message = f"One more catch to earn {achievement['name']}!"
                else:
                    message = f"You're {int(remaining)} catches away from {achievement['name']}!"
            elif metric_name == "unique_lakes":
                if remaining == 1:
                    message = f"One more lake to unlock {achievement['name']}!"
                else:
                    message = f"Fish {int(remaining)} more lakes to unlock {achievement['name']}!"
            elif metric_name == "unique_lures":
                if remaining == 1:
                    message = f"Try one more technique to earn {achievement['name']}!"
                else:
                    message = f"Try {int(remaining)} more techniques to unlock {achievement['name']}!"
            elif metric_name == "max_weight":
                message = f"Catch a {threshold}lb+ bass to join {achievement['name']}!"
            else:
                message = f"You're close to earning {achievement['name']}!"

            proximities.append(
                AchievementProximity(
                    achievement_id=achievement_id,
                    achievement_name=achievement["name"],
                    current=current,
                    threshold=threshold,
                    remaining=remaining,
                    percentage=percentage * 100,
                    message=message,
                )
            )

    if not proximities:
        return None

    # Return the closest one (highest percentage)
    return max(proximities, key=lambda p: p.percentage)


async def check_and_notify_achievement(email: str) -> bool:
    """
    Check if user is close to an achievement and send notification if so.
    Called after each catch creation.

    Returns True if notification was sent.
    """
    try:
        # Get user's catches
        catch_store = CatchStore()
        catches = catch_store.list_by_user(email, limit=500)

        # Calculate metrics
        metrics = calculate_achievement_metrics(catches)

        # Check proximity
        proximity = check_achievement_proximity(email, metrics)

        if not proximity:
            return False

        # Send notification
        notification_service = NotificationService()

        # Use achievement_id as key for debouncing
        notification_key = f"achievement:{proximity.achievement_id}"

        sent = await notification_service.send_to_user(
            email=email,
            title="Almost There!",
            body=proximity.message,
            notification_type="achievement_proximity",
            notification_key=notification_key,
            data={
                "type": "achievement_proximity",
                "achievement_id": proximity.achievement_id,
                "current": proximity.current,
                "threshold": proximity.threshold,
            },
        )

        return sent > 0

    except Exception as e:
        print(f"[achievement_alerts] Error checking achievements for {email}: {e}")
        return False


def get_all_proximities(email: str) -> List[AchievementProximity]:
    """
    Get all achievement proximities for a user (for debugging/display).
    """
    catch_store = CatchStore()
    catches = catch_store.list_by_user(email, limit=500)
    metrics = calculate_achievement_metrics(catches)

    proximities = []
    for achievement_id, achievement in ACHIEVEMENTS.items():
        metric_name = achievement["metric"]
        threshold = achievement["threshold"]
        current = metrics.get(metric_name, 0)
        percentage = (current / threshold * 100) if threshold > 0 else 0

        proximities.append(
            AchievementProximity(
                achievement_id=achievement_id,
                achievement_name=achievement["name"],
                current=current,
                threshold=threshold,
                remaining=max(0, threshold - current),
                percentage=min(100, percentage),
                message=f"{int(percentage)}% complete",
            )
        )

    return sorted(proximities, key=lambda p: -p.percentage)
