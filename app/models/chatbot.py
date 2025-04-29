"""Models for chatbot functionality."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class ChatbotFeedback(Base):
    """Model for chatbot feedback."""

    __tablename__ = "chatbot_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    message_id = Column(String(255), nullable=False)
    is_helpful = Column(Boolean, nullable=False)
    session_id = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    intent = Column(String(255), nullable=True)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships - using string reference to avoid circular imports
    user = relationship("User", back_populates="chatbot_feedback")


class ChatbotIntentStats(Base):
    """Model for chatbot intent statistics."""

    __tablename__ = "chatbot_intent_stats"

    id = Column(Integer, primary_key=True, index=True)
    intent = Column(String(255), nullable=False, unique=True, index=True)
    helpful_count = Column(Integer, nullable=False, default=0)
    unhelpful_count = Column(Integer, nullable=False, default=0)
    last_updated = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    @property
    def total_count(self) -> int:
        """Get the total count of feedback for this intent."""
        return self.helpful_count + self.unhelpful_count

    @property
    def helpfulness_ratio(self) -> float:
        """Get the ratio of helpful feedback to total feedback."""
        if self.total_count == 0:
            return 0.0
        return self.helpful_count / self.total_count
