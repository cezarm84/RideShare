import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class MessageAttachment(Base):
    """Model for message attachments like images, files, etc."""

    __tablename__ = "message_attachments"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(
        Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False
    )
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # e.g., "image", "document", "audio"
    file_name = Column(String, nullable=False)
    file_size = Column(Integer)  # size in bytes
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Back reference to the parent message
    message = relationship("ConversationMessage", back_populates="attachments")

    def __repr__(self):
        return f"<MessageAttachment(id={self.id}, message_id={self.message_id}, file_name={self.file_name})>"
