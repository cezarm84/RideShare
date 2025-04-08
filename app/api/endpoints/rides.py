from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any, Tuple
from app.db.session import get_db
from app.core.security import get_current_user
from app.api.dependencies import (get_current_admin_user, get_optional_user,
                                  get_admin_or_driver_user, get_current_driver_user)
from app.schemas.ride import RideCreate, RideResponse, RideDetailedResponse, RideBookingResponse
from app.schemas.hub import HubResponse
from app.services.ride_service import RideService
from app.models.user import User
from app.models.ride import Ride, RideBooking
from app.models.hub import Hub
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

def repair_ride_data(ride: Ride, db: Session) -> Ride:
    """
    Repairs incomplete ride data by adding missing but essential information.
    Returns the same ride object after fixes are applied.

    Args:
        ride: The ride to repair
        db: Database session

    Returns:
        The repaired ride object
    """
    modified = False

    # Fix missing destination hub
    if ride.destination_hub_id is None:
        logger.warning(f"Ride {ride.id} is missing destination_hub_id. Attempting to repair.")

        # Find a hub different from the starting hub
        available_hubs = db.query(Hub).filter(Hub.id != ride.starting_hub_id).first()

        if available_hubs:
            ride.destination_hub_id = available_hubs.id
            ride.destination_hub = available_hubs
            modified = True
            logger.info(f"Fixed ride {ride.id} by setting destination_hub_id to {available_hubs.id}")
        else:
            logger.warning(f"Could not repair ride {ride.id} - no alternative hubs available")

    # Fix negative or null available_seats
    if ride.available_seats is None or ride.available_seats < 0:
        logger.warning(f"Ride {ride.id} has invalid available_seats: {ride.available_seats}. Setting to 0.")
        ride.available_seats = 0
        modified = True

    # If ride was modified, commit changes to database
    if modified:
        try:
            db.add(ride)
            db.commit()
            db.refresh(ride)

            # Reload relationships if needed
            if ride.destination_hub_id and not ride.destination_hub:
                ride = db.query(Ride).options(
                    joinedload(Ride.starting_hub),
                    joinedload(Ride.destination_hub),
                    joinedload(Ride.bookings)
                ).filter(Ride.id == ride.id).first()

            logger.info(f"Successfully repaired ride {ride.id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to save repairs for ride {ride.id}: {str(e)}")

    return ride

def ride_to_schema(ride: Ride, include_passengers: bool = False) -> Dict[str, Any]:
    """
    Convert a Ride ORM model to a dictionary suitable for Pydantic schema.
    This function manually maps fields to handle any discrepancies.

    Args:
        ride: The Ride ORM object
        include_passengers: Whether to include passenger details
    """
    # Calculate total passengers
    total_passengers = sum(booking.seats_booked for booking in ride.bookings) if ride.bookings else 0

    # Calculate correct available_seats (should never be negative)
    actual_available_seats = max(0, (ride.available_seats or 0))

    # Prepare a dict with all the expected fields
    ride_dict = {
        "id": ride.id,
        "starting_hub_id": ride.starting_hub_id,
        "destination_hub_id": ride.destination_hub_id,
        "destination_id": ride.destination_hub_id,  # For backward compatibility
        "departure_time": ride.departure_time,
        "arrival_time": ride.arrival_time,
        "status": ride.status,
        "vehicle_type": "standard",  # Default value not in model
        "vehicle_type_id": ride.vehicle_type_id,
        "capacity": (actual_available_seats + total_passengers),
        "available_seats": actual_available_seats,
        "driver_id": ride.driver_id,
        "price_per_seat": ride.price_per_seat or 0.0,  # Default to 0.0 if None
        "total_passengers": total_passengers,
        "enterprise_id": getattr(ride, 'enterprise_id', None),
        "recurrence_pattern": "one_time",  # Default value
        "is_recurring": getattr(ride, 'is_recurring', False),
    }

    # Process starting hub data
    if ride.starting_hub:
        # Use parse_obj for Pydantic v1 compatibility
        starting_hub = HubResponse.parse_obj({
            "id": ride.starting_hub.id,
            "name": ride.starting_hub.name,
            "address": ride.starting_hub.address,
            "city": ride.starting_hub.city,
            "description": getattr(ride.starting_hub, 'description', None),
            "postal_code": getattr(ride.starting_hub, 'postal_code', None),
            "latitude": getattr(ride.starting_hub, 'latitude', None),
            "longitude": getattr(ride.starting_hub, 'longitude', None),
            "is_active": getattr(ride.starting_hub, 'is_active', True)
        })
        ride_dict["starting_hub"] = starting_hub
    else:
        ride_dict["starting_hub"] = None

    # Add ride_type to the dictionary
    # Handle both column and property implementations
    ride_type = None
    if hasattr(ride, 'ride_type'):
        if callable(getattr(ride.__class__, 'ride_type', None)):
            # It's a property
            ride_type = ride.ride_type
        else:
            # It's a column
            ride_type = ride.ride_type

    # Set the ride_type in the dictionary
    ride_dict["ride_type"] = ride_type

    # Process destination based on ride type
    if ride_type == "hub_to_hub":
        if ride.destination_hub:
            # Use parse_obj for Pydantic v1 compatibility
            destination_hub = HubResponse.parse_obj({
                "id": ride.destination_hub.id,
                "name": ride.destination_hub.name,
                "address": ride.destination_hub.address,
                "city": ride.destination_hub.city,
                "description": getattr(ride.destination_hub, 'description', None),
                "postal_code": getattr(ride.destination_hub, 'postal_code', None),
                "latitude": getattr(ride.destination_hub, 'latitude', None),
                "longitude": getattr(ride.destination_hub, 'longitude', None),
                "is_active": getattr(ride.destination_hub, 'is_active', True)
            })
            ride_dict["destination_hub"] = destination_hub
            ride_dict["destination"] = None  # No custom destination for hub_to_hub
        else:
            ride_dict["destination_hub"] = None
            ride_dict["destination"] = None
    elif ride_type == "hub_to_destination":
        # For hub_to_destination, use the destination JSON field
        ride_dict["destination_hub"] = None  # No destination hub for hub_to_destination

        # Use the custom destination data
        if ride.destination:
            ride_dict["destination"] = ride.destination
        else:
            # If destination is missing, create a placeholder
            ride_dict["destination"] = {
                "name": "Custom Destination",
                "city": "Unknown"
            }
            logger.warning(f"Ride {ride.id} is missing destination data for hub_to_destination type")
    else:
        # For other ride types (like enterprise)
        if ride.destination_hub:
            # If the ride has a destination hub, use it
            destination_hub = HubResponse.parse_obj({
                "id": ride.destination_hub.id,
                "name": ride.destination_hub.name,
                "address": ride.destination_hub.address,
                "city": ride.destination_hub.city,
                "description": getattr(ride.destination_hub, 'description', None),
                "postal_code": getattr(ride.destination_hub, 'postal_code', None),
                "latitude": getattr(ride.destination_hub, 'latitude', None),
                "longitude": getattr(ride.destination_hub, 'longitude', None),
                "is_active": getattr(ride.destination_hub, 'is_active', True)
            })
            ride_dict["destination_hub"] = destination_hub
            ride_dict["destination"] = None
        elif hasattr(ride, 'destination') and ride.destination:
            # If the ride has a custom destination, use it
            ride_dict["destination_hub"] = None
            ride_dict["destination"] = ride.destination
        else:
            # If neither is available, set both to None
            ride_dict["destination_hub"] = None
            ride_dict["destination"] = None

    # Only include bookings if requested
    if include_passengers and ride.bookings:
        ride_dict["bookings"] = [booking_to_schema(booking) for booking in ride.bookings]
    else:
        ride_dict["bookings"] = []

    return ride_dict

def booking_to_schema(booking: RideBooking) -> Dict[str, Any]:
    """
    Convert a RideBooking ORM model to a dictionary suitable for Pydantic schema.
    """
    return {
        "id": booking.id,
        "passenger_id": booking.passenger_id,
        "user_id": booking.passenger_id,  # For backward compatibility
        "seats_booked": booking.seats_booked,
        "passenger_count": booking.seats_booked,  # For backward compatibility
        "booking_status": booking.booking_status,
        "status": booking.booking_status,  # For backward compatibility
        "created_at": booking.created_at,
        "booking_time": booking.created_at,  # For backward compatibility
        "price": 0.0,  # Default value not in model
        "passenger": booking.user  # User relationship
    }

@router.get("", response_model=List[RideDetailedResponse])
async def get_rides(
    destination_id: Optional[int] = None,
    hub_id: Optional[int] = None,
    include_passengers: bool = False,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = Query(50, gt=0, le=100),
    future_only: bool = Query(True, description="Only include future rides"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Get rides with detailed information including hub and destination details.

    Parameters:
    - destination_id: Filter rides by destination
    - hub_id: Filter rides by starting hub
    - include_passengers: Include passenger information in response
    - status: Filter by ride status (scheduled, in_progress, completed, cancelled)
    - skip: Number of records to skip
    - limit: Maximum number of rides to return
    - future_only: Only include rides in the future
    """
    try:
        # Pass the current user_id if available, but this endpoint can be used anonymously
        user_id = current_user.id if current_user else None

        ride_service = RideService(db)
        rides = ride_service.get_detailed_rides(
            skip=skip,
            limit=limit,
            include_passengers=include_passengers,
            status=status,
            future_only=future_only,
            destination_id=destination_id,
            hub_id=hub_id,
            user_id=user_id  # Pass the user_id correctly
        )

        # Log the number of rides found
        logger.info(f"Found {len(rides)} rides matching the query")

        # Process ride objects to ensure hub data is properly structured
        ride_responses = []
        for ride in rides:
            # Convert ORM object to dictionary with proper hub handling
            ride_dict = ride_to_schema(ride, include_passengers)
            ride_response = RideDetailedResponse.parse_obj(ride_dict)
            ride_responses.append(ride_response)

        return ride_responses
    except Exception as e:
        logger.error(f"Error getting rides: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting rides: {str(e)}")

@router.get("/{ride_id}", response_model=RideDetailedResponse)
async def get_ride_by_id(
    ride_id: int,
    include_passengers: bool = False,
    repair: bool = False,  # New parameter to trigger data repair
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Get detailed information about a specific ride including hub and destination.
    Optionally include passenger information.

    Parameters:
    - include_passengers: Whether to include passenger details in the response
    - repair: Attempt to fix inconsistent data (like missing destination)
    """
    try:
        ride_service = RideService(db)
        ride = ride_service.get_ride_by_id(ride_id, include_passengers=True)  # Always get passengers from DB
        if not ride:
            raise HTTPException(status_code=404, detail=f"Ride with ID {ride_id} not found")

        # Repair data if requested
        if repair:
            logger.info(f"Repairing data for ride {ride_id}")
            ride = repair_ride_data(ride, db)

        # Fix missing destination IDs if needed
        if ride.destination_hub_id is None and ride.destination_hub is not None:
            ride.destination_hub_id = ride.destination_hub.id

        # Convert ORM object to dictionary with proper hub handling
        ride_dict = ride_to_schema(ride, include_passengers)
        ride_response = RideDetailedResponse.parse_obj(ride_dict)

        return ride_response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting ride {ride_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting ride: {str(e)}")

@router.post("", response_model=RideDetailedResponse, status_code=status.HTTP_201_CREATED)
async def create_ride(
    ride: RideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_driver_user)  # Only admins or drivers can create rides
):
    """
    Create a new ride (admin, manager, or driver only).

    ## Available Options

    ### Ride Types
    - `hub_to_hub`: Ride between two hubs
    - `hub_to_destination`: Ride from a hub to a custom destination
    - `enterprise`: Ride for company employees

    ### Hubs
    Use the `/api/v1/hubs` endpoint to get a list of available hubs.

    ### Vehicle Types
    Use the `/api/v1/vehicle-types` endpoint to get available vehicle types.

    ### Recurrence Patterns (for enterprise rides)
    - `one_time`: A single ride that does not repeat
    - `daily`: Repeats every day
    - `weekdays`: Repeats Monday through Friday
    - `weekly`: Repeats once a week on the same day
    - `monthly`: Repeats once a month on the same date

    ### Status Options
    - `scheduled`: Ride is scheduled for the future
    - `in_progress`: Ride is currently in progress
    - `completed`: Ride has been completed
    - `cancelled`: Ride has been cancelled

    ## Example Requests

    For complete example requests for each ride type, see the `/api/v1/rides/reference-data` endpoint.
    """
    try:
        # Log the ride creation attempt
        logger.info(f"Creating new ride from hub {ride.starting_hub_id}")

        # Validate that required parameters are provided
        if not ride.starting_hub_id:
            raise HTTPException(status_code=400, detail="Starting hub ID is required")

        # Validate based on ride type
        ride_dict = ride.dict()

        if ride.ride_type == "hub_to_hub":
            # For hub_to_hub rides, destination_hub_id is required
            if not ride.destination_hub_id:
                raise HTTPException(status_code=400, detail="Hub-to-hub rides require a destination_hub_id")

            logger.info(f"Creating hub_to_hub ride from hub {ride.starting_hub_id} to hub {ride.destination_hub_id}")

            # Ensure destination is None for hub_to_hub rides
            if "destination" in ride_dict:
                ride_dict.pop("destination", None)

        elif ride.ride_type == "hub_to_destination":
            # For hub_to_destination rides, destination object is required
            if not ride.destination:
                raise HTTPException(status_code=400, detail="Hub-to-destination rides require a destination object")

            logger.info(f"Creating hub_to_destination ride from hub {ride.starting_hub_id} to custom destination")

            # Ensure destination_hub_id is None for hub_to_destination rides
            if "destination_hub_id" in ride_dict:
                ride_dict.pop("destination_hub_id", None)

        # For backward compatibility
        if "destination_id" in ride_dict and ride_dict["destination_id"] and ride.ride_type == "hub_to_hub":
            ride_dict["destination_hub_id"] = ride_dict.pop("destination_id", None)

        # Ensure price_per_seat is not None to avoid NULL constraint error
        if "price_per_seat" not in ride_dict or ride_dict["price_per_seat"] is None:
            ride_dict["price_per_seat"] = 0.0
            logger.info("Setting default price_per_seat to 0.0")

        # Always set available_seats to capacity if not explicitly provided
        if "available_seats" not in ride_dict or ride_dict["available_seats"] is None:
            if "capacity" in ride_dict and ride_dict["capacity"]:
                ride_dict["available_seats"] = ride_dict["capacity"]
                logger.info(f"Setting available_seats to capacity: {ride_dict['capacity']}")
            else:
                # Default capacity if not specified
                ride_dict["available_seats"] = 4
                logger.info("Setting default available_seats to 4")

        # Set a default driver_id if no user is authenticated
        if "driver_id" not in ride_dict or ride_dict["driver_id"] is None:
            if current_user:
                ride_dict["driver_id"] = current_user.id
                logger.info(f"Setting driver_id to current user: {current_user.id}")
            else:
                # Use a default driver ID (1) when no user is authenticated
                ride_dict["driver_id"] = 1
                logger.info("No authenticated user, setting default driver_id to 1")

        # Create a new RideCreate instance with the updated dictionary
        updated_ride = RideCreate(**ride_dict)

        # Get the driver_id from the updated dictionary
        driver_id = ride_dict.get("driver_id", 1)

        ride_service = RideService(db)
        new_rides = ride_service.create_ride(db, ride_dict, driver_id)

        # For recurring rides, the service returns a list of rides
        # We'll return the parent ride (first in the list)
        parent_ride = new_rides[0] if isinstance(new_rides, list) else new_rides

        logger.info(f"Successfully created ride with ID {parent_ride.id}")

        # Convert the new ride ORM object to dictionary with proper hub handling
        ride_dict = ride_to_schema(parent_ride, include_passengers=False)

        try:
            ride_response = RideDetailedResponse.parse_obj(ride_dict)
            return ride_response
        except Exception as e:
            # If validation fails, return a simplified response
            logger.warning(f"Validation error when creating ride: {str(e)}")
            return {
                "id": parent_ride.id,
                "ride_type": ride_dict.get("ride_type", "enterprise"),
                "status": ride_dict.get("status", "scheduled"),
                "message": "Ride created successfully"
            }
    except ValueError as e:
        # Handle specific validation errors
        logger.warning(f"Validation error when creating ride: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Error creating ride: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating ride: {str(e)}")

@router.get("/{ride_id}/bookings", response_model=List[RideBookingResponse])
async def get_ride_bookings(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Get all bookings for a specific ride.
    """
    try:
        ride_service = RideService(db)
        bookings = ride_service.get_ride_bookings(ride_id)
        if not bookings:
            raise HTTPException(status_code=404, detail="Ride not found or no bookings")

        # Convert the booking ORM objects to dictionaries and then to Pydantic models
        booking_dicts = [booking_to_schema(booking) for booking in bookings]
        booking_responses = [RideBookingResponse.parse_obj(booking_dict) for booking_dict in booking_dicts]

        return booking_responses
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bookings for ride {ride_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting bookings: {str(e)}")

@router.put("/{ride_id}", response_model=RideDetailedResponse)
async def update_ride(
    ride_id: int,
    ride_update: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_driver_user)  # Only admins or drivers can update rides
):
    """
    Update a ride (admin, manager, or driver only).
    """
    try:
        ride_service = RideService(db)
        updated_ride = ride_service.update_ride(db, ride_id, ride_update)

        # Convert the updated ride ORM object to dictionary with proper hub handling
        ride_dict = ride_to_schema(updated_ride, include_passengers=False)
        ride_response = RideDetailedResponse.parse_obj(ride_dict)

        return ride_response
    except ValueError as e:
        # Handle specific validation errors
        logger.warning(f"Validation error when updating ride: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Error updating ride: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error updating ride: {str(e)}")

@router.post("/{ride_id}/cancel", response_model=RideDetailedResponse)
async def cancel_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_driver_user)  # Only admins or drivers can cancel rides
):
    """
    Cancel a ride (admin, manager, or driver only).
    """
    try:
        ride_service = RideService(db)
        cancelled_ride = ride_service.cancel_ride(db, ride_id)

        # Convert the cancelled ride ORM object to dictionary with proper hub handling
        ride_dict = ride_to_schema(cancelled_ride, include_passengers=False)
        ride_response = RideDetailedResponse.parse_obj(ride_dict)

        return ride_response
    except ValueError as e:
        # Handle specific validation errors
        logger.warning(f"Validation error when cancelling ride: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Error cancelling ride: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error cancelling ride: {str(e)}")

@router.delete("/{ride_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)  # Only admins can delete rides
):
    """
    Delete a ride and all its bookings (admin only).

    This is a permanent deletion and cannot be undone.
    All bookings associated with this ride will also be deleted.
    """
    try:
        ride_service = RideService(db)
        ride_service.delete_ride(db, ride_id)
        return None
    except ValueError as e:
        # Handle specific validation errors
        logger.warning(f"Validation error when deleting ride: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Error deleting ride: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deleting ride: {str(e)}")

@router.get("/reference-data")
async def get_ride_reference_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
                "latitude": getattr(hub, 'latitude', None),
                "longitude": getattr(hub, 'longitude', None)
            } for hub in hubs
        ]

        # Get all vehicle types
        from app.models.vehicle import VehicleType
        vehicle_types = db.query(VehicleType).all()
        vehicle_type_list = [
            {
                "id": vt.id,
                "name": vt.name,
                "description": vt.description,
                "capacity": 4,  # Default capacity since it's not in the DB
                "is_active": True,  # Default value
                "price_factor": 1.0  # Default value
            } for vt in vehicle_types
        ]

        # Get all enterprises (admin only)
        enterprise_list = []
        if hasattr(current_user, 'has_admin_privileges') and current_user.has_admin_privileges():
            # Check if enterprise model exists
            try:
                # Try to get enterprises from the database
                enterprises = db.execute("SELECT id, name, address, city FROM enterprises").fetchall()
                enterprise_list = [
                    {
                        "id": ent.id,
                        "name": ent.name,
                        "address": getattr(ent, 'address', None),
                        "city": getattr(ent, 'city', None)
                    } for ent in enterprises
                ]
            except Exception as e:
                logger.warning(f"Could not fetch enterprises: {str(e)}")
                # Provide sample enterprise data if query fails
                enterprise_list = [
                    {
                        "id": 1,
                        "name": "Volvo",
                        "address": "Volvo HQ, Gothenburg",
                        "city": "Gothenburg"
                    },
                    {
                        "id": 2,
                        "name": "Ericsson",
                        "address": "Ericsson HQ, Stockholm",
                        "city": "Stockholm"
                    }
                ]

        # Define ride types
        ride_types = [
            {
                "id": "hub_to_hub",
                "name": "Hub to Hub",
                "description": "Ride between two hubs"
            },
            {
                "id": "hub_to_destination",
                "name": "Hub to Destination",
                "description": "Ride from a hub to a custom destination"
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "description": "Ride for company employees"
            }
        ]

        # Define recurrence patterns
        recurrence_patterns = [
            {
                "id": "one_time",
                "name": "One Time",
                "description": "A single ride that does not repeat"
            },
            {
                "id": "daily",
                "name": "Daily",
                "description": "Repeats every day"
            },
            {
                "id": "weekdays",
                "name": "Weekdays",
                "description": "Repeats Monday through Friday"
            },
            {
                "id": "weekly",
                "name": "Weekly",
                "description": "Repeats once a week on the same day"
            },
            {
                "id": "monthly",
                "name": "Monthly",
                "description": "Repeats once a month on the same date"
            }
        ]

        # Define status options
        status_options = [
            {
                "id": "scheduled",
                "name": "Scheduled",
                "description": "Ride is scheduled for the future"
            },
            {
                "id": "in_progress",
                "name": "In Progress",
                "description": "Ride is currently in progress"
            },
            {
                "id": "completed",
                "name": "Completed",
                "description": "Ride has been completed"
            },
            {
                "id": "cancelled",
                "name": "Cancelled",
                "description": "Ride has been cancelled"
            }
        ]

        # Return all reference data
        return {
            "hubs": hub_list,
            "vehicle_types": vehicle_type_list,
            "ride_types": ride_types,
            "recurrence_patterns": recurrence_patterns,
            "status_options": status_options,
            "enterprises": enterprise_list,
            "example_requests": {
                "hub_to_hub": {
                    "ride_type": "hub_to_hub",
                    "starting_hub_id": 1,
                    "destination_hub_id": 2,
                    "departure_time": "2025-04-15T08:00:00Z",
                    "vehicle_type_id": 1,
                    "price_per_seat": 50,
                    "available_seats": 15,
                    "status": "scheduled"
                },
                "hub_to_destination": {
                    "ride_type": "hub_to_destination",
                    "starting_hub_id": 1,
                    "destination": {
                        "name": "Custom Destination",
                        "address": "123 Main St",
                        "city": "Gothenburg",
                        "latitude": 57.7089,
                        "longitude": 11.9746
                    },
                    "departure_time": "2025-04-15T08:00:00Z",
                    "vehicle_type_id": 1,
                    "price_per_seat": 50,
                    "available_seats": 15,
                    "status": "scheduled"
                },
                "enterprise": {
                    "ride_type": "enterprise",
                    "starting_hub_id": 1,
                    "destination_hub_id": None,
                    "destination": {
                        "name": "Volvo Headquarters",
                        "address": "Volvo HQ, Gothenburg",
                        "city": "Gothenburg",
                        "latitude": 57.7089,
                        "longitude": 11.9746
                    },
                    "enterprise_id": 1,
                    "recurrence_pattern": "daily",
                    "start_date": "2025-04-15",
                    "end_date": "2025-05-15",
                    "departure_time": "2025-04-15T08:00:00Z",
                    "departure_times": [
                        "08:00",
                        "17:00"
                    ],
                    "vehicle_type_id": 1,
                    "price_per_seat": 50,
                    "available_seats": 15,
                    "status": "scheduled"
                }
            }
        }
    except Exception as e:
        logger.error(f"Error getting ride reference data: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting ride reference data: {str(e)}")
