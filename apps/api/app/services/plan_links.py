# apps/api/app/services/plan_links.py
"""
Plan link management - shareable URLs for viewing plans.
Links never expire (users can bookmark them).
"""
from __future__ import annotations

import os
import sqlite3
import secrets
import json
import time
from typing import Optional, Dict, Any


class PlanLinkStore:
    """
    Stores plan data with unique tokens for shareable URLs.
    """
    def __init__(self, path: str = "data/plan_links.sqlite3"):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.path = path
        self._init_db()
    
    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS plan_links (
                    token TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    is_member INTEGER NOT NULL,
                    plan_data TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    views INTEGER DEFAULT 0
                );
                """
            )
            # Index for looking up plans by email
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_plan_links_email 
                ON plan_links(email);
                """
            )
            conn.commit()
    
    def generate_token(self) -> str:
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)  # ~43 characters
    
    def save_plan(
        self,
        email: str,
        is_member: bool,
        plan_data: Dict[str, Any],
    ) -> str:
        """
        Save a plan and return its shareable token.
        
        Returns:
            token: Unique identifier for this plan
        """
        token = self.generate_token()
        
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO plan_links (token, email, is_member, plan_data, created_at)
                VALUES (?, ?, ?, ?, ?);
                """,
                (
                    token,
                    email.lower().strip(),
                    1 if is_member else 0,
                    json.dumps(plan_data),
                    int(time.time()),
                ),
            )
            conn.commit()
        
        return token
    
    def get_plan(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve plan data by token.
        Also increments view count.
        
        Returns:
            {
                "email": str,
                "is_member": bool,
                "plan": dict,
                "created_at": int (unix timestamp),
                "views": int
            }
        """
        with self._conn() as conn:
            # Get plan data
            row = conn.execute(
                "SELECT email, is_member, plan_data, created_at, views FROM plan_links WHERE token=?",
                (token,),
            ).fetchone()
            
            if not row:
                return None
            
            # Increment view count
            conn.execute(
                "UPDATE plan_links SET views = views + 1 WHERE token=?",
                (token,),
            )
            conn.commit()
            
            return {
                "email": row["email"],
                "is_member": bool(row["is_member"]),
                "plan": json.loads(row["plan_data"]),
                "created_at": row["created_at"],
                "views": row["views"] + 1,  # Include the current view
            }
    
    def get_user_plans(self, email: str, limit: int = 10) -> list[Dict[str, Any]]:
        """
        Get recent plans for a user.
        Useful for "My Plans" page or history.
        
        Returns list of:
            {
                "token": str,
                "is_member": bool,
                "created_at": int,
                "views": int,
                "location": str (from plan data)
            }
        """
        with self._conn() as conn:
            rows = conn.execute(
                """
                SELECT token, is_member, plan_data, created_at, views
                FROM plan_links
                WHERE email=?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (email.lower().strip(), limit),
            ).fetchall()
            
            results = []
            for row in rows:
                plan_data = json.loads(row["plan_data"])
                results.append({
                    "token": row["token"],
                    "is_member": bool(row["is_member"]),
                    "created_at": row["created_at"],
                    "views": row["views"],
                    "location": plan_data.get("conditions", {}).get("location_name", "Unknown"),
                })
            
            return results
    
    def delete_plan(self, token: str) -> bool:
        """
        Delete a plan link.
        Returns True if deleted, False if not found.
        """
        with self._conn() as conn:
            cursor = conn.execute(
                "DELETE FROM plan_links WHERE token=?",
                (token,),
            )
            conn.commit()
            return cursor.rowcount > 0
