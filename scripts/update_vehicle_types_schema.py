#!/usr/bin/env python3
"""
Script to update the vehicle_types table schema if needed.
This adds min_capacity and max_capacity columns if they don't exist.
"""
import logging
import os
import sys

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.db.session import get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_column_exists(db, table, column):
    """Check if a column exists in a table"""
    try:
        db.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
        return True
    except OperationalError:
        return False


def update_vehicle_types_schema():
    """Add missing columns to vehicle_types table if needed"""
    # Get a database session
    db = next(get_db())

    try:
        # Check if vehicle_types table exists
        try:
            db.execute(text("SELECT COUNT(*) FROM vehicle_types"))
            logger.info("vehicle_types table exists")
        except OperationalError:
            logger.error("vehicle_types table doesn't exist - run migrations first")
            return

        # Check and add min_capacity column if needed
        if not check_column_exists(db, "vehicle_types", "min_capacity"):
            logger.info("Adding min_capacity column to vehicle_types table")
            db.execute(
                text(
                    "ALTER TABLE vehicle_types ADD COLUMN min_capacity INTEGER DEFAULT 1"
                )
            )

            # Update existing vehicle types with appropriate min capacities
            db.execute(
                text("UPDATE vehicle_types SET min_capacity = 1 WHERE name = 'car'")
            )
            db.execute(
                text(
                    "UPDATE vehicle_types SET min_capacity = 5 WHERE name = 'mini_van'"
                )
            )
            db.execute(
                text("UPDATE vehicle_types SET min_capacity = 9 WHERE name = 'bus'")
            )

            db.commit()
            logger.info("min_capacity column added successfully")
        else:
            logger.info("min_capacity column already exists")

        # Check and add max_capacity column if needed
        if not check_column_exists(db, "vehicle_types", "max_capacity"):
            logger.info("Adding max_capacity column to vehicle_types table")
            db.execute(
                text(
                    "ALTER TABLE vehicle_types ADD COLUMN max_capacity INTEGER DEFAULT 50"
                )
            )

            # Update existing vehicle types with appropriate max capacities
            db.execute(
                text("UPDATE vehicle_types SET max_capacity = 4 WHERE name = 'car'")
            )
            db.execute(
                text(
                    "UPDATE vehicle_types SET max_capacity = 8 WHERE name = 'mini_van'"
                )
            )
            db.execute(
                text("UPDATE vehicle_types SET max_capacity = 50 WHERE name = 'bus'")
            )

            db.commit()
            logger.info("max_capacity column added successfully")
        else:
            logger.info("max_capacity column already exists")

        # Ensure vehicle types exist
        vehicle_types = [
            {"name": "car", "min_capacity": 1, "max_capacity": 4},
            {"name": "mini_van", "min_capacity": 5, "max_capacity": 8},
            {"name": "bus", "min_capacity": 9, "max_capacity": 50},
        ]

        for vt in vehicle_types:
            existing = db.execute(
                text(f"SELECT id FROM vehicle_types WHERE name = '{vt['name']}'")
            ).fetchone()
            if not existing:
                # Insert the missing vehicle type
                db.execute(
                    text(
                        f"""
                    INSERT INTO vehicle_types (name, description, min_capacity, max_capacity, is_active, created_at)
                    VALUES ('{vt['name']}', '{vt['name'].capitalize()} for {vt['min_capacity']}-{vt['max_capacity']} passengers',
                    {vt['min_capacity']}, {vt['max_capacity']}, 1, datetime('now'))
                    """
                    )
                )
                db.commit()
                logger.info(f"Created missing vehicle type: {vt['name']}")

        logger.info("Vehicle types schema update completed successfully")

    except Exception as e:
        db.rollback()
        logger.error(f"Error updating vehicle_types schema: {e}")


if __name__ == "__main__":
    logger.info("Starting vehicle_types schema update")
    update_vehicle_types_schema()
    logger.info("Finished vehicle_types schema update")
