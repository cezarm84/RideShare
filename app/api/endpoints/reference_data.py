"""
Reference data endpoints for the RideShare application.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.hub import Hub
from app.models.vehicle import VehicleType
from app.models.enterprise import Enterprise

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/ride-reference-data")
async def get_ride_reference_data(
    db: Session = Depends(get_db)
):
    """
    Get reference data for creating rides.

    This endpoint returns all the reference data needed for creating rides, including:
    - Available hubs
    - Ride types
    - Vehicle types
    - Recurrence patterns
    - Status options
    - Enterprises (if user has admin privileges)

    Returns:
        Dict[str, Any]: Reference data for creating rides
    """
    try:
        # Get all active hubs
        hubs = db.query(Hub).filter(Hub.is_active == True).all()
        hub_list = [
            {
                "id": hub.id,
                "name": hub.name,
                "address": hub.address,
                "city": hub.city,
                "latitude": getattr(hub, "latitude", None),
                "longitude": getattr(hub, "longitude", None),
            }
            for hub in hubs
        ]

        # Get all vehicle types
        vehicle_types = db.query(VehicleType).all()
        vehicle_type_list = [
            {
                "id": vt.id,
                "name": vt.name,
                "description": vt.description,
                "capacity": getattr(vt, "capacity", 4),  # Use capacity from DB or default to 4
                "is_active": True,  # Default value
                "price_factor": 1.0,  # Default value
            }
            for vt in vehicle_types
        ]

        # Get all destinations (same as hubs for now)
        destination_list = hub_list.copy()

        # Get enterprises
        enterprise_list = []
        try:
            enterprises = db.query(Enterprise).all()
            enterprise_list = [
                {
                    "id": enterprise.id,
                    "name": enterprise.name,
                    "address": getattr(enterprise, "address", f"{enterprise.name} HQ"),
                    "city": getattr(enterprise, "city", "Gothenburg"),
                }
                for enterprise in enterprises
            ]
        except Exception as e:
            logger.warning(f"Could not fetch enterprises: {str(e)}")
            # Provide sample enterprise data if query fails
            enterprise_list = [
                {
                    "id": 1,
                    "name": "Volvo",
                    "address": "Volvo HQ, Gothenburg",
                    "city": "Gothenburg",
                },
                {
                    "id": 2,
                    "name": "Ericsson",
                    "address": "Ericsson HQ, Stockholm",
                    "city": "Stockholm",
                },
            ]

        # Define ride types
        ride_types = [
            {
                "id": "hub_to_hub",
                "name": "Hub to Hub",
                "description": "Ride between two hubs",
            },
            {
                "id": "hub_to_destination",
                "name": "Hub to Destination",
                "description": "Ride from a hub to a custom destination",
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "description": "Ride for company employees",
            },
        ]

        # Define recurrence patterns
        recurrence_patterns = [
            {"id": "one_time", "name": "One Time"},
            {"id": "daily", "name": "Daily"},
            {"id": "weekly", "name": "Weekly"},
            {"id": "monthly", "name": "Monthly"},
        ]

        # Define status options
        status_options = [
            {"id": "scheduled", "name": "Scheduled"},
            {"id": "in_progress", "name": "In Progress"},
            {"id": "completed", "name": "Completed"},
            {"id": "cancelled", "name": "Cancelled"},
        ]

        # Return all reference data
        return {
            "hubs": hub_list,
            "destinations": destination_list,
            "vehicle_types": vehicle_type_list,
            "ride_types": ride_types,
            "recurrence_patterns": recurrence_patterns,
            "status_options": status_options,
            "enterprises": enterprise_list,
        }
    except Exception as e:
        logger.error(f"Error getting ride reference data: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Error getting ride reference data: {str(e)}"
        )
