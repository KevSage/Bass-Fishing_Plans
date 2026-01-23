# apps/api/app/routes/lakes.py
"""
User lakes endpoints (custom lakes and favorites).
"""
from __future__ import annotations

import json
import os
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from app.routes.members import verify_clerk_session
from app.services.custom_lakes import CustomLakeStore
from app.services.user_lakes import UserLakeStore

router = APIRouter()
custom_lake_store = CustomLakeStore()
user_lake_store = UserLakeStore()


# =============================================================================
# KNOWN LAKES LOADER
# =============================================================================

_known_lakes_cache: Optional[List[Dict]] = None

def get_known_lakes() -> List[Dict]:
    """Load known lakes from JSON file (cached)."""
    global _known_lakes_cache
    
    if _known_lakes_cache is not None:
        return _known_lakes_cache
    
    # Adjust path based on your project structure
    lakes_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "data",
        "lakes.json"
    )
    
    # Fallback paths to try
    fallback_paths = [
        lakes_path,
        os.path.join(os.getcwd(), "data", "lakes.json"),
        os.path.join(os.getcwd(), "lakes.json"),
    ]
    
    for path in fallback_paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                _known_lakes_cache = json.load(f)
                print(f"[Lakes] Loaded {len(_known_lakes_cache)} known lakes from {path}")
                return _known_lakes_cache
    
    print("[Lakes] WARNING: lakes.json not found, using empty list")
    _known_lakes_cache = []
    return _known_lakes_cache


def find_known_lake_by_proximity(lat: float, lng: float, radius_km: float = 1.0) -> Optional[Dict]:
    """Find a known lake within radius of coordinates."""
    from math import radians, cos, sin, asin, sqrt
    
    def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        return 2 * 6371 * asin(sqrt(a))
    
    lakes = get_known_lakes()
    
    for lake in lakes:
        lake_lat = lake.get("lat") or lake.get("latitude")
        lake_lng = lake.get("lng") or lake.get("lon") or lake.get("longitude")
        
        if lake_lat is None or lake_lng is None:
            continue
        
        dist = haversine(lat, lng, float(lake_lat), float(lake_lng))
        if dist <= radius_km:
            return lake
    
    return None


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class CreateCustomLakeRequest(BaseModel):
    name: str
    lat: float
    lng: float
    city: Optional[str] = None
    state: Optional[str] = None
    anchors: Optional[List[Dict[str, float]]] = None


class RenameCustomLakeRequest(BaseModel):
    name: str


class CustomLakeResponse(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    city: Optional[str]
    state: Optional[str]
    anchors: Optional[List[Dict[str, float]]] = None
    catch_count: int
    created_at: str


class AddFavoriteRequest(BaseModel):
    lake_id: str
    lake_type: str  # 'known' or 'custom'


class ResolveLakeRequest(BaseModel):
    lat: float
    lng: float
    radius_km: float = 1.0


# =============================================================================
# CUSTOM LAKE ENDPOINTS
# =============================================================================

@router.post("/custom-lakes")
async def create_custom_lake(
    request: CreateCustomLakeRequest,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Create a new custom lake (user-named water).
    """
    email = await verify_clerk_session(authorization)
    
    # Check if user already has a custom lake at these coordinates
    existing = custom_lake_store.find_by_proximity(
        email, request.lat, request.lng, radius_km=0.5
    )
    
    if existing:
        return {
            "success": False,
            "error": "You already have a named water nearby",
            "existing_lake": CustomLakeResponse(
                id=existing.id,
                name=existing.name,
                lat=existing.lat,
                lng=existing.lng,
                city=existing.city,
                state=existing.state,
                anchors=getattr(existing, 'anchors', None),
                catch_count=existing.catch_count,
                created_at=existing.created_at,
            ).model_dump()
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
    
    return {
        "success": True,
        "lake_id": lake_id,
    }


@router.get("/custom-lakes")
async def list_custom_lakes(
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    List all custom lakes for the authenticated user.
    """
    email = await verify_clerk_session(authorization)
    
    lakes = custom_lake_store.list_by_user(email)
    
    return {
        "lakes": [
            CustomLakeResponse(
                id=lake.id,
                name=lake.name,
                lat=lake.lat,
                lng=lake.lng,
                city=lake.city,
                state=lake.state,
                anchors=getattr(lake, 'anchors', None),
                catch_count=lake.catch_count,
                created_at=lake.created_at,
            ).model_dump()
            for lake in lakes
        ],
        "total": len(lakes),
    }


@router.get("/custom-lakes/{lake_id}")
async def get_custom_lake(
    lake_id: str,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Get a single custom lake by ID.
    """
    email = await verify_clerk_session(authorization)
    
    lake = custom_lake_store.get(lake_id, email)
    
    if not lake:
        raise HTTPException(status_code=404, detail="Custom lake not found")
    
    return {
        "lake": CustomLakeResponse(
            id=lake.id,
            name=lake.name,
            lat=lake.lat,
            lng=lake.lng,
            city=lake.city,
            state=lake.state,
            catch_count=lake.catch_count,
            created_at=lake.created_at,
        ).model_dump()
    }


@router.put("/custom-lakes/{lake_id}")
async def rename_custom_lake(
    lake_id: str,
    request: RenameCustomLakeRequest,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Rename a custom lake.
    """
    email = await verify_clerk_session(authorization)
    
    updated = custom_lake_store.rename(lake_id, email, request.name)
    
    if not updated:
        raise HTTPException(status_code=404, detail="Custom lake not found")
    
    return {
        "success": True,
        "lake_id": lake_id,
        "new_name": request.name,
    }


@router.delete("/custom-lakes/{lake_id}")
async def delete_custom_lake(
    lake_id: str,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Delete a custom lake. Only allowed if no catches reference it.
    """
    email = await verify_clerk_session(authorization)
    
    # Check if lake exists first
    lake = custom_lake_store.get(lake_id, email)
    
    if not lake:
        raise HTTPException(status_code=404, detail="Custom lake not found")
    
    if lake.catch_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete lake with {lake.catch_count} catches. Delete catches first."
        )
    
    deleted = custom_lake_store.delete(lake_id, email)
    
    return {
        "success": deleted,
        "deleted_id": lake_id if deleted else None,
    }


# =============================================================================
# FAVORITE LAKE ENDPOINTS
# =============================================================================

@router.post("/favorites")
async def add_favorite(
    request: AddFavoriteRequest,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Add a lake to user's favorites (plan rotation).
    """
    email = await verify_clerk_session(authorization)
    
    if request.lake_type not in ("known", "custom"):
        raise HTTPException(status_code=400, detail="lake_type must be 'known' or 'custom'")
    
    # Verify lake exists
    if request.lake_type == "custom":
        lake = custom_lake_store.get(request.lake_id, email)
        if not lake:
            raise HTTPException(status_code=404, detail="Custom lake not found")
    else:
        # For known lakes, verify it exists in the JSON
        lakes = get_known_lakes()
        lake_exists = any(
            l.get("id") == request.lake_id or l.get("name") == request.lake_id
            for l in lakes
        )
        if not lake_exists:
            raise HTTPException(status_code=404, detail="Known lake not found")
    
    added = user_lake_store.add(email, request.lake_id, request.lake_type)
    
    return {
        "success": True,
        "added": added,
        "lake_id": request.lake_id,
        "lake_type": request.lake_type,
    }


@router.delete("/favorites/{lake_id}")
async def remove_favorite(
    lake_id: str,
    lake_type: str = "known",
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Remove a lake from user's favorites.
    """
    email = await verify_clerk_session(authorization)
    
    if lake_type not in ("known", "custom"):
        raise HTTPException(status_code=400, detail="lake_type must be 'known' or 'custom'")
    
    removed = user_lake_store.remove(email, lake_id, lake_type)
    
    return {
        "success": removed,
        "removed_id": lake_id if removed else None,
    }


@router.get("/favorites")
async def list_favorites(
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    List all favorite lakes for the authenticated user.
    Returns both the favorite records and hydrated lake data.
    """
    email = await verify_clerk_session(authorization)
    
    favorites = user_lake_store.list_by_user(email)
    known_lakes = get_known_lakes()
    
    hydrated = []
    
    for fav in favorites:
        if fav.lake_type == "known":
            # Find in known lakes
            lake_data = next(
                (l for l in known_lakes if l.get("id") == fav.lake_id or l.get("name") == fav.lake_id),
                None
            )
            if lake_data:
                hydrated.append({
                    "lake_id": fav.lake_id,
                    "lake_type": "known",
                    "name": lake_data.get("name"),
                    "lat": lake_data.get("lat") or lake_data.get("latitude"),
                    "lng": lake_data.get("lng") or lake_data.get("lon") or lake_data.get("longitude"),
                    "city": lake_data.get("city"),
                    "state": lake_data.get("state"),
                    "added_at": fav.added_at,
                })
        else:
            # Custom lake
            lake = custom_lake_store.get(fav.lake_id, email)
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


# =============================================================================
# LAKE RESOLUTION ENDPOINT
# =============================================================================

@router.post("/lakes/resolve")
async def resolve_lake(
    request: ResolveLakeRequest,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Resolve coordinates to a lake (known or custom).
    Used when logging a catch to auto-detect lake.
    
    Priority:
    1. Known lakes (from JSON)
    2. User's custom lakes
    3. Unresolved (return coordinates only)
    """
    email = await verify_clerk_session(authorization)
    
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
    custom = custom_lake_store.find_by_proximity(email, request.lat, request.lng, request.radius_km)
    
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