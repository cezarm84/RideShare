from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class RideCreate(BaseModel):
    starting_hub_id: int
    destination_id: int
    departure_time: datetime
    vehicle_type: str
    capacity: int
    driver_id: Optional[int] = None

class RideResponse(BaseModel):
    id: int
    starting_hub_id: int
    destination_id: int
    departure_time: datetime
    arrival_time: Optional[datetime]
    status: str
    vehicle_type: str
    capacity: int
    available_seats: int
    driver_id: Optional[int]
    class Config:
        orm_mode = True

class RideBookingResponse(BaseModel):
    id: int
    user_id: int
    ride_id: int
    passenger_count: int
    status: str
    price: float
    booking_time: datetime
    class Config:
        orm_mode = True