import os
import stripe
from app.services.subscribers import SubscriberStore
from app.services.stripe_billing import init_stripe

def sync_stripe_to_db():
    # 1. Initialize
    init_stripe()
    store = SubscriberStore()
    print("Starting sync...")

    # 2. Fetch all active/trialing subscriptions from Stripe
    subscriptions = stripe.Subscription.list(status="all", limit=100)
    
    count = 0
    for sub in subscriptions.auto_paging_iter():
        status = sub.get("status")
        if status in ["active", "trialing"]:
            customer_id = sub.get("customer")
            subscription_id = sub.get("id")
            
            # Fetch customer to get email (since metadata was missing)
            customer = stripe.Customer.retrieve(customer_id)
            email = getattr(customer, "email", None)

            if email:
                email = email.lower().strip()
                print(f"Syncing: {email} | Status: {status}")
                
                # Update your database
                store.upsert_active(
                    email=email,
                    active=True,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id
                )
                count += 1

    print(f"Finished! Synced {count} members.")

if __name__ == "__main__":
    sync_stripe_to_db()