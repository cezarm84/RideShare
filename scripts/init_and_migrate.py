#!/usr/bin/env python
"""
Script to initialize a new database and apply all migrations.
"""
import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import app modules
parent_dir = Path(__file__).parent.parent
sys.path.append(str(parent_dir))

from alembic import command
from alembic.config import Config

def initialize_and_migrate():
    """Initialize a new database and apply all migrations."""
    try:
        # Check for database file, create if needed
        db_path = os.path.join(parent_dir, 'rideshare.db')
        if not os.path.exists(db_path):
            print(f"Creating new database file at: {db_path}")
            # Run create_empty_db.py
            exec(open('scripts/create_empty_db.py').read())
        
        # Get the absolute path to the alembic.ini file
        alembic_cfg_path = os.path.join(parent_dir, 'alembic.ini')
        
        if not os.path.exists(alembic_cfg_path):
            print(f"Error: Could not find alembic.ini at {alembic_cfg_path}")
            return False
        
        # Create Alembic config
        alembic_cfg = Config(alembic_cfg_path)
        
        # First, stamp the database with base (empty state)
        print("Stamping database with base revision...")
        command.stamp(alembic_cfg, "base")
        
        # Apply all migrations
        print("Applying all migrations...")
        command.upgrade(alembic_cfg, "head")
        
        # Check current revision
        print("Current database revision:")
        command.current(alembic_cfg)
        
        print("\nDatabase initialized and migrations applied successfully!")
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

if __name__ == "__main__":
    print("=== Initializing Database and Running Migrations ===")
    initialize_and_migrate()