from datetime import datetime
from typing import Optional, Tuple

from pydantic import BaseModel


class AddressResponse(BaseModel):
    street: Optional[str] = None
    house_number: Optional[str] = None
    post_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    coordinates: Optional[Tuple[float, float]] = None


class AddressCreate(BaseModel):
    street: str
    house_number: Optional[str] = None
    post_code: str
    city: str
    country: str = "Sweden"
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility


class HubBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    postal_code: Optional[str] = None
    latitude: float
    longitude: float
    is_active: bool = True


class HubCreate(BaseModel):
    """Schema for creating a new hub"""

    name: str
    address: str
    postal_code: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: bool = True

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility


class HubUpdate(BaseModel):
    """Schema for updating an existing hub"""

    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = None

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility


class HubInDB(HubBase):
    """Schema for hub data in the database"""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HubResponse(BaseModel):
    """Schema for API responses"""

    id: int
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: Optional[bool] = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility

    # Format address for API response
    def to_api_response(self):
        return {
            "id": self.id,
            "name": self.name,
            "address": {
                "street": self.address,
                "house_number": None,
                "post_code": self.postal_code,
                "city": self.city,
                "country": "Sweden",
                "coordinates": (
                    (self.latitude, self.longitude)
                    if self.latitude and self.longitude
                    else None
                ),
            },
            "is_active": self.is_active,
            "coordinates": (
                (self.latitude, self.longitude)
                if self.latitude and self.longitude
                else None
            ),
        }

    # Add compatibility method for both Pydantic v1 and v2
    @classmethod
    def from_orm(cls, obj):
        """
        Creates a model from an ORM object or dict.
        Compatible with Pydantic v1 and v2.
        """
        if hasattr(cls, "model_validate"):
            # Pydantic v2
            return cls.model_validate(obj)
        else:
            # Pydantic v1
            return cls.parse_obj(obj)

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility


class HubPairCreate(BaseModel):
    source_hub_id: int
    destination_hub_id: int
    expected_travel_time: Optional[int] = None  # in minutes
    distance: Optional[float] = None  # in kilometers
    is_active: bool = True

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility


class HubPairResponse(BaseModel):
    id: int
    source_hub_id: int
    destination_hub_id: int
    source_hub: Optional[HubResponse] = None
    destination_hub: Optional[HubResponse] = None
    expected_travel_time: Optional[int] = None
    distance: Optional[float] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # For Pydantic v2
        orm_mode = True  # For Pydantic v1 compatibility
