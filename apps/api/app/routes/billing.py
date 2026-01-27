# apps/api/app/routes/billing.py
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
import os

# Import your existing service logic
from app.services.stripe_billing import create_checkout_session

# Reuse the auth logic from members.py
from app.routes.members import verify_clerk_session 

router = APIRouter()

@router.post("/billing/checkout")
async def start_checkout(authorization: Optional[str] = Header(None)):
    """
    Creates a Stripe Checkout session for the logged-in user.
    """
    # 1. Verify User (Auth First)
    # verify_clerk_session returns the EMAIL string if valid, or raises HTTPException
    user_email = await verify_clerk_session(authorization)
    
    if not user_email:
        # This shouldn't be reached due to verify_clerk_session raising, but for safety:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        # 2. Create Session
        # We pass the verified email to Stripe. Your stripe_billing.py logic 
        # puts this email into 'metadata' and 'client_reference_id', 
        # which ensures your webhook works perfectly.
        url = create_checkout_session(email=user_email)
        return {"url": url}
    except Exception as e:
        print(f"Checkout Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")