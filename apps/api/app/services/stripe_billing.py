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

def extract_subscription_state(event: Dict[str, Any]) -> Optional[Tuple[str, bool, str, str]]:
    """
    Extracts (email, active_status, customer_id, subscription_id) from Stripe events.
    Handles both Checkout sessions and direct Subscription updates.
    """
    # ✅ FIX 1: Define etype from the event object
    etype = event.get("type")
    obj = event.get("data", {}).get("object", {})

    # Case A: User signs up via the website (Checkout)
    if etype == "checkout.session.completed":
        email = obj.get("customer_email") or (obj.get("metadata") or {}).get("email")
        customer_id = obj.get("customer")
        subscription_id = obj.get("subscription")
        
        if email and customer_id and subscription_id:
            # Checkout completion implies active/trialing status
            return (email.lower().strip(), True, customer_id, subscription_id)

    # Case B: Manual Dashboard additions or status changes (Subscription)
    elif etype in ("customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"):
        customer_id = obj.get("customer")
        subscription_id = obj.get("id")
        
        # Try metadata first (set in create_checkout_session)
        email = (obj.get("metadata") or {}).get("email")
        
        # ✅ FIX 2: Fallback for manual Dashboard entries where metadata is missing
        if not email and customer_id:
            try:
                # We already have 'import stripe' at the top of stripe_billing.py
                customer = stripe.Customer.retrieve(customer_id)
                email = getattr(customer, "email", None)
            except Exception as e:
                print(f"Stripe retrieval failed for {customer_id}: {e}")
                return None
            
        if email:
            status = (obj.get("status") or "").lower()
            active = status in ("active", "trialing")
            return (email.lower().strip(), active, customer_id, subscription_id)

    return None