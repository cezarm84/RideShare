"""
TestEmail model for storing emails in development environment.
"""

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class TestEmail(Base):
    """
    Model for storing test emails in development environment.
    Used for testing email functionality without sending real emails.
    """

    __tablename__ = "test_emails"

    id = Column(Integer, primary_key=True, index=True)
    to_email = Column(String, index=True)
    from_email = Column(String)
    subject = Column(String)
    html_content = Column(Text)
    text_content = Column(Text, nullable=True)
    cc = Column(String, nullable=True)
    bcc = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Optional relationship to user if email is associated with a user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="test_emails")

    def to_dict(self):
        """Convert TestEmail to dictionary."""
        return {
            "id": self.id,
            "to_email": self.to_email,
            "from_email": self.from_email,
            "subject": self.subject,
            "html_content": self.html_content,
            "text_content": self.text_content,
            "cc": self.cc,
            "bcc": self.bcc,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user_id": self.user_id,
        }
