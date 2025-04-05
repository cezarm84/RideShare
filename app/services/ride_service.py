from sqlalchemy.orm import Session
from datetime import datetime
from app.models.ride import Ride, RideBooking
from app.schemas.ride import RideCreate

class RideService:
    def __init__(self, db: Session):
        self.db = db

    def get_upcoming_rides(self, destination_id: int | None, hub_id: int | None) -> list[Ride]:
        query = self.db.query(Ride).filter(Ride.status == "scheduled", Ride.departure_time > datetime.utcnow())
        if destination_id:
            query = query.filter(Ride.destination_id == destination_id)
        if hub_id:
            query = query.filter(Ride.starting_hub_id == hub_id)
        return query.all()

    def create_ride(self, ride: RideCreate) -> Ride:
        db_ride = Ride(
            **ride.dict(),
            available_seats=ride.capacity,
            status="scheduled"
        )
        self.db.add(db_ride)
        self.db.commit()
        self.db.refresh(db_ride)
        return db_ride

    def get_ride_bookings(self, ride_id: int) -> list[RideBooking]:
        return self.db.query(RideBooking).filter(RideBooking.ride_id == ride_id).all()