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
