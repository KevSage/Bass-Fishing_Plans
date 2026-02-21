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
    # Apple Sign-In fields
    apple_user_id: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    # Free tier plan tracking
    plans_generated: int = 0
    # StoreKit subscription fields (production-grade)
    subscription_expires_at: Optional[str] = None  # ISO timestamp from Apple
    entitlement_source: Optional[str] = None  # "manual" | "apple" | "web" | "free_mode"
    apple_transaction_id: Optional[str] = None
    apple_original_transaction_id: Optional[str] = None
    apple_product_id: Optional[str] = None
    apple_last_verified_at: Optional[str] = None  # ISO timestamp
    apple_revoked_at: Optional[str] = None  # ISO timestamp if revoked
    apple_environment: Optional[str] = None  # "Sandbox" | "Production"


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
        print(f"[SubscriberStore] use_pg={self._use_pg} has_DATABASE_URL={bool(self._pg_url)}")

    # -------------------------
    # Postgres
    # -------------------------
    def _pg_conn(self):
        assert self._pg_url, "DATABASE_URL is required for Postgres mode"
        return psycopg.connect(self._pg_url, row_factory=dict_row)

    def _init_pg(self) -> None:
        with self._pg_conn() as conn:
            # Main subscribers table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS subscribers (
                    email TEXT PRIMARY KEY,
                    active BOOLEAN NOT NULL,
                    stripe_customer_id TEXT,
                    stripe_subscription_id TEXT UNIQUE,
                    -- NEW: Apple Sign-In fields
                    apple_user_id TEXT UNIQUE,
                    first_name TEXT,
                    last_name TEXT
                );
                """
            )
            # ✅ Webhook Audit Log table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS stripe_webhook_logs (
                    id SERIAL PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    email TEXT,
                    active BOOLEAN,
                    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    stripe_event_id TEXT UNIQUE
                );
                """
            )
            # Add plans_generated column if it doesn't exist
            conn.execute(
                """
                ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS plans_generated INTEGER DEFAULT 0;
                """
            )
            # Add subscription_expires_at column for StoreKit subscriptions
            conn.execute(
                """
                ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
                """
            )
            # Add entitlement tracking columns (production-grade StoreKit)
            conn.execute(
                """
                ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS entitlement_source TEXT;
                """
            )
            conn.execute(
                """
                ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS apple_transaction_id TEXT;
                """
            )
            conn.execute(
                """
                ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT;
                """
            )
            conn.execute(
                """
                ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS apple_product_id TEXT;
                """
            )
            conn.execute(
                """
                ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS apple_last_verified_at TIMESTAMP;
                """
            )
            conn.execute(
                """
                ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS apple_revoked_at TIMESTAMP;
                """
            )
            conn.execute(
                """
                ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS apple_environment TEXT;
                """
            )
            # StoreKit transactions table (idempotency + audit)
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS storekit_transactions (
                    id SERIAL PRIMARY KEY,
                    transaction_id TEXT UNIQUE NOT NULL,
                    original_transaction_id TEXT,
                    product_id TEXT NOT NULL,
                    bundle_id TEXT,
                    purchase_date TIMESTAMP,
                    expiration_date TIMESTAMP,
                    revocation_date TIMESTAMP,
                    environment TEXT,
                    email TEXT,
                    user_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        # NEW: Apple Sign-In fields
        apple_user_id: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> None:
        email_norm = email.lower().strip()
        with self._pg_conn() as conn:
            conn.execute(
                """
                INSERT INTO subscribers (email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (email)
                DO UPDATE SET
                    active = EXCLUDED.active,
                    stripe_customer_id = EXCLUDED.stripe_customer_id,
                    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
                    -- NEW: Update Apple fields if provided and not null
                    apple_user_id = COALESCE(EXCLUDED.apple_user_id, subscribers.apple_user_id),
                    first_name = COALESCE(EXCLUDED.first_name, subscribers.first_name),
                    last_name = COALESCE(EXCLUDED.last_name, subscribers.last_name);
                """,
                (email_norm, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name),
            )
            conn.commit()

    def _pg_get(self, email: str) -> Optional[Subscriber]:
        email_norm = email.lower().strip()
        with self._pg_conn() as conn:
            row = conn.execute(
                """
                SELECT email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name, COALESCE(plans_generated, 0) as plans_generated
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
            apple_user_id=row["apple_user_id"],
            first_name=row["first_name"],
            last_name=row["last_name"],
            plans_generated=row["plans_generated"] or 0,
        )

    def _pg_get_by_apple_id(self, apple_user_id: str) -> Optional[Subscriber]:
        with self._pg_conn() as conn:
            row = conn.execute(
                """
                SELECT email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name, COALESCE(plans_generated, 0) as plans_generated
                FROM subscribers
                WHERE apple_user_id = %s
                """,
                (apple_user_id,),
            ).fetchone()

        if not row:
            return None

        return Subscriber(
            email=row["email"],
            active=bool(row["active"]),
            stripe_customer_id=row["stripe_customer_id"],
            stripe_subscription_id=row["stripe_subscription_id"],
            apple_user_id=row["apple_user_id"],
            first_name=row["first_name"],
            last_name=row["last_name"],
            plans_generated=row["plans_generated"] or 0,
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
                    stripe_subscription_id TEXT,
                    -- NEW: Apple Sign-In fields
                    apple_user_id TEXT UNIQUE,
                    first_name TEXT,
                    last_name TEXT
                );
                """
            )
            # Add plans_generated column if it doesn't exist (SQLite migration)
            try:
                conn.execute("ALTER TABLE subscribers ADD COLUMN plans_generated INTEGER DEFAULT 0;")
            except sqlite3.OperationalError:
                pass  # Column already exists
            conn.commit()

    # -------------------------
    # Public API
    # -------------------------
    def create(
        self,
        email: str,
        *,
        active: bool = True, # Default to active for new sign-ups
        stripe_customer_id: Optional[str] = None,
        stripe_subscription_id: Optional[str] = None,
        apple_user_id: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> None:
        email_norm = email.lower().strip()
        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO subscribers (email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO NOTHING; -- Do nothing if email already exists
                    """,
                    (email_norm, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name),
                )
                conn.commit()
        else:
            # SQLite path
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO subscribers (email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(email) DO NOTHING;
                    """,
                    (email_norm, 1 if active else 0, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name),
                )
                conn.commit()

    def update_apple_user_id(self, email: str, apple_user_id: str) -> None:
        """Updates the apple_user_id for a given email."""
        email_norm = email.lower().strip()
        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    UPDATE subscribers SET apple_user_id = %s WHERE email = %s;
                    """,
                    (apple_user_id, email_norm),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    UPDATE subscribers SET apple_user_id = ? WHERE email = ?;
                    """,
                    (apple_user_id, email_norm),
                )
                conn.commit()

    def update_email(self, old_email: str, new_email: str) -> None:
        """Updates the email address for a subscriber.
        This is typically used for Apple private relay emails when the real email is revealed later.
        """
        old_email_norm = old_email.lower().strip()
        new_email_norm = new_email.lower().strip()

        if old_email_norm == new_email_norm:
            return # No change needed

        if self._use_pg:
            with self._pg_conn() as conn:
                # First, check if the new email already exists (violates PRIMARY KEY constraint)
                existing_new_email = conn.execute(
                    "SELECT email FROM subscribers WHERE email = %s;",
                    (new_email_norm,)
                ).fetchone()

                if existing_new_email:
                    # If new email exists, we need to merge or decide. For now, we'll error or ignore.
                    # A more complex merge strategy might be needed depending on business rules.
                    print(f"WARNING: Cannot update email from {old_email_norm} to {new_email_norm} as {new_email_norm} already exists.")
                    return
                
                conn.execute(
                    """
                    UPDATE subscribers SET email = %s WHERE email = %s;
                    """,
                    (new_email_norm, old_email_norm),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                existing_new_email = conn.execute(
                    "SELECT email FROM subscribers WHERE email = ?;",
                    (new_email_norm,)
                ).fetchone()

                if existing_new_email:
                    print(f"WARNING: Cannot update email from {old_email_norm} to {new_email_norm} as {new_email_norm} already exists.")
                    return

                conn.execute(
                    """
                    UPDATE subscribers SET email = ? WHERE email = ?;
                    """,
                    (new_email_norm, old_email_norm),
                )
                conn.commit()

    def upsert_active(
        self,
        email: str,
        *,
        active: bool,
        stripe_customer_id: Optional[str] = None,
        stripe_subscription_id: Optional[str] = None,
        # NEW: Apple Sign-In fields (added to upsert_active for consistency)
        apple_user_id: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
    ) -> None:
        if self._use_pg:
            return self._pg_upsert(
                email,
                active=active,
                stripe_customer_id=stripe_customer_id,
                stripe_subscription_id=stripe_subscription_id,
                apple_user_id=apple_user_id,
                first_name=first_name,
                last_name=last_name,
            )

        # SQLite path
        email_norm = email.lower().strip()
        with self._sqlite_conn() as conn:
            conn.execute(
                """
                INSERT INTO subscribers (email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(email) DO UPDATE SET
                    active=excluded.active,
                    stripe_customer_id=excluded.stripe_customer_id,
                    stripe_subscription_id=excluded.stripe_subscription_id,
                    -- NEW: Update Apple fields if provided and not null
                    apple_user_id = COALESCE(excluded.apple_user_id, subscribers.apple_user_id),
                    first_name = COALESCE(excluded.first_name, subscribers.first_name),
                    last_name = COALESCE(excluded.last_name, subscribers.last_name)
                """,
                (email_norm, 1 if active else 0, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name),
            )
            conn.commit()

    def log_webhook(self, event_type: str, email: str, active: bool, event_id: str) -> None:
        """Saves a record of the webhook event to Postgres for auditing."""
        if not self._use_pg:
            # We skip local logging to avoid database migrations on SQLite
            return
            
        with self._pg_conn() as conn:
            conn.execute(
                """
                INSERT INTO stripe_webhook_logs (event_type, email, active, stripe_event_id)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (stripe_event_id) DO NOTHING;
                """,
                (event_type, email.lower().strip(), active, event_id)
            )
            conn.commit()

    def get(self, email: str) -> Optional[Subscriber]:
        if self._use_pg:
            return self._pg_get(email)

        email_norm = email.lower().strip()
        with self._sqlite_conn() as conn:
            row = conn.execute(
                "SELECT email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name, COALESCE(plans_generated, 0) as plans_generated FROM subscribers WHERE email=?",
                (email_norm,),
            ).fetchone()
            if not row:
                return None
            return Subscriber(
                email=row["email"],
                active=bool(row["active"]),
                stripe_customer_id=row["stripe_customer_id"],
                stripe_subscription_id=row["stripe_subscription_id"],
                apple_user_id=row["apple_user_id"],
                first_name=row["first_name"],
                last_name=row["last_name"],
                plans_generated=row["plans_generated"] or 0,
            )

    def get_by_apple_id(self, apple_user_id: str) -> Optional[Subscriber]:
        """Look up subscriber by Apple user ID."""
        if self._use_pg:
            return self._pg_get_by_apple_id(apple_user_id)

        # SQLite fallback
        with self._sqlite_conn() as conn:
            row = conn.execute(
                "SELECT email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name, COALESCE(plans_generated, 0) as plans_generated FROM subscribers WHERE apple_user_id=?",
                (apple_user_id,),
            ).fetchone()
            if not row:
                return None
            return Subscriber(
                email=row["email"],
                active=bool(row["active"]),
                stripe_customer_id=row["stripe_customer_id"],
                stripe_subscription_id=row["stripe_subscription_id"],
                apple_user_id=row["apple_user_id"],
                first_name=row["first_name"],
                last_name=row["last_name"],
                plans_generated=row["plans_generated"] or 0,
            )

    def increment_plans_generated(self, email: str) -> int:
        """Increment plans_generated for a user (free tier tracking). Returns new count."""
        email_norm = email.lower().strip()
        if self._use_pg:
            with self._pg_conn() as conn:
                # First ensure user exists with default 0 if not
                conn.execute(
                    """
                    INSERT INTO subscribers (email, active, plans_generated)
                    VALUES (%s, FALSE, 0)
                    ON CONFLICT (email) DO NOTHING;
                    """,
                    (email_norm,)
                )
                # Then increment
                row = conn.execute(
                    """
                    UPDATE subscribers
                    SET plans_generated = COALESCE(plans_generated, 0) + 1
                    WHERE email = %s
                    RETURNING plans_generated;
                    """,
                    (email_norm,)
                ).fetchone()
                conn.commit()
                return row["plans_generated"] if row else 1
        else:
            with self._sqlite_conn() as conn:
                # Ensure user exists
                conn.execute(
                    """
                    INSERT INTO subscribers (email, active, plans_generated)
                    VALUES (?, 0, 0)
                    ON CONFLICT(email) DO NOTHING;
                    """,
                    (email_norm,)
                )
                # Increment
                conn.execute(
                    """
                    UPDATE subscribers
                    SET plans_generated = COALESCE(plans_generated, 0) + 1
                    WHERE email = ?;
                    """,
                    (email_norm,)
                )
                conn.commit()
                # Fetch new value
                row = conn.execute(
                    "SELECT plans_generated FROM subscribers WHERE email = ?",
                    (email_norm,)
                ).fetchone()
                return row["plans_generated"] if row else 1

    def get_plans_generated(self, email: str) -> int:
        """Get plans_generated count for a user."""
        sub = self.get(email)
        return sub.plans_generated if sub else 0

    def is_active(self, email: str) -> bool:
        sub = self.get(email)
        return bool(sub and sub.active)

    def list_all(self, limit: int = 100, offset: int = 0, search: Optional[str] = None) -> list[Subscriber]:
        """List all subscribers with optional search."""
        if self._use_pg:
            with self._pg_conn() as conn:
                if search:
                    search_term = f"%{search.lower()}%"
                    rows = conn.execute(
                        """
                        SELECT email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name
                        FROM subscribers
                        WHERE LOWER(email) LIKE %s OR LOWER(first_name) LIKE %s OR LOWER(last_name) LIKE %s
                        ORDER BY email
                        LIMIT %s OFFSET %s
                        """,
                        (search_term, search_term, search_term, limit, offset),
                    ).fetchall()
                else:
                    rows = conn.execute(
                        """
                        SELECT email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name
                        FROM subscribers
                        ORDER BY email
                        LIMIT %s OFFSET %s
                        """,
                        (limit, offset),
                    ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                if search:
                    search_term = f"%{search.lower()}%"
                    rows = conn.execute(
                        """
                        SELECT email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name
                        FROM subscribers
                        WHERE LOWER(email) LIKE ? OR LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?
                        ORDER BY email
                        LIMIT ? OFFSET ?
                        """,
                        (search_term, search_term, search_term, limit, offset),
                    ).fetchall()
                else:
                    rows = conn.execute(
                        """
                        SELECT email, active, stripe_customer_id, stripe_subscription_id, apple_user_id, first_name, last_name
                        FROM subscribers
                        ORDER BY email
                        LIMIT ? OFFSET ?
                        """,
                        (limit, offset),
                    ).fetchall()

        return [
            Subscriber(
                email=row["email"],
                active=bool(row["active"]),
                stripe_customer_id=row["stripe_customer_id"],
                stripe_subscription_id=row["stripe_subscription_id"],
                apple_user_id=row["apple_user_id"],
                first_name=row["first_name"],
                last_name=row["last_name"],
            )
            for row in rows
        ]

    def set_active(self, email: str, active: bool, expires_at: Optional[str] = None) -> bool:
        """Set a subscriber's active status. Returns True if found and updated.

        Args:
            email: User email
            active: Whether subscription is active
            expires_at: Optional ISO timestamp when subscription expires (for StoreKit)
        """
        email_norm = email.lower().strip()
        if self._use_pg:
            with self._pg_conn() as conn:
                if expires_at:
                    result = conn.execute(
                        "UPDATE subscribers SET active = %s, subscription_expires_at = %s WHERE email = %s",
                        (active, expires_at, email_norm),
                    )
                else:
                    result = conn.execute(
                        "UPDATE subscribers SET active = %s WHERE email = %s",
                        (active, email_norm),
                    )
                conn.commit()
                return result.rowcount > 0
        else:
            with self._sqlite_conn() as conn:
                if expires_at:
                    cursor = conn.execute(
                        "UPDATE subscribers SET active = ?, subscription_expires_at = ? WHERE email = ?",
                        (1 if active else 0, expires_at, email_norm),
                    )
                else:
                    cursor = conn.execute(
                        "UPDATE subscribers SET active = ? WHERE email = ?",
                        (1 if active else 0, email_norm),
                    )
                conn.commit()
                return cursor.rowcount > 0

    def is_subscription_expired(self, email: str) -> bool:
        """Check if a user's StoreKit subscription has expired."""
        email_norm = email.lower().strip()
        from datetime import datetime

        if self._use_pg:
            with self._pg_conn() as conn:
                row = conn.execute(
                    "SELECT subscription_expires_at FROM subscribers WHERE email = %s",
                    (email_norm,),
                ).fetchone()
                if not row or not row.get("subscription_expires_at"):
                    return False  # No expiration set = not expired (Stripe or FREE_MODE)
                expires_at = row["subscription_expires_at"]
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                return datetime.utcnow() > expires_at.replace(tzinfo=None)
        else:
            with self._sqlite_conn() as conn:
                row = conn.execute(
                    "SELECT subscription_expires_at FROM subscribers WHERE email = ?",
                    (email_norm,),
                ).fetchone()
                if not row or not row[0]:
                    return False
                expires_at = datetime.fromisoformat(row[0].replace("Z", "+00:00"))
                return datetime.utcnow() > expires_at.replace(tzinfo=None)

    def add_manual(self, email: str, first_name: str = "", last_name: str = "", active: bool = True) -> None:
        """Manually add a subscriber (admin function). Sets entitlement_source to 'manual'."""
        self.upsert_active(
            email,
            active=active,
            first_name=first_name if first_name else None,
            last_name=last_name if last_name else None,
        )
        # Set entitlement_source to manual
        email_norm = email.lower().strip()
        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    "UPDATE subscribers SET entitlement_source = 'manual' WHERE email = %s",
                    (email_norm,),
                )
                conn.commit()

    # -------------------------
    # StoreKit Transaction Methods (Production-Grade)
    # -------------------------

    def transaction_exists(self, transaction_id: str) -> bool:
        """Check if a StoreKit transaction already exists (for idempotency)."""
        if self._use_pg:
            with self._pg_conn() as conn:
                row = conn.execute(
                    "SELECT 1 FROM storekit_transactions WHERE transaction_id = %s",
                    (transaction_id,),
                ).fetchone()
                return row is not None
        return False  # SQLite fallback - always process

    def record_transaction(
        self,
        transaction_id: str,
        original_transaction_id: str,
        product_id: str,
        bundle_id: str,
        purchase_date: str,
        expiration_date: Optional[str],
        revocation_date: Optional[str],
        environment: str,
        email: str,
        user_id: Optional[str] = None,
    ) -> bool:
        """
        Record a StoreKit transaction (idempotent).
        Returns True if newly inserted, False if already existed.
        """
        if self._use_pg:
            with self._pg_conn() as conn:
                try:
                    conn.execute(
                        """
                        INSERT INTO storekit_transactions
                        (transaction_id, original_transaction_id, product_id, bundle_id,
                         purchase_date, expiration_date, revocation_date, environment, email, user_id)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (transaction_id) DO NOTHING
                        """,
                        (
                            transaction_id,
                            original_transaction_id,
                            product_id,
                            bundle_id,
                            purchase_date,
                            expiration_date,
                            revocation_date,
                            environment,
                            email.lower().strip(),
                            user_id,
                        ),
                    )
                    conn.commit()
                    return True
                except Exception:
                    return False
        return True  # SQLite fallback

    def activate_apple_subscription(
        self,
        email: str,
        transaction_id: str,
        original_transaction_id: str,
        product_id: str,
        expiration_date: str,
        environment: str,
    ) -> bool:
        """
        Activate a subscriber's Pro status from a verified Apple transaction.
        Uses Apple's real expiration date, not a guessed TTL.
        """
        email_norm = email.lower().strip()
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()

        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    """
                    UPDATE subscribers SET
                        active = TRUE,
                        subscription_expires_at = %s,
                        entitlement_source = 'apple',
                        apple_transaction_id = %s,
                        apple_original_transaction_id = %s,
                        apple_product_id = %s,
                        apple_last_verified_at = %s,
                        apple_revoked_at = NULL,
                        apple_environment = %s
                    WHERE email = %s
                    """,
                    (
                        expiration_date,
                        transaction_id,
                        original_transaction_id,
                        product_id,
                        now,
                        environment,
                        email_norm,
                    ),
                )
                conn.commit()
                return result.rowcount > 0
        return False

    def revoke_apple_subscription(self, email: str, revocation_date: str) -> bool:
        """Mark a subscription as revoked (refunded/cancelled by Apple)."""
        email_norm = email.lower().strip()
        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    """
                    UPDATE subscribers SET
                        active = FALSE,
                        apple_revoked_at = %s
                    WHERE email = %s AND entitlement_source = 'apple'
                    """,
                    (revocation_date, email_norm),
                )
                conn.commit()
                return result.rowcount > 0
        return False

    def update_apple_expiration(self, email: str, expiration_date: str) -> bool:
        """Update expiration date (for renewals via server notifications)."""
        email_norm = email.lower().strip()
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()

        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    """
                    UPDATE subscribers SET
                        active = TRUE,
                        subscription_expires_at = %s,
                        apple_last_verified_at = %s,
                        apple_revoked_at = NULL
                    WHERE email = %s AND entitlement_source = 'apple'
                    """,
                    (expiration_date, now, email_norm),
                )
                conn.commit()
                return result.rowcount > 0
        return False

    def get_apple_subscription_status(self, email: str) -> dict:
        """Get detailed Apple subscription status for a user."""
        email_norm = email.lower().strip()
        from datetime import datetime, timezone

        if self._use_pg:
            with self._pg_conn() as conn:
                row = conn.execute(
                    """
                    SELECT active, subscription_expires_at, entitlement_source,
                           apple_transaction_id, apple_revoked_at, apple_environment
                    FROM subscribers WHERE email = %s
                    """,
                    (email_norm,),
                ).fetchone()

                if not row:
                    return {"exists": False}

                now = datetime.now(timezone.utc)
                expires_at = row.get("subscription_expires_at")
                revoked_at = row.get("apple_revoked_at")
                source = row.get("entitlement_source")

                # Determine actual membership status
                is_member = False
                if source == "manual":
                    is_member = bool(row.get("active"))
                elif source == "apple":
                    is_active = bool(row.get("active"))
                    is_not_revoked = revoked_at is None
                    is_not_expired = True
                    if expires_at:
                        if isinstance(expires_at, str):
                            exp_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                        else:
                            exp_dt = expires_at.replace(tzinfo=timezone.utc) if expires_at.tzinfo is None else expires_at
                        is_not_expired = exp_dt > now
                    is_member = is_active and is_not_revoked and is_not_expired
                elif source == "web":
                    is_member = bool(row.get("active"))

                return {
                    "exists": True,
                    "is_member": is_member,
                    "entitlement_source": source,
                    "subscription_expires_at": str(expires_at) if expires_at else None,
                    "apple_revoked_at": str(revoked_at) if revoked_at else None,
                    "apple_environment": row.get("apple_environment"),
                }

        return {"exists": False}