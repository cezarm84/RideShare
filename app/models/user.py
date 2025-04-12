import datetime
import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.models.enterprise import Enterprise


class UserType(str, enum.Enum):
    ADMIN = "admin"
    DRIVER = "driver"
    PASSENGER = "passenger"
    PRIVATE = "private"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MANAGER = "manager"
    DRIVER = "driver"
    USER = "user"


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    first_name = Column(String, default="Unknown")
    last_name = Column(String, default="")
    phone_number = Column(String, nullable=True)
    password_hash = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superadmin = Column(Boolean, default=False)
    user_type = Column(String, default=UserType.PRIVATE)
    role = Column(String, default=UserRole.USER)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    # Simple address strings
    home_address = Column(String, nullable=True)
    work_address = Column(String, nullable=True)

    # Location coordinates - both individual lat/long and POINT format for flexibility
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    work_latitude = Column(Float, nullable=True)
    work_longitude = Column(Float, nullable=True)
    home_location = Column(String, nullable=True)
    work_location = Column(String, nullable=True)

    # Enterprise details for business users
    enterprise_id = Column(Integer, nullable=True)
    employee_id = Column(String, nullable=True)

    # Address details
    home_street = Column(String, nullable=True)
    home_house_number = Column(String, nullable=True)
    home_post_code = Column(String, nullable=True)
    home_city = Column(String, nullable=True)
    work_street = Column(String, nullable=True)
    work_house_number = Column(String, nullable=True)
    work_post_code = Column(String, nullable=True)
    work_city = Column(String, nullable=True)

    # Enhanced matching fields
    preferred_starting_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=True)
    preferred_vehicle_type_id = Column(
        Integer, ForeignKey("vehicle_types.id"), nullable=True
    )
    max_walking_distance_meters = Column(Integer, default=1000)
    max_detour_minutes = Column(Integer, default=15)
    max_wait_minutes = Column(Integer, default=10)

    # Relationships
    # Add the missing payments relationship that's referenced in the Payment model
    payments = relationship("app.models.payment.Payment", back_populates="user")

    # Payment methods relationship
    payment_methods = relationship(
        "app.models.payment_method.PaymentMethod", back_populates="user"
    )

    # Use a single relationship for locations to avoid overlap warnings
    saved_locations = relationship(
        "app.models.location.Location", back_populates="user", overlaps="locations"
    )

    # Vehicle relationship - single relationship to avoid overlaps
    vehicles = relationship(
        "app.models.vehicle.Vehicle",
        back_populates="owner",
        foreign_keys="app.models.vehicle.Vehicle.owner_id",
    )

    # New relationships for matching
    travel_patterns = relationship(
        "app.models.user_travel_pattern.UserTravelPattern",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    matching_preferences = relationship(
        "app.models.user_matching_preference.UserMatchingPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    match_history = relationship(
        "app.models.ride_match_history.RideMatchHistory",
        back_populates="user",
        foreign_keys="app.models.ride_match_history.RideMatchHistory.user_id",
        cascade="all, delete-orphan",
    )
    preferred_starting_hub = relationship(
        "app.models.hub.Hub", foreign_keys=[preferred_starting_hub_id]
    )
    preferred_vehicle_type = relationship(
        "app.models.vehicle_type.VehicleType", foreign_keys=[preferred_vehicle_type_id]
    )

    @property
    def full_name(self):
        """Generate full name from first and last name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return "Unknown"

    @property
    def is_admin(self):
        """Check if user has admin privileges"""
        return self.user_type == UserType.ADMIN or self.role == UserRole.ADMIN

    @property
    def is_manager(self):
        """Check if user has manager privileges"""
        return self.role == UserRole.MANAGER

    @property
    def is_driver(self):
        """Check if user is a driver"""
        return self.user_type == UserType.DRIVER or self.role == UserRole.DRIVER

    def has_admin_privileges(self):
        """Check if user has any administrative privileges (superadmin, admin, or manager)"""
        return (
            self.is_superadmin
            or self.role in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER]
            or self.user_type == UserType.ADMIN
        )

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.full_name})>"


# Enterprise model moved to app/models/enterprise.py


class EnterpriseUser(Base):
    __tablename__ = "enterprise_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    enterprise_id = Column(Integer, ForeignKey(Enterprise.__tablename__ + ".id"))
    employee_id = Column(String)
    department = Column(String, nullable=True)
    position = Column(String, nullable=True)

    # Note: Relationships are defined in app/db/__init__.py
