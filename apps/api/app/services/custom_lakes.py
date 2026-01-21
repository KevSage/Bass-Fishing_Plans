# apps/api/app/services/custom_lakes.py
"""
User custom lake storage for user-named waters.
"""
from __future__ import annotations

import os
import uuid
import sqlite3
from dataclasses import dataclass
from typing import Optional, List
import psycopg
from psycopg.rows import dict_row
from math import radians, cos

@dataclass(frozen=True)
class CustomLake:
    id: str
    email: str
    name: str
    lat: float
    lng: float
    city: Optional[str]
    state: Optional[str]
    catch_count: int
    created_at: str


class CustomLakeStore:
    """
    Custom lake storage for user-named waters.
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
        print(f"[CustomLakeStore] use_pg={self._use_pg}")

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
                CREATE TABLE IF NOT EXISTS user_custom_lakes (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    name TEXT NOT NULL,
                    lat DECIMAL(9,6) NOT NULL,
                    lng DECIMAL(9,6) NOT NULL,
                    city TEXT,
                    state TEXT,
                    catch_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_custom_lakes_email ON user_custom_lakes(email);"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_custom_lakes_coords ON user_custom_lakes(lat, lng);"
            )
            conn.commit()

    def _row_to_custom_lake(self, row: dict) -> CustomLake:
        return CustomLake(
            id=row["id"],
            email=row["email"],
            name=row["name"],
            lat=float(row["lat"]),
            lng=float(row["lng"]),
            city=row["city"],
            state=row["state"],
            catch_count=row["catch_count"] or 0,
            created_at=str(row["created_at"]),
        )

    # -------------------------
    # SQLite (local fallback)
    # -------------------------
    def _sqlite_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(os.path.dirname(base_dir), "data")
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, "custom_lakes.sqlite3")

    def _sqlite_conn(self):
        conn = sqlite3.connect(self._sqlite_path())
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self) -> None:
        with self._sqlite_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS user_custom_lakes (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    name TEXT NOT NULL,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    city TEXT,
                    state TEXT,
                    catch_count INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            conn.commit()

    # -------------------------
    # Public API
    # -------------------------
    def create(
        self,
        email: str,
        name: str,
        lat: float,
        lng: float,
        *,
        city: Optional[str] = None,
        state: Optional[str] = None,
    ) -> str:
        """Create a new custom lake. Returns the lake ID."""
        lake_id = f"custom_{uuid.uuid4().hex[:12]}"
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO user_custom_lakes (id, email, name, lat, lng, city, state)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (lake_id, email_norm, name, lat, lng, city, state),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO user_custom_lakes (id, email, name, lat, lng, city, state)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (lake_id, email_norm, name, lat, lng, city, state),
                )
                conn.commit()

        return lake_id

    def get(self, lake_id: str, email: str) -> Optional[CustomLake]:
        """Get a custom lake by ID (must belong to user)."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                row = conn.execute(
                    "SELECT * FROM user_custom_lakes WHERE id = %s AND email = %s",
                    (lake_id, email_norm),
                ).fetchone()
        else:
            with self._sqlite_conn() as conn:
                row = conn.execute(
                    "SELECT * FROM user_custom_lakes WHERE id = ? AND email = ?",
                    (lake_id, email_norm),
                ).fetchone()

        if not row:
            return None
        return self._row_to_custom_lake(dict(row))

    def list_by_user(self, email: str) -> List[CustomLake]:
        """List all custom lakes for a user."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM user_custom_lakes 
                    WHERE email = %s 
                    ORDER BY name ASC
                    """,
                    (email_norm,),
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM user_custom_lakes 
                    WHERE email = ? 
                    ORDER BY name ASC
                    """,
                    (email_norm,),
                ).fetchall()

        return [self._row_to_custom_lake(dict(row)) for row in rows]

    def find_by_proximity(
        self,
        email: str,
        lat: float,
        lng: float,
        radius_km: float = 1.0,
    ) -> Optional[CustomLake]:
        """
        Find a custom lake within radius of coordinates.
        Uses simple bounding box then Haversine for accuracy.
        """
        email_norm = email.lower().strip()
        
        # Rough bounding box (1 degree ≈ 111km)
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * abs(cos(radians(lat))) + 0.001)

        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM user_custom_lakes 
                    WHERE email = %s
                      AND lat BETWEEN %s AND %s
                      AND lng BETWEEN %s AND %s
                    """,
                    (
                        email_norm,
                        lat - lat_delta, lat + lat_delta,
                        lng - lng_delta, lng + lng_delta,
                    ),
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM user_custom_lakes 
                    WHERE email = ?
                      AND lat BETWEEN ? AND ?
                      AND lng BETWEEN ? AND ?
                    """,
                    (
                        email_norm,
                        lat - lat_delta, lat + lat_delta,
                        lng - lng_delta, lng + lng_delta,
                    ),
                ).fetchall()

        # Filter by actual distance
        for row in rows:
            lake = self._row_to_custom_lake(dict(row))
            dist = self._haversine(lat, lng, lake.lat, lake.lng)
            if dist <= radius_km:
                return lake

        return None

    def _haversine(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance in km between two coordinates."""
        from math import radians, cos, sin, asin, sqrt
        
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        return 2 * 6371 * asin(sqrt(a))  # Earth radius in km

    def rename(self, lake_id: str, email: str, new_name: str) -> bool:
        """Rename a custom lake. Returns True if updated."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    """
                    UPDATE user_custom_lakes 
                    SET name = %s 
                    WHERE id = %s AND email = %s
                    RETURNING id
                    """,
                    (new_name, lake_id, email_norm),
                ).fetchone()
                conn.commit()
                return result is not None
        else:
            with self._sqlite_conn() as conn:
                cursor = conn.execute(
                    """
                    UPDATE user_custom_lakes 
                    SET name = ? 
                    WHERE id = ? AND email = ?
                    """,
                    (new_name, lake_id, email_norm),
                )
                conn.commit()
                return cursor.rowcount > 0

    def delete(self, lake_id: str, email: str) -> bool:
        """
        Delete a custom lake. Only allowed if catch_count is 0.
        Returns True if deleted, False if not found or has catches.
        """
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    """
                    DELETE FROM user_custom_lakes 
                    WHERE id = %s AND email = %s AND catch_count = 0
                    RETURNING id
                    """,
                    (lake_id, email_norm),
                ).fetchone()
                conn.commit()
                return result is not None
        else:
            with self._sqlite_conn() as conn:
                cursor = conn.execute(
                    """
                    DELETE FROM user_custom_lakes 
                    WHERE id = ? AND email = ? AND catch_count = 0
                    """,
                    (lake_id, email_norm),
                )
                conn.commit()
                return cursor.rowcount > 0

    def increment_catch_count(self, lake_id: str, email: str) -> None:
        """Increment catch count when a catch is logged at this lake."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    UPDATE user_custom_lakes 
                    SET catch_count = catch_count + 1 
                    WHERE id = %s AND email = %s
                    """,
                    (lake_id, email_norm),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    UPDATE user_custom_lakes 
                    SET catch_count = catch_count + 1 
                    WHERE id = ? AND email = ?
                    """,
                    (lake_id, email_norm),
                )
                conn.commit()

    def decrement_catch_count(self, lake_id: str, email: str) -> None:
        """Decrement catch count when a catch is deleted."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    UPDATE user_custom_lakes 
                    SET catch_count = GREATEST(catch_count - 1, 0)
                    WHERE id = %s AND email = %s
                    """,
                    (lake_id, email_norm),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    UPDATE user_custom_lakes 
                    SET catch_count = MAX(catch_count - 1, 0)
                    WHERE id = ? AND email = ?
                    """,
                    (lake_id, email_norm),
                )
                conn.commit()