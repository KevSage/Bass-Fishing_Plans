# BFP Backend Services Guide - Stripe & Email

## Overview

You have **3 interconnected services** that handle subscriptions and user management:

1. **`stripe_billing.py`** - Handles Stripe payment integration
2. **`subscribers.py`** - Local SQLite database tracking active subscribers
3. **`email_resend.py`** - Sends emails via Resend API

---

## 1. Stripe Billing Service (`stripe_billing.py`)

### What It Does

Handles all Stripe integration for subscription payments:
- Creates checkout sessions (when user clicks "Subscribe")
- Verifies webhook signatures (security - ensures events are really from Stripe)
- Extracts subscription state from webhook events

### Key Functions

#### `create_checkout_session(email: str) -> str`

**Purpose:** Generate a Stripe checkout URL for a user to subscribe

**Flow:**
```
User clicks "Subscribe" 
  → Frontend calls POST /billing/subscribe with email
  → Backend calls create_checkout_session(email)
  → Returns Stripe Checkout URL
  → Frontend redirects user to Stripe payment page
```

**Returns:** `"https://checkout.stripe.com/c/pay/cs_test_..."`

**What it needs:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_MONTHLY=price_...  # Your monthly subscription price ID from Stripe
WEB_BASE_URL=https://yourapp.com  # Where to redirect after success/cancel
```

**Important:** Stores email in 3 places for reliability:
- `customer_email` - The email field
- `metadata.email` - Session metadata
- `subscription_data.metadata.email` - Subscription metadata (survives after session)

#### `verify_webhook_and_parse_event(payload, stripe_signature) -> dict`

**Purpose:** Securely verify that webhook events are really from Stripe

**Flow:**
```
Stripe sends webhook event
  → Your /webhooks/stripe endpoint receives it
  → Calls verify_webhook_and_parse_event()
  → Validates signature (prevents fake events)
  → Returns parsed event data
```

**What it needs:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe Dashboard → Webhooks
```

**Security:** Uses HMAC signature verification - if signature is wrong, raises ValueError

#### `extract_subscription_state(event) -> Optional[Tuple[str, bool, str, str]]`

**Purpose:** Parse webhook events to determine user subscription status

**Returns:**
```python
(email, active, customer_id, subscription_id)
# Example: ("user@example.com", True, "cus_abc123", "sub_xyz789")
```

**Handles these events:**
1. **`checkout.session.completed`** - User just paid
   - Only activates if `subscription_id` is present (ignores test fixtures)
   
2. **`customer.subscription.created`** - New subscription started
   - Status: "active" or "trialing" → `active=True`
   
3. **`customer.subscription.updated`** - Subscription changed
   - Checks new status to determine if still active
   
4. **`customer.subscription.deleted`** - Subscription cancelled
   - Sets `active=False`

**Active statuses:** `"active"`, `"trialing"`  
**Inactive statuses:** `"canceled"`, `"incomplete"`, `"past_due"`, etc.

---

## 2. Subscriber Store (`subscribers.py`)

### What It Does

**Local SQLite database** that tracks who has active subscriptions.

**Table schema:**
```sql
CREATE TABLE subscribers (
    email TEXT PRIMARY KEY,
    active INTEGER NOT NULL,  -- 1 or 0 (boolean)
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT
);
```

**Database location:** `data/subscribers.sqlite3` (created automatically)

### Key Methods

#### `is_active(email: str) -> bool`

**Purpose:** Check if a user can access member features

**Usage:**
```python
from app.services.subscribers import SubscriberStore

subs = SubscriberStore()

if subs.is_active("user@example.com"):
    # Grant access to member plan
else:
    # Show preview or require subscription
```

**Used in:** `/plan/members` endpoint to verify access

#### `upsert_active(email, active, customer_id, subscription_id)`

**Purpose:** Update subscription status in database

**Usage:**
```python
# After Stripe webhook confirms subscription
subs.upsert_active(
    email="user@example.com",
    active=True,  # or False if cancelled
    stripe_customer_id="cus_abc123",
    stripe_subscription_id="sub_xyz789"
)
```

**Called by:** Webhook handler after processing Stripe events

**Behavior:**
- If email exists → Updates record
- If email doesn't exist → Creates new record
- Uses `COALESCE` to preserve customer/subscription IDs if not provided

#### `get(email: str) -> Optional[Subscriber]`

**Purpose:** Get full subscriber details

**Returns:**
```python
Subscriber(
    email="user@example.com",
    active=True,
    stripe_customer_id="cus_abc123",
    stripe_subscription_id="sub_xyz789"
)
```

---

## 3. Email Service (`email_resend.py`)

### What It Does

Sends emails using [Resend](https://resend.com/) API.

**Currently implements:** Magic link emails (passwordless authentication)

### Function

#### `send_magic_link(to_email: str, link_url: str)`

**Purpose:** Send a passwordless login link to user

**Email content:**
```html
Subject: Your Bass Fishing Plans access link

Here's your secure link:
[link_url]

This link expires in 24 hours.
```

**What it needs:**
```env
RESEND_API_KEY=re_...  # From Resend dashboard
EMAIL_FROM=plans@bassfishingplans.com  # Your verified sending domain
```

**Usage example:**
```python
from app.services.email_resend import send_magic_link

# Generate a magic link token
token = create_auth_token(email)
link = f"https://bassfishingplans.com/auth?token={token}"

# Send email
send_magic_link("user@example.com", link)
```

**Note:** This function is defined but **not currently used** in your main.py - you'd need to add magic link auth endpoints to use it.

---

## How They Work Together

### Subscription Flow

```
1. User clicks "Subscribe" on frontend
   ↓
2. Frontend: POST /billing/subscribe { "email": "user@example.com" }
   ↓
3. stripe_billing.create_checkout_session(email)
   → Returns Stripe Checkout URL
   ↓
4. Frontend redirects user to Stripe payment page
   ↓
5. User enters payment info and submits
   ↓
6. Stripe processes payment
   ↓
7. Stripe sends webhook to POST /webhooks/stripe
   ↓
8. Backend:
   a) verify_webhook_and_parse_event() - validates signature
   b) extract_subscription_state() - gets (email, active, ids)
   c) subscribers.upsert_active() - saves to database
   ↓
9. User now has active subscription
   ↓
10. When user requests plan:
    - Backend calls subscribers.is_active(email)
    - If True → grant access to /plan/members
    - If False → return 403 or redirect to /billing/subscribe
```

### Webhook Event Flow

```
Stripe Event → /webhooks/stripe endpoint
  ↓
verify_webhook_and_parse_event(payload, signature)
  → Validates it's really from Stripe
  → Returns event dict
  ↓
extract_subscription_state(event)
  → Parses email, active status, IDs
  → Returns (email, active, customer_id, subscription_id)
  ↓
subscribers.upsert_active(...)
  → Saves/updates in SQLite
  ↓
User's subscription status is now current
```

---

## Required Environment Variables

### Stripe
```env
STRIPE_SECRET_KEY=sk_test_...               # From Stripe Dashboard → API Keys
STRIPE_PRICE_ID_MONTHLY=price_...           # From Stripe Dashboard → Products
STRIPE_WEBHOOK_SECRET=whsec_...             # From Stripe Dashboard → Webhooks
WEB_BASE_URL=https://bassfishingplans.com  # Your frontend URL
```

### Resend (Email)
```env
RESEND_API_KEY=re_...                       # From Resend Dashboard
EMAIL_FROM=plans@bassfishingplans.com       # Your verified domain
```

---

## Setup Checklist

### Stripe Setup

1. **Create Stripe account** → https://dashboard.stripe.com
2. **Create product:**
   - Dashboard → Products → Create product
   - Name: "Bass Fishing Plans Monthly"
   - Price: $9.99/month (or your price)
   - Copy the `price_id` (starts with `price_`)
3. **Get API keys:**
   - Dashboard → Developers → API Keys
   - Copy "Secret key" (starts with `sk_test_` for test mode)
4. **Set up webhook:**
   - Dashboard → Developers → Webhooks → Add endpoint
   - Endpoint URL: `https://yourapi.com/webhooks/stripe`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the "Signing secret" (starts with `whsec_`)

### Resend Setup

1. **Create Resend account** → https://resend.com
2. **Add your domain:**
   - Dashboard → Domains → Add domain
   - Add DNS records to verify
3. **Get API key:**
   - Dashboard → API Keys → Create API Key
   - Copy the key (starts with `re_`)

---

## Testing Stripe Locally

### Test Mode Webhooks

Stripe can't send webhooks to `localhost` directly. Use the Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:8000/webhooks/stripe
```

This gives you a webhook secret like `whsec_...` - use it in `.env` for local testing.

### Test Cards

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

Any future expiry date and any CVC works.

---

## Current Usage in main.py

### Billing Endpoint

```python
@app.post("/billing/subscribe")
def billing_subscribe(body: SubscribeRequest):
    email = body.email.strip().lower()
    url = create_checkout_session(email=email)
    return {"checkout_url": url}
```

**Flow:** User provides email → Get Stripe checkout URL → Return to frontend

### Webhook Endpoint

```python
@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    
    event = verify_webhook_and_parse_event(payload=payload, stripe_signature=sig)
    update = extract_subscription_state(event)
    
    if update:
        email, active, customer_id, subscription_id = update
        subs.upsert_active(email, active=active, 
                          stripe_customer_id=customer_id,
                          stripe_subscription_id=subscription_id)
    
    return {"ok": True}
```

**Flow:** Stripe sends event → Verify → Extract status → Update database

### Member Access Check

```python
@app.post("/plan/members")
async def plan_members(body: MemberPlanRequest):
    email = body.email.strip().lower()
    
    if not subs.is_active(email):
        raise HTTPException(status_code=403, detail="Subscription required")
    
    # Generate plan...
```

**Flow:** Check if user has active subscription → Grant/deny access

---

## Email Service - NOT Currently Used

The `email_resend.py` file exists but **isn't called anywhere** in your current main.py.

**You would use it for:**
- Magic link authentication (passwordless login)
- Welcome emails after subscription
- Password reset emails
- Plan delivery emails

**To implement magic link auth, you'd need:**
```python
@app.post("/auth/send-link")
async def send_auth_link(body: EmailRequest):
    token = create_secure_token(body.email)
    link = f"{WEB_BASE_URL}/auth/verify?token={token}"
    send_magic_link(body.email, link)
    return {"message": "Check your email"}

@app.get("/auth/verify")
async def verify_magic_link(token: str):
    email = verify_token(token)
    # Create session, return JWT, etc.
```

---

## Migration Notes

### SQLite Database

**Location:** `data/subscribers.sqlite3`

**Backup:**
```bash
cp data/subscribers.sqlite3 data/subscribers.backup.sqlite3
```

**View data:**
```bash
sqlite3 data/subscribers.sqlite3
sqlite> SELECT * FROM subscribers;
```

**For production:** Consider migrating to PostgreSQL/MySQL for:
- Better concurrent writes
- Cloud hosting
- Automatic backups

**SQLite is fine for:**
- MVP / launch
- < 1000 subscribers
- Single-server deployment

---

## Common Issues & Solutions

### "Missing required env var: STRIPE_SECRET_KEY"

**Problem:** Environment variable not set  
**Solution:** Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
```

### "Missing Stripe-Signature header"

**Problem:** Webhook request didn't come from Stripe  
**Solution:** 
- In production: Stripe sends signature automatically
- In development: Use `stripe listen --forward-to localhost:8000/webhooks/stripe`

### Webhook not activating user

**Problem:** Email not found in webhook event  
**Solution:** Ensure you're setting email in metadata:
```python
# In create_checkout_session:
subscription_data={"metadata": {"email": email}}  # ← This is critical
```

### User subscribed but still getting 403

**Problem:** Database not updated or email mismatch  
**Solution:**
1. Check database: `sqlite3 data/subscribers.sqlite3` → `SELECT * FROM subscribers;`
2. Verify email is lowercase in both places
3. Check webhook logs for errors

---

## Summary

**What you need to know:**

1. **Stripe handles payments** - Users subscribe via Stripe Checkout
2. **Webhooks keep database current** - Stripe notifies you of subscription changes
3. **SQLite stores who's active** - Local database for fast access checks
4. **Email service is ready** - But not currently used (optional feature)

**To go live:**
1. Set all env vars in `.env`
2. Switch Stripe from test mode to live mode
3. Update webhook endpoint in Stripe dashboard
4. Test the full subscription flow
5. Consider migrating SQLite to PostgreSQL for scale

**You're good to go for MVP!** The code is solid and ready for launch. 🚀
