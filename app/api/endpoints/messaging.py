from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.dependencies import get_db, get_current_user, websocket_auth
from app.models.user import User
from app.schemas.message import (
    ConversationResponse, MessageResponse, MessageCreate, 
    ConversationCreate, ConversationList, MessageList,
    DirectConversationRequest
)
from app.services.messaging_service import MessagingService, connection_manager
import logging
import json

router = APIRouter()
logger = logging.getLogger(__name__)

#
# REST API Endpoints
#

@router.get("/conversations", response_model=ConversationList)
async def get_conversations(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all conversations for the current user
    """
    messaging_service = MessagingService(db)
    conversations = messaging_service.get_user_conversations(current_user.id, skip, limit)
    
    return {
        "conversations": conversations,
        "count": len(conversations),
        "skip": skip,
        "limit": limit
    }

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific conversation
    """
    messaging_service = MessagingService(db)
    
    try:
        # This checks permissions and returns formatted conversation
        conversation = messaging_service._format_conversation(
            messaging_service.db.query(messaging_service.Conversation)
            .filter(messaging_service.Conversation.id == conversation_id)
            .first(),
            current_user.id
        )
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving conversation")

@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new conversation
    """
    messaging_service = MessagingService(db)
    
    try:
        conversation = messaging_service.create_conversation(current_user.id, data)
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating conversation")

@router.post("/conversations/direct", response_model=ConversationResponse)
async def create_direct_conversation(
    data: DirectConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or get a direct conversation with another user
    """
    messaging_service = MessagingService(db)
    
    try:
        conversation = messaging_service.create_or_get_direct_conversation(
            current_user.id, 
            data.other_user_id
        )
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating direct conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating conversation")

@router.post("/conversations/ride/{ride_id}", response_model=ConversationResponse)
async def create_ride_conversation(
    ride_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or get a conversation for a specific ride
    """
    messaging_service = MessagingService(db)
    
    try:
        conversation = messaging_service.create_ride_conversation(ride_id, current_user.id)
        return conversation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating ride conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating conversation")

@router.get("/conversations/{conversation_id}/messages", response_model=MessageList)
async def get_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get messages for a specific conversation
    """
    messaging_service = MessagingService(db)
    
    try:
        messages = messaging_service.get_conversation_messages(
            conversation_id, 
            current_user.id, 
            skip, 
            limit
        )
        
        return {
            "messages": messages,
            "count": len(messages),
            "conversation_id": conversation_id,
            "skip": skip,
            "limit": limit
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting messages: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving messages")

@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message in a conversation
    """
    messaging_service = MessagingService(db)
    
    try:
        # Process message asynchronously to avoid blocking
        message = await messaging_service.send_message(
            current_user.id, 
            conversation_id, 
            message_data
        )
        return message
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {str(e)}")
        raise HTTPException(status_code=500, detail="Error sending message")

@router.post("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all messages in a conversation as read for the current user
    """
    messaging_service = MessagingService(db)
    
    try:
        messaging_service._mark_messages_as_read(conversation_id, current_user.id)
        return {"status": "success", "message": "All messages marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking messages as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Error updating message status")

@router.delete("/conversations/{conversation_id}")
async def leave_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Leave a conversation (hide it for the current user)
    """
    messaging_service = MessagingService(db)
    
    try:
        # Instead of deleting, we just remove the user as a participant
        # This preserves the conversation history for other participants
        success = messaging_service.remove_participant(conversation_id, current_user.id)
        
        if success:
            return {"status": "success", "message": "Left conversation successfully"}
        else:
            raise HTTPException(status_code=400, detail="Could not leave conversation")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leaving conversation: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing request")

#
# WebSocket Endpoints
#

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time messaging
    
    Connect with a valid JWT token as a query parameter:
    ws://example.com/api/messaging/ws?token=your.jwt.token
    """
    # Authenticate using the token
    user = await websocket_auth(token, db)
    
    if not user:
        await websocket.close(code=1008)  # Policy violation
        return
    
    # Accept the WebSocket connection
    await connection_manager.connect(websocket, user.id)
    
    try:
        while True:
            # Listen for messages from the client
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                message_type = message_data.get("type", "")
                
                # Process different message types
                if message_type == "ping":
                    # Simple ping-pong for connection liveliness
                    await websocket.send_text(json.dumps({"type": "pong"}))
                
                elif message_type == "join_conversation":
                    # Register user as active in this conversation for real-time updates
                    conversation_id = message_data.get("conversation_id")
                    if conversation_id:
                        connection_manager.register_conversation(user.id, conversation_id)
                        await websocket.send_text(json.dumps({
                            "type": "joined_conversation",
                            "conversation_id": conversation_id
                        }))
                
                elif message_type == "leave_conversation":
                    # Unregister user from conversation updates
                    conversation_id = message_data.get("conversation_id")
                    if conversation_id:
                        connection_manager.unregister_conversation(user.id, conversation_id)
                        await websocket.send_text(json.dumps({
                            "type": "left_conversation",
                            "conversation_id": conversation_id
                        }))
                
                elif message_type == "message":
                    # Send a new message
                    conversation_id = message_data.get("conversation_id")
                    content = message_data.get("content")
                    
                    if conversation_id and content:
                        messaging_service = MessagingService(db)
                        
                        # Create message model from websocket data
                        msg_create = MessageCreate(
                            content=content,
                            message_type=message_data.get("message_type", "text"),
                            metadata=message_data.get("metadata")
                        )
                        
                        # Send the message
                        sent_message = await messaging_service.send_message(
                            user.id,
                            conversation_id,
                            msg_create
                        )
                        
                        # Confirm to sender
                        await websocket.send_text(json.dumps({
                            "type": "message_sent",
                            "message": sent_message
                        }))
                
                elif message_type == "typing":
                    # User is typing indicator
                    conversation_id = message_data.get("conversation_id")
                    if conversation_id:
                        # Broadcast typing notification to other participants
                        await connection_manager.send_conversation_message(
                            {
                                "type": "user_typing",
                                "user_id": user.id,
                                "conversation_id": conversation_id
                            },
                            conversation_id,
                            exclude_user_id=user.id
                        )
            
            except json.JSONDecodeError:
                logger.error(f"Invalid WebSocket message format: {data}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid message format"
                }))
            
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {str(e)}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Error processing message"
                }))
    
    except WebSocketDisconnect:
        # Clean up when client disconnects
        connection_manager.disconnect(websocket, user.id)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        connection_manager.disconnect(websocket, user.id)