# 04 — Subscriptions, Access Control, and Entitlements (BFP)

This document defines how subscriptions, access checks, and entitlements work in BassFishingPlans (BFP).
This is the authoritative reference for billing-gated behavior.

---

## 1. Subscription Model (V1)

BFP uses a **single paid subscription**.

- Billing provider: Stripe
- Billing cadence: Monthly
- No tiers
- No trials
- No free access beyond preview

Access is binary:

- Active subscriber → full access
- Not active → preview only

---

## 2. Stripe Integration Overview

### Stripe Objects Used

- Product
- Price (monthly)
- Checkout Session
- Customer
- Subscription
- Webhook events

No invoices or payments are queried directly by the app.
All state changes come from webhooks.

---

## 3. Environment Variables (Required)

All billing behavior depends on the following environment variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_MONTHLY`
- `STRIPE_WEBHOOK_SECRET`
- `WEB_BASE_URL`

If any are missing, billing must fail fast.

---

## 4. Checkout Flow

### Endpoint

`POST /billing/subscribe`

### Input

```json
{
  "email": "user@example.com"
}

Behavior
	•	Creates a Stripe Checkout Session
	•	Uses mode=subscription
	•	Associates email with customer
	•	Returns hosted checkout URL

Output
{
  "checkout_url": "https://checkout.stripe.com/..."
}
No subscription is considered active at this point.

⸻

5. Webhook Processing

Endpoint

POST /webhooks/stripe

Signature Verification
	•	All webhook payloads must be verified using STRIPE_WEBHOOK_SECRET
	•	Invalid signatures return HTTP 400

⸻

6. Subscription State Extraction

Handled exclusively in:
extract_subscription_state(event)

Supported Events

checkout.session.completed
	•	Marks subscriber active
	•	Extracts:
	•	email
	•	customer_id
	•	subscription_id

customer.subscription.updated
	•	Updates active status based on subscription status

customer.subscription.deleted
	•	Marks subscriber inactive

Other Stripe events are ignored safely.

⸻

7. Subscriber Persistence

Storage
	•	SQLite
	•	Local file: data/subscribers.sqlite3

Schema

subscribers (
  email TEXT PRIMARY KEY,
  active INTEGER,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
)


⸻

9. Access Enforcement

Preview Endpoint

/plan/preview
	•	No subscription required
	•	Limited output
	•	Includes preview footer

Member Endpoint

/plan/members
	•	Requires active subscription
	•	Full output
	•	No preview footer

Frontend must never infer access.
Backend is authoritative.

⸻

10. Preview vs Subscriber Rules (Locked)

⸻

11. Important Non-Goals
	•	No grace periods
	•	No trials
	•	No partial entitlements
	•	No client-side billing logic
	•	No Stripe polling

⸻

12. Canon Lock

This document is LOCKED for V1.

Changes require:
	•	Explicit version bump
	•	Schema compatibility check
	•	Frontend coordination

```
