# Bass Fishing Plans Backend - Deployment Guide

## ✅ Backend Rebuild Complete

The entire backend has been rebuilt with clean architecture, canonical compliance, and production-ready features.

---

## File Structure

```
apps/api/app/
├── main.py                          # ← NEW: Complete API with all endpoints
├── canon/
│   └── pools.py                     # ← UPDATED: 28 lures, color zones, canonical rules
├── services/
│   ├── phase_logic.py               # ← NEW: Regional phase determination
│   ├── rate_limits.py               # ← NEW: 30-day preview + 3-hour member
│   ├── plan_links.py                # ← NEW: Shareable plan URLs
│   ├── weather.py                   # ← UPDATED: High/low temps from OpenWeather
│   ├── email_service.py             # ← NEW: Resend integration
│   ├── pdf_generator.py             # ← NEW: Mobile + A4 HTML generation
│   ├── llm_plan_service.py          # ← UPDATED: Pattern 2, color zones, all guardrails
│   ├── subscribers.py               # ← EXISTING: Stripe subscription tracking
│   └── stripe_billing.py            # ← EXISTING: Stripe integration
└── data/                            # ← Auto-created SQLite databases
    ├── subscribers.sqlite3
    ├── rate_limits.sqlite3
    └── plan_links.sqlite3
```

---

## Environment Variables Required

Create `.env` file:

```bash
# ========================================
# CORE
# ========================================
BFP_API_KEY=your-api-key-here

# ========================================
# LLM
# ========================================
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini
LLM_PLAN_ENABLED=1

# ========================================
# WEATHER
# ========================================
OPENWEATHER_API_KEY=your-openweather-key

# ========================================
# EMAIL (RESEND)
# ========================================
RESEND_API_KEY=re-your-resend-key
RESEND_AUDIENCE_ID=aud_your-audience-id  # Optional
EMAIL_FROM=plans@bassfishingplans.com

# ========================================
# WEB
# ========================================
WEB_BASE_URL=https://bassfishingplans.com

# ========================================
# STRIPE
# ========================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Installation

```bash
# Install dependencies
pip install fastapi uvicorn pydantic httpx requests sqlite3

# Or with poetry/pipenv
poetry install
```

---

## Running the Server

### Development
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## API Endpoints

### 1. Generate Plan (Unified)
```http
POST /plan/generate
Content-Type: application/json

{
  "email": "user@example.com",
  "latitude": 34.3583,
  "longitude": -86.2944,
  "location_name": "Lake Guntersville"
}
```

**Response:**
```json
{
  "plan_url": "https://bassfishingplans.com/plan/view/abc123...",
  "token": "abc123def456...",
  "is_member": false,
  "email_sent": true,
  "plan": {
    "base_lure": "spinnerbait",
    "colors": {
      "primary_color": "chartreuse/white",
      "accent_color": "gold",
      "asset_key": "spinnerbait__chartreuse_white__gold.png"
    },
    "targets": [...],
    "work_it": [...],
    "outlook_blurb": "...",
    "conditions": {...}
  }
}
```

### 2. View Plan
```http
GET /plan/view/{token}
```

**Response:**
```json
{
  "plan": {...},
  "is_member": false,
  "created_at": 1703001234,
  "views": 5,
  "download_urls": {
    "mobile_dark": "/plan/download/abc123.../mobile",
    "a4_printable": "/plan/download/abc123.../a4"
  }
}
```

### 3. Download Plan (Mobile)
```http
GET /plan/download/{token}/mobile
```
Returns: HTML file (mobile dark theme)

### 4. Download Plan (A4)
```http
GET /plan/download/{token}/a4
```
Returns: HTML file (A4 printable)

### 5. Subscribe
```http
POST /billing/subscribe
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_..."
}
```

### 6. Stripe Webhook
```http
POST /webhooks/stripe
```
Handles subscription lifecycle events

---

## Rate Limiting Behavior

### Non-Members (Preview)
- **Limit:** 1 plan every 30 days
- **Response when blocked:**
  ```json
  {
    "error": "rate_limit_preview",
    "message": "You can request one preview every 30 days...",
    "seconds_remaining": 2592000,
    "upgrade_url": "https://bassfishingplans.com/subscribe?email=..."
  }
  ```

### Members
- **Limit:** 1 plan every 3 hours
- **Response when blocked:**
  ```json
  {
    "error": "rate_limit_member",
    "message": "Please wait 2.5 hours between plan requests",
    "seconds_remaining": 9000
  }
  ```

---

## Plan Generation Flow

```
1. User submits: email + location
   ↓
2. Check: Is user a subscriber?
   ├─ YES → Check 3-hour cooldown
   └─ NO  → Check 30-day preview limit
   ↓
3. Get weather (high/low temps)
   ↓
4. Determine phase (regional logic based on latitude)
   ↓
5. Generate plan via LLM
   ├─ Preview: Pattern 1 only
   └─ Member: Pattern 1 + Pattern 2
   ↓
6. Expand color zones
   └─ Adds: primary_color, accent_color, asset_key, etc.
   ↓
7. Save plan link (permanent, shareable URL)
   ↓
8. Send email (preview only)
   └─ Includes plan link + marketing pitch
   ↓
9. Return plan + URL to frontend
```

---

## Color Zone System

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
    "asset_key": "spinnerbait__chartreuse_white__gold.png"
  }
}
```

**Frontend Uses:**
```jsx
<img src={`/lures/${plan.colors.asset_key}`} />
```

---

## Database Management

### View Rate Limits
```bash
sqlite3 data/rate_limits.sqlite3
sqlite> SELECT * FROM preview_requests;
sqlite> SELECT * FROM member_requests;
```

### View Plan Links
```bash
sqlite3 data/plan_links.sqlite3
sqlite> SELECT token, email, is_member, created_at, views FROM plan_links;
```

### View Subscribers
```bash
sqlite3 data/subscribers.sqlite3
sqlite> SELECT * FROM subscribers WHERE active=1;
```

### Backup Databases
```bash
cp data/*.sqlite3 backups/
```

---

## Testing the API

### 1. Test Preview Plan Generation
```bash
curl -X POST http://localhost:8000/plan/generate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "latitude": 34.36,
    "longitude": -86.29,
    "location_name": "Lake Guntersville"
  }'
```

### 2. Test Rate Limit (Try Again Immediately)
```bash
# Should return 429 with seconds_remaining
curl -X POST http://localhost:8000/plan/generate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "latitude": 34.36,
    "longitude": -86.29,
    "location_name": "Lake Guntersville"
  }'
```

### 3. Test Plan Viewing
```bash
# Use token from previous response
curl http://localhost:8000/plan/view/abc123def456...
```

### 4. Test Subscribe Flow
```bash
curl -X POST http://localhost:8000/billing/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## Stripe Webhook Setup

### Development (Use Stripe CLI)
```bash
stripe listen --forward-to localhost:8000/webhooks/stripe
```

This gives you a webhook secret starting with `whsec_...`

### Production
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourapi.com/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret to `.env`

---

## Migration from Old Backend

### Files to Delete
```bash
rm app/services/open_ai_plan_generator.py
rm app/services/openai_rewrite.py
rm app/patterns/catalog.py  # Merged into canon/pools.py
```

### Files to Replace
```bash
# Copy new files
cp new_backend/main.py app/
cp new_backend/pools.py app/canon/
cp new_backend/phase_logic.py app/services/
cp new_backend/rate_limits.py app/services/
cp new_backend/plan_links.py app/services/
cp new_backend/weather.py app/services/
cp new_backend/email_service.py app/services/
cp new_backend/pdf_generator.py app/services/
cp new_backend/llm_plan_service.py app/services/
```

---

## Monitoring & Logging

### Check Service Health
```bash
curl http://localhost:8000/health
```

### Watch Logs
```bash
# Development
tail -f logs/app.log

# Production (with systemd)
journalctl -u bfp-api -f
```

### Key Metrics to Monitor
- Plan generation success rate
- LLM validation failures
- Rate limit hits (preview vs member)
- Email delivery success
- Stripe webhook processing

---

## Troubleshooting

### "Missing required env var: OPENAI_API_KEY"
**Fix:** Add to `.env` file

### "Weather service error"
**Check:** OpenWeather API key is valid and has calls remaining

### "Email send failed"
**Check:** Resend API key and EMAIL_FROM domain is verified

### "LLM plan validation failed"
**Check:** LLM logs for which validation rule failed
**Common causes:**
- Invalid lure name (not in pool)
- Invalid color (not in pool)
- Metallic on soft plastic
- Depth mentions in text

### "Rate limit not working"
**Check:** SQLite database permissions
```bash
ls -la data/rate_limits.sqlite3
```

---

## Production Deployment

### Using Docker (Recommended)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app
COPY .env .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Systemd
```ini
[Unit]
Description=Bass Fishing Plans API
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/bfp-api
Environment="PATH=/var/www/bfp-api/venv/bin"
ExecStart=/var/www/bfp-api/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
```

---

## What's Next: Frontend

The backend is complete and ready. When building frontend:

1. **Map Selection:** User picks lake via Mapbox
2. **Plan Request:** Frontend calls `POST /plan/generate`
3. **Display Plan:** Show plan data + lure images
4. **Lure Images:** Load `/lures/${plan.colors.asset_key}`
5. **Downloads:** Links to mobile/A4 HTML downloads
6. **Subscription:** Stripe checkout integration

Backend provides everything frontend needs - just consume the API.

---

## Support

**Issues?** Check:
1. Environment variables set correctly
2. Database files have correct permissions
3. API keys are valid
4. Logs for error details

**Backend is production-ready!** 🚀
