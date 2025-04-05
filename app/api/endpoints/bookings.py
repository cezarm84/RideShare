from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.booking import BookingCreate, BookingResponse, PaymentProcess, PaymentResponse
from app.services.booking_service import BookingService
from app.models.user import User

router = APIRouter()

@router.get("", response_model=List[BookingResponse])
async def get_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking_service = BookingService(db)
    return booking_service.get_user_bookings(current_user.id)

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking_service = BookingService(db)
    result = await booking_service.create_booking(current_user.id, booking)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to create booking")
    return result

@router.post("/{booking_id}/payment", response_model=PaymentResponse)
async def process_payment(
    booking_id: int,
    payment: PaymentProcess,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking_service = BookingService(db)
    result = booking_service.process_payment(booking_id, current_user.id, payment)
    if not result:
        raise HTTPException(status_code=400, detail="Payment failed")
    return result
