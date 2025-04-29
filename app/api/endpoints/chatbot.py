"""API endpoints for chatbot functionality."""

import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, BackgroundTasks, Body, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_optional_user
from app.models.user import User
from app.services.chatbot_service import ChatbotService

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatbotMessageRequest(BaseModel):
    """Schema for chatbot message request."""

    content: str
    session_id: Optional[str] = None


class ChatbotMessageResponse(BaseModel):
    """Schema for chatbot message response."""

    response: str
    source: Optional[str] = None
    intent: Optional[str] = None
    action: Optional[str] = None
    faq_id: Optional[int] = None
    data: Optional[Dict[str, Any]] = None  # For service-specific data (geocoding, traffic, docs)


class SupportTicketRequest(BaseModel):
    """Schema for support ticket request."""

    issue: str
    source: str = "chatbot"
    session_id: Optional[str] = None


class SupportChannelRequest(BaseModel):
    """Schema for support channel request."""

    initial_message: str
    session_id: Optional[str] = None


class FeedbackRequest(BaseModel):
    """Schema for chatbot feedback request."""

    message_id: str
    is_helpful: bool
    session_id: Optional[str] = None
    content: Optional[str] = None
    intent: Optional[str] = None
    feedback_text: Optional[str] = None


@router.post("/message", response_model=ChatbotMessageResponse)
async def process_message(
    message: ChatbotMessageRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
) -> Any:
    """
    Process a message from the chatbot.

    This endpoint accepts a message from the user and returns a response from the chatbot.
    If the user is authenticated, the chatbot can provide personalized responses.
    The chatbot can now detect intent and call various services based on the message content.
    """
    try:
        chatbot_service = ChatbotService(db)

        # Process the message
        user_id = current_user.id if current_user else None
        content = message.content

        # Special handling for simple greetings
        if content.lower().strip() in ["hi", "hello", "hey"]:
            logger.info("Detected simple greeting in authenticated endpoint")
            response = chatbot_service._handle_intent("greeting", content)
            logger.info(f"Generated greeting response: {response}")
            return {"response": response, "intent": "greeting"}

        # First try pattern-based intent detection
        intent = chatbot_service._detect_intent_pattern(content)

        # Handle intents that require async processing
        if intent == "geocode":
            location = chatbot_service._extract_location(content)
            if location:
                return await chatbot_service._handle_geocoding(location)
        elif intent == "traffic":
            destination = chatbot_service._extract_destination(content)
            if destination:
                return await chatbot_service._handle_traffic(destination)

        # For other intents, use the regular process_message method
        result = chatbot_service.process_message(content, user_id)
        return result

    except Exception as e:
        logger.error(f"Error processing chatbot message: {str(e)}")
        logger.exception("Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chatbot message: {str(e)}",
        )


@router.post("/public/message", response_model=ChatbotMessageResponse)
async def process_public_message(
    message: ChatbotMessageRequest = Body(...),
    db: Session = Depends(get_db),
) -> Any:
    """
    Process a message from the chatbot without authentication.

    This endpoint accepts a message from any user without authentication
    and returns a response from the chatbot.
    The chatbot can now detect intent and call various services based on the message content.
    """
    try:
        logger.info(f"Processing public message: {message.content}")
        chatbot_service = ChatbotService(db)

        # Process the message
        content = message.content

        # Special handling for simple greetings
        if content.lower().strip() in ["hi", "hello", "hey"]:
            logger.info("Detected simple greeting in public endpoint")
            response = chatbot_service._handle_intent("greeting", content)
            logger.info(f"Generated greeting response: {response}")
            return {"response": response, "intent": "greeting"}

        # First try pattern-based intent detection
        intent = chatbot_service._detect_intent_pattern(content)
        logger.info(f"Detected intent for public message: {intent}")

        # Handle intents that require async processing
        if intent == "geocode":
            location = chatbot_service._extract_location(content)
            if location:
                logger.info(f"Handling geocoding for location: {location}")
                result = await chatbot_service._handle_geocoding(location)
                logger.info(f"Geocoding response: {result}")
                return result
        elif intent == "traffic":
            destination = chatbot_service._extract_destination(content)
            if destination:
                logger.info(f"Handling traffic for destination: {destination}")
                result = await chatbot_service._handle_traffic(destination)
                logger.info(f"Traffic response: {result}")
                return result

        # For other intents, use the regular process_message method
        result = chatbot_service.process_message(content, None)
        logger.info(f"Chatbot response: {result}")

        return result
    except Exception as e:
        logger.error(f"Error processing public chatbot message: {str(e)}")
        logger.exception("Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chatbot message: {str(e)}",
        )


@router.post("/support/channel", response_model=Dict[str, Any])
async def create_support_channel(
    request: SupportChannelRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create a support channel for the user.

    This endpoint creates a new support channel and adds the user and support staff to it.
    It also creates an initial message with the user's issue.
    """
    try:
        chatbot_service = ChatbotService(db)

        # Create the support channel
        channel, message = await chatbot_service.create_support_channel(
            current_user.id, request.initial_message
        )

        return {
            "channel_id": channel.id,
            "message_id": message.id,
            "status": "created",
            "message": "Support channel created successfully. A support agent will assist you shortly."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating support channel: {str(e)}")
        logger.exception("Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating support channel: {str(e)}",
        )


@router.post("/public/support/channel", response_model=Dict[str, Any])
async def create_public_support_channel(
    request: SupportChannelRequest = Body(...),
    db: Session = Depends(get_db),
) -> Any:
    """
    Create a support channel without authentication.

    This endpoint creates a new support channel without requiring authentication.
    It creates an initial message with the user's issue and adds support staff to it.
    """
    try:
        logger.info(f"Creating public support channel with message: {request.initial_message}")
        chatbot_service = ChatbotService(db)

        # Create the support channel without a user ID
        channel, message = await chatbot_service.create_support_channel(
            None, request.initial_message
        )

        logger.info(f"Public support channel created: {channel.id}")
        return {
            "channel_id": channel.id,
            "message_id": message.id,
            "status": "created",
            "message": "Support channel created successfully. A support agent will assist you shortly."
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating public support channel: {str(e)}")
        logger.exception("Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating support channel: {str(e)}",
        )


@router.post("/support/ticket", response_model=Dict[str, Any])
async def create_support_ticket(
    request: SupportTicketRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create a support ticket for the user.

    This endpoint creates a new support ticket with the user's issue.
    Support staff will be notified and will respond during business hours.
    """
    try:
        chatbot_service = ChatbotService(db)

        # Create the support ticket
        result = await chatbot_service.create_support_ticket(
            current_user.id, request.issue, request.source
        )

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating support ticket: {str(e)}")
        logger.exception("Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating support ticket: {str(e)}",
        )


@router.post("/public/support/ticket", response_model=Dict[str, Any])
async def create_public_support_ticket(
    request: SupportTicketRequest = Body(...),
    db: Session = Depends(get_db),
) -> Any:
    """
    Create a support ticket without authentication.

    This endpoint creates a new support ticket with the user's issue without requiring authentication.
    Support staff will be notified and will respond during business hours.
    """
    try:
        logger.info(f"Creating public support ticket: {request.issue}")
        chatbot_service = ChatbotService(db)

        # Create the support ticket without a user ID
        result = await chatbot_service.create_support_ticket(
            None, request.issue, request.source
        )

        logger.info(f"Public support ticket created: {result}")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating public support ticket: {str(e)}")
        logger.exception("Full exception details:")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating support ticket: {str(e)}",
        )


@router.post("/feedback", response_model=Dict[str, Any])
async def submit_feedback(
    feedback: FeedbackRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Submit feedback for a chatbot message.
    """
    try:
        chatbot_service = ChatbotService(db)

        # Store the feedback
        feedback_id = chatbot_service.store_feedback(
            user_id=current_user.id,
            message_id=feedback.message_id,
            is_helpful=feedback.is_helpful,
            session_id=feedback.session_id,
            content=feedback.content,
            intent=feedback.intent,
            feedback_text=feedback.feedback_text
        )

        return {"feedback_id": feedback_id, "status": "received"}
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        logger.exception("Full exception details:")
        # Return a success response even if there's an error to prevent frontend issues
        # This is a temporary solution until the backend is fully fixed
        import uuid
        return {"feedback_id": f"error-{uuid.uuid4()}", "status": "error", "message": str(e)}


@router.post("/public/feedback", response_model=Dict[str, Any])
async def submit_public_feedback(
    feedback: FeedbackRequest = Body(...),
    db: Session = Depends(get_db),
) -> Any:
    """
    Submit feedback for a chatbot message without authentication.
    """
    try:
        chatbot_service = ChatbotService(db)

        # Store the feedback
        feedback_id = chatbot_service.store_feedback(
            user_id=None,
            message_id=feedback.message_id,
            is_helpful=feedback.is_helpful,
            session_id=feedback.session_id,
            content=feedback.content,
            intent=feedback.intent,
            feedback_text=feedback.feedback_text
        )

        return {"feedback_id": feedback_id, "status": "received"}
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        logger.exception("Full exception details:")
        # Return a success response even if there's an error to prevent frontend issues
        # This is a temporary solution until the backend is fully fixed
        import uuid
        return {"feedback_id": f"error-{uuid.uuid4()}", "status": "error", "message": str(e)}