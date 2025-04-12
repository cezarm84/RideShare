from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class UserTravelPattern(Base):
    """Model for storing user travel patterns for intelligent matching"""

    __tablename__ = "user_travel_patterns"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Origin information
    origin_type = Column(String, nullable=False)  # 'home', 'work', 'hub', 'custom'
    origin_id = Column(
        Integer, nullable=True
    )  # Reference to location or hub ID if applicable
    origin_latitude = Column(Float, nullable=False)
    origin_longitude = Column(Float, nullable=False)

    # Destination information
    destination_type = Column(String, nullable=False)  # 'home', 'work', 'hub', 'custom'
    destination_id = Column(
        Integer, nullable=True
    )  # Reference to location or hub ID if applicable
    destination_latitude = Column(Float, nullable=False)
    destination_longitude = Column(Float, nullable=False)

    # Time information
    departure_time = Column(Time, nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0-6 for Monday-Sunday

    # Pattern metadata
    frequency = Column(Integer, nullable=False, default=1)  # Number of occurrences
    last_traveled = Column(Date, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship("app.models.user.User", back_populates="travel_patterns")

    def __repr__(self):
        return f"<UserTravelPattern(id={self.id}, user_id={self.user_id}, day={self.day_of_week}, freq={self.frequency})>"
