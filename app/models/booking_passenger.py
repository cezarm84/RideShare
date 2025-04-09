from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime

from app.db.base_class import Base

class BookingPassenger(Base):
    """Model for passengers associated with a booking"""
    
    __tablename__ = "booking_passengers"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("ride_bookings.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id"))
    email = Column(String, nullable=True)  # For non-registered passengers
    name = Column(String, nullable=True)   # For non-registered passengers
    phone = Column(String, nullable=True)  # For non-registered passengers
    is_primary = Column(Boolean, default=False)  # Primary passenger (booking owner)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    booking = relationship("RideBooking", back_populates="passengers")
    user = relationship("User", foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<BookingPassenger(id={self.id}, booking_id={self.booking_id}, user_id={self.user_id})>"
