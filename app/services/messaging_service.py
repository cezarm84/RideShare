import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from fastapi import HTTPException, WebSocket
from sqlalchemy.orm import Session

from app.models.message import Conversation, ConversationMessage as Message
from app.models.ride import Ride, RideBooking
from app.models.user import User
from app.schemas.message import ConversationCreate, MessageCreate

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time messaging"""

    def __init__(self):
        # Map of user_id to list of active websocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Map of user_id to set of active conversation_ids
        self.user_conversations: Dict[int, Set[int]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Connect a user's WebSocket"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(
            f"User {user_id} connected to messaging. Active connections: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket, user_id: int):
        """Disconnect a user's WebSocket"""
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            logger.info(
                f"User {user_id} disconnected from messaging. Remaining connections: {len(self.active_connections)}"
            )

    async def send_personal_message(self, message: Dict[str, Any], user_id: int):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {str(e)}")

    async def send_conversation_message(
        self,
        message: Dict[str, Any],
        conversation_id: int,
        exclude_user_id: Optional[int] = None,
    ):
        """Send a message to all users in a conversation except the excluded user"""
        for user_id, conversations in self.user_conversations.items():
            if user_id != exclude_user_id and conversation_id in conversations:
                await self.send_personal_message(message, user_id)

    def register_conversation(self, user_id: int, conversation_id: int):
        """Register a user as active in a conversation"""
        if user_id not in self.user_conversations:
            self.user_conversations[user_id] = set()
        self.user_conversations[user_id].add(conversation_id)

    def unregister_conversation(self, user_id: int, conversation_id: int):
        """Unregister a user from a conversation"""
        if user_id in self.user_conversations:
            self.user_conversations[user_id].discard(conversation_id)
            if not self.user_conversations[user_id]:
                del self.user_conversations[user_id]


# Create a singleton connection manager
connection_manager = ConnectionManager()


class MessagingService:
    """Service for handling in-app messaging between users"""

    def __init__(self, db: Session):
        self.db = db

    def get_user_conversations(
        self, user_id: int, skip: int = 0, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Get all conversations for a user with latest message preview

        Args:
            user_id: ID of the user to get conversations for
            skip: Number of conversations to skip (for pagination)
            limit: Maximum number of conversations to return

        Returns:
            List of conversation details with message previews
        """
        # Find all conversations where user is a participant
        conversations = (
            self.db.query(Conversation)
            .filter(Conversation.participants.any(id=user_id))
            .filter(Conversation.is_active == True)
            .order_by(Conversation.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        result = []
        for conversation in conversations:
            # Get the latest message for this conversation
            latest_message = (
                self.db.query(Message)
                .filter(Message.conversation_id == conversation.id)
                .order_by(Message.sent_at.desc())
                .first()
            )

            # Get unread count for this user in this conversation
            unread_count = (
                self.db.query(Message)
                .filter(
                    Message.conversation_id == conversation.id,
                    Message.sender_id != user_id,
                    Message.read_at == None,
                )
                .count()
            )

            # Format other participants' info
            other_participants = [
                {
                    "id": p.id,
                    "name": f"{p.first_name} {p.last_name}",
                    "is_driver": (
                        True
                        if conversation.ride and conversation.ride.driver_id == p.id
                        else False
                    ),
                }
                for p in conversation.participants
                if p.id != user_id
            ]

            # Build conversation info
            conv_info = {
                "id": conversation.id,
                "title": conversation.title
                or self._generate_conversation_title(conversation, user_id),
                "type": conversation.conversation_type,
                "created_at": conversation.created_at.isoformat(),
                "ride_id": conversation.ride_id,
                "other_participants": other_participants,
                "unread_count": unread_count,
                "last_message": (
                    {
                        "content": latest_message.content if latest_message else None,
                        "sender_id": (
                            latest_message.sender_id if latest_message else None
                        ),
                        "sent_at": (
                            latest_message.sent_at.isoformat()
                            if latest_message
                            else None
                        ),
                        "is_system_message": (
                            latest_message.is_system_message
                            if latest_message
                            else False
                        ),
                    }
                    if latest_message
                    else None
                ),
            }

            result.append(conv_info)

        return result

    def get_conversation_messages(
        self, conversation_id: int, user_id: int, skip: int = 0, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get messages for a specific conversation

        Args:
            conversation_id: ID of the conversation to get messages for
            user_id: ID of the user requesting messages
            skip: Number of messages to skip (for pagination)
            limit: Maximum number of messages to return

        Returns:
            List of messages with sender information
        """
        # Check if user is a participant in this conversation
        conversation = (
            self.db.query(Conversation)
            .filter(
                Conversation.id == conversation_id,
                Conversation.participants.any(id=user_id),
            )
            .first()
        )

        if not conversation:
            raise HTTPException(
                status_code=403, detail="User is not a participant in this conversation"
            )

        # Get messages with sender info, oldest first
        messages = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.sent_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        # Update read status for messages from other users
        self._mark_messages_as_read(conversation_id, user_id)

        # Format messages for response
        result = []
        for message in messages:
            sender = self.db.query(User).filter(User.id == message.sender_id).first()

            msg_data = {
                "id": message.id,
                "content": message.content,
                "sent_at": message.sent_at.isoformat(),
                "read_at": message.read_at.isoformat() if message.read_at else None,
                "is_system_message": message.is_system_message,
                "message_type": message.message_type,
                "metadata": json.loads(message.metadata) if message.metadata else None,
                "sender": (
                    {
                        "id": sender.id,
                        "name": f"{sender.first_name} {sender.last_name}",
                        "is_driver": (
                            True
                            if conversation.ride
                            and conversation.ride.driver_id == sender.id
                            else False
                        ),
                    }
                    if sender
                    else None
                ),
            }

            result.append(msg_data)

        # Register user as active in this conversation for real-time updates
        connection_manager.register_conversation(user_id, conversation_id)

        return result

    async def send_message(
        self, user_id: int, conversation_id: int, message_data: MessageCreate
    ) -> Dict[str, Any]:
        """
        Send a message in a conversation

        Args:
            user_id: ID of the user sending the message
            conversation_id: ID of the conversation to send the message in
            message_data: The message content and metadata

        Returns:
            Details of the sent message
        """
        # Check if user is a participant
        conversation = (
            self.db.query(Conversation)
            .filter(
                Conversation.id == conversation_id,
                Conversation.participants.any(id=user_id),
                Conversation.is_active == True,
            )
            .first()
        )

        if not conversation:
            raise HTTPException(
                status_code=403, detail="User cannot send messages to this conversation"
            )

        # Create the message
        metadata_json = (
            json.dumps(message_data.metadata) if message_data.metadata else None
        )
        new_message = Message(
            conversation_id=conversation_id,
            sender_id=user_id,
            content=message_data.content,
            message_type=message_data.message_type,
            metadata=metadata_json,
            sent_at=datetime.utcnow(),
            is_system_message=False,
        )

        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)

        # Format for WebSocket notification
        sender = self.db.query(User).filter(User.id == user_id).first()

        message_notification = {
            "type": "new_message",
            "message": {
                "id": new_message.id,
                "conversation_id": conversation_id,
                "content": new_message.content,
                "sent_at": new_message.sent_at.isoformat(),
                "message_type": new_message.message_type,
                "metadata": message_data.metadata,
                "is_system_message": new_message.is_system_message,
                "sender": {
                    "id": sender.id,
                    "name": f"{sender.first_name} {sender.last_name}",
                    "is_driver": (
                        True
                        if conversation.ride
                        and conversation.ride.driver_id == sender.id
                        else False
                    ),
                },
            },
        }

        # Send real-time notification to all participants except sender
        await connection_manager.send_conversation_message(
            message_notification, conversation_id, exclude_user_id=user_id
        )

        return {
            "id": new_message.id,
            "conversation_id": conversation_id,
            "content": new_message.content,
            "sent_at": new_message.sent_at.isoformat(),
            "message_type": new_message.message_type,
            "metadata": message_data.metadata,
            "sender_id": user_id,
            "status": "sent",
        }

    def create_conversation(
        self, creator_id: int, data: ConversationCreate
    ) -> Dict[str, Any]:
        """
        Create a new conversation

        Args:
            creator_id: ID of the user creating the conversation
            data: Conversation creation data

        Returns:
            Details of the created conversation
        """
        # Validate that all participants exist
        all_participant_ids = set(data.participant_ids + [creator_id])
        existing_users = (
            self.db.query(User.id).filter(User.id.in_(all_participant_ids)).all()
        )
        existing_user_ids = {user.id for user in existing_users}

        if len(existing_user_ids) != len(all_participant_ids):
            missing = all_participant_ids - existing_user_ids
            raise HTTPException(
                status_code=400, detail=f"Some users do not exist: {missing}"
            )

        # For ride-related conversations, verify the ride exists
        if data.ride_id:
            ride = self.db.query(Ride).filter(Ride.id == data.ride_id).first()
            if not ride:
                raise HTTPException(status_code=404, detail="Ride not found")

            # Check if a conversation already exists for this ride
            existing_conv = (
                self.db.query(Conversation)
                .filter(Conversation.ride_id == data.ride_id)
                .first()
            )

            if existing_conv:
                # Add any missing participants
                current_participant_ids = {p.id for p in existing_conv.participants}
                missing_participants = existing_user_ids - current_participant_ids

                if missing_participants:
                    missing_users = (
                        self.db.query(User)
                        .filter(User.id.in_(missing_participants))
                        .all()
                    )
                    existing_conv.participants.extend(missing_users)
                    self.db.commit()

                # Return existing conversation
                return self._format_conversation(existing_conv, creator_id)

        # Create the conversation
        participants = (
            self.db.query(User).filter(User.id.in_(all_participant_ids)).all()
        )

        new_conversation = Conversation(
            title=data.title,
            ride_id=data.ride_id,
            conversation_type=data.conversation_type,
            created_at=datetime.utcnow(),
            is_active=True,
            participants=participants,
        )

        self.db.add(new_conversation)
        self.db.commit()
        self.db.refresh(new_conversation)

        # If it's a ride conversation, add a system message
        if data.ride_id and data.conversation_type == "ride":
            ride = self.db.query(Ride).filter(Ride.id == data.ride_id).first()
            welcome_message = Message(
                conversation_id=new_conversation.id,
                sender_id=creator_id,  # System messages use the creator as sender
                content=f"Welcome to the ride chat for your journey from {ride.starting_hub.name} to {ride.destination.name} on {ride.departure_time.strftime('%B %d, %Y')}.",
                sent_at=datetime.utcnow(),
                is_system_message=True,
            )
            self.db.add(welcome_message)
            self.db.commit()

        return self._format_conversation(new_conversation, creator_id)

    def create_or_get_direct_conversation(
        self, user_id: int, other_user_id: int
    ) -> Dict[str, Any]:
        """
        Get or create a direct conversation between two users

        Args:
            user_id: ID of the requesting user
            other_user_id: ID of the other user

        Returns:
            Conversation details
        """
        # Check if other user exists
        other_user = self.db.query(User).filter(User.id == other_user_id).first()
        if not other_user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if a direct conversation already exists
        existing_conv = (
            self.db.query(Conversation)
            .filter(
                Conversation.conversation_type == "direct",
                Conversation.participants.any(id=user_id),
                Conversation.participants.any(id=other_user_id),
                Conversation.is_active == True,
            )
            .first()
        )

        if existing_conv:
            return self._format_conversation(existing_conv, user_id)

        # Create new direct conversation
        participants = (
            self.db.query(User).filter(User.id.in_([user_id, other_user_id])).all()
        )

        new_conversation = Conversation(
            conversation_type="direct",
            created_at=datetime.utcnow(),
            is_active=True,
            participants=participants,
        )

        self.db.add(new_conversation)
        self.db.commit()
        self.db.refresh(new_conversation)

        return self._format_conversation(new_conversation, user_id)

    def create_ride_conversation(self, ride_id: int, creator_id: int) -> Dict[str, Any]:
        """
        Create or get a conversation for a specific ride

        Args:
            ride_id: ID of the ride
            creator_id: ID of the user creating the conversation

        Returns:
            Conversation details
        """
        # Check if ride exists
        ride = self.db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise HTTPException(status_code=404, detail="Ride not found")

        # Check if conversation already exists
        existing_conv = (
            self.db.query(Conversation)
            .filter(Conversation.ride_id == ride_id, Conversation.is_active == True)
            .first()
        )

        if existing_conv:
            # Make sure creator is a participant
            if not any(p.id == creator_id for p in existing_conv.participants):
                user = self.db.query(User).filter(User.id == creator_id).first()
                existing_conv.participants.append(user)
                self.db.commit()

            return self._format_conversation(existing_conv, creator_id)

        # Get all participants (driver + passengers)
        participant_ids = [ride.driver_id] if ride.driver_id else []

        # Add all passengers
        bookings = (
            self.db.query(RideBooking)
            .filter(RideBooking.ride_id == ride_id, RideBooking.status != "cancelled")
            .all()
        )

        passenger_ids = [booking.user_id for booking in bookings]
        participant_ids.extend(passenger_ids)

        # Make sure creator is included
        if creator_id not in participant_ids:
            participant_ids.append(creator_id)

        participants = self.db.query(User).filter(User.id.in_(participant_ids)).all()

        # Create conversation
        new_conversation = Conversation(
            title=f"Ride #{ride_id} Chat",
            ride_id=ride_id,
            conversation_type="ride",
            created_at=datetime.utcnow(),
            is_active=True,
            participants=participants,
        )

        self.db.add(new_conversation)
        self.db.commit()
        self.db.refresh(new_conversation)

        # Add welcome message
        welcome_message = Message(
            conversation_id=new_conversation.id,
            sender_id=creator_id,
            content=f"Welcome to the ride chat for your journey from {ride.starting_hub.name} to {ride.destination.name} on {ride.departure_time.strftime('%B %d, %Y')}.",
            sent_at=datetime.utcnow(),
            is_system_message=True,
        )
        self.db.add(welcome_message)
        self.db.commit()

        return self._format_conversation(new_conversation, creator_id)

    async def send_system_message(
        self, conversation_id: int, content: str
    ) -> Dict[str, Any]:
        """
        Send a system message to a conversation

        Args:
            conversation_id: ID of the conversation
            content: Message content

        Returns:
            Message details
        """
        conversation = (
            self.db.query(Conversation)
            .filter(Conversation.id == conversation_id)
            .first()
        )
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # Use first participant as "sender" for system messages
        sender_id = conversation.participants[0].id if conversation.participants else 1

        system_message = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=content,
            sent_at=datetime.utcnow(),
            is_system_message=True,
        )

        self.db.add(system_message)
        self.db.commit()
        self.db.refresh(system_message)

        # Notify all participants
        message_notification = {
            "type": "new_message",
            "message": {
                "id": system_message.id,
                "conversation_id": conversation_id,
                "content": content,
                "sent_at": system_message.sent_at.isoformat(),
                "message_type": "text",
                "is_system_message": True,
                "sender": {"id": sender_id, "name": "System", "is_driver": False},
            },
        }

        await connection_manager.send_conversation_message(
            message_notification, conversation_id
        )

        return {
            "id": system_message.id,
            "conversation_id": conversation_id,
            "content": content,
            "sent_at": system_message.sent_at.isoformat(),
            "is_system_message": True,
        }

    def _mark_messages_as_read(self, conversation_id: int, user_id: int) -> None:
        """Mark all unread messages from other users as read"""
        unread_messages = (
            self.db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.read_at == None,
            )
            .all()
        )

        read_time = datetime.utcnow()
        for message in unread_messages:
            message.read_at = read_time

        if unread_messages:
            self.db.commit()

    def _format_conversation(
        self, conversation: Conversation, user_id: int
    ) -> Dict[str, Any]:
        """Format conversation details for API response"""
        # Get latest message
        latest_message = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.sent_at.desc())
            .first()
        )

        # Get unread count
        unread_count = (
            self.db.query(Message)
            .filter(
                Message.conversation_id == conversation.id,
                Message.sender_id != user_id,
                Message.read_at == None,
            )
            .count()
        )

        # Format participants
        other_participants = [
            {
                "id": p.id,
                "name": f"{p.first_name} {p.last_name}",
                "is_driver": (
                    True
                    if conversation.ride and conversation.ride.driver_id == p.id
                    else False
                ),
            }
            for p in conversation.participants
            if p.id != user_id
        ]

        return {
            "id": conversation.id,
            "title": conversation.title
            or self._generate_conversation_title(conversation, user_id),
            "type": conversation.conversation_type,
            "created_at": conversation.created_at.isoformat(),
            "ride_id": conversation.ride_id,
            "participants_count": len(conversation.participants),
            "other_participants": other_participants,
            "unread_count": unread_count,
            "last_message": (
                {
                    "content": latest_message.content if latest_message else None,
                    "sender_id": latest_message.sender_id if latest_message else None,
                    "sent_at": (
                        latest_message.sent_at.isoformat() if latest_message else None
                    ),
                    "is_system_message": (
                        latest_message.is_system_message if latest_message else False
                    ),
                }
                if latest_message
                else None
            ),
        }

    def _generate_conversation_title(
        self, conversation: Conversation, user_id: int
    ) -> str:
        """Generate a title for a conversation based on participants"""
        if conversation.title:
            return conversation.title

        if conversation.ride_id:
            ride = conversation.ride
            return f"Ride from {ride.starting_hub.name} to {ride.destination.name}"

        if conversation.conversation_type == "direct":
            other_participant = next(
                (p for p in conversation.participants if p.id != user_id), None
            )
            if other_participant:
                return f"{other_participant.first_name} {other_participant.last_name}"

        # Fallback for group chats
        participant_names = [
            f"{p.first_name}" for p in conversation.participants if p.id != user_id
        ]
        if len(participant_names) > 2:
            return f"{participant_names[0]}, {participant_names[1]} and {len(participant_names) - 2} others"
        elif participant_names:
            return ", ".join(participant_names)
        else:
            return "New Conversation"
