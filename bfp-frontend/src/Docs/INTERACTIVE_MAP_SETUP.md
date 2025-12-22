# Interactive Map Setup - Water Body Selection

## Overview

Users can **pan, zoom, and explore** the map to find their fishing spot. When they hover over or touch a body of water, a **soft-lock** appears showing the lake name and location. Tapping/clicking selects it.

## Installation

### 1. Install Dependencies

```bash
npm install mapbox-gl
npm install @types/mapbox-gl --save-dev
```

### 2. Get Mapbox Token

1. Go to https://account.mapbox.com/
2. Sign up (free tier is plenty)
3. Copy your **public token** (starts with `pk.`)

### 3. Add to Environment

In `.env`:
```bash
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsaX...
```

### 4. Install Files

```bash
# Create components directory if needed
mkdir -p src/components

# Copy files
cp WaterBodyMap.tsx src/components/
cp Preview_MAP.tsx src/pages/Preview.tsx
```

### 5. Import Mapbox CSS

In your `src/main.tsx` or `src/index.tsx`:

```typescript
import 'mapbox-gl/dist/mapbox-gl.css';
```

### 6. Restart Dev Server

```bash
npm run dev
```

---

## How It Works

### User Experience:

1. **Opens page** → Sees interactive map centered on bass fishing region
2. **Pans/zooms** → Finds their lake (Lake Guntersville, Table Rock, etc.)
3. **Hovers over water** → Soft-lock appears:
   ```
   ┌─────────────────────┐
   │ Lake Guntersville   │
   │ Guntersville, AL    │
   │ Click to select     │
   └─────────────────────┘
   ```
4. **Taps/clicks** → Lake selected ✓
5. **Generates plan** → Uses exact coordinates

### Technical Flow:

```typescript
User hovers water
  → Map detects water layer
  → Reverse geocode (lng, lat) → Get lake name
  → Show soft-lock overlay
  
User clicks
  → Capture coordinates
  → Reverse geocode for details
  → Call onSelect({ name, city, state, lat, lng })
  → Show confirmation
```

---

## Features

✅ **Interactive map** - Pan, zoom, rotate  
✅ **Soft-lock on water bodies** - Highlights when hovering  
✅ **Shows lake name + location** - City, State  
✅ **Geolocate button** - Find user's current location  
✅ **Mobile-friendly** - Touch gestures work perfectly  
✅ **Works on land too** - If user clicks land, still captures coordinates  
✅ **Visual feedback** - Blue marker on selection  

---

## Customization

### Change Initial Location

Default is centered on Alabama (bass fishing heartland):

```typescript
<WaterBodyMap
  onSelect={(wb) => setWaterBody(wb)}
  initialCenter={[-92.0, 34.0]} // [longitude, latitude] - Arkansas
  initialZoom={7}
/>
```

### Change Map Style

In `WaterBodyMap.tsx`:

```typescript
style: 'mapbox://styles/mapbox/outdoors-v12' // Current (shows water well)
style: 'mapbox://styles/mapbox/satellite-v9' // Satellite view
style: 'mapbox://styles/mapbox/streets-v12'  // Street map
style: 'mapbox://styles/mapbox/dark-v11'     // Dark theme
```

### Change Map Height

```typescript
<div 
  ref={mapContainer} 
  style={{ 
    height: '500px', // Make it taller
    // ...
  }} 
/>
```

### Customize Soft-Lock Styling

In the `softLockedWater` overlay div:

```typescript
background: 'rgba(0, 0, 0, 0.85)', // Make it darker
border: '2px solid #4A90E2',        // Thicker border
borderRadius: 12,                   // More rounded
```

---

## Mobile Optimization

The map is already mobile-optimized with:
- Touch gestures (pinch to zoom, two-finger rotate)
- Larger tap targets
- Smooth animations
- Responsive sizing

For even better mobile UX, consider:

```typescript
// Disable rotation on mobile
map.current.touchZoomRotate.disableRotation();

// Increase zoom on mobile
const isMobile = window.innerWidth < 768;
const zoom = isMobile ? 8 : 6;
```

---

## Mapbox Pricing (Free Tier)

**Included:**
- 50,000 map loads/month (free)
- 100,000 geocoding requests/month (free)

**Your usage estimate:**
- Map load: Once per user session
- Geocoding: ~3-5 requests per selection (hover + click)
- 100 users × 10 searches = 5,000 requests/month

**You'll stay well under limits!** ✅

---

## Troubleshooting

### Map not showing

**Check:**
```bash
# Token in .env?
cat .env | grep MAPBOX

# CSS imported?
grep "mapbox-gl/dist/mapbox-gl.css" src/main.tsx

# Dependencies installed?
npm list mapbox-gl
```

### Soft-lock not appearing

- The map needs to be zoomed in enough to see water bodies
- Try zoom level 10+ for small lakes
- Some very small ponds may not be in Mapbox data

### "queryRenderedFeatures" returning nothing

- Water layers are only visible at certain zoom levels
- Zoom in closer (zoom 12+)
- Or query all features: `map.queryRenderedFeatures(e.point)`

### Reverse geocoding failing

- Check Mapbox token has geocoding permissions
- Verify token hasn't expired
- Check browser console for API errors

---

## Advanced: Custom Water Body Data

If Mapbox doesn't have a specific lake, you can add custom markers:

```typescript
// Add custom lake marker
const customLakes = [
  { name: 'Private Pond', lng: -86.5, lat: 34.2 }
];

customLakes.forEach(lake => {
  new mapboxgl.Marker({ color: '#4A90E2' })
    .setLngLat([lake.lng, lake.lat])
    .setPopup(new mapboxgl.Popup().setHTML(`<h3>${lake.name}</h3>`))
    .addTo(map.current);
});
```

---

## Alternative: Search + Map Combo

For best UX, combine both approaches:

```tsx
{/* Search bar for quick entry */}
<LocationSearch onSelect={(loc) => {
  setWaterBody(loc);
  map.current?.flyTo({ center: [loc.longitude, loc.latitude], zoom: 12 });
}} />

{/* Map for visual selection */}
<WaterBodyMap onSelect={setWaterBody} />
```

This lets power users type, while others can explore visually.

---

## Next Steps

1. ✅ Install dependencies
2. ✅ Add Mapbox token to .env
3. ✅ Copy files to your project
4. ✅ Import Mapbox CSS
5. ✅ Test on desktop and mobile
6. Consider adding search bar above map
7. Customize initial location for your target region

**You now have a professional, interactive lake selector!** 🗺️🎣
