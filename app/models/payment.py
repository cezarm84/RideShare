from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("ride_bookings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    status = Column(String, default="completed")
    transaction_id = Column(String, nullable=False)
    payment_time = Column(DateTime, default=func.now())