#!/usr/bin/env python3
"""
Test script for payment-related chatbot functionality.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.services.chatbot_service import ChatbotService

# Test database URL (using SQLite for testing)
TEST_DATABASE_URL = "sqlite:///./test_chatbot.db"

def create_test_db():
    """Create a test database session."""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

async def test_payment_questions():
    """Test various payment-related questions."""
    
    # Create test database session
    db = create_test_db()
    
    # Initialize chatbot service
    chatbot = ChatbotService(db)
    
    # Test payment questions
    payment_questions = [
        "how to pay?",
        "What payment methods do you accept?",
        "Can I pay with credit card?",
        "Do you accept Swish?",
        "How much does it cost?",
        "Payment options?",
        "How to complete payment?",
        "Can I use PayPal?",
        "What are the payment methods?",
        "How do I pay for my ride?"
    ]
    
    print("🧪 Testing Payment-Related Questions")
    print("=" * 50)
    
    for i, question in enumerate(payment_questions, 1):
        print(f"\n{i}. Question: '{question}'")
        print("-" * 30)
        
        try:
            # Process the message
            response = await chatbot.process_message(question)
            
            # Display results
            print(f"Intent: {response.get('intent', 'None')}")
            print(f"Source: {response.get('source', 'Unknown')}")
            print(f"Response: {response.get('response', 'No response')}")
            
            # Check if payment intent was detected
            if response.get('intent') == 'payment':
                print("✅ Payment intent correctly detected!")
            else:
                print(f"❌ Expected 'payment' intent, got '{response.get('intent')}'")
                
        except Exception as e:
            print(f"❌ Error processing question: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Payment Testing Complete!")
    
    # Close database session
    db.close()

async def test_booking_with_payment():
    """Test booking questions that mention payment."""
    
    # Create test database session
    db = create_test_db()
    
    # Initialize chatbot service
    chatbot = ChatbotService(db)
    
    # Test booking + payment questions
    booking_payment_questions = [
        "How do I book a ride and pay?",
        "What's the booking process including payment?",
        "Can you guide me through booking and payment?",
        "How to book a ride? What payment methods are available?"
    ]
    
    print("\n🧪 Testing Booking + Payment Questions")
    print("=" * 50)
    
    for i, question in enumerate(booking_payment_questions, 1):
        print(f"\n{i}. Question: '{question}'")
        print("-" * 30)
        
        try:
            # Process the message
            response = await chatbot.process_message(question)
            
            # Display results
            print(f"Intent: {response.get('intent', 'None')}")
            print(f"Source: {response.get('source', 'Unknown')}")
            print(f"Multiple Intents: {response.get('multiple_intents', 'None')}")
            
            # Show first 200 characters of response
            response_text = response.get('response', 'No response')
            if len(response_text) > 200:
                response_text = response_text[:200] + "..."
            print(f"Response: {response_text}")
            
        except Exception as e:
            print(f"❌ Error processing question: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🏁 Booking + Payment Testing Complete!")
    
    # Close database session
    db.close()

async def main():
    """Main test function."""
    print("🤖 RideShare Chatbot Payment Testing")
    print("=" * 50)
    
    # Test payment questions
    await test_payment_questions()
    
    # Test booking + payment questions
    await test_booking_with_payment()
    
    print("\n✨ All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
