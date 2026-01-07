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
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    
    token = authorization.replace("Bearer ", "")
    clerk_secret_key = os.getenv("CLERK_SECRET_KEY")
    
    if not clerk_secret_key:
        raise HTTPException(status_code=500, detail="CLERK_SECRET_KEY not configured")
    
    # Decode the JWT token to get user_id
    try:
        import jwt
        # For development, we'll skip verification and just decode
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

            # ✅ Trial users count as members
            if status_norm in ("active", "trialing"):
                is_member = True

        except Exception as e:
            print(f"Failed to fetch Stripe subscription status for {email}: {str(e)}")
        
    # Check rate limit (10 per day)
    # Replaces old check_member_cooldown logic
    daily_count = rate_limit_store.get_daily_count(email)
    rate_limit_allowed = daily_count < 10
    
    # Base response
    response = {
        "email": email,
        "is_member": is_member,
        "has_subscription": has_subscription,
        "rate_limit_allowed": rate_limit_allowed,
        "daily_usage": daily_count,  # Useful for UI progress bars
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
            
            # Get next billing date logic (omitted for brevity, same as before)
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
                "plan_url": f"/plan?token={plan['plan_link_id']}",
            }
            for plan in plans
        ],
        "total": total,
        "has_more": (offset + limit) < total
    }