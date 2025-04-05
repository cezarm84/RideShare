from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
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
    
    # Define relationships
    starting_hub = relationship("Hub", foreign_keys=[starting_hub_id], backref="rides_from")
    destination = relationship("Location", foreign_keys=[destination_id], backref="rides_to")
    driver = relationship("User", foreign_keys=[driver_id], backref="rides_as_driver")
    
    # Relationship with bookings
    bookings = relationship("RideBooking", back_populates="ride", cascade="all, delete-orphan")

class RideBooking(Base):
    __tablename__ = "ride_bookings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=False)
    passenger_count = Column(Integer, default=1, nullable=False)
    status = Column(String, default="confirmed")  # confirmed, cancelled, completed
    price = Column(Float, nullable=False)
    booking_time = Column(DateTime, default=func.now())
    
    # Define relationships with back_populates to avoid conflicts
    user = relationship("User", back_populates="bookings")
    ride = relationship("Ride", back_populates="bookings")
    
    # Define a property to access the user as a passenger (for clarity)
    @property
    def passenger(self):
        return self.user
