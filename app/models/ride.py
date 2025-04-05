from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.db.base import Base

class Ride(Base):
    __tablename__ = "rides"
    id = Column(Integer, primary_key=True, index=True)
    starting_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=False)
    destination_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    departure_time = Column(DateTime, nullable=False)
    arrival_time = Column(DateTime)
    status = Column(String, default="scheduled")  # scheduled, in_progress, completed, cancelled
    vehicle_type = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    driver_id = Column(Integer, ForeignKey("users.id"))

class RideBooking(Base):
    __tablename__ = "ride_bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=False)
    passenger_count = Column(Integer, nullable=False)
    status = Column(String, default="confirmed")  # confirmed, cancelled, completed
    price = Column(Float, nullable=False)
    booking_time = Column(DateTime, default=func.now())