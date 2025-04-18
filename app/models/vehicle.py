from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class VehicleType(Base):
    """
    Model for different vehicle types supported by the application.
    Adjusted to match existing database schema.
    """

    __tablename__ = "vehicle_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text)
    capacity = Column(Integer, default=4)  # Added capacity field
    # Commented out fields that don't exist in the current DB schema
    # is_active = Column(Boolean, default=True)
    # price_factor = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Relationships
    rides = relationship(
        "Ride", back_populates="vehicle_type", foreign_keys="Ride.vehicle_type_id"
    )

    def __repr__(self):
        return f"<VehicleType(name='{self.name}')>"


class Vehicle(Base):
    """
    Model for actual vehicles registered in the system.
    Each vehicle has a specific type and owner.
    """

    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_type_id = Column(Integer, ForeignKey("vehicle_types.id"), nullable=False)
    make = Column(String(50))
    model = Column(String(50))
    year = Column(Integer)
    color = Column(String(30))
    license_plate = Column(String(20), unique=True)
    passenger_capacity = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    # Fixed relationship - use back_populates with proper overlaps parameter
    owner = relationship("User", back_populates="vehicles")
    vehicle_type = relationship("VehicleType")

    def __repr__(self):
        return f"<Vehicle(make='{self.make}', model='{self.model}', plate='{self.license_plate}')>"
