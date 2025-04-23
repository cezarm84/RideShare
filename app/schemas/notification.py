"""Notification schemas for the RideShare application."""

import json
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, validator


class NotificationBase(BaseModel):
    """Base schema for notifications."""
    type: str = Field(..., description="Notification type")
    title: str = Field(..., description="Notification title")
    content: str = Field(..., description="Notification content")
    link_to: Optional[str] = Field(None, description="URL to navigate to when clicked")
    source_id: Optional[int] = Field(None, description="ID of the source (message_id, ride_id, etc.)")
    meta_data: Optional[Dict[str, Any]] = Field(None, description="Additional data specific to notification type")

    @validator("meta_data", pre=True)
    def parse_meta_data(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return None
        return v


class NotificationCreate(NotificationBase):
    """Schema for creating a notification."""
    user_id: int = Field(..., description="User ID to send notification to")


class NotificationUpdate(BaseModel):
    """Schema for updating a notification."""
    is_read: Optional[bool] = Field(None, description="Whether the notification has been read")


class NotificationInDB(NotificationBase):
    """Schema for notification in database."""
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True


class NotificationResponse(NotificationInDB):
    """Schema for notification response."""
    pass


class NotificationList(BaseModel):
    """Schema for list of notifications."""
    notifications: List[NotificationResponse]
    total: int
    unread: int


class NotificationCountResponse(BaseModel):
    """Schema for notification count response."""
    total: int
    unread: int
