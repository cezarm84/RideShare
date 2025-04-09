from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone
from fastapi import HTTPException
from typing import List, Optional, Dict, Any
import json
import logging

from app.models.payment import Payment
from app.models.payment_method import PaymentMethod, PaymentProvider, PaymentMethodType
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate
from app.schemas.booking import PaymentCreate

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_payment_methods(self, user_id: int) -> List[PaymentMethod]:
        """Get all payment methods for a user"""
        return self.db.query(PaymentMethod).filter(PaymentMethod.user_id == user_id).all()
    
    def get_payment_method_by_id(self, payment_method_id: int) -> PaymentMethod:
        """Get a payment method by ID"""
        payment_method = self.db.query(PaymentMethod).filter(PaymentMethod.id == payment_method_id).first()
        if not payment_method:
            raise HTTPException(status_code=404, detail=f"Payment method with ID {payment_method_id} not found")
        return payment_method
    
    def create_payment_method(self, user_id: int, payment_method: PaymentMethodCreate) -> PaymentMethod:
        """Create a new payment method for a user"""
        # Check if this should be the default method
        is_default = payment_method.is_default
        
        # If setting as default, unset any existing default
        if is_default:
            self._unset_default_payment_methods(user_id)
        
        # Create payment method
        db_payment_method = PaymentMethod(
            user_id=user_id,
            method_type=payment_method.method_type,
            provider=payment_method.provider,
            account_number=payment_method.account_number,
            expiry_date=payment_method.expiry_date,
            card_holder_name=payment_method.card_holder_name,
            billing_address=payment_method.billing_address,
            is_default=is_default,
            is_verified=False,  # New methods start as unverified
            created_at=datetime.now(timezone.utc)
        )
        
        self.db.add(db_payment_method)
        self.db.commit()
        self.db.refresh(db_payment_method)
        return db_payment_method
    
    def update_payment_method(self, payment_method_id: int, payment_method_update: PaymentMethodUpdate) -> PaymentMethod:
        """Update a payment method"""
        db_payment_method = self.get_payment_method_by_id(payment_method_id)
        
        # Update fields if provided
        if payment_method_update.is_default is not None:
            # If setting as default, unset any existing default
            if payment_method_update.is_default:
                self._unset_default_payment_methods(db_payment_method.user_id)
            db_payment_method.is_default = payment_method_update.is_default
        
        if payment_method_update.expiry_date is not None:
            db_payment_method.expiry_date = payment_method_update.expiry_date
        
        if payment_method_update.card_holder_name is not None:
            db_payment_method.card_holder_name = payment_method_update.card_holder_name
        
        if payment_method_update.billing_address is not None:
            db_payment_method.billing_address = payment_method_update.billing_address
        
        db_payment_method.updated_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(db_payment_method)
        return db_payment_method
    
    def delete_payment_method(self, payment_method_id: int) -> None:
        """Delete a payment method"""
        db_payment_method = self.get_payment_method_by_id(payment_method_id)
        self.db.delete(db_payment_method)
        self.db.commit()
    
    def set_default_payment_method(self, user_id: int, payment_method_id: int) -> PaymentMethod:
        """Set a payment method as the default for a user"""
        # Unset any existing default
        self._unset_default_payment_methods(user_id)
        
        # Set the new default
        db_payment_method = self.get_payment_method_by_id(payment_method_id)
        db_payment_method.is_default = True
        db_payment_method.updated_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(db_payment_method)
        return db_payment_method
    
    def _unset_default_payment_methods(self, user_id: int) -> None:
        """Unset any existing default payment methods for a user"""
        default_methods = self.db.query(PaymentMethod).filter(
            PaymentMethod.user_id == user_id,
            PaymentMethod.is_default == True
        ).all()
        
        for method in default_methods:
            method.is_default = False
            method.updated_at = datetime.now(timezone.utc)
        
        self.db.commit()
    
    def process_payment(self, user_id: int, booking_id: int, payment_data: PaymentCreate) -> Payment:
        """Process a payment for a booking"""
        # Check if using saved payment method
        saved_method = None
        if payment_data.payment_method_id:
            saved_method = self.get_payment_method_by_id(payment_data.payment_method_id)
            
            # Verify payment method belongs to user
            if saved_method.user_id != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Not authorized to use this payment method"
                )
        
        # Determine payment provider and type
        payment_provider = payment_data.payment_provider
        payment_type = None
        
        if saved_method:
            # Use saved method details
            payment_provider = saved_method.provider
            payment_type = saved_method.method_type
        else:
            # Determine provider and type from payment method
            if payment_data.payment_method == 'credit_card' or payment_data.payment_method == 'debit_card':
                payment_type = payment_data.payment_method
                payment_provider = 'stripe'  # Default to Stripe for cards
            elif payment_data.payment_method == 'paypal':
                payment_type = 'digital_wallet'
                payment_provider = 'paypal'
            elif payment_data.payment_method == 'swish':
                payment_type = 'mobile_payment'
                payment_provider = 'swish'
            elif payment_data.payment_method == 'apple_pay':
                payment_type = 'digital_wallet'
                payment_provider = 'apple_pay'
            elif payment_data.payment_method == 'google_pay':
                payment_type = 'digital_wallet'
                payment_provider = 'google_pay'
            elif payment_data.payment_method == 'klarna':
                payment_type = 'invoice'
                payment_provider = 'klarna'
            elif payment_data.payment_method == 'bank_transfer':
                payment_type = 'bank_account'
                payment_provider = 'bank_transfer'
        
        # Create payment details JSON
        payment_details = {}
        
        # Add relevant details based on payment method
        if payment_data.payment_method == 'credit_card' or payment_data.payment_method == 'debit_card':
            if payment_data.card_number:
                # Only store last 4 digits for security
                payment_details['last4'] = payment_data.card_number[-4:] if len(payment_data.card_number) >= 4 else payment_data.card_number
            if payment_data.expiry_date:
                payment_details['expiry'] = payment_data.expiry_date
            if payment_data.card_holder_name:
                payment_details['card_holder'] = payment_data.card_holder_name
        elif payment_data.payment_method == 'paypal':
            if payment_data.email:
                payment_details['email'] = payment_data.email
        elif payment_data.payment_method == 'swish':
            if payment_data.phone_number:
                payment_details['phone'] = payment_data.phone_number
        
        # Create payment record
        payment = Payment(
            user_id=user_id,
            booking_id=booking_id,
            payment_method_id=payment_data.payment_method_id if payment_data.payment_method_id else None,
            amount=50.0,  # Placeholder - should be calculated based on booking
            currency="SEK",
            status="completed",  # Assuming payment is successful for demo
            payment_method=payment_data.payment_method,
            payment_provider=payment_provider,
            payment_type=payment_type,
            transaction_id=f"txn_{booking_id}_{int(datetime.now(timezone.utc).timestamp())}",
            payment_time=datetime.now(timezone.utc),
            payment_details=payment_details,
            created_at=datetime.now(timezone.utc)
        )
        
        self.db.add(payment)
        
        # Save payment method if requested
        if payment_data.save_payment_method and not payment_data.payment_method_id:
            # Create a new payment method
            new_method = PaymentMethodCreate(
                method_type=payment_type or payment_data.payment_method,
                provider=payment_provider,
                is_default=payment_data.make_default,
                account_number=payment_details.get('last4'),
                expiry_date=payment_data.expiry_date,
                card_holder_name=payment_data.card_holder_name
            )
            
            try:
                self.create_payment_method(user_id, new_method)
            except Exception as e:
                logger.error(f"Error saving payment method: {e}")
                # Continue with payment even if saving method fails
        
        # Update saved method's last_used_at if using saved method
        if saved_method:
            saved_method.last_used_at = datetime.now(timezone.utc)
        
        self.db.commit()
        self.db.refresh(payment)
        
        return payment
