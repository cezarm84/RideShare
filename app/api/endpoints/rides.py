from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.core.security import get_current_user
from app.api.dependencies import get_current_admin_user
from app.schemas.ride import RideCreate, RideResponse, RideDetailedResponse, RideBookingResponse
from app.services.ride_service import RideService
from app.models.user import User
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[RideDetailedResponse])
async def get_rides(
    destination_id: Optional[int] = None,
    hub_id: Optional[int] = None,
    include_passengers: bool = False,
    status: Optional[str] = None,
    limit: int = Query(50, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get rides with detailed information including hub and destination details.
    
    Parameters:
    - destination_id: Filter rides by destination
    - hub_id: Filter rides by starting hub
    - include_passengers: Include passenger information in response
    - status: Filter by ride status (scheduled, in_progress, completed, cancelled)
    - limit: Maximum number of rides to return
    """
    try:
        ride_service = RideService(db)
        rides = ride_service.get_detailed_rides(
            destination_id=destination_id, 
            hub_id=hub_id,
            include_passengers=include_passengers,
            status=status,
            limit=limit
        )
        
        # Log the number of rides found
        logger.info(f"Found {len(rides)} rides matching the query")
        return rides
    except Exception as e:
        logger.error(f"Error getting rides: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting rides: {str(e)}")

@router.get("/{ride_id}", response_model=RideDetailedResponse)
async def get_ride_by_id(
    ride_id: int,
    include_passengers: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific ride including hub and destination.
    Optionally include passenger information.
    """
    try:
        ride_service = RideService(db)
        ride = ride_service.get_ride_by_id(ride_id, include_passengers=include_passengers)
        if not ride:
            raise HTTPException(status_code=404, detail=f"Ride with ID {ride_id} not found")
        return ride
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting ride {ride_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting ride: {str(e)}")

@router.post("", response_model=RideDetailedResponse, status_code=status.HTTP_201_CREATED)
async def create_ride(
    ride: RideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Create a new ride (admin only).
    """
    try:
        logger.info(f"Creating new ride from hub {ride.starting_hub_id} to destination {ride.destination_id}")
        ride_service = RideService(db)
        new_ride = ride_service.create_ride(ride)
        logger.info(f"Successfully created ride with ID {new_ride.id}")
        return new_ride
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
    current_user: User = Depends(get_current_user)
):
    """
    Get all bookings for a specific ride.
    """
    try:
        ride_service = RideService(db)
        bookings = ride_service.get_ride_bookings(ride_id)
        if not bookings:
            raise HTTPException(status_code=404, detail="Ride not found or no bookings")
        return bookings
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting bookings for ride {ride_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error getting bookings: {str(e)}")
