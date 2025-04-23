"""Model for simulating an email inbox."""

from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class InboxEmail(Base):
    """Model for simulating received emails."""
    __tablename__ = "inbox_emails"

    id = Column(Integer, primary_key=True, index=True)
    to_email = Column(String, index=True)
    from_email = Column(String, index=True)
    subject = Column(String)
    html_content = Column(Text)
    text_content = Column(Text, nullable=True)
    cc = Column(String, nullable=True)
    bcc = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    read = Column(Boolean, default=False)
    replied = Column(Boolean, default=False)

    def to_dict(self):
        """Convert InboxEmail to dictionary."""
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
            "read": self.read,
            "replied": self.replied,
        }
