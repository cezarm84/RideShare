from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time messaging"""
    
    def __init__(self):
        # Maps user_id to set of WebSocket connections
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Maps conversation_id to set of participant user_ids
        self.conversation_participants: Dict[int, Set[int]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Register a new WebSocket connection for a user"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a WebSocket connection for a user"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            logger.info(f"User {user_id} disconnected. Remaining connections: {len(self.active_connections)}")
    
    def update_conversation_participants(self, conversation_id: int, participant_ids: List[int]):
        """Update the map of conversation participants"""
        self.conversation_participants[conversation_id] = set(participant_ids)
    
    async def broadcast_to_conversation(self, conversation_id: int, message: dict):
        """Send a message to all participants in a conversation"""
        if conversation_id not in self.conversation_participants:
            logger.warning(f"No participants found for conversation {conversation_id}")
            return
        
        for user_id in self.conversation_participants[conversation_id]:
            await self.send_to_user(user_id, message)
    
    async def send_to_user(self, user_id: int, message: dict):
        """Send a message to a specific user across all their connections"""
        if user_id not in self.active_connections:
            return
        
        disconnected_websockets = set()
        
        for websocket in self.active_connections[user_id]:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.exception(f"Error sending message to user {user_id}: {e}")
                disconnected_websockets.add(websocket)
        
        # Clean up any disconnected websockets
        for websocket in disconnected_websockets:
            self.active_connections[user_id].discard(websocket)
        
        if not self.active_connections[user_id]:
            del self.active_connections[user_id]

# Global connection manager instance
manager = ConnectionManager()