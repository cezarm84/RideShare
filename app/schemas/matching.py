from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MatchRequest(BaseModel):
    destination_id: int
    departure_time: datetime
    time_flexibility: int = Field(30, ge=0, le=120)
    max_results: int = Field(5, ge=1, le=20)

class MatchResponse(BaseModel):
    ride_id: int
    departure_time: datetime
    arrival_time: Optional[datetime]
    hub_id: int
    hub_name: str
    vehicle_type: str
    available_seats: int
    total_capacity: int
    overall_score: float
    class Config:
        orm_mode = True
