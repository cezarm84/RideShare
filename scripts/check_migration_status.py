#!/usr/bin/env python
"""
Script to check migration status and database schema.
Helpful for diagnosing migration issues.
"""
import os
import sys
from pathlib import Path
import sqlite3
from sqlalchemy import create_engine, inspect
from sqlalchemy.schema import MetaData

# Add the parent directory to the path so we can import app modules
parent_dir = Path(__file__).parent.parent
sys.path.append(str(parent_dir))

from alembic import command
from alembic.config import Config
from app.core.config import settings

def check_migration_status():
    """Check and display Alembic migration status."""
    # Get the absolute path to the alembic.ini file
    alembic_cfg_path = os.path.join(parent_dir, 'alembic.ini')
    
    if not os.path.exists(alembic_cfg_path):
        print(f"Error: Could not find alembic.ini at {alembic_cfg_path}")
        return False
    
    try:
        # Create Alembic config
        alembic_cfg = Config(alembic_cfg_path)
        
        # Display migration history
        print("\n=== Migration History ===")
        command.history(alembic_cfg)
        
        # Display current head(s)
        print("\n=== Current Migration Head(s) ===")
        command.heads(alembic_cfg)
        
        # Display current database revision
        print("\n=== Current Database Revision ===")
        command.current(alembic_cfg)
        
        return True
    except Exception as e:
        print(f"Error checking migration status: {e}")
        return False

def check_database_schema():
    """Check and display database schema for the rides table."""
    try:
        # Connect to the database
        db_path = os.path.join(parent_dir, 'rideshare.db')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get table info
        print("\n=== Rides Table Schema ===")
        cursor.execute("PRAGMA table_info(rides)")
        columns = cursor.fetchall()
        
        if not columns:
            print("The 'rides' table doesn't exist in the database.")
            return False
        
        # Display column information
        print("\nColumn Name | Type | Nullable | Default | Primary Key")
        print("-" * 60)
        for column in columns:
            cid, name, type_, notnull, default_value, pk = column
            print(f"{name} | {type_} | {not bool(notnull)} | {default_value} | {bool(pk)}")
        
        # Check specifically for vehicle_type_id
        vehicle_type_column = next((col for col in columns if col[1] == 'vehicle_type_id'), None)
        if vehicle_type_column:
            print("\nThe 'vehicle_type_id' column EXISTS in the 'rides' table.")
        else:
            print("\nThe 'vehicle_type_id' column DOES NOT EXIST in the 'rides' table.")
        
        conn.close()
        return True
    except Exception as e:
        print(f"Error checking database schema: {e}")
        return False

if __name__ == "__main__":
    print("=== Migration Status Check ===")
    check_migration_status()
    check_database_schema()