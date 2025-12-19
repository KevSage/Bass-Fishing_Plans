# 02-pattern-engine.md

## BassFishingPlans — Pattern Engine (Authoritative)

This document explains, in detail, how the **BFP Pattern Engine** works.
It is written so you can reason about, modify, or extend the system yourself without drift.

This is **not marketing**.
This is the mechanical truth of how plans are produced.

---

## 1. Purpose of the Pattern Engine

The Pattern Engine exists to answer **one question**:

> “Given today’s conditions on this water, what _presentation_ gives me the highest probability of success?”

Key constraints:

- One primary plan
- One counter-condition plan
- No bait lists
- No option overload
- Deterministic output

The engine preserves angler judgment by **reducing decision space**, not expanding it.

---

## 2. Core Design Philosophy

### Presentation-First (Non-Negotiable)

Patterns are selected at the **presentation family** level.

Lures are **expressions** of presentation — never the starting point.

This prevents:

- “Try everything” behavior
- Random lure churn
- AI-looking outputs

---

## 3. Inputs to the Engine

### 3.1 Required (Resolved Upstream)

The engine itself **never calls external APIs**.

It receives:

- Weather snapshot (already resolved)
- Location (lat/lon, optional but preferred)
- Date or month (for seasonal phase)

This separation is intentional and locked.

---

### 3.2 Pro / Member Request Shape (Conceptual)

The engine expects a request equivalent to:

- latitude / longitude (optional)
- trip_date OR month
- optional water hints:
  - clarity
  - bottom_composition
  - forage
  - depth_ft

These hints **refine**, but never dominate, logic.

---

## 4. Weather Contract (Critical)

Weather is consumed via a **WeatherContext** object.

Rules:

- WeatherContext is created upstream
- Pattern engine only reads values
- No background refresh
- No API calls
- Timestamp is runtime-only (not hashed)

Weather values used:

- temp_f
- wind_speed
- sky_condition

---

## 5. Deterministic Snapshot Hash

Each plan includes a `snapshot_hash`.

Purpose:

- Prevent silent regeneration
- Allow plan comparison
- Support caching/debugging
- Establish environmental identity

Hash inputs include:

- Weather (normalized)
- Latitude / longitude (if present)
- Stable config values

Hash does NOT include:

- Runtime timestamps
- Random values
- UI-only fields

---

## 6. Seasonal Phase Classification

Phase is derived from:

- Month (trip_date > explicit month > weather timestamp)
- Water temperature

Phases include:

- winter
- pre-spawn
- spawn
- post-spawn
- summer
- late-summer
- fall
- late-fall

This phase influences:

- Allowed presentations
- Depth bias
- Topwater gating

---

## 7. Presentation Families (Canonical)

The engine operates on **exactly seven** presentation families:

- surface_chase
- surface_ambush
- horizontal_moving
- slow_roll_glide
- bottom_dragging
- bottom_lift_drop
- vertical_hover

These are internal IDs.
UI-facing labels are mapped later.

---

## 8. Behavior Groups (Anti-Duplication Rule)

Each presentation belongs to a **behavior group**:

Examples:

- surface_chase → roaming_top
- bottom_dragging → holding_bottom
- vertical_hover → holding_vertical

Rule:

> Pattern 2 must not belong to the same behavior group as Pattern 1.

This guarantees:

- Different fish positioning
- Different water
- Different execution

If violated → INVALID PLAN.

---

## 9. Signal Extraction

Raw inputs are converted into signals:

Signals include:

- is_cold
- is_hot
- is_windy
- is_calm
- is_low_light
- seasonal flags

Signals are boolean or coarse-grained.
No fuzzy AI logic here.

---

## 10. Family Scoring

Each presentation family receives a score based on signals.

Examples:

- Winter heavily boosts vertical_hover
- Wind boosts horizontal_moving
- Cold suppresses surface families
- Calm boosts subtle presentations

Scores are:

- Integer-based
- Deterministic
- Tie-broken by fixed family order

No randomness. Ever.

---

## 11. Primary Family Selection

Primary family = highest scoring family.

Tie-breaking rule:

- Earlier family in canonical list wins

This ensures:

- Stable output
- No flickering plans

---

## 12. Counter Family Selection

Counter family rules:

- Must differ from primary family
- Must differ in behavior group
- Must still be seasonally valid

Counter plan is **not a backup lure**.
It is a different way to fish the lake.

---

## 13. Depth Zone Assignment

Depth zones are **buckets**, not measurements.

Examples:

- ultra_shallow
- mid_shallow
- mid_depth
- deep

Used for:

- UI continuity
- Light filtering
- Angler expectation-setting

---

## 14. Lure Resolution (Expression Layer)

Once a presentation family is chosen:

- A small, capped list of lures is returned
- Usually 2–3
- Ordered by relevance

Rules:

- No new logic introduced here
- Lures must be realistic
- Seasonal sanity enforced (no winter buzzbaits)

---

## 15. Color Resolution

Color is **data**, not decoration.

Base logic:

- Low light / wind → darker / higher contrast
- Bright / calm → natural tones

Color recommendations:

- 2 max
- Passed to UI as strings
- UI must render exactly as given

No frontend interpretation allowed.

---

## 16. Gear Resolution

Gear is derived from:

- Presentation family
- Lure category

Rules:

- Conservative
- Familiar
- No exotic setups

Gear exists to remove friction, not teach.

---

## 17. Targets (Where)

Targets are phrased as **positioning guidance**, not spots.

Examples:

- “Secondary points and channel swings”
- “Breaks near spawning pockets”

Targets are deduplicated and capped.

---

## 18. Strategy Tips (How)

Tips explain **execution**, not theory.

Rules:

- Actionable
- Calm
- No teaching tone
- No “why bass do X” explanations

---

## 19. Pattern Summary (Why)

One short paragraph explaining:

- Why this presentation fits today
- In plain, professional language

Used heavily in UI and PDFs.

---

## 20. Output Assembly

The engine returns a single object containing:

- Primary plan
- Counter plan (embedded)
- Conditions
- Snapshot hash
- Summary
- Metadata

Rendering is handled elsewhere.

---

## 21. What the Engine Does NOT Do

- No user preference learning
- No AI inference
- No lure brand logic
- No lake-specific heuristics (yet)
- No mapbox calls
- No clarity “truth” claims

Those belong in future versions.

---

## 22. Stability Guarantee

If:

- Inputs are the same
- Weather snapshot is the same
- Code is unchanged

Then:

> Output will be identical.

This is intentional and enforced.

---

## 23. Lock Statement

The Pattern Engine is:

- Deterministic
- Presentation-first
- Calm
- Opinionated
- Trust-preserving

Any change to this file requires:

- Explicit version bump
- Canon review
- Re-validation of Pattern 2 rules

---

END OF DOCUMENT
