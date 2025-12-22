# Color Zone System - Canonical Reference (LOCKED)

## Critical Fixes Applied

All 4 design feedback issues have been corrected:

1. ✅ **Blade finish → Hardware finish** - Generalized metallic components
2. ✅ **Rigs are presentations, not soft plastics** - Rig icons treated separately
3. ✅ **Hardbaits support optional secondary/accent** - Future-proofed
4. ✅ **Warnings added for ignored colors** - No silent failures

---

## Zone Schema (Authoritative)

### Bladed Lures (Spinnerbait, Chatterbait, Underspin)

**Zones:**
- `primary` (required) - Skirt/body color
- `secondary` (optional) - Skirt accent color
- `accent` (required) - Blade finish (metallic hardware)

**Defaults:**
```python
"chatterbait": {"accent": "gold", "accent_material": "metallic"}
"spinnerbait": {"accent": "gold", "accent_material": "metallic"}
"underspin": {"accent": "silver", "accent_material": "metallic"}
```

**Example:**
```json
{
  "primary_color": "chartreuse/white",
  "secondary_color": null,
  "accent_color": "gold",
  "accent_material": "metallic",
  "asset_key": "spinnerbait__chartreuse_white__gold.png"
}
```

---

### Buzzbait / Prop Baits (Topwater with Hardware)

**Zones:**
- `primary` (required) - Body/skirt color
- `secondary` (optional) - Back or skirt accent
- `accent` (required) - Hardware finish (prop/blade, metallic)

**Defaults:**
```python
"buzzbait": {"accent": "silver", "accent_material": "metallic"}
```

**Note:** NOT "blade finish" - this is **hardware finish** (prop/blade assembly)

---

### Blade Bait (Metal Body Lure)

**Zones:**
- `primary` (required) - Body plate color (IS metallic material)
- `secondary` (optional) - Not typically used
- `accent` (optional) - Small marking (NOT "blade finish")

**Critical:** Blade bait's PRIMARY is the metallic component, not accent.

**Example:**
```json
{
  "primary_color": "silver",
  "secondary_color": null,
  "accent_color": null,
  "accent_material": "metallic",  // ← Primary IS metallic
  "asset_key": "blade_bait__silver.png"
}
```

**NO DEFAULTS** - LLM must specify metallic color for primary

---

### Rig Icons (Texas Rig, Dropshot, Shaky Head, etc.)

**These are PRESENTATION ICONS, not soft plastic bodies.**

Shows: Hook + weight + plastic profile silhouette

**Zones:**
- `primary` (required) - Dominant color (hook/weight or plastic shown)
- `secondary` (optional) - Back accent on plastic shown (if depicted)
- `accent` (not supported) - No metallic components

**Lures:**
```python
RIG_ICON_LURES = {
    "texas rig",
    "carolina rig", 
    "shaky head",
    "neko rig",
    "wacky rig",
    "ned rig",
    "dropshot",
}
```

**Restriction:** NO METALLICS in primary or secondary

**Example:**
```json
{
  "primary_color": "green pumpkin",
  "secondary_color": null,
  "accent_color": null,
  "asset_key": "texas_rig__green_pumpkin.png"
}
```

---

### Soft Plastic Bodies (Standalone Plastic)

**These are PLASTIC BODIES, not rigs.**

**Zones:**
- `primary` (required) - Body color
- `secondary` (optional) - Back/flake/laminate
- `accent` (optional) - Belly/tail tip (rarely used)

**Lures:**
```python
SOFT_PLASTIC_BODY_LURES = {
    "weightless soft jerkbait",
    "paddle tail swimbait",
}
```

**Restriction:** NO METALLICS anywhere

**Example:**
```json
{
  "primary_color": "green pumpkin",
  "secondary_color": "watermelon red",  // ← Back/flake
  "accent_color": null,
  "asset_key": "weightless_soft_jerkbait__green_pumpkin__watermelon_red.png"
}
```

---

### Hardbaits (Crankbaits, Jerkbait, Popper, Walking Bait, etc.)

**Zones:**
- `primary` (required) - Main body color
- `secondary` (optional) - Back color
- `accent` (optional) - Belly/throat spot

**V1 Expansion Rule:** Only fill what LLM specifies. Do NOT invent belly/back colors.

**Can use metallics** (e.g., firetiger, gold)

**Example:**
```json
{
  "primary_color": "firetiger",  // ← Metallic OK on hardbaits
  "secondary_color": null,
  "accent_color": null,
  "asset_key": "shallow_crankbait__firetiger.png"
}
```

---

### Jigs (Football Jig, Casting Jig, Swim Jig)

**Zones:**
- `primary` (required) - Jig/skirt color
- `secondary` (not supported)
- `accent` (not supported)

**Note:** Trailers still suggested in `work_it` text, not in color zones

**Example:**
```json
{
  "primary_color": "green pumpkin",
  "secondary_color": null,
  "accent_color": null,
  "asset_key": "football_jig__green_pumpkin.png"
}
```

---

## Metallic Validation Rules (CRITICAL)

### Where Metallics ARE Allowed:

1. **Hardbaits** - Primary, secondary, or accent
   ```python
   expand_color_zones("shallow crankbait", ["firetiger"])  # ✅ OK
   ```

2. **Blade Bait** - Primary (body IS metal)
   ```python
   expand_color_zones("blade bait", ["silver"])  # ✅ OK
   ```

3. **Hardware Finishes** - Accent (blade, prop)
   ```python
   expand_color_zones("spinnerbait", ["white"])
   # ✅ OK - auto-adds accent: "gold" (metallic)
   ```

### Where Metallics are NOT Allowed:

1. **Rig Icons** - Primary or secondary
   ```python
   expand_color_zones("texas rig", ["gold"])  # ❌ ValueError
   ```

2. **Soft Plastic Bodies** - Any zone
   ```python
   expand_color_zones("paddle tail swimbait", ["silver"])  # ❌ ValueError
   ```

3. **Secondary Zone** - Almost never (back of lure)
   ```python
   zones = {
       "primary_color": "white",
       "secondary_color": "gold"  # ❌ ValueError
   }
   ```

---

## Warnings System

When LLM provides colors for unsupported zones, warnings are added (non-fatal):

**Example:**
```python
zones = expand_color_zones("popper", ["white", "chartreuse"])
```

**Result:**
```json
{
  "primary_color": "white",
  "secondary_color": null,
  "accent_color": null,
  "warnings": ["popper does not support secondary_color; ignored 'chartreuse'"]
}
```

**Benefits:**
- Debugging LLM mistakes
- Logging for monitoring
- Doesn't break the plan

---

## Asset Key Generation

**Format:** `{lure}__{primary}__{secondary_or_accent}.png`

**Normalization:**
- `"chartreuse/white"` → `"chartreuse_white"`
- Spaces and slashes → underscores

**Examples:**

```python
# Spinnerbait (has accent)
"spinnerbait__chartreuse_white__gold.png"

# Texas rig (no secondary)
"texas_rig__green_pumpkin.png"

# Soft plastic (has secondary)
"weightless_soft_jerkbait__green_pumpkin__watermelon_red.png"

# Blade bait (metallic primary)
"blade_bait__silver.png"
```

---

## Backend API Contract

**LLM Returns:**
```json
{
  "base_lure": "spinnerbait",
  "color_recommendations": ["chartreuse/white"]
}
```

**Backend Expands:**
```json
{
  "base_lure": "spinnerbait",
  "color_recommendations": ["chartreuse/white"],
  "colors": {
    "primary_color": "chartreuse/white",
    "secondary_color": null,
    "accent_color": "gold",
    "accent_material": "metallic",
    "asset_key": "spinnerbait__chartreuse_white__gold.png",
    "warnings": []
  }
}
```

**Frontend Uses:**
```jsx
<img src={`/lures/${plan.colors.asset_key}`} />
```

---

## Testing Examples

```python
# Test 1: Spinnerbait with default blade
zones = expand_color_zones("spinnerbait", ["white"])
assert zones["accent_color"] == "gold"
assert zones["accent_material"] == "metallic"
assert zones["asset_key"] == "spinnerbait__white__gold.png"

# Test 2: Blade bait (primary IS metallic)
zones = expand_color_zones("blade bait", ["silver"])
assert zones["primary_color"] == "silver"
assert zones["accent_material"] == "metallic"  # Primary IS metal
assert zones["asset_key"] == "blade_bait__silver.png"

# Test 3: Rig icon - NO metallics allowed
try:
    expand_color_zones("texas rig", ["gold"])
    assert False, "Should raise ValueError"
except ValueError as e:
    assert "rig icon" in str(e).lower()

# Test 4: Ignored secondary with warning
zones = expand_color_zones("popper", ["white", "chartreuse"])
assert zones["secondary_color"] is None
assert len(zones["warnings"]) > 0
assert "ignored" in zones["warnings"][0].lower()

# Test 5: Soft plastic body - NO metallics
try:
    expand_color_zones("paddle tail swimbait", ["silver"])
    assert False, "Should raise ValueError"
except ValueError as e:
    assert "soft plastic" in str(e).lower()

print("✅ All canonical tests passed!")
```

---

## Summary - What Changed

### Before (Broken):
1. ❌ "Blade finish" used for all metallic components
2. ❌ Dropshot/rigs treated as soft plastics
3. ❌ Hardbaits couldn't have secondary/accent
4. ❌ Ignored colors silently (no debugging)

### After (Canonical):
1. ✅ "Hardware finish" for metallic components (blade, prop, body plate)
2. ✅ Rig icons treated separately from soft plastic bodies
3. ✅ Hardbaits support optional secondary/accent (future-proof)
4. ✅ Warnings array for ignored colors (debuggable)

---

## Frontend Implementation (Unchanged)

```jsx
function LureImage({ plan }) {
  // Just load the asset key
  return <img src={`/lures/${plan.colors.asset_key}`} />;
}
```

**No color logic in frontend. Backend owns it all.**

---

## Pre-Rendering Pipeline (Not Backend's Job)

Separate build process will:
1. Load neutral master for each lure
2. Apply zone masks
3. Apply colors from canonical pool
4. Export all valid combinations as static PNGs

**Backend just generates the correct filename.**

Backend owns zone schema + defaults + validation + asset keys.
Frontend owns rendering the correct asset.
Pre-render pipeline owns generating the static images.

**Result:** Clean separation, deterministic outputs, canonical compliance.
