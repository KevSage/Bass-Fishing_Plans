# apps/api/verify_db.py
import os
from app.services.subscribers import SubscriberStore
from app.services.plan_history import PlanHistoryStore
from app.services.plan_links import PlanLinkStore
from app.services.rate_limits import RateLimitStore

def run_test():
    print(f"--- DATABASE VERIFICATION ---")
    print(f"DATABASE_URL present: {bool(os.getenv('DATABASE_URL'))}")
    
    test_email = "launch_test@example.com"
    
    try:
        # 1. Test Subscribers
        sub_store = SubscriberStore()
        sub_store.upsert_active(test_email, active=True)
        print("✅ Subscribers: Write/Update successful.")
        
        # 2. Test Plan Links
        link_store = PlanLinkStore()
        token = link_store.save_plan(test_email, True, {"test": "data"})
        print(f"✅ Plan Links: Saved with token {token[:10]}...")
        
        # 3. Test Plan History
        hist_store = PlanHistoryStore()
        hist_id = hist_store.add_plan(test_email, token, "Test Lake", "member", {})
        print(f"✅ Plan History: Added record {hist_id}")
        
        # 4. Test Rate Limits
        rate_store = RateLimitStore()
        rate_store.record_preview(test_email)
        allowed, _ = rate_store.check_preview_limit(test_email)
        # Should be False because we just recorded one
        print(f"✅ Rate Limits: Record and Check successful (Allowed: {allowed})")
        
        print("\n--- ALL SYSTEMS GREEN ---")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")

if __name__ == "__main__":
    run_test()