# apps/api/app/routes/mobile_auth.py
"""
Mobile authentication endpoints.
Routes auth through the backend to bypass Clerk's CORS restrictions for native apps.
"""
import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/mobile-auth", tags=["mobile-auth"])

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_FRONTEND_API = os.getenv("CLERK_FRONTEND_API", "clerk.bassclarity.com")
CLERK_API_BASE = f"https://{CLERK_FRONTEND_API}"


class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    success: bool
    session_id: str | None = None
    user_id: str | None = None
    token: str | None = None
    error: str | None = None


@router.post("/sign-in", response_model=AuthResponse)
async def mobile_sign_in(request: SignInRequest):
    """
    Sign in via Clerk Backend API.
    Used by mobile apps to bypass CORS restrictions.
    """
    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Clerk secret key not configured")

    async with httpx.AsyncClient() as client:
        try:
            # Step 1: Create a sign-in attempt
            sign_in_response = await client.post(
                f"{CLERK_API_BASE}/v1/client/sign_ins",
                data={
                    "identifier": request.email,
                    "strategy": "password",
                    "password": request.password,
                },
                headers={
                    "Authorization": f"Bearer {CLERK_SECRET_KEY}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )

            if sign_in_response.status_code != 200:
                error_data = sign_in_response.json()
                error_msg = error_data.get("errors", [{}])[0].get(
                    "long_message", "Sign in failed"
                )
                return AuthResponse(success=False, error=error_msg)

            result = sign_in_response.json()

            # Check for active session in client response
            client_data = result.get("client", {})
            sessions = client_data.get("sessions", [])

            # Find active session
            active_session = None
            for session in sessions:
                if session.get("status") == "active":
                    active_session = session
                    break

            if active_session:
                return AuthResponse(
                    success=True,
                    session_id=active_session.get("id"),
                    user_id=active_session.get("user", {}).get("id"),
                    token=active_session.get("last_active_token", {}).get("jwt"),
                )

            # Check sign_in response status
            sign_in = result.get("response", result)
            if sign_in.get("status") == "complete":
                # Get session from created_session_id
                return AuthResponse(
                    success=True,
                    session_id=sign_in.get("created_session_id"),
                    user_id=client_data.get("sessions", [{}])[0].get("user", {}).get("id"),
                    token=client_data.get("sessions", [{}])[0].get("last_active_token", {}).get("jwt"),
                )

            return AuthResponse(
                success=False,
                error=f"Sign in incomplete: {sign_in.get('status', 'unknown')}"
            )

        except httpx.HTTPError as e:
            return AuthResponse(success=False, error=f"Network error: {str(e)}")
        except Exception as e:
            return AuthResponse(success=False, error=f"Unexpected error: {str(e)}")


@router.post("/sign-up", response_model=AuthResponse)
async def mobile_sign_up(request: SignUpRequest):
    """
    Sign up via Clerk Backend API.
    Used by mobile apps to bypass CORS restrictions.
    """
    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Clerk secret key not configured")

    async with httpx.AsyncClient() as client:
        try:
            # Step 1: Create sign-up
            sign_up_response = await client.post(
                f"{CLERK_API_BASE}/v1/client/sign_ups",
                data={
                    "email_address": request.email,
                    "password": request.password,
                },
                headers={
                    "Authorization": f"Bearer {CLERK_SECRET_KEY}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )

            if sign_up_response.status_code != 200:
                error_data = sign_up_response.json()
                error_msg = error_data.get("errors", [{}])[0].get(
                    "long_message", "Sign up failed"
                )
                return AuthResponse(success=False, error=error_msg)

            result = sign_up_response.json()
            sign_up = result.get("response", result)
            client_data = result.get("client", {})

            # Check if sign-up is complete (no email verification required)
            if sign_up.get("status") == "complete":
                sessions = client_data.get("sessions", [])
                active_session = sessions[0] if sessions else {}

                return AuthResponse(
                    success=True,
                    session_id=sign_up.get("created_session_id") or active_session.get("id"),
                    user_id=active_session.get("user", {}).get("id"),
                    token=active_session.get("last_active_token", {}).get("jwt"),
                )

            # Sign-up needs verification
            return AuthResponse(
                success=False,
                error=f"Account created but needs verification: {sign_up.get('status')}"
            )

        except httpx.HTTPError as e:
            return AuthResponse(success=False, error=f"Network error: {str(e)}")
        except Exception as e:
            return AuthResponse(success=False, error=f"Unexpected error: {str(e)}")
