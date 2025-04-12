#!/usr/bin/env python3
"""
Script to create predefined vehicle types in the database.
Run this script once after initial database setup.
"""
import logging
import os
import sys
from datetime import datetime

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.db.session import get_db
from app.models.vehicle import VehicleType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_vehicle_types():
    """
    Create predefined vehicle types in the database.
    """
    # Define the vehicle types with their capacity ranges
    vehicle_types = [
        {
            "name": "car",
            "description": "Standard passenger car for 1-4 passengers",
            "min_capacity": 1,
            "max_capacity": 4,
        },
        {
            "name": "mini_van",
            "description": "Mini van or SUV for 5-8 passengers",
            "min_capacity": 5,
            "max_capacity": 8,
        },
        {
            "name": "bus",
            "description": "Minibus or bus for 9 or more passengers",
            "min_capacity": 9,
            "max_capacity": 50,
        },
    ]

    # Get a database session
    db = next(get_db())

    try:
        # Check if vehicle types table exists
        try:
            existing_count = db.query(VehicleType).count()
            logger.info(f"Found {existing_count} existing vehicle types.")
        except SQLAlchemyError as e:
            logger.error(f"Error accessing vehicle_types table: {e}")
            logger.info(
                "Make sure the table exists - you may need to run migrations first."
            )
            return

        # Process each vehicle type
        created_count = 0
        for vt in vehicle_types:
            # Check if this type already exists
            existing = (
                db.query(VehicleType).filter(VehicleType.name == vt["name"]).first()
            )

            if existing:
                logger.info(
                    f"Vehicle type '{vt['name']}' already exists with ID {existing.id}"
                )
                # Optionally update existing type
                existing.description = vt["description"]
                existing.min_capacity = vt["min_capacity"]
                existing.max_capacity = vt["max_capacity"]
                db.add(existing)
                logger.info(f"Updated vehicle type: {vt['name']}")
            else:
                # Create new vehicle type
                vehicle_type = VehicleType(
                    name=vt["name"],
                    description=vt["description"],
                    min_capacity=vt["min_capacity"],
                    max_capacity=vt["max_capacity"],
                    is_active=True,
                    created_at=datetime.utcnow(),
                )
                db.add(vehicle_type)
                created_count += 1
                logger.info(
                    f"Added new vehicle type: {vt['name']} (capacity: {vt['min_capacity']}-{vt['max_capacity']})"
                )

        # Commit changes to the database
        db.commit()
        logger.info(f"Successfully created {created_count} new vehicle types")

    except IntegrityError as e:
        db.rollback()
        logger.error(f"IntegrityError: {e}")
        logger.info("This might happen if you're trying to add duplicate records.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating vehicle types: {e}")


if __name__ == "__main__":
    logger.info("Starting vehicle type seed script")
    create_vehicle_types()
    logger.info("Finished vehicle type seed script")
