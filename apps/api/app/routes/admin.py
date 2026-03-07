# apps/api/app/routes/admin.py
"""
Admin routes for managing subscribers.
Protected by simple password authentication.
"""
from __future__ import annotations

import os
import json
from pathlib import Path
from typing import Optional, List, Any
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
    """Toggle a subscriber's active status.

    Uses set_active_manual which sets entitlement_source='manual',
    making admin actions authoritative over Apple/web entitlements.
    """
    verify_admin(password)

    store = SubscriberStore()
    success = store.set_active_manual(request.email, request.active)

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


# =============================================================================
# LAKES MANAGEMENT
# =============================================================================

class SaveLakesRequest(BaseModel):
    lakes: List[Any]


@router.post("/lakes/save")
def save_lakes(
    request: SaveLakesRequest,
    password: str = Header(..., alias="X-Admin-Password"),
):
    """
    Save lakes.json to the backend data directory.

    This updates the lakes served by GET /lakes/known endpoint.
    The frontend caches this data locally for offline use.
    """
    verify_admin(password)

    # Import here to avoid circular imports
    from app.routes.lakes import get_lakes_path, invalidate_lakes_cache

    lakes_path = Path(get_lakes_path())

    # Ensure data directory exists
    lakes_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(lakes_path, "w") as f:
            json.dump(request.lakes, f, indent=2)

        # Invalidate cache so next request gets fresh data
        invalidate_lakes_cache()

        return {
            "success": True,
            "count": len(request.lakes),
            "path": str(lakes_path),
            "message": "Lakes saved. Frontend will sync on next load.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save lakes: {str(e)}")
