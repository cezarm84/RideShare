# AI-Powered Chatbot System

The RideShare platform features an advanced AI-powered chatbot system that provides intelligent, context-aware customer support and assistance.

## Overview

The chatbot system combines multiple intelligence layers to provide the best possible user experience:

1. **Pattern-Based Intent Detection** - Fast, rule-based responses for common queries
2. **AI-Powered Intelligence** - OpenAI GPT integration for complex conversations
3. **Embedding-Based Classification** - Machine learning for intent classification
4. **FAQ Search** - Automated search through knowledge base
5. **Human Agent Escalation** - Seamless transition to human support

## Key Features

### 🧠 AI Intelligence
- **OpenAI GPT-4o-mini Integration** for natural language understanding
- **Context-Aware Responses** that consider conversation history
- **Sentiment Analysis** to detect user frustration and escalate appropriately
- **Dynamic Follow-Up Questions** generated based on conversation context
- **Personalized Responses** using user information and preferences

### 🎯 Intent Detection
- **Hybrid Approach** combining multiple detection methods
- **High Accuracy** with confidence scoring
- **Multi-Intent Support** for complex user queries
- **Fallback Mechanisms** ensuring responses even when AI is unavailable

### 💬 Conversation Management
- **Session Tracking** with conversation history
- **Context Preservation** across multiple interactions
- **Temporary Chat Channels** for human agent escalation
- **Real-Time Messaging** via WebSocket connections

### 📚 Knowledge Integration
- **FAQ Search** with semantic similarity matching
- **Documentation Search** for technical queries
- **Real-Time Data** including traffic and location information
- **Service Information** about rides, pricing, and availability

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   ChatBot       │    │   AI Service    │
│   Interface     │◄──►│   Service       │◄──►│   (OpenAI)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   FAQ Service   │
                       │   Doc Search    │
                       │   Geocoding     │
                       │   Traffic Data  │
                       └─────────────────┘
```

### AI Service (`app/services/ai_service.py`)

The AI service handles all OpenAI GPT interactions:

- **Smart Response Generation** with context awareness
- **Intent Analysis** using AI for complex queries
- **Follow-Up Question Generation** for better user guidance
- **Conversation Summarization** for context retention

### Chatbot Service (`app/services/chatbot_service.py`)

The main chatbot orchestrator that:

- **Processes User Messages** through multiple intelligence layers
- **Manages Conversation State** and history
- **Coordinates Services** (AI, FAQ, geocoding, traffic)
- **Handles Escalation** to human agents when needed

## Supported Intents

### Primary Intents
- **greeting** - Welcome messages and initial interactions
- **farewell** - Goodbye and closing conversations
- **booking** - Ride booking assistance and guidance
- **account** - User account management and settings
- **help** - General assistance and feature explanations
- **company_info** - Information about RideShare services

### Specialized Intents
- **human_agent** - Request for human support
- **support_ticket** - Issue reporting and ticket creation
- **geocode** - Location queries and address lookup
- **traffic** - Traffic conditions and route information
- **docs** - Documentation and API information
- **faq** - Frequently asked questions

## Configuration

### Environment Variables

```bash
# AI/LLM settings
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
AI_CHATBOT_ENABLED=True
AI_FALLBACK_ENABLED=True
```

### Model Configuration

- **Model**: GPT-4o-mini (cost-effective, fast responses)
- **Max Tokens**: 1000 (sufficient for most responses)
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Timeout**: 30 seconds for API calls

## API Endpoints

### Authenticated Chat
```http
POST /api/v1/chatbot/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "How do I book a ride?"
}
```

### Public Chat
```http
POST /api/v1/chatbot/public/chat
Content-Type: application/json

{
  "content": "What is RideShare?"
}
```

### Feedback Submission
```http
POST /api/v1/chatbot/public/feedback
Content-Type: application/json

{
  "message_id": "msg_123",
  "is_helpful": true,
  "session_id": "session_456",
  "feedback_text": "Very helpful response!"
}
```

## Response Format

```json
{
  "response": "I'd be happy to help you book a ride! Here's how...",
  "intent": "booking",
  "source": "ai",
  "ai_generated": true,
  "sentiment": 0.2,
  "suggestions": [
    "Show me available rides",
    "What are the ride types?",
    "How much does it cost?"
  ],
  "model": "gpt-4o-mini"
}
```

## Human Agent Escalation

When users need human support, the chatbot:

1. **Detects Escalation Intent** through patterns or AI analysis
2. **Creates Temporary Chat Channel** with 1-hour auto-deletion
3. **Notifies Available Agents** via WebSocket
4. **Transfers Conversation Context** to human agent
5. **Provides Seamless Transition** with conversation history

## Performance & Reliability

### Graceful Degradation
- **AI Unavailable**: Falls back to pattern-based responses
- **API Timeout**: Uses cached responses or FAQ search
- **Service Errors**: Provides helpful error messages with escalation options

### Response Times
- **Pattern-Based**: < 100ms
- **AI-Powered**: 1-3 seconds
- **FAQ Search**: < 500ms
- **Geocoding**: 1-2 seconds

### Monitoring
- **Response Quality Tracking** via user feedback
- **Performance Metrics** for response times
- **Error Rate Monitoring** for service reliability
- **Usage Analytics** for conversation patterns

## Development & Testing

### Testing the Chatbot

Use the provided test script:

```bash
python test_ai_chatbot.py
```

This script tests:
- AI service functionality
- Intent detection accuracy
- Response generation quality
- Follow-up question relevance

### Ride Type Testing

Verify correct ride type information:

```bash
python test_ride_types.py
```

Ensures the chatbot:
- Only mentions existing ride types
- Doesn't reference non-existent services
- Provides accurate service information

## Best Practices

### For Developers
1. **Always test AI responses** before deploying changes
2. **Monitor API usage** to manage OpenAI costs
3. **Update system prompts** when service features change
4. **Implement proper error handling** for AI service failures

### For Content Updates
1. **Update AI system prompts** when adding new features
2. **Test chatbot responses** after content changes
3. **Verify ride type information** is accurate
4. **Update FAQ content** to improve search results

## Future Enhancements

- **Multi-Language Support** for international users
- **Voice Integration** for hands-free interaction
- **Advanced Analytics** for conversation insights
- **Custom Training** on RideShare-specific data
- **Integration with CRM** for customer history
- **Proactive Notifications** based on user behavior
