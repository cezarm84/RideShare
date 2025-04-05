from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.core.security import get_current_user
from app.api.dependencies import get_current_admin_user
from app.schemas.ride import RideCreate, RideResponse, RideBookingResponse
from app.services.ride_service import RideService
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[RideResponse])
async def get_rides(
    destination_id: Optional[int] = None,
    hub_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ride_service = RideService(db)
    return ride_service.get_upcoming_rides(destination_id, hub_id)

@router.post("", response_model=RideResponse, status_code=status.HTTP_201_CREATED)
async def create_ride(
    ride: RideCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    ride_service = RideService(db)
    return ride_service.create_ride(ride)

@router.get("/{ride_id}/bookings", response_model=List[RideBookingResponse])
async def get_ride_bookings(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    ride_service = RideService(db)
    bookings = ride_service.get_ride_bookings(ride_id)
    if not bookings:
        raise HTTPException(status_code=404, detail="Ride not found or no bookings")
    return bookings