# Backend Architecture — BassFishingPlans (BFP)

This document describes the backend architecture of BassFishingPlans in practical, implementation-level detail.
It assumes familiarity with FastAPI, Pydantic, and Python services.

---

## 1. High-Level Layout

apps/api/
├── app/
│   ├── main.py
│   ├── routes/
│   │   ├── health.py
│   │   ├── plan_preview.py
│   │   ├── plan_members.py
│   │   ├── billing.py
│   │   └── webhooks.py
│   ├── schemas/
│   │   ├── plan_requests.py
│   │   ├── plan_responses.py
│   │   └── billing.py
│   ├── services/
│   │   ├── weather.py
│   │   ├── stripe_billing.py
│   │   ├── subscribers.py
│   │   └── snapshot_hash.py
│   ├── patterns/
│   │   ├── context.py
│   │   ├── pro_builder.py
│   │   └── elite_refinements.py
│   ├── render/
│   │   ├── markdown.py
│   │   └── retrieve_rules.py
│   └── data/
│       └── subscribers.sqlite3

---

## 2. Execution Flow (Subscriber)

1. Client calls POST /plan/members
2. FastAPI validates MemberPlanRequest
3. Weather snapshot resolved upstream (session layer)
4. pro_builder.build_pro_pattern() executes
5. Elite refinements appended (subscriber-only)
6. Markdown renderer produces final output
7. Response returned as MemberPlanResponse

No frontend logic affects plan decisions.

---

## 3. Execution Flow (Preview)

1. Client calls POST /plan/preview
2. ZIP → geo lookup
3. Weather snapshot resolved
4. Same pro_builder path
5. Preview flag suppresses elite sections
6. Email optionally captured
7. PreviewResponse returned

Preview is intentionally incomplete.

---

## 4. Determinism Guarantees

Deterministic inputs:
- Weather snapshot
- Lat/Lon
- Trip date
- Presentation family logic

Snapshot hash ensures reproducibility.

---

## 5. Stripe Integration

stripe_billing.py owns:
- Checkout session creation
- Webhook verification
- Event parsing

SubscriberStore persists:
- email
- active flag
- customer_id
- subscription_id

Stripe is never queried synchronously during plan generation.

---

## 6. What Is Explicitly Not Here

- No mapbox backend logic
- No vision
- No async background jobs
- No caching layer
- No experimentation framework

This is intentional.

---

END
