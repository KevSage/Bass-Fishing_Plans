# apps/api/app/services/stripe_billing.py
from __future__ import annotations

import os
from typing import Any, Dict, Optional, Tuple

import stripe


def _env(name: str) -> str:
    v = os.getenv(name)
    if not v:
        raise RuntimeError(f"Missing required env var: {name}")
    return v


def init_stripe() -> None:
    stripe.api_key = _env("STRIPE_SECRET_KEY")


def create_checkout_session(*, email: str) -> str:
    """
    Returns Stripe Checkout URL for subscription.
    """
    init_stripe()

    price_id = _env("STRIPE_PRICE_ID_MONTHLY")
    web_base = _env("WEB_BASE_URL")

    # IMPORTANT:
    # - Put email into BOTH session metadata and subscription metadata.
    # - This allows customer.subscription.* webhooks to include a reliable email pointer.
    print("Stripe key prefix:", stripe.api_key[:7], "price_id:", price_id)

    session = stripe.checkout.Session.create(
        mode="subscription",
        payment_method_types=["card"],
        customer_email=email,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{web_base}/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{web_base}/cancel",
        allow_promotion_codes=False,
        client_reference_id=email,
        metadata={"email": email},
        subscription_data={
            "metadata": {"email": email},
            "trial_settings": {
                "end_behavior": {"missing_payment_method": "cancel"}
            },
            "trial_period_days": 5,  # keep if it’s working for you; if not, remove and set trial_end instead
        },
    )
    return session.url


def create_portal_session(*, customer_id: str) -> str:
    """
    Returns Stripe Customer Portal URL for managing subscription.
    """
    init_stripe()
    web_base = _env("WEB_BASE_URL")

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{web_base}/account",
    )
    return session.url


def verify_webhook_and_parse_event(
    *,
    payload: bytes,
    stripe_signature: Optional[str],
) -> Dict[str, Any]:
    """
    Verifies webhook signature and returns Stripe event dict.
    """
    init_stripe()
    wh_secret = _env("STRIPE_WEBHOOK_SECRET")
    if not stripe_signature:
        raise ValueError("Missing Stripe-Signature header")

    event = stripe.Webhook.construct_event(
        payload=payload,
        sig_header=stripe_signature,
        secret=wh_secret,
    )
    return event
# apps/api/app/services/stripe_billing.py

def extract_subscription_state(event: Dict[str, Any]):
    # ... existing code ...
    if etype in ("customer.subscription.created", "customer.subscription.updated"):
        obj = event.get("data", {}).get("object", {})
        customer_id = obj.get("customer")
        
        # Try metadata first
        email = (obj.get("metadata", {}) or {}).get("email")
        
        # FALLBACK: If metadata is empty (as seen in your event JSON)
        if not email and customer_id:
            import stripe
            customer = stripe.Customer.retrieve(customer_id)
            email = getattr(customer, 'email', None)
            
        if email:
            status = (obj.get("status") or "").lower()
            active = status in ("active", "trialing")
            return (email.lower().strip(), active, customer_id, obj.get("id"))
    return None