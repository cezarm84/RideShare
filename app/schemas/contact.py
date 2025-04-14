"""Schemas for contact message models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class ContactMessageBase(BaseModel):
    """Base schema for contact message."""

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    subject: str = Field(..., min_length=3, max_length=200)
    message: str = Field(..., min_length=10, max_length=5000)
    category: str = Field("general", max_length=50)


class ContactMessageCreate(ContactMessageBase):
    """Schema for creating a contact message."""

    recaptcha_token: Optional[str] = None


class ContactMessageUpdate(BaseModel):
    """Schema for updating a contact message."""

    status: Optional[str] = None
    admin_notes: Optional[str] = None
    is_read: Optional[bool] = None


class ContactMessageInDBBase(ContactMessageBase):
    """Base schema for contact message in DB."""

    id: int
    status: str
    user_id: Optional[int] = None
    admin_notes: Optional[str] = None
    is_read: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class ContactMessageInDB(ContactMessageInDBBase):
    """Schema for contact message in DB."""

    pass


class ContactMessageResponse(ContactMessageInDBBase):
    """Schema for contact message response."""

    pass


class ContactMessageAdminResponse(ContactMessageResponse):
    """Schema for contact message admin response."""

    pass


class ContactMessagePublicResponse(BaseModel):
    """Schema for public contact message response."""

    id: int
    status: str
    created_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True
