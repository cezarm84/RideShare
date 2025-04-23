"""Admin endpoints for the enhanced messaging system."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user
from app.db.session import get_db
from app.models.messaging import (ChannelType, Message as EnhancedMessage, MessageChannel,
                                 MessageRead, MessageType, channel_members)
from app.models.ride import Ride, RideBooking
from app.models.user import User

router = APIRouter()


class CreateChannelRequest(BaseModel):
    """Schema for creating a new channel by admin."""
    name: Optional[str] = None
    channel_type: ChannelType
    member_ids: List[int]
    ride_id: Optional[int] = None
    enterprise_id: Optional[int] = None
    description: Optional[str] = None
    initial_message: Optional[str] = None


@router.post("/channels", response_model=dict)
async def create_channel(
    request: CreateChannelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
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
                is_admin=member_id == current_user.id  # Admin is channel admin
            )
        )

    # Add admin as member if not already included
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


@router.get("/driver-channels/{driver_id}", response_model=List[dict])
async def get_driver_channels(
    driver_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Get all channels for a specific driver.
    """
    # Check if driver exists
    driver = db.query(User).filter(User.id == driver_id, User.user_type == "driver").first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    # Get channels where driver is a member
    channels = db.query(MessageChannel).join(
        channel_members,
        MessageChannel.id == channel_members.c.channel_id
    ).filter(
        channel_members.c.user_id == driver_id,
        MessageChannel.is_active == True
    ).all()

    result = []
    for channel in channels:
        # Get other members
        members = db.query(User).join(
            channel_members,
            User.id == channel_members.c.user_id
        ).filter(
            channel_members.c.channel_id == channel.id,
            User.id != driver_id
        ).all()

        # Get last message
        last_message = db.query(EnhancedMessage).filter(
            EnhancedMessage.channel_id == channel.id,
            EnhancedMessage.is_deleted == False
        ).order_by(EnhancedMessage.created_at.desc()).first()

        result.append({
            "id": channel.id,
            "name": channel.name,
            "channel_type": channel.channel_type,
            "created_at": channel.created_at,
            "updated_at": channel.updated_at,
            "members": [{"id": m.id, "name": f"{m.first_name} {m.last_name}"} for m in members],
            "last_message": {
                "content": last_message.content,
                "created_at": last_message.created_at,
                "sender_id": last_message.sender_id
            } if last_message else None
        })

    return result


@router.post("/send-to-driver/{driver_id}", response_model=dict)
async def send_message_to_driver(
    driver_id: int = Path(...),
    message: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Send a message to a driver.
    """
    # Check if driver exists
    driver = db.query(User).filter(User.id == driver_id, User.user_type == "driver").first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    # Check if channel exists between admin and driver
    channel = db.query(MessageChannel).join(
        channel_members,
        MessageChannel.id == channel_members.c.channel_id
    ).filter(
        channel_members.c.user_id == driver_id,
        MessageChannel.channel_type == ChannelType.ADMIN_DRIVER,
        MessageChannel.is_active == True
    ).first()

    # Create channel if it doesn't exist
    if not channel:
        channel = MessageChannel(
            name=f"Admin - {driver.first_name} {driver.last_name}",
            channel_type=ChannelType.ADMIN_DRIVER
        )
        db.add(channel)
        db.flush()  # Get channel ID

        # Add members
        db.execute(
            channel_members.insert().values(
                channel_id=channel.id,
                user_id=driver_id,
                is_admin=False
            )
        )

        db.execute(
            channel_members.insert().values(
                channel_id=channel.id,
                user_id=current_user.id,
                is_admin=True
            )
        )

    # Create message
    new_message = EnhancedMessage(
        channel_id=channel.id,
        sender_id=current_user.id,
        message_type=MessageType.DIRECT,
        content=message.get("content", "")
    )

    db.add(new_message)

    # Update channel's updated_at
    channel.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {
        "status": "success",
        "message": "Message sent successfully",
        "channel_id": channel.id,
        "message_id": new_message.id
    }


@router.post("/create-ride-channel/{ride_id}", response_model=dict)
async def create_ride_channel(
    ride_id: int = Path(...),
    initial_message: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Create a chat channel for a ride.
    """
    # Check if ride exists
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ride not found"
        )

    # Check if channel already exists
    existing_channel = db.query(MessageChannel).filter_by(ride_id=ride_id).first()
    if existing_channel:
        return {
            "status": "success",
            "message": "Channel already exists",
            "channel_id": existing_channel.id
        }

    # Create channel
    channel = MessageChannel(
        name=f"Ride #{ride_id}",
        channel_type=ChannelType.RIDE,
        ride_id=ride_id
    )

    db.add(channel)
    db.flush()  # Get channel ID

    # Add driver if assigned
    if ride.driver_id:
        db.execute(
            channel_members.insert().values(
                channel_id=channel.id,
                user_id=ride.driver_id,
                is_admin=True
            )
        )

    # Add passengers
    bookings = db.query(RideBooking).filter(RideBooking.ride_id == ride_id).all()
    for booking in bookings:
        db.execute(
            channel_members.insert().values(
                channel_id=channel.id,
                user_id=booking.passenger_id,
                is_admin=False
            )
        )

    # Add admin
    db.execute(
        channel_members.insert().values(
            channel_id=channel.id,
            user_id=current_user.id,
            is_admin=True
        )
    )

    # Add initial message
    message_content = initial_message or f"Welcome to the chat for ride #{ride_id}. Use this channel to communicate with other passengers and the driver."
    message = EnhancedMessage(
        channel_id=channel.id,
        sender_id=current_user.id,
        message_type=MessageType.SYSTEM,
        content=message_content
    )
    db.add(message)

    # Update ride with channel ID
    ride.chat_channel_id = channel.id

    db.commit()

    return {
        "status": "success",
        "message": "Ride channel created successfully",
        "channel_id": channel.id
    }


@router.post("/create-enterprise-channel/{enterprise_id}", response_model=dict)
async def create_enterprise_channel(
    enterprise_id: int = Path(...),
    name: str = Query(...),
    description: Optional[str] = Query(None),
    initial_message: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Create a chat channel for an enterprise.
    """
    # Check if enterprise exists
    from app.models.user import Enterprise
    enterprise = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enterprise not found"
        )

    # Create channel
    channel = MessageChannel(
        name=name,
        channel_type=ChannelType.ENTERPRISE,
        enterprise_id=enterprise_id,
        description=description
    )

    db.add(channel)
    db.flush()  # Get channel ID

    # Add enterprise users
    enterprise_users = db.query(User).filter_by(enterprise_id=enterprise_id).all()
    for user in enterprise_users:
        db.execute(
            channel_members.insert().values(
                channel_id=channel.id,
                user_id=user.id,
                is_admin=False
            )
        )

    # Add admin
    db.execute(
        channel_members.insert().values(
            channel_id=channel.id,
            user_id=current_user.id,
            is_admin=True
        )
    )

    # Add initial message
    if initial_message:
        message = EnhancedMessage(
            channel_id=channel.id,
            sender_id=current_user.id,
            message_type=MessageType.SYSTEM,
            content=initial_message
        )
        db.add(message)

    db.commit()

    return {
        "status": "success",
        "message": "Enterprise channel created successfully",
        "channel_id": channel.id
    }


@router.post("/create-community-forum", response_model=dict)
async def create_community_forum(
    name: str = Query(...),
    description: str = Query(...),
    initial_message: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Create a community forum.
    """
    # Create channel
    channel = MessageChannel(
        name=name,
        channel_type=ChannelType.COMMUNITY,
        description=description
    )

    db.add(channel)
    db.flush()  # Get channel ID

    # Add admin
    db.execute(
        channel_members.insert().values(
            channel_id=channel.id,
            user_id=current_user.id,
            is_admin=True
        )
    )

    # Add initial message
    message_content = initial_message or f"Welcome to the {name} forum! This is a community space for discussion."
    message = EnhancedMessage(
        channel_id=channel.id,
        sender_id=current_user.id,
        message_type=MessageType.SYSTEM,
        content=message_content
    )
    db.add(message)

    db.commit()

    return {
        "status": "success",
        "message": "Community forum created successfully",
        "channel_id": channel.id
    }


@router.delete("/channels/{channel_id}", response_model=dict)
async def delete_channel(
    channel_id: int = Path(..., description="The ID of the channel to delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Delete a channel. Admin users can delete any channel.
    This is a soft delete - the channel is marked as inactive but not removed from the database.
    """
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
        content=f"Channel deleted by admin: {current_user.first_name} {current_user.last_name}"
    )
    db.add(system_message)

    db.commit()

    # Try to broadcast the deletion to all channel members
    try:
        from app.services.websocket_service import broadcast_to_channel

        message_payload = {
            "type": "channel_deleted",
            "data": {
                "channel_id": channel_id,
                "deleted_by": current_user.id,
                "deleted_at": datetime.now(timezone.utc).isoformat(),
                "is_admin_deletion": True
            }
        }

        await broadcast_to_channel(
            channel_id=channel_id,
            message=message_payload,
            exclude_user_id=None  # Send to all members
        )
    except Exception as e:
        # Just log the error, don't fail the request
        print(f"Error broadcasting channel deletion for channel {channel_id}: {str(e)}")

    return {
        "status": "success",
        "message": "Channel deleted successfully",
        "channel_id": channel_id
    }
