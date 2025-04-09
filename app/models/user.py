from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Float, DateTime, Enum
from sqlalchemy.orm import relationship
import datetime
import enum
import uuid

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
    __table_args__ = {'extend_existing': True}

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
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

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

    # Relationships
    # Add the missing payments relationship that's referenced in the Payment model
    payments = relationship("Payment", back_populates="user")

    # Payment methods relationship
    payment_methods = relationship("PaymentMethod", back_populates="user")

    # Use a single relationship for locations to avoid overlap warnings
    saved_locations = relationship("Location", back_populates="user", overlaps="locations")

    # Vehicle relationship - single relationship to avoid overlaps
    vehicles = relationship("Vehicle", back_populates="owner", foreign_keys="Vehicle.owner_id")

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
        return (self.is_superadmin or
                self.role in [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.MANAGER] or
                self.user_type == UserType.ADMIN)

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
