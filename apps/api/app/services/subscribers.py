# apps/api/app/services/subscribers.py
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Subscriber:
    email: str
    active: bool
    stripe_customer_id: Optional[str]
    stripe_subscription_id: Optional[str]


class SubscriberStore:
    """
    Minimal, dependency-free subscriber store.
    SQLite file is local; safe for launch MVP.
    """
    def __init__(self, path: str = "data/subscribers.sqlite3"):
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
                CREATE TABLE IF NOT EXISTS subscribers (
                    email TEXT PRIMARY KEY,
                    active INTEGER NOT NULL,
                    stripe_customer_id TEXT,
                    stripe_subscription_id TEXT
                );
                """
            )
            conn.commit()

    def upsert_active(
        self,
        email: str,
        *,
        active: bool,
        stripe_customer_id: Optional[str] = None,
        stripe_subscription_id: Optional[str] = None,
        
    ) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO subscribers (email, active, stripe_customer_id, stripe_subscription_id)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET
                    active=excluded.active,
                    stripe_customer_id=COALESCE(excluded.stripe_customer_id, subscribers.stripe_customer_id),
                    stripe_subscription_id=COALESCE(excluded.stripe_subscription_id, subscribers.stripe_subscription_id);
                """,
                (email.lower().strip(), 1 if active else 0, stripe_customer_id, stripe_subscription_id),
            )
            conn.commit()

    def get(self, email: str) -> Optional[Subscriber]:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT email, active, stripe_customer_id, stripe_subscription_id FROM subscribers WHERE email=?",
                (email.lower().strip(),),
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