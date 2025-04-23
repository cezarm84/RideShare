"""API endpoints for the enhanced messaging system."""

import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field, validator
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

# Set up logging
logger = logging.getLogger(__name__)

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.messaging import (ChannelType, Message as EnhancedMessage, MessageChannel,
                                 MessageRead, MessageType, channel_members)
from app.models.notification import NotificationType
from app.models.user import User
from app.models.enterprise import Enterprise
from app.services.enhanced_notification_service import EnhancedNotificationService
from app.services.websocket_service import broadcast_to_channel, broadcast_to_user

router = APIRouter()


class MessageCreate(BaseModel):
    """Schema for creating a new message."""
    content: str
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: int
    channel_id: int
    sender_id: Optional[int]
    sender_name: Optional[str] = None
    message_type: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_edited: bool
    is_deleted: bool
    has_attachment: bool
    attachment_type: Optional[str] = None
    attachment_url: Optional[str] = None
    is_read: bool

    class Config:
        orm_mode = True


class ChannelResponse(BaseModel):
    """Schema for channel response."""
    id: int
    name: Optional[str] = None
    channel_type: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    ride_id: Optional[int] = None
    enterprise_id: Optional[int] = None
    description: Optional[str] = None
    member_count: int
    unread_count: int
    last_message: Optional[MessageResponse] = None

    class Config:
        orm_mode = True


class EnterpriseResponse(BaseModel):
    """Schema for enterprise response."""
    id: int
    name: str
    address: Optional[str] = None
    is_active: bool = True

    class Config:
        orm_mode = True


class CreateChannelRequest(BaseModel):
    """Schema for creating a new channel."""
    name: Optional[str] = None
    channel_type: ChannelType
    member_ids: List[int]
    ride_id: Optional[int] = None
    enterprise_id: Optional[int] = None
    description: Optional[str] = None
    initial_message: Optional[str] = None


@router.get("/channels", response_model=List[ChannelResponse])
async def get_user_channels(
    channel_type: Optional[str] = Query(None, description="Filter by channel type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all channels for the current user.
    """
    query = db.query(MessageChannel).join(
        channel_members,
        MessageChannel.id == channel_members.c.channel_id
    ).filter(
        channel_members.c.user_id == current_user.id,
        MessageChannel.is_active == True
    )

    if channel_type:
        query = query.filter(MessageChannel.channel_type == channel_type)

    channels = query.all()

    # Enhance channels with additional info
    result = []
    for channel in channels:
        # Get member count
        member_count = db.query(channel_members).filter(
            channel_members.c.channel_id == channel.id
        ).count()

        # Get unread count
        last_read_id = db.query(channel_members.c.last_read_message_id).filter(
            channel_members.c.channel_id == channel.id,
            channel_members.c.user_id == current_user.id
        ).scalar() or 0

        unread_count = db.query(EnhancedMessage).filter(
            EnhancedMessage.channel_id == channel.id,
            EnhancedMessage.id > last_read_id,
            EnhancedMessage.sender_id != current_user.id
        ).count()

        # Get last message
        last_message = db.query(EnhancedMessage).filter(
            EnhancedMessage.channel_id == channel.id,
            EnhancedMessage.is_deleted == False
        ).order_by(EnhancedMessage.created_at.desc()).first()

        last_message_data = None
        if last_message:
            # Check if message is read by current user
            is_read = db.query(MessageRead).filter(
                MessageRead.message_id == last_message.id,
                MessageRead.user_id == current_user.id
            ).first() is not None

            # Get sender name
            sender_name = None
            if last_message.sender_id:
                sender = db.query(User).filter(User.id == last_message.sender_id).first()
                if sender:
                    sender_name = f"{sender.first_name} {sender.last_name}"

            last_message_data = MessageResponse(
                id=last_message.id,
                channel_id=last_message.channel_id,
                sender_id=last_message.sender_id,
                sender_name=sender_name,
                message_type=last_message.message_type,
                content=last_message.content,
                created_at=last_message.created_at,
                updated_at=last_message.updated_at,
                is_edited=last_message.is_edited,
                is_deleted=last_message.is_deleted,
                has_attachment=last_message.has_attachment,
                attachment_type=last_message.attachment_type,
                attachment_url=last_message.attachment_url,
                is_read=is_read
            )

        result.append(ChannelResponse(
            id=channel.id,
            name=channel.name,
            channel_type=channel.channel_type,
            created_at=channel.created_at,
            updated_at=channel.updated_at,
            is_active=channel.is_active,
            ride_id=channel.ride_id,
            enterprise_id=channel.enterprise_id,
            description=channel.description,
            member_count=member_count,
            unread_count=unread_count,
            last_message=last_message_data
        ))

    return result


@router.get("/channels/{channel_id}", response_model=ChannelResponse)
async def get_channel(
    channel_id: int = Path(..., description="The ID of the channel to get"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific channel by ID.
    """
    # Check if user is a member of the channel
    is_member = db.query(channel_members).filter(
        channel_members.c.channel_id == channel_id,
        channel_members.c.user_id == current_user.id
    ).first() is not None

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this channel"
        )

    channel = db.query(MessageChannel).filter(
        MessageChannel.id == channel_id,
        MessageChannel.is_active == True
    ).first()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found"
        )

    # Get member count
    member_count = db.query(channel_members).filter(
        channel_members.c.channel_id == channel.id
    ).count()

    # Get unread count
    last_read_id = db.query(channel_members.c.last_read_message_id).filter(
        channel_members.c.channel_id == channel.id,
        channel_members.c.user_id == current_user.id
    ).scalar() or 0

    unread_count = db.query(EnhancedMessage).filter(
        EnhancedMessage.channel_id == channel.id,
        EnhancedMessage.id > last_read_id,
        EnhancedMessage.sender_id != current_user.id
    ).count()

    # Get last message
    last_message = db.query(EnhancedMessage).filter(
        EnhancedMessage.channel_id == channel.id,
        EnhancedMessage.is_deleted == False
    ).order_by(EnhancedMessage.created_at.desc()).first()

    last_message_data = None
    if last_message:
        # Check if message is read by current user
        is_read = db.query(MessageRead).filter(
            MessageRead.message_id == last_message.id,
            MessageRead.user_id == current_user.id
        ).first() is not None

        # Get sender name
        sender_name = None
        if last_message.sender_id:
            sender = db.query(User).filter(User.id == last_message.sender_id).first()
            if sender:
                sender_name = f"{sender.first_name} {sender.last_name}"

        last_message_data = MessageResponse(
            id=last_message.id,
            channel_id=last_message.channel_id,
            sender_id=last_message.sender_id,
            sender_name=sender_name,
            message_type=last_message.message_type,
            content=last_message.content,
            created_at=last_message.created_at,
            updated_at=last_message.updated_at,
            is_edited=last_message.is_edited,
            is_deleted=last_message.is_deleted,
            has_attachment=last_message.has_attachment,
            attachment_type=last_message.attachment_type,
            attachment_url=last_message.attachment_url,
            is_read=is_read
        )

    return ChannelResponse(
        id=channel.id,
        name=channel.name,
        channel_type=channel.channel_type,
        created_at=channel.created_at,
        updated_at=channel.updated_at,
        is_active=channel.is_active,
        ride_id=channel.ride_id,
        enterprise_id=channel.enterprise_id,
        description=channel.description,
        member_count=member_count,
        unread_count=unread_count,
        last_message=last_message_data
    )


@router.get("/channels/{channel_id}/messages", response_model=List[MessageResponse])
async def get_channel_messages(
    channel_id: int = Path(..., description="The ID of the channel to get messages for"),
    limit: int = Query(50, description="Maximum number of messages to return"),
    before_id: Optional[int] = Query(None, description="Get messages before this ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get messages for a specific channel.
    """
    # Check if user is a member of the channel
    is_member = db.query(channel_members).filter(
        channel_members.c.channel_id == channel_id,
        channel_members.c.user_id == current_user.id
    ).first() is not None

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this channel"
        )

    # Get messages
    query = db.query(EnhancedMessage).filter(
        EnhancedMessage.channel_id == channel_id,
        EnhancedMessage.is_deleted == False
    )

    if before_id:
        query = query.filter(EnhancedMessage.id < before_id)

    query = query.order_by(EnhancedMessage.created_at.desc()).limit(limit)

    messages = query.all()

    # Mark messages as read
    for message in messages:
        if message.sender_id != current_user.id:
            # Check if already read
            read = db.query(MessageRead).filter(
                MessageRead.message_id == message.id,
                MessageRead.user_id == current_user.id
            ).first()

            if not read:
                # Mark as read
                read = MessageRead(
                    message_id=message.id,
                    user_id=current_user.id
                )
                db.add(read)

    # Update last read message
    if messages:
        latest_message_id = max(message.id for message in messages)
        db.execute(
            channel_members.update().where(
                and_(
                    channel_members.c.channel_id == channel_id,
                    channel_members.c.user_id == current_user.id
                )
            ).values(
                last_read_message_id=latest_message_id
            )
        )

    db.commit()

    # Prepare response
    result = []
    for message in messages:
        # Get sender name
        sender_name = None
        if message.sender_id:
            sender = db.query(User).filter(User.id == message.sender_id).first()
            if sender:
                sender_name = f"{sender.first_name} {sender.last_name}"

        # Check if message is read by current user
        is_read = db.query(MessageRead).filter(
            MessageRead.message_id == message.id,
            MessageRead.user_id == current_user.id
        ).first() is not None

        result.append(MessageResponse(
            id=message.id,
            channel_id=message.channel_id,
            sender_id=message.sender_id,
            sender_name=sender_name,
            message_type=message.message_type,
            content=message.content,
            created_at=message.created_at,
            updated_at=message.updated_at,
            is_edited=message.is_edited,
            is_deleted=message.is_deleted,
            has_attachment=message.has_attachment,
            attachment_type=message.attachment_type,
            attachment_url=message.attachment_url,
            is_read=is_read
        ))

    # Return in chronological order
    return sorted(result, key=lambda x: x.created_at)


@router.post("/channels/{channel_id}/messages", response_model=MessageResponse)
async def create_message(
    channel_id: int = Path(..., description="The ID of the channel to create a message in"),
    message: MessageCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new message in a channel.
    """
    # Check if user is a member of the channel
    is_member = db.query(channel_members).filter(
        channel_members.c.channel_id == channel_id,
        channel_members.c.user_id == current_user.id
    ).first() is not None

    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this channel"
        )

    # Check if channel exists and is active
    channel = db.query(MessageChannel).filter(
        MessageChannel.id == channel_id,
        MessageChannel.is_active == True
    ).first()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found or inactive"
        )

    # Create message
    has_attachment = bool(message.attachment_url)

    new_message = EnhancedMessage(
        channel_id=channel_id,
        sender_id=current_user.id,
        message_type=MessageType.DIRECT,
        content=message.content,
        has_attachment=has_attachment,
        attachment_type=message.attachment_type if has_attachment else None,
        attachment_url=message.attachment_url if has_attachment else None
    )

    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # Mark as read by sender
    read = MessageRead(
        message_id=new_message.id,
        user_id=current_user.id
    )
    db.add(read)

    # Update channel's last read message for sender
    db.execute(
        channel_members.update().where(
            and_(
                channel_members.c.channel_id == channel_id,
                channel_members.c.user_id == current_user.id
            )
        ).values(
            last_read_message_id=new_message.id
        )
    )

    # Update channel's updated_at
    channel.updated_at = datetime.now(timezone.utc)

    db.commit()

    # Prepare response
    response = MessageResponse(
        id=new_message.id,
        channel_id=new_message.channel_id,
        sender_id=new_message.sender_id,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        message_type=new_message.message_type,
        content=new_message.content,
        created_at=new_message.created_at,
        updated_at=new_message.updated_at,
        is_edited=new_message.is_edited,
        is_deleted=new_message.is_deleted,
        has_attachment=new_message.has_attachment,
        attachment_type=new_message.attachment_type,
        attachment_url=new_message.attachment_url,
        is_read=True  # Always read by sender
    )

    # Broadcast message to all channel members
    logger.info(f"Broadcasting message {response.id} to channel {channel_id}")
    try:
        # Create the message payload
        message_payload = {
            "type": "new_message",
            "data": {
                "id": response.id,
                "channel_id": response.channel_id,
                "sender_id": response.sender_id,
                "sender_name": response.sender_name,
                "message_type": response.message_type,
                "content": response.content,
                "created_at": response.created_at.isoformat() if response.created_at else None,
                "updated_at": response.updated_at.isoformat() if response.updated_at else None,
                "is_edited": response.is_edited,
                "is_deleted": response.is_deleted,
                "has_attachment": response.has_attachment,
                "attachment_type": response.attachment_type,
                "attachment_url": response.attachment_url,
                "is_read": response.is_read
            }
        }

        # Log the message payload
        logger.info(f"Message payload: {message_payload}")

        # Broadcast the message
        # Determine whether to exclude the sender based on the message type
        # For direct messages, we want to send to all subscribers including the sender
        # For system messages, we might want to exclude the sender
        exclude_sender = False  # Set to True if you want to exclude the sender

        await broadcast_to_channel(
            channel_id=channel_id,
            message=message_payload,
            exclude_user_id=current_user.id if exclude_sender else None
        )
        logger.info(f"Successfully broadcast message {response.id} to channel {channel_id}")

        # Create notifications for channel members
        notification_service = EnhancedNotificationService(db)
        await notification_service.create_message_notification(
            message_id=new_message.id,
            channel_id=channel_id,
            sender_id=current_user.id
        )
        logger.info(f"Created notifications for message {response.id} in channel {channel_id}")
    except Exception as e:
        logger.error(f"Error broadcasting message {response.id} to channel {channel_id}: {str(e)}")

    return response


@router.post("/channels", response_model=dict)
async def create_channel(
    request: CreateChannelRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new message channel.
    """
    # Validate members
    members = db.query(User).filter(User.id.in_(request.member_ids)).all()
    if len(members) != len(request.member_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="One or more members not found"
        )

    # Create channel
    channel = MessageChannel(
        name=request.name,
        channel_type=request.channel_type,
        ride_id=request.ride_id,
        enterprise_id=request.enterprise_id,
        description=request.description
    )

    db.add(channel)
    db.flush()  # Get channel ID

    # Add members
    for member_id in request.member_ids:
        db.execute(
            channel_members.insert().values(
                channel_id=channel.id,
                user_id=member_id,
                is_admin=member_id == current_user.id  # Creator is channel admin
            )
        )

    # Add creator as member if not already included
    if current_user.id not in request.member_ids:
        db.execute(
            channel_members.insert().values(
                channel_id=channel.id,
                user_id=current_user.id,
                is_admin=True
            )
        )

    # Add initial message if provided
    if request.initial_message:
        message = EnhancedMessage(
            channel_id=channel.id,
            sender_id=current_user.id,
            message_type=MessageType.SYSTEM if request.channel_type == ChannelType.COMMUNITY else MessageType.DIRECT,
            content=request.initial_message
        )
        db.add(message)

    db.commit()

    return {
        "status": "success",
        "message": "Channel created successfully",
        "channel_id": channel.id
    }


@router.get("/enterprises", response_model=List[EnterpriseResponse])
async def get_enterprises(
    is_active: bool = Query(True, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all enterprises for channel creation.
    This endpoint is available to all authenticated users.
    """
    query = db.query(Enterprise)

    # Apply filters
    if is_active is not None:
        query = query.filter(Enterprise.is_active == is_active)

    enterprises = query.all()

    # Convert Enterprise objects to dictionaries for Pydantic validation
    result = []
    for enterprise in enterprises:
        enterprise_dict = {
            "id": enterprise.id,
            "name": getattr(enterprise, "name", ""),
            "address": getattr(enterprise, "address", None),
            "is_active": getattr(enterprise, "is_active", True),
        }
        result.append(enterprise_dict)

    return result


@router.delete("/channels/{channel_id}", response_model=dict)
async def delete_channel(
    channel_id: int = Path(..., description="The ID of the channel to delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a channel. Only channel admins can delete channels.
    This is a soft delete - the channel is marked as inactive but not removed from the database.
    """
    # Check if user is a member and admin of the channel
    member = db.query(channel_members).filter(
        channel_members.c.channel_id == channel_id,
        channel_members.c.user_id == current_user.id,
        channel_members.c.is_admin == True
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not an admin of this channel or the channel does not exist"
        )

    # Check if channel exists and is active
    channel = db.query(MessageChannel).filter(
        MessageChannel.id == channel_id,
        MessageChannel.is_active == True
    ).first()

    if not channel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Channel not found or already deleted"
        )

    # Soft delete the channel
    channel.is_active = False
    channel.updated_at = datetime.now(timezone.utc)

    # Add a system message about the deletion
    system_message = EnhancedMessage(
        channel_id=channel_id,
        sender_id=current_user.id,
        message_type=MessageType.SYSTEM,
        content=f"Channel deleted by {current_user.first_name} {current_user.last_name}"
    )
    db.add(system_message)

    db.commit()

    # Try to broadcast the deletion to all channel members
    try:
        message_payload = {
            "type": "channel_deleted",
            "data": {
                "channel_id": channel_id,
                "deleted_by": current_user.id,
                "deleted_at": datetime.now(timezone.utc).isoformat()
            }
        }

        await broadcast_to_channel(
            channel_id=channel_id,
            message=message_payload,
            exclude_user_id=None  # Send to all members
        )
    except Exception as e:
        logger.error(f"Error broadcasting channel deletion for channel {channel_id}: {str(e)}")

    return {
        "status": "success",
        "message": "Channel deleted successfully",
        "channel_id": channel_id
    }


@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the total count of unread messages across all channels.
    """
    # Get all channels the user is a member of
    user_channels = db.query(channel_members).filter(
        channel_members.c.user_id == current_user.id
    ).all()

    total_unread = 0

    for channel_member in user_channels:
        channel_id = channel_member.channel_id
        last_read_id = channel_member.last_read_message_id or 0

        # Count unread messages in this channel
        unread_count = db.query(EnhancedMessage).filter(
            EnhancedMessage.channel_id == channel_id,
            EnhancedMessage.id > last_read_id,
            EnhancedMessage.sender_id != current_user.id,
            EnhancedMessage.is_deleted == False
        ).count()

        total_unread += unread_count

    return {"count": total_unread}
