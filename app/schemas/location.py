from pydantic import BaseModel
from typing import Optional

class CoordinatesModel(BaseModel):
    """Model for geographic coordinates"""
    latitude: float
    longitude: float
    
    class Config:
        from_attributes = True


class AddressInfo(BaseModel):
    street: str
    house_number: str
    post_code: str
    city: str
    country: Optional[str] = None
    coordinates: Optional[CoordinatesModel] = None
    
    class Config:
        from_attributes = True


class LocationBase(BaseModel):
    name: str
    address: Optional[AddressInfo] = None
    coordinates: Optional[CoordinatesModel] = None


class LocationCreate(LocationBase):
    pass


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[AddressInfo] = None
    coordinates: Optional[CoordinatesModel] = None


class LocationResponse(LocationBase):
    id: int
    
    class Config:
        from_attributes = True


class HubBase(LocationBase):
    is_active: bool = True


class HubCreate(HubBase):
    pass


class HubUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[AddressInfo] = None
    coordinates: Optional[CoordinatesModel] = None
    is_active: Optional[bool] = None


class HubResponse(HubBase):
    id: int
    
    class Config:
        from_attributes = True
