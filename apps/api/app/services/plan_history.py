# apps/api/app/services/plan_history.py
"""
Plan History Store - Track user's generated plans for last 30 days.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional


class PlanHistoryStore:
    """Store and retrieve plan generation history."""
    
    def __init__(self, storage_dir: str = "data/plan_history"):
        """Initialize with storage directory."""
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)
    
    def add_plan(
        self,
        user_email: str,
        plan_link_id: str,
        lake_name: str,
        plan_type: str,  # "member" or "preview"
        conditions: dict
    ) -> str:
        """
        Add a plan to user's history.
        
        Returns the plan history ID.
        """
        plan_id = f"plan_hist_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        
        plan_data = {
            "id": plan_id,
            "user_email": user_email.lower().strip(),
            "plan_link_id": plan_link_id,
            "lake_name": lake_name,
            "generation_date": datetime.now(timezone.utc).isoformat(),
            "plan_type": plan_type,
            "conditions": {
                "temp_low": conditions.get("temp_low"),
                "temp_high": conditions.get("temp_high"),
                "sky_condition": conditions.get("sky_condition", ""),
                "wind_speed": conditions.get("wind_speed", 0),
            },
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (
                datetime.now(timezone.utc) + timedelta(days=30)
            ).isoformat()
        }
        
        # Save to file
        filepath = os.path.join(self.storage_dir, f"{plan_id}.json")
        with open(filepath, 'w') as f:
            json.dump(plan_data, f, indent=2)
        
        return plan_id
    
    def get_user_plans(
        self,
        email: str,
        since: Optional[datetime] = None,
        limit: int = 10,
        offset: int = 0,
        include_deleted: bool = False
    ) -> List[dict]:
        """
        Get user's plans since a certain date.
        
        Args:
            email: User's email address
            since: Only return plans after this date (default: 30 days ago)
            limit: Max number of plans to return
            offset: Pagination offset
            include_deleted: Whether to include soft-deleted plans
        """
        email = email.lower().strip()
        
        if since is None:
            since = datetime.now(timezone.utc) - timedelta(days=30)
        
        all_plans = []
        
        # Load all plan files
        try:
            for filename in os.listdir(self.storage_dir):
                if not filename.endswith('.json'):
                    continue
                
                filepath = os.path.join(self.storage_dir, filename)
                try:
                    with open(filepath, 'r') as f:
                        plan = json.load(f)
                except (json.JSONDecodeError, IOError):
                    continue
                
                # Filter by email
                if plan.get('user_email') != email:
                    continue
                
                # Filter by deleted status
                if not include_deleted and plan.get('is_deleted', False):
                    continue
                
                # Filter by date
                gen_date_str = plan.get('generation_date')
                if gen_date_str:
                    try:
                        gen_date = datetime.fromisoformat(gen_date_str)
                        if gen_date < since:
                            continue
                    except (ValueError, TypeError):
                        continue
                
                all_plans.append(plan)
        except FileNotFoundError:
            return []
        
        # Sort by generation date (newest first)
        all_plans.sort(
            key=lambda p: p.get('generation_date', ''),
            reverse=True
        )
        
        # Paginate
        return all_plans[offset:offset + limit]
    
    def count_user_plans(
        self,
        email: str,
        since: Optional[datetime] = None,
        include_deleted: bool = False
    ) -> int:
        """Count user's plans since a certain date."""
        plans = self.get_user_plans(
            email=email,
            since=since,
            limit=999999,  # Get all
            offset=0,
            include_deleted=include_deleted
        )
        return len(plans)
    
    def soft_delete_plan(self, plan_id: str, user_email: str) -> bool:
        """
        Soft delete a plan (mark as deleted, don't remove file).
        
        Returns True if successful, False if plan not found or unauthorized.
        """
        email = user_email.lower().strip()
        filepath = os.path.join(self.storage_dir, f"{plan_id}.json")
        
        if not os.path.exists(filepath):
            return False
        
        try:
            with open(filepath, 'r') as f:
                plan = json.load(f)
        except (json.JSONDecodeError, IOError):
            return False
        
        # Verify ownership
        if plan.get('user_email') != email:
            return False
        
        # Mark as deleted
        plan['is_deleted'] = True
        
        try:
            with open(filepath, 'w') as f:
                json.dump(plan, f, indent=2)
            return True
        except IOError:
            return False


# Global instance
plan_history_store = PlanHistoryStore()