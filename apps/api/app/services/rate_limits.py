# apps/api/app/services/rate_limits.py
from __future__ import annotations

import os
import sqlite3
import time
from typing import Optional

# Postgres support
try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    psycopg = None

class RateLimitStore:
    """
    Manages rate limiting for both preview users and members.
    Supports both SQLite (local) and Postgres (Vercel).
    """
    def __init__(self, path: str = "data/rate_limits.sqlite3"):
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

    def _get_p(self) -> str:
        return "%s" if self._use_pg else "?"
    
    def _init_pg(self) -> None:
        with self._conn() as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS preview_requests (email TEXT PRIMARY KEY, last_preview_at BIGINT NOT NULL);")
            conn.execute("CREATE TABLE IF NOT EXISTS member_requests (email TEXT PRIMARY KEY, last_request_at BIGINT NOT NULL);")
            conn.commit()
    
    def _init_db(self) -> None:
        with self._conn() as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS preview_requests (email TEXT PRIMARY KEY, last_preview_at INTEGER NOT NULL);")
            conn.execute("CREATE TABLE IF NOT EXISTS member_requests (email TEXT PRIMARY KEY, last_request_at INTEGER NOT NULL);")
            conn.commit()
    
    def check_preview_limit(self, email: str) -> tuple[bool, Optional[int]]:
        bypass = os.getenv("RATE_LIMIT_BYPASS_EMAILS", "").lower().split(",")
        if email.lower().strip() in bypass: return (True, None)
        
        THIRTY_DAYS = 30 * 24 * 60 * 60
        p = self._get_p()
        with self._conn() as conn:
            row = conn.execute(f"SELECT last_preview_at FROM preview_requests WHERE email={p}", (email.lower().strip(),)).fetchone()
            if not row: return (True, None)
            elapsed = int(time.time()) - row["last_preview_at"]
            if elapsed >= THIRTY_DAYS: return (True, None)
            return (False, THIRTY_DAYS - elapsed)
    
    def record_preview(self, email: str) -> None:
        p = self._get_p()
        email_clean = email.lower().strip()
        now = int(time.time())
        ex = "EXCLUDED" if self._use_pg else "excluded"
        with self._conn() as conn:
            conn.execute(
                f"INSERT INTO preview_requests (email, last_preview_at) VALUES ({p}, {p}) ON CONFLICT(email) DO UPDATE SET last_preview_at={ex}.last_preview_at;",
                (email_clean, now)
            )
            conn.commit()

    def check_member_cooldown(self, email: str) -> tuple[bool, Optional[int]]:
        bypass = os.getenv("RATE_LIMIT_BYPASS_EMAILS", "").lower().split(",")
        if email.lower().strip() in bypass: return (True, None)
        
        ONE_HOUR = 3600
        p = self._get_p()
        with self._conn() as conn:
            row = conn.execute(f"SELECT last_request_at FROM member_requests WHERE email={p}", (email.lower().strip(),)).fetchone()
            if not row: return (True, None)
            elapsed = int(time.time()) - row["last_request_at"]
            if elapsed >= ONE_HOUR: return (True, None)
            return (False, ONE_HOUR - elapsed)
    
    def record_member_request(self, email: str) -> None:
        p = self._get_p()
        email_clean = email.lower().strip()
        now = int(time.time())
        ex = "EXCLUDED" if self._use_pg else "excluded"
        with self._conn() as conn:
            conn.execute(
                f"INSERT INTO member_requests (email, last_request_at) VALUES ({p}, {p}) ON CONFLICT(email) DO UPDATE SET last_request_at={ex}.last_request_at;",
                (email_clean, now)
            )
            conn.commit()

    # Added the debug methods back in case your UI or main.py calls them
    def get_preview_status(self, email: str) -> Optional[dict]:
        p = self._get_p()
        with self._conn() as conn:
            row = conn.execute(f"SELECT last_preview_at FROM preview_requests WHERE email={p}", (email.lower().strip(),)).fetchone()
            if not row: return None
            elapsed = int(time.time()) - row["last_preview_at"]
            remaining = max(0, (30 * 24 * 60 * 60) - elapsed)
            return {"email": email, "remaining_seconds": remaining, "can_request": remaining == 0}

    def get_member_status(self, email: str) -> Optional[dict]:
        p = self._get_p()
        with self._conn() as conn:
            row = conn.execute(f"SELECT last_request_at FROM member_requests WHERE email={p}", (email.lower().strip(),)).fetchone()
            if not row: return None
            elapsed = int(time.time()) - row["last_request_at"]
            remaining = max(0, 3600 - elapsed)
            return {"email": email, "remaining_seconds": remaining, "can_request": remaining == 0}