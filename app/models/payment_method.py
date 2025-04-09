from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
import datetime
import enum

from app.db.base_class import Base

class PaymentProvider(str, enum.Enum):
    """Enum for payment providers"""
    STRIPE = "stripe"
    PAYPAL = "paypal"
    SWISH = "swish"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"
    KLARNA = "klarna"
    BANK_TRANSFER = "bank_transfer"

class PaymentMethodType(str, enum.Enum):
    """Enum for payment method types"""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_ACCOUNT = "bank_account"
    DIGITAL_WALLET = "digital_wallet"
    MOBILE_PAYMENT = "mobile_payment"
    INVOICE = "invoice"

class PaymentMethod(Base):
    """Model for user payment methods"""
    
    __tablename__ = "payment_methods"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    method_type = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    account_number = Column(String, nullable=True)  # Last 4 digits for cards, masked account number for bank accounts
    expiry_date = Column(String, nullable=True)  # For cards
    card_holder_name = Column(String, nullable=True)  # For cards
    billing_address = Column(String, nullable=True)
    is_default = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    last_used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="payment_methods")
    
    def __repr__(self):
        return f"<PaymentMethod(id={self.id}, user_id={self.user_id}, type={self.method_type}, provider={self.provider})>"
