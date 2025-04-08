from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import datetime
from app.db.base_class import Base

# Association table for conversation participants
conversation_participants = Table(
    "conversation_participants",
    Base.metadata,
    Column("conversation_id", Integer, ForeignKey("conversations.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True)
)

class Conversation(Base):
    """Model for message conversations"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)  # Optional title for group conversations
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=True)  # Optional link to a ride
    created_at = Column(DateTime, default=func.now())
    is_active = Column(Boolean, default=True)
    conversation_type = Column(String, default="direct")  # direct, ride, support
    
    # Relationships
    participants = relationship("User", secondary=conversation_participants, backref="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    ride = relationship("Ride", backref="conversations")

class Message(Base):
    """Model for individual messages within a conversation"""
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Added recipient_id column
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=func.now())
    read_at = Column(DateTime, nullable=True)
    is_system_message = Column(Boolean, default=False)  # For system notifications
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    # Relationships with overlaps parameter to silence warnings
    sender = relationship("User", foreign_keys=[sender_id], overlaps="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], overlaps="received_messages")
    # Using string reference to avoid circular imports
    attachments = relationship("MessageAttachment", back_populates="message", cascade="all, delete-orphan")
    
    # Additional metadata fields
    message_type = Column(String, default="text")  # text, location, image, file, audio, video
    message_metadata = Column(Text, nullable=True)  # JSON data for rich messages (locations, etc.)
    
    def __repr__(self):
        return f"<Message(id={self.id}, sender_id={self.sender_id}, recipient_id={self.recipient_id})>"

class UserMessageSettings(Base):
    """User preferences for messaging"""
    __tablename__ = "user_message_settings"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    notifications_enabled = Column(Boolean, default=True)
    sound_enabled = Column(Boolean, default=True)
    auto_delete_after_days = Column(Integer, default=30)
    show_read_receipts = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", backref="message_settings")
