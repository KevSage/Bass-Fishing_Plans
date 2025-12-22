# Example: Color Zone Expansion System

## How It Works

### 1. LLM Returns Simple Colors (Angler Shorthand)

```json
{
  "base_lure": "spinnerbait",
  "color_recommendations": ["chartreuse/white", "white"]
}
```

### 2. Backend Expands to Full Zones

```python
from app.canon.pools import expand_color_zones

lure = "spinnerbait"
llm_colors = ["chartreuse/white", "white"]

zones = expand_color_zones(lure, llm_colors)
```

**Result:**
```json
{
  "primary_color": "chartreuse/white",
  "secondary_color": null,
  "accent_color": "gold",
  "accent_material": "metallic",
  "asset_key": "spinnerbait__chartreuse_white__gold.png"
}
```

### 3. Frontend Uses Asset Key

```javascript
const imagePath = `/lures/${zones.asset_key}`
// → /lures/spinnerbait__chartreuse_white__gold.png
```

---

## Complete Examples

### Example 1: Spinnerbait (Bladed Lure)

**LLM Output:**
```json
{
  "base_lure": "spinnerbait",
  "color_recommendations": ["chartreuse/white"]
}
```

**Backend Expands:**
```json
{
  "primary_color": "chartreuse/white",
  "secondary_color": null,
  "accent_color": "gold",          // ← Default blade finish
  "accent_material": "metallic",
  "asset_key": "spinnerbait__chartreuse_white__gold.png"
}
```

**Frontend Loads:**
```
/lures/spinnerbait__chartreuse_white__gold.png
```

---

### Example 2: Texas Rig (Soft Plastic)

**LLM Output:**
```json
{
  "base_lure": "texas rig",
  "color_recommendations": ["green pumpkin", "watermelon red"]
}
```

**Backend Expands:**
```json
{
  "primary_color": "green pumpkin",
  "secondary_color": "watermelon red",  // ← Back/flake color
  "accent_color": null,                 // ← Soft plastics don't have accents
  "accent_material": null,
  "asset_key": "texas_rig__green_pumpkin__watermelon_red.png"
}
```

**Frontend Loads:**
```
/lures/texas_rig__green_pumpkin__watermelon_red.png
```

---

### Example 3: Popper (Topwater Hardbait)

**LLM Output:**
```json
{
  "base_lure": "popper",
  "color_recommendations": ["white"]
}
```

**Backend Expands:**
```json
{
  "primary_color": "white",
  "secondary_color": null,
  "accent_color": null,
  "accent_material": null,
  "asset_key": "popper__white.png"
}
```

**Frontend Loads:**
```
/lures/popper__white.png
```

---

## Member Plan Example (Dual Patterns)

**LLM Output:**
```json
{
  "primary": {
    "base_lure": "spinnerbait",
    "color_recommendations": ["white"]
  },
  "secondary": {
    "base_lure": "football jig",
    "color_recommendations": ["green pumpkin"]
  }
}
```

**Backend Expands:**
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
    }
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
    }
  }
}
```

---

## Zone Schema Reference

### Lures with Accent (Blade Finish)

**Chatterbait, Spinnerbait, Underspin, Buzzbait, Blade Bait**

- `primary` = Skirt/body color
- `secondary` = Not supported
- `accent` = Blade finish (default: gold or silver)

**Default accents:**
```python
"chatterbait": {"accent": "gold"},
"spinnerbait": {"accent": "gold"},
"underspin": {"accent": "silver"},
"buzzbait": {"accent": "silver"},
"blade bait": {"accent": "silver"},
```

### Soft Plastics with Secondary (Back/Flake)

**Texas Rig, Carolina Rig, Dropshot, Neko, Wacky, etc.**

- `primary` = Main body color
- `secondary` = Back, flake, or laminate color (optional)
- `accent` = Not supported

### Hardbaits (Simple)

**Crankbaits, Jerkbait, Popper, Walking Bait, etc.**

- `primary` = Main color
- `secondary` = Not supported
- `accent` = Not supported (or optional belly/throat spot)

---

## Validation Rules

### Metallic Restriction

**✅ Allowed:**
```python
expand_color_zones("spinnerbait", ["white"])
# → accent_color: "gold" (metallic blade)
```

**❌ NOT Allowed:**
```python
expand_color_zones("texas rig", ["gold"])  # Raises ValueError
# Soft plastics cannot use metallic colors
```

### Zone Support Validation

**✅ Allowed:**
```python
expand_color_zones("texas rig", ["green pumpkin", "watermelon red"])
# → primary + secondary (both supported)
```

**❌ Ignored (but not error):**
```python
expand_color_zones("popper", ["white", "chartreuse"])
# → Only uses "white" (popper doesn't support secondary)
# → Doesn't error, just ignores second color
```

---

## Testing the System

```python
from app.canon.pools import expand_color_zones, validate_color_zones

# Test 1: Spinnerbait with default blade
zones = expand_color_zones("spinnerbait", ["chartreuse/white"])
assert zones["primary_color"] == "chartreuse/white"
assert zones["accent_color"] == "gold"
assert zones["asset_key"] == "spinnerbait__chartreuse_white__gold.png"

# Test 2: Texas rig with secondary
zones = expand_color_zones("texas rig", ["green pumpkin", "watermelon red"])
assert zones["primary_color"] == "green pumpkin"
assert zones["secondary_color"] == "watermelon red"
assert zones["asset_key"] == "texas_rig__green_pumpkin__watermelon_red.png"

# Test 3: Validation
errors = validate_color_zones("texas rig", {
    "primary_color": "gold",  # NOT allowed on soft plastic
    "secondary_color": None,
    "accent_color": None
})
assert len(errors) > 0  # Should have metallic violation error

# Test 4: Simple hardbait
zones = expand_color_zones("popper", ["white"])
assert zones["asset_key"] == "popper__white.png"

print("✅ All tests passed!")
```

---

## Frontend Implementation (Simple)

```jsx
// React component
function LureImage({ lure, colors }) {
  const assetKey = colors.asset_key;
  const imagePath = `/lures/${assetKey}`;
  
  return (
    <img 
      src={imagePath} 
      alt={`${lure} in ${colors.primary_color}`}
      className="lure-image"
    />
  );
}

// Usage
<LureImage 
  lure="spinnerbait"
  colors={{
    primary_color: "chartreuse/white",
    accent_color: "gold",
    asset_key: "spinnerbait__chartreuse_white__gold.png"
  }}
/>
```

**No color logic in frontend. Just load the right image.**

---

## Summary

**Backend owns:**
1. ✅ Zone schema (which zones each lure supports)
2. ✅ Default values (blade finishes, etc.)
3. ✅ Color validation (no metallics on soft plastics)
4. ✅ Asset key generation (exact filename)

**Frontend owns:**
1. ✅ Render the asset referenced by backend
2. ❌ NO zone guessing
3. ❌ NO default selection
4. ❌ NO color invention

**Pre-rendering pipeline owns:**
1. Generate master neutral images
2. Create zone masks
3. Apply colors via build script
4. Export `{lure}__{primary}__{accent}.png`

**Result:** Deterministic, testable, premium quality.
