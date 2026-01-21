# apps/api/app/routes/catches.py
"""
Catch logging endpoints.
"""
from __future__ import annotations

from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from app.routes.members import verify_clerk_session
from app.services.catches import CatchStore
from app.services.custom_lakes import CustomLakeStore

router = APIRouter()
catch_store = CatchStore()
custom_lake_store = CustomLakeStore()


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class CreateCatchRequest(BaseModel):
    date: str  # YYYY-MM-DD
    species: str
    lat: float
    lng: float
    time: Optional[str] = None  # HH:MM
    weight: Optional[float] = None
    length: Optional[float] = None
    lure: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    lake_id: Optional[str] = None
    lake_type: str = "unresolved"  # 'known', 'custom', 'unresolved'
    lake_name: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    source: str = "manual"  # 'camera', 'library', 'manual'


class CatchResponse(BaseModel):
    id: str
    date: str
    time: Optional[str]
    species: str
    weight: Optional[float]
    length: Optional[float]
    lure: Optional[str]
    color: Optional[str]
    notes: Optional[str]
    photo_url: Optional[str]
    lat: float
    lng: float
    lake_id: Optional[str]
    lake_type: str
    lake_name: Optional[str]
    city: Optional[str]
    state: Optional[str]
    source: str
    created_at: str


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/catches")
async def create_catch(
    request: CreateCatchRequest,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Create a new catch record.
    """
    email = await verify_clerk_session(authorization)
    
    # Create the catch
    catch_id = catch_store.create(
        email=email,
        date=request.date,
        species=request.species,
        lat=request.lat,
        lng=request.lng,
        time=request.time,
        weight=request.weight,
        length=request.length,
        lure=request.lure,
        color=request.color,
        notes=request.notes,
        photo_url=request.photo_url,
        lake_id=request.lake_id,
        lake_type=request.lake_type,
        lake_name=request.lake_name,
        city=request.city,
        state=request.state,
        source=request.source,
    )
    
    # If this is a custom lake, increment catch count
    if request.lake_type == "custom" and request.lake_id:
        custom_lake_store.increment_catch_count(request.lake_id, email)
    
    return {
        "success": True,
        "catch_id": catch_id,
    }


@router.get("/catches")
async def list_catches(
    authorization: Optional[str] = Header(None),
    limit: int = 50,
    offset: int = 0,
) -> Dict:
    """
    List all catches for the authenticated user.
    """
    email = await verify_clerk_session(authorization)
    
    limit = min(limit, 100)  # Cap at 100
    
    catches = catch_store.list_by_user(email, limit=limit, offset=offset)
    total = catch_store.count_by_user(email)
    
    return {
        "catches": [
            CatchResponse(
                id=c.id,
                date=c.date,
                time=c.time,
                species=c.species,
                weight=c.weight,
                length=c.length,
                lure=c.lure,
                color=c.color,
                notes=c.notes,
                photo_url=c.photo_url,
                lat=c.lat,
                lng=c.lng,
                lake_id=c.lake_id,
                lake_type=c.lake_type,
                lake_name=c.lake_name,
                city=c.city,
                state=c.state,
                source=c.source,
                created_at=c.created_at,
            ).model_dump()
            for c in catches
        ],
        "total": total,
        "has_more": (offset + limit) < total,
    }


@router.get("/catches/{catch_id}")
async def get_catch(
    catch_id: str,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Get a single catch by ID.
    """
    email = await verify_clerk_session(authorization)
    
    catch = catch_store.get(catch_id, email)
    
    if not catch:
        raise HTTPException(status_code=404, detail="Catch not found")
    
    return {
        "catch": CatchResponse(
            id=catch.id,
            date=catch.date,
            time=catch.time,
            species=catch.species,
            weight=catch.weight,
            length=catch.length,
            lure=catch.lure,
            color=catch.color,
            notes=catch.notes,
            photo_url=catch.photo_url,
            lat=catch.lat,
            lng=catch.lng,
            lake_id=catch.lake_id,
            lake_type=catch.lake_type,
            lake_name=catch.lake_name,
            city=catch.city,
            state=catch.state,
            source=catch.source,
            created_at=catch.created_at,
        ).model_dump()
    }


@router.delete("/catches/{catch_id}")
async def delete_catch(
    catch_id: str,
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    Delete a catch.
    """
    email = await verify_clerk_session(authorization)
    
    # Get catch first to check lake_type for decrementing
    catch = catch_store.get(catch_id, email)
    
    if not catch:
        raise HTTPException(status_code=404, detail="Catch not found")
    
    # Delete the catch
    deleted = catch_store.delete(catch_id, email)
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Catch not found")
    
    # If this was a custom lake catch, decrement count
    if catch.lake_type == "custom" and catch.lake_id:
        custom_lake_store.decrement_catch_count(catch.lake_id, email)
    
    return {
        "success": True,
        "deleted_id": catch_id,
    }


@router.get("/catches/by-lake/{lake_id}")
async def list_catches_by_lake(
    lake_id: str,
    lake_type: str = "known",
    authorization: Optional[str] = Header(None),
) -> Dict:
    """
    List all catches at a specific lake.
    """
    email = await verify_clerk_session(authorization)
    
    if lake_type not in ("known", "custom"):
        raise HTTPException(status_code=400, detail="lake_type must be 'known' or 'custom'")
    
    catches = catch_store.list_by_lake(email, lake_id, lake_type)
    
    return {
        "catches": [
            CatchResponse(
                id=c.id,
                date=c.date,
                time=c.time,
                species=c.species,
                weight=c.weight,
                length=c.length,
                lure=c.lure,
                color=c.color,
                notes=c.notes,
                photo_url=c.photo_url,
                lat=c.lat,
                lng=c.lng,
                lake_id=c.lake_id,
                lake_type=c.lake_type,
                lake_name=c.lake_name,
                city=c.city,
                state=c.state,
                source=c.source,
                created_at=c.created_at,
            ).model_dump()
            for c in catches
        ],
        "total": len(catches),
    }