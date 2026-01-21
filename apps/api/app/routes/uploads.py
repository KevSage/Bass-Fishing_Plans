# apps/api/app/routes/uploads.py
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from app.services.storage import StorageService
from app.routes.members import verify_clerk_session

router = APIRouter()
storage = StorageService()

class PresignedUrlRequest(BaseModel):
    file_name: str
    content_type: str

@router.post("/uploads/presigned")
async def get_upload_url(
    req: PresignedUrlRequest,
    authorization: str = Header(None)
):
    await verify_clerk_session(authorization)
    
    data = storage.generate_presigned_url(req.file_name, req.content_type)
    if not data:
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")
        
    return data