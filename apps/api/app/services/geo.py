from typing import Dict, Any
import httpx

# Simple ZIP -> lat/lon via Zippopotam.us (free, no key)
# US-only for V1.
async def resolve_zip(zip_code: str) -> Dict[str, Any]:
    z = zip_code.strip()
    if len(z) != 5 or not z.isdigit():
        raise ValueError("ZIP must be 5 digits")

    url = f"https://api.zippopotam.us/us/{z}"
    async with httpx.AsyncClient(timeout=8) as client:
        r = await client.get(url)
        r.raise_for_status()
        data = r.json()

    place = (data.get("places") or [None])[0] or {}
    lat = float(place["latitude"])
    lon = float(place["longitude"])
    name = f'{place.get("place name","")} {place.get("state abbreviation","")}'.strip()

    return {"zip": z, "lat": lat, "lon": lon, "name": name}