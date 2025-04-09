from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.booking import BookingCreate, BookingResponse, PaymentCreate, PaymentResponse, BookingPassengerResponse
from app.services.booking_service import BookingService
from app.models.user import User
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[BookingResponse])
async def get_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all bookings for the current user"""
    booking_service = BookingService(db)
    db_bookings = booking_service.get_user_bookings(current_user.id)

    # Convert the model instances to BookingResponse objects
    result = []
    for booking in db_bookings:
        # Convert passengers to response objects
        passengers = []
        if hasattr(booking, 'passengers') and booking.passengers:
            for passenger in booking.passengers:
                # Get user details if available
                user_details = None
                if passenger.user:
                    user_details = {
                        "id": passenger.user.id,
                        "email": passenger.user.email,
                        "name": f"{passenger.user.first_name} {passenger.user.last_name}".strip(),
                        "phone": passenger.user.phone_number
                    }

                passengers.append(BookingPassengerResponse(
                    id=passenger.id,
                    booking_id=passenger.booking_id,
                    user_id=passenger.user_id,
                    email=passenger.email,
                    name=passenger.name,
                    phone=passenger.phone,
                    is_primary=passenger.is_primary,
                    created_at=passenger.created_at,
                    user_details=user_details
                ))

        # Create booking response
        result.append(BookingResponse(
            id=booking.id,
            passenger_id=booking.passenger_id,
            ride_id=booking.ride_id,
            seats_booked=booking.seats_booked,
            booking_status=booking.booking_status,
            created_at=booking.created_at,
            passengers=passengers
        ))

    return result

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking for the current user"""
    try:
        booking_service = BookingService(db)
        db_booking = await booking_service.create_booking(current_user.id, booking)

        # Convert passengers to response objects
        passengers = []
        if hasattr(db_booking, 'passengers') and db_booking.passengers:
            for passenger in db_booking.passengers:
                # Get user details if available
                user_details = None
                if passenger.user:
                    user_details = {
                        "id": passenger.user.id,
                        "email": passenger.user.email,
                        "name": f"{passenger.user.first_name} {passenger.user.last_name}".strip(),
                        "phone": passenger.user.phone_number
                    }

                passengers.append(BookingPassengerResponse(
                    id=passenger.id,
                    booking_id=passenger.booking_id,
                    user_id=passenger.user_id,
                    email=passenger.email,
                    name=passenger.name,
                    phone=passenger.phone,
                    is_primary=passenger.is_primary,
                    created_at=passenger.created_at,
                    user_details=user_details
                ))

        # Create booking response
        return BookingResponse(
            id=db_booking.id,
            passenger_id=db_booking.passenger_id,
            ride_id=db_booking.ride_id,
            seats_booked=db_booking.seats_booked,
            booking_status=db_booking.booking_status,
            created_at=db_booking.created_at,
            passengers=passengers
        )
    except HTTPException as e:
        # Pass through HTTP exceptions
        raise e
    except Exception as e:
        # Log any other errors
        logger.error(f"Error creating booking: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating booking: {str(e)}"
        )

@router.post("/{booking_id}/payment", response_model=PaymentResponse, status_code=status.HTTP_200_OK)
async def process_payment(
    booking_id: int,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process payment for a booking"""
    booking_service = BookingService(db)

    # Get booking to verify it belongs to the current user
    booking = booking_service.get_booking_by_id(booking_id)

    # Verify booking belongs to current user
    if booking.passenger_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process payment for this booking"
        )

    try:
        # Process the payment
        db_payment = await booking_service.process_payment(booking_id, payment)

        # Convert the model to a PaymentResponse object
        return PaymentResponse(
            id=db_payment.id,
            booking_id=db_payment.booking_id,
            user_id=db_payment.user_id,
            amount=db_payment.amount,
            payment_method=db_payment.payment_method,
            transaction_id=db_payment.transaction_id,
            status=db_payment.status,
            payment_time=db_payment.created_at if hasattr(db_payment, 'created_at') else None
        )
    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing payment: {str(e)}"
        )
