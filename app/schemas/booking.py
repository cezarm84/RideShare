from pydantic import BaseModel, Field
from typing import Dict
from datetime import datetime

class BookingCreate(BaseModel):
    ride_id: int
    passenger_count: int = Field(1, ge=1, le=10)

class PaymentProcess(BaseModel):
    payment_method: str
    payment_details: Dict

class BookingResponse(BaseModel):
    id: int
    ride_id: int
    status: str
    passenger_count: int
    price: float
    booking_time: datetime
    class Config:
        orm_mode = True

class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    amount: float
    status: str
    transaction_id: str
    payment_time: datetime
    class Config:
        orm_mode = True