"""Support ticket model for the application."""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class SupportTicket(Base):
    """Model for support tickets."""

    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Changed to nullable=True to allow anonymous tickets
    issue = Column(Text, nullable=False)
    status = Column(String, default="open")  # open, in_progress, closed
    source = Column(String, default="chatbot")  # chatbot, email, web
    session_id = Column(String, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="support_tickets")
    assignee = relationship("User", foreign_keys=[assigned_to], backref="assigned_tickets")
