# apps/api/app/routes/clerk_webhooks.py
"""
Clerk webhook handler.
Syncs Clerk user events to your subscriber database.

Webhook events:
- user.created: User signs up
- user.updated: User changes email
- user.deleted: User deletes account
"""
from __future__ import annotations

import json
import os
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Request
from svix.webhooks import Webhook, WebhookVerificationError

from app.services.subscribers import SubscriberStore

router = APIRouter()
subscriber_store = SubscriberStore()


@router.post("/webhooks/clerk")
async def clerk_webhook(request: Request) -> Dict[str, str]:
    """
    Handle Clerk user lifecycle events.
    
    Setup in Clerk Dashboard:
    1. Go to Webhooks
    2. Add endpoint: https://yourdomain.com/webhooks/clerk
    3. Subscribe to: user.created, user.updated, user.deleted
    4. Copy signing secret to CLERK_WEBHOOK_SECRET env var
    """
    # Get webhook signing secret
    webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
    if not webhook_secret:
        raise HTTPException(
            status_code=500,
            detail="CLERK_WEBHOOK_SECRET not configured"
        )
    
    # Get Svix headers for verification
    svix_id = request.headers.get("svix-id")
    svix_timestamp = request.headers.get("svix-timestamp")
    svix_signature = request.headers.get("svix-signature")
    
    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(
            status_code=400,
            detail="Missing Svix headers"
        )
    
    # Get raw body
    payload = await request.body()
    
    # Verify webhook signature
    try:
        wh = Webhook(webhook_secret)
        event = wh.verify(payload, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        })
    except WebhookVerificationError as e:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {str(e)}")
    
    # Parse event
    event_type = event.get("type")
    user_data = event.get("data", {})
    
    # Extract email (Clerk provides email_addresses array)
    email_addresses = user_data.get("email_addresses", [])
    if not email_addresses:
        return {"status": "ignored", "reason": "no_email"}
    
    # Get primary email
    primary_email = None
    for email_obj in email_addresses:
        if email_obj.get("id") == user_data.get("primary_email_address_id"):
            primary_email = email_obj.get("email_address")
            break
    
    if not primary_email:
        # Fallback to first email
        primary_email = email_addresses[0].get("email_address")
    
    if not primary_email:
        return {"status": "ignored", "reason": "no_valid_email"}
    
    # Handle different event types
    if event_type == "user.created":
        # User signed up - create subscriber record (inactive until they pay)
        existing = subscriber_store.get(primary_email)
        
        if not existing:
            # New user, create inactive subscriber
            subscriber_store.upsert_active(
                primary_email,
                active=False,
                stripe_customer_id=None,
                stripe_subscription_id=None
            )
            print(f"Created subscriber record for new user: {primary_email}")
        else:
            # User already exists (maybe from preview flow)
            print(f"User signed up but subscriber record already exists: {primary_email}")
        
        return {"status": "processed", "action": "user_created"}
    
    elif event_type == "user.updated":
        # User updated their profile (possibly changed email)
        # For now, we don't need to do anything special
        return {"status": "processed", "action": "user_updated"}
    
    elif event_type == "user.deleted":
        # User deleted their account
        # You may want to mark them as inactive or keep the record for analytics
        subscriber_store.upsert_active(primary_email, active=False)
        print(f"Deactivated subscriber due to account deletion: {primary_email}")
        return {"status": "processed", "action": "user_deleted"}
    
    else:
        # Unknown event type
        return {"status": "ignored", "reason": f"unknown_event_type: {event_type}"}