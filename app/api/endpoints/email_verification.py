"""
Email verification endpoints.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.services.email_service import email_service
from app.services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter()


class EmailVerificationRequest(BaseModel):
    """Request model for email verification."""

    email: EmailStr


class PasswordResetRequest(BaseModel):
    """Request model for password reset."""

    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Request model for password reset confirmation."""

    token: str
    new_password: str


class TokenVerifyRequest(BaseModel):
    """Request model for token verification."""

    token: str


class VerificationResponse(BaseModel):
    """Response model for verification endpoints."""

    message: str
    success: bool


@router.post("/request-verification", response_model=VerificationResponse)
async def request_verification_email(
    request: EmailVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Request a verification email to be sent to the user's email address.
    """
    try:
        # Get user by email
        user_service = UserService(db)
        user = user_service.get_by_email(request.email)

        if not user:
            # Don't reveal that the user doesn't exist
            return {
                "message": "If your email is registered, a verification link has been sent.",
                "success": True,
            }

        if user.is_verified:
            return {"message": "Your email is already verified.", "success": True}

        # Generate verification token
        token = email_service.generate_verification_token()

        # Set token expiration (48 hours by default)
        expires = datetime.now(timezone.utc) + timedelta(
            hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
        )

        # Update user with verification token
        user.verification_token = token
        user.verification_token_expires = expires
        db.commit()

        # Send verification email in background
        background_tasks.add_task(email_service.send_verification_email, user, token)

        return {
            "message": "Verification email sent. Please check your inbox.",
            "success": True,
        }
    except Exception as e:
        logger.error(f"Error sending verification email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error sending verification email",
        )


@router.post("/verify", response_model=VerificationResponse)
async def verify_email(
    request: TokenVerifyRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Verify a user's email using the token sent to their email.
    """
    try:
        # Find user with this verification token
        user = db.query(User).filter(User.verification_token == request.token).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token",
            )

        # Check if token is expired
        if (
            not user.verification_token_expires
            or user.verification_token_expires < datetime.now(timezone.utc)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired",
            )

        # Mark user as verified
        user.is_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        db.commit()

        return {
            "message": "Email verified successfully. You can now log in.",
            "success": True,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying email",
        )


@router.post("/request-password-reset", response_model=VerificationResponse)
async def request_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Request a password reset email to be sent to the user's email address.
    """
    try:
        # Get user by email
        user_service = UserService(db)
        user = user_service.get_by_email(request.email)

        if not user:
            # Don't reveal that the user doesn't exist
            return {
                "message": "If your email is registered, a password reset link has been sent.",
                "success": True,
            }

        # Generate password reset token
        token = email_service.generate_password_reset_token()

        # Set token expiration (24 hours)
        expires = datetime.now(timezone.utc) + timedelta(hours=24)

        # Update user with password reset token
        user.password_reset_token = token
        user.password_reset_token_expires = expires
        db.commit()

        # Send password reset email in background
        background_tasks.add_task(email_service.send_password_reset_email, user, token)

        return {
            "message": "Password reset email sent. Please check your inbox.",
            "success": True,
        }
    except Exception as e:
        logger.error(f"Error sending password reset email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error sending password reset email",
        )


@router.post("/reset-password", response_model=VerificationResponse)
async def reset_password(
    request: PasswordResetConfirm,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Reset a user's password using the token sent to their email.
    """
    try:
        # Find user with this password reset token
        user = db.query(User).filter(User.password_reset_token == request.token).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token",
            )

        # Check if token is expired
        if (
            not user.password_reset_token_expires
            or user.password_reset_token_expires < datetime.now(timezone.utc)
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password reset token has expired",
            )

        # Update user's password
        from app.core.security import get_password_hash

        user.password_hash = get_password_hash(request.new_password)
        user.password_reset_token = None
        user.password_reset_token_expires = None
        db.commit()

        return {
            "message": "Password reset successfully. You can now log in with your new password.",
            "success": True,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error resetting password",
        )
