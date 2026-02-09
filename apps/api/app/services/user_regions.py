# apps/api/app/services/user_regions.py
"""
User region computation service.
Derives user's fishing region from their favorited lakes.
"""
from __future__ import annotations

import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import psycopg
from psycopg.rows import dict_row


@dataclass(frozen=True)
class UserRegion:
    email: str
    region_name: str
    region_lat: float
    region_lng: float
    state: str
    computed_at: str


class UserRegionStore:
    """
    Stores computed user regions for efficient weather alert dispatch.
    """

    def __init__(self) -> None:
        self._pg_url = os.getenv("DATABASE_URL")
        self._use_pg = bool(self._pg_url and self._pg_url.startswith("postgres"))

        if self._use_pg:
            self._init_pg()
        else:
            self._init_sqlite()

    def _pg_conn(self):
        return psycopg.connect(self._pg_url, row_factory=dict_row)

    def _init_pg(self) -> None:
        with self._pg_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS user_regions (
                    email TEXT PRIMARY KEY,
                    region_name TEXT,
                    region_lat DECIMAL(9,6),
                    region_lng DECIMAL(9,6),
                    state TEXT,
                    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_user_regions_state
                ON user_regions(state);
                """
            )
            conn.commit()

    def _sqlite_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(os.path.dirname(base_dir), "data")
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, "user_regions.sqlite3")

    def _sqlite_conn(self):
        conn = sqlite3.connect(self._sqlite_path())
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self) -> None:
        with self._sqlite_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS user_regions (
                    email TEXT PRIMARY KEY,
                    region_name TEXT,
                    region_lat REAL,
                    region_lng REAL,
                    state TEXT,
                    computed_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            conn.commit()

    def upsert(self, region: UserRegion) -> None:
        """Insert or update a user's region."""
        email_norm = region.email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO user_regions (email, region_name, region_lat, region_lng, state, computed_at)
                    VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (email)
                    DO UPDATE SET
                        region_name = EXCLUDED.region_name,
                        region_lat = EXCLUDED.region_lat,
                        region_lng = EXCLUDED.region_lng,
                        state = EXCLUDED.state,
                        computed_at = CURRENT_TIMESTAMP;
                    """,
                    (email_norm, region.region_name, region.region_lat, region.region_lng, region.state),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO user_regions (email, region_name, region_lat, region_lng, state, computed_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(email) DO UPDATE SET
                        region_name = excluded.region_name,
                        region_lat = excluded.region_lat,
                        region_lng = excluded.region_lng,
                        state = excluded.state,
                        computed_at = CURRENT_TIMESTAMP;
                    """,
                    (email_norm, region.region_name, region.region_lat, region.region_lng, region.state),
                )
                conn.commit()

    def get(self, email: str) -> Optional[UserRegion]:
        """Get a user's cached region."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                row = conn.execute(
                    "SELECT * FROM user_regions WHERE email = %s",
                    (email_norm,),
                ).fetchone()
        else:
            with self._sqlite_conn() as conn:
                row = conn.execute(
                    "SELECT * FROM user_regions WHERE email = ?",
                    (email_norm,),
                ).fetchone()

        if not row:
            return None

        return UserRegion(
            email=row["email"],
            region_name=row["region_name"],
            region_lat=float(row["region_lat"]),
            region_lng=float(row["region_lng"]),
            state=row["state"],
            computed_at=str(row["computed_at"]),
        )

    def get_users_by_state(self, state: str) -> List[str]:
        """Get all users in a given state."""
        state_upper = state.upper().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    "SELECT email FROM user_regions WHERE UPPER(state) = %s",
                    (state_upper,),
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    "SELECT email FROM user_regions WHERE UPPER(state) = ?",
                    (state_upper,),
                ).fetchall()

        return [row["email"] for row in rows]

    def get_unique_states(self) -> List[str]:
        """Get list of all unique states with users."""
        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    "SELECT DISTINCT state FROM user_regions WHERE state IS NOT NULL"
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    "SELECT DISTINCT state FROM user_regions WHERE state IS NOT NULL"
                ).fetchall()

        return [row["state"] for row in rows if row["state"]]

    def get_all_with_coordinates(self) -> List[UserRegion]:
        """Get all user regions with coordinates for weather checks."""
        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    "SELECT * FROM user_regions WHERE region_lat IS NOT NULL"
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    "SELECT * FROM user_regions WHERE region_lat IS NOT NULL"
                ).fetchall()

        return [
            UserRegion(
                email=row["email"],
                region_name=row["region_name"],
                region_lat=float(row["region_lat"]),
                region_lng=float(row["region_lng"]),
                state=row["state"],
                computed_at=str(row["computed_at"]),
            )
            for row in rows
        ]


class UserRegionService:
    """
    Computes and manages user regions based on their favorited lakes.
    """

    def __init__(self) -> None:
        self._store = UserRegionStore()

    def compute_user_region(self, email: str) -> Optional[UserRegion]:
        """
        Compute a user's region from their favorited lakes.

        1. Get all favorite lakes for user
        2. Calculate geographic centroid
        3. Determine primary state
        4. Store and return
        """
        from app.services.user_lakes import UserLakeStore
        from app.services.custom_lakes import CustomLakeStore

        user_lake_store = UserLakeStore()
        custom_lake_store = CustomLakeStore()

        # Get user's favorites
        favorites = user_lake_store.list_by_user(email)

        if not favorites:
            return None

        # Collect coordinates and states
        coordinates = []
        states = []

        for fav in favorites:
            if fav.lake_type == "custom":
                # Get custom lake details
                lake = custom_lake_store.get(fav.lake_id, email)
                if lake and lake.lat and lake.lng:
                    coordinates.append((lake.lat, lake.lng))
                    if lake.state:
                        states.append(lake.state)
            else:
                # For known lakes, we'd need to look up from lakes.json
                # For now, skip known lakes without stored coordinates
                # TODO: Load lakes.json on backend or store coordinates
                pass

        if not coordinates:
            return None

        # Calculate centroid
        avg_lat = sum(c[0] for c in coordinates) / len(coordinates)
        avg_lng = sum(c[1] for c in coordinates) / len(coordinates)

        # Determine primary state (most common)
        primary_state = ""
        if states:
            state_counts = {}
            for s in states:
                state_counts[s] = state_counts.get(s, 0) + 1
            primary_state = max(state_counts, key=state_counts.get)

        # Create region name
        region_name = f"{primary_state} area" if primary_state else "Your area"

        # Create and store region
        region = UserRegion(
            email=email.lower().strip(),
            region_name=region_name,
            region_lat=avg_lat,
            region_lng=avg_lng,
            state=primary_state,
            computed_at=datetime.now().isoformat(),
        )

        self._store.upsert(region)
        return region

    def get_or_compute_region(self, email: str, max_age_days: int = 7) -> Optional[UserRegion]:
        """
        Get cached region or compute if stale.
        """
        cached = self._store.get(email)

        if cached:
            # Check if still fresh
            try:
                computed_at = datetime.fromisoformat(cached.computed_at.replace("Z", "+00:00"))
                if datetime.now(computed_at.tzinfo or None) - computed_at < timedelta(days=max_age_days):
                    return cached
            except (ValueError, TypeError):
                pass

        # Recompute
        return self.compute_user_region(email)

    def get_users_in_region(self, state: str) -> List[str]:
        """Get all users in a given state/region."""
        return self._store.get_users_by_state(state)
