#!/usr/bin/env python
"""
Script to ensure that the vehicle_types table exists and has standard vehicle types.
Run this after running database migrations.
"""
import sys
from pathlib import Path

# Add the parent directory to the path to allow importing app modules
sys.path.append(str(Path(__file__).parent.parent))

import logging


from app.db.session import SessionLocal
from app.models.vehicle import VehicleType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_standard_vehicle_types():
    """Create standard vehicle types if they don't exist"""
    try:
        db = SessionLocal()
        try:
            # Check if we already have vehicle types
            existing_types = db.query(VehicleType).all()
            if existing_types:
                logger.info(
                    f"Found {len(existing_types)} existing vehicle types. No need to create defaults."
                )
                for vtype in existing_types:
                    logger.info(
                        f"  - {vtype.name}: capacity {vtype.capacity}, price factor {vtype.price_factor}"
                    )
                return

            # Standard vehicle types
            standard_types = [
                {
                    "name": "Standard",
                    "description": "Standard passenger car with 4 seats",
                    "capacity": 4,
                    "is_active": True,
                    "price_factor": 1.0,
                },
                {
                    "name": "Compact",
                    "description": "Small car with 3 seats",
                    "capacity": 3,
                    "is_active": True,
                    "price_factor": 0.8,
                },
                {
                    "name": "SUV",
                    "description": "Sport Utility Vehicle with higher capacity",
                    "capacity": 6,
                    "is_active": True,
                    "price_factor": 1.2,
                },
                {
                    "name": "Minivan",
                    "description": "Larger vehicle for groups",
                    "capacity": 7,
                    "is_active": True,
                    "price_factor": 1.4,
                },
                {
                    "name": "Luxury",
                    "description": "Premium vehicle with extra comfort",
                    "capacity": 4,
                    "is_active": True,
                    "price_factor": 1.5,
                },
            ]

            # Create each vehicle type
            for type_data in standard_types:
                vehicle_type = VehicleType(**type_data)
                db.add(vehicle_type)
                logger.info(f"Added vehicle type: {type_data['name']}")

            db.commit()
            logger.info("Successfully created standard vehicle types")

        except Exception as e:
            logger.error(f"Error creating vehicle types: {str(e)}")
            db.rollback()
            raise
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise


if __name__ == "__main__":
    logger.info("Creating standard vehicle types...")
    create_standard_vehicle_types()
    logger.info("Done.")
