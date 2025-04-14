"""Contact message models for the application."""

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text, func

from app.db.base_class import Base


class ContactStatus(str, Enum):
    """Status of a contact message."""

    NEW = "new"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    SPAM = "spam"


class ContactCategory(str, Enum):
    """Category of a contact message."""

    GENERAL = "general"
    ACCOUNT = "account"
    BOOKING = "booking"
    PAYMENT = "payment"
    ENTERPRISE = "enterprise"
    PARTNERSHIP = "partnership"
    TECHNICAL = "technical"
    FEEDBACK = "feedback"
    OTHER = "other"


class ContactMessage(Base):
    """Model for contact messages from users."""

    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, default=ContactCategory.GENERAL, nullable=False)
    status = Column(String, default=ContactStatus.NEW, nullable=False)
    user_id = Column(
        Integer, nullable=True, index=True
    )  # Optional link to user if logged in
    admin_notes = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
