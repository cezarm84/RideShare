"""Notification models for the RideShare application."""

from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class NotificationType(str, PyEnum):
    """Notification types."""
    MESSAGE = "message"
    RIDE = "ride"
    SYSTEM = "system"
    DRIVER = "driver"
    ENTERPRISE = "enterprise"


class Notification(Base):
    """Notification model."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    type = Column(Enum(NotificationType), index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    link_to = Column(String(255), nullable=True)
    source_id = Column(Integer, nullable=True)  # ID of the source (message_id, ride_id, etc.)
    meta_data = Column(Text, nullable=True)  # JSON string with additional data

    # Relationships
    user = relationship("User", back_populates="notifications")

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type})>"
