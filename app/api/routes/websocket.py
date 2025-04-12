import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.security import validate_token
from app.core.websocket import manager
from app.db.session import get_db
from app.schemas.message import MessageCreate
from app.services.message_service import MessageService

router = APIRouter()


@router.websocket("/ws/{token}")
async def websocket_endpoint(
    websocket: WebSocket, token: str, db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time messaging

    Clients connect with their JWT token as a path parameter
    Messages are sent as JSON objects with the following structure:

    For new messages:
    {
        "type": "message",
        "conversation_id": 123,
        "content": "Hello!",
        "message_type": "text",
        "message_metadata": null
    }

    For typing indicators:
    {
        "type": "typing",
        "conversation_id": 123,
        "is_typing": true
    }

    For read receipts:
    {
        "type": "read_receipt",
        "message_id": 456
    }
    """
    # Validate the token and get the user
    try:
        user_id = validate_token(token)
        if not user_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Accept the connection and store it
    await manager.connect(websocket, user_id)

    try:
        # Process messages while the connection is active
        while True:
            # Wait for a message from the client
            data = await websocket.receive_text()

            try:
                message_data = json.loads(data)

                # Check message type
                if message_data.get("type") == "message":
                    # Create a new message
                    message_create = MessageCreate(
                        conversation_id=message_data.get("conversation_id"),
                        content=message_data.get("content"),
                        message_type=message_data.get("message_type", "text"),
                        message_metadata=message_data.get("message_metadata"),
                    )

                    # Save message to database
                    db_message = MessageService.create_message(
                        db=db, obj_in=message_create, sender_id=user_id
                    )

                    # Update conversation participants map
                    conversation = MessageService.get_conversation(
                        db=db, conversation_id=db_message.conversation_id
                    )
                    if conversation:
                        participant_ids = [p.id for p in conversation.participants]
                        manager.update_conversation_participants(
                            conversation_id=conversation.id,
                            participant_ids=participant_ids,
                        )

                    # Broadcast message to all participants
                    await manager.broadcast_to_conversation(
                        conversation_id=db_message.conversation_id,
                        message={
                            "type": "new_message",
                            "message": {
                                "id": db_message.id,
                                "conversation_id": db_message.conversation_id,
                                "sender_id": db_message.sender_id,
                                "content": db_message.content,
                                "message_type": db_message.message_type,
                                "message_metadata": db_message.message_metadata,
                                "sent_at": db_message.sent_at.isoformat(),
                                "read_at": None,
                                "is_system_message": db_message.is_system_message,
                            },
                        },
                    )

                elif message_data.get("type") == "typing":
                    # Broadcast typing indicator
                    conversation_id = message_data.get("conversation_id")
                    is_typing = message_data.get("is_typing", False)

                    # Update conversation participants map
                    conversation = MessageService.get_conversation(
                        db=db, conversation_id=conversation_id
                    )
                    if conversation:
                        participant_ids = [p.id for p in conversation.participants]
                        manager.update_conversation_participants(
                            conversation_id=conversation.id,
                            participant_ids=participant_ids,
                        )

                    # Broadcast typing indicator to all participants
                    await manager.broadcast_to_conversation(
                        conversation_id=conversation_id,
                        message={
                            "type": "typing_indicator",
                            "user_id": user_id,
                            "conversation_id": conversation_id,
                            "is_typing": is_typing,
                        },
                    )

                elif message_data.get("type") == "read_receipt":
                    # Mark message as read
                    message_id = message_data.get("message_id")

                    # Update in database
                    message = MessageService.mark_message_as_read(
                        db=db, message_id=message_id, user_id=user_id
                    )

                    if message:
                        # Broadcast read receipt to all participants
                        conversation = MessageService.get_conversation(
                            db=db, conversation_id=message.conversation_id
                        )
                        if conversation:
                            participant_ids = [p.id for p in conversation.participants]
                            manager.update_conversation_participants(
                                conversation_id=conversation.id,
                                participant_ids=participant_ids,
                            )

                        await manager.broadcast_to_conversation(
                            conversation_id=message.conversation_id,
                            message={
                                "type": "read_receipt",
                                "message_id": message_id,
                                "user_id": user_id,
                                "read_at": message.read_at.isoformat(),
                            },
                        )

            except json.JSONDecodeError:
                # Invalid JSON - ignore
                pass
            except Exception as e:
                # Log the error but don't disconnect
                print(f"Error processing message: {e}")

    except WebSocketDisconnect:
        # Handle disconnection
        manager.disconnect(websocket, user_id)
