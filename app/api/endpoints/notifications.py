"""API endpoints for notifications."""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.notification import NotificationType
from app.models.user import User
from app.schemas.notification import (
    NotificationCountResponse,
    NotificationList,
    NotificationResponse,
    NotificationUpdate,
)
from app.services.enhanced_notification_service import EnhancedNotificationService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=NotificationList)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get notifications for the current user.
    """
    notification_service = EnhancedNotificationService(db)
    result = notification_service.get_user_notifications(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        unread_only=unread_only,
    )
    
    return {
        "notifications": result["notifications"],
        "total": result["total"],
        "unread": result["unread"],
    }


@router.get("/unread-count", response_model=NotificationCountResponse)
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the number of unread notifications for the current user.
    """
    notification_service = EnhancedNotificationService(db)
    unread = notification_service.get_unread_count(current_user.id)
    
    # Get total count
    total = db.query(NotificationCountResponse).filter(
        NotificationCountResponse.user_id == current_user.id
    ).count()
    
    return {
        "total": total,
        "unread": unread,
    }


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific notification.
    """
    notification_service = EnhancedNotificationService(db)
    notification = notification_service.get_notification(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this notification",
        )
    
    return notification


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int = Path(...),
    update_data: NotificationUpdate = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a notification (mark as read).
    """
    notification_service = EnhancedNotificationService(db)
    notification = notification_service.get_notification(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this notification",
        )
    
    if update_data and update_data.is_read is not None:
        notification_service.mark_notification_as_read(notification_id, current_user.id)
    
    # Get updated notification
    notification = notification_service.get_notification(notification_id)
    
    return notification


@router.post("/mark-read/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_as_read(
    notification_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a notification as read.
    """
    notification_service = EnhancedNotificationService(db)
    notification = notification_service.get_notification(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this notification",
        )
    
    success = notification_service.mark_notification_as_read(notification_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read",
        )


@router.post("/mark-all-read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark all notifications as read.
    """
    notification_service = EnhancedNotificationService(db)
    success = notification_service.mark_all_notifications_as_read(current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all notifications as read",
        )


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a notification.
    """
    notification_service = EnhancedNotificationService(db)
    notification = notification_service.get_notification(notification_id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this notification",
        )
    
    success = notification_service.delete_notification(notification_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification",
        )
