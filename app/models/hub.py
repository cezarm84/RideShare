from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class Hub(Base):
    """Model for transportation hubs (stations, airports, bus stops, etc.)"""

    __tablename__ = "hubs"
    __table_args__ = {
        "extend_existing": True
    }  # Add this line to fix table redefinition errors

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    # Simplified address information
    address = Column(String, nullable=False)
    city = Column(String, nullable=False, default="Gothenburg")
    postal_code = Column(String, nullable=True)

    # Location information
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Status and metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships with rides
    starting_rides = relationship(
        "Ride", foreign_keys="Ride.starting_hub_id", back_populates="starting_hub"
    )
    destination_rides = relationship(
        "Ride", foreign_keys="Ride.destination_hub_id", back_populates="destination_hub"
    )

    def __repr__(self):
        return f"<Hub(id={self.id}, name='{self.name}', coordinates=({self.latitude}, {self.longitude})>"


class HubPair(Base):
    """
    Represents a connection between two hubs, which can be used for routing and scheduling.
    This allows defining expected travel times and distances between specific hub pairs.
    """

    __tablename__ = "hub_pairs"

    id = Column(Integer, primary_key=True, index=True)
    source_hub_id = Column(
        Integer, ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False
    )
    destination_hub_id = Column(
        Integer, ForeignKey("hubs.id", ondelete="CASCADE"), nullable=False
    )
    expected_travel_time = Column(
        Integer, nullable=True, comment="Expected travel time in minutes"
    )
    distance = Column(Float, nullable=True, comment="Distance in kilometers")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    source_hub = relationship("Hub", foreign_keys=[source_hub_id])
    destination_hub = relationship("Hub", foreign_keys=[destination_hub_id])

    def __repr__(self):
        return f"<HubPair(id={self.id}, source={self.source_hub_id}, destination={self.destination_hub_id})>"
