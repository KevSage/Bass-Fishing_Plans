# Color Zone System - Implementation Complete ✅

## What Was Built

The backend now has a complete color zone expansion system that converts LLM "angler shorthand" colors into full zone payloads for pre-rendered image selection.

---

## Files Updated

### 1. `pools.py` - NEW SECTIONS ADDED

**METALLIC_COLORS** (line ~70)
```python
METALLIC_COLORS = {"gold", "bronze", "silver", "firetiger"}
```

**LURE_ZONE_SCHEMA** (line ~75)
- All 28 lures mapped individually
- Defines which zones each lure supports (primary, secondary, accent)
- Example:
  ```python
  "spinnerbait": {"primary": True, "secondary": False, "accent": True}
  "texas rig": {"primary": True, "secondary": True, "accent": False}
  ```

**LURE_ZONE_DEFAULTS** (line ~130)
- Default accent finishes for bladed lures
- Example:
  ```python
  "chatterbait": {"accent": "gold"},
  "spinnerbait": {"accent": "gold"},
  "buzzbait": {"accent": "silver"},
  ```

**New Functions** (line ~365):

1. **`expand_color_zones(lure, llm_colors) -> dict`**
   - Converts LLM color array to full zone payload
   - Returns: `{primary_color, secondary_color, accent_color, accent_material, asset_key}`
   - Applies defaults (blade finishes)
   - Validates no metallics on soft plastics

2. **`generate_asset_key(lure, zones) -> str`**
   - Generates filename for pre-rendered image
   - Format: `{lure}__{primary}__{accent}.png`
   - Example: `spinnerbait__chartreuse_white__gold.png`

3. **`validate_color_zones(lure, zones) -> list[str]`**
   - Validates expanded zones
   - Checks zone support
   - Checks metallic restrictions

---

### 2. `llm_plan_service.py` - UPDATED

**New Import** (line ~13):
```python
from app.canon.pools import (
    # ... existing imports ...
    expand_color_zones,
    validate_color_zones,
)
```

**New Function** (line ~530):
```python
def expand_plan_color_zones(plan, is_member) -> dict
```
- Expands colors for preview (single pattern) or member (dual patterns)
- Adds `colors` field to each pattern

**Updated** `generate_llm_plan_with_retries` (line ~488):
- Now calls `expand_plan_color_zones()` after validation
- Returns plan with expanded color zones

---

## How It Works

### Flow Diagram

```
1. LLM generates plan
   ↓
   {
     "base_lure": "spinnerbait",
     "color_recommendations": ["chartreuse/white"]
   }

2. Backend validates plan
   ↓
   ✅ Valid

3. Backend expands color zones
   ↓
   expand_color_zones("spinnerbait", ["chartreuse/white"])
   ↓
   {
     "primary_color": "chartreuse/white",
     "secondary_color": null,
     "accent_color": "gold",          // ← Auto-added default
     "accent_material": "metallic",
     "asset_key": "spinnerbait__chartreuse_white__gold.png"
   }

4. Backend returns to frontend
   ↓
   {
     "base_lure": "spinnerbait",
     "color_recommendations": ["chartreuse/white"],  // ← Original LLM output
     "colors": {                                      // ← NEW expanded zones
       "primary_color": "chartreuse/white",
       "secondary_color": null,
       "accent_color": "gold",
       "accent_material": "metallic",
       "asset_key": "spinnerbait__chartreuse_white__gold.png"
     }
   }

5. Frontend renders
   ↓
   <img src="/lures/spinnerbait__chartreuse_white__gold.png" />
```

---

## Backend Contract (What Frontend Gets)

### Preview Plan Response

```json
{
  "base_lure": "spinnerbait",
  "color_recommendations": ["chartreuse/white"],
  "colors": {
    "primary_color": "chartreuse/white",
    "secondary_color": null,
    "accent_color": "gold",
    "accent_material": "metallic",
    "asset_key": "spinnerbait__chartreuse_white__gold.png"
  },
  "targets": [...],
  "work_it": [...],
  "outlook_blurb": "..."
}
```

### Member Plan Response

```json
{
  "primary": {
    "base_lure": "spinnerbait",
    "color_recommendations": ["white"],
    "colors": {
      "primary_color": "white",
      "secondary_color": null,
      "accent_color": "gold",
      "accent_material": "metallic",
      "asset_key": "spinnerbait__white__gold.png"
    },
    "targets": [...],
    "work_it": [...]
  },
  "secondary": {
    "base_lure": "football jig",
    "color_recommendations": ["green pumpkin"],
    "colors": {
      "primary_color": "green pumpkin",
      "secondary_color": null,
      "accent_color": null,
      "accent_material": null,
      "asset_key": "football_jig__green_pumpkin.png"
    },
    "targets": [...],
    "work_it": [...]
  },
  "day_progression": [...],
  "outlook_blurb": "..."
}
```

---

## Zone Mapping Summary

### Bladed Lures (Auto-add blade finish)
- Spinnerbait, Chatterbait, Underspin, Buzzbait, Blade Bait
- `primary` = Skirt/body
- `accent` = Blade finish (gold/silver)
- `secondary` = Not supported

### Soft Plastics (Support back/flake)
- Texas Rig, Carolina Rig, Dropshot, Neko, Wacky, Ned, etc.
- `primary` = Body color
- `secondary` = Back/flake/laminate (optional)
- `accent` = Not supported
- ⚠️ NO METALLICS ALLOWED

### Hardbaits (Simple)
- Crankbaits, Jerkbait, Popper, Walking Bait, etc.
- `primary` = Main color
- `secondary` = Not supported (usually)
- `accent` = Not supported (usually)

### Jigs (Trailer handled separately)
- Football Jig, Casting Jig, Swim Jig
- `primary` = Jig color
- `secondary` = Not supported
- `accent` = Not supported
- Note: Trailers still suggested in work_it text

---

## Validation Rules

### Enforced Automatically

1. ✅ **No metallics on soft plastics**
   - `expand_color_zones("texas rig", ["gold"])` → ❌ ValueError
   - `expand_color_zones("spinnerbait", ["white"])` → ✅ OK, accent: "gold"

2. ✅ **Zone support checked**
   - Texas rig can have secondary
   - Popper cannot have secondary

3. ✅ **Defaults applied correctly**
   - Spinnerbait always gets gold blade (unless overridden)
   - Buzzbait always gets silver blade

4. ✅ **Asset keys normalized**
   - "chartreuse/white" → "chartreuse_white"
   - Spaces and slashes converted to underscores

---

## Frontend Implementation (Simple)

```javascript
// The only thing frontend needs to do:

function LureImage({ plan }) {
  return <img src={`/lures/${plan.colors.asset_key}`} />;
}

// That's it!
// No zone logic
// No color mapping
// No defaults
// Just load the right pre-rendered image
```

---

## Pre-Rendering Pipeline (Not Backend's Job)

**Separate build process will:**
1. Load neutral master image for each lure
2. Apply zone masks
3. Apply colors from canonical pool
4. Export all valid combinations as static PNGs

**Backend just generates the correct filename.**

---

## Testing

```python
# Test 1: Spinnerbait with default blade
zones = expand_color_zones("spinnerbait", ["chartreuse/white"])
assert zones["accent_color"] == "gold"
assert zones["asset_key"] == "spinnerbait__chartreuse_white__gold.png"

# Test 2: Texas rig with secondary
zones = expand_color_zones("texas rig", ["green pumpkin", "watermelon red"])
assert zones["secondary_color"] == "watermelon red"
assert zones["asset_key"] == "texas_rig__green_pumpkin__watermelon_red.png"

# Test 3: No metallics on soft plastics
try:
    expand_color_zones("texas rig", ["gold"])
    assert False, "Should have raised ValueError"
except ValueError as e:
    assert "metallic" in str(e).lower()

# Test 4: Popper (simple hardbait)
zones = expand_color_zones("popper", ["white"])
assert zones["asset_key"] == "popper__white.png"
```

---

## What's Left for main.py

When creating main.py, you just need to:

1. Get the plan from `generate_llm_plan_with_retries()`
2. It already has `colors` field expanded
3. Return it to frontend
4. Frontend loads `/lures/{colors.asset_key}`

**No additional color logic needed in main.py!**

---

## Summary

✅ **Backend owns:**
- Zone schema (all 28 lures)
- Default values (blade finishes)
- Metallic restrictions (validation)
- Asset key generation (filenames)

✅ **Frontend owns:**
- Render the correct asset
- Nothing else

✅ **Pre-render pipeline owns:**
- Generate all valid color combinations
- Export as static images

**Result:** Clean separation of concerns, deterministic outputs, testable system.
