"""Enhanced notification service for the RideShare application."""

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import and_, desc, func
from sqlalchemy.orm import Session

from app.models.messaging import Message, MessageChannel, channel_members
from app.models.notification import Notification, NotificationType
from app.models.ride import Ride, RideBooking
from app.models.user import User
from app.services.websocket_service import broadcast_to_user

logger = logging.getLogger(__name__)


class EnhancedNotificationService:
    """Service for handling notifications."""

    def __init__(self, db: Session):
        self.db = db

    async def create_notification(
        self,
        user_id: int,
        type: NotificationType,
        title: str,
        content: str,
        link_to: Optional[str] = None,
        source_id: Optional[int] = None,
        meta_data: Optional[Dict[str, Any]] = None,
    ) -> Notification:
        """Create a new notification."""
        try:
            # Create notification
            notification = Notification(
                user_id=user_id,
                type=type,
                title=title,
                content=content,
                link_to=link_to,
                source_id=source_id,
                meta_data=json.dumps(meta_data) if meta_data else None,
            )

            self.db.add(notification)
            self.db.commit()
            self.db.refresh(notification)

            # Send real-time notification via WebSocket
            await self._send_realtime_notification(notification)

            return notification
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating notification: {str(e)}")
            raise

    async def create_message_notification(
        self, message_id: int, channel_id: int, sender_id: int
    ) -> List[Notification]:
        """Create notifications for a new message."""
        try:
            # Get message
            message = self.db.query(Message).filter(Message.id == message_id).first()
            if not message:
                logger.error(f"Message {message_id} not found")
                return []

            # Get channel
            channel = self.db.query(MessageChannel).filter(MessageChannel.id == channel_id).first()
            if not channel:
                logger.error(f"Channel {channel_id} not found")
                return []

            # Get sender
            sender = self.db.query(User).filter(User.id == sender_id).first()
            if not sender:
                logger.error(f"User {sender_id} not found")
                return []

            # Get channel members (excluding sender)
            members = self.db.query(User).join(
                channel_members,
                and_(
                    channel_members.c.user_id == User.id,
                    channel_members.c.channel_id == channel_id,
                    User.id != sender_id,
                ),
            ).all()

            notifications = []
            for member in members:
                # Create notification
                title = f"New message from {sender.first_name} {sender.last_name}"
                content = message.content[:100] + ("..." if len(message.content) > 100 else "")
                link_to = f"/messages/{channel_id}"

                meta_data = {
                    "channel_id": channel_id,
                    "message_id": message_id,
                    "sender_id": sender_id,
                    "sender_name": f"{sender.first_name} {sender.last_name}",
                    "channel_name": channel.name or f"Channel {channel_id}",
                    "channel_type": channel.channel_type,
                }

                notification = await self.create_notification(
                    user_id=member.id,
                    type=NotificationType.MESSAGE,
                    title=title,
                    content=content,
                    link_to=link_to,
                    source_id=message_id,
                    meta_data=meta_data,
                )

                notifications.append(notification)

            return notifications
        except Exception as e:
            logger.error(f"Error creating message notifications: {str(e)}")
            return []

    async def create_ride_notification(
        self, ride_id: int, title: str, content: str, user_ids: Optional[List[int]] = None
    ) -> List[Notification]:
        """Create notifications for a ride update."""
        try:
            # Get ride
            ride = self.db.query(Ride).filter(Ride.id == ride_id).first()
            if not ride:
                logger.error(f"Ride {ride_id} not found")
                return []

            # If user_ids not provided, get all passengers and driver
            if not user_ids:
                # Get driver
                driver_id = ride.driver_id

                # Get passengers
                bookings = self.db.query(RideBooking).filter(RideBooking.ride_id == ride_id).all()
                passenger_ids = [booking.passenger_id for booking in bookings]

                # Combine all user IDs
                user_ids = [driver_id] if driver_id else [] + passenger_ids

            notifications = []
            for user_id in user_ids:
                if not user_id:
                    continue

                # Create notification
                link_to = f"/rides/{ride_id}"

                meta_data = {
                    "ride_id": ride_id,
                    "ride_status": ride.status,
                    "ride_date": ride.scheduled_date.isoformat() if ride.scheduled_date else None,
                    "ride_time": ride.scheduled_time.isoformat() if ride.scheduled_time else None,
                }

                notification = await self.create_notification(
                    user_id=user_id,
                    type=NotificationType.RIDE,
                    title=title,
                    content=content,
                    link_to=link_to,
                    source_id=ride_id,
                    meta_data=meta_data,
                )

                notifications.append(notification)

            return notifications
        except Exception as e:
            logger.error(f"Error creating ride notifications: {str(e)}")
            return []

    async def create_system_notification(
        self, title: str, content: str, user_ids: List[int], link_to: Optional[str] = None
    ) -> List[Notification]:
        """Create system notifications for multiple users."""
        try:
            notifications = []
            for user_id in user_ids:
                # Create notification
                notification = await self.create_notification(
                    user_id=user_id,
                    type=NotificationType.SYSTEM,
                    title=title,
                    content=content,
                    link_to=link_to,
                )

                notifications.append(notification)

            return notifications
        except Exception as e:
            logger.error(f"Error creating system notifications: {str(e)}")
            return []

    async def create_driver_notification(
        self, driver_id: int, title: str, content: str, link_to: Optional[str] = None, meta_data: Optional[Dict[str, Any]] = None
    ) -> Notification:
        """Create a notification for a driver."""
        try:
            # Create notification
            notification = await self.create_notification(
                user_id=driver_id,
                type=NotificationType.DRIVER,
                title=title,
                content=content,
                link_to=link_to,
                meta_data=meta_data,
            )

            return notification
        except Exception as e:
            logger.error(f"Error creating driver notification: {str(e)}")
            raise

    async def create_enterprise_notification(
        self, enterprise_id: int, title: str, content: str, link_to: Optional[str] = None
    ) -> List[Notification]:
        """Create notifications for all users in an enterprise."""
        try:
            # Get all users in the enterprise
            users = self.db.query(User).filter(User.enterprise_id == enterprise_id).all()

            notifications = []
            for user in users:
                # Create notification
                meta_data = {
                    "enterprise_id": enterprise_id,
                }

                notification = await self.create_notification(
                    user_id=user.id,
                    type=NotificationType.ENTERPRISE,
                    title=title,
                    content=content,
                    link_to=link_to,
                    meta_data=meta_data,
                )

                notifications.append(notification)

            return notifications
        except Exception as e:
            logger.error(f"Error creating enterprise notifications: {str(e)}")
            return []

    def get_user_notifications(
        self, user_id: int, skip: int = 0, limit: int = 50, unread_only: bool = False
    ) -> Dict[str, Any]:
        """Get notifications for a user."""
        try:
            # Base query
            query = self.db.query(Notification).filter(Notification.user_id == user_id)

            # Filter by read status if requested
            if unread_only:
                query = query.filter(Notification.is_read == False)

            # Get total count
            total = query.count()

            # Get unread count
            unread = self.db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).count()

            # Get notifications with pagination
            notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

            return {
                "notifications": notifications,
                "total": total,
                "unread": unread,
            }
        except Exception as e:
            logger.error(f"Error getting user notifications: {str(e)}")
            return {
                "notifications": [],
                "total": 0,
                "unread": 0,
            }

    def get_notification(self, notification_id: int) -> Optional[Notification]:
        """Get a notification by ID."""
        try:
            return self.db.query(Notification).filter(Notification.id == notification_id).first()
        except Exception as e:
            logger.error(f"Error getting notification: {str(e)}")
            return None

    def mark_notification_as_read(self, notification_id: int, user_id: int) -> bool:
        """Mark a notification as read."""
        try:
            notification = self.db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id
            ).first()

            if not notification:
                return False

            notification.is_read = True
            self.db.commit()

            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error marking notification as read: {str(e)}")
            return False

    def mark_all_notifications_as_read(self, user_id: int) -> bool:
        """Mark all notifications for a user as read."""
        try:
            self.db.query(Notification).filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).update({"is_read": True})

            self.db.commit()

            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error marking all notifications as read: {str(e)}")
            return False

    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a notification."""
        try:
            notification = self.db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == user_id
            ).first()

            if not notification:
                return False

            self.db.delete(notification)
            self.db.commit()

            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting notification: {str(e)}")
            return False

    def get_unread_count(self, user_id: int) -> int:
        """Get the number of unread notifications for a user."""
        try:
            return self.db.query(func.count(Notification.id)).filter(
                Notification.user_id == user_id,
                Notification.is_read == False
            ).scalar() or 0
        except Exception as e:
            logger.error(f"Error getting unread count: {str(e)}")
            return 0

    async def _send_realtime_notification(self, notification: Notification) -> bool:
        """Send a real-time notification via WebSocket."""
        try:
            # Convert notification to dict
            notification_data = {
                "id": notification.id,
                "type": notification.type,
                "title": notification.title,
                "content": notification.content,
                "is_read": notification.is_read,
                "created_at": notification.created_at.isoformat(),
                "link_to": notification.link_to,
                "source_id": notification.source_id,
                "meta_data": json.loads(notification.meta_data) if notification.meta_data else None,
            }

            # Create WebSocket message
            message = {
                "type": "notification",
                "data": notification_data,
            }

            # Broadcast to user
            await broadcast_to_user(notification.user_id, message)

            return True
        except Exception as e:
            logger.error(f"Error sending real-time notification: {str(e)}")
            return False
