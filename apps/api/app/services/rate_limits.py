# apps/api/app/services/rate_limits.py
"""
Rate limiting for plan generation.
- Non-members: 1 preview every 30 days
- Members: Unlimited plans, but 3-hour cooldown between requests
"""
from __future__ import annotations

import os
import sqlite3
import time
from typing import Optional


class RateLimitStore:
    """
    Manages rate limiting for both preview users and members.
    """
    def __init__(self, path: str = "data/rate_limits.sqlite3"):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.path = path
        self._init_db()
    
    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _init_db(self) -> None:
        with self._conn() as conn:
            # Preview requests table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS preview_requests (
                    email TEXT PRIMARY KEY,
                    last_preview_at INTEGER NOT NULL
                );
                """
            )
            # Member plan requests table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS member_requests (
                    email TEXT PRIMARY KEY,
                    last_request_at INTEGER NOT NULL
                );
                """
            )
            conn.commit()
    
    # ========================================
    # Preview Rate Limiting (30 days)
    # ========================================
    
    def check_preview_limit(self, email: str) -> tuple[bool, Optional[int]]:
        """
        Check if non-member can request a preview.
        
        Returns:
            (allowed, seconds_until_allowed)
            - If allowed: (True, None)
            - If blocked: (False, seconds_remaining)
        """
        # Bypass rate limits for testing emails
        bypass_emails = os.getenv("RATE_LIMIT_BYPASS_EMAILS", "").lower().split(",")
        if email.lower().strip() in bypass_emails:
            return (True, None)
        
        THIRTY_DAYS = 30 * 24 * 60 * 60  # 30 days in seconds
        
        with self._conn() as conn:
            row = conn.execute(
                "SELECT last_preview_at FROM preview_requests WHERE email=?",
                (email.lower().strip(),),
            ).fetchone()
            
            if not row:
                # Never requested preview before
                return (True, None)
            
            last_preview = row["last_preview_at"]
            now = int(time.time())
            elapsed = now - last_preview
            
            if elapsed >= THIRTY_DAYS:
                # Cooldown period has passed
                return (True, None)
            else:
                # Still in cooldown
                remaining = THIRTY_DAYS - elapsed
                return (False, remaining)
    
    def record_preview(self, email: str) -> None:
        """Record that user requested a preview"""
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO preview_requests (email, last_preview_at)
                VALUES (?, ?)
                ON CONFLICT(email) DO UPDATE SET
                    last_preview_at=excluded.last_preview_at;
                """,
                (email.lower().strip(), int(time.time())),
            )
            conn.commit()
    
    # ========================================
    # Member Rate Limiting (3 hours)
    # ========================================
    
    def check_member_cooldown(self, email: str) -> tuple[bool, Optional[int]]:
        """
        Check if member can request a plan.
        
        Returns:
            (allowed, seconds_until_allowed)
            - If allowed: (True, None)
            - If blocked: (False, seconds_remaining)
        """
        # Bypass rate limits for testing emails
        bypass_emails = os.getenv("RATE_LIMIT_BYPASS_EMAILS", "").lower().split(",")
        if email.lower().strip() in bypass_emails:
            return (True, None)
        
        THREE_HOURS = 3 * 60 * 60  # 3 hours in seconds
        
        with self._conn() as conn:
            row = conn.execute(
                "SELECT last_request_at FROM member_requests WHERE email=?",
                (email.lower().strip(),),
            ).fetchone()
            
            if not row:
                # Never requested plan before
                return (True, None)
            
            last_request = row["last_request_at"]
            now = int(time.time())
            elapsed = now - last_request
            
            if elapsed >= THREE_HOURS:
                # Cooldown period has passed
                return (True, None)
            else:
                # Still in cooldown
                remaining = THREE_HOURS - elapsed
                return (False, remaining)
    
    def record_member_request(self, email: str) -> None:
        """Record that member requested a plan"""
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO member_requests (email, last_request_at)
                VALUES (?, ?)
                ON CONFLICT(email) DO UPDATE SET
                    last_request_at=excluded.last_request_at;
                """,
                (email.lower().strip(), int(time.time())),
            )
            conn.commit()
    
    # ========================================
    # Utilities
    # ========================================
    
    def get_preview_status(self, email: str) -> Optional[dict]:
        """Get preview request status for debugging"""
        with self._conn() as conn:
            row = conn.execute(
                "SELECT last_preview_at FROM preview_requests WHERE email=?",
                (email.lower().strip(),),
            ).fetchone()
            
            if not row:
                return None
            
            last_preview = row["last_preview_at"]
            now = int(time.time())
            elapsed = now - last_preview
            remaining = max(0, (30 * 24 * 60 * 60) - elapsed)
            
            return {
                "email": email,
                "last_preview_at": last_preview,
                "elapsed_seconds": elapsed,
                "remaining_seconds": remaining,
                "can_request": remaining == 0,
            }
    
    def get_member_status(self, email: str) -> Optional[dict]:
        """Get member request status for debugging"""
        with self._conn() as conn:
            row = conn.execute(
                "SELECT last_request_at FROM member_requests WHERE email=?",
                (email.lower().strip(),),
            ).fetchone()
            
            if not row:
                return None
            
            last_request = row["last_request_at"]
            now = int(time.time())
            elapsed = now - last_request
            remaining = max(0, (3 * 60 * 60) - elapsed)
            
            return {
                "email": email,
                "last_request_at": last_request,
                "elapsed_seconds": elapsed,
                "remaining_seconds": remaining,
                "can_request": remaining == 0,
            }