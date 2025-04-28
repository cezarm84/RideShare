"""Enhanced messaging system for RideShare."""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional

from sqlalchemy import (Boolean, Column, DateTime, Enum as SQLAlchemyEnum,
                        ForeignKey, Integer, String, Table, Text)
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class MessageType(str, Enum):
    """Types of messages that can be sent."""
    DIRECT = "direct"  # One-to-one messages
    GROUP = "group"    # Group messages
    SYSTEM = "system"  # System notifications
    RIDE = "ride"      # Ride-specific messages
    TEXT = "text"      # Legacy text messages


class ChannelType(str, Enum):
    """Types of message channels."""
    ADMIN_DRIVER = "admin_driver"  # Admin-driver communication
    RIDE = "ride"                  # Ride-specific chat
    DRIVER_PASSENGER = "driver_passenger"  # Driver-passenger communication
    ENTERPRISE = "enterprise"      # Enterprise group chats
    COMMUNITY = "community"        # Community forums


# Association table for channel members
channel_members = Table(
    "enhanced_channel_members",
    Base.metadata,
    Column("channel_id", Integer, ForeignKey("message_channels.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("joined_at", DateTime, default=lambda: datetime.now(timezone.utc)),
    Column("is_admin", Boolean, default=False),
    Column("is_muted", Boolean, default=False),
    Column("last_read_message_id", Integer, ForeignKey("enhanced_messages.id"), nullable=True),
)


class MessageChannel(Base):
    """Model for message channels."""
    __tablename__ = "message_channels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)  # Optional name for group channels
    channel_type = Column(SQLAlchemyEnum(ChannelType), index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

    # For ride-specific channels
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=True)

    # For enterprise channels
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"), nullable=True)

    # For community forums
    description = Column(Text, nullable=True)

    # Relationships
    messages = relationship("Message", back_populates="channel", cascade="all, delete-orphan")
    members = relationship("User", secondary=channel_members, backref="message_channels")
    ride = relationship("Ride", back_populates="chat_channel", foreign_keys=[ride_id])
    enterprise = relationship("Enterprise", back_populates="chat_channels")


class Message(Base):
    """Model for messages."""
    __tablename__ = "enhanced_messages"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("message_channels.id"), index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for system messages
    message_type = Column(SQLAlchemyEnum(MessageType), default=MessageType.DIRECT)
    content = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True)
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    # For attachments
    has_attachment = Column(Boolean, default=False)
    attachment_type = Column(String, nullable=True)
    attachment_url = Column(String, nullable=True)

    # Relationships
    channel = relationship("MessageChannel", back_populates="messages")
    sender = relationship("User", backref="sent_messages")
    read_by = relationship("MessageRead", back_populates="message", cascade="all, delete-orphan")


class MessageRead(Base):
    """Model for tracking message read status."""
    __tablename__ = "enhanced_message_reads"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("enhanced_messages.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    read_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    message = relationship("Message", back_populates="read_by")
    user = relationship("User", backref="read_messages")
