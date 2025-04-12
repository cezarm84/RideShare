#!/usr/bin/env python
"""
Script to apply the vehicle_type_id migration to the rides table.
This can be run directly to ensure the migration is applied.
"""
import os
import sys
from pathlib import Path

# Add the parent directory to the path so we can import app modules
parent_dir = Path(__file__).parent.parent
sys.path.append(str(parent_dir))

from alembic.config import Config

from alembic import command


def apply_migration():
    """Apply the vehicle_type migration."""
    # Get the absolute path to the alembic.ini file
    alembic_cfg_path = os.path.join(parent_dir, "alembic.ini")

    if not os.path.exists(alembic_cfg_path):
        print(f"Error: Could not find alembic.ini at {alembic_cfg_path}")
        return False

    try:
        # Create Alembic config
        alembic_cfg = Config(alembic_cfg_path)

        # Run the migration
        command.upgrade(alembic_cfg, "head")

        print("Migration successfully applied!")
        print("The 'vehicle_type_id' column has been added to the 'rides' table.")
        return True
    except Exception as e:
        print(f"Error applying migration: {e}")
        return False


if __name__ == "__main__":
    apply_migration()
