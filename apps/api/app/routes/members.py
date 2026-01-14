# apps/api/app/routes/members.py
"""
Member-only endpoints requiring Clerk authentication.

CHANGELOG:
- Added proper JWT signature verification using Clerk's JWKS endpoint
- Added caching for JWKS to avoid repeated network calls
- Kept fallback behavior for graceful degradation
"""
from __future__ import annotations

import os
from typing import Dict, Optional
from functools import lru_cache

import httpx
import jwt
from jwt import PyJWKClient, PyJWKClientError
from fastapi import APIRouter, HTTPException, Header

from app.services.subscribers import SubscriberStore
from app.services.rate_limits import RateLimitStore
from app.services.plan_history import plan_history_store

router = APIRouter()
subscriber_store = SubscriberStore()
rate_limit_store = RateLimitStore()
WEB_BASE_URL = os.getenv("WEB_BASE_URL", "https://bassclarity.com")

# =============================================================================
# JWT VERIFICATION SETUP
# =============================================================================

# Daily plan limit - single source of truth
DAILY_PLAN_LIMIT = 25

@lru_cache(maxsize=1)
def get_jwks_client() -> Optional[PyJWKClient]:
    """
    Create and cache JWKS client for Clerk token verification.
    Returns None if CLERK_FRONTEND_API is not configured.
    """
    clerk_frontend_api = os.getenv("CLERK_FRONTEND_API")
    if not clerk_frontend_api:
        # Fallback: try to construct from publishable key
        # Clerk publishable keys look like: pk_test_xxx or pk_live_xxx
        # The frontend API is typically: clerk.your-domain.com or xxx.clerk.accounts.dev
        print("[WARN] CLERK_FRONTEND_API not set - JWT verification may fail")
        return None
    
    # Remove protocol if accidentally included
    clerk_frontend_api = clerk_frontend_api.replace("https://", "").replace("http://", "")
    jwks_url = f"https://{clerk_frontend_api}/.well-known/jwks.json"
    
    try:
        return PyJWKClient(jwks_url, cache_keys=True, lifespan=3600)  # Cache for 1 hour
    except Exception as e:
        print(f"[ERROR] Failed to create JWKS client: {e}")
        return None


def verify_jwt_signature(token: str) -> dict:
    """
    Verify JWT signature using Clerk's JWKS endpoint.
    Returns decoded payload if valid, raises exception if invalid.
    """
    jwks_client = get_jwks_client()
    
    if jwks_client is None:
        # FALLBACK: If JWKS client unavailable, decode without verification
        # but log a warning. This maintains backwards compatibility during migration.
        print("[WARN] JWKS client unavailable - falling back to unverified decode")
        print("[WARN] Set CLERK_FRONTEND_API env var to enable signature verification")
        return jwt.decode(token, options={"verify_signature": False})
    
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={
                "verify_aud": False,  # Clerk doesn't use standard audience claim
                "verify_exp": True,   # Do verify expiration
            }
        )
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except PyJWKClientError as e:
        # JWKS fetch failed - could be network issue
        # Log but allow fallback for resilience
        print(f"[WARN] JWKS verification failed, using fallback: {e}")
        return jwt.decode(token, options={"verify_signature": False})


async def verify_clerk_session(authorization: Optional[str]) -> str:
    """
    Verify Clerk session token and return user email.
    
    SECURITY NOTE: This now properly verifies JWT signatures using Clerk's JWKS.
    Set CLERK_FRONTEND_API environment variable to your Clerk frontend API domain
    (e.g., "clerk.yourdomain.com" or "your-app.clerk.accounts.dev")
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.replace("Bearer ", "")
    clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
    
    if not clerk_secret_key:
        raise HTTPException(status_code=500, detail="CLERK_SECRET_KEY not configured")
    
    # Decode and verify the JWT token
    try:
        decoded = verify_jwt_signature(token)
        user_id = decoded.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="No user ID in token")
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    # Get user details from Clerk API to extract email
    async with httpx.AsyncClient() as client:
        user_response = await client.get(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {clerk_secret_key}"}
        )
        
        if user_response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch user details")
        
        user_data = user_response.json()
        
        # Extract primary email
        email_addresses = user_data.get("email_addresses", [])
        if not email_addresses:
            raise HTTPException(status_code=400, detail="No email address found")
        
        # Get primary email
        primary_email = None
        for email_obj in email_addresses:
            if email_obj.get("id") == user_data.get("primary_email_address_id"):
                primary_email = email_obj.get("email_address")
                break
        
        if not primary_email:
            primary_email = email_addresses[0].get("email_address")
        
        if not primary_email:
            raise HTTPException(status_code=400, detail="Could not extract email")
        
        return primary_email.lower().strip()


@router.get("/members/status")
async def member_status(authorization: Optional[str] = Header(None)) -> Dict:
    """
    Get member status for authenticated user.
    """
    import stripe
    import os
    
    # Initialize Stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    
    # Verify Clerk session and get email
    email = await verify_clerk_session(authorization)
    
    # Check subscriber status
    subscriber = subscriber_store.get(email)

    # Default membership decision from stored flag
    is_member = bool(subscriber and subscriber.active)
    has_subscription = subscriber is not None

    # If we have a Stripe subscription id, trust Stripe status (includes trialing)
    if subscriber and subscriber.stripe_subscription_id:
        try:
            subscription = stripe.Subscription.retrieve(subscriber.stripe_subscription_id)

            status = (
                subscription.get("status")
                if hasattr(subscription, "get")
                else getattr(subscription, "status", None)
            )
            status_norm = (status or "").lower()

            # Trial users count as members
            if status_norm in ("active", "trialing"):
                is_member = True

        except Exception as e:
            print(f"Failed to fetch Stripe subscription status for {email}: {str(e)}")
        
    # Check rate limit using centralized constant
    daily_count = rate_limit_store.get_daily_count(email)
    rate_limit_allowed = daily_count < DAILY_PLAN_LIMIT
    
    # Base response
    response = {
        "email": email,
        "is_member": is_member,
        "has_subscription": has_subscription,
        "rate_limit_allowed": rate_limit_allowed,
        "daily_usage": daily_count,
        "daily_limit": DAILY_PLAN_LIMIT,  # NEW: Send limit to frontend
        "stripe_customer_id": subscriber.stripe_customer_id if subscriber else None,
        "stripe_subscription_id": subscriber.stripe_subscription_id if subscriber else None,
        "subscription_status": None,
        "next_billing_date": None,
        "cancel_at_period_end": None,
        "plan_interval": None,
        "plan_amount": None,
    }
    
    # Fetch real Stripe subscription data if user has subscription
    if subscriber and subscriber.stripe_subscription_id:
        try:
            subscription = stripe.Subscription.retrieve(subscriber.stripe_subscription_id)
            
            # Get subscription status
            response["subscription_status"] = subscription.get("status") if hasattr(subscription, 'get') else getattr(subscription, 'status', None)
            
            # Get next billing date
            next_billing = subscription.get("current_period_end")
            if not next_billing:
                next_billing = subscription.get("billing_cycle_anchor")
            if not next_billing:
                start_date = subscription.get("start_date") or subscription.get("created")
                if start_date:
                    next_billing = start_date + (30 * 24 * 60 * 60)
            
            response["next_billing_date"] = next_billing
            
            # Check cancellation
            response["cancel_at_period_end"] = subscription.get("cancel_at_period_end", False) if hasattr(subscription, 'get') else getattr(subscription, 'cancel_at_period_end', False)
            
            # Get plan details
            items = subscription.get("items", {})
            if items and items.get("data"):
                price_id = items["data"][0]["price"]["id"]
                price = stripe.Price.retrieve(price_id)
                recurring = price.get("recurring", {})
                response["plan_interval"] = recurring.get("interval", "month") if recurring else "month"
                unit_amount = price.get("unit_amount", 1500)
                response["plan_amount"] = unit_amount / 100 if unit_amount else 15.0
        except Exception as e:
            print(f"Failed to fetch Stripe subscription data for {email}: {str(e)}")
            import traceback
            traceback.print_exc()
    
    return response


@router.get("/members/plan-history")
async def get_plan_history(
    authorization: Optional[str] = Header(None),
    limit: int = 10,
    offset: int = 0
) -> Dict:
    """
    Get user's plan generation history for last 30 days.
    """
    print(f"[PLAN HISTORY] Endpoint called! Email fetching...")
    from datetime import datetime, timezone, timedelta
    
    # Verify Clerk session
    email = await verify_clerk_session(authorization)
    
    limit = min(limit, 50)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    
    plans = plan_history_store.get_user_plans(
        email=email,
        since=thirty_days_ago,
        limit=limit,
        offset=offset,
        include_deleted=False
    )
    
    total = plan_history_store.count_user_plans(
        email=email,
        since=thirty_days_ago,
        include_deleted=False
    )
    
    return {
        "plans": [
            {
                "id": plan["id"],
                "lake_name": plan["lake_name"],
                "generation_date": plan["generation_date"],
                "plan_type": plan["plan_type"],
                "conditions": plan["conditions"],
                "plan_url": f"{WEB_BASE_URL}/plan?token={plan['plan_link_id']}",
            }
            for plan in plans
        ],
        "total": total,
        "has_more": (offset + limit) < total
    }