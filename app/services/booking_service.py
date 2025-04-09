from sqlalchemy.orm import Session
from datetime import datetime, timezone
from fastapi import HTTPException
from app.models.ride import Ride, RideBooking
from app.models.payment import Payment
from app.models.booking_passenger import BookingPassenger
from app.models.user import User
from app.schemas.booking import BookingCreate, PaymentCreate, PassengerInfo
from app.services.notification_service import NotificationService
from app.services.payment_service import PaymentService
import json

class BookingService:
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)

    def get_user_bookings(self, user_id: int) -> list[RideBooking]:
        # Get bookings where user is the main passenger
        main_bookings = self.db.query(RideBooking).filter(RideBooking.passenger_id == user_id).all()

        # Get bookings where user is listed as a passenger
        from sqlalchemy.orm import joinedload
        passenger_booking_ids = self.db.query(BookingPassenger.booking_id).filter(BookingPassenger.user_id == user_id).all()
        passenger_booking_ids = [id[0] for id in passenger_booking_ids]

        # Get those bookings with their passengers
        other_bookings = self.db.query(RideBooking).filter(RideBooking.id.in_(passenger_booking_ids)).all()

        # Combine and deduplicate
        all_bookings = {booking.id: booking for booking in main_bookings}
        for booking in other_bookings:
            if booking.id not in all_bookings:
                all_bookings[booking.id] = booking

        # Load passengers for all bookings
        for booking in all_bookings.values():
            booking.passengers = self.db.query(BookingPassenger).filter(BookingPassenger.booking_id == booking.id).all()

        return list(all_bookings.values())

    def get_booking_by_id(self, booking_id: int) -> RideBooking:
        """Get a booking by its ID with passenger information"""
        booking = self.db.query(RideBooking).filter(RideBooking.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail=f"Booking with ID {booking_id} not found")

        # Load passengers
        booking.passengers = self.db.query(BookingPassenger).filter(BookingPassenger.booking_id == booking_id).all()

        return booking

    async def create_booking(self, user_id: int, booking: BookingCreate) -> RideBooking:
        # Check if ride exists
        ride = self.db.query(Ride).filter(Ride.id == booking.ride_id).first()
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")

        # Check if there are enough seats
        passenger_count = len(booking.passengers)
        if ride.available_seats < passenger_count:
            raise HTTPException(status_code=400, detail="Not enough available seats")

        # Create booking
        db_booking = RideBooking(
            passenger_id=user_id,  # Main booker is still stored in passenger_id for backward compatibility
            ride_id=booking.ride_id,
            seats_booked=passenger_count,
            booking_status="confirmed",
            created_at=datetime.now(timezone.utc)
        )

        # Store matching preferences if provided
        if booking.matching_preferences:
            # We'll add a new column for this in a future migration
            # For now, we'll just log it
            print(f"Matching preferences: {booking.matching_preferences}")

        # Update available seats
        ride.available_seats -= passenger_count

        self.db.add(db_booking)
        self.db.commit()
        self.db.refresh(db_booking)

        # Create passenger records
        for i, passenger_info in enumerate(booking.passengers):
            # Determine if this is the primary passenger (booking owner)
            is_primary = (i == 0) or (passenger_info.user_id == user_id)

            # If user_id is provided, verify it exists
            passenger_user = None
            if passenger_info.user_id:
                passenger_user = self.db.query(User).filter(User.id == passenger_info.user_id).first()
                if not passenger_user:
                    # If user doesn't exist but we have email, use that instead
                    if passenger_info.email:
                        # Check if user exists with this email
                        passenger_user = self.db.query(User).filter(User.email == passenger_info.email).first()

            # Create passenger record
            db_passenger = BookingPassenger(
                booking_id=db_booking.id,
                user_id=passenger_user.id if passenger_user else None,
                email=passenger_info.email if not passenger_user and passenger_info.email else None,
                name=passenger_info.name if not passenger_user and passenger_info.name else None,
                phone=passenger_info.phone if not passenger_user and passenger_info.phone else None,
                is_primary=is_primary
            )

            self.db.add(db_passenger)

        self.db.commit()

        # Try to send confirmation notification, but don't fail if it doesn't work
        try:
            await self.notification_service.notify_ride_confirmation(db_booking.id)
        except Exception as e:
            # Log the error but don't fail the booking creation
            print(f"Error sending notification: {str(e)}")

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

        # Use the PaymentService to process the payment
        payment_service = PaymentService(self.db)
        db_payment = payment_service.process_payment(
            user_id=booking.passenger_id,
            booking_id=booking_id,
            payment_data=payment
        )

        # Notify payment success
        await self.notification_service.notify_custom_message(
            booking.passenger_id,
            "Payment Successful",
            f"Payment of {db_payment.amount} SEK for booking {booking_id} completed."
        )
        return db_payment
