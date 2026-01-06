# apps/api/app/services/plan_history.py
from __future__ import annotations

import os
import sqlite3
import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional

# Postgres support
try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    psycopg = None

class PlanHistoryStore:
    def __init__(self, db_path: str = "data/plan_history.sqlite3"):
        self._pg_url = os.getenv("DATABASE_URL")
        self._use_pg = bool(self._pg_url and self._pg_url.startswith("postgres"))
        
        if self._use_pg:
            self._init_pg()
        else:
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
            self.db_path = db_path
            self._init_db()

    def _conn(self):
        if self._use_pg:
            return psycopg.connect(self._pg_url, row_factory=dict_row)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _get_p(self) -> str:
        return "%s" if self._use_pg else "?"

    def _init_pg(self) -> None:
        with self._conn() as conn:
            conn.execute("""
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
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_user_email ON plan_history(user_email);")
            conn.commit()

    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.execute("""
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
            """)
            conn.commit()

    def add_plan(self, user_email: str, plan_link_id: str, lake_name: str, plan_type: str, conditions: dict) -> str:
        email = user_email.lower().strip()
        now = datetime.now(timezone.utc)
        plan_id = f"plan_hist_{int(now.timestamp() * 1000)}"
        p = self._get_p()
        
        self._cleanup_expired_plans()
        self._enforce_user_limit(email, limit=10)
        
        cond_json = json.dumps({
            "temp_low": conditions.get("temp_low"),
            "temp_high": conditions.get("temp_high"),
            "sky_condition": conditions.get("sky_condition", ""),
            "wind_speed": conditions.get("wind_speed", 0),
        })

        with self._conn() as conn:
            conn.execute(
                f"""INSERT INTO plan_history (id, user_email, plan_link_id, lake_name, generation_date, plan_type, conditions, is_deleted, created_at, expires_at)
                VALUES ({p}, {p}, {p}, {p}, {p}, {p}, {p}, {p}, {p}, {p})""",
                (plan_id, email, plan_link_id, lake_name, now.isoformat(), plan_type, cond_json, 0, now.isoformat(), (now + timedelta(days=30)).isoformat())
            )
            conn.commit()
        return plan_id

    def _enforce_user_limit(self, email: str, limit: int = 10) -> None:
        p = self._get_p()
        with self._conn() as conn:
            rows = conn.execute(f"SELECT id FROM plan_history WHERE user_email = {p} AND is_deleted = 0 ORDER BY generation_date DESC", (email,)).fetchall()
            if len(rows) >= limit:
                ids_to_delete = [row["id"] for row in rows[limit-1:]]
                if ids_to_delete:
                    placeholders = ",".join(p for _ in ids_to_delete)
                    conn.execute(f"UPDATE plan_history SET is_deleted = 1 WHERE id IN ({placeholders})", ids_to_delete)
                    conn.commit()

    def _cleanup_expired_plans(self) -> None:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        p = self._get_p()
        with self._conn() as conn:
            conn.execute(f"DELETE FROM plan_history WHERE generation_date < {p}", (cutoff,))
            conn.commit()

    def get_user_plans(self, email: str, since: Optional[datetime] = None, limit: int = 10, offset: int = 0, include_deleted: bool = False) -> List[dict]:
        email = email.lower().strip()
        limit = min(limit, 10)
        if since is None: since = datetime.now(timezone.utc) - timedelta(days=30)
        p = self._get_p()
        
        query = f"SELECT id, user_email, plan_link_id, lake_name, generation_date, plan_type, conditions, is_deleted, created_at, expires_at FROM plan_history WHERE user_email = {p} AND generation_date >= {p}"
        params = [email, since.isoformat()]
        if not include_deleted: query += " AND is_deleted = 0"
        query += f" ORDER BY generation_date DESC LIMIT {p} OFFSET {p}"
        params.extend([limit, offset])

        with self._conn() as conn:
            rows = conn.execute(query, params).fetchall()
        
        plans = []
        for row in rows:
            try: cond = json.loads(row["conditions"])
            except: cond = {}
            plans.append({"id": row["id"], "user_email": row["user_email"], "plan_link_id": row["plan_link_id"], "lake_name": row["lake_name"], "generation_date": row["generation_date"], "plan_type": row["plan_type"], "conditions": cond, "is_deleted": bool(row["is_deleted"])})
        return plans

    def count_user_plans(self, email: str, since: Optional[datetime] = None, include_deleted: bool = False) -> int:
        if since is None: since = datetime.now(timezone.utc) - timedelta(days=30)
        p = self._get_p()
        query = f"SELECT COUNT(*) as count FROM plan_history WHERE user_email = {p} AND generation_date >= {p}"
        params = [email.lower().strip(), since.isoformat()]
        if not include_deleted: query += " AND is_deleted = 0"
        with self._conn() as conn:
            result = conn.execute(query, params).fetchone()
            return result["count"] if result else 0

    def soft_delete_plan(self, plan_id: str, user_email: str) -> bool:
        p = self._get_p()
        with self._conn() as conn:
            row = conn.execute(f"SELECT user_email FROM plan_history WHERE id = {p}", (plan_id,)).fetchone()
            if not row or row["user_email"] != user_email.lower().strip(): return False
            conn.execute(f"UPDATE plan_history SET is_deleted = 1 WHERE id = {p}", (plan_id,))
            conn.commit()
            return True

# Global instance
plan_history_store = PlanHistoryStore()