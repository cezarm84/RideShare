from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException
from app.models.ride import Ride, RideBooking
from app.models.payment import Payment
from app.schemas.booking import BookingCreate, PaymentCreate
from app.services.notification_service import NotificationService

class BookingService:
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)

    def get_user_bookings(self, user_id: int) -> list[RideBooking]:
        return self.db.query(RideBooking).filter(RideBooking.user_id == user_id).all()
        
    def get_booking_by_id(self, booking_id: int) -> RideBooking:
        """Get a booking by its ID"""
        booking = self.db.query(RideBooking).filter(RideBooking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail=f"Booking with ID {booking_id} not found")
        return booking

    async def create_booking(self, user_id: int, booking: BookingCreate) -> RideBooking:
        # Check if ride exists
        ride = self.db.query(Ride).filter(Ride.id == booking.ride_id).first()
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")
            
        # Check if there are enough seats
        if ride.available_seats < booking.passenger_count:
            raise HTTPException(status_code=400, detail="Not enough available seats")
            
        # Create booking
        db_booking = RideBooking(
            user_id=user_id,
            ride_id=booking.ride_id,
            passenger_count=booking.passenger_count,
            price=booking.passenger_count * 50.0,  # Placeholder price
            booking_time=datetime.utcnow()
        )
        
        # Update available seats
        ride.available_seats -= booking.passenger_count
        
        self.db.add(db_booking)
        self.db.commit()
        self.db.refresh(db_booking)
        
        # Send confirmation notification
        await self.notification_service.notify_ride_confirmation(db_booking.id)
        return db_booking

    async def process_payment(self, booking_id: int, payment: PaymentCreate) -> Payment:
        """Process payment for a booking
        
        Args:
            booking_id: ID of the booking to process payment for
            payment: Payment information
            
        Returns:
            The created payment record
        """
        booking = self.get_booking_by_id(booking_id)
        
        # Create payment record
        db_payment = Payment(
            booking_id=booking_id,
            user_id=booking.user_id,
            amount=booking.price,
            payment_method=payment.payment_method,
            transaction_id=f"txn_{booking_id}_{int(datetime.utcnow().timestamp())}",
            status="completed"  # Assuming payment is successful for simplicity
        )
        self.db.add(db_payment)
        self.db.commit()
        self.db.refresh(db_payment)
        
        # Notify payment success
        await self.notification_service.notify_custom_message(
            booking.user_id, 
            "Payment Successful", 
            f"Payment of {booking.price} SEK for booking {booking_id} completed."
        )
        return db_payment
