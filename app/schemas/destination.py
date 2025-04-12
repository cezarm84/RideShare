from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DestinationBase(BaseModel):
    """Base schema for destination data"""

    name: str
    address: str
    city: str
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: float
    longitude: float
    enterprise_id: Optional[int] = None
    is_active: Optional[bool] = True


class DestinationCreate(DestinationBase):
    """Schema for creating a new destination"""

    pass


class DestinationUpdate(BaseModel):
    """Schema for updating a destination"""

    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    enterprise_id: Optional[int] = None
    is_active: Optional[bool] = None


class DestinationResponse(DestinationBase):
    """Schema for API responses"""

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility
