"""API endpoints for contact messages."""

import logging
from typing import Any, List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Path,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_current_user, get_db, get_optional_user
from app.core.config import settings
from app.models.user import User
from app.schemas.contact import (
    ContactMessageAdminResponse,
    ContactMessageCreate,
    ContactMessagePublicResponse,
    ContactMessageResponse,
    ContactMessageUpdate,
)
from app.services.contact_service import ContactService

logger = logging.getLogger(__name__)

router = APIRouter()


async def send_notification_email(db: Session, message_id: int, admin_email: str):
    """Send notification email to admin about new contact message."""
    try:
        # Get the contact message
        contact_service = ContactService(db)
        message = contact_service.get_message(message_id)
        if not message:
            logger.error(f"Contact message {message_id} not found for notification")
            return

        # Log the notification (in a real app, this would send an email)
        logger.info(
            f"New contact message notification to {admin_email}:\n"
            f"Subject: {message.subject}\n"
            f"From: {message.name} ({message.email})\n"
            f"Message: {message.message[:100]}..."
        )

        # Log the notification
        logger.info(
            f"Notification sent to {admin_email} about contact message {message_id}"
        )
    except Exception as e:
        logger.error(
            f"Error sending notification for contact message {message_id}: {str(e)}"
        )


@router.post(
    "", response_model=ContactMessagePublicResponse, status_code=status.HTTP_201_CREATED
)
async def create_contact_message(
    message_in: ContactMessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
) -> Any:
    """
    Create a new contact message.
    """
    try:
        # Verify reCAPTCHA token if provided and required
        if settings.RECAPTCHA_ENABLED and not current_user:
            if not message_in.recaptcha_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="reCAPTCHA verification required",
                )

            # Here you would verify the reCAPTCHA token
            # For now, we'll just assume it's valid

        contact_service = ContactService(db)
        user_id = current_user.id if current_user else None

        # Create the message
        message = contact_service.create_message(message_in, user_id)

        # Send notification email in the background
        if settings.CONTACT_NOTIFICATION_EMAIL:
            background_tasks.add_task(
                send_notification_email,
                db,
                message.id,
                settings.CONTACT_NOTIFICATION_EMAIL,
            )

        return message
    except Exception as e:
        logger.error(f"Error creating contact message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating contact message: {str(e)}",
        )


@router.get("/me", response_model=List[ContactMessageResponse])
async def get_my_contact_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get all contact messages for the current user.
    """
    try:
        contact_service = ContactService(db)

        # If user is admin, get all messages
        if current_user.is_superuser:
            return contact_service.get_messages(skip=skip, limit=limit)

        # Otherwise, get only messages for this user's email
        return contact_service.get_messages_by_email(
            current_user.email, skip=skip, limit=limit
        )
    except Exception as e:
        logger.error(f"Error getting contact messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting contact messages: {str(e)}",
        )


# Admin endpoints
@router.get("", response_model=List[ContactMessageAdminResponse])
async def get_contact_messages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Get all contact messages with optional filters.
    Admin only.
    """
    try:
        contact_service = ContactService(db)
        return contact_service.get_messages(
            skip=skip, limit=limit, status=status, category=category, is_read=is_read
        )
    except Exception as e:
        logger.error(f"Error getting contact messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting contact messages: {str(e)}",
        )


@router.get("/{message_id}", response_model=ContactMessageAdminResponse)
async def get_contact_message(
    message_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Get a specific contact message.
    Admin only.
    """
    try:
        contact_service = ContactService(db)
        message = contact_service.get_message(message_id)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contact message with ID {message_id} not found",
            )

        # Mark as read if not already
        if not message.is_read:
            contact_service.mark_as_read(message_id)

        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting contact message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting contact message: {str(e)}",
        )


@router.put("/{message_id}", response_model=ContactMessageAdminResponse)
async def update_contact_message(
    message_in: ContactMessageUpdate,
    message_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Update a contact message.
    Admin only.
    """
    try:
        contact_service = ContactService(db)
        message = contact_service.update_message(message_id, message_in)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contact message with ID {message_id} not found",
            )

        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contact message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating contact message: {str(e)}",
        )


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact_message(
    message_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> None:
    """
    Delete a contact message.
    Admin only.
    """
    try:
        contact_service = ContactService(db)
        result = contact_service.delete_message(message_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contact message with ID {message_id} not found",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contact message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting contact message: {str(e)}",
        )


@router.post("/{message_id}/read", response_model=ContactMessageAdminResponse)
async def mark_message_as_read(
    message_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Mark a contact message as read.
    Admin only.
    """
    try:
        contact_service = ContactService(db)
        message = contact_service.mark_as_read(message_id)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contact message with ID {message_id} not found",
            )

        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking contact message as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marking contact message as read: {str(e)}",
        )


@router.post("/{message_id}/unread", response_model=ContactMessageAdminResponse)
async def mark_message_as_unread(
    message_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Mark a contact message as unread.
    Admin only.
    """
    try:
        contact_service = ContactService(db)
        message = contact_service.mark_as_unread(message_id)
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Contact message with ID {message_id} not found",
            )

        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking contact message as unread: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error marking contact message as unread: {str(e)}",
        )
