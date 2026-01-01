# apps/api/app/services/plan_history.py
"""
Plan History Store - Track user's generated plans for last 30 days.

Storage: SQLite database (migrated from file-based storage)
Limit: 10 most recent plans per user
Auto-cleanup: Plans older than 30 days are automatically removed
"""
from __future__ import annotations

import os
import sqlite3
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional


class PlanHistoryStore:
    """Store and retrieve plan generation history using SQLite."""
    
    def __init__(self, db_path: str = "data/plan_history.sqlite3"):
        """Initialize with SQLite database."""
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self._init_db()
    
    def _conn(self) -> sqlite3.Connection:
        """Get database connection with row factory."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _init_db(self) -> None:
        """Initialize database schema."""
        with self._conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS plan_history (
                    id TEXT PRIMARY KEY,
                    user_email TEXT NOT NULL,
                    plan_link_id TEXT NOT NULL,
                    lake_name TEXT NOT NULL,
                    generation_date TEXT NOT NULL,
                    plan_type TEXT NOT NULL,
                    conditions TEXT NOT NULL,
                    is_deleted INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                );
                """
            )
            
            # Create indexes for fast queries
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_user_email 
                ON plan_history(user_email);
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_generation_date 
                ON plan_history(generation_date DESC);
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_user_date 
                ON plan_history(user_email, generation_date DESC);
                """
            )
            
            conn.commit()
    
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
        
        Automatically enforces 10-plan limit per user by removing oldest plans.
        Also removes expired plans (older than 30 days).
        
        Returns the plan history ID.
        """
        email = user_email.lower().strip()
        now = datetime.now(timezone.utc)
        plan_id = f"plan_hist_{int(now.timestamp() * 1000)}"
        
        # Clean up expired plans first
        self._cleanup_expired_plans()
        
        # Enforce 10-plan limit per user
        self._enforce_user_limit(email, limit=10)
        
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO plan_history (
                    id, user_email, plan_link_id, lake_name, 
                    generation_date, plan_type, conditions,
                    is_deleted, created_at, expires_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    plan_id,
                    email,
                    plan_link_id,
                    lake_name,
                    now.isoformat(),
                    plan_type,
                    json.dumps({
                        "temp_low": conditions.get("temp_low"),
                        "temp_high": conditions.get("temp_high"),
                        "sky_condition": conditions.get("sky_condition", ""),
                        "wind_speed": conditions.get("wind_speed", 0),
                    }),
                    0,  # is_deleted = False
                    now.isoformat(),
                    (now + timedelta(days=30)).isoformat()
                )
            )
            conn.commit()
        
        return plan_id
    
    def _enforce_user_limit(self, email: str, limit: int = 10) -> None:
        """
        Enforce maximum number of plans per user.
        
        Keeps only the N most recent plans, soft-deletes the rest.
        """
        with self._conn() as conn:
            # Get all non-deleted plans for user, ordered by date (newest first)
            rows = conn.execute(
                """
                SELECT id FROM plan_history
                WHERE user_email = ? AND is_deleted = 0
                ORDER BY generation_date DESC
                """,
                (email,)
            ).fetchall()
            
            # If we have more than the limit, soft-delete the oldest ones
            if len(rows) >= limit:
                # Get IDs of plans to delete (everything beyond the limit)
                ids_to_delete = [row["id"] for row in rows[limit-1:]]
                
                if ids_to_delete:
                    placeholders = ",".join("?" * len(ids_to_delete))
                    conn.execute(
                        f"""
                        UPDATE plan_history
                        SET is_deleted = 1
                        WHERE id IN ({placeholders})
                        """,
                        ids_to_delete
                    )
                    conn.commit()
    
    def _cleanup_expired_plans(self) -> None:
        """
        Remove plans older than 30 days.
        
        This runs automatically on every plan addition.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        
        with self._conn() as conn:
            conn.execute(
                """
                DELETE FROM plan_history
                WHERE generation_date < ?
                """,
                (cutoff.isoformat(),)
            )
            conn.commit()
    
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
        
        Returns max 10 plans (enforced by database + backend limit).
        
        Args:
            email: User's email address
            since: Only return plans after this date (default: 30 days ago)
            limit: Max number of plans to return (max 10)
            offset: Pagination offset (not used with 10-plan limit)
            include_deleted: Whether to include soft-deleted plans
        """
        email = email.lower().strip()
        
        # Enforce hard limit of 10
        limit = min(limit, 10)
        
        if since is None:
            since = datetime.now(timezone.utc) - timedelta(days=30)
        
        with self._conn() as conn:
            query = """
                SELECT 
                    id, user_email, plan_link_id, lake_name,
                    generation_date, plan_type, conditions,
                    is_deleted, created_at, expires_at
                FROM plan_history
                WHERE user_email = ? 
                AND generation_date >= ?
            """
            
            params = [email, since.isoformat()]
            
            if not include_deleted:
                query += " AND is_deleted = 0"
            
            query += " ORDER BY generation_date DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            rows = conn.execute(query, params).fetchall()
        
        plans = []
        for row in rows:
            try:
                conditions = json.loads(row["conditions"])
            except (json.JSONDecodeError, TypeError):
                conditions = {}
            
            plans.append({
                "id": row["id"],
                "user_email": row["user_email"],
                "plan_link_id": row["plan_link_id"],
                "lake_name": row["lake_name"],
                "generation_date": row["generation_date"],
                "plan_type": row["plan_type"],
                "conditions": conditions,
                "is_deleted": bool(row["is_deleted"]),
            })
        
        return plans
    
    def count_user_plans(
        self,
        email: str,
        since: Optional[datetime] = None,
        include_deleted: bool = False
    ) -> int:
        """
        Count user's plans since a certain date.
        
        Max will always be 10 due to automatic limit enforcement.
        """
        email = email.lower().strip()
        
        if since is None:
            since = datetime.now(timezone.utc) - timedelta(days=30)
        
        with self._conn() as conn:
            query = """
                SELECT COUNT(*) as count
                FROM plan_history
                WHERE user_email = ?
                AND generation_date >= ?
            """
            
            params = [email, since.isoformat()]
            
            if not include_deleted:
                query += " AND is_deleted = 0"
            
            result = conn.execute(query, params).fetchone()
            return result["count"] if result else 0
    
    def soft_delete_plan(self, plan_id: str, user_email: str) -> bool:
        """
        Soft delete a plan (mark as deleted, don't remove from database).
        
        Returns True if successful, False if plan not found or unauthorized.
        """
        email = user_email.lower().strip()
        
        with self._conn() as conn:
            # Verify ownership
            row = conn.execute(
                """
                SELECT user_email FROM plan_history
                WHERE id = ?
                """,
                (plan_id,)
            ).fetchone()
            
            if not row or row["user_email"] != email:
                return False
            
            # Mark as deleted
            conn.execute(
                """
                UPDATE plan_history
                SET is_deleted = 1
                WHERE id = ?
                """,
                (plan_id,)
            )
            conn.commit()
            return True
    
    def migrate_from_file_storage(self, old_storage_dir: str = "data/plan_history") -> int:
        """
        One-time migration from file-based storage to SQLite.
        
        Returns number of plans migrated.
        
        Usage:
            store = PlanHistoryStore()
            count = store.migrate_from_file_storage()
            print(f"Migrated {count} plans")
        """
        if not os.path.exists(old_storage_dir):
            return 0
        
        migrated = 0
        
        try:
            for filename in os.listdir(old_storage_dir):
                if not filename.endswith('.json'):
                    continue
                
                filepath = os.path.join(old_storage_dir, filename)
                try:
                    with open(filepath, 'r') as f:
                        plan = json.load(f)
                except (json.JSONDecodeError, IOError):
                    continue
                
                # Insert into database
                try:
                    with self._conn() as conn:
                        conn.execute(
                            """
                            INSERT OR IGNORE INTO plan_history (
                                id, user_email, plan_link_id, lake_name,
                                generation_date, plan_type, conditions,
                                is_deleted, created_at, expires_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (
                                plan.get("id"),
                                plan.get("user_email", "").lower().strip(),
                                plan.get("plan_link_id"),
                                plan.get("lake_name"),
                                plan.get("generation_date"),
                                plan.get("plan_type"),
                                json.dumps(plan.get("conditions", {})),
                                1 if plan.get("is_deleted", False) else 0,
                                plan.get("created_at"),
                                plan.get("expires_at")
                            )
                        )
                        conn.commit()
                        migrated += 1
                except Exception as e:
                    print(f"Failed to migrate {filename}: {e}")
                    continue
            
            # After migration, enforce limits for all users
            with self._conn() as conn:
                # Get all unique users
                users = conn.execute(
                    "SELECT DISTINCT user_email FROM plan_history"
                ).fetchall()
                
                for user in users:
                    self._enforce_user_limit(user["user_email"], limit=10)
            
            return migrated
            
        except Exception as e:
            print(f"Migration error: {e}")
            return migrated


# Global instance
plan_history_store = PlanHistoryStore()