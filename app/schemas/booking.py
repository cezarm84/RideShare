from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# Schema for creating a new booking
class BookingCreate(BaseModel):
    ride_id: int
    passenger_count: int = 1

# Schema for creating/processing a payment
class PaymentCreate(BaseModel):
    payment_method: str = Field(..., description="Payment method (e.g., 'credit_card', 'paypal')")
    card_number: Optional[str] = Field(None, description="Card number (if applicable)")
    expiry_date: Optional[str] = Field(None, description="Expiry date (if applicable)")
    cvv: Optional[str] = Field(None, description="CVV (if applicable)")

# Schema for response with booking details
class BookingResponse(BaseModel):
    id: int
    user_id: int
    ride_id: int
    passenger_count: int
    status: str
    price: float
    booking_time: datetime
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

# Schema for payment response
class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    amount: float
    payment_method: str
    transaction_id: str
    payment_time: datetime = Field(default_factory=datetime.utcnow)
    status: str
    
    class Config:
        from_attributes = True
