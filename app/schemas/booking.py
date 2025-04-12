from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


# Schema for passenger information
class PassengerInfo(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None

    @validator("email")
    def validate_email(cls, v):
        if v is not None and "@" not in v:
            raise ValueError("Invalid email format")
        return v


# Schema for creating a new booking
class BookingCreate(BaseModel):
    ride_id: int
    passengers: List[PassengerInfo] = Field(
        ..., description="List of passengers for this booking"
    )
    matching_preferences: Optional[Dict[str, Any]] = Field(
        None, description="Preferences for ride matching"
    )

    # For backward compatibility
    passenger_count: Optional[int] = None

    @validator("passengers")
    def validate_passengers(cls, v):
        if not v:
            raise ValueError("At least one passenger is required")
        if len(v) > 10:
            raise ValueError("Cannot book for more than 10 passengers")
        return v

    @validator("passenger_count", always=True)
    def set_passenger_count(cls, v, values):
        # If passenger_count is not provided, set it to the number of passengers
        if v is None and "passengers" in values:
            return len(values["passengers"])
        return v


# Schema for creating/processing a payment
class PaymentCreate(BaseModel):
    payment_method: str = Field(
        ..., description="Payment method (e.g., 'credit_card', 'paypal', 'swish')"
    )
    payment_method_id: Optional[int] = Field(
        None, description="ID of saved payment method (if using saved method)"
    )
    payment_provider: Optional[str] = Field(
        None, description="Payment provider (e.g., 'stripe', 'paypal', 'swish')"
    )

    # Credit card fields
    card_number: Optional[str] = Field(
        None, description="Card number (for credit card payments)"
    )
    expiry_date: Optional[str] = Field(
        None, description="Expiry date in MM/YY format (for credit card payments)"
    )
    cvv: Optional[str] = Field(None, description="CVV (for credit card payments)")
    card_holder_name: Optional[str] = Field(
        None, description="Card holder name (for credit card payments)"
    )

    # Mobile payment fields
    phone_number: Optional[str] = Field(
        None, description="Phone number (for Swish payments)"
    )

    # Digital wallet fields
    email: Optional[str] = Field(None, description="Email (for PayPal payments)")

    # Save payment method
    save_payment_method: bool = Field(
        False, description="Whether to save this payment method for future use"
    )
    make_default: bool = Field(
        False, description="Whether to make this the default payment method"
    )

    @validator("payment_method")
    def validate_payment_method(cls, v):
        valid_methods = [
            "credit_card",
            "debit_card",
            "paypal",
            "swish",
            "apple_pay",
            "google_pay",
            "klarna",
            "bank_transfer",
        ]
        if v not in valid_methods:
            raise ValueError(
                f"Invalid payment method. Must be one of: {', '.join(valid_methods)}"
            )
        return v


# Schema for passenger response
class BookingPassengerResponse(BaseModel):
    id: int
    booking_id: int
    user_id: Optional[int] = None
    email: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    is_primary: bool = False
    created_at: datetime

    # Include user details if available
    user_details: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


# Schema for response with booking details
class BookingResponse(BaseModel):
    id: int
    passenger_id: int
    ride_id: int
    seats_booked: int
    booking_status: str
    created_at: datetime
    passengers: Optional[List[BookingPassengerResponse]] = None
    matching_preferences: Optional[Dict[str, Any]] = None

    # For backward compatibility
    user_id: Optional[int] = None
    passenger_count: Optional[int] = None
    status: Optional[str] = None
    booking_time: Optional[datetime] = None
    price: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

    def __init__(self, **data):
        super().__init__(**data)
        # Set backward compatibility fields
        if self.user_id is None and hasattr(self, "passenger_id"):
            self.user_id = self.passenger_id
        if self.passenger_count is None and hasattr(self, "seats_booked"):
            self.passenger_count = self.seats_booked
        if self.status is None and hasattr(self, "booking_status"):
            self.status = self.booking_status
        if self.booking_time is None and hasattr(self, "created_at"):
            self.booking_time = self.created_at
        if self.price is None:
            self.price = self.seats_booked * 50.0  # Default price calculation


# Schema for payment response
class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    amount: float
    payment_method: str
    payment_provider: Optional[str] = None
    payment_type: Optional[str] = None
    transaction_id: str
    payment_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str
    payment_method_id: Optional[int] = None
    saved_method: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}
