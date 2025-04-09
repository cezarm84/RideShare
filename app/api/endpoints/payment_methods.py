from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodResponse, PaymentMethodUpdate
from app.services.payment_service import PaymentService
from app.models.user import User
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[PaymentMethodResponse])
async def get_payment_methods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all payment methods for the current user"""
    payment_service = PaymentService(db)
    db_payment_methods = payment_service.get_user_payment_methods(current_user.id)

    # Convert SQLAlchemy models to dicts manually
    response_list = []
    for method in db_payment_methods:
        response_dict = {
            "id": method.id,
            "user_id": method.user_id,
            "method_type": method.method_type,
            "provider": method.provider,
            "account_number": method.account_number,
            "expiry_date": method.expiry_date,
            "card_holder_name": method.card_holder_name,
            "is_default": method.is_default,
            "is_verified": method.is_verified,
            "created_at": method.created_at,
            "last_used_at": method.last_used_at
        }
        response_list.append(response_dict)

    return response_list

@router.post("", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_method(
    payment_method: PaymentMethodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new payment method for the current user"""
    try:
        payment_service = PaymentService(db)
        db_payment_method = payment_service.create_payment_method(current_user.id, payment_method)

        # Debug: Convert SQLAlchemy model to dict manually
        response_dict = {
            "id": db_payment_method.id,
            "user_id": db_payment_method.user_id,
            "method_type": db_payment_method.method_type,
            "provider": db_payment_method.provider,
            "account_number": db_payment_method.account_number,
            "expiry_date": db_payment_method.expiry_date,
            "card_holder_name": db_payment_method.card_holder_name,
            "is_default": db_payment_method.is_default,
            "is_verified": db_payment_method.is_verified,
            "created_at": db_payment_method.created_at
        }

        logger.info(f"Created payment method: {response_dict}")
        return response_dict
    except Exception as e:
        logger.error(f"Error creating payment method: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating payment method: {str(e)}"
        )

@router.get("/{payment_method_id}", response_model=PaymentMethodResponse)
async def get_payment_method(
    payment_method_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific payment method by ID"""
    payment_service = PaymentService(db)
    method = payment_service.get_payment_method_by_id(payment_method_id)

    # Verify payment method belongs to current user
    if method.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this payment method"
        )

    # Convert SQLAlchemy model to dict manually
    response_dict = {
        "id": method.id,
        "user_id": method.user_id,
        "method_type": method.method_type,
        "provider": method.provider,
        "account_number": method.account_number,
        "expiry_date": method.expiry_date,
        "card_holder_name": method.card_holder_name,
        "is_default": method.is_default,
        "is_verified": method.is_verified,
        "created_at": method.created_at,
        "last_used_at": method.last_used_at
    }

    return response_dict

@router.put("/{payment_method_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    payment_method_id: int,
    payment_method_update: PaymentMethodUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a payment method"""
    try:
        payment_service = PaymentService(db)

        # Get existing payment method
        existing_method = payment_service.get_payment_method_by_id(payment_method_id)

        # Verify payment method belongs to current user
        if existing_method.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this payment method"
            )

        # Update payment method
        method = payment_service.update_payment_method(payment_method_id, payment_method_update)

        # Convert SQLAlchemy model to dict manually
        response_dict = {
            "id": method.id,
            "user_id": method.user_id,
            "method_type": method.method_type,
            "provider": method.provider,
            "account_number": method.account_number,
            "expiry_date": method.expiry_date,
            "card_holder_name": method.card_holder_name,
            "is_default": method.is_default,
            "is_verified": method.is_verified,
            "created_at": method.created_at,
            "last_used_at": method.last_used_at
        }

        return response_dict
    except HTTPException as e:
        # Pass through HTTP exceptions
        raise e
    except Exception as e:
        logger.error(f"Error updating payment method: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating payment method: {str(e)}"
        )

@router.delete("/{payment_method_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_method(
    payment_method_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a payment method"""
    try:
        payment_service = PaymentService(db)

        # Get existing payment method
        existing_method = payment_service.get_payment_method_by_id(payment_method_id)

        # Verify payment method belongs to current user
        if existing_method.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this payment method"
            )

        # Delete payment method
        payment_service.delete_payment_method(payment_method_id)
    except HTTPException as e:
        # Pass through HTTP exceptions
        raise e
    except Exception as e:
        logger.error(f"Error deleting payment method: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting payment method: {str(e)}"
        )

@router.post("/{payment_method_id}/set-default", response_model=PaymentMethodResponse)
async def set_default_payment_method(
    payment_method_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set a payment method as the default"""
    try:
        payment_service = PaymentService(db)

        # Get existing payment method
        existing_method = payment_service.get_payment_method_by_id(payment_method_id)

        # Verify payment method belongs to current user
        if existing_method.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this payment method"
            )

        # Set as default
        method = payment_service.set_default_payment_method(current_user.id, payment_method_id)

        # Convert SQLAlchemy model to dict manually
        response_dict = {
            "id": method.id,
            "user_id": method.user_id,
            "method_type": method.method_type,
            "provider": method.provider,
            "account_number": method.account_number,
            "expiry_date": method.expiry_date,
            "card_holder_name": method.card_holder_name,
            "is_default": method.is_default,
            "is_verified": method.is_verified,
            "created_at": method.created_at,
            "last_used_at": method.last_used_at
        }

        return response_dict
    except HTTPException as e:
        # Pass through HTTP exceptions
        raise e
    except Exception as e:
        logger.error(f"Error setting default payment method: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error setting default payment method: {str(e)}"
        )
