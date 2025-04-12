from typing import Optional

from pydantic import BaseModel


class EnterpriseBase(BaseModel):
    """Base schema for enterprise data"""

    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = True


class EnterpriseCreate(EnterpriseBase):
    """Schema for creating a new enterprise"""

    pass


class EnterpriseUpdate(BaseModel):
    """Schema for updating an enterprise"""

    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None


class EnterpriseResponse(EnterpriseBase):
    """Schema for API responses"""

    id: int

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility
