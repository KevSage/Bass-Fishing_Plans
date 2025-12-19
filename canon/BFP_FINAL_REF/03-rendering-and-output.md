# 03 — Rendering & Output (BFP)

This document describes how BassFishingPlans turns a fully-built plan object into user-facing artifacts.
This layer contains **no decision logic**. It is purely representational.

---

## Responsibilities

Rendering is responsible for:
- Transforming a deterministic plan object into readable output
- Applying output canon (order, tone, structure)
- Handling preview vs subscriber differences
- Producing artifacts suitable for mobile and print

Rendering does **not**:
- Choose lures
- Change colors
- Modify targets
- Regenerate plans

---

## Primary Entry Point

`render_plan_markdown(data: Dict[str, Any]) -> str`

Location:
```
app/render/plan_markdown.py
```

Input:
- `data` is the finalized plan dictionary returned from the pattern engine
- It already contains:
  - recommended_lures
  - color_recommendations
  - targets
  - strategy tips
  - conditions
  - day progression

Output:
- A single markdown string
- This markdown feeds:
  - Mobile Field Plan renderer
  - Printable Reference Plan renderer

---

## Preview vs Subscriber Handling

Preview state is **explicit**, never inferred.

Source:
```
data["conditions"]["is_preview"] == True
```

Rules:
- Preview plans:
  - Omit optional refinements
  - Omit advanced execution nuance
  - Include subscription footer (frontend only)
- Subscriber plans:
  - Include full refinements
  - Include full day progression

Rendering must never:
- Guess subscription status
- Hide logic conditionally without the flag

---

## Section Order (Locked)

1. Header
2. Conditions summary
3. Pattern 1
4. Targets
5. Work It
6. Gear
7. Optional Refinements (subscriber only)
8. Day Progression

No reordering permitted.

---

## Elite Refinements

Function:
```
build_elite_refinements(data: Dict[str, Any]) -> List[str]
```

Rules:
- Deterministic
- 2–4 bullets maximum
- Never introduce:
  - New lures
  - New techniques
  - New colors
- Only adjust cadence, profile, or execution

If preview:
- Function returns empty list

---

## Retrieve / Cadence Bullets

Function:
```
build_retrieve_bullets(data)
```

Purpose:
- Explain *how* to fish the recommended lure
- Must be actionable
- Must remain concise

Rules:
- No teaching tone
- No theory
- No repetition of targets

---

## Day Progression

Input:
```
data["day_progression"]
```

Characteristics:
- Ordered list
- Applies primarily to Pattern 1
- Describes timing-based adjustments, not new patterns

Rendering:
- Simple bullet list
- No embellishment

---

## Tone Rules

All rendered text must be:
- Calm
- Confident
- Professional
- Non-hyped

Never:
- Explain *why the system chose something*
- Use teaching language
- Introduce uncertainty

---

## Output Stability

Given identical plan input:
- Markdown output must be byte-identical
- No timestamps
- No randomness

This ensures:
- Deterministic hashing
- Preview/subscriber parity
- Reliable caching

---

END
