# Real-Time Messaging System

The RideShare platform features a comprehensive real-time messaging system that enables communication between users, drivers, admins, and the AI chatbot.

## Overview

The messaging system provides:

- **Real-Time Communication** via WebSocket connections
- **Multi-Channel Support** for different conversation types
- **Message Types** including text, system messages, and media
- **Channel Management** with automatic cleanup
- **Integration with Chatbot** for seamless AI-to-human escalation

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   WebSocket     │    │   Message       │
│   Chat UI       │◄──►│   Service       │◄──►│   Channels      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   - Messages    │
                       │   - Channels    │
                       │   - Participants│
                       └─────────────────┘
```

### WebSocket Service (`app/services/websocket_service.py`)

Handles real-time connections:

- **Connection Management** with automatic cleanup
- **Channel Subscriptions** for targeted message delivery
- **Broadcast Functionality** to multiple users
- **Error Handling** with reconnection support

### Messaging API (`app/api/endpoints/messaging.py`)

Provides REST endpoints for:

- **Channel Creation** and management
- **Message History** retrieval
- **Participant Management** for channels
- **Channel Settings** and configuration

## Channel Types

### Support Channels (`ChannelType.SUPPORT`)
- **Purpose**: Customer support conversations
- **Participants**: User + Admin/Support Agent
- **Auto-Deletion**: 1 hour after creation
- **Features**: Chatbot escalation, priority handling

### Driver Channels (`ChannelType.DRIVER`)
- **Purpose**: Driver-specific communications
- **Participants**: Drivers + Admins
- **Persistence**: Long-term storage
- **Features**: Work schedules, announcements, support

### Enterprise Channels (`ChannelType.ENTERPRISE`)
- **Purpose**: Business customer communications
- **Participants**: Enterprise users + Account managers
- **Persistence**: Long-term with audit trail
- **Features**: Billing discussions, service planning

### Community Channels (`ChannelType.COMMUNITY`)
- **Purpose**: General user discussions
- **Participants**: All users (moderated)
- **Persistence**: Long-term storage
- **Features**: Announcements, community updates

## Message Types

### Text Messages (`MessageType.TEXT`)
```json
{
  "type": "text",
  "content": "Hello, I need help with my booking",
  "timestamp": "2024-12-07T10:30:00Z"
}
```

### System Messages (`MessageType.SYSTEM`)
```json
{
  "type": "system",
  "content": "User has been connected to support agent",
  "timestamp": "2024-12-07T10:30:00Z"
}
```

### Media Messages (`MessageType.MEDIA`)
```json
{
  "type": "media",
  "content": "Screenshot of booking issue",
  "media_url": "/uploads/screenshot.png",
  "media_type": "image/png"
}
```

## WebSocket Protocol

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/messaging/ws?token=jwt_token');
```

### Message Format
```json
{
  "type": "message",
  "conversation_id": 123,
  "content": "Hello!",
  "message_type": "text",
  "message_metadata": null
}
```

### Typing Indicators
```json
{
  "type": "typing",
  "conversation_id": 123,
  "is_typing": true
}
```

### Read Receipts
```json
{
  "type": "read_receipt",
  "message_id": 456
}
```

## API Endpoints

### Create Channel
```http
POST /api/v1/messaging/channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Support Request",
  "channel_type": "support",
  "description": "Help with booking issue"
}
```

### Send Message
```http
POST /api/v1/messaging/channels/{channel_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "I need help with my booking",
  "message_type": "text"
}
```

### Get Message History
```http
GET /api/v1/messaging/channels/{channel_id}/messages?limit=50&offset=0
Authorization: Bearer <token>
```

### Join Channel
```http
POST /api/v1/messaging/channels/{channel_id}/join
Authorization: Bearer <token>
```

## Frontend Integration

### WebSocket Service (`frontend/src/services/websocketService.ts`)

```typescript
class WebSocketService {
  connect(token: string): void
  disconnect(): void
  sendMessage(channelId: number, content: string): void
  subscribeToChannel(channelId: number): void
  onMessage(callback: (message: any) => void): void
}
```

### Chat Components

- **ChatInterface**: Main chat UI component
- **MessageList**: Displays conversation history
- **MessageInput**: Text input with send functionality
- **TypingIndicator**: Shows when others are typing
- **ChannelList**: Lists available channels

## Chatbot Integration

### Escalation Flow

1. **User Requests Human Agent** via chatbot
2. **Temporary Channel Created** with support type
3. **User Transferred** to real-time chat
4. **Context Preserved** from chatbot conversation
5. **Admin Notified** of new support request
6. **Channel Auto-Deleted** after 1 hour

### Implementation

```python
# In chatbot service
async def escalate_to_human_agent(self, user_id: int, context: str):
    # Create temporary support channel
    channel = await self.create_support_channel(user_id, context)
    
    # Notify admins
    await self.notify_admins_new_support_request(channel.id)
    
    # Return channel info for frontend
    return {"channel_id": channel.id, "escalated": True}
```

## Admin Features

### Channel Management
- **View All Channels** across different types
- **Monitor Active Conversations** in real-time
- **Join Support Channels** to assist users
- **Archive/Delete Channels** when resolved

### Message Moderation
- **Content Filtering** for inappropriate messages
- **User Management** with mute/ban capabilities
- **Message History** for audit purposes
- **Escalation Tracking** for support metrics

## Security & Privacy

### Authentication
- **JWT Token Validation** for WebSocket connections
- **Channel Access Control** based on user roles
- **Message Encryption** in transit via WSS
- **Rate Limiting** to prevent spam

### Data Protection
- **Automatic Cleanup** of temporary channels
- **Message Retention Policies** by channel type
- **GDPR Compliance** with data deletion rights
- **Audit Logging** for administrative actions

## Performance Optimization

### Connection Management
- **Connection Pooling** for efficient resource usage
- **Automatic Reconnection** with exponential backoff
- **Heartbeat Monitoring** to detect dead connections
- **Load Balancing** across multiple server instances

### Message Delivery
- **Efficient Broadcasting** to channel subscribers
- **Message Queuing** for offline users
- **Delivery Confirmation** with read receipts
- **Compression** for large message payloads

## Monitoring & Analytics

### Real-Time Metrics
- **Active Connections** count
- **Message Volume** per channel type
- **Response Times** for support channels
- **User Engagement** statistics

### Performance Monitoring
- **WebSocket Connection Health**
- **Message Delivery Success Rate**
- **Channel Creation/Deletion Patterns**
- **Support Resolution Times**

## Development & Testing

### Local Development
```bash
# Start backend with WebSocket support
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend connects to ws://localhost:8000
```

### Testing WebSocket Connections
```javascript
// Test WebSocket connection
const testConnection = () => {
  const ws = new WebSocket('ws://localhost:8000/api/v1/messaging/ws?token=test_token');
  ws.onopen = () => console.log('Connected');
  ws.onmessage = (event) => console.log('Message:', event.data);
};
```

## Future Enhancements

- **File Upload Support** for sharing documents/images
- **Voice Messages** for audio communication
- **Video Chat Integration** for face-to-face support
- **Message Translation** for international users
- **Advanced Moderation** with AI content filtering
- **Mobile Push Notifications** for offline message alerts
- **Message Search** across conversation history
- **Channel Templates** for common support scenarios
