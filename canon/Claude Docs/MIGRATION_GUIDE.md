# Frontend Migration Guide - New Backend Integration

## Overview

Your backend has been completely rebuilt. This guide shows you how to update your React frontend to work with the new API.

---

## Changes Summary

### API Endpoints
**Before:**
- `POST /plan/preview` (preview users)
- `POST /plan/members` (members)

**After:**
- `POST /plan/generate` (unified endpoint for both)
- `GET /plan/view/{token}` (view saved plan)
- `GET /plan/download/{token}/mobile` (download mobile HTML)
- `GET /plan/download/{token}/a4` (download A4 HTML)

### Response Structure
**Before:**
```json
{
  "geo": {...},
  "plan": {
    "primary_technique": "...",
    "featured_lure_name": "...",
    "recommended_targets": [...],
    "strategy_tips": [...]
  }
}
```

**After:**
```json
{
  "plan_url": "https://...",
  "token": "abc123...",
  "is_member": false,
  "plan": {
    "base_lure": "spinnerbait",
    "colors": {
      "primary_color": "chartreuse/white",
      "accent_color": "gold",
      "asset_key": "spinnerbait__chartreuse_white__gold.png"
    },
    "targets": [...],
    "work_it": [...],
    "outlook_blurb": "...",
    "day_progression": [...],
    "conditions": {...}
  }
}
```

**Member plans also include:**
```json
{
  "plan": {
    "primary": {...},
    "secondary": {...},
    "day_progression": [...],
    "outlook_blurb": "..."
  }
}
```

---

## Files to Update

### 1. Replace `src/features/plan/types.ts`

**New file:** `types.ts` (provided)

**Key changes:**
- Added `ColorZones` type for lure colors
- Added `Pattern` type for individual patterns
- Added `PreviewPlan` and `MemberPlan` types
- Added `PlanGenerateResponse` for API responses
- Added `isMemberPlan()` helper function

### 2. Replace `src/lib/api.ts`

**New file:** `api.ts` (provided)

**Key changes:**
- Unified `generatePlan()` function
- Added `RateLimitError` class for handling rate limits
- Backward compatible wrapper functions
- Added `viewPlan()` for viewing saved plans

### 3. Replace `src/features/plan/PlanScreen.tsx`

**New file:** `PlanScreen.tsx` (provided)

**Key changes:**
- Displays new plan structure
- Shows conditions (temp range, wind, sky, phase)
- Shows outlook blurb
- Handles both preview and member plans
- Shows Pattern 2 for members
- Displays lure images using asset_key
- Shows shareable plan link

### 4. Create `src/features/plan/lures/LureImage.tsx`

**New file:** `LureImage.tsx` (provided)

**Purpose:** Display lure images using asset_key from backend

**Features:**
- Loads image from `/lures/${asset_key}`
- Fallback placeholder if image doesn't exist yet
- Configurable size (small, medium, large)

### 5. Update `src/pages/Preview.tsx`

**New file:** `Preview.tsx` (provided)

**Key changes:**
- Uses new `generatePlan()` API
- Handles rate limit errors
- Shows friendly rate limit message
- Uses latitude/longitude instead of ZIP
- Passes response to PlanScreen

### 6. Update `src/features/plan/PlanDownloads.tsx`

**New file:** `PlanDownloads.tsx` (provided)

**Key changes:**
- Uses new download URLs with token
- Links to `/plan/download/{token}/mobile`
- Links to `/plan/download/{token}/a4`

### 7. Add CSS

**New file:** `plan-styles.css` (provided)

**Add to your main CSS file or import separately**

---

## Step-by-Step Migration

### Step 1: Backup Current Code
```bash
git commit -am "Backup before migration"
```

### Step 2: Update Environment Variables

Add to `.env`:
```bash
VITE_API_BASE=http://localhost:8000
```

### Step 3: Replace Files

```bash
# Copy new files
cp types.ts src/features/plan/
cp api.ts src/lib/
cp PlanScreen.tsx src/features/plan/
cp LureImage.tsx src/features/plan/lures/
cp Preview.tsx src/pages/
cp PlanDownloads.tsx src/features/plan/
```

### Step 4: Add CSS

Append `plan-styles.css` to your existing CSS file

### Step 5: Create Lure Image Directory

```bash
# In your public folder
mkdir -p public/lures
```

**For now, images will show placeholders.** When you generate lure images, place them in `public/lures/` with the exact filename from `asset_key`.

Example:
- `public/lures/spinnerbait__chartreuse_white__gold.png`
- `public/lures/texas_rig__green_pumpkin.png`

### Step 6: Test

```bash
npm run dev
```

Visit `/preview` and test:
1. Enter email and location
2. Generate plan
3. Check that plan displays correctly
4. Try again immediately (should hit rate limit)
5. Check downloads work

---

## New Features to Tell Users About

### 1. Rate Limiting
- **Preview users:** 1 plan every 30 days
- **Members:** Unlimited plans (3-hour cooldown)
- Clear error messages with time remaining

### 2. Shareable Links
- Every plan gets a permanent URL
- Anyone with link can view
- Great for sharing with fishing buddies

### 3. Downloads
- **Mobile Dark:** Optimized for phone viewing on the water
- **A4 Printable:** Perfect for tackle box or printing

### 4. Pattern 2 (Members Only)
- Primary pattern + pivot plan
- Different presentation if first read was wrong
- Complete gear recommendations for both

### 5. Regional Accuracy
- Phase determination based on latitude
- FL bass spawn in winter!
- Accurate for all US regions

### 6. Weather Range
- Shows daily high/low temps
- More accurate than single temp

### 7. Outlook Blurb
- 2-3 sentence explanation of conditions
- Describes fish behavior expectations
- No exact numbers (already shown in conditions)

---

## Handling Missing Lure Images

The `LureImage` component handles missing images gracefully:

```tsx
<LureImage 
  assetKey="spinnerbait__chartreuse_white__gold.png"
  lureName="spinnerbait"
/>
```

**If image exists:** Shows the image  
**If image missing:** Shows placeholder with lure name

This means you can deploy now and add images later!

---

## Rate Limit UX

The new system handles rate limits elegantly:

**Preview User (tries again too soon):**
```
Rate Limit Reached

You can request one preview every 30 days. Next available in 29.8 days.

[Subscribe for Unlimited Plans]
```

**Member (tries again too soon):**
```
Rate Limit Reached

Please wait 2.5 hours between plan requests.
```

---

## Testing Checklist

- [ ] Preview plan generates successfully
- [ ] Member plan generates successfully (if you have test subscriber)
- [ ] Rate limit triggers correctly
- [ ] Lure placeholders show when images missing
- [ ] Download links work
- [ ] Share link copies to clipboard
- [ ] Conditions display correctly
- [ ] Outlook blurb shows
- [ ] Day progression displays
- [ ] Pattern 2 shows for members
- [ ] Mobile responsive

---

## Common Issues

### "Failed to generate plan"
**Check:**
- Backend is running on port 8000
- `VITE_API_BASE` env variable is set
- CORS is enabled in backend

### "Image not found"
**Expected!** Lure images aren't created yet. Placeholder will show until you add images to `public/lures/`

### Rate limit not working
**Check:**
- Try with same email twice quickly
- Should see rate limit error on second request

### Pattern 2 not showing
**Check:**
- User must be an active subscriber
- Check `is_member` in response

---

## Next Steps

1. **Deploy Frontend Changes**
   ```bash
   npm run build
   ```

2. **Generate Lure Images**
   - Use the image generation system doc
   - Place in `public/lures/`
   - Filename must match `asset_key` exactly

3. **Add Mapbox Integration** (optional)
   - Let users select lake on map instead of entering lat/lon manually
   - On lake selection, populate latitude/longitude automatically

4. **Style Improvements** (optional)
   - Customize colors/fonts to match brand
   - Add animations for plan generation
   - Improve loading states

---

## Support

**Backend working but frontend broken?**
- Check browser console for errors
- Verify API response in Network tab
- Ensure types match actual response

**Questions about new features?**
- See DEPLOYMENT_GUIDE.md for backend details
- See FINAL_CANONICAL_SCHEMA.md for color zone system

---

## Summary

**Old system:** Separate preview/member endpoints, no rate limiting, no shareable links  
**New system:** Unified endpoint, rate limiting, shareable links, Pattern 2, better data structure

**Migration time:** ~30 minutes  
**Breaking changes:** Yes (API structure changed)  
**Backward compatible:** Legacy wrapper functions provided in `api.ts`

**Ready to deploy!** 🚀
