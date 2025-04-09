from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
import datetime
import enum

# Import Base directly from base_class.py instead of base.py
from app.db.base_class import Base
from app.models.payment_method import PaymentProvider, PaymentMethodType

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

# Legacy enum - kept for backward compatibility
class PaymentMethod(str, enum.Enum):
    CREDIT_CARD = "credit_card"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    SWISH = "swish"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    KLARNA = "klarna"

class Payment(Base):
    """Model for payment transactions"""

    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    booking_id = Column(Integer, ForeignKey("ride_bookings.id"), nullable=True)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=True)  # Link to saved payment method
    amount = Column(Float, nullable=False)
    currency = Column(String, default="SEK") # Changed to SEK for Swedish market
    status = Column(String, default=PaymentStatus.PENDING)
    payment_method = Column(String, default=PaymentMethod.CREDIT_CARD)  # Legacy field
    payment_provider = Column(String, nullable=True)  # New field for provider (Swish, PayPal, etc.)
    payment_type = Column(String, nullable=True)  # New field for type (credit card, mobile payment, etc.)
    transaction_id = Column(String, nullable=True)  # External payment processor ID
    payment_time = Column(DateTime, nullable=True)  # Time when payment was processed
    payment_details = Column(JSON, nullable=True)  # Additional payment details as JSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships - make sure these match exactly what's defined in related models
    user = relationship("User", back_populates="payments")

    # Ensure this matches exactly with RideBooking.payment relationship
    booking = relationship("RideBooking", back_populates="payment")

    # Relationship with payment method
    saved_method = relationship("PaymentMethod", foreign_keys=[payment_method_id])

    def __repr__(self):
        return f"<Payment(id={self.id}, user_id={self.user_id}, amount={self.amount}, status={self.status})>"
