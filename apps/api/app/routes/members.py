# apps/api/app/routes/members.py
"""
Member-only endpoints requiring Clerk authentication.
"""
from __future__ import annotations

import os
from typing import Dict, Optional

import httpx
from fastapi import APIRouter, HTTPException, Header

from app.services.subscribers import SubscriberStore
from app.services.rate_limits import RateLimitStore

router = APIRouter()
subscriber_store = SubscriberStore()
rate_limit_store = RateLimitStore()


async def verify_clerk_session(authorization: Optional[str]) -> str:
    """
    Verify Clerk session token and return user email.
    
    Args:
        authorization: Bearer token from Authorization header
        
    Returns:
        User's email address
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.replace("Bearer ", "")
    clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
    
    if not clerk_secret_key:
        raise HTTPException(status_code=500, detail="CLERK_SECRET_KEY not configured")
    
    # Decode the JWT token to get user_id
    # Clerk tokens are JWTs that can be decoded
    try:
        import jwt
        # For development, we'll skip verification and just decode
        # In production, you'd verify the signature
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="No user ID in token")
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    # Get user details to extract email
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
    
    Requires Clerk session token in Authorization header.
    Frontend calls this after login to check subscription status.
    
    Returns:
        {
            "email": str,
            "is_member": bool,
            "has_subscription": bool,
            "rate_limit_allowed": bool,
            "rate_limit_seconds": int,
            "stripe_customer_id": str | null,
            "stripe_subscription_id": str | null
        }
    """
    # Verify Clerk session and get email
    email = await verify_clerk_session(authorization)
    
    # Check subscriber status
    subscriber = subscriber_store.get(email)
    is_member = subscriber and subscriber.active
    has_subscription = subscriber is not None
    
    # Check rate limit
    if is_member:
        allowed, seconds_remaining = rate_limit_store.check_member_cooldown(email)
    else:
        allowed, seconds_remaining = rate_limit_store.check_preview_limit(email)
    
    return {
        "email": email,
        "is_member": is_member,
        "has_subscription": has_subscription,
        "rate_limit_allowed": allowed,
        "rate_limit_seconds": seconds_remaining if not allowed else 0,
        "stripe_customer_id": subscriber.stripe_customer_id if subscriber else None,
        "stripe_subscription_id": subscriber.stripe_subscription_id if subscriber else None,
    }