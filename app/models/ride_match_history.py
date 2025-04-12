from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base


class RideMatchHistory(Base):
    """Model for storing history of ride matches for learning and improvement"""

    __tablename__ = "ride_match_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    matched_user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    ride_id = Column(
        Integer, ForeignKey("rides.id", ondelete="CASCADE"), nullable=False
    )

    # Match details
    match_score = Column(Float, nullable=False)
    match_reason = Column(String, nullable=True)  # Main reason for the match

    # User feedback
    was_accepted = Column(Boolean, nullable=True)  # Whether the user accepted the match
    feedback_rating = Column(Integer, nullable=True)  # 1-5 rating of match quality
    feedback_comment = Column(String, nullable=True)  # Optional user feedback

    # Metadata
    created_at = Column(DateTime, default=func.now())

    # Relationships
    user = relationship(
        "app.models.user.User", foreign_keys=[user_id], back_populates="match_history"
    )
    matched_user = relationship("app.models.user.User", foreign_keys=[matched_user_id])
    ride = relationship("app.models.ride.Ride")

    __table_args__ = (
        # Ensure a user can only have one match history entry per ride and matched user
        {"sqlite_autoincrement": True},
    )

    def __repr__(self):
        return f"<RideMatchHistory(id={self.id}, user_id={self.user_id}, ride_id={self.ride_id}, score={self.match_score})>"
