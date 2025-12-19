# 🔐 BFP BACKEND FINAL VERIFICATION RUNBOOK (LOCKED)

This document is a zero-ambiguity, zero-drift execution guide.  
Follow steps in order. Do not skip. Do not improvise.

Nothing here mutates production.  
Nothing here deletes data.  
Everything is reversible.

---

## SYSTEMS INVOLVED (MENTAL MODEL)

You are working with three independent systems:

1. FastAPI backend
2. Stripe CLI (local simulator + webhook forwarder)
3. SQLite subscriber store (local file)

They interact only via:

- HTTP
- Environment variables
- Explicit function calls

There is no background magic.

---

## REQUIRED LOCATION

You must be inside:

Bass_Fishing_Plans/apps/api

Verify:

pwd

Expected output ends with:

/Bass_Fishing_Plans/apps/api

If not, stop and cd correctly.

---

## 1️⃣ ENVIRONMENT VARIABLES (READ-ONLY CHECK)

Inspect .env:

cat .env

You must see at least:

STRIPE*SECRET_KEY=sk_test*...
STRIPE*PRICE_ID_MONTHLY=price*...
STRIPE*WEBHOOK_SECRET=whsec*...
WEB_BASE_URL=http://localhost:5173

These must be test keys. Never sk_live.

---

Verify Python sees them:

python - <<'EOF'
import os

keys = [
"STRIPE_SECRET_KEY",
"STRIPE_PRICE_ID_MONTHLY",
"STRIPE_WEBHOOK_SECRET",
"WEB_BASE_URL",
]

for k in keys:
v = os.getenv(k)
print(k, "=>", (v[:10] + "...") if v else "MISSING")
EOF

Expected:

- All keys present
- No MISSING

If any are missing, fix .env before continuing.

---

## 2️⃣ START FASTAPI SERVER (NO STRIPE YET)

Run:

uvicorn app.main:app --reload

Wait until you see:

Application startup complete

Leave this terminal running.

---

## 3️⃣ HEALTH CHECK (SAFE)

In a new terminal:

curl http://127.0.0.1:8000/health

Expected:

{"ok":true}

If not, the backend is not running correctly.

---

## 4️⃣ STRIPE CLI — WEBHOOK TUNNEL (READ-ONLY)

In a third terminal:

stripe listen --forward-to http://127.0.0.1:8000/webhooks/stripe

You will see:

Ready! You are using Stripe API Version [...]
Your webhook signing secret is whsec_XXXXXXXX

This secret must match .env.  
If it does not, update .env and restart FastAPI.

Leave this terminal running.

---

## 5️⃣ CREATE CHECKOUT SESSION (CONTROLLED MUTATION)

This creates a test checkout session only.

curl -X POST http://127.0.0.1:8000/billing/subscribe \
 -H "Content-Type: application/json" \
 -d '{"email":"test+checkout@bassfishingplans.com"}'

Expected response:

{"checkout_url":"https://checkout.stripe.com/..."}

---

## 6️⃣ COMPLETE CHECKOUT (STRIPE HOSTED UI)

Open the checkout_url in your browser.

Use Stripe test card:

4242 4242 4242 4242  
Any future date  
Any CVC  
Any ZIP

Complete checkout.

---

## 7️⃣ CONFIRM WEBHOOK FLOW (OBSERVATION ONLY)

In the Stripe listen terminal, you must see:

--> checkout.session.completed
<-- [200] POST /webhooks/stripe

In the FastAPI terminal, you must see:

STRIPE EVENT: checkout.session.completed UPDATE: (
'test+checkout@bassfishingplans.com',
True,
'cus*...',
'sub*...'
)

If UPDATE shows None, stop. Do not proceed.

---

## 8️⃣ VERIFY SUBSCRIBER STORE (READ-ONLY)

Run:

python - <<'EOF'
from app.services.subscribers import SubscriberStore

store = SubscriberStore()
row = store.get("test+checkout@bassfishingplans.com")
print("row:", row)
print("is_active:", store.is_active("test+checkout@bassfishingplans.com"))
EOF

Expected:

row: Subscriber(
email='test+checkout@bassfishingplans.com',
active=True,
stripe*customer_id='cus*...',
stripe*subscription_id='sub*...'
)
is_active: True

If active is False, webhook handling is broken.

---

## 9️⃣ WEBHOOK REPLAY TEST (SAFE)

This does not charge anything.

stripe trigger checkout.session.completed

Expected:

- Stripe CLI prints Trigger succeeded
- FastAPI logs show checkout.session.completed
- No errors
- Subscriber remains active

---

## 10️⃣ FINAL SIGN-OFF CHECKLIST

All must be true:

- /health returns 200
- /billing/subscribe returns checkout_url
- Stripe checkout completes successfully
- checkout.session.completed webhook processed
- Subscriber stored as active
- customer_id and subscription_id saved
- No 400 responses from webhook endpoint

If all true → BACKEND IS LOCKED ✅

---

## FINAL STATEMENT

The backend is now:

- Deterministic
- Stripe-correct
- Fault-tolerant
- Frontend-ready

No further backend changes are required for V1.
