from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VehicleTypeBase(BaseModel):
    name: str
    description: Optional[str] = None
    capacity: int = Field(gt=0, description="Maximum number of passengers")
    is_active: bool = True
    price_factor: float = Field(default=1.0, description="Multiplier for ride pricing")


class VehicleTypeCreate(VehicleTypeBase):
    """Schema for creating a new vehicle type"""

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility


class VehicleTypeUpdate(BaseModel):
    """Schema for updating an existing vehicle type"""

    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None
    price_factor: Optional[float] = None

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility


class VehicleTypeInDB(VehicleTypeBase):
    """Schema for vehicle type data in the database"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VehicleTypeResponse(BaseModel):
    """Schema for API responses"""

    id: int
    name: str
    description: Optional[str] = None
    capacity: Optional[int] = 4  # Default capacity if not provided
    is_active: Optional[bool] = True  # Default to active if not provided
    price_factor: Optional[float] = 1.0  # Default price factor if not provided
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility


class VehicleBase(BaseModel):
    """Base schema for vehicle data"""

    make: str
    model: str
    year: int
    color: Optional[str] = None
    license_plate: str
    passenger_capacity: int
    vehicle_type_id: int
    is_active: bool = True


class VehicleCreate(VehicleBase):
    """Schema for creating a new vehicle"""

    owner_id: int

    class Config:
        from_attributes = True


class VehicleUpdate(BaseModel):
    """Schema for updating an existing vehicle"""

    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    license_plate: Optional[str] = None
    passenger_capacity: Optional[int] = None
    vehicle_type_id: Optional[int] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True


class VehicleResponse(BaseModel):
    """Schema for vehicle API responses"""

    id: int
    owner_id: int
    make: str
    model: str
    year: int
    color: Optional[str] = None
    license_plate: str
    passenger_capacity: int
    vehicle_type_id: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
