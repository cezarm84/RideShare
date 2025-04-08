from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Boolean, Enum, JSON, Date, Time, Table
from sqlalchemy.orm import relationship
import datetime
import enum

from app.db.base_class import Base
from app.models.vehicle import VehicleType

class RideType(str, enum.Enum):
    ENTERPRISE = "enterprise"  # Rides for company employees
    HUB_TO_HUB = "hub_to_hub"  # Fixed routes between transportation hubs
    HUB_TO_DESTINATION = "hub_to_destination"  # Routes from hub to custom destination

class RideStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RecurrencePattern(str, enum.Enum):
    DAILY = "daily"
    WEEKDAYS = "weekdays"  # Monday to Friday
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ONE_TIME = "one_time"  # Single occurrence

# Association table for days of week
ride_pattern_days = Table(
    "ride_pattern_days",
    Base.metadata,
    Column("pattern_id", Integer, ForeignKey("recurring_ride_patterns.id"), primary_key=True),
    Column("day_of_week", Integer, primary_key=True)  # 0=Monday, 6=Sunday
)

class RecurringRidePattern(Base):
    """Model for recurring ride patterns"""

    __tablename__ = "recurring_ride_patterns"

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id", ondelete="CASCADE"), nullable=False)
    recurrence_pattern = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    ride = relationship("Ride", back_populates="recurrence_pattern")
    departure_times = relationship("RideDepartureTime", back_populates="pattern", cascade="all, delete-orphan")
    days_of_week = Column(String, nullable=True)  # Store as JSON string '[0,1,2,3,4]' for weekdays

    def __repr__(self):
        return f"<RecurringRidePattern(id={self.id}, pattern={self.recurrence_pattern}, start={self.start_date})>"

class RideDepartureTime(Base):
    """Model for departure times within a recurring pattern"""

    __tablename__ = "ride_departure_times"

    id = Column(Integer, primary_key=True, index=True)
    pattern_id = Column(Integer, ForeignKey("recurring_ride_patterns.id", ondelete="CASCADE"), nullable=False)
    departure_time = Column(Time, nullable=False)

    # Relationships
    pattern = relationship("RecurringRidePattern", back_populates="departure_times")

    def __repr__(self):
        return f"<RideDepartureTime(id={self.id}, time={self.departure_time})>"

class Ride(Base):
    """Model for rides offered by drivers or companies"""

    __tablename__ = "rides"

    id = Column(Integer, primary_key=True, index=True)
    # Commented out for testing - not in current DB schema
    # ride_type = Column(String, default=RideType.HUB_TO_HUB, nullable=False)
    # Using a property instead to maintain compatibility
    _ride_type = None

    @property
    def ride_type(self):
        if self._ride_type:
            return self._ride_type
        elif hasattr(self, '_enterprise_id') and self._enterprise_id:
            return RideType.ENTERPRISE
        elif self.destination_hub_id:
            return RideType.HUB_TO_HUB
        else:
            return RideType.HUB_TO_DESTINATION

    @ride_type.setter
    def ride_type(self, value):
        self._ride_type = value
    driver_id = Column(Integer, ForeignKey("users.id"))
    # enterprise_id is not in the database schema, so we'll use a property
    _enterprise_id = None

    @property
    def enterprise_id(self):
        return self._enterprise_id

    @enterprise_id.setter
    def enterprise_id(self, value):
        self._enterprise_id = value

    # Location coordinates (always stored for mapping)
    origin_lat = Column(Float, nullable=True)
    origin_lng = Column(Float, nullable=True)
    destination_lat = Column(Float, nullable=True)
    destination_lng = Column(Float, nullable=True)

    # Hub references
    starting_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=False)
    destination_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=True)

    # Custom destination details (for hub_to_destination rides)
    # For hub_to_destination rides, we'll store the destination ID
    destination_id = Column(Integer, ForeignKey("destinations.id"), nullable=True)
    destination_obj = relationship("Destination", foreign_keys=[destination_id], backref="rides")

    # For backward compatibility, we'll keep the destination property
    _destination = None

    @property
    def destination(self):
        # If we have a destination_obj, use that to create a destination dict
        if self.destination_obj:
            return {
                "id": self.destination_obj.id,
                "name": self.destination_obj.name,
                "address": self.destination_obj.address,
                "city": self.destination_obj.city,
                "latitude": self.destination_obj.latitude,
                "longitude": self.destination_obj.longitude
            }
        # Otherwise return the stored destination property
        return self._destination

    @destination.setter
    def destination(self, value):
        self._destination = value

    # Exclude properties that don't exist in the database schema
    __mapper_args__ = {
        'exclude_properties': ['destination', 'is_recurring']
    }

    # Ride details
    departure_time = Column(DateTime, nullable=False)
    arrival_time = Column(DateTime, nullable=True)
    status = Column(String, default=RideStatus.SCHEDULED)
    available_seats = Column(Integer, default=4)
    price_per_seat = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Vehicle type reference
    vehicle_type_id = Column(Integer, ForeignKey("vehicle_types.id"), nullable=False)

    # Parent ride reference for recurring rides
    parent_ride_id = Column(Integer, ForeignKey("rides.id"), nullable=True)

    # Flag to indicate if this is a recurring ride
    # is_recurring is not in the database schema, so we'll use a property
    _is_recurring = False

    @property
    def is_recurring(self):
        # Check if this ride has a recurrence pattern
        if hasattr(self, 'recurrence_pattern') and self.recurrence_pattern is not None:
            return True
        return self._is_recurring

    @is_recurring.setter
    def is_recurring(self, value):
        self._is_recurring = value

    # Relationships
    driver = relationship("User", foreign_keys=[driver_id])
    bookings = relationship("RideBooking", back_populates="ride", cascade="all, delete-orphan")

    # Hub relationships - using foreign_keys to distinguish the relationships
    starting_hub = relationship("Hub", foreign_keys=[starting_hub_id], back_populates="starting_rides")
    destination_hub = relationship("Hub", foreign_keys=[destination_hub_id], back_populates="destination_rides")

    # Vehicle type relationship
    vehicle_type = relationship("VehicleType", back_populates="rides")

    # Recurrence pattern relationship - one-to-one
    recurrence_pattern = relationship("RecurringRidePattern", back_populates="ride", uselist=False, cascade="all, delete-orphan")

    # Parent-child ride relationships
    parent_ride = relationship("Ride", remote_side=[id], backref="child_rides", foreign_keys=[parent_ride_id])

    def __repr__(self):
        if self.destination_hub_id:
            dest = f"hub:{self.destination_hub_id}"
        else:
            dest = "custom_destination"
        return f"<Ride(id={self.id}, type={self.ride_type}, status={self.status}, dest={dest})>"


class RideBooking(Base):
    """Model for bookings made by passengers for rides"""

    __tablename__ = "ride_bookings"

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id", ondelete="CASCADE"))
    passenger_id = Column(Integer, ForeignKey("users.id"))
    seats_booked = Column(Integer, default=1)
    booking_status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship with user
    user = relationship("User", foreign_keys=[passenger_id])

    # Relationship with ride
    ride = relationship("Ride", back_populates="bookings")

    # Relationship with payment - ensure this matches exactly with Payment model
    payment = relationship("Payment", back_populates="booking", uselist=False)

    # Add a property for backward compatibility
    @property
    def passenger(self):
        return self.user

    @passenger.setter
    def passenger(self, value):
        self.user = value

    def __repr__(self):
        return f"<RideBooking(id={self.id}, ride_id={self.ride_id}, passenger_id={self.passenger_id})>"
