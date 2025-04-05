from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Address schema
class AddressInfo(BaseModel):
    street: str
    house_number: str
    post_code: str
    city: str
    country: Optional[str] = None
    coordinates: Optional[str] = None
    
    class Config:
        from_attributes = True  # Formerly orm_mode = True

# Hub schemas
class HubInfo(BaseModel):
    id: int
    name: str
    address: Optional[AddressInfo] = None
    is_active: bool = True
    coordinates: Optional[str] = None
    
    class Config:
        from_attributes = True  # Formerly orm_mode = True

# Location schemas
class LocationInfo(BaseModel):
    id: int
    name: str
    address: Optional[AddressInfo] = None
    coordinates: Optional[str] = None
    
    class Config:
        from_attributes = True

# User schemas for passengers
class PassengerInfo(BaseModel):
    id: int
    user_id: str
    first_name: str
    last_name: str
    email: str
    
    class Config:
        from_attributes = True

# Booking schema
class BookingInfo(BaseModel):
    id: int
    user_id: int
    passenger_count: int
    price: float
    booking_time: datetime
    passenger: Optional[PassengerInfo] = None
    
    class Config:
        from_attributes = True

# Extended ride response with details
class RideDetailedResponse(BaseModel):
    id: int
    starting_hub_id: int
    destination_id: int
    departure_time: datetime
    arrival_time: Optional[datetime] = None
    status: str
    vehicle_type: str
    capacity: int
    available_seats: int
    driver_id: Optional[int] = None
    
    # Additional detailed information
    starting_hub: Optional[HubInfo] = None
    destination: Optional[LocationInfo] = None
    bookings: Optional[List[BookingInfo]] = None
    total_passengers: Optional[int] = None
    
    class Config:
        from_attributes = True

# Keep the original simple response for backward compatibility
class RideResponse(BaseModel):
    id: int
    starting_hub_id: int
    destination_id: int
    departure_time: datetime
    arrival_time: Optional[datetime] = None
    status: str
    vehicle_type: str
    capacity: int
    available_seats: int
    driver_id: Optional[int] = None
    
    class Config:
        from_attributes = True  # Updated from orm_mode = True

# Original booking response
class RideBookingResponse(BaseModel):
    id: int
    user_id: int
    ride_id: int
    passenger_count: int
    status: str
    price: float
    booking_time: datetime
    
    class Config:
        from_attributes = True  # Updated from orm_mode = True

# Create ride schema
class RideCreate(BaseModel):
    starting_hub_id: int
    destination_id: int
    departure_time: datetime
    vehicle_type: str
    capacity: int = Field(gt=0)
    driver_id: Optional[int] = None
    status: str = "scheduled"
