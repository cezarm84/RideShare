"""
Admin endpoints for managing email verification.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_admin_user
from app.db.session import get_db
from app.models.user import User
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter()


class EmailVerificationStatus(BaseModel):
    """Response model for email verification status."""

    user_id: int
    email: EmailStr
    is_verified: bool
    verification_token: Optional[str] = None
    verification_token_expires: Optional[datetime] = None
    last_verification_sent: Optional[datetime] = None


class EmailVerificationResponse(BaseModel):
    """Response model for email verification operations."""

    message: str
    success: bool


@router.get("/verification-status", response_model=List[EmailVerificationStatus])
async def get_email_verification_status(
    email: Optional[str] = Query(None, description="Filter by email"),
    verified: Optional[bool] = Query(None, description="Filter by verification status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> List[EmailVerificationStatus]:
    """
    Get email verification status for users.

    Admin only endpoint.
    """
    try:
        # Build query
        query = db.query(User)

        # Apply filters
        if email:
            query = query.filter(User.email.ilike(f"%{email}%"))

        if verified is not None:
            query = query.filter(User.is_verified == verified)

        # Execute query with pagination
        users = query.offset(skip).limit(limit).all()

        # Convert to response model
        result = []
        for user in users:
            result.append(
                EmailVerificationStatus(
                    user_id=user.id,
                    email=user.email,
                    is_verified=user.is_verified,
                    verification_token=user.verification_token,
                    verification_token_expires=user.verification_token_expires,
                    # We don't store last_verification_sent, so it's None for now
                    last_verification_sent=None,
                )
            )

        return result

    except Exception as e:
        logger.error(f"Error getting email verification status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting email verification status: {str(e)}",
        )


@router.post("/resend-verification/{user_id}", response_model=EmailVerificationResponse)
async def resend_verification_email(
    user_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """
    Resend verification email to a user.

    Admin only endpoint.
    """
    try:
        # Get user
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )

        if user.is_verified:
            return {
                "message": f"User {user.email} is already verified.",
                "success": True,
            }

        # Generate verification token
        token = email_service.generate_verification_token()

        # Set token expiration
        expires = datetime.now(timezone.utc) + timedelta(
            hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
        )

        # Update user with verification token
        user.verification_token = token
        user.verification_token_expires = expires
        db.commit()

        # Send verification email in background
        background_tasks.add_task(email_service.send_verification_email, user, token)

        return {"message": f"Verification email sent to {user.email}.", "success": True}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending verification email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resending verification email: {str(e)}",
        )


@router.post("/verify-user/{user_id}", response_model=EmailVerificationResponse)
async def manually_verify_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Dict[str, Any]:
    """
    Manually verify a user's email.

    Admin only endpoint.
    """
    try:
        # Get user
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found",
            )

        if user.is_verified:
            return {
                "message": f"User {user.email} is already verified.",
                "success": True,
            }

        # Mark user as verified
        user.is_verified = True
        user.verification_token = None
        user.verification_token_expires = None
        db.commit()

        return {
            "message": f"User {user.email} has been manually verified.",
            "success": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error manually verifying user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error manually verifying user: {str(e)}",
        )


@router.get("/unverified-count", response_model=Dict[str, int])
async def get_unverified_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Dict[str, int]:
    """
    Get count of unverified users.

    Admin only endpoint.
    """
    try:
        count = db.query(User).filter(not User.is_verified).count()
        return {"count": count}

    except Exception as e:
        logger.error(f"Error getting unverified count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting unverified count: {str(e)}",
        )
