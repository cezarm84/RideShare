from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class Location(Base):
    """Model for saved locations (addresses, points of interest, etc.)"""

    __tablename__ = "locations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    address = Column(String, nullable=True)

    # Location coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # User who created this location (optional)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationship with User model - matches the saved_locations property in User
    user = relationship("User", back_populates="saved_locations")

    def __repr__(self):
        return f"<Location(id={self.id}, name='{self.name}', coordinates=({self.latitude}, {self.longitude})>"
