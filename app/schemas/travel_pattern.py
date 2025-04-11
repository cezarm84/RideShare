from pydantic import BaseModel
from typing import Optional
from datetime import time, date

class TravelPatternBase(BaseModel):
    """Base model for travel patterns"""
    origin_type: str
    origin_id: Optional[int] = None
    origin_latitude: float
    origin_longitude: float
    destination_type: str
    destination_id: Optional[int] = None
    destination_latitude: float
    destination_longitude: float
    day_of_week: int
    departure_time: time
    frequency: int
    last_traveled: Optional[date] = None

class TravelPatternResponse(TravelPatternBase):
    """Response model for travel patterns"""
    id: int
    user_id: int
    origin_name: Optional[str] = None
    destination_name: Optional[str] = None
    
    class Config:
        from_attributes = True
