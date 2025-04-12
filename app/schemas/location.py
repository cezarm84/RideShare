from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, validator


class CoordinatesModel(BaseModel):
    """Model for geographic coordinates"""

    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")

    @validator("latitude")
    def validate_latitude(cls, v):
        if v < -90 or v > 90:
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @validator("longitude")
    def validate_longitude(cls, v):
        if v < -180 or v > 180:
            raise ValueError("Longitude must be between -180 and 180")
        return v

    class Config:
        from_attributes = True


class AddressInfo(BaseModel):
    street: str = Field(..., description="Street name")
    house_number: str = Field(..., description="House or building number")
    post_code: str = Field(..., description="Postal or ZIP code")
    city: str = Field(..., description="City name")
    country: Optional[str] = Field(None, description="Country name")
    coordinates: Optional[CoordinatesModel] = Field(
        None, description="Geographical coordinates"
    )

    class Config:
        from_attributes = True


class LocationBase(BaseModel):
    """Base model for location data"""

    name: str = Field(..., description="Name of the location")
    type: Optional[str] = Field(
        None, description="Type of location (business, park, etc.)"
    )
    description: Optional[str] = Field(None, description="Description of the location")
    address: Optional[AddressInfo] = None
    coordinates: Optional[CoordinatesModel] = None


class LocationCreate(LocationBase):
    """Schema for creating a new location"""

    pass


class LocationUpdate(BaseModel):
    """Schema for updating an existing location"""

    name: Optional[str] = Field(None, description="Name of the location")
    type: Optional[str] = Field(
        None, description="Type of location (business, park, etc.)"
    )
    description: Optional[str] = Field(None, description="Description of the location")
    address: Optional[AddressInfo] = Field(None, description="Address information")
    coordinates: Optional[CoordinatesModel] = Field(
        None, description="Geographical coordinates"
    )
    is_active: Optional[bool] = Field(
        None, description="Whether the location is active"
    )


class LocationResponse(LocationBase):
    """Schema for returning location data to clients"""

    id: int = Field(..., description="Unique identifier for the location")
    is_active: bool = Field(True, description="Whether the location is active")
    created_at: Optional[datetime] = Field(
        None, description="When the location was created"
    )
    updated_at: Optional[datetime] = Field(
        None, description="When the location was last updated"
    )

    # Compatibility method for both Pydantic v1 and v2
    @classmethod
    def from_orm(cls, obj):
        """
        Creates a model from an ORM object or dict.
        Compatible with both Pydantic v1 and v2.
        """
        if hasattr(cls, "model_validate"):
            # Pydantic v2
            return cls.model_validate(obj)
        else:
            # Pydantic v1
            return cls.parse_obj(obj)

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "name": "IKEA Gothenburg",
                "type": "shopping",
                "description": "IKEA furniture store in Gothenburg",
                "address": {
                    "street": "IKEA Street",
                    "house_number": "1",
                    "post_code": "12345",
                    "city": "Gothenburg",
                    "country": "Sweden",
                },
                "coordinates": {"latitude": 57.7089, "longitude": 11.9746},
                "is_active": True,
                "created_at": "2023-01-01T12:00:00",
                "updated_at": "2023-02-15T14:30:00",
            }
        }


class LocationListResponse(BaseModel):
    """Schema for returning a list of locations with pagination info"""

    items: List[LocationResponse]
    total: int
    page: int
    size: int
    pages: int

    class Config:
        schema_extra = {
            "example": {
                "items": [
                    {
                        "id": 1,
                        "name": "IKEA Gothenburg",
                        "type": "shopping",
                        "description": "IKEA furniture store in Gothenburg",
                        "address": {
                            "street": "IKEA Street",
                            "house_number": "1",
                            "post_code": "12345",
                            "city": "Gothenburg",
                            "country": "Sweden",
                        },
                        "coordinates": {"latitude": 57.7089, "longitude": 11.9746},
                        "is_active": True,
                        "created_at": "2023-01-01T12:00:00",
                        "updated_at": "2023-02-15T14:30:00",
                    }
                ],
                "total": 15,
                "page": 1,
                "size": 10,
                "pages": 2,
            }
        }


class HubBase(LocationBase):
    """Base model for hub data, extending location base"""

    is_active: bool = Field(True, description="Whether the hub is active")


class HubCreate(HubBase):
    """Schema for creating a new hub"""

    pass


class HubUpdate(BaseModel):
    """Schema for updating an existing hub"""

    name: Optional[str] = Field(None, description="Name of the hub")
    type: Optional[str] = Field(None, description="Type of hub")
    description: Optional[str] = Field(None, description="Description of the hub")
    address: Optional[AddressInfo] = Field(None, description="Address information")
    coordinates: Optional[CoordinatesModel] = Field(
        None, description="Geographical coordinates"
    )
    is_active: Optional[bool] = Field(None, description="Whether the hub is active")


class HubResponse(HubBase):
    """Schema for returning hub data to clients"""

    id: int = Field(..., description="Unique identifier for the hub")
    created_at: Optional[datetime] = Field(None, description="When the hub was created")
    updated_at: Optional[datetime] = Field(
        None, description="When the hub was last updated"
    )

    # Compatibility method for both Pydantic v1 and v2
    @classmethod
    def from_orm(cls, obj):
        """
        Creates a model from an ORM object or dict.
        Compatible with both Pydantic v1 and v2.
        """
        if hasattr(cls, "model_validate"):
            # Pydantic v2
            return cls.model_validate(obj)
        else:
            # Pydantic v1
            return cls.parse_obj(obj)

    class Config:
        from_attributes = True
        schema_extra = {
            "example": {
                "id": 1,
                "name": "Central Hub",
                "type": "transport",
                "description": "Main transportation hub in the city center",
                "address": {
                    "street": "Main Street",
                    "house_number": "100",
                    "post_code": "12345",
                    "city": "Gothenburg",
                    "country": "Sweden",
                },
                "coordinates": {"latitude": 57.7089, "longitude": 11.9746},
                "is_active": True,
                "created_at": "2023-01-01T12:00:00",
                "updated_at": "2023-02-15T14:30:00",
            }
        }
