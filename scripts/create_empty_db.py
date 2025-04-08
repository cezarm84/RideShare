#!/usr/bin/env python
"""
Script to create an empty SQLite database.
"""
import os
import sqlite3
from pathlib import Path

def create_empty_database():
    """Create an empty SQLite database file."""
    try:
        # Get the path to the parent directory
        parent_dir = Path(__file__).parent.parent
        db_path = os.path.join(parent_dir, 'rideshare.db')
        
        # Create a connection (this will create the file if it doesn't exist)
        conn = sqlite3.connect(db_path)
        
        # Create alembic_version table to track migrations
        conn.execute('''
        CREATE TABLE IF NOT EXISTS alembic_version (
            version_num VARCHAR(32) NOT NULL,
            PRIMARY KEY (version_num)
        )
        ''')
        
        # Commit and close
        conn.commit()
        conn.close()
        
        print(f"Empty database created at: {db_path}")
        return True
    except Exception as e:
        print(f"Error creating database: {e}")
        return False

if __name__ == "__main__":
    create_empty_database()