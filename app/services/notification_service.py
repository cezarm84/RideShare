import logging
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from app.models.user import User
from app.models.ride import RideBooking
from app.models.message import Message, Conversation, UserMessageSettings

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for handling notifications"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def notify_ride_confirmation(self, booking_id: int) -> bool:
        """
        Notify a user about a ride booking confirmation.
        Returns True if notification was sent successfully, False otherwise.
        """
        booking = self.db.query(RideBooking).filter(RideBooking.id == booking_id).first()
        if not booking:
            logger.error(f"Booking {booking_id} not found for notification")
            return False

        user = self.db.query(User).filter(User.id == booking.user_id).first()
        if not user:
            logger.error(f"User {booking.user_id} not found for booking {booking_id}")
            return False

        message = (
            f"Your ride booking (ID: {booking_id}) has been confirmed!\n"
            f"Departure: {booking.ride.departure_time}\n"
            f"From: Hub {booking.ride.starting_hub_id} to Location {booking.ride.destination_id}"
        )
        
        notification_data = self.create_ride_notification(
            notification_type="ride_confirmation",
            booking_id=booking_id,
            user_id=user.id,
            details={
                "departure_time": booking.ride.departure_time.isoformat(),
                "starting_hub_id": booking.ride.starting_hub_id,
                "destination_id": booking.ride.destination_id
            }
        )
        
        push_notification = self.format_notification_for_push(
            title="Ride Confirmation",
            body=message,
            data=notification_data
        )
        
        return await self._send_notification(user, "Ride Confirmation", message, push_notification)

    async def notify_ride_update(self, booking_id: int, update_type: str, details: str) -> bool:
        """
        Notify a user about a ride update (e.g., delay, cancellation).
        """
        booking = self.db.query(RideBooking).filter(RideBooking.id == booking_id).first()
        if not booking:
            logger.error(f"Booking {booking_id} not found for update notification")
            return False

        user = self.db.query(User).filter(User.id == booking.user_id).first()
        if not user:
            logger.error(f"User {booking.user_id} not found for booking {booking_id}")
            return False

        message = f"Your ride (ID: {booking_id}) has an update: {update_type}\nDetails: {details}"
        
        notification_data = self.create_ride_notification(
            notification_type="ride_update",
            booking_id=booking_id,
            user_id=user.id,
            details={
                "update_type": update_type,
                "details": details
            }
        )
        
        push_notification = self.format_notification_for_push(
            title=f"Ride Update: {update_type}",
            body=message,
            data=notification_data
        )
        
        return await self._send_notification(user, f"Ride Update: {update_type}", message, push_notification)

    async def notify_custom_message(self, user_id: int, title: str, message: str) -> bool:
        """
        Send a custom notification to a user.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"User {user_id} not found for custom notification")
            return False

        notification_data = {
            "type": "custom",
            "title": title,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        push_notification = self.format_notification_for_push(
            title=title,
            body=message,
            data=notification_data
        )
        
        return await self._send_notification(user, title, message, push_notification)
    
    async def notify_new_message(self, message_id: int) -> bool:
        """
        Notify a user about a new message.
        """
        message = self.db.query(Message).filter(Message.id == message_id).first()
        if not message:
            logger.error(f"Message {message_id} not found for notification")
            return False
        
        # Get the conversation
        conversation = self.db.query(Conversation).filter(Conversation.id == message.conversation_id).first()
        if not conversation:
            logger.error(f"Conversation {message.conversation_id} not found for message {message_id}")
            return False
        
        # Get the sender
        sender = self.db.query(User).filter(User.id == message.sender_id).first()
        if not sender:
            logger.error(f"Sender {message.sender_id} not found for message {message_id}")
            return False
        
        # Create notification data
        notification_data = self.create_message_notification(message)
        
        # Get recipients (all participants except sender)
        recipients = self.get_notification_recipients(message)
        
        success = True
        for recipient in recipients:
            # Format notification for this recipient
            push_notification = self.format_notification_for_push(
                title=f"New message from {sender.first_name} {sender.last_name}",
                body=message.content[:50] + ("..." if len(message.content) > 50 else ""),
                data=notification_data
            )
            
            # Send notification
            if not await self._send_notification(
                recipient, 
                f"New message from {sender.first_name} {sender.last_name}", 
                message.content, 
                push_notification
            ):
                success = False
        
        return success

    def create_message_notification(self, message: Message) -> Dict[str, Any]:
        """Create a notification for a new message"""
        # Get the sender
        sender = self.db.query(User).filter(User.id == message.sender_id).first()
        if not sender:
            logger.error(f"Sender not found for message {message.id}")
            return {}
        
        # Get the conversation
        conversation = self.db.query(Conversation).filter(Conversation.id == message.conversation_id).first()
        if not conversation:
            logger.error(f"Conversation not found for message {message.id}")
            return {}
        
        # Create notification data
        notification_data = {
            "type": "new_message",
            "message_id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "sender_name": f"{sender.first_name} {sender.last_name}",
            "content_preview": message.content[:50] + ("..." if len(message.content) > 50 else ""),
            "message_type": message.message_type if hasattr(message, 'message_type') else "text",
            "sent_at": message.sent_at.isoformat(),
            "conversation_title": conversation.title or "Direct Message",
            "conversation_type": conversation.conversation_type if hasattr(conversation, 'conversation_type') else "direct"
        }
        
        return notification_data
    
    def create_ride_notification(self, notification_type: str, booking_id: int, user_id: int, details: Dict[str, Any]) -> Dict[str, Any]:
        """Create a notification for a ride update"""
        notification_data = {
            "type": notification_type,
            "booking_id": booking_id,
            "user_id": user_id,
            "timestamp": datetime.now().isoformat(),
            "details": details
        }
        
        return notification_data
    
    def get_notification_recipients(self, message: Message) -> List[User]:
        """Get the list of users who should receive notifications for a message"""
        # Get the conversation
        conversation = self.db.query(Conversation).filter(Conversation.id == message.conversation_id).first()
        if not conversation:
            logger.error(f"Conversation not found for message {message.id}")
            return []
        
        # Get all participants except the sender
        recipients = [
            user for user in conversation.participants 
            if user.id != message.sender_id and 
               self.should_notify_user(user.id)
        ]
        
        return recipients
    
    def should_notify_user(self, user_id: int) -> bool:
        """Check if a user should receive notifications"""
        # Get user's message settings
        settings = self.db.query(UserMessageSettings).filter(UserMessageSettings.user_id == user_id).first()
        
        # If no settings exist, default to sending notifications
        if not settings:
            return True
        
        return settings.notifications_enabled
    
    def format_notification_for_push(self, title: str, body: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Format a notification for sending as a push notification"""
        return {
            "title": title,
            "body": body,
            "data": data
        }

    async def _send_notification(self, user: User, title: str, message: str, push_data: Optional[Dict[str, Any]] = None) -> bool:
        """
        Internal method to send notifications via multiple channels.
        Currently logs messages; to be extended with real integrations.
        """
        try:
            # Placeholder for email notification (e.g., using SendGrid)
            logger.info(f"Email notification to {user.email}: {title} - {message}")

            # Placeholder for SMS notification (e.g., using Twilio)
            if user.phone_number:
                logger.info(f"SMS to {user.phone_number}: {title} - {message}")

            # Placeholder for push notification (e.g., using Firebase)
            if push_data:
                logger.info(f"Push notification to user {user.id}: {json.dumps(push_data)}")
            else:
                logger.info(f"Push notification to user {user.id}: {title} - {message}")

            # In a real implementation, integrate with:
            # - Email: SendGrid, SMTP
            # - SMS: Twilio
            # - Push: Firebase Cloud Messaging
            # Example (commented out):
            # await self._send_email(user.email, title, message)
            # await self._send_sms(user.phone_number, message)
            # await self._send_push(user.id, title, message, push_data)

            return True
        except Exception as e:
            logger.error(f"Failed to send notification to user {user.id}: {str(e)}")
            return False

    # Implementation methods for integrations
    async def _send_email(self, email: str, title: str, message: str) -> None:
        """Send an email notification"""
        # Implement with SendGrid or SMTP
        # Example with SendGrid:
        # from sendgrid import SendGridAPIClient
        # from sendgrid.helpers.mail import Mail
        # 
        # message = Mail(
        #     from_email='noreply@rideshare.com',
        #     to_emails=email,
        #     subject=title,
        #     html_content=f'<p>{message}</p>'
        # )
        # 
        # try:
        #     sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        #     response = sg.send(message)
        # except Exception as e:
        #     logger.error(f"SendGrid error: {str(e)}")
        pass

    async def _send_sms(self, phone_number: str, message: str) -> None:
        """Send an SMS notification"""
        # Implement with Twilio
        # Example with Twilio:
        # from twilio.rest import Client
        # 
        # account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        # auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        # from_number = os.environ.get('TWILIO_PHONE_NUMBER')
        # 
        # client = Client(account_sid, auth_token)
        # 
        # try:
        #     message = client.messages.create(
        #         body=message,
        #         from_=from_number,
        #         to=phone_number
        #     )
        # except Exception as e:
        #     logger.error(f"Twilio error: {str(e)}")
        pass

    async def _send_push(self, user_id: int, title: str, message: str, data: Optional[Dict[str, Any]] = None) -> None:
        """Send a push notification"""
        # Implement with Firebase Cloud Messaging
        # Example with Firebase:
        # from firebase_admin import messaging
        # 
        # # Get the user's device tokens from the database
        # user_tokens = self.db.query(UserDeviceToken).filter(UserDeviceToken.user_id == user_id).all()
        # 
        # if not user_tokens:
        #     logger.warning(f"No device tokens found for user {user_id}")
        #     return
        # 
        # for token in user_tokens:
        #     try:
        #         message = messaging.Message(
        #             notification=messaging.Notification(
        #                 title=title,
        #                 body=message
        #             ),
        #             data=data,
        #             token=token.token
        #         )
        #         response = messaging.send(message)
        #         logger.info(f"Successfully sent message: {response}")
        #     except Exception as e:
        #         logger.error(f"Firebase error: {str(e)}")
        pass
