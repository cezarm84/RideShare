from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class RouteBase(BaseModel):
    name: str
    description: Optional[str] = None
    starting_hub_id: int
    destination_hub_id: int
    distance: Optional[float] = None
    duration: Optional[int] = None
    is_active: bool = True


class RouteCreate(RouteBase):
    """Schema for creating a new route"""

    pass


class RouteUpdate(BaseModel):
    """Schema for updating an existing route"""

    name: Optional[str] = None
    description: Optional[str] = None
    starting_hub_id: Optional[int] = None
    destination_hub_id: Optional[int] = None
    distance: Optional[float] = None
    duration: Optional[int] = None
    is_active: Optional[bool] = None


class RouteInDB(RouteBase):
    """Schema for route data in the database"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RouteResponse(BaseModel):
    """Schema for API responses"""

    id: int
    name: str
    description: Optional[str] = None
    starting_hub_id: int
    destination_hub_id: int
    distance: Optional[float] = None
    duration: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
