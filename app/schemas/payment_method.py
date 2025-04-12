from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, validator

from app.models.payment_method import PaymentMethodType, PaymentProvider


class PaymentMethodBase(BaseModel):
    """Base schema for payment method data"""

    method_type: str = Field(
        ...,
        description="Type of payment method (e.g., 'credit_card', 'mobile_payment')",
    )
    provider: str = Field(
        ..., description="Payment provider (e.g., 'stripe', 'swish', 'paypal')"
    )
    is_default: bool = Field(
        False, description="Whether this is the default payment method"
    )


class PaymentMethodCreate(PaymentMethodBase):
    """Schema for creating a new payment method"""

    account_number: Optional[str] = Field(
        None, description="Last 4 digits for cards, masked account for bank accounts"
    )
    expiry_date: Optional[str] = Field(
        None, description="Expiry date for cards (MM/YY)"
    )
    card_holder_name: Optional[str] = Field(
        None, description="Card holder name for cards"
    )
    billing_address: Optional[str] = Field(None, description="Billing address")

    # Additional fields for specific payment methods
    # Credit Card
    card_token: Optional[str] = Field(
        None, description="Token from payment processor for credit cards"
    )

    # Swish
    phone_number: Optional[str] = Field(
        None, description="Phone number for Swish payments"
    )

    # PayPal
    paypal_email: Optional[str] = Field(None, description="Email for PayPal account")

    @validator("method_type")
    def validate_method_type(cls, v):
        valid_types = [t.value for t in PaymentMethodType]
        if v not in valid_types:
            raise ValueError(
                f"Invalid method type. Must be one of: {', '.join(valid_types)}"
            )
        return v

    @validator("provider")
    def validate_provider(cls, v):
        valid_providers = [p.value for p in PaymentProvider]
        if v not in valid_providers:
            raise ValueError(
                f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
            )
        return v

    @validator("expiry_date")
    def validate_expiry_date(cls, v, values):
        if (
            v is not None
            and values.get("method_type") == PaymentMethodType.CREDIT_CARD.value
        ):
            # Check format MM/YY
            if not (
                len(v) == 5 and v[2] == "/" and v[:2].isdigit() and v[3:].isdigit()
            ):
                raise ValueError("Expiry date must be in format MM/YY")

            # Check if month is valid
            month = int(v[:2])
            if month < 1 or month > 12:
                raise ValueError("Month must be between 01 and 12")

            # Check if not expired
            year = int("20" + v[3:])
            month = int(v[:2])
            current_year = datetime.now().year
            current_month = datetime.now().month

            if year < current_year or (year == current_year and month < current_month):
                raise ValueError("Card is expired")

        return v


class PaymentMethodResponse(BaseModel):
    """Schema for payment method response"""

    id: int
    user_id: int
    method_type: str
    provider: str
    is_default: bool
    account_number: Optional[str] = None
    expiry_date: Optional[str] = None
    card_holder_name: Optional[str] = None
    is_verified: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime


class PaymentMethodUpdate(BaseModel):
    """Schema for updating a payment method"""

    is_default: Optional[bool] = None
    expiry_date: Optional[str] = None
    card_holder_name: Optional[str] = None
    billing_address: Optional[str] = None
