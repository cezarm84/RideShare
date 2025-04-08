import pytest
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.message import Conversation, Message, UserMessageSettings
from app.services.message_service import MessageService
from app.schemas.message import ConversationCreate, MessageCreate

# Sample data for tests
sample_conversation = ConversationCreate(
    title="Test Conversation",
    ride_id=None,
    conversation_type="direct",
    participant_ids=[2]  # Assuming user 2 exists
)

sample_message = MessageCreate(
    conversation_id=1,  # Will be set in the test
    content="Hello, this is a test message",
    message_type="text"
)


def test_create_conversation(db: Session, test_user: User):
    """Test creating a new conversation"""
    # Create a conversation
    conversation = MessageService.create_conversation(
        db=db,
        obj_in=sample_conversation,
        creator_id=test_user.id
    )
    
    # Check that the conversation was created
    assert conversation.id is not None
    assert conversation.title == sample_conversation.title
    assert conversation.conversation_type == sample_conversation.conversation_type
    
    # Check that the user is a participant
    assert test_user in conversation.participants
    
    # Clean up
    db.delete(conversation)
    db.commit()


def test_create_message(db: Session, test_user: User):
    """Test creating a new message"""
    # First create a conversation
    conversation = MessageService.create_conversation(
        db=db,
        obj_in=sample_conversation,
        creator_id=test_user.id
    )
    
    # Create a message
    message_create = MessageCreate(
        conversation_id=conversation.id,
        content="Hello, this is a test message",
        message_type="text"
    )
    
    message = MessageService.create_message(
        db=db,
        obj_in=message_create,
        sender_id=test_user.id
    )
    
    # Check that the message was created
    assert message.id is not None
    assert message.content == message_create.content
    assert message.conversation_id == conversation.id
    assert message.sender_id == test_user.id
    
    # Clean up
    db.delete(message)
    db.delete(conversation)
    db.commit()


def test_get_conversations_for_user(db: Session, test_user: User):
    """Test getting conversations for a user"""
    # Create a couple of conversations
    conversation1 = MessageService.create_conversation(
        db=db,
        obj_in=sample_conversation,
        creator_id=test_user.id
    )
    
    conversation2 = MessageService.create_conversation(
        db=db,
        obj_in=ConversationCreate(
            title="Another Test Conversation",
            conversation_type="direct",
            participant_ids=[2]
        ),
        creator_id=test_user.id
    )
    
    # Get conversations for the user
    conversations = MessageService.get_conversations_for_user(
        db=db,
        user_id=test_user.id
    )
    
    # Check that both conversations are returned
    assert len(conversations) >= 2
    assert conversation1.id in [c.id for c in conversations]
    assert conversation2.id in [c.id for c in conversations]
    
    # Clean up
    db.delete(conversation1)
    db.delete(conversation2)
    db.commit()


def test_mark_message_as_read(db: Session, test_user: User):
    """Test marking a message as read"""
    # Create another user for testing
    other_user = User(
        email="other@example.com",
        hashed_password="hashed_password",
        first_name="Other",
        last_name="User"
    )
    db.add(other_user)
    db.commit()
    
    # Create a conversation with both users
    conversation = MessageService.create_conversation(
        db=db,
        obj_in=ConversationCreate(
            title="Test Conversation",
            conversation_type="direct",
            participant_ids=[other_user.id]
        ),
        creator_id=test_user.id
    )
    
    # Create a message from the other user
    message = Message(
        conversation_id=conversation.id,
        sender_id=other_user.id,
        content="Hello, this is a test message",
        sent_at=datetime.utcnow(),
        message_type="text"
    )
    db.add(message)
    db.commit()
    
    # Mark the message as read
    updated_message = MessageService.mark_message_as_read(
        db=db,
        message_id=message.id,
        user_id=test_user.id
    )
    
    # Check that the message was marked as read
    assert updated_message is not None
    assert updated_message.read_at is not None
    
    # Clean up
    db.delete(message)
    db.delete(conversation)
    db.delete(other_user)
    db.commit()


def test_user_message_settings(db: Session, test_user: User):
    """Test user message settings"""
    # Get or create settings
    settings = MessageService.get_user_message_settings(
        db=db,
        user_id=test_user.id
    )
    
    # Check default values
    assert settings is not None
    assert settings.notifications_enabled is True
    assert settings.sound_enabled is True
    
    # Update settings
    updated_settings = MessageService.update_user_message_settings(
        db=db,
        user_id=test_user.id,
        obj_in={"notifications_enabled": False}
    )
    
    # Check updated values
    assert updated_settings.notifications_enabled is False
    assert updated_settings.sound_enabled is True  # Unchanged
    
    # Clean up
    db.delete(settings)
    db.commit()