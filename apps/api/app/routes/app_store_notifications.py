# apps/api/app/routes/app_store_notifications.py
"""
App Store Server Notifications V2 Webhook Handler

Receives and processes subscription lifecycle events from Apple:
- Renewals (new expiration date)
- Cancellations
- Refunds/Revocations
- Billing retry / Grace period transitions

Apple sends these as signed JWS payloads that we must verify.
"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
import json

from app.services.apple_storekit_jws import (
    verify_storekit_transaction_jws,
    JWSVerificationError,
    _load_apple_root_ca,
    _parse_jws,
    _verify_certificate_chain,
    _verify_jws_signature,
    _parse_apple_timestamp,
)
from app.services.subscribers import SubscriberStore

router = APIRouter(prefix="/app-store-notifications", tags=["app-store-notifications"])

# Notification types we handle
# See: https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
NOTIFICATION_TYPES = {
    "SUBSCRIBED": "New subscription",
    "DID_RENEW": "Subscription renewed",
    "DID_CHANGE_RENEWAL_STATUS": "Auto-renew status changed",
    "DID_CHANGE_RENEWAL_PREF": "Subscription upgrade/downgrade",
    "DID_FAIL_TO_RENEW": "Billing retry started",
    "GRACE_PERIOD_EXPIRED": "Grace period ended",
    "EXPIRED": "Subscription expired",
    "REFUND": "Transaction refunded",
    "REVOKE": "Family sharing revoked",
    "CONSUMPTION_REQUEST": "Consumable consumption request",
}


class NotificationPayload(BaseModel):
    signedPayload: str


def verify_notification_jws(signed_payload: str) -> dict:
    """
    Verify an App Store Server Notification JWS payload.

    The notification payload structure is different from transaction JWS:
    - Contains notificationType, subtype, data, etc.
    - data.signedTransactionInfo contains the actual transaction JWS

    Returns the verified payload dict.
    """
    apple_root = _load_apple_root_ca()

    # Parse the outer notification JWS
    header, payload, signature = _parse_jws(signed_payload)

    # Verify algorithm
    if header.get("alg") != "ES256":
        raise JWSVerificationError(f"Unexpected algorithm: {header.get('alg')}")

    # Verify certificate chain
    x5c_chain = header.get("x5c")
    if not x5c_chain:
        raise JWSVerificationError("Missing x5c certificate chain")

    leaf_cert = _verify_certificate_chain(x5c_chain, apple_root)

    # Verify signature
    _verify_jws_signature(signed_payload, leaf_cert)

    return payload


@router.post("/v2")
async def handle_notification(request: Request):
    """
    Handle App Store Server Notification V2.

    Apple sends a POST with JSON body: { "signedPayload": "..." }
    The signedPayload is a JWS that we must verify before trusting.
    """
    try:
        # Parse request body
        body = await request.json()
        signed_payload = body.get("signedPayload")

        if not signed_payload:
            raise HTTPException(status_code=400, detail="Missing signedPayload")

        # Verify the notification JWS
        try:
            notification = verify_notification_jws(signed_payload)
        except JWSVerificationError as e:
            print(f"[AppStoreNotification] JWS verification failed: {e}")
            raise HTTPException(status_code=401, detail="Invalid notification signature")

        # Extract notification info
        notification_type = notification.get("notificationType")
        subtype = notification.get("subtype")
        data = notification.get("data", {})

        print(f"[AppStoreNotification] Received: {notification_type} / {subtype}")

        # Get the signed transaction info if present
        signed_transaction_info = data.get("signedTransactionInfo")
        signed_renewal_info = data.get("signedRenewalInfo")

        # Process based on notification type
        store = SubscriberStore()

        if notification_type in ["DID_RENEW", "SUBSCRIBED"]:
            # Subscription renewed or new subscription
            if signed_transaction_info:
                try:
                    tx = verify_storekit_transaction_jws(signed_transaction_info)

                    # Find user by original transaction ID
                    # For now, we log and rely on the transaction having been recorded
                    # In production, you'd look up the user by original_transaction_id
                    print(f"[AppStoreNotification] Renewal for transaction: {tx.original_transaction_id}")
                    print(f"[AppStoreNotification] New expiration: {tx.expiration_date}")

                    # TODO: Look up user by apple_original_transaction_id and update expiration
                    # store.update_apple_expiration(email, tx.expiration_date.isoformat())

                except JWSVerificationError as e:
                    print(f"[AppStoreNotification] Failed to verify transaction: {e}")

        elif notification_type == "EXPIRED":
            # Subscription expired
            if signed_transaction_info:
                try:
                    tx = verify_storekit_transaction_jws(signed_transaction_info)
                    print(f"[AppStoreNotification] Expired: {tx.original_transaction_id}")

                    # TODO: Look up user and deactivate
                    # store.deactivate_by_transaction(tx.original_transaction_id)

                except JWSVerificationError as e:
                    print(f"[AppStoreNotification] Failed to verify transaction: {e}")

        elif notification_type == "REFUND":
            # Transaction was refunded
            if signed_transaction_info:
                try:
                    tx = verify_storekit_transaction_jws(signed_transaction_info)
                    print(f"[AppStoreNotification] Refund: {tx.transaction_id}")

                    if tx.revocation_date:
                        # TODO: Look up user and revoke
                        # store.revoke_by_transaction(tx.original_transaction_id, tx.revocation_date)
                        pass

                except JWSVerificationError as e:
                    print(f"[AppStoreNotification] Failed to verify transaction: {e}")

        elif notification_type == "DID_CHANGE_RENEWAL_STATUS":
            # User turned auto-renew on or off
            auto_renew_status = data.get("autoRenewStatus")
            print(f"[AppStoreNotification] Auto-renew status changed: {auto_renew_status}")
            # This is informational - subscription is still active until expiration

        elif notification_type == "DID_FAIL_TO_RENEW":
            # Billing retry started (grace period)
            print(f"[AppStoreNotification] Billing retry started")
            # User is in grace period - subscription still active

        elif notification_type == "GRACE_PERIOD_EXPIRED":
            # Grace period ended without successful billing
            print(f"[AppStoreNotification] Grace period expired")
            # TODO: Deactivate subscription

        # Always return 200 OK to Apple
        # If we return an error, Apple will retry the notification
        return {"status": "received", "notification_type": notification_type}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[AppStoreNotification] Error processing notification: {e}")
        # Return 200 anyway to prevent Apple from retrying
        # Log the error for investigation
        return {"status": "error", "message": str(e)}


@router.get("/health")
async def health_check():
    """Health check endpoint for the notifications webhook."""
    return {"status": "ok", "service": "app-store-notifications"}
