import os
from fastapi import Header, HTTPException

def require_api_key(x_api_key: str = Header(default="")) -> None:
    expected = (os.getenv("BFP_API_KEY") or "").strip()
    if not expected:
        raise HTTPException(status_code=500, detail="Server missing BFP_API_KEY")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="Unauthorized")