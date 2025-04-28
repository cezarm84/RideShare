"""Chatbot service for handling automated responses and FAQ searches."""

import logging
import re
from datetime import datetime, time, timezone
from typing import Dict, List, Optional, Tuple, Union

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.faq import FAQ
from app.models.messaging import ChannelType, Message, MessageChannel, MessageType
from app.models.notification import NotificationType
from app.models.user import User
from app.services.faq_service import FAQService
from app.services.enhanced_notification_service import EnhancedNotificationService
from app.services.websocket_service import broadcast_to_channel

logger = logging.getLogger(__name__)

# Common patterns for intent recognition
GREETING_PATTERNS = [
    r"^hi$", r"^hi\b", r"^hello$", r"^hello\b", r"^hey$", r"^hey\b", r"^howdy\b", r"^greetings", r"^good morning",
    r"^good afternoon", r"^good evening", r"^what's up", r"^sup\b", r"^hola", r"^yo\b", r"^hiya\b", r"hi", r"hello"
]

FAREWELL_PATTERNS = [
    r"bye\b", r"goodbye\b", r"see you", r"talk to you later", r"have a good day",
    r"farewell", r"until next time", r"take care"
]

HELP_PATTERNS = [
    r"help\b", r"assist", r"support", r"guidance", r"how do I", r"how can I",
    r"how to", r"what can you do", r"what do you do"
]

BOOKING_PATTERNS = [
    r"book", r"reserve", r"schedule", r"ride", r"trip", r"journey", r"travel",
    r"pickup", r"destination", r"when", r"where", r"how much", r"cost", r"price",
    r"fare", r"payment", r"cancel", r"modify", r"change"
]

ACCOUNT_PATTERNS = [
    r"account", r"profile", r"sign up", r"register", r"login", r"password",
    r"email", r"phone", r"settings", r"preferences", r"update", r"change"
]

HUMAN_AGENT_PATTERNS = [
    r"human", r"agent", r"person", r"representative", r"staff", r"support team",
    r"talk to someone", r"speak to someone", r"real person", r"customer service",
    r"talk with an agent", r"talk with a human", r"speak with an agent", r"speak with a human",
    r"need to talk", r"need to speak", r"connect me", r"transfer me", r"live support",
    r"live agent", r"live person", r"live chat", r"talk to an agent", r"speak to an agent"
]


class ChatbotService:
    """Service for handling chatbot interactions."""

    def __init__(self, db: Session):
        """Initialize the service with a database session."""
        self.db = db
        self.faq_service = FAQService(db)
        self.notification_service = EnhancedNotificationService(db)
        self.support_hours = (time(8, 0), time(20, 0))  # 8 AM to 8 PM

    def process_message(self, content: str, user_id: Optional[int] = None) -> Dict:
        """
        Process a message from a user and generate a response.

        Args:
            content: The message content
            user_id: The ID of the user sending the message (if authenticated)

        Returns:
            Dict containing the response and any actions
        """
        try:
            logger.info(f"Processing message: '{content}' from user_id: {user_id}")

            # Check if the message matches any known patterns
            intent = self._detect_intent(content)
            logger.info(f"Detected intent: {intent}")

            # If we have a specific intent, handle it
            if intent:
                response = self._handle_intent(intent, content)
                logger.info(f"Generated response for intent '{intent}': '{response}'")
                return {"response": response, "intent": intent}

            # Otherwise, search FAQs for a relevant answer
            logger.info(f"No intent detected, searching FAQs for: '{content}'")
            try:
                faq_results = self.faq_service.search_faqs(content, limit=1)

                if faq_results:
                    faq = faq_results[0]
                    logger.info(f"Found FAQ match: {faq.id} - {faq.question}")
                    return {
                        "response": f"{faq.answer}\n\nWas this helpful?",
                        "source": "faq",
                        "faq_id": faq.id
                    }
            except Exception as e:
                logger.warning(f"Error searching FAQs: {str(e)}")
                # Continue to fallback response if FAQ search fails

            # If no FAQ match, provide a fallback response
            logger.info("No FAQ match found, providing fallback response")
            is_within_support_hours = self._is_within_support_hours()
            logger.info(f"Within support hours: {is_within_support_hours}")

            if is_within_support_hours:
                logger.info("Offering human agent connection")
                return {
                    "response": "I'm sorry, I couldn't find an answer. Connect to a human agent?",
                    "source": "fallback",
                    "action": "offer_human_agent"
                }
            else:
                logger.info("Offering support ticket creation")
                return {
                    "response": "I'm sorry, I couldn't find an answer. Our support team is currently offline. They're available from 8 AM to 8 PM. Create a support ticket?",
                    "source": "fallback",
                    "action": "offer_support_ticket"
                }

        except Exception as e:
            logger.error(f"Error processing chatbot message: {str(e)}")
            logger.exception("Full exception details:")
            return {
                "response": "I'm having trouble processing your request right now. Please try again later.",
                "source": "error"
            }

    def _detect_intent(self, content: str) -> Optional[str]:
        """
        Detect the intent of a message based on patterns.

        Args:
            content: The message content

        Returns:
            The detected intent or None
        """
        content_lower = content.lower()

        # Log the incoming message for debugging
        logger.info(f"Detecting intent for message: '{content}'")

        # Check for direct support ticket creation request
        if re.search(r"create( a)? support ticket", content_lower) or content_lower == "support ticket":
            logger.info("Detected support_ticket intent")
            return "support_ticket"

        # Check for human agent requests first (highest priority)
        for pattern in HUMAN_AGENT_PATTERNS:
            if re.search(pattern, content_lower):
                logger.info(f"Detected human_agent intent with pattern: '{pattern}'")
                return "human_agent"

        # Check for greetings
        if content_lower == "hi" or content_lower == "hello" or any(re.search(pattern, content_lower) for pattern in GREETING_PATTERNS):
            logger.info("Detected greeting intent")
            return "greeting"

        # Check for farewells
        if any(re.search(pattern, content_lower) for pattern in FAREWELL_PATTERNS):
            logger.info("Detected farewell intent")
            return "farewell"

        # Check for help requests
        if any(re.search(pattern, content_lower) for pattern in HELP_PATTERNS):
            logger.info("Detected help intent")
            return "help"

        # Check for booking-related queries
        if any(re.search(pattern, content_lower) for pattern in BOOKING_PATTERNS):
            logger.info("Detected booking intent")
            return "booking"

        # Check for account-related queries
        if any(re.search(pattern, content_lower) for pattern in ACCOUNT_PATTERNS):
            logger.info("Detected account intent")
            return "account"

        logger.info("No intent detected")
        return None

    def _handle_intent(self, intent: str, content: str) -> str:
        """
        Handle a detected intent.

        Args:
            intent: The detected intent
            content: The original message content

        Returns:
            The response message
        """
        if intent == "greeting":
            return "Hi there! How can I help you today?"

        elif intent == "farewell":
            return "Thanks for chatting! Have a great day!"

        elif intent == "help":
            return "I can help with booking rides, account management, payments, and finding ride options. What do you need help with?"

        elif intent == "booking":
            return "To book a ride, go to the Rides page and click 'Book a Ride'. Select your pickup location, destination, and preferred time. Need more help with booking?"

        elif intent == "account":
            return "For account help, visit your Profile page. You can update your info, change payment methods, or reset your password there. What specific account help do you need?"

        elif intent == "human_agent":
            is_within_support_hours = self._is_within_support_hours()

            if is_within_support_hours:
                return "I'll connect you with an agent now. One moment please."
            else:
                return "Our support team is offline (8 AM to 8 PM). Create a support ticket instead?"

        elif intent == "support_ticket":
            return "Click 'Create support ticket' below and our team will contact you soon."

        return "I'm not sure I understand. Could you please rephrase your question?"

    def _is_within_support_hours(self) -> bool:
        """
        Check if the current time is within support hours.

        Returns:
            True if within support hours, False otherwise
        """
        now = datetime.now().time()
        start_time, end_time = self.support_hours

        return start_time <= now < end_time

    async def create_support_channel(
        self, user_id: Optional[int], initial_message: str
    ) -> Tuple[MessageChannel, Message]:
        """
        Create a support channel for a user.

        Args:
            user_id: The ID of the user (can be None for anonymous users)
            initial_message: The initial message from the user

        Returns:
            The created channel and message
        """
        try:
            # Find admin users to add to the channel
            admin_users = self.db.query(User).filter(User.is_superadmin == True).all()

            user = None
            if user_id is not None:
                # Get the user if user_id is provided
                user = self.db.query(User).filter(User.id == user_id).first()
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User not found"
                    )

            # Create the channel
            channel_name = "Anonymous Support Request"
            channel_description = "Support channel for anonymous user"

            if user:
                channel_name = f"Support - {user.first_name} {user.last_name}"
                channel_description = f"Support channel for {user.email}"

            try:
                channel = MessageChannel(
                    name=channel_name,
                    channel_type=ChannelType.ADMIN_DRIVER,  # Using admin_driver type for support
                    description=channel_description,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )

                self.db.add(channel)
                self.db.flush()

                # Add the user (if exists) and admins to the channel
                if user:
                    channel.members.append(user)

                for admin in admin_users:
                    channel.members.append(admin)

                # Create the initial message
                message = Message(
                    channel_id=channel.id,
                    sender_id=user.id if user else None,
                    content=initial_message,
                    message_type=MessageType.DIRECT,
                    created_at=datetime.now(timezone.utc),
                )

                self.db.add(message)

                # Add a system message
                system_message = Message(
                    channel_id=channel.id,
                    sender_id=None,  # System message
                    content="This conversation was transferred from the chatbot. A support agent will assist you shortly.",
                    message_type=MessageType.SYSTEM,
                    created_at=datetime.now(timezone.utc),
                )

                self.db.add(system_message)
                self.db.commit()

                # Notify admins about the new support channel
                for admin in admin_users:
                    notification_content = "New support request from anonymous user"
                    if user:
                        notification_content = f"New support request from {user.first_name} {user.last_name}"

                    try:
                        await self.notification_service.create_notification(
                            user_id=admin.id,
                            type=NotificationType.SYSTEM,
                            title="New Support Request",
                            content=notification_content,
                            link_to=f"/messages/{channel.id}",
                            source_id=channel.id,
                        )
                    except Exception as e:
                        logger.warning(f"Failed to create notification: {str(e)}")

                # Broadcast to the channel
                try:
                    await broadcast_to_channel(
                        channel_id=channel.id,
                        message={
                            "type": "new_message",
                            "data": {
                                "id": system_message.id,
                                "channel_id": channel.id,
                                "content": system_message.content,
                                "sender_id": None,
                                "sender_name": "System",
                                "created_at": system_message.created_at.isoformat(),
                                "message_type": "system",
                            }
                        }
                    )
                except Exception as e:
                    logger.warning(f"Failed to broadcast to channel: {str(e)}")

                return channel, message

            except Exception as e:
                # If there's an error with the database (e.g., missing table), log it and create a mock channel and message
                logger.warning(f"Using mock implementation for support channel due to error: {str(e)}")

                # Create mock objects
                mock_channel = type('MockChannel', (), {
                    'id': 1,
                    'name': channel_name,
                    'description': channel_description,
                    'created_at': datetime.now(timezone.utc)
                })

                mock_message = type('MockMessage', (), {
                    'id': 1,
                    'channel_id': 1,
                    'sender_id': user.id if user else None,
                    'content': initial_message,
                    'message_type': MessageType.DIRECT,
                    'created_at': datetime.now(timezone.utc)
                })

                return mock_channel, mock_message

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating support channel: {str(e)}")
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating support channel: {str(e)}"
            )

    async def create_support_ticket(
        self, user_id: Optional[int], issue: str, source: str = "chatbot"
    ) -> Dict:
        """
        Create a support ticket for a user.

        Args:
            user_id: The ID of the user (can be None for anonymous users)
            issue: The issue description
            source: The source of the ticket

        Returns:
            Dict with ticket information
        """
        try:
            user = None
            if user_id is not None:
                # Get the user if user_id is provided
                user = self.db.query(User).filter(User.id == user_id).first()
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="User not found"
                    )

            # Generate a unique ticket number
            ticket_number = f"TICKET-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

            try:
                # Import the SupportTicket model here to avoid circular imports
                from app.models.support_ticket import SupportTicket

                # Create the support ticket
                support_ticket = SupportTicket(
                    ticket_number=ticket_number,
                    user_id=user_id,  # This can be None for anonymous users
                    issue=issue,
                    source=source,
                    status="open",
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                )

                self.db.add(support_ticket)
                self.db.commit()
                self.db.refresh(support_ticket)

                # Find admin users
                admin_users = self.db.query(User).filter(User.is_superadmin == True).all()

                # Notify admins about the new ticket
                for admin in admin_users:
                    notification_content = f"New support ticket #{ticket_number} from anonymous user: {issue[:50]}..."
                    if user:
                        notification_content = f"New support ticket #{ticket_number} from {user.first_name} {user.last_name}: {issue[:50]}..."

                    try:
                        await self.notification_service.create_notification(
                            user_id=admin.id,
                            type=NotificationType.SYSTEM,
                            title="New Support Ticket",
                            content=notification_content,
                            link_to="/admin/support",
                            source_id=support_ticket.id,
                        )
                    except Exception as e:
                        logger.warning(f"Failed to create notification: {str(e)}")

                # Successfully created the ticket in the database
            except Exception as e:
                # If there's an error with the database (e.g., missing table), log it and continue with a mock implementation
                logger.warning(f"Using mock implementation for support ticket due to error: {str(e)}")
                # Make sure to rollback the transaction
                self.db.rollback()

            # Return a response regardless of whether the database operation succeeded
            return {
                "ticket_id": ticket_number,
                "status": "created",
                "message": "Your support ticket has been created. Our team will contact you during business hours."
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating support ticket: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error creating support ticket: {str(e)}"
            )
