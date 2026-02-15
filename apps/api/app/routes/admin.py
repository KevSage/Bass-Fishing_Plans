# apps/api/app/routes/admin.py
"""
Admin routes for managing subscribers.
Protected by simple password authentication.
"""
from __future__ import annotations

import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr

from app.services.subscribers import SubscriberStore

router = APIRouter(prefix="/admin", tags=["admin"])

# Admin password - set via environment variable or use default
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "bass2025")

def verify_admin(password: str = Header(..., alias="X-Admin-Password")):
    """Verify admin password from header."""
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password")


# =============================================================================
# MODELS
# =============================================================================

class SubscriberResponse(BaseModel):
    email: str
    active: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    has_stripe: bool = False
    has_apple: bool = False


class ToggleRequest(BaseModel):
    email: str
    active: bool


class AddSubscriberRequest(BaseModel):
    email: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    active: bool = True


# =============================================================================
# ROUTES
# =============================================================================

@router.get("/subscribers")
def list_subscribers(
    password: str = Header(..., alias="X-Admin-Password"),
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
):
    """List all subscribers with optional search."""
    verify_admin(password)

    store = SubscriberStore()
    subscribers = store.list_all(limit=limit, offset=offset, search=search)

    return {
        "subscribers": [
            SubscriberResponse(
                email=s.email,
                active=s.active,
                first_name=s.first_name,
                last_name=s.last_name,
                has_stripe=bool(s.stripe_customer_id),
                has_apple=bool(s.apple_user_id),
            )
            for s in subscribers
        ],
        "count": len(subscribers),
    }


@router.post("/subscribers/toggle")
def toggle_subscriber(
    request: ToggleRequest,
    password: str = Header(..., alias="X-Admin-Password"),
):
    """Toggle a subscriber's active status."""
    verify_admin(password)

    store = SubscriberStore()
    success = store.set_active(request.email, request.active)

    if not success:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    return {
        "success": True,
        "email": request.email,
        "active": request.active,
    }


@router.post("/subscribers/add")
def add_subscriber(
    request: AddSubscriberRequest,
    password: str = Header(..., alias="X-Admin-Password"),
):
    """Manually add a subscriber."""
    verify_admin(password)

    store = SubscriberStore()
    store.add_manual(
        email=request.email,
        first_name=request.first_name or "",
        last_name=request.last_name or "",
        active=request.active,
    )

    return {
        "success": True,
        "email": request.email,
        "active": request.active,
    }
