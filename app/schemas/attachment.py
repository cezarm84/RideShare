from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AttachmentBase(BaseModel):
    """Base schema for attachment data"""

    file_name: str
    file_size: int = Field(..., description="File size in bytes")
    file_type: str = Field(..., description="MIME type of the file")


class AttachmentCreate(AttachmentBase):
    """Schema for creating a new attachment"""

    message_id: int
    upload_path: str
    file_url: str
    thumbnail_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None


class AttachmentInDB(AttachmentBase):
    """Schema for attachment with database fields"""

    id: int
    message_id: int
    upload_path: str
    file_url: str
    thumbnail_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    created_at: datetime

    class Config:
        orm_mode = True


class AttachmentResponse(AttachmentInDB):
    """Schema for attachment responses"""

    pass


class AttachmentUpdate(BaseModel):
    """Schema for updating an attachment"""

    file_name: Optional[str] = None
