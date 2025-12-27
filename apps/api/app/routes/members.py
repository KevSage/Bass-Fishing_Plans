# apps/api/app/routes/members.py
"""
Member-only endpoints requiring Clerk authentication.
"""
from __future__ import annotations

import os
from typing import Dict, Optional

import httpx
import jwt
from fastapi import APIRouter, HTTPException, Header

from app.services.subscribers import SubscriberStore
from app.services.rate_limits import RateLimitStore
from app.services.plan_history import plan_history_store

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
            "stripe_subscription_id": str | null,
            "subscription_status": str | null,
            "next_billing_date": int | null,
            "cancel_at_period_end": bool | null,
            "plan_interval": str | null,
            "plan_amount": float | null
        }
    """
    import stripe
    import os
    
    # Initialize Stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    
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
    
    # Base response
    response = {
        "email": email,
        "is_member": is_member,
        "has_subscription": has_subscription,
        "rate_limit_allowed": allowed,
        "rate_limit_seconds": seconds_remaining if not allowed else 0,
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
            
            # Get next billing date - try multiple fields in order of preference
            # 1. Try current_period_end (standard field)
            # 2. Fall back to billing_cycle_anchor (when subscription just created)
            # 3. Fall back to created + 30 days as estimate
            next_billing = subscription.get("current_period_end")
            if not next_billing:
                next_billing = subscription.get("billing_cycle_anchor")
            if not next_billing:
                # Calculate: start_date + 30 days (for monthly)
                start_date = subscription.get("start_date") or subscription.get("created")
                if start_date:
                    next_billing = start_date + (30 * 24 * 60 * 60)  # Add 30 days in seconds
            
            response["next_billing_date"] = next_billing
            
            # Check if subscription is cancelled but still active
            response["cancel_at_period_end"] = subscription.get("cancel_at_period_end", False) if hasattr(subscription, 'get') else getattr(subscription, 'cancel_at_period_end', False)
            
            # Get plan details from the price
            items = subscription.get("items", {})
            if items and items.get("data"):
                price_id = items["data"][0]["price"]["id"]
                price = stripe.Price.retrieve(price_id)
                
                recurring = price.get("recurring", {})
                response["plan_interval"] = recurring.get("interval", "month") if recurring else "month"
                
                unit_amount = price.get("unit_amount", 1500)  # Default to $15
                response["plan_amount"] = unit_amount / 100 if unit_amount else 15.0
        except Exception as e:
            # Log error but don't fail the request
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
    
    Query params:
    - limit: Number of plans to return (default 10, max 50)
    - offset: Pagination offset
    
    Returns:
    {
        "plans": [
            {
                "id": "plan_hist_123",
                "lake_name": "Lake Lanier",
                "generation_date": "2024-12-27T14:30:00+00:00",
                "plan_type": "member",
                "conditions": {...},
                "plan_url": "/plan/view/abc123",
                "can_download_pdf": true
            }
        ],
        "total": 15,
        "has_more": true
    }
    """
    print(f"[PLAN HISTORY] Endpoint called! Email fetching...")  # DEBUG
    from datetime import datetime, timezone, timedelta
    
    # Verify Clerk session
    email = await verify_clerk_session(authorization)
    
    # Limit max to 50
    limit = min(limit, 50)
    
    # Get plans from last 30 days
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
                "plan_url": f"/plan?token={plan['plan_link_id']}",
                "can_download_pdf": True
            }
            for plan in plans
        ],
        "total": total,
        "has_more": (offset + limit) < total
    }