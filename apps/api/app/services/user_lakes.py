# apps/api/app/services/user_lakes.py
"""
User favorite lakes storage (for plan rotation).
"""
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from typing import Optional, List

import psycopg
from psycopg.rows import dict_row


@dataclass(frozen=True)
class FavoriteLake:
    email: str
    lake_id: str
    lake_type: str  # 'known' or 'custom'
    added_at: str


class UserLakeStore:
    """
    User favorite lakes storage (plan rotation).
    - Locally: falls back to SQLite.
    - On Render: uses Postgres via DATABASE_URL.
    """

    def __init__(self) -> None:
        self._pg_url = os.getenv("DATABASE_URL")
        self._use_pg = bool(self._pg_url and self._pg_url.startswith("postgres"))

        if self._use_pg:
            self._init_pg()
        else:
            self._init_sqlite()
        print(f"[UserLakeStore] use_pg={self._use_pg}")

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
                CREATE TABLE IF NOT EXISTS user_favorite_lakes (
                    email TEXT NOT NULL,
                    lake_id TEXT NOT NULL,
                    lake_type TEXT NOT NULL,
                    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (email, lake_id, lake_type)
                );
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_favorite_lakes_email ON user_favorite_lakes(email);"
            )
            conn.commit()

    def _row_to_favorite(self, row: dict) -> FavoriteLake:
        return FavoriteLake(
            email=row["email"],
            lake_id=row["lake_id"],
            lake_type=row["lake_type"],
            added_at=str(row["added_at"]),
        )

    # -------------------------
    # SQLite (local fallback)
    # -------------------------
    def _sqlite_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(os.path.dirname(base_dir), "data")
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, "user_lakes.sqlite3")

    def _sqlite_conn(self):
        conn = sqlite3.connect(self._sqlite_path())
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self) -> None:
        with self._sqlite_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS user_favorite_lakes (
                    email TEXT NOT NULL,
                    lake_id TEXT NOT NULL,
                    lake_type TEXT NOT NULL,
                    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (email, lake_id, lake_type)
                );
                """
            )
            conn.commit()

    # -------------------------
    # Public API
    # -------------------------
    def add(self, email: str, lake_id: str, lake_type: str) -> bool:
        """
        Add a lake to user's favorites.
        Returns True if added, False if already exists.
        """
        email_norm = email.lower().strip()

        if lake_type not in ("known", "custom"):
            raise ValueError("lake_type must be 'known' or 'custom'")

        if self._use_pg:
            with self._pg_conn() as conn:
                try:
                    conn.execute(
                        """
                        INSERT INTO user_favorite_lakes (email, lake_id, lake_type)
                        VALUES (%s, %s, %s)
                        ON CONFLICT DO NOTHING
                        """,
                        (email_norm, lake_id, lake_type),
                    )
                    conn.commit()
                    return True
                except Exception:
                    return False
        else:
            with self._sqlite_conn() as conn:
                try:
                    conn.execute(
                        """
                        INSERT OR IGNORE INTO user_favorite_lakes (email, lake_id, lake_type)
                        VALUES (?, ?, ?)
                        """,
                        (email_norm, lake_id, lake_type),
                    )
                    conn.commit()
                    return True
                except Exception:
                    return False

    def remove(self, email: str, lake_id: str, lake_type: str) -> bool:
        """
        Remove a lake from user's favorites.
        Returns True if removed.
        """
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    """
                    DELETE FROM user_favorite_lakes 
                    WHERE email = %s AND lake_id = %s AND lake_type = %s
                    RETURNING lake_id
                    """,
                    (email_norm, lake_id, lake_type),
                ).fetchone()
                conn.commit()
                return result is not None
        else:
            with self._sqlite_conn() as conn:
                cursor = conn.execute(
                    """
                    DELETE FROM user_favorite_lakes 
                    WHERE email = ? AND lake_id = ? AND lake_type = ?
                    """,
                    (email_norm, lake_id, lake_type),
                )
                conn.commit()
                return cursor.rowcount > 0

    def list_by_user(self, email: str) -> List[FavoriteLake]:
        """List all favorite lakes for a user."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM user_favorite_lakes 
                    WHERE email = %s 
                    ORDER BY added_at DESC
                    """,
                    (email_norm,),
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM user_favorite_lakes 
                    WHERE email = ? 
                    ORDER BY added_at DESC
                    """,
                    (email_norm,),
                ).fetchall()

        return [self._row_to_favorite(dict(row)) for row in rows]

    def is_favorite(self, email: str, lake_id: str, lake_type: str) -> bool:
        """Check if a lake is in user's favorites."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                row = conn.execute(
                    """
                    SELECT 1 FROM user_favorite_lakes 
                    WHERE email = %s AND lake_id = %s AND lake_type = %s
                    """,
                    (email_norm, lake_id, lake_type),
                ).fetchone()
        else:
            with self._sqlite_conn() as conn:
                row = conn.execute(
                    """
                    SELECT 1 FROM user_favorite_lakes 
                    WHERE email = ? AND lake_id = ? AND lake_type = ?
                    """,
                    (email_norm, lake_id, lake_type),
                ).fetchone()

        return row is not None

    def count_by_user(self, email: str) -> int:
        """Count total favorites for a user."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    "SELECT COUNT(*) as count FROM user_favorite_lakes WHERE email = %s",
                    (email_norm,),
                ).fetchone()
        else:
            with self._sqlite_conn() as conn:
                result = conn.execute(
                    "SELECT COUNT(*) as count FROM user_favorite_lakes WHERE email = ?",
                    (email_norm,),
                ).fetchone()

        return result["count"] if result else 0