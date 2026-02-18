# apps/api/app/routes/mobile_auth.py
"""
Mobile authentication endpoints.
Uses Clerk Backend API to verify credentials directly, bypassing the client-side 2FA flow.
"""
import os
import httpx
import jwt # NEW: Import jwt library
from datetime import datetime, timedelta # NEW: Import datetime for JWT expiration
from typing import Optional, Dict, Any # NEW: Add Dict, Any for JWKS
from fastapi import APIRouter, HTTPException, status # NEW: Add status for HTTP errors
from pydantic import BaseModel, EmailStr

# NEW: Import SubscriberStore for user management
from app.services.subscribers import SubscriberStore

router = APIRouter(prefix="/mobile-auth", tags=["mobile-auth"])

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
# NEW: Secret for signing internal JWTs
JWT_SECRET = os.getenv("JWT_SECRET")
# Backend API base URL (not Frontend API)
CLERK_BACKEND_API = "https://api.clerk.com/v1"

# =============================================================================
# JWT UTILITIES (for internal app tokens)
# =============================================================================

if not JWT_SECRET:
    print("WARNING: JWT_SECRET environment variable is not set. JWT generation/verification will fail.")

def create_jwt(user_id: str, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT for the authenticated user."""
    if not JWT_SECRET:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWT_SECRET not configured.")
    
    to_encode = {"sub": user_id, "email": email}
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=60 * 24 * 7) # Default to 1 week
    to_encode.update({"exp": expire.timestamp()})
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm="HS256")
    return encoded_jwt

def decode_jwt(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and verifies an internal JWT."""
    if not JWT_SECRET:
        return None
    try:
        decoded_payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded_payload
    except jwt.PyJWTError:
        return None

# =============================================================================
# REQUEST MODELS
# =============================================================================

class SignInRequest(BaseModel):
    email: EmailStr
    password: str


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str

# NEW: Model for Apple Sign-In request
class AppleSignInRequest(BaseModel):
    identity_token: str
    email: Optional[str] = None  # Apple only provides on FIRST sign-in, null after
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    token: Optional[str] = None # Our internal JWT
    email: Optional[EmailStr] = None
    error: Optional[str] = None

# Initialize SubscriberStore
_subs_store = SubscriberStore()

# =============================================================================
# APPLE JWKS CACHING
# =============================================================================

import time as _time

# Simple cache for Apple's public keys (refresh every hour)
_apple_keys_cache: Dict[str, Any] = {}
_apple_keys_cache_time: float = 0
_APPLE_KEYS_CACHE_TTL = 3600  # 1 hour

async def get_apple_public_keys() -> Dict[str, Any]:
    """Fetches Apple's public keys for JWT verification with caching."""
    global _apple_keys_cache, _apple_keys_cache_time

    # Return cached keys if still valid
    if _apple_keys_cache and (_time.time() - _apple_keys_cache_time) < _APPLE_KEYS_CACHE_TTL:
        return _apple_keys_cache

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("https://appleid.apple.com/auth/keys")
            response.raise_for_status()
            _apple_keys_cache = response.json()
            _apple_keys_cache_time = _time.time()
            return _apple_keys_cache
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch Apple public keys: {e.response.status_code} - {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Network error fetching Apple public keys: {e}"
        )

# =============================================================================
# APPLE SIGN-IN ENDPOINT
# =============================================================================

@router.post("/apple-sign-in", response_model=AuthResponse)
async def mobile_apple_sign_in(request: AppleSignInRequest):
    """
    Handles Apple Sign-In authentication.
    Verifies the identity token, then signs in or registers the user.
    """
    if not JWT_SECRET:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWT_SECRET not configured.")
    if not os.getenv("APPLE_CLIENT_ID"):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="APPLE_CLIENT_ID not configured.")

    try:
        # 1. Fetch Apple's public keys
        apple_jwks = await get_apple_public_keys()

        # 2. Get the signing key from the identity token
        header = jwt.get_unverified_header(request.identity_token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Apple identity token: missing 'kid'.")

        # Find the matching key in JWKS
        signing_key = None
        for key in apple_jwks.get("keys", []):
            if key.get("kid") == kid:
                from jwt.algorithms import RSAAlgorithm
                signing_key = RSAAlgorithm.from_jwk(key)
                break

        if not signing_key:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Apple public key with kid '{kid}' not found.")

        # 3. Decode and verify the identity token
        decoded_token = jwt.decode(
            request.identity_token,
            signing_key,
            algorithms=["RS256"],
            audience=os.getenv("APPLE_CLIENT_ID"), # Your app's bundle ID (e.g., com.bassclarity.app)
            issuer="https://appleid.apple.com",
            options={"verify_exp": True} # Ensure token is not expired
        )

        # 4. Extract user info from token
        apple_user_id = decoded_token.get("sub")
        email_from_token = decoded_token.get("email")

        if not apple_user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Apple identity token: missing 'sub'.")

        # Get email from request or token (Apple only sends email on FIRST sign-in)
        provided_email = request.email or email_from_token

        # 5. Find user - first by apple_user_id, then by email
        user = _subs_store.get_by_apple_id(apple_user_id)

        if user:
            # Returning user found by Apple ID
            user_email = user.email
            print(f"[Apple Sign-In] Returning user found: {user_email}")
        elif provided_email:
            # Check if user exists by email (first-time Apple sign-in for existing user)
            user = _subs_store.get(provided_email)
            user_email = provided_email

            if user:
                # Link Apple ID to existing email account
                _subs_store.update_apple_user_id(user_email, apple_user_id)
                print(f"[Apple Sign-In] Linked Apple ID to existing user: {user_email}")
            else:
                # New user - create account
                _subs_store.create(
                    email=user_email,
                    first_name=request.first_name,
                    last_name=request.last_name,
                    apple_user_id=apple_user_id,
                    active=True
                )
                print(f"[Apple Sign-In] Created new user: {user_email}")
        else:
            # No email and user not found by Apple ID
            # This happens if user deleted app data after first sign-in
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account not found. Please go to Settings > Apple ID > Sign-In & Security > Apps Using Apple ID > Bass Clarity > Stop Using Apple ID, then try signing in again."
            )

        # 6. Generate our internal JWT
        internal_jwt = create_jwt(user_id=apple_user_id, email=user_email)

        return AuthResponse(
            success=True,
            user_id=apple_user_id, # Use Apple's user ID as our internal userId
            email=user_email,
            token=internal_jwt,
            session_id=None # No session_id for this flow, use JWT
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Apple identity token has expired.")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Apple identity token: {e}.")
    except Exception as e:
        print(f"[mobile_auth] Apple Sign-In error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during Apple Sign-In: {e}"
        )

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
# EMAIL VERIFICATION FOR MOBILE
# =============================================================================

from app.services.verification_codes import verification_store
from app.services.email_service import send_verification_email


class SendVerificationRequest(BaseModel):
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str


class VerificationResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


@router.post("/send-verification", response_model=VerificationResponse)
async def send_verification_code(request: SendVerificationRequest):
    """
    Send a 6-digit verification code to the user's email.
    Used for mobile signup flow before payment.
    """
    try:
        # Generate code
        code = verification_store.generate_code(request.email)

        # Send email
        success = send_verification_email(request.email, code)

        if success:
            return VerificationResponse(
                success=True,
                message="Verification code sent to your email"
            )
        else:
            return VerificationResponse(
                success=False,
                error="Failed to send verification email. Please try again."
            )

    except Exception as e:
        print(f"[mobile_auth] send-verification error: {e}")
        return VerificationResponse(
            success=False,
            error="Failed to send verification code"
        )


@router.post("/verify-code", response_model=VerificationResponse)
async def verify_code(request: VerifyCodeRequest):
    """
    Verify the 6-digit code entered by the user.
    Returns success if code is valid and not expired.
    """
    try:
        is_valid = verification_store.verify_code(request.email, request.code)

        if is_valid:
            return VerificationResponse(
                success=True,
                message="Email verified successfully"
            )
        else:
            return VerificationResponse(
                success=False,
                error="Invalid or expired code. Please try again."
            )

    except Exception as e:
        print(f"[mobile_auth] verify-code error: {e}")
        return VerificationResponse(
            success=False,
            error="Verification failed"
        )


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
    Checks FREE_MODE env var - if enabled, all users get full access.
    Otherwise, checks the subscriber database for actual status.
    """
    # Check FREE_MODE environment variable
    free_mode = os.getenv("FREE_MODE", "false").lower() == "true"

    if free_mode:
        # FREE_MODE: All authenticated users get full member access
        # Still return plans_generated for tracking
        store = SubscriberStore()
        subscriber = store.get(request.email)
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
            "plans_generated": subscriber.plans_generated if subscriber else 0,
        }

    # Normal mode: Check actual subscriber status from database
    store = SubscriberStore()
    subscriber = store.get(request.email)

    is_member = bool(subscriber and subscriber.active)

    return {
        "email": request.email,
        "is_member": is_member,
        "has_subscription": subscriber is not None,
        "rate_limit_allowed": True,
        "rate_limit_seconds": 0,
        "stripe_customer_id": subscriber.stripe_customer_id if subscriber else None,
        "stripe_subscription_id": subscriber.stripe_subscription_id if subscriber else None,
        "subscription_status": "active" if is_member else "inactive",
        "next_billing_date": None,
        "cancel_at_period_end": False,
        "plan_interval": "month",
        "plan_amount": 10,
        "plans_generated": subscriber.plans_generated if subscriber else 0,
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
# MOBILE REMOVE FAVORITE ENDPOINT
# =============================================================================

class MobileRemoveFavoriteRequest(BaseModel):
    email: EmailStr
    user_id: str
    lake_id: str
    lake_type: str  # 'known' or 'custom'


@router.post("/remove-favorite")
async def mobile_remove_favorite(request: MobileRemoveFavoriteRequest):
    """
    Remove a lake from favorites for mobile app using email instead of JWT.
    """
    from app.services.user_lakes import UserLakeStore

    if request.lake_type not in ("known", "custom"):
        return {"success": False, "error": "lake_type must be 'known' or 'custom'"}

    user_lake_store = UserLakeStore()

    try:
        removed = user_lake_store.remove(request.email, request.lake_id, request.lake_type)
        return {
            "success": removed,
            "removed_id": request.lake_id if removed else None,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# =============================================================================
# MOBILE ADD FAVORITE ENDPOINT
# =============================================================================

class MobileAddFavoriteRequest(BaseModel):
    email: EmailStr
    user_id: str
    lake_id: str
    lake_type: str  # 'known' or 'custom'


@router.post("/add-favorite")
async def mobile_add_favorite(request: MobileAddFavoriteRequest):
    """
    Add a lake to favorites for mobile app using email instead of JWT.
    """
    from app.services.user_lakes import UserLakeStore
    from app.services.custom_lakes import CustomLakeStore

    if request.lake_type not in ("known", "custom"):
        return {"success": False, "error": "lake_type must be 'known' or 'custom'"}

    user_lake_store = UserLakeStore()

    # Verify custom lake exists
    if request.lake_type == "custom":
        custom_lake_store = CustomLakeStore()
        lake = custom_lake_store.get(request.lake_id, request.email)
        if not lake:
            return {"success": False, "error": "Custom lake not found"}

    try:
        added = user_lake_store.add(request.email, request.lake_id, request.lake_type)
        return {
            "success": True,
            "added": added,
            "lake_id": request.lake_id,
            "lake_type": request.lake_type,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


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


class MobileCreateCustomLakeRequest(BaseModel):
    email: EmailStr
    user_id: str
    name: str
    lat: float
    lng: float
    city: Optional[str] = None
    state: Optional[str] = None
    anchors: Optional[list] = None


@router.post("/create-custom-lake")
async def mobile_create_custom_lake(request: MobileCreateCustomLakeRequest):
    """
    Create a custom lake for mobile app using email instead of JWT.
    Mirrors the web /custom-lakes POST endpoint logic.
    """
    from app.services.custom_lakes import CustomLakeStore

    custom_lake_store = CustomLakeStore()
    email = request.email.lower().strip()

    try:
        # If lake has custom boundaries (anchors), skip proximity check
        if request.anchors and len(request.anchors) >= 3:
            existing_lakes = custom_lake_store.list_by_user(email)
            for existing in existing_lakes:
                if existing.name.lower() == request.name.lower():
                    return {
                        "success": True,
                        "lake_id": existing.id,
                        "already_existed": True,
                    }

            lake_id = custom_lake_store.create(
                email=email,
                name=request.name,
                lat=request.lat,
                lng=request.lng,
                city=request.city,
                state=request.state,
                anchors=request.anchors,
            )

            return {"success": True, "lake_id": lake_id}

        # No boundaries - check for nearby existing lake
        existing = custom_lake_store.find_by_proximity(
            email, request.lat, request.lng, radius_km=0.5
        )

        if existing:
            return {
                "success": False,
                "error": "You already have a named water nearby",
                "existing_lake": {
                    "id": existing.id,
                    "name": existing.name,
                    "lat": existing.lat,
                    "lng": existing.lng,
                    "city": existing.city,
                    "state": existing.state,
                },
            }

        lake_id = custom_lake_store.create(
            email=email,
            name=request.name,
            lat=request.lat,
            lng=request.lng,
            city=request.city,
            state=request.state,
            anchors=request.anchors,
        )

        return {"success": True, "lake_id": lake_id}

    except Exception as e:
        print(f"[MobileAuth] Create custom lake failed: {e}")
        return {"success": False, "error": str(e)}


class MobileUpdateLakeGeometryRequest(BaseModel):
    email: EmailStr
    user_id: str
    lake_id: str
    anchors: list
    acres: Optional[int] = None


@router.post("/update-lake-geometry")
async def mobile_update_lake_geometry(request: MobileUpdateLakeGeometryRequest):
    """
    Update custom lake geometry (boundaries) for mobile app.
    Uses email instead of JWT for authentication.
    """
    from app.services.custom_lakes import CustomLakeStore

    custom_lake_store = CustomLakeStore()
    email = request.email.lower().strip()

    try:
        # Verify the lake belongs to this user
        lake = custom_lake_store.get_by_id(request.lake_id, email)
        if not lake:
            return {"success": False, "error": "Lake not found or access denied"}

        # Update the geometry
        custom_lake_store.update_geometry(
            lake_id=request.lake_id,
            email=email,
            anchors=request.anchors,
            acres=request.acres,
        )

        return {"success": True}

    except Exception as e:
        print(f"[MobileAuth] Update lake geometry failed: {e}")
        return {"success": False, "error": str(e)}


# =============================================================================
# MOBILE LAKE RESOLUTION ENDPOINT
# =============================================================================

class MobileResolveLakeRequest(BaseModel):
    email: EmailStr
    user_id: str
    lat: float
    lng: float
    radius_km: float = 1.0


@router.post("/resolve-lake")
async def mobile_resolve_lake(request: MobileResolveLakeRequest):
    """
    Resolve coordinates to a lake (known or custom) for mobile app.
    Uses email instead of JWT for authentication.

    Priority:
    1. Known lakes (from JSON)
    2. User's custom lakes
    3. Unresolved (return coordinates only)
    """
    from app.routes.lakes import find_known_lake_by_proximity
    from app.services.custom_lakes import CustomLakeStore

    custom_lake_store = CustomLakeStore()

    try:
        # 1. Check known lakes first
        known = find_known_lake_by_proximity(request.lat, request.lng, request.radius_km)

        if known:
            return {
                "resolved": True,
                "lake_type": "known",
                "lake_id": known.get("id") or known.get("name"),
                "lake_name": known.get("name"),
                "lat": known.get("lat") or known.get("latitude"),
                "lng": known.get("lng") or known.get("lon") or known.get("longitude"),
                "city": known.get("city"),
                "state": known.get("state"),
            }

        # 2. Check user's custom lakes
        custom = custom_lake_store.find_by_proximity(request.email, request.lat, request.lng, request.radius_km)

        if custom:
            return {
                "resolved": True,
                "lake_type": "custom",
                "lake_id": custom.id,
                "lake_name": custom.name,
                "lat": custom.lat,
                "lng": custom.lng,
                "city": custom.city,
                "state": custom.state,
            }

        # 3. Unresolved
        return {
            "resolved": False,
            "lake_type": "unresolved",
            "lake_id": None,
            "lake_name": None,
            "lat": request.lat,
            "lng": request.lng,
            "city": None,
            "state": None,
        }
    except Exception as e:
        print(f"[MobileAuth] Lake resolution failed: {e}")
        return {
            "resolved": False,
            "lake_type": "unresolved",
            "lake_id": None,
            "lake_name": None,
            "lat": request.lat,
            "lng": request.lng,
            "city": None,
            "state": None,
            "error": str(e),
        }


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
    import os

    WEB_BASE_URL = os.getenv("WEB_BASE_URL", "https://bassclarity.com")
    plan_history_store = PlanHistoryStore()

    try:
        plans = plan_history_store.get_user_plans(
            request.email,
            limit=request.limit,
            offset=request.offset
        )

        # Format response with plan_url like the web endpoint does
        formatted_plans = [
            {
                "id": plan["id"],
                "lake_name": plan["lake_name"],
                "generation_date": plan["generation_date"],
                "plan_type": plan["plan_type"],
                "conditions": plan["conditions"],
                "plan_url": f"{WEB_BASE_URL}/plan?token={plan['plan_link_id']}",
            }
            for plan in plans
        ]

        return {
            "plans": formatted_plans,
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
# MOBILE BILLING CHECKOUT
# =============================================================================

class MobileCheckoutRequest(BaseModel):
    email: EmailStr
    user_id: str


@router.post("/checkout")
async def mobile_checkout(request: MobileCheckoutRequest):
    """
    Create a Stripe checkout session for mobile app users.
    Uses email directly instead of JWT verification.
    """
    from app.services.stripe_billing import create_checkout_session

    try:
        # Verify the user exists in Clerk
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                f"{CLERK_BACKEND_API}/users/{request.user_id}",
                headers=get_clerk_headers(),
            )

            if user_response.status_code != 200:
                return {"success": False, "error": "User not found"}

            user_data = user_response.json()

            # Verify email matches
            email_addresses = user_data.get("email_addresses", [])
            user_emails = [e.get("email_address", "").lower() for e in email_addresses]

            if request.email.lower() not in user_emails:
                return {"success": False, "error": "Email mismatch"}

        # Create Stripe checkout session
        url = create_checkout_session(email=request.email.lower())
        return {"success": True, "url": url}

    except Exception as e:
        print(f"[mobile_auth] checkout error: {e}")
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


# =============================================================================
# MOBILE CREATE CATCH ENDPOINT
# =============================================================================

class MobileCreateCatchRequest(BaseModel):
    email: EmailStr
    user_id: str
    date: str  # YYYY-MM-DD
    species: str
    lat: float
    lng: float
    time: Optional[str] = None  # HH:MM
    weight: Optional[float] = None
    length: Optional[float] = None
    lure: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    lake_id: Optional[str] = None
    lake_type: str = "unresolved"  # 'known', 'custom', 'unresolved'
    lake_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    source: str = "manual"  # 'camera', 'library', 'manual'
    temp: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[str] = None
    pressure: Optional[float] = None
    sky_condition: Optional[str] = None


@router.post("/create-catch")
async def mobile_create_catch(request: MobileCreateCatchRequest):
    """
    Create a catch for mobile app using email instead of JWT.
    """
    from app.services.catches import CatchStore

    catch_store = CatchStore()

    try:
        catch_id = catch_store.create(
            email=request.email,
            date=request.date,
            species=request.species,
            lat=request.lat,
            lng=request.lng,
            time=request.time,
            weight=request.weight,
            length=request.length,
            lure=request.lure,
            color=request.color,
            notes=request.notes,
            photo_url=request.photo_url,
            lake_id=request.lake_id,
            lake_type=request.lake_type,
            lake_name=request.lake_name,
            city=request.city,
            state=request.state,
            source=request.source,
            temp=request.temp,
            wind_speed=request.wind_speed,
            wind_direction=request.wind_direction,
            pressure=request.pressure,
            sky_condition=request.sky_condition,
        )
        return {"success": True, "catch_id": catch_id}
    except Exception as e:
        print(f"[mobile_auth] create catch error: {e}")
        return {"success": False, "error": str(e)}


# =============================================================================
# MOBILE DELETE CATCH ENDPOINT
# =============================================================================

class MobileDeleteCatchRequest(BaseModel):
    email: EmailStr
    user_id: str
    catch_id: str


@router.post("/delete-catch")
async def mobile_delete_catch(request: MobileDeleteCatchRequest):
    """
    Delete a catch for mobile app using email instead of JWT.
    """
    from app.services.catches import CatchStore

    catch_store = CatchStore()

    try:
        deleted = catch_store.delete(request.catch_id, request.email)
        if deleted:
            return {"success": True, "deleted_id": request.catch_id}
        else:
            return {"success": False, "error": "Catch not found or not owned by user"}
    except Exception as e:
        print(f"[mobile_auth] delete catch error: {e}")
        return {"success": False, "error": str(e)}


# =============================================================================
# MOBILE UPDATE CATCH ENDPOINT
# =============================================================================

class MobileUpdateCatchRequest(BaseModel):
    email: EmailStr
    user_id: str
    catch_id: str
    # Catch data fields
    date: str
    time: Optional[str] = None
    species: Optional[str] = None
    weight: Optional[float] = None
    length: Optional[float] = None
    lure: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    lat: float
    lng: float
    lake_id: Optional[str] = None
    lake_type: Optional[str] = None
    lake_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    source: Optional[str] = None
    # Weather fields
    temp: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[str] = None
    pressure: Optional[float] = None
    sky_condition: Optional[str] = None


@router.post("/update-catch")
async def mobile_update_catch(request: MobileUpdateCatchRequest):
    """
    Update a catch for mobile app using email instead of JWT.
    """
    from app.services.catches import CatchStore

    catch_store = CatchStore()

    try:
        # Check if catch exists and belongs to user
        existing = catch_store.get(request.catch_id, request.email)
        if not existing:
            return {"success": False, "error": "Catch not found or not owned by user"}

        # Perform update
        updated_catch = catch_store.update(
            catch_id=request.catch_id,
            email=request.email,
            date=request.date,
            time=request.time,
            species=request.species,
            weight=request.weight,
            length=request.length,
            lure=request.lure,
            color=request.color,
            notes=request.notes,
            photo_url=request.photo_url,
            lat=request.lat,
            lng=request.lng,
            lake_id=request.lake_id,
            lake_type=request.lake_type,
            lake_name=request.lake_name,
            city=request.city,
            state=request.state,
            source=request.source,
            temp=request.temp,
            wind_speed=request.wind_speed,
            wind_direction=request.wind_direction,
            pressure=request.pressure,
            sky_condition=request.sky_condition,
        )

        if not updated_catch:
            return {"success": False, "error": "Failed to update catch"}

        return {"success": True, "catch_id": request.catch_id}
    except Exception as e:
        print(f"[mobile_auth] update catch error: {e}")
        return {"success": False, "error": str(e)}


# =============================================================================
# MOBILE PRESIGNED UPLOAD URL ENDPOINT
# =============================================================================

class MobilePresignedRequest(BaseModel):
    email: EmailStr
    user_id: str
    file_name: str
    content_type: str


@router.post("/presigned")
async def mobile_presigned_url(request: MobilePresignedRequest):
    """
    Get presigned upload URL for mobile app using email instead of JWT.
    """
    from app.services.storage import StorageService

    storage = StorageService()

    try:
        data = storage.generate_presigned_url(request.file_name, request.content_type)
        if not data:
            return {"success": False, "error": "Failed to generate upload URL"}
        return {"success": True, **data}
    except Exception as e:
        print(f"[mobile_auth] presigned url error: {e}")
        return {"success": False, "error": str(e)}
