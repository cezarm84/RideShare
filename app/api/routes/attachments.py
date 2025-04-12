from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.attachment import MessageAttachment
from app.models.message import Message
from app.models.user import User

router = APIRouter()

# [Existing code remains unchanged]


@router.get("/statistics", response_model=Dict[str, Any])
async def get_attachment_statistics(
    period: str = Query(
        "all",
        description="Time period for statistics: 'day', 'week', 'month', 'year', or 'all'",
    ),
    user_specific: bool = Query(
        False,
        description="Whether to get statistics only for the current user's attachments",
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get attachment usage statistics.

    This endpoint provides statistics about file attachments, including:
    - Total number of attachments
    - Breakdown by file type
    - Total storage used
    - Most recent uploads
    - Top uploaders (if not user-specific)

    Only administrators can see global statistics; regular users see only their own statistics.
    """
    # Check if user is requesting global stats and has permission
    if not user_specific and not current_user.is_admin:
        user_specific = True  # Force user-specific for non-admins

    # Base query
    query = db.query(MessageAttachment)

    # Apply time period filter
    if period != "all":
        current_time = datetime.utcnow()
        if period == "day":
            start_time = current_time - timedelta(days=1)
        elif period == "week":
            start_time = current_time - timedelta(weeks=1)
        elif period == "month":
            start_time = current_time - timedelta(days=30)
        elif period == "year":
            start_time = current_time - timedelta(days=365)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid period: {period}. Must be 'day', 'week', 'month', 'year', or 'all'",
            )
        query = query.filter(MessageAttachment.created_at >= start_time)

    # Apply user filter if needed
    if user_specific:
        # Join with Message to filter by sender_id
        query = query.join(Message, MessageAttachment.message_id == Message.id).filter(
            Message.sender_id == current_user.id
        )

    # Get total count
    total_count = query.count()

    # Get file type breakdown
    file_type_counts = db.query(
        MessageAttachment.file_type, func.count(MessageAttachment.id).label("count")
    ).group_by(MessageAttachment.file_type)

    if user_specific:
        file_type_counts = file_type_counts.join(
            Message, MessageAttachment.message_id == Message.id
        ).filter(Message.sender_id == current_user.id)

    if period != "all":
        file_type_counts = file_type_counts.filter(
            MessageAttachment.created_at >= start_time
        )

    file_type_counts = file_type_counts.all()

    # Get total storage used (sum of file_size)
    total_size_query = db.query(func.sum(MessageAttachment.file_size))

    if user_specific:
        total_size_query = total_size_query.join(
            Message, MessageAttachment.message_id == Message.id
        ).filter(Message.sender_id == current_user.id)

    if period != "all":
        total_size_query = total_size_query.filter(
            MessageAttachment.created_at >= start_time
        )

    total_size = total_size_query.scalar() or 0

    # Get recent uploads (limited to 5)
    recent_uploads_query = query.order_by(desc(MessageAttachment.created_at)).limit(5)
    recent_uploads = [
        {
            "id": att.id,
            "file_name": att.file_name,
            "file_type": att.file_type,
            "file_size": att.file_size,
            "created_at": att.created_at,
        }
        for att in recent_uploads_query.all()
    ]

    # Get top uploaders (if not user specific)
    top_uploaders = []
    if not user_specific:
        top_uploaders_query = (
            db.query(
                Message.sender_id,
                func.count(MessageAttachment.id).label("attachment_count"),
                func.sum(MessageAttachment.file_size).label("total_size"),
            )
            .join(MessageAttachment, Message.id == MessageAttachment.message_id)
            .group_by(Message.sender_id)
            .order_by(desc("attachment_count"))
            .limit(5)
        )

        if period != "all":
            top_uploaders_query = top_uploaders_query.filter(
                MessageAttachment.created_at >= start_time
            )

        for uploader in top_uploaders_query.all():
            user = db.query(User).filter(User.id == uploader.sender_id).first()
            if user:
                top_uploaders.append(
                    {
                        "user_id": user.id,
                        "name": f"{user.first_name} {user.last_name}",
                        "attachment_count": uploader.attachment_count,
                        "total_size": uploader.total_size,
                    }
                )

    # Format file sizes for human readability
    def format_size(size_in_bytes):
        """Convert bytes to human-readable format"""
        for unit in ["B", "KB", "MB", "GB"]:
            if size_in_bytes < 1024 or unit == "GB":
                return f"{size_in_bytes:.2f} {unit}"
            size_in_bytes /= 1024

    # Prepare the response
    result = {
        "total_attachments": total_count,
        "total_size": total_size,
        "total_size_formatted": format_size(total_size),
        "period": period,
        "file_types": [
            {
                "type": ftype.file_type,
                "count": ftype.count,
                "percentage": (
                    round((ftype.count / total_count * 100), 2)
                    if total_count > 0
                    else 0
                ),
            }
            for ftype in file_type_counts
        ],
        "recent_uploads": recent_uploads,
        "is_user_specific": user_specific,
    }

    if not user_specific:
        result["top_uploaders"] = top_uploaders

    return result


@router.get("/user-storage", response_model=Dict[str, Any])
async def get_user_storage_info(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get storage information for the current user.

    Returns detailed information about the user's attachment storage usage,
    including total used space, available space, and usage history.
    """
    # Get total storage used by user
    total_size = (
        db.query(func.sum(MessageAttachment.file_size))
        .join(Message, MessageAttachment.message_id == Message.id)
        .filter(Message.sender_id == current_user.id)
        .scalar()
        or 0
    )

    # Calculate max allowed storage (could be based on user role/subscription)
    # For this example, we'll use 1GB for all users
    max_storage = 1024 * 1024 * 1024  # 1GB in bytes

    # Get storage used by file type
    storage_by_type = (
        db.query(
            MessageAttachment.file_type,
            func.sum(MessageAttachment.file_size).label("total_size"),
        )
        .join(Message, MessageAttachment.message_id == Message.id)
        .filter(Message.sender_id == current_user.id)
        .group_by(MessageAttachment.file_type)
        .all()
    )

    # Get monthly usage for the past 6 months
    current_month = datetime.utcnow().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )
    monthly_usage = []

    for i in range(6):
        month_start = current_month - timedelta(days=30 * i)
        month_end = month_start + timedelta(days=30)

        month_size = (
            db.query(func.sum(MessageAttachment.file_size))
            .join(Message, MessageAttachment.message_id == Message.id)
            .filter(Message.sender_id == current_user.id)
            .filter(MessageAttachment.created_at >= month_start)
            .filter(MessageAttachment.created_at < month_end)
            .scalar()
            or 0
        )

        monthly_usage.append(
            {
                "month": month_start.strftime("%B %Y"),
                "size": month_size,
                "size_formatted": format_size(month_size),
            }
        )

    # Format file sizes for human readability
    def format_size(size_in_bytes):
        """Convert bytes to human-readable format"""
        for unit in ["B", "KB", "MB", "GB"]:
            if size_in_bytes < 1024 or unit == "GB":
                return f"{size_in_bytes:.2f} {unit}"
            size_in_bytes /= 1024

    return {
        "total_used": total_size,
        "total_used_formatted": format_size(total_size),
        "max_storage": max_storage,
        "max_storage_formatted": format_size(max_storage),
        "percentage_used": (
            round((total_size / max_storage * 100), 2) if max_storage > 0 else 0
        ),
        "remaining": max_storage - total_size,
        "remaining_formatted": format_size(max_storage - total_size),
        "storage_by_type": [
            {
                "type": storage_type.file_type,
                "size": storage_type.total_size,
                "size_formatted": format_size(storage_type.total_size),
                "percentage": (
                    round((storage_type.total_size / total_size * 100), 2)
                    if total_size > 0
                    else 0
                ),
            }
            for storage_type in storage_by_type
        ],
        "monthly_usage": monthly_usage,
    }
