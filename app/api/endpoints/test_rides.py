from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.hub import Hub
from app.models.ride import Ride, RideStatus, RideType
from app.models.user import User

router = APIRouter()


@router.post("/test-hub-to-hub", status_code=status.HTTP_201_CREATED)
def test_hub_to_hub_ride(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Test endpoint to create a hub-to-hub ride with hardcoded values"""

    # Get hubs
    starting_hub = db.query(Hub).filter(Hub.id == 1).first()
    destination_hub = db.query(Hub).filter(Hub.id == 2).first()

    if not starting_hub or not destination_hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Hubs not found"
        )

    # Create a datetime object for departure time
    departure_time = datetime(2025, 5, 15, 14, 30, 0)

    # Create the ride
    new_ride = Ride(
        ride_type=RideType.HUB_TO_HUB,
        driver_id=current_user.id,
        starting_hub_id=starting_hub.id,
        destination_hub_id=destination_hub.id,
        origin_lat=starting_hub.latitude,
        origin_lng=starting_hub.longitude,
        destination_lat=destination_hub.latitude,
        destination_lng=destination_hub.longitude,
        departure_time=departure_time,
        status=RideStatus.SCHEDULED,
        available_seats=4,
        price_per_seat=50.0,
        vehicle_type_id=1,
    )

    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)

    return {"message": "Test ride created successfully", "ride_id": new_ride.id}
