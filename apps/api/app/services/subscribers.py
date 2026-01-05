# apps/api/app/services/subscribers.py
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from typing import Optional

import psycopg
from psycopg.rows import dict_row


@dataclass(frozen=True)
class Subscriber:
    email: str
    active: bool
    stripe_customer_id: Optional[str]
    stripe_subscription_id: Optional[str]


class SubscriberStore:
    """
    Subscriber storage.
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
                CREATE TABLE IF NOT EXISTS subscribers (
                    email TEXT PRIMARY KEY,
                    active BOOLEAN NOT NULL,
                    stripe_customer_id TEXT,
                    stripe_subscription_id TEXT UNIQUE
                );
                """
            )
            conn.commit()

    def _pg_upsert(
        self,
        email: str,
        *,
        active: bool,
        stripe_customer_id: Optional[str],
        stripe_subscription_id: Optional[str],
    ) -> None:
        email_norm = email.lower().strip()
        with self._pg_conn() as conn:
            conn.execute(
                """
                INSERT INTO subscribers (email, active, stripe_customer_id, stripe_subscription_id)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (email)
                DO UPDATE SET
                    active = EXCLUDED.active,
                    stripe_customer_id = EXCLUDED.stripe_customer_id,
                    stripe_subscription_id = EXCLUDED.stripe_subscription_id;
                """,
                (email_norm, active, stripe_customer_id, stripe_subscription_id),
            )
            conn.commit()

    def _pg_get(self, email: str) -> Optional[Subscriber]:
        email_norm = email.lower().strip()
        with self._pg_conn() as conn:
            row = conn.execute(
                """
                SELECT email, active, stripe_customer_id, stripe_subscription_id
                FROM subscribers
                WHERE email = %s
                """,
                (email_norm,),
            ).fetchone()

        if not row:
            return None

        return Subscriber(
            email=row["email"],
            active=bool(row["active"]),
            stripe_customer_id=row["stripe_customer_id"],
            stripe_subscription_id=row["stripe_subscription_id"],
        )

    # -------------------------
    # SQLite (local fallback)
    # -------------------------
    def _sqlite_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # app/
        data_dir = os.path.join(os.path.dirname(base_dir), "data")  # apps/api/data
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, "subscribers.sqlite3")

    def _sqlite_conn(self):
        conn = sqlite3.connect(self._sqlite_path())
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self) -> None:
        with self._sqlite_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS subscribers (
                    email TEXT PRIMARY KEY,
                    active INTEGER NOT NULL,
                    stripe_customer_id TEXT,
                    stripe_subscription_id TEXT
                );
                """
            )
            conn.commit()

    # -------------------------
    # Public API (unchanged)
    # -------------------------
    def upsert_active(
        self,
        email: str,
        *,
        active: bool,
        stripe_customer_id: Optional[str] = None,
        stripe_subscription_id: Optional[str] = None,
    ) -> None:
        if self._use_pg:
            return self._pg_upsert(
                email,
                active=active,
                stripe_customer_id=stripe_customer_id,
                stripe_subscription_id=stripe_subscription_id,
            )

        # SQLite path
        email_norm = email.lower().strip()
        with self._sqlite_conn() as conn:
            conn.execute(
                """
                INSERT INTO subscribers (email, active, stripe_customer_id, stripe_subscription_id)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET
                    active=excluded.active,
                    stripe_customer_id=excluded.stripe_customer_id,
                    stripe_subscription_id=excluded.stripe_subscription_id
                """,
                (email_norm, 1 if active else 0, stripe_customer_id, stripe_subscription_id),
            )
            conn.commit()

    def get(self, email: str) -> Optional[Subscriber]:
        if self._use_pg:
            return self._pg_get(email)

        email_norm = email.lower().strip()
        with self._sqlite_conn() as conn:
            row = conn.execute(
                "SELECT email, active, stripe_customer_id, stripe_subscription_id FROM subscribers WHERE email=?",
                (email_norm,),
            ).fetchone()
            if not row:
                return None
            return Subscriber(
                email=row["email"],
                active=bool(row["active"]),
                stripe_customer_id=row["stripe_customer_id"],
                stripe_subscription_id=row["stripe_subscription_id"],
            )

    def is_active(self, email: str) -> bool:
        sub = self.get(email)
        return bool(sub and sub.active)
