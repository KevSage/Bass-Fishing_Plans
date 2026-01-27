# apps/api/app/services/catches.py
"""
Catch storage for user fish catches.
"""
from __future__ import annotations

import os
import uuid
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List

import psycopg
from psycopg.rows import dict_row


@dataclass(frozen=True)
class Catch:
    id: str
    email: str
    date: str
    time: Optional[str]
    species: str
    weight: Optional[float]
    length: Optional[float]
    lure: Optional[str]
    color: Optional[str]
    notes: Optional[str]
    photo_url: Optional[str]
    lat: float
    lng: float
    lake_id: Optional[str]
    lake_type: str  # 'known', 'custom', 'unresolved'
    lake_name: Optional[str]
    city: Optional[str]
    state: Optional[str]
    source: str  # 'camera', 'library', 'manual'
    created_at: str


class CatchStore:
    """
    Catch storage.
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
        print(f"[CatchStore] use_pg={self._use_pg}")

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
                CREATE TABLE IF NOT EXISTS catches (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    date DATE NOT NULL,
                    time TIME,
                    species TEXT NOT NULL,
                    weight DECIMAL(5,2),
                    length DECIMAL(5,2),
                    lure TEXT,
                    color TEXT,
                    notes TEXT,
                    photo_url TEXT,
                    lat DECIMAL(9,6) NOT NULL,
                    lng DECIMAL(9,6) NOT NULL,
                    lake_id TEXT,
                    lake_type TEXT NOT NULL DEFAULT 'unresolved',
                    lake_name TEXT,
                    city TEXT,
                    state TEXT,
                    source TEXT NOT NULL DEFAULT 'manual',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_catches_email ON catches(email);"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_catches_coords ON catches(lat, lng);"
            )
            conn.commit()

    def _row_to_catch(self, row: dict) -> Catch:
        return Catch(
            id=row["id"],
            email=row["email"],
            date=str(row["date"]),
            time=str(row["time"]) if row["time"] else None,
            species=row["species"],
            weight=float(row["weight"]) if row["weight"] else None,
            length=float(row["length"]) if row["length"] else None,
            lure=row["lure"],
            color=row["color"],
            notes=row["notes"],
            photo_url=row["photo_url"],
            lat=float(row["lat"]),
            lng=float(row["lng"]),
            lake_id=row["lake_id"],
            lake_type=row["lake_type"],
            lake_name=row["lake_name"],
            city=row["city"],
            state=row["state"],
            source=row["source"],
            created_at=str(row["created_at"]),
        )

    # -------------------------
    # SQLite (local fallback)
    # -------------------------
    def _sqlite_path(self) -> str:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        data_dir = os.path.join(os.path.dirname(base_dir), "data")
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, "catches.sqlite3")

    def _sqlite_conn(self):
        conn = sqlite3.connect(self._sqlite_path())
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self) -> None:
        with self._sqlite_conn() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS catches (
                    id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time TEXT,
                    species TEXT NOT NULL,
                    weight REAL,
                    length REAL,
                    lure TEXT,
                    color TEXT,
                    notes TEXT,
                    photo_url TEXT,
                    lat REAL NOT NULL,
                    lng REAL NOT NULL,
                    lake_id TEXT,
                    lake_type TEXT NOT NULL DEFAULT 'unresolved',
                    lake_name TEXT,
                    city TEXT,
                    state TEXT,
                    source TEXT NOT NULL DEFAULT 'manual',
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
        date: str,
        species: str,
        lat: float,
        lng: float,
        *,
        time: Optional[str] = None,
        weight: Optional[float] = None,
        length: Optional[float] = None,
        lure: Optional[str] = None,
        color: Optional[str] = None,
        notes: Optional[str] = None,
        photo_url: Optional[str] = None,
        lake_id: Optional[str] = None,
        lake_type: str = "unresolved",
        lake_name: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        source: str = "manual",
    ) -> str:
        """Create a new catch record. Returns the catch ID."""
        catch_id = f"catch_{uuid.uuid4().hex[:12]}"
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO catches (
                        id, email, date, time, species, weight, length,
                        lure, color, notes, photo_url, lat, lng,
                        lake_id, lake_type, lake_name, city, state, source
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s
                    )
                    """,
                    (
                        catch_id, email_norm, date, time, species, weight, length,
                        lure, color, notes, photo_url, lat, lng,
                        lake_id, lake_type, lake_name, city, state, source,
                    ),
                )
                conn.commit()
        else:
            with self._sqlite_conn() as conn:
                conn.execute(
                    """
                    INSERT INTO catches (
                        id, email, date, time, species, weight, length,
                        lure, color, notes, photo_url, lat, lng,
                        lake_id, lake_type, lake_name, city, state, source
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        catch_id, email_norm, date, time, species, weight, length,
                        lure, color, notes, photo_url, lat, lng,
                        lake_id, lake_type, lake_name, city, state, source,
                    ),
                )
                conn.commit()

        return catch_id

    def get(self, catch_id: str, email: str) -> Optional[Catch]:
        """Get a single catch by ID (must belong to user)."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                row = conn.execute(
                    "SELECT * FROM catches WHERE id = %s AND email = %s",
                    (catch_id, email_norm),
                ).fetchone()
        else:
            with self._sqlite_conn() as conn:
                row = conn.execute(
                    "SELECT * FROM catches WHERE id = ? AND email = ?",
                    (catch_id, email_norm),
                ).fetchone()

        if not row:
            return None
        return self._row_to_catch(dict(row))

    def list_by_user(
        self,
        email: str,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Catch]:
        """List all catches for a user, newest first."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM catches 
                    WHERE email = %s 
                    ORDER BY date DESC, created_at DESC
                    LIMIT %s OFFSET %s
                    """,
                    (email_norm, limit, offset),
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM catches 
                    WHERE email = ? 
                    ORDER BY date DESC, created_at DESC
                    LIMIT ? OFFSET ?
                    """,
                    (email_norm, limit, offset),
                ).fetchall()

        return [self._row_to_catch(dict(row)) for row in rows]

    def count_by_user(self, email: str) -> int:
        """Count total catches for a user."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    "SELECT COUNT(*) as count FROM catches WHERE email = %s",
                    (email_norm,),
                ).fetchone()
        else:
            with self._sqlite_conn() as conn:
                result = conn.execute(
                    "SELECT COUNT(*) as count FROM catches WHERE email = ?",
                    (email_norm,),
                ).fetchone()

        return result["count"] if result else 0

    def delete(self, catch_id: str, email: str) -> bool:
        """Delete a catch. Returns True if deleted."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                result = conn.execute(
                    "DELETE FROM catches WHERE id = %s AND email = %s RETURNING id",
                    (catch_id, email_norm),
                ).fetchone()
                conn.commit()
                return result is not None
        else:
            with self._sqlite_conn() as conn:
                cursor = conn.execute(
                    "DELETE FROM catches WHERE id = ? AND email = ?",
                    (catch_id, email_norm),
                )
                conn.commit()
                return cursor.rowcount > 0

    def update(
        self,
        catch_id: str,
        email: str,
        **kwargs
    ) -> Optional[Catch]:
        """Update an existing catch."""
        email_norm = email.lower().strip()
        
        # Filter out None values to only update what's passed (optional)
        # or assuming full replacement if PUT. 
        # For simplicity, we update fields that match our columns.
        allowed_fields = {
            "date", "time", "species", "weight", "length", "lure", "color",
            "notes", "photo_url", "lat", "lng", "lake_id", "lake_type", 
            "lake_name", "city", "state", "source"
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not updates:
            return self.get(catch_id, email)

        # Build SQL dynamically
        set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
        values = list(updates.values())
        values.append(catch_id)
        values.append(email_norm)

        if self._use_pg:
            with self._pg_conn() as conn:
                # RETURNING * to get the updated record back
                row = conn.execute(
                    f"""
                    UPDATE catches 
                    SET {set_clause}
                    WHERE id = %s AND email = %s
                    RETURNING *
                    """,
                    values
                ).fetchone()
                conn.commit()
                if row:
                    return self._row_to_catch(dict(row))
        else:
            # SQLite version
            set_clause_lite = ", ".join([f"{k} = ?" for k in updates.keys()])
            with self._sqlite_conn() as conn:
                conn.execute(
                    f"""
                    UPDATE catches 
                    SET {set_clause_lite}
                    WHERE id = ? AND email = ?
                    """,
                    values
                )
                conn.commit()
                # SQLite update doesn't return data, fetch it again
                return self.get(catch_id, email)
        
        return None
   
    def list_by_lake(
        self,
        email: str,
        lake_id: str,
        lake_type: str,
    ) -> List[Catch]:
        """List all catches at a specific lake."""
        email_norm = email.lower().strip()

        if self._use_pg:
            with self._pg_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM catches 
                    WHERE email = %s AND lake_id = %s AND lake_type = %s
                    ORDER BY date DESC
                    """,
                    (email_norm, lake_id, lake_type),
                ).fetchall()
        else:
            with self._sqlite_conn() as conn:
                rows = conn.execute(
                    """
                    SELECT * FROM catches 
                    WHERE email = ? AND lake_id = ? AND lake_type = ?
                    ORDER BY date DESC
                    """,
                    (email_norm, lake_id, lake_type),
                ).fetchall()

        return [self._row_to_catch(dict(row)) for row in rows]