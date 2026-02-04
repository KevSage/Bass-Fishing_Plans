# apps/api/app/services/custom_lakes.py
"""
User custom lake storage for user-named waters.
"""
from __future__ import annotations

import os
import uuid
import sqlite3
import json
from dataclasses import dataclass
from typing import Optional, List, Dict
import psycopg
from psycopg.rows import dict_row
from math import radians, cos, sin, asin, sqrt

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
    anchors: List[Dict[str, float]]  # Added anchors field


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
            # 1. Create Table (if fresh install)
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
                    anchors JSONB,
                    catch_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            
            # 2. Schema Migration: Add 'anchors' column if missing
            # This handles the case where the table exists but the column does not.
            try:
                conn.execute("ALTER TABLE user_custom_lakes ADD COLUMN anchors JSONB;")
                conn.commit()
                print("[CustomLakeStore] Postgres migration: Added 'anchors' column.")
            except psycopg.errors.DuplicateColumn:
                conn.rollback()  # Column already exists, safe to ignore
            except Exception as e:
                conn.rollback()
                print(f"[CustomLakeStore] Postgres check skipped: {e}")

            # 3. Indices
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_custom_lakes_email ON user_custom_lakes(email);"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_custom_lakes_coords ON user_custom_lakes(lat, lng);"
            )
            conn.commit()

    def _row_to_custom_lake(self, row: dict) -> CustomLake:
        # Parse anchors safely
        anchors_val = row.get("anchors")
        if isinstance(anchors_val, str):
            try:
                anchors_val = json.loads(anchors_val)
            except:
                anchors_val = []
        
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
            anchors=anchors_val or []
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
                    anchors TEXT,
                    catch_count INTEGER DEFAULT 0,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            # Migration check for SQLite
            try:
                conn.execute("ALTER TABLE user_custom_lakes ADD COLUMN anchors TEXT")
                print("[CustomLakeStore] SQLite migration: Added 'anchors' column.")
            except sqlite3.OperationalError:
                pass # Column exists
            
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
        anchors: Optional[List[Dict[str, float]]] = None,
    ) -> str:
        """
        Create a new custom lake. 
        1. Inserts into DB (persists for user).
        2. Prints updated lakes.json content to console (for Admin export).
        """
        lake_id = f"custom_{uuid.uuid4().hex[:12]}"
        email_norm = email.lower().strip()
        anchors_json = json.dumps(anchors) if anchors else None

        # 1. Database Insert
        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO user_custom_lakes (id, email, name, lat, lng, city, state, anchors)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (lake_id, email_norm, name, lat, lng, city, state, anchors_json),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO user_custom_lakes (id, email, name, lat, lng, city, state, anchors)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (lake_id, email_norm, name, lat, lng, city, state, anchors_json),
                )
                conn.commit()

        # 2. Admin Helper: Print the full updated JSON file content
        self._print_admin_json_export(lake_id, name, city, state, lat, lng, anchors)

        return lake_id

    def update_geometry(
        self,
        lake_id: str,
        email: str,
        anchors: List[Dict[str, float]]
    ) -> bool:
        """
        Update the anchors/geometry of a custom lake. 
        Also prints the export for consistency.
        """
        email_norm = email.lower().strip()
        anchors_json = json.dumps(anchors)

        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    """
                    UPDATE user_custom_lakes 
                    SET anchors = %s
                    WHERE id = %s AND email = %s
                    RETURNING id
                    """,
                    (anchors_json, lake_id, email_norm),
                ).fetchone()
                conn.commit()
                found = result is not None
        else:
            with self._sqlite_conn() as conn:
                cursor = conn.execute(
                    """
                    UPDATE user_custom_lakes 
                    SET anchors = ?
                    WHERE id = ? AND email = ?
                    """,
                    (anchors_json, lake_id, email_norm),
                )
                conn.commit()
                found = cursor.rowcount > 0
        
        if found:
            print(f"\n[ADMIN] Updated Geometry for {lake_id}. New anchors count: {len(anchors)}")
        
        return found

    def _print_admin_json_export(self, lake_id, name, city, state, lat, lng, anchors):
        """Helper to read lakes.json and print the new full content."""
        try:
            print("\n\n================= [ADMIN EXPORT: PREPARING LAKES.JSON] =================\n")
            
            new_entry = {
                "id": lake_id,
                "name": name,
                "city": city or "",
                "state": state or "",
                "latitude": lat,
                "longitude": lng,
                "acres": 0,
                "tier": 3,
                "anchors": anchors or []
            }

            # Locate lakes.json relative to this file
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            json_path = os.path.join(base_dir, "data", "lakes.json")

            if os.path.exists(json_path):
                with open(json_path, 'r') as f:
                    full_data = json.load(f)
                
                # Append new entry
                full_data.append(new_entry)
                
                print(f"--- SUCCESS: Reading from {json_path} ---")
                print("--- COPY THE CONTENT BELOW AND REPLACE lakes.json ---")
                print(json.dumps(full_data, indent=2))
            else:
                print(f"--- WARNING: Could not find {json_path}. Printing single entry only. ---")
                print(json.dumps(new_entry, indent=2))

            print("\n================= [ADMIN EXPORT END] =================\n\n")

        except Exception as e:
            print(f"[Admin Export Error] {e}")

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
        
        IMPORTANT: Only matches lakes WITHOUT boundaries (no anchors).
        Lakes with custom boundaries have their own identity and should not
        be matched by proximity alone.
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

        # Filter by actual distance AND skip lakes with boundaries
        for row in rows:
            lake = self._row_to_custom_lake(dict(row))
            
            # Skip lakes with custom boundaries - they have their own identity
            if lake.anchors and len(lake.anchors) >= 3:
                continue
            
            dist = self._haversine(lat, lng, lake.lat, lake.lng)
            if dist <= radius_km:
                return lake

        return None

    def _haversine(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance in km between two coordinates."""
        
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