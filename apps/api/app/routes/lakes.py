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
from app.services.subscribers import SubscriberStore

router = APIRouter()
custom_lake_store = CustomLakeStore()
user_lake_store = UserLakeStore()


# =============================================================================
# KNOWN LAKES LOADER
# =============================================================================

_known_lakes_cache: Optional[List[Dict]] = None
_known_lakes_version: Optional[str] = None

def get_lakes_path() -> str:
    """Get the path to lakes.json."""
    return os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "data",
        "lakes.json"
    )

def invalidate_lakes_cache():
    """Clear the lakes cache (call after admin updates)."""
    global _known_lakes_cache, _known_lakes_version
    _known_lakes_cache = None
    _known_lakes_version = None
    print("[Lakes] Cache invalidated")

def get_known_lakes() -> List[Dict]:
    """Load known lakes from JSON file (cached)."""
    global _known_lakes_cache

    if _known_lakes_cache is not None:
        return _known_lakes_cache

    lakes_path = get_lakes_path()

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

def get_lakes_version() -> str:
    """Get version hash of lakes data."""
    global _known_lakes_version
    import hashlib

    if _known_lakes_version is not None:
        return _known_lakes_version

    lakes = get_known_lakes()
    content = json.dumps(lakes, sort_keys=True)
    _known_lakes_version = hashlib.md5(content.encode()).hexdigest()[:12]
    return _known_lakes_version


def find_known_lake_by_proximity(lat: float, lng: float, radius_km: float = 1.0) -> Optional[Dict]:
    """
    Find a known lake near coordinates.

    Matching priority:
    1. Inside bbox (with buffer for bank anglers)
    2. Within radius_km of lake center

    Bank angler buffer: ~0.5km added to bbox to catch anglers on shore.
    """
    from math import radians, cos, sin, asin, sqrt

    # Buffer in degrees (~0.5km) for bank anglers outside bbox
    BANK_BUFFER_DEG = 0.005

    def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        return 2 * 6371 * asin(sqrt(a))

    def point_in_bbox_with_buffer(lat: float, lng: float, bbox: list) -> bool:
        """Check if point is inside bbox with bank angler buffer."""
        if not bbox or len(bbox) != 4:
            return False
        min_lng, min_lat, max_lng, max_lat = bbox
        return (
            (min_lat - BANK_BUFFER_DEG) <= lat <= (max_lat + BANK_BUFFER_DEG) and
            (min_lng - BANK_BUFFER_DEG) <= lng <= (max_lng + BANK_BUFFER_DEG)
        )

    lakes = get_known_lakes()

    # First pass: check bbox matches (most accurate for large/irregular lakes)
    for lake in lakes:
        bbox = lake.get("bbox")
        if bbox and point_in_bbox_with_buffer(lat, lng, bbox):
            return lake

    # Second pass: center-point distance for lakes without bbox or edge cases
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

# --- NEW MODEL FOR GEOMETRY ---
class UpdateGeometryRequest(BaseModel):
    anchors: List[Dict[str, float]]
    acres: Optional[int] = None  # Add this
    
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
    
    # If lake has custom boundaries (anchors), skip proximity check entirely
    # The boundaries define the lake's identity - no need for fuzzy matching
    if request.anchors and len(request.anchors) >= 3:
        # Check if this exact lake already exists (by name or ID)
        existing_lakes = custom_lake_store.list_by_user(email)
        for existing in existing_lakes:
            # Check if it's the same lake by name
            if existing.name.lower() == request.name.lower():
                # Lake exists - return its ID instead of creating duplicate
                return {
                    "success": True,
                    "lake_id": existing.id,
                    "already_existed": True,
                }
        
        # No match found - create directly without proximity check
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
    
    # No boundaries - check if user already has a custom lake nearby
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


# --- NEW ENDPOINT: UPDATE GEOMETRY ---
@router.put("/custom-lakes/{lake_id}/geometry")
async def update_custom_lake_geometry(
    lake_id: str,
    request: UpdateGeometryRequest,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Update the boundary geometry (anchors) of a custom lake.
    """
    email = await verify_clerk_session(authorization)
    
    # We call the update_geometry method on the store
    # Ensure your custom_lakes.py CustomLakeStore has this method!
    updated = custom_lake_store.update_geometry(lake_id, email, request.anchors)
    
    if not updated:
        raise HTTPException(status_code=404, detail="Custom lake not found or access denied")
    
    return {
        "success": True,
        "lake_id": lake_id,
        "anchors_count": len(request.anchors)
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
    Free users limited to 1 favorite (home lake).
    """
    email = await verify_clerk_session(authorization)

    if request.lake_type not in ("known", "custom"):
        raise HTTPException(status_code=400, detail="lake_type must be 'known' or 'custom'")

    # Check free tier limit: 1 favorite max for non-Pro users
    subscriber_store = SubscriberStore()
    subscriber = subscriber_store.get(email)
    is_pro = bool(subscriber and subscriber.active)

    if not is_pro:
        current_favorites = user_lake_store.list(email)
        if len(current_favorites) >= 1:
            raise HTTPException(
                status_code=403,
                detail="Free users can save 1 lake. Upgrade to Pro for unlimited saved lakes."
            )

    # Verify lake exists
    if request.lake_type == "custom":
        lake = custom_lake_store.get(request.lake_id, email)
        if not lake:
            raise HTTPException(status_code=404, detail="Custom lake not found")
    # Known lakes: no validation needed. lakes.json lives in the frontend only.
    # The frontend already verified the lake exists via hydrateLakeData before sending.

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
    
    hydrated = []
    
    for fav in favorites:
        if fav.lake_type == "known":
            # Known lakes: return minimal data. Frontend hydrates from LAKES_DATA
            # (lakes.json lives in frontend only, not accessible to backend)
            hydrated.append({
                "lake_id": fav.lake_id,
                "lake_type": "known",
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


# =============================================================================
# KNOWN LAKES DATA ENDPOINT (for offline caching)
# =============================================================================

@router.get("/known")
async def get_all_known_lakes(
    if_none_match: Optional[str] = Header(None, alias="If-None-Match"),
):
    """
    Get all known lakes with version for caching.

    Returns 304 Not Modified if client's cached version matches.
    Client should send If-None-Match header with cached version.

    This endpoint is PUBLIC (no auth required) for offline caching.
    """
    from fastapi.responses import JSONResponse, Response

    lakes = get_known_lakes()
    version = get_lakes_version()
    etag = f'"{version}"'

    # Check if client has current version
    if if_none_match and if_none_match.strip('"') == version:
        return Response(status_code=304)

    return JSONResponse(
        content={
            "lakes": lakes,
            "version": version,
            "count": len(lakes),
        },
        headers={
            "ETag": etag,
            "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
        },
    )


@router.get("/known/version")
async def get_known_lakes_version():
    """Get just the version hash - lightweight check for updates."""
    return {"version": get_lakes_version()}