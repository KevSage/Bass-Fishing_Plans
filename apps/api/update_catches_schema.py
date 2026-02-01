#!/usr/bin/env python3
"""
Schema Migration Script: Add Weather Columns to Catches Table

Usage:
    python update_catches_schema.py [path_to_local_db]

    - On Render: It detects DATABASE_URL automatically.
    - Locally: It defaults to 'data/catches.db' (or whatever your local DB is named).
"""

import os
import sys
import sqlite3

# Try importing psycopg2 for Postgres (Render), fail gracefully if local only
try:
    import psycopg2
except ImportError:
    psycopg2 = None

# =============================================================================
# CONFIGURATION
# =============================================================================

# 1. Local SQLite Path (Default)
# Check your 'apps/api/app/services/catches.py' or .env to confirm this name.
DEFAULT_LOCAL_DB = "data/catches.db" 

# 2. Columns to Add (Name, Type)
NEW_COLUMNS = [
    ("temp", "FLOAT"),
    ("wind_speed", "FLOAT"),
    ("wind_direction", "VARCHAR(50)"),
    ("pressure", "FLOAT"),
    ("sky_condition", "VARCHAR(100)")
]

# =============================================================================
# MIGRATION LOGIC
# =============================================================================

def migrate_sqlite(db_path):
    """
    Updates local SQLite database.
    SQLite requires checking if columns exist before adding them to avoid errors.
    """
    print(f"📂 Target: SQLite ({db_path})")
    
    if not os.path.exists(db_path):
        print(f"❌ Error: Database file not found at {db_path}")
        print("   If your local DB has a different name, run: python update_catches_schema.py path/to/db.sqlite")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get existing columns
        cursor.execute("PRAGMA table_info(catches)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        
        print("   Connected. Checking columns...")
        
        changes_made = False
        for col_name, col_type in NEW_COLUMNS:
            if col_name not in existing_cols:
                print(f"   + Adding column: {col_name} ({col_type})")
                cursor.execute(f"ALTER TABLE catches ADD COLUMN {col_name} {col_type}")
                changes_made = True
            else:
                print(f"   - Column '{col_name}' already exists.")
                
        conn.commit()
        conn.close()
        
        if changes_made:
            print("✅ Local migration successful!")
        else:
            print("✅ Database is already up to date.")
            
    except Exception as e:
        print(f"❌ SQLite Error: {e}")


def migrate_postgres(db_url):
    """
    Updates Render PostgreSQL database.
    Uses 'IF NOT EXISTS' syntax for safety.
    """
    print("☁️ Target: PostgreSQL (Render)")
    
    if not psycopg2:
        print("❌ Error: 'psycopg2' module not installed.")
        print("   Run: pip install psycopg2-binary")
        return

    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        print("   Connected. Applying schema updates...")
        
        for col_name, col_type in NEW_COLUMNS:
            # PostgreSQL allows 'ADD COLUMN IF NOT EXISTS'
            try:
                query = f"ALTER TABLE catches ADD COLUMN IF NOT EXISTS {col_name} {col_type};"
                cursor.execute(query)
                print(f"   + Ensured column: {col_name}")
            except Exception as col_err:
                print(f"   ! Warning adding {col_name}: {col_err}")
                conn.rollback() # Reset transaction block if one fails
        
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Production migration successful!")
        
    except Exception as e:
        print(f"❌ Postgres Connection Error: {e}")


def main():
    print("="*60)
    print("Catch Log Schema Migration Tool")
    print("="*60)
    
    # 1. Detect Environment
    db_url = os.environ.get("DATABASE_URL")
    
    if db_url:
        # We are on Render (or have env var set)
        migrate_postgres(db_url)
    else:
        # We are Local
        # Allow user to pass DB path as argument, otherwise use default
        db_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_LOCAL_DB
        migrate_sqlite(db_path)
        
    print("="*60)

if __name__ == "__main__":
    main()