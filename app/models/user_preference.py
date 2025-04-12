import datetime
from datetime import timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class UserPreference(Base):
    """Model for user preferences"""

    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    theme = Column(String, nullable=True)
    language = Column(String, nullable=True)
    notifications = Column(Boolean, default=True)
    email_frequency = Column(String, default="daily")
    push_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.datetime.now(timezone.utc),
        onupdate=lambda: datetime.datetime.now(timezone.utc),
    )

    # Relationship with user
    user = relationship("User")

    def __repr__(self):
        return f"<UserPreference(id={self.id}, user_id={self.user_id}, theme={self.theme}, language={self.language})>"
