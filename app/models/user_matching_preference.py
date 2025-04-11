from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class UserMatchingPreference(Base):
    """Model for storing user preferences for ride matching"""

    __tablename__ = "user_matching_preferences"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    # Time and distance preferences
    max_detour_minutes = Column(Integer, default=15)
    max_wait_minutes = Column(Integer, default=10)
    max_walking_distance_meters = Column(Integer, default=1000)

    # Companion preferences
    preferred_gender = Column(String, nullable=True)
    preferred_language = Column(String, nullable=True)
    minimum_driver_rating = Column(Float, default=4.0)

    # Matching strategy preferences
    prefer_same_enterprise = Column(Boolean, default=True)
    prefer_same_destination = Column(Boolean, default=True)
    prefer_recurring_rides = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("app.models.user.User", back_populates="matching_preferences")

    def __repr__(self):
        return f"<UserMatchingPreference(user_id={self.user_id})>"
