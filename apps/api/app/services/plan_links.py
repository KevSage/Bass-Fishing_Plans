# apps/api/app/services/plan_links.py
from __future__ import annotations

import os
import sqlite3
import secrets
import json
import time
from typing import Optional, Dict, Any

# Postgres support
try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    psycopg = None

class PlanLinkStore:
    def __init__(self, path: str = "data/plan_links.sqlite3"):
        self._pg_url = os.getenv("DATABASE_URL")
        self._use_pg = bool(self._pg_url and self._pg_url.startswith("postgres"))
        
        if self._use_pg:
            self._init_pg()
        else:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            self.path = path
            self._init_db()

    def _conn(self):
        if self._use_pg:
            return psycopg.connect(self._pg_url, row_factory=dict_row)
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        return conn

    def _get_placeholder(self) -> str:
        return "%s" if self._use_pg else "?"

    def _init_pg(self) -> None:
        with self._conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS plan_links (
                    token TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    is_member INTEGER NOT NULL,
                    plan_data TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    views INTEGER DEFAULT 0
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_plan_links_email ON plan_links(email);")
            conn.commit()

    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS plan_links (
                    token TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    is_member INTEGER NOT NULL,
                    plan_data TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    views INTEGER DEFAULT 0
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_plan_links_email ON plan_links(email);")
            conn.commit()

    def generate_token(self) -> str:
        return secrets.token_urlsafe(32)

    def save_plan(self, email: str, is_member: bool, plan_data: Dict[str, Any]) -> str:
        token = self.generate_token()
        p = self._get_placeholder()
        
        with self._conn() as conn:
            conn.execute(
                f"INSERT INTO plan_links (token, email, is_member, plan_data, created_at) VALUES ({p}, {p}, {p}, {p}, {p});",
                (token, email.lower().strip(), 1 if is_member else 0, json.dumps(plan_data), int(time.time())),
            )
            conn.commit()
        return token

    def get_plan(self, token: str) -> Optional[Dict[str, Any]]:
        p = self._get_placeholder()
        with self._conn() as conn:
            row = conn.execute(
                f"SELECT email, is_member, plan_data, created_at, views FROM plan_links WHERE token={p}",
                (token,),
            ).fetchone()
            
            if not row: return None
            
            conn.execute(f"UPDATE plan_links SET views = views + 1 WHERE token={p}", (token,))
            conn.commit()
            
            return {
                "email": row["email"],
                "is_member": bool(row["is_member"]),
                "plan": json.loads(row["plan_data"]),
                "created_at": row["created_at"],
                "views": row["views"] + 1,
            }

    def get_user_plans(self, email: str, limit: int = 10) -> list[Dict[str, Any]]:
        p = self._get_placeholder()
        with self._conn() as conn:
            rows = conn.execute(
                f"SELECT token, is_member, plan_data, created_at, views FROM plan_links WHERE email={p} ORDER BY created_at DESC LIMIT {p}",
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
        p = self._get_placeholder()
        with self._conn() as conn:
            cursor = conn.execute(f"DELETE FROM plan_links WHERE token={p}", (token,))
            conn.commit()
            return cursor.rowcount > 0