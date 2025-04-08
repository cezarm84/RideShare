from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
import datetime
import enum

# Import Base directly from base_class.py instead of base.py
from app.db.base_class import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, enum.Enum):
    CREDIT_CARD = "credit_card"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"

class Payment(Base):
    """Model for payment transactions"""
    
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    booking_id = Column(Integer, ForeignKey("ride_bookings.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="SEK") # Changed to SEK for Swedish market
    status = Column(String, default=PaymentStatus.PENDING)
    payment_method = Column(String, default=PaymentMethod.CREDIT_CARD)
    transaction_id = Column(String, nullable=True)  # External payment processor ID
    payment_time = Column(DateTime, nullable=True)  # Time when payment was processed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships - make sure these match exactly what's defined in related models
    user = relationship("User", back_populates="payments")
    
    # Ensure this matches exactly with RideBooking.payment relationship
    booking = relationship("RideBooking", back_populates="payment")
    
    def __repr__(self):
        return f"<Payment(id={self.id}, user_id={self.user_id}, amount={self.amount}, status={self.status})>"
