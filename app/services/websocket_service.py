"""
WebSocket service for real-time messaging.
"""

import asyncio
import json
import logging
from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user_ws
from app.core.config import settings

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Connected WebSocket clients
connected_clients: Dict[int, Set[WebSocket]] = {}
# Channel subscriptions: {channel_id: {user_id1, user_id2, ...}}
channel_subscribers: Dict[int, Set[int]] = {}


async def connect_client(websocket: WebSocket, user_id: int):
    """Connect a WebSocket client"""
    await websocket.accept()

    if user_id not in connected_clients:
        connected_clients[user_id] = set()
        logger.info(f"Created new connection set for user {user_id}")

    connected_clients[user_id].add(websocket)
    logger.info(f"User {user_id} connected. Total connections: {len(connected_clients[user_id])}")


async def disconnect_client(websocket: WebSocket, user_id: int):
    """Disconnect a WebSocket client"""
    if user_id in connected_clients:
        connected_clients[user_id].discard(websocket)
        logger.info(f"Disconnected a WebSocket for user {user_id}")

        if not connected_clients[user_id]:
            del connected_clients[user_id]
            logger.info(f"User {user_id} has no more active connections")


async def subscribe_to_channel(user_id: int, channel_id: int):
    """Subscribe a user to a channel"""
    # Convert to int to ensure type consistency
    user_id = int(user_id)
    channel_id = int(channel_id)

    if channel_id not in channel_subscribers:
        channel_subscribers[channel_id] = set()
        logger.info(f"Created new subscriber set for channel {channel_id}")

    channel_subscribers[channel_id].add(user_id)
    logger.info(f"User {user_id} subscribed to channel {channel_id}")
    logger.debug(f"Channel {channel_id} subscribers: {channel_subscribers[channel_id]}")


async def unsubscribe_from_channel(user_id: int, channel_id: int):
    """Unsubscribe a user from a channel"""
    # Convert to int to ensure type consistency
    user_id = int(user_id)
    channel_id = int(channel_id)

    if channel_id in channel_subscribers:
        channel_subscribers[channel_id].discard(user_id)
        logger.info(f"User {user_id} unsubscribed from channel {channel_id}")

        if not channel_subscribers[channel_id]:
            del channel_subscribers[channel_id]
            logger.info(f"Channel {channel_id} has no more subscribers")


async def broadcast_to_channel(channel_id: int, message: Dict[str, Any], exclude_user_id: Optional[int] = None):
    """Broadcast a message to all subscribers of a channel"""
    # Convert channel_id to int to ensure type consistency
    channel_id = int(channel_id)

    logger.info(f"Broadcasting to channel {channel_id}, message type: {message.get('type')}")
    logger.debug(f"Message content: {message}")
    logger.debug(f"Current channel subscribers: {channel_subscribers}")
    logger.debug(f"Connected clients: {list(connected_clients.keys())}")

    # Check if the channel has any subscribers
    if channel_id not in channel_subscribers:
        logger.warning(f"No subscribers found for channel {channel_id}")
        return

    subscribers_count = len(channel_subscribers[channel_id])
    logger.info(f"Found {subscribers_count} subscribers for channel {channel_id}")

    # Create a copy of the subscribers set to avoid modification during iteration
    subscribers = list(channel_subscribers[channel_id])

    # Prepare the message JSON once
    message_json = json.dumps(message)
    logger.debug(f"Prepared message JSON: {message_json[:100]}...")

    # Track successful deliveries
    successful_deliveries = 0

    # Send to each subscriber
    for user_id in subscribers:
        # Skip the sender if specified
        if exclude_user_id and user_id == exclude_user_id:
            logger.debug(f"Skipping excluded user {user_id}")
            continue

        logger.info(f"Attempting to send to user {user_id}")
        if user_id in connected_clients:
            connections_count = len(connected_clients[user_id])
            logger.debug(f"Found {connections_count} connections for user {user_id}")

            # Create a copy of the connections set to avoid modification during iteration
            connections = list(connected_clients[user_id])

            # Send to all client connections for this user
            for websocket in connections:
                try:
                    logger.debug(f"Sending message to user {user_id}: {message_json[:100]}...")
                    await websocket.send_text(message_json)
                    logger.info(f"Message sent successfully to user {user_id}")
                    successful_deliveries += 1
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {str(e)}")
                    # Handle disconnected clients
                    await disconnect_client(websocket, user_id)
        else:
            logger.warning(f"User {user_id} has no active connections")

    logger.info(f"Broadcast complete: {successful_deliveries} successful deliveries out of {subscribers_count} subscribers")


async def broadcast_to_user(user_id: int, message: Dict[str, Any]):
    """Broadcast a message to a specific user"""
    # Convert user_id to int to ensure type consistency
    user_id = int(user_id)

    logger.info(f"Broadcasting to user {user_id}, message type: {message.get('type')}")
    logger.debug(f"Message content: {message}")

    # Prepare the message JSON once
    message_json = json.dumps(message)
    logger.debug(f"Prepared message JSON: {message_json[:100]}...")

    # Track successful deliveries
    successful_deliveries = 0

    # Send to the user
    if user_id in connected_clients:
        connections_count = len(connected_clients[user_id])
        logger.debug(f"Found {connections_count} connections for user {user_id}")

        # Create a copy of the connections set to avoid modification during iteration
        connections = list(connected_clients[user_id])

        # Send to all client connections for this user
        for websocket in connections:
            try:
                logger.debug(f"Sending message to user {user_id}: {message_json[:100]}...")
                await websocket.send_text(message_json)
                logger.info(f"Message sent successfully to user {user_id}")
                successful_deliveries += 1
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {str(e)}")
                # Handle disconnected clients
                await disconnect_client(websocket, user_id)

        logger.info(f"Broadcast complete: {successful_deliveries} successful deliveries out of {connections_count} connections")
    else:
        logger.warning(f"User {user_id} has no active connections")


async def handle_websocket_connection(
    websocket: WebSocket,
    user: User = Depends(get_current_user_ws),
    # db parameter is kept for compatibility but not used
    db: Session = Depends(get_db),
):
    """Handle a WebSocket connection"""
    logger.info(f"New WebSocket connection from user {user.id} ({user.email})")
    await connect_client(websocket, user.id)

    try:
        while True:
            # Wait for messages from the client
            data = await websocket.receive_text()
            logger.debug(f"Received WebSocket message from user {user.id}: {data[:100]}")

            try:
                message_data = json.loads(data)
                message_type = message_data.get("type")

                if message_type == "subscribe":
                    # Subscribe to a channel
                    channel_id = message_data.get("channel_id")
                    if channel_id:
                        await subscribe_to_channel(user.id, channel_id)
                        await websocket.send_text(json.dumps({
                            "type": "subscribed",
                            "channel_id": channel_id
                        }))
                        logger.debug(f"Sent subscription confirmation for channel {channel_id} to user {user.id}")

                elif message_type == "unsubscribe":
                    # Unsubscribe from a channel
                    channel_id = message_data.get("channel_id")
                    if channel_id:
                        await unsubscribe_from_channel(user.id, channel_id)
                        await websocket.send_text(json.dumps({
                            "type": "unsubscribed",
                            "channel_id": channel_id
                        }))
                        logger.debug(f"Sent unsubscription confirmation for channel {channel_id} to user {user.id}")

                elif message_type == "ping":
                    # Respond to ping with pong
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": message_data.get("timestamp")
                    }))
                    logger.debug(f"Sent pong response to user {user.id}")

            except json.JSONDecodeError:
                # Invalid JSON, ignore
                logger.warning(f"Received invalid JSON from user {user.id}: {data[:100]}")
                pass

    except WebSocketDisconnect:
        # Client disconnected
        logger.info(f"WebSocket disconnected for user {user.id}")
        await disconnect_client(websocket, user.id)

    except Exception as e:
        # Other errors
        logger.error(f"WebSocket error for user {user.id}: {str(e)}")
        await disconnect_client(websocket, user.id)
