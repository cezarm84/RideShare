import datetime
import enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    Time,
)
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class DriverStatus(str, enum.Enum):
    """Status of a driver in the system"""

    PENDING = "pending"  # Waiting for approval
    ACTIVE = "active"  # Approved and active
    INACTIVE = "inactive"  # Temporarily inactive
    SUSPENDED = "suspended"  # Suspended due to violations
    REJECTED = "rejected"  # Application rejected


class DriverVerificationStatus(str, enum.Enum):
    """Verification status for driver documents"""

    PENDING = "pending"  # Documents submitted, waiting for verification
    VERIFIED = "verified"  # Documents verified
    REJECTED = "rejected"  # Documents rejected
    EXPIRED = "expired"  # Documents expired


class VehicleInspectionStatus(str, enum.Enum):
    """Status of vehicle inspection"""

    PENDING = "pending"  # Waiting for inspection
    PASSED = "passed"  # Passed inspection
    FAILED = "failed"  # Failed inspection
    EXPIRED = "expired"  # Inspection expired


class RideTypePermission(str, enum.Enum):
    """Types of rides a driver is permitted to drive"""

    HUB_TO_HUB = "hub_to_hub"
    HUB_TO_DESTINATION = "hub_to_destination"
    ENTERPRISE = "enterprise"
    ALL = "all"


# Association table for driver ride type permissions
driver_ride_type_permissions = Table(
    "driver_ride_type_permissions",
    Base.metadata,
    Column(
        "driver_profile_id", Integer, ForeignKey("driver_profiles.id"), primary_key=True
    ),
    Column(
        "ride_type", String, primary_key=True
    ),  # Uses values from RideTypePermission enum
)


class DriverProfile(Base):
    """Extended profile information for drivers"""

    __tablename__ = "driver_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Driver status and verification
    status = Column(String, default=DriverStatus.PENDING)
    verification_status = Column(String, default=DriverVerificationStatus.PENDING)

    # Driver's license information
    license_number = Column(String, nullable=False)
    license_expiry = Column(Date, nullable=False)
    license_state = Column(String, nullable=False)
    license_country = Column(String, nullable=False)
    license_class = Column(String, nullable=True)

    # Driver photo
    profile_photo_url = Column(String, nullable=True)

    # Driver metrics
    average_rating = Column(Float, default=0.0)
    total_rides = Column(Integer, default=0)
    completed_rides = Column(Integer, default=0)
    cancelled_rides = Column(Integer, default=0)

    # Driver preferences
    preferred_radius_km = Column(
        Float, default=10.0
    )  # Preferred driving radius in kilometers
    max_passengers = Column(Integer, default=4)

    # Background check information
    background_check_date = Column(Date, nullable=True)
    background_check_status = Column(String, nullable=True)

    # Additional information
    bio = Column(Text, nullable=True)
    languages = Column(String, nullable=True)  # Comma-separated list of languages

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(
        DateTime,
        default=datetime.datetime.now(datetime.timezone.utc),
        onupdate=datetime.datetime.now(datetime.timezone.utc),
    )

    # Relationships
    user = relationship("User", backref="driver_profile")
    vehicles = relationship(
        "DriverVehicle", back_populates="driver", cascade="all, delete-orphan"
    )
    schedules = relationship(
        "DriverSchedule", back_populates="driver", cascade="all, delete-orphan"
    )
    reviews = relationship(
        "DriverReview", back_populates="driver", cascade="all, delete-orphan"
    )
    documents = relationship(
        "DriverDocument", back_populates="driver", cascade="all, delete-orphan"
    )

    @property
    def ride_type_permissions(self):
        """Get the ride type permissions for this driver"""
        # Import here to avoid circular imports
        from sqlalchemy import select

        from app.db.session import SessionLocal

        # Create a session
        db = SessionLocal()

        # Query the permissions
        result = db.execute(
            select(driver_ride_type_permissions.c.ride_type).where(
                driver_ride_type_permissions.c.driver_profile_id == self.id
            )
        ).fetchall()

        # Close the session
        db.close()

        # Return the permissions as a list of strings
        return [r[0] for r in result]

    def __repr__(self):
        return f"<DriverProfile(id={self.id}, user_id={self.user_id}, status={self.status})>"


class DriverVehicle(Base):
    """Vehicles registered by drivers for ride-sharing"""

    __tablename__ = "driver_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("driver_profiles.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)

    # Vehicle inspection information
    inspection_status = Column(String, default=VehicleInspectionStatus.PENDING)
    last_inspection_date = Column(Date, nullable=True)
    next_inspection_date = Column(Date, nullable=True)

    # Is this the driver's primary vehicle?
    is_primary = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(
        DateTime,
        default=datetime.datetime.now(datetime.timezone.utc),
        onupdate=datetime.datetime.now(datetime.timezone.utc),
    )

    # Relationships
    driver = relationship("DriverProfile", back_populates="vehicles")
    vehicle = relationship("Vehicle", backref="driver_vehicles")

    def __repr__(self):
        return f"<DriverVehicle(id={self.id}, driver_id={self.driver_id}, vehicle_id={self.vehicle_id})>"


class DriverSchedule(Base):
    """Work schedule for drivers"""

    __tablename__ = "driver_schedules"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("driver_profiles.id"), nullable=False)

    # Schedule type
    is_recurring = Column(
        Boolean, default=True
    )  # True for weekly schedule, False for one-time availability

    # For recurring schedules
    day_of_week = Column(Integer, nullable=True)  # 0=Monday, 6=Sunday

    # For one-time availability
    specific_date = Column(Date, nullable=True)

    # Time range
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Location preferences
    preferred_starting_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=True)
    preferred_area = Column(String, nullable=True)  # General area description

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(
        DateTime,
        default=datetime.datetime.now(datetime.timezone.utc),
        onupdate=datetime.datetime.now(datetime.timezone.utc),
    )

    # Relationships
    driver = relationship("DriverProfile", back_populates="schedules")
    preferred_hub = relationship("Hub", backref="driver_schedules")

    def __repr__(self):
        if self.is_recurring:
            return f"<DriverSchedule(id={self.id}, driver_id={self.driver_id}, day={self.day_of_week}, time={self.start_time}-{self.end_time})>"
        else:
            return f"<DriverSchedule(id={self.id}, driver_id={self.driver_id}, date={self.specific_date}, time={self.start_time}-{self.end_time})>"


class DriverTimeOff(Base):
    """Time off periods for drivers"""

    __tablename__ = "driver_time_off"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("driver_profiles.id"), nullable=False)

    # Time off period
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)

    # Reason
    reason = Column(String, nullable=True)

    # Status
    status = Column(String, default="approved")  # approved, pending, rejected

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(
        DateTime,
        default=datetime.datetime.now(datetime.timezone.utc),
        onupdate=datetime.datetime.now(datetime.timezone.utc),
    )

    # Relationships
    driver = relationship("DriverProfile", backref="time_off_periods")

    def __repr__(self):
        return f"<DriverTimeOff(id={self.id}, driver_id={self.driver_id}, period={self.start_date} to {self.end_date})>"


class DriverReview(Base):
    """Reviews for drivers from passengers"""

    __tablename__ = "driver_reviews"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("driver_profiles.id"), nullable=False)
    passenger_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=False)

    # Review details
    rating = Column(Float, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)

    # Review categories
    driving_rating = Column(Float, nullable=True)  # 1-5 stars for driving skill
    cleanliness_rating = Column(
        Float, nullable=True
    )  # 1-5 stars for vehicle cleanliness
    punctuality_rating = Column(Float, nullable=True)  # 1-5 stars for punctuality

    # Status
    is_public = Column(Boolean, default=True)
    is_flagged = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(
        DateTime,
        default=datetime.datetime.now(datetime.timezone.utc),
        onupdate=datetime.datetime.now(datetime.timezone.utc),
    )

    # Relationships
    driver = relationship("DriverProfile", back_populates="reviews")
    passenger = relationship("User", backref="driver_reviews_given")
    ride = relationship("Ride", backref="driver_reviews")

    def __repr__(self):
        return f"<DriverReview(id={self.id}, driver_id={self.driver_id}, rating={self.rating})>"


class DriverDocument(Base):
    """Documents uploaded by drivers for verification"""

    __tablename__ = "driver_documents"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("driver_profiles.id"), nullable=False)

    # Document details
    document_type = Column(
        String, nullable=False
    )  # license, insurance, registration, etc.
    document_url = Column(String, nullable=False)  # URL to the document in storage
    filename = Column(String, nullable=False)

    # Verification status
    verification_status = Column(String, default=DriverVerificationStatus.PENDING)
    verification_notes = Column(Text, nullable=True)

    # Expiry date (if applicable)
    expiry_date = Column(Date, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(
        DateTime,
        default=datetime.datetime.now(datetime.timezone.utc),
        onupdate=datetime.datetime.now(datetime.timezone.utc),
    )

    # Relationships
    driver = relationship("DriverProfile", back_populates="documents")

    def __repr__(self):
        return f"<DriverDocument(id={self.id}, driver_id={self.driver_id}, type={self.document_type})>"
