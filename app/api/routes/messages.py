from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.message import (
    ConversationCreate,
    ConversationInDB,
    ConversationUpdate,
    MessageCreate,
    MessageInDB,
    UserMessageSettingsInDB,
    UserMessageSettingsUpdate,
)
from app.services.message_service import MessageService

router = APIRouter()


# Conversation endpoints
@router.post(
    "/conversations/",
    response_model=ConversationInDB,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation(
    conversation_in: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create a new conversation.
    """
    conversation = MessageService.create_conversation(
        db=db, obj_in=conversation_in, creator_id=current_user.id
    )
    return conversation


@router.get("/conversations/", response_model=List[ConversationInDB])
def get_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all conversations for the current user.
    """
    conversations = MessageService.get_conversations_for_user(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationInDB)
def get_conversation(
    conversation_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get a specific conversation by ID.
    """
    conversation = MessageService.get_conversation(
        db=db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )

    # Check if user is a participant
    if current_user not in conversation.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation",
        )

    return conversation


@router.patch("/conversations/{conversation_id}", response_model=ConversationInDB)
def update_conversation(
    conversation_in: ConversationUpdate,
    conversation_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a conversation.
    """
    conversation = MessageService.get_conversation(
        db=db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )

    # Check if user is a participant
    if current_user not in conversation.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation",
        )

    updated_conversation = MessageService.update_conversation(
        db=db, conversation_id=conversation_id, obj_in=conversation_in
    )
    return updated_conversation


@router.post(
    "/conversations/{conversation_id}/participants/{user_id}",
    response_model=ConversationInDB,
)
def add_participant(
    conversation_id: int = Path(..., gt=0),
    user_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Add a participant to a conversation.
    """
    conversation = MessageService.get_conversation(
        db=db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )

    # Check if user is a participant
    if current_user not in conversation.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation",
        )

    updated_conversation = MessageService.add_participant(
        db=db, conversation_id=conversation_id, user_id=user_id
    )

    if not updated_conversation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not add user to conversation",
        )

    return updated_conversation


@router.delete(
    "/conversations/{conversation_id}/participants/{user_id}",
    response_model=ConversationInDB,
)
def remove_participant(
    conversation_id: int = Path(..., gt=0),
    user_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Remove a participant from a conversation.
    """
    conversation = MessageService.get_conversation(
        db=db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )

    # Check if user is a participant
    if current_user not in conversation.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation",
        )

    updated_conversation = MessageService.remove_participant(
        db=db, conversation_id=conversation_id, user_id=user_id
    )

    if not updated_conversation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not remove user from conversation",
        )

    return updated_conversation


# Message endpoints
@router.post(
    "/messages/", response_model=MessageInDB, status_code=status.HTTP_201_CREATED
)
def create_message(
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create a new message.
    """
    # Check if the conversation exists and user is a participant
    conversation = MessageService.get_conversation(
        db=db, conversation_id=message_in.conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )

    if current_user not in conversation.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation",
        )

    message = MessageService.create_message(
        db=db, obj_in=message_in, sender_id=current_user.id
    )
    return message


@router.get(
    "/conversations/{conversation_id}/messages/", response_model=List[MessageInDB]
)
def get_messages(
    conversation_id: int = Path(..., gt=0),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Get messages for a conversation.
    """
    # Check if the conversation exists and user is a participant
    conversation = MessageService.get_conversation(
        db=db, conversation_id=conversation_id
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found"
        )

    if current_user not in conversation.participants:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a participant in this conversation",
        )

    messages = MessageService.get_messages(
        db=db, conversation_id=conversation_id, skip=skip, limit=limit
    )
    return messages


@router.patch("/messages/{message_id}/read", response_model=MessageInDB)
def mark_message_as_read(
    message_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Mark a message as read.
    """
    message = MessageService.mark_message_as_read(
        db=db, message_id=message_id, user_id=current_user.id
    )

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or you don't have permission to mark it as read",
        )

    return message


@router.get("/messages/unread/count", response_model=int)
def get_unread_messages_count(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get count of unread messages for the current user.
    """
    count = MessageService.get_unread_messages_count(db=db, user_id=current_user.id)
    return count


# User message settings endpoints
@router.get("/settings", response_model=UserMessageSettingsInDB)
def get_message_settings(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get message settings for the current user.
    """
    settings = MessageService.get_user_message_settings(db=db, user_id=current_user.id)
    return settings


@router.patch("/settings", response_model=UserMessageSettingsInDB)
def update_message_settings(
    settings_in: UserMessageSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update message settings for the current user.
    """
    settings = MessageService.update_user_message_settings(
        db=db, user_id=current_user.id, obj_in=settings_in.dict(exclude_unset=True)
    )
    return settings
