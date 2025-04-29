"""Admin endpoints for chatbot feedback."""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.dependencies import get_current_admin_user
from app.models.chatbot import ChatbotFeedback, ChatbotIntentStats
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatbotFeedbackResponse(BaseModel):
    """Schema for chatbot feedback response."""

    id: int
    user_id: Optional[int] = None
    message_id: str
    is_helpful: bool
    session_id: Optional[str] = None
    content: Optional[str] = None
    intent: Optional[str] = None
    feedback_text: Optional[str] = None
    created_at: str
    user_email: Optional[str] = None


class ChatbotIntentStatsResponse(BaseModel):
    """Schema for chatbot intent stats response."""

    intent: str
    helpful_count: int
    unhelpful_count: int
    total_count: int
    helpfulness_ratio: float
    last_updated: str


class PaginatedFeedbackResponse(BaseModel):
    """Schema for paginated feedback response."""

    items: List[ChatbotFeedbackResponse]
    total: int
    page: int
    limit: int
    total_pages: int


@router.get("", response_model=PaginatedFeedbackResponse)
async def get_chatbot_feedback(
    db: Session = Depends(get_db),
    _: Any = Depends(get_current_admin_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    intent: Optional[str] = None,
    is_helpful: Optional[bool] = None,
) -> Any:
    """
    Get paginated chatbot feedback.
    """
    try:
        # Check if the table exists and create it if it doesn't
        from sqlalchemy import inspect
        inspector = inspect(db.bind)
        if not inspector.has_table("chatbot_feedback"):
            logger.warning("chatbot_feedback table doesn't exist, creating it now")
            from app.db.base import Base
            Base.metadata.create_all(bind=db.bind)

        # Start with a base query
        query = db.query(ChatbotFeedback)

        # Apply filters
        if search:
            query = query.filter(
                ChatbotFeedback.content.ilike(f"%{search}%")
                | ChatbotFeedback.feedback_text.ilike(f"%{search}%")
                | ChatbotFeedback.intent.ilike(f"%{search}%")
            )

        if intent:
            query = query.filter(ChatbotFeedback.intent == intent)

        if is_helpful is not None:
            query = query.filter(ChatbotFeedback.is_helpful == is_helpful)

        # Get total count
        total = query.count()

        # Calculate pagination
        total_pages = (total + limit - 1) // limit
        offset = (page - 1) * limit

        # Get paginated results
        results = (
            query.order_by(desc(ChatbotFeedback.created_at))
            .offset(offset)
            .limit(limit)
            .all()
        )

        # Format the response
        items = []
        for feedback in results:
            user_email = None
            if feedback.user_id:
                user = db.query(User).filter(User.id == feedback.user_id).first()
                if user:
                    user_email = user.email

            items.append(
                ChatbotFeedbackResponse(
                    id=feedback.id,
                    user_id=feedback.user_id,
                    message_id=feedback.message_id,
                    is_helpful=feedback.is_helpful,
                    session_id=feedback.session_id,
                    content=feedback.content,
                    intent=feedback.intent,
                    feedback_text=feedback.feedback_text,
                    created_at=feedback.created_at.isoformat(),
                    user_email=user_email,
                )
            )

        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
        }
    except Exception as e:
        logger.error(f"Error getting chatbot feedback: {str(e)}")
        logger.exception("Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting chatbot feedback: {str(e)}",
        )


@router.get("/intent-stats", response_model=List[ChatbotIntentStatsResponse])
async def get_chatbot_intent_stats(
    db: Session = Depends(get_db),
    _: Any = Depends(get_current_admin_user),
) -> Any:
    """
    Get chatbot intent statistics.
    """
    try:
        # Check if the table exists and create it if it doesn't
        from sqlalchemy import inspect
        inspector = inspect(db.bind)
        if not inspector.has_table("chatbot_intent_stats"):
            logger.warning("chatbot_intent_stats table doesn't exist, creating it now")
            from app.db.base import Base
            Base.metadata.create_all(bind=db.bind)

        # Get all intent stats
        stats = db.query(ChatbotIntentStats).order_by(desc(ChatbotIntentStats.total_count)).all()

        # Format the response
        return [
            ChatbotIntentStatsResponse(
                intent=stat.intent,
                helpful_count=stat.helpful_count,
                unhelpful_count=stat.unhelpful_count,
                total_count=stat.total_count,
                helpfulness_ratio=stat.helpfulness_ratio,
                last_updated=stat.last_updated.isoformat(),
            )
            for stat in stats
        ]
    except Exception as e:
        logger.error(f"Error getting chatbot intent stats: {str(e)}")
        logger.exception("Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting chatbot intent stats: {str(e)}",
        )


@router.get("/summary", response_model=Dict[str, Any])
async def get_chatbot_feedback_summary(
    db: Session = Depends(get_db),
    _: Any = Depends(get_current_admin_user),
) -> Any:
    """
    Get summary statistics for chatbot feedback.
    """
    try:
        # Check if the table exists and create it if it doesn't
        from sqlalchemy import inspect
        inspector = inspect(db.bind)
        if not inspector.has_table("chatbot_feedback"):
            logger.warning("chatbot_feedback table doesn't exist, creating it now")
            from app.db.base import Base
            Base.metadata.create_all(bind=db.bind)

        # Get total feedback count
        total_feedback = db.query(func.count(ChatbotFeedback.id)).scalar() or 0

        # Get helpful feedback count
        helpful_feedback = (
            db.query(func.count(ChatbotFeedback.id))
            .filter(ChatbotFeedback.is_helpful == True)
            .scalar()
        ) or 0

        # Get unhelpful feedback count
        unhelpful_feedback = (
            db.query(func.count(ChatbotFeedback.id))
            .filter(ChatbotFeedback.is_helpful == False)
            .scalar()
        ) or 0

        # Calculate helpfulness ratio
        helpfulness_ratio = (
            helpful_feedback / total_feedback if total_feedback > 0 else 0
        )

        # Get top 5 intents by feedback count
        top_intents = (
            db.query(
                ChatbotFeedback.intent,
                func.count(ChatbotFeedback.id).label("count"),
            )
            .filter(ChatbotFeedback.intent.isnot(None))
            .group_by(ChatbotFeedback.intent)
            .order_by(desc("count"))
            .limit(5)
            .all()
        )

        # Get recent feedback
        recent_feedback = (
            db.query(ChatbotFeedback)
            .order_by(desc(ChatbotFeedback.created_at))
            .limit(5)
            .all()
        )

        # Format the response
        return {
            "total_feedback": total_feedback,
            "helpful_feedback": helpful_feedback,
            "unhelpful_feedback": unhelpful_feedback,
            "helpfulness_ratio": helpfulness_ratio,
            "top_intents": [
                {"intent": intent, "count": count} for intent, count in top_intents
            ],
            "recent_feedback": [
                {
                    "id": feedback.id,
                    "is_helpful": feedback.is_helpful,
                    "content": feedback.content,
                    "intent": feedback.intent,
                    "created_at": feedback.created_at.isoformat(),
                }
                for feedback in recent_feedback
            ],
        }
    except Exception as e:
        logger.error(f"Error getting chatbot feedback summary: {str(e)}")
        logger.exception("Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting chatbot feedback summary: {str(e)}",
        )
