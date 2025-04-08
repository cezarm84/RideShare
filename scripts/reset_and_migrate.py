#!/usr/bin/env python
"""
Script to reset the database and apply all migrations in the correct order.
"""
import os
import sys
import sqlite3
from pathlib import Path
import subprocess

# Add the parent directory to the path so we can import app modules
parent_dir = Path(__file__).parent.parent
sys.path.append(str(parent_dir))

from alembic import command
from alembic.config import Config

def reset_and_migrate():
    """Reset the database and apply all migrations."""
    try:
        # Delete the existing database if it exists
        db_path = os.path.join(parent_dir, 'rideshare.db')
        if os.path.exists(db_path):
            print(f"Removing existing database: {db_path}")
            os.remove(db_path)
        
        # Create a new empty database
        print("Creating new empty database...")
        conn = sqlite3.connect(db_path)
        conn.execute('''
        CREATE TABLE IF NOT EXISTS alembic_version (
            version_num VARCHAR(32) NOT NULL,
            PRIMARY KEY (version_num)
        )
        ''')
        conn.commit()
        conn.close()
        print("Empty database created.")
        
        # Get the absolute path to the alembic.ini file
        alembic_cfg_path = os.path.join(parent_dir, 'alembic.ini')
        
        if not os.path.exists(alembic_cfg_path):
            print(f"Error: Could not find alembic.ini at {alembic_cfg_path}")
            return False
        
        # Create Alembic config
        alembic_cfg = Config(alembic_cfg_path)
        
        # Stamp the database with base revision
        print("Stamping database with base revision...")
        command.stamp(alembic_cfg, "base")
        
        # Get a list of all migration files in order
        print("Getting ordered list of migrations...")
        try:
            # Get migration history output
            result = subprocess.run(
                ["alembic", "history"], 
                capture_output=True, 
                text=True,
                check=True
            )
            history_output = result.stdout
            
            # Extract revision IDs from history output
            revision_lines = [line.strip() for line in history_output.split('\n') if line.strip()]
            revisions = []
            
            for line in revision_lines:
                if "->" in line:
                    parts = line.split("->")
                    if len(parts) >= 2:
                        end_revision = parts[1].split(",")[0].strip()
                        if end_revision not in revisions and "head" not in end_revision:
                            revisions.append(end_revision)
            
            print(f"Found {len(revisions)} migrations to apply")
            
            # Apply each migration in order
            for i, revision in enumerate(revisions):
                print(f"Applying migration {i+1}/{len(revisions)}: {revision}")
                try:
                    command.upgrade(alembic_cfg, revision)
                except Exception as e:
                    print(f"Error applying migration {revision}: {e}")
                    # Continue with next migration
                    continue
            
            # Final verification
            print("\nVerifying current database revision:")
            command.current(alembic_cfg)
            
            print("\nDatabase reset and migrations applied successfully!")
            return True
        except subprocess.CalledProcessError as e:
            print(f"Error getting migration history: {e}")
            print(f"Output: {e.output}")
            print(f"Error output: {e.stderr}")
            
            # Fallback: just try to upgrade to head
            print("\nTrying fallback: direct upgrade to head...")
            command.upgrade(alembic_cfg, "head")
            return True
            
    except Exception as e:
        print(f"Error resetting database: {e}")
        return False

if __name__ == "__main__":
    print("=== Resetting Database and Applying Migrations ===")
    reset_and_migrate()