#!/usr/bin/env python3
"""
Schema Migration Script: Add Apple Sign-In Columns to Subscribers Table

This migration adds the following columns to the subscribers table:
- apple_user_id: Unique Apple user identifier from Sign in with Apple
- first_name: User's first name (provided by Apple on first sign-in)
- last_name: User's last name (provided by Apple on first sign-in)

Usage:
    python migrate_apple_signin.py [path_to_local_db]

    - On Render: Detects DATABASE_URL automatically.
    - Locally: Defaults to 'data/subscribers.db' (or pass path as argument).

Run this BEFORE deploying the Apple Sign-In feature.
"""

import os
import sys
import sqlite3

# Try importing psycopg for Postgres (Render), fail gracefully if local only
try:
    import psycopg
    from psycopg.rows import dict_row
except ImportError:
    psycopg = None

# =============================================================================
# CONFIGURATION
# =============================================================================

# Local SQLite Path (check apps/api/app/services/subscribers.py for actual path)
DEFAULT_LOCAL_DB = "data/subscribers.db"

# Columns to Add (Name, Type for Postgres, Type for SQLite)
NEW_COLUMNS = [
    ("apple_user_id", "TEXT UNIQUE", "TEXT UNIQUE"),
    ("first_name", "TEXT", "TEXT"),
    ("last_name", "TEXT", "TEXT"),
]

# =============================================================================
# MIGRATION LOGIC
# =============================================================================

def migrate_sqlite(db_path: str) -> bool:
    """
    Updates local SQLite database.
    Returns True if successful, False otherwise.
    """
    print(f"📂 Target: SQLite ({db_path})")

    if not os.path.exists(db_path):
        print(f"❌ Error: Database file not found at {db_path}")
        print("   If your local DB has a different name, run:")
        print("   python migrate_apple_signin.py path/to/subscribers.db")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Get existing columns
        cursor.execute("PRAGMA table_info(subscribers)")
        existing_cols = {row[1] for row in cursor.fetchall()}

        print("   Connected. Checking columns...")

        changes_made = False
        for col_name, _, sqlite_type in NEW_COLUMNS:
            if col_name not in existing_cols:
                print(f"   + Adding column: {col_name} ({sqlite_type})")
                # Note: SQLite doesn't support UNIQUE constraint in ALTER TABLE
                # We add it without UNIQUE for SQLite
                safe_type = sqlite_type.replace(" UNIQUE", "")
                cursor.execute(f"ALTER TABLE subscribers ADD COLUMN {col_name} {safe_type}")
                changes_made = True
            else:
                print(f"   ✓ Column '{col_name}' already exists.")

        conn.commit()
        conn.close()

        if changes_made:
            print("✅ Local migration successful!")
        else:
            print("✅ Database is already up to date.")
        return True

    except Exception as e:
        print(f"❌ SQLite Error: {e}")
        return False


def migrate_postgres(db_url: str) -> bool:
    """
    Updates Render PostgreSQL database.
    Returns True if successful, False otherwise.
    """
    print("☁️ Target: PostgreSQL (Render)")

    if not psycopg:
        print("❌ Error: 'psycopg' module not installed.")
        print("   Run: pip install psycopg[binary]")
        return False

    try:
        conn = psycopg.connect(db_url, row_factory=dict_row)
        cursor = conn.cursor()
        print("   Connected. Applying schema updates...")

        for col_name, pg_type, _ in NEW_COLUMNS:
            try:
                # PostgreSQL supports 'ADD COLUMN IF NOT EXISTS'
                # But we need to handle UNIQUE constraint separately
                base_type = pg_type.replace(" UNIQUE", "")
                is_unique = "UNIQUE" in pg_type

                # Add column if not exists
                query = f"ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS {col_name} {base_type};"
                cursor.execute(query)
                print(f"   + Ensured column: {col_name}")

                # Add unique constraint if needed (may already exist)
                if is_unique:
                    try:
                        constraint_name = f"subscribers_{col_name}_unique"
                        cursor.execute(f"""
                            DO $$
                            BEGIN
                                IF NOT EXISTS (
                                    SELECT 1 FROM pg_constraint WHERE conname = '{constraint_name}'
                                ) THEN
                                    ALTER TABLE subscribers ADD CONSTRAINT {constraint_name} UNIQUE ({col_name});
                                END IF;
                            END $$;
                        """)
                        print(f"   + Ensured UNIQUE constraint on: {col_name}")
                    except Exception as constraint_err:
                        print(f"   ! Warning adding constraint for {col_name}: {constraint_err}")

            except Exception as col_err:
                print(f"   ! Warning adding {col_name}: {col_err}")
                conn.rollback()

        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Production migration successful!")
        return True

    except Exception as e:
        print(f"❌ Postgres Connection Error: {e}")
        return False


def main():
    print("=" * 60)
    print("Apple Sign-In Schema Migration")
    print("Adds: apple_user_id, first_name, last_name to subscribers")
    print("=" * 60)

    # Detect Environment
    db_url = os.environ.get("DATABASE_URL")

    success = False
    if db_url and db_url.startswith("postgres"):
        # We are on Render (or have env var set)
        success = migrate_postgres(db_url)
    else:
        # We are Local
        db_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_LOCAL_DB
        success = migrate_sqlite(db_path)

    print("=" * 60)

    # Exit with appropriate code for CI/CD
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
