# apps/api/app/routes/mobile_auth.py
"""
Mobile authentication endpoints.
Uses Clerk Backend API to verify credentials directly, bypassing the client-side 2FA flow.
"""
import os
from typing import Optional
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/mobile-auth", tags=["mobile-auth"])

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
# Backend API base URL (not Frontend API)
CLERK_BACKEND_API = "https://api.clerk.com/v1"


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    success: bool
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    token: Optional[str] = None
    email: Optional[str] = None
    error: Optional[str] = None


def get_clerk_headers():
    """Get headers for Clerk Backend API requests."""
    return {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


@router.post("/sign-in", response_model=AuthResponse)
async def mobile_sign_in(request: SignInRequest):
    """
    Sign in via Clerk Backend API.
    1. Find user by email
    2. Verify password
    3. Return user info for session
    """
    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Clerk secret key not configured")

    async with httpx.AsyncClient() as client:
        try:
            # Step 1: Find user by email
            users_response = await client.get(
                f"{CLERK_BACKEND_API}/users",
                params={"email_address": request.email},
                headers=get_clerk_headers(),
            )

            if users_response.status_code != 200:
                return AuthResponse(success=False, error="Failed to lookup user")

            users = users_response.json()

            if not users or len(users) == 0:
                return AuthResponse(success=False, error="No account found with this email")

            user = users[0]
            user_id = user.get("id")

            # Step 2: Verify password
            verify_response = await client.post(
                f"{CLERK_BACKEND_API}/users/{user_id}/verify_password",
                json={"password": request.password},
                headers=get_clerk_headers(),
            )

            if verify_response.status_code != 200:
                error_data = verify_response.json()
                error_msg = error_data.get("errors", [{}])[0].get(
                    "long_message", "Invalid password"
                )
                return AuthResponse(success=False, error=error_msg)

            verify_result = verify_response.json()

            if not verify_result.get("verified"):
                return AuthResponse(success=False, error="Invalid password")

            # Step 3: Get user's primary email
            primary_email = None
            email_addresses = user.get("email_addresses", [])
            for email_obj in email_addresses:
                if email_obj.get("id") == user.get("primary_email_address_id"):
                    primary_email = email_obj.get("email_address")
                    break

            if not primary_email and email_addresses:
                primary_email = email_addresses[0].get("email_address")

            # Return success with user info
            # Note: For a full implementation, you'd create a session token here
            # For now, we return user_id which the app can use for authenticated requests
            return AuthResponse(
                success=True,
                user_id=user_id,
                email=primary_email,
                # session_id and token would require additional Clerk API calls
                # The app can use user_id + email for its own session management
            )

        except httpx.HTTPError as e:
            return AuthResponse(success=False, error=f"Network error: {str(e)}")
        except Exception as e:
            return AuthResponse(success=False, error=f"Unexpected error: {str(e)}")


@router.post("/sign-up", response_model=AuthResponse)
async def mobile_sign_up(request: SignUpRequest):
    """
    Sign up via Clerk Backend API.
    Creates a new user directly without email verification.
    """
    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Clerk secret key not configured")

    async with httpx.AsyncClient() as client:
        try:
            # Check if user already exists
            existing_response = await client.get(
                f"{CLERK_BACKEND_API}/users",
                params={"email_address": request.email},
                headers=get_clerk_headers(),
            )

            if existing_response.status_code == 200:
                existing_users = existing_response.json()
                if existing_users and len(existing_users) > 0:
                    return AuthResponse(
                        success=False,
                        error="An account with this email already exists"
                    )

            # Create new user via Backend API
            create_response = await client.post(
                f"{CLERK_BACKEND_API}/users",
                json={
                    "email_address": [request.email],
                    "password": request.password,
                    "skip_password_checks": False,
                    "skip_password_requirement": False,
                },
                headers=get_clerk_headers(),
            )

            if create_response.status_code not in [200, 201]:
                error_data = create_response.json()
                error_msg = error_data.get("errors", [{}])[0].get(
                    "long_message", "Failed to create account"
                )
                return AuthResponse(success=False, error=error_msg)

            user = create_response.json()
            user_id = user.get("id")

            # Get primary email
            primary_email = None
            email_addresses = user.get("email_addresses", [])
            for email_obj in email_addresses:
                if email_obj.get("id") == user.get("primary_email_address_id"):
                    primary_email = email_obj.get("email_address")
                    break

            if not primary_email and email_addresses:
                primary_email = email_addresses[0].get("email_address")

            return AuthResponse(
                success=True,
                user_id=user_id,
                email=primary_email,
            )

        except httpx.HTTPError as e:
            return AuthResponse(success=False, error=f"Network error: {str(e)}")
        except Exception as e:
            return AuthResponse(success=False, error=f"Unexpected error: {str(e)}")


# =============================================================================
# MOBILE DATA ENDPOINTS (use email instead of JWT)
# =============================================================================

class MobileStatusRequest(BaseModel):
    email: EmailStr
    user_id: str


@router.post("/status")
async def mobile_member_status(request: MobileStatusRequest):
    """
    Get member status for mobile app using email instead of JWT.
    During FREE_MODE beta, all authenticated mobile users are treated as members.
    """
    # For beta/FREE_MODE, return full member access
    return {
        "email": request.email,
        "is_member": True,
        "has_subscription": True,
        "rate_limit_allowed": True,
        "rate_limit_seconds": 0,
        "stripe_customer_id": None,
        "stripe_subscription_id": None,
        "subscription_status": "active",
        "next_billing_date": None,
        "cancel_at_period_end": False,
        "plan_interval": "month",
        "plan_amount": 10,
    }


class MobileCatchesRequest(BaseModel):
    email: EmailStr
    user_id: str
    limit: int = 500
    offset: int = 0


@router.post("/catches")
async def mobile_list_catches(request: MobileCatchesRequest):
    """
    List catches for mobile app using email instead of JWT.
    """
    from app.services.catches import CatchStore
    from dataclasses import asdict

    catch_store = CatchStore()

    try:
        catches = catch_store.list_by_user(request.email, limit=request.limit, offset=request.offset)
        # Convert Catch dataclass objects to dicts for JSON serialization
        catches_dicts = [asdict(c) for c in catches]
        return {
            "catches": catches_dicts,
            "total": len(catches_dicts),
            "limit": request.limit,
            "offset": request.offset,
        }
    except Exception as e:
        print(f"[mobile_auth] catches error: {e}")
        return {"catches": [], "total": 0, "error": str(e)}


# =============================================================================
# MOBILE FAVORITES ENDPOINT
# =============================================================================

@router.post("/favorites")
async def mobile_list_favorites(request: MobileStatusRequest):
    """
    List favorite lakes for mobile app using email instead of JWT.
    """
    from app.services.user_lakes import UserLakeStore
    from app.services.custom_lakes import CustomLakeStore

    user_lake_store = UserLakeStore()
    custom_lake_store = CustomLakeStore()

    try:
        favorites = user_lake_store.list_by_user(request.email)

        hydrated = []
        for fav in favorites:
            if fav.lake_type == "known":
                hydrated.append({
                    "lake_id": fav.lake_id,
                    "lake_type": "known",
                    "added_at": fav.added_at,
                })
            else:
                lake = custom_lake_store.get(fav.lake_id, request.email)
                if lake:
                    hydrated.append({
                        "lake_id": fav.lake_id,
                        "lake_type": "custom",
                        "name": lake.name,
                        "lat": lake.lat,
                        "lng": lake.lng,
                        "city": lake.city,
                        "state": lake.state,
                        "anchors": getattr(lake, "anchors", None),
                        "catch_count": lake.catch_count,
                        "added_at": fav.added_at,
                    })

        return {
            "favorites": hydrated,
            "total": len(hydrated),
        }
    except Exception as e:
        return {"favorites": [], "total": 0, "error": str(e)}


# =============================================================================
# MOBILE CUSTOM LAKES ENDPOINT
# =============================================================================

@router.post("/custom-lakes")
async def mobile_list_custom_lakes(request: MobileStatusRequest):
    """
    List custom lakes for mobile app using email instead of JWT.
    """
    from app.services.custom_lakes import CustomLakeStore

    custom_lake_store = CustomLakeStore()

    try:
        lakes = custom_lake_store.list_by_user(request.email)

        return {
            "lakes": [
                {
                    "id": lake.id,
                    "name": lake.name,
                    "lat": lake.lat,
                    "lng": lake.lng,
                    "city": lake.city,
                    "state": lake.state,
                    "anchors": getattr(lake, "anchors", None),
                    "catch_count": lake.catch_count,
                    "created_at": lake.created_at,
                }
                for lake in lakes
            ],
            "total": len(lakes),
        }
    except Exception as e:
        return {"lakes": [], "total": 0, "error": str(e)}


# =============================================================================
# MOBILE PLAN HISTORY ENDPOINT
# =============================================================================

class MobilePlanHistoryRequest(BaseModel):
    email: EmailStr
    user_id: str
    limit: int = 10
    offset: int = 0


@router.post("/plan-history")
async def mobile_plan_history(request: MobilePlanHistoryRequest):
    """
    List plan history for mobile app using email instead of JWT.
    """
    from app.services.plan_history import PlanHistoryStore

    plan_history_store = PlanHistoryStore()

    try:
        plans = plan_history_store.get_user_plans(
            request.email,
            limit=request.limit,
            offset=request.offset
        )

        return {
            "plans": plans,
            "total": len(plans),
            "has_more": len(plans) >= request.limit,
        }
    except Exception as e:
        return {"plans": [], "total": 0, "has_more": False, "error": str(e)}


# =============================================================================
# PUSH NOTIFICATION DEVICE REGISTRATION
# =============================================================================

class RegisterDeviceRequest(BaseModel):
    email: EmailStr
    user_id: str
    device_token: str
    platform: str = "ios"


class UnregisterDeviceRequest(BaseModel):
    device_token: str


@router.post("/register-device")
async def register_device(request: RegisterDeviceRequest):
    """
    Register a device token for push notifications.
    Called after successful sign-in on mobile app.
    """
    from app.services.device_tokens import DeviceTokenStore
    from app.services.user_regions import UserRegionService

    try:
        # Register the device token
        device_store = DeviceTokenStore()
        device_store.register(
            email=request.email,
            device_token=request.device_token,
            platform=request.platform,
        )

        # Compute/update user's region for weather alerts
        region_service = UserRegionService()
        region_service.compute_user_region(request.email)

        return {"success": True, "message": "Device registered for notifications"}

    except Exception as e:
        print(f"[mobile_auth] register-device error: {e}")
        return {"success": False, "error": str(e)}


@router.post("/unregister-device")
async def unregister_device(request: UnregisterDeviceRequest):
    """
    Unregister a device token (e.g., on sign-out or app uninstall).
    """
    from app.services.device_tokens import DeviceTokenStore

    try:
        device_store = DeviceTokenStore()
        device_store.unregister(request.device_token)
        return {"success": True, "message": "Device unregistered"}
    except Exception as e:
        print(f"[mobile_auth] unregister-device error: {e}")
        return {"success": False, "error": str(e)}


# =============================================================================
# ADMIN/TEST ENDPOINTS FOR NOTIFICATIONS
# =============================================================================

CRON_API_KEY = os.getenv("CRON_API_KEY")


class CronJobRequest(BaseModel):
    api_key: str


@router.post("/run-weather-alerts")
async def run_weather_alerts(request: CronJobRequest):
    """
    Cron job endpoint for weather alerts.
    Called by Render Cron Jobs on Wed & Sat mornings.

    Schedule in Render: 0 7 * * 3,6 (7 AM UTC on Wed & Sat)
    """
    if not CRON_API_KEY:
        return {"error": "CRON_API_KEY not configured", "success": False}

    if request.api_key != CRON_API_KEY:
        return {"error": "Invalid API key", "success": False}

    from app.services.weather_alerts import run_weather_alert_job

    try:
        results = await run_weather_alert_job()
        return {
            "success": True,
            "results": results,
        }
    except Exception as e:
        print(f"[cron] weather alerts error: {e}")
        return {"success": False, "error": str(e)}


@router.post("/test-weather-alert")
async def test_weather_alert(request: MobileStatusRequest):
    """
    Test weather alert for a specific user.
    Returns weather conditions and whether an alert would be sent.
    """
    from app.services.weather_alerts import test_weather_alert as _test_weather_alert

    try:
        result = await _test_weather_alert(request.email)
        return result
    except Exception as e:
        return {"error": str(e)}


@router.post("/test-achievement-alert")
async def test_achievement_alert(request: MobileStatusRequest):
    """
    Test achievement proximity for a specific user.
    Returns all achievement proximities.
    """
    from app.services.achievement_alerts import get_all_proximities

    try:
        proximities = get_all_proximities(request.email)
        return {
            "email": request.email,
            "achievements": [
                {
                    "id": p.achievement_id,
                    "name": p.achievement_name,
                    "current": p.current,
                    "threshold": p.threshold,
                    "remaining": p.remaining,
                    "percentage": p.percentage,
                    "message": p.message,
                }
                for p in proximities
            ],
        }
    except Exception as e:
        return {"error": str(e)}
