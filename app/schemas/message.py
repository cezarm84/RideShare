from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# Participant info in conversation responses
class ParticipantInfo(BaseModel):
    id: int
    name: str
    is_driver: bool = False


# Message sender info
class MessageSenderInfo(BaseModel):
    id: int
    name: str
    is_driver: bool = False


# Last message preview in conversation list
class LastMessagePreview(BaseModel):
    content: Optional[str] = None
    sender_id: Optional[int] = None
    sent_at: Optional[str] = None
    is_system_message: bool = False


# Conversation schemas
class ConversationBase(BaseModel):
    title: Optional[str] = None
    ride_id: Optional[int] = None
    conversation_type: str = "direct"  # direct, ride, support


class ConversationCreate(ConversationBase):
    participant_ids: List[int] = Field(..., min_items=1)


class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None


# Schema for creating direct conversations
class DirectConversationRequest(BaseModel):
    other_user_id: int


class ConversationInDB(ConversationBase):
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        orm_mode = True


# Schema for conversation response
class ConversationResponse(ConversationInDB):
    participants_count: int
    other_participants: List[ParticipantInfo]
    unread_count: int
    last_message: Optional[LastMessagePreview] = None


# Schema for list of conversations
class ConversationList(BaseModel):
    conversations: List[ConversationResponse]
    count: int
    skip: int
    limit: int


# Message schemas
class MessageBase(BaseModel):
    content: str
    message_type: str = "text"  # text, location, image
    message_metadata: Optional[Dict[str, Any]] = None
    is_system_message: bool = False


class MessageCreate(MessageBase):
    conversation_id: int


class MessageUpdate(BaseModel):
    content: Optional[str] = None
    read_at: Optional[datetime] = None


class MessageInDB(MessageBase):
    id: int
    conversation_id: int
    sender_id: int
    sent_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class MessageResponse(MessageInDB):
    sender: Optional[MessageSenderInfo] = None


# Schema for list of messages
class MessageList(BaseModel):
    messages: List[MessageResponse]
    count: int
    conversation_id: int
    skip: int
    limit: int


# User message settings schemas
class UserMessageSettingsBase(BaseModel):
    notifications_enabled: bool = True
    sound_enabled: bool = True
    auto_delete_after_days: int = 30
    show_read_receipts: bool = True


class UserMessageSettingsUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None
    sound_enabled: Optional[bool] = None
    auto_delete_after_days: Optional[int] = None
    show_read_receipts: Optional[bool] = None


class UserMessageSettingsInDB(UserMessageSettingsBase):
    user_id: int

    class Config:
        orm_mode = True


# Schema for websocket message
class WebSocketMessage(BaseModel):
    type: str
    conversation_id: Optional[int] = None
    content: Optional[str] = None
    message_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
