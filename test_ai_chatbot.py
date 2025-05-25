#!/usr/bin/env python3
"""
Test script for the AI-enhanced chatbot functionality.
This script tests the chatbot with and without AI integration.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the app directory to the Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.services.chatbot_service import ChatbotService
from app.core.config import settings

# Test messages to try
TEST_MESSAGES = [
    "Hi there!",
    "How do I book a ride?",
    "What is RideShare?",
    "I'm frustrated with my booking",
    "Can you help me find the airport?",
    "What's the traffic like to downtown?",
    "I need to speak with someone",
    "Tell me about your pricing",
    "How do I cancel my ride?",
    "What areas do you serve?",
]

async def test_chatbot():
    """Test the chatbot with various messages."""
    print("🤖 Testing AI-Enhanced Chatbot")
    print("=" * 50)
    
    # Check if AI is enabled
    print(f"AI Chatbot Enabled: {settings.AI_CHATBOT_ENABLED}")
    print(f"OpenAI API Key Set: {'Yes' if settings.OPENAI_API_KEY else 'No'}")
    print(f"OpenAI Model: {settings.OPENAI_MODEL}")
    print()
    
    # Create a test database session
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Initialize the chatbot service
        chatbot = ChatbotService(db)
        
        print(f"AI Service Enabled: {chatbot.ai_service.is_enabled()}")
        print(f"Embedding Model Loaded: {chatbot.model is not None}")
        print()
        
        # Test each message
        for i, message in enumerate(TEST_MESSAGES, 1):
            print(f"Test {i}: '{message}'")
            print("-" * 30)
            
            try:
                # Process the message
                response = await chatbot.process_message(message, user_id=None)
                
                # Display the response
                print(f"Response: {response.get('response', 'No response')}")
                print(f"Intent: {response.get('intent', 'None')}")
                print(f"Source: {response.get('source', 'Unknown')}")
                
                if response.get('ai_generated'):
                    print("✨ AI-Generated Response")
                
                if response.get('suggestions'):
                    print(f"Suggestions: {response['suggestions']}")
                
                if response.get('sentiment') is not None:
                    sentiment = response['sentiment']
                    sentiment_label = "Positive" if sentiment > 0.2 else "Negative" if sentiment < -0.2 else "Neutral"
                    print(f"Sentiment: {sentiment:.2f} ({sentiment_label})")
                
                print()
                
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                print()
        
        print("🎉 Testing completed!")
        
    except Exception as e:
        print(f"❌ Failed to initialize chatbot: {str(e)}")
    finally:
        db.close()

async def test_ai_service_directly():
    """Test the AI service directly."""
    print("\n🧠 Testing AI Service Directly")
    print("=" * 50)
    
    from app.services.ai_service import AIService
    
    ai_service = AIService()
    
    if not ai_service.is_enabled():
        print("❌ AI Service is not enabled. Check your OpenAI API key.")
        return
    
    print("✅ AI Service is enabled")
    
    # Test intent detection
    test_message = "I'm really frustrated with my booking and need help"
    print(f"\nTesting intent detection for: '{test_message}'")
    
    try:
        intent_result = await ai_service.analyze_intent_with_ai(test_message)
        print(f"Detected Intent: {intent_result.get('intent')}")
        print(f"Confidence: {intent_result.get('confidence')}")
        print(f"Reasoning: {intent_result.get('reasoning')}")
    except Exception as e:
        print(f"❌ Intent detection failed: {str(e)}")
    
    # Test response generation
    print(f"\nTesting response generation for: '{test_message}'")
    
    try:
        response = await ai_service.generate_smart_response(
            user_message=test_message,
            intent="booking",
            sentiment=-0.7
        )
        print(f"AI Response: {response.get('response')}")
        print(f"Source: {response.get('source')}")
    except Exception as e:
        print(f"❌ Response generation failed: {str(e)}")
    
    # Test follow-up questions
    print(f"\nTesting follow-up questions for: '{test_message}'")
    
    try:
        questions = await ai_service.generate_follow_up_questions(
            test_message, "booking"
        )
        print(f"Follow-up Questions: {questions}")
    except Exception as e:
        print(f"❌ Follow-up generation failed: {str(e)}")

def main():
    """Main function to run all tests."""
    print("🚀 Starting AI Chatbot Tests")
    print("=" * 50)
    
    # Check environment
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  Warning: OPENAI_API_KEY not set in environment")
        print("   The chatbot will work but without AI features")
        print()
    
    # Run tests
    asyncio.run(test_ai_service_directly())
    asyncio.run(test_chatbot())

if __name__ == "__main__":
    main()
