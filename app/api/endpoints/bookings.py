from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.booking import BookingCreate, BookingResponse, PaymentCreate, PaymentResponse
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
    return booking_service.get_user_bookings(current_user.id)

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking: BookingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new booking for the current user"""
    try:
        booking_service = BookingService(db)
        return await booking_service.create_booking(current_user.id, booking)
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
    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process payment for this booking"
        )
    
    try:
        # Process the payment
        result = await booking_service.process_payment(booking_id, payment)
        return result
    except Exception as e:
        logger.error(f"Error processing payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing payment: {str(e)}"
        )
