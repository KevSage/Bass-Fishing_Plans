# CANONICAL LURE LIST - Bass Fishing Plans

**Total Lures:** 28

---

## Complete List (Alphabetical)

1. **blade bait**
2. **buzzbait**
3. **carolina rig**
4. **casting jig**
5. **chatterbait**
6. **deep crankbait**
7. **dropshot**
8. **football jig**
9. **hollow body frog**
10. **jerkbait**
11. **lipless crankbait**
12. **mid crankbait**
13. **ned rig**
14. **neko rig**
15. **paddle tail swimbait**
16. **popper** ← NEW
17. **popping frog**
18. **shallow crankbait**
19. **shaky head**
20. **spinnerbait**
21. **swim jig**
22. **texas rig**
23. **underspin**
24. **wacky rig**
25. **wake bait** ← NEW
26. **walking bait**
27. **weightless soft jerkbait**
28. **whopper plopper**

---

## Organized by Presentation

### Horizontal Reaction (9 lures)
1. shallow crankbait
2. mid crankbait
3. deep crankbait
4. lipless crankbait
5. chatterbait
6. swim jig
7. spinnerbait
8. underspin
9. paddle tail swimbait

### Vertical Reaction (2 lures)
10. jerkbait
11. blade bait

### Bottom Contact - Dragging (5 lures)
12. texas rig
13. carolina rig
14. football jig
15. shaky head
16. casting jig

### Hovering / Mid-Column Finesse (5 lures)
17. neko rig
18. wacky rig
19. weightless soft jerkbait
20. ned rig
21. dropshot

### Topwater - Horizontal (4 lures)
22. walking bait
23. buzzbait
24. whopper plopper
25. wake bait ← NEW

### Topwater - Precision / Vertical Surface Work (3 lures)
26. hollow body frog
27. popping frog
28. popper ← NEW

---

## Organized by Type

### HARDBAITS (11 lures)
**Can use metallic colors**

**Crankbaits:**
- shallow crankbait
- mid crankbait
- deep crankbait
- lipless crankbait

**Jerkbait:**
- jerkbait

**Topwater:**
- walking bait
- whopper plopper
- wake bait ← NEW
- popper ← NEW

**Frogs (soft body but hardbait category):**
- hollow body frog
- popping frog

### BLADED LURES (5 lures)
**Metallic hardware (blades/props)**

**With Blade Finish:**
- chatterbait (accent: gold)
- spinnerbait (accent: gold)
- underspin (accent: silver)

**With Hardware Finish:**
- buzzbait (accent: silver)

**Metal Body:**
- blade bait (primary IS metallic)

### RIG ICONS (7 lures)
**Presentation icons (hook + weight + plastic profile)**
**NO metallics allowed**

- texas rig
- carolina rig
- shaky head
- neko rig
- wacky rig
- ned rig
- dropshot

### SOFT PLASTIC BODIES (2 lures)
**Standalone plastic (not rigs)**
**NO metallics allowed**

- weightless soft jerkbait
- paddle tail swimbait

### JIGS (3 lures)
**Skirt/jig head (trailers in work_it)**

- football jig
- casting jig
- swim jig

---

## Color Zone Support

### Lures with ACCENT (Metallic Hardware) - 5 lures

**Blade Finish:**
1. chatterbait → gold (default)
2. spinnerbait → gold (default)
3. underspin → silver (default)

**Hardware Finish:**
4. buzzbait → silver (default)

**Metal Body:**
5. blade bait → primary IS metallic (no default)

### Lures with SECONDARY (Back/Flake) - 0 lures in V1
**All secondary zones set to optional (False) for V1**
**Can be enabled in future versions**

### Simple Lures (Primary Only) - 23 lures
**Everything else just has primary color**

---

## Recent Changes

### Added (December 2025)
- ✅ **wake bait** - Topwater - Horizontal
- ✅ **popper** - Topwater - Precision

### Removed (December 2025)
- ❌ **damiki rig** - Removed from pool
- ❌ **prop bait** - Not added (whopper plopper covers this)

---

## Validation Rules

### Metallics Allowed:
- All hardbaits (crankbaits, jerkbait, topwater)
- Blade bait (primary IS metal)
- Accent zone (blade/hardware finishes)

### Metallics NOT Allowed:
- Rig icons (texas rig, dropshot, etc.)
- Soft plastic bodies (soft jerkbait, swimbait)
- Secondary zone (back of lure)

### Special Cases:
- **Blade bait:** Can use metallic in PRIMARY (body plate is metal)
- **Spinnerbait:** Metallic in ACCENT only (blade finish)
- **Buzzbait:** Metallic in ACCENT only (hardware finish)

---

## Asset Key Examples

```
# Bladed lures (with accent)
spinnerbait__chartreuse_white__gold.png
chatterbait__white__gold.png
buzzbait__white__silver.png

# Blade bait (metallic primary)
blade_bait__silver.png

# Rig icons (simple)
texas_rig__green_pumpkin.png
dropshot__watermelon.png

# Hardbaits (simple)
shallow_crankbait__chartreuse.png
popper__white.png
walking_bait__bone.png

# Jigs (simple)
football_jig__green_pumpkin.png
swim_jig__black_blue.png

# Soft plastics (can have secondary in future)
paddle_tail_swimbait__pearl.png
weightless_soft_jerkbait__watermelon.png
```

---

## Summary

- **Total:** 28 lures
- **New in Dec 2025:** wake bait, popper
- **Removed:** damiki rig
- **Hardbaits:** 11 (can use metallics)
- **Bladed:** 5 (metallic hardware)
- **Rig Icons:** 7 (no metallics)
- **Soft Plastic Bodies:** 2 (no metallics)
- **Jigs:** 3 (trailer in work_it)

**All lures validated against:**
- LURE_POOL (exact strings)
- LURE_TO_PRESENTATION (correct mapping)
- LURE_ZONE_SCHEMA (zone support)
- METALLIC_COLORS (restrictions)
