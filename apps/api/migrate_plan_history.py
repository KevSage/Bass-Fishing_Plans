#!/usr/bin/env python3
"""
Migration script: File-based plan history → SQLite database

This script migrates plan history from JSON files to SQLite database.

Usage:
    python migrate_plan_history.py

What it does:
1. Reads all JSON files from data/plan_history/
2. Inserts them into data/plan_history.sqlite3
3. Enforces 10-plan limit per user
4. Removes expired plans (older than 30 days)
5. Backs up old files to data/plan_history_backup/
"""

import os
import sys
import shutil
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.plan_history import PlanHistoryStore


def main():
    print("="*60)
    print("Plan History Migration: Files → SQLite")
    print("="*60)
    print()
    
    # Paths
    old_storage_dir = "data/plan_history"
    backup_dir = "data/plan_history_backup"
    
    # Check if old storage exists
    if not os.path.exists(old_storage_dir):
        print(f"✓ No old file storage found at {old_storage_dir}")
        print("  Nothing to migrate. You're all set!")
        return
    
    # Count files to migrate
    json_files = [f for f in os.listdir(old_storage_dir) if f.endswith('.json')]
    
    if len(json_files) == 0:
        print(f"✓ No JSON files found in {old_storage_dir}")
        print("  Nothing to migrate. You're all set!")
        return
    
    print(f"Found {len(json_files)} plan files to migrate")
    print()
    
    # Confirm migration
    response = input("Proceed with migration? [y/N]: ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        return
    
    print()
    print("Starting migration...")
    print()
    
    # Initialize store (creates database if doesn't exist)
    store = PlanHistoryStore()
    
    # Run migration
    migrated_count = store.migrate_from_file_storage(old_storage_dir)
    
    print(f"✓ Successfully migrated {migrated_count} plans to SQLite")
    print()
    
    # Backup old files
    print("Backing up old JSON files...")
    if os.path.exists(backup_dir):
        shutil.rmtree(backup_dir)
    shutil.copytree(old_storage_dir, backup_dir)
    print(f"✓ Backed up to {backup_dir}")
    print()
    
    # Optional: Remove old directory
    response = input("Delete old JSON files? (backup will remain) [y/N]: ")
    if response.lower() == 'y':
        shutil.rmtree(old_storage_dir)
        print(f"✓ Removed {old_storage_dir}")
    else:
        print(f"  Kept {old_storage_dir} (you can delete manually later)")
    
    print()
    print("="*60)
    print("Migration Complete!")
    print("="*60)
    print()
    print("Summary:")
    print(f"  • Migrated: {migrated_count} plans")
    print(f"  • Database: data/plan_history.sqlite3")
    print(f"  • Backup: {backup_dir}/")
    print()
    print("Next steps:")
    print("  1. Test the application")
    print("  2. Verify plan history shows correctly")
    print("  3. If everything works, delete the backup:")
    print(f"     rm -rf {backup_dir}")
    print()


if __name__ == "__main__":
    main()
