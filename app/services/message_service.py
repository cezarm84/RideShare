from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.message import (
    Conversation,
    ConversationMessage as Message,
    UserMessageSettings,
    conversation_participants,
)
from app.models.user import User
from app.schemas.message import ConversationCreate, ConversationUpdate, MessageCreate


class MessageService:
    """Service for handling message and conversation operations"""

    @staticmethod
    def create_conversation(
        db: Session, obj_in: ConversationCreate, creator_id: int
    ) -> Conversation:
        """Create a new conversation"""
        db_obj = Conversation(
            title=obj_in.title,
            ride_id=obj_in.ride_id,
            created_at=datetime.utcnow(),
            is_active=True,
            conversation_type=obj_in.conversation_type,
        )

        # Add creator as participant
        creator = db.query(User).filter(User.id == creator_id).first()
        if creator:
            db_obj.participants.append(creator)

        # Add other participants
        if obj_in.participant_ids:
            participants = (
                db.query(User).filter(User.id.in_(obj_in.participant_ids)).all()
            )
            for participant in participants:
                if participant.id != creator_id:  # Avoid adding creator twice
                    db_obj.participants.append(participant)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_conversation(db: Session, conversation_id: int) -> Optional[Conversation]:
        """Get a conversation by ID"""
        return db.query(Conversation).filter(Conversation.id == conversation_id).first()

    @staticmethod
    def get_conversations_for_user(
        db: Session, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[Conversation]:
        """Get all conversations for a user"""
        return (
            db.query(Conversation)
            .join(conversation_participants)
            .filter(conversation_participants.c.user_id == user_id)
            .filter(Conversation.is_active == True)
            .order_by(desc(Conversation.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def update_conversation(
        db: Session, conversation_id: int, obj_in: ConversationUpdate
    ) -> Optional[Conversation]:
        """Update a conversation"""
        db_obj = (
            db.query(Conversation).filter(Conversation.id == conversation_id).first()
        )
        if not db_obj:
            return None

        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def add_participant(
        db: Session, conversation_id: int, user_id: int
    ) -> Optional[Conversation]:
        """Add a user to a conversation"""
        conversation = (
            db.query(Conversation).filter(Conversation.id == conversation_id).first()
        )
        if not conversation:
            return None

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Check if user is already a participant
        if user not in conversation.participants:
            conversation.participants.append(user)
            db.commit()
            db.refresh(conversation)

        return conversation

    @staticmethod
    def remove_participant(
        db: Session, conversation_id: int, user_id: int
    ) -> Optional[Conversation]:
        """Remove a user from a conversation"""
        conversation = (
            db.query(Conversation).filter(Conversation.id == conversation_id).first()
        )
        if not conversation:
            return None

        user = db.query(User).filter(User.id == user_id).first()
        if not user or user not in conversation.participants:
            return None

        conversation.participants.remove(user)
        db.commit()
        db.refresh(conversation)
        return conversation

    @staticmethod
    def create_message(db: Session, obj_in: MessageCreate, sender_id: int) -> Message:
        """Create a new message"""
        db_obj = Message(
            conversation_id=obj_in.conversation_id,
            sender_id=sender_id,
            content=obj_in.content,
            sent_at=datetime.utcnow(),
            message_type=obj_in.message_type,
            message_metadata=obj_in.message_metadata,
            is_system_message=obj_in.is_system_message,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_messages(
        db: Session, conversation_id: int, skip: int = 0, limit: int = 50
    ) -> List[Message]:
        """Get messages for a conversation"""
        return (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(desc(Message.sent_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def mark_message_as_read(
        db: Session, message_id: int, user_id: int
    ) -> Optional[Message]:
        """Mark a message as read by user"""
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message or message.sender_id == user_id:
            return None

        # Only mark as read if the user is a participant in the conversation
        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == message.conversation_id)
            .first()
        )
        if not conversation:
            return None

        user = db.query(User).filter(User.id == user_id).first()
        if not user or user not in conversation.participants:
            return None

        if message.read_at is None:
            message.read_at = datetime.utcnow()
            db.commit()
            db.refresh(message)

        return message

    @staticmethod
    def get_unread_messages_count(db: Session, user_id: int) -> int:
        """Get count of unread messages for a user"""
        # Query all conversations where the user is a participant
        user_conversations = (
            db.query(Conversation.id)
            .join(conversation_participants)
            .filter(conversation_participants.c.user_id == user_id)
            .filter(Conversation.is_active == True)
        )

        # Count unread messages in those conversations
        unread_count = (
            db.query(Message)
            .filter(Message.conversation_id.in_(user_conversations.subquery()))
            .filter(Message.sender_id != user_id)
            .filter(Message.read_at == None)
            .count()
        )

        return unread_count

    @staticmethod
    def get_user_message_settings(
        db: Session, user_id: int
    ) -> Optional[UserMessageSettings]:
        """Get message settings for a user"""
        settings = (
            db.query(UserMessageSettings)
            .filter(UserMessageSettings.user_id == user_id)
            .first()
        )

        # Create default settings if none exist
        if not settings:
            settings = UserMessageSettings(
                user_id=user_id,
                notifications_enabled=True,
                sound_enabled=True,
                auto_delete_after_days=30,
                show_read_receipts=True,
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)

        return settings

    @staticmethod
    def update_user_message_settings(
        db: Session, user_id: int, obj_in: Dict[str, Any]
    ) -> Optional[UserMessageSettings]:
        """Update message settings for a user"""
        settings = (
            db.query(UserMessageSettings)
            .filter(UserMessageSettings.user_id == user_id)
            .first()
        )

        # Create settings if they don't exist
        if not settings:
            settings = UserMessageSettings(user_id=user_id)
            db.add(settings)

        # Update fields
        for field, value in obj_in.items():
            if hasattr(settings, field) and value is not None:
                setattr(settings, field, value)

        db.commit()
        db.refresh(settings)
        return settings
