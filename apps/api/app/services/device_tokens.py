# apps/api/app/services/device_tokens.py
"""
Device token storage for push notifications.
Stores APNs tokens from iOS devices for sending push notifications.
"""
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

import psycopg
from psycopg.rows import dict_row


@dataclass(frozen=True)
class DeviceToken:
    id: int
    email: str
    device_token: str
    platform: str
    is_active: bool
    created_at: str


class DeviceTokenStore:
    """
    Device token storage for push notifications.
    - Locally: falls back to SQLite (no new setup required).
    - On Render: uses Postgres via DATABASE_URL (durable).
    """

    def __init__(self) -> None:
        self._pg_url = os.getenv("DATABASE_URL")
        self._use_pg = bool(self._pg_url and self._pg_url.startswith("postgres"))

        if self._use_pg:
            self._init_pg()
        else:
            self._init_sqlite()
        print(f"[DeviceTokenStore] use_pg={self._use_pg}")

    # -------------------------
    # Postgres
    # -------------------------
    def _pg_conn(self):
        assert self._pg_url, "DATABASE_URL is required for Postgres mode"
        return psycopg.connect(self._pg_url, row_factory=dict_row)

    def _init_pg(self) -> None:
        with self._pg_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS device_tokens (
                    id SERIAL PRIMARY KEY,
                    email TEXT NOT NULL,
                    device_token TEXT NOT NULL UNIQUE,
                    platform TEXT NOT NULL DEFAULT 'ios',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_device_tokens_email
                ON device_tokens(email);
                """
            )
            conn.commit()

    # -------------------------
    # SQLite (local fallback)
    # -------------------------
    def _sqlite_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(os.path.dirname(base_dir), "data")
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, "device_tokens.sqlite3")

    def _sqlite_conn(self):
        conn = sqlite3.connect(self._sqlite_path())
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self) -> None:
        with self._sqlite_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS device_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT NOT NULL,
                    device_token TEXT NOT NULL UNIQUE,
                    platform TEXT NOT NULL DEFAULT 'ios',
                    is_active INTEGER DEFAULT 1,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_device_tokens_email
                ON device_tokens(email);
                """
            )
            conn.commit()

    # -------------------------
    # Public API
    # -------------------------
    def register(self, email: str, device_token: str, platform: str = "ios") -> bool:
        """
        Register or update a device token.
        If token already exists, updates email association and marks active.
        Returns True on success.
        """
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO device_tokens (email, device_token, platform, is_active)
                    VALUES (%s, %s, %s, TRUE)
                    ON CONFLICT (device_token)
                    DO UPDATE SET
                        email = EXCLUDED.email,
                        is_active = TRUE;
                    """,
                    (email_norm, device_token, platform),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO device_tokens (email, device_token, platform, is_active)
                    VALUES (?, ?, ?, 1)
                    ON CONFLICT(device_token) DO UPDATE SET
                        email = excluded.email,
                        is_active = 1;
                    """,
                    (email_norm, device_token, platform),
                )
                conn.commit()

        return True

    def unregister(self, device_token: str) -> bool:
        """
        Unregister a device token (marks as inactive).
        Returns True on success.
        """
        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    "UPDATE device_tokens SET is_active = FALSE WHERE device_token = %s",
                    (device_token,),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    "UPDATE device_tokens SET is_active = 0 WHERE device_token = ?",
                    (device_token,),
                )
                conn.commit()

        return True

    def mark_invalid(self, device_token: str) -> None:
        """
        Mark a token as invalid (when APNs returns invalid token error).
        """
        self.unregister(device_token)

    def get_tokens_by_email(self, email: str) -> List[str]:
        """
        Get all active device tokens for a user.
        """
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT device_token FROM device_tokens
                    WHERE email = %s AND is_active = TRUE
                    """,
                    (email_norm,),
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT device_token FROM device_tokens
                    WHERE email = ? AND is_active = 1
                    """,
                    (email_norm,),
                ).fetchall()

        return [row["device_token"] for row in rows]

    def get_all_active(self) -> List[dict]:
        """
        Get all active device tokens with their emails.
        Used for batch notifications.
        """
        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT email, device_token, platform FROM device_tokens
                    WHERE is_active = TRUE
                    """
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT email, device_token, platform FROM device_tokens
                    WHERE is_active = 1
                    """
                ).fetchall()

        return [
            {"email": row["email"], "device_token": row["device_token"], "platform": row["platform"]}
            for row in rows
        ]

    def get_unique_emails(self) -> List[str]:
        """
        Get list of unique emails that have active device tokens.
        """
        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    "SELECT DISTINCT email FROM device_tokens WHERE is_active = TRUE"
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    "SELECT DISTINCT email FROM device_tokens WHERE is_active = 1"
                ).fetchall()

        return [row["email"] for row in rows]
