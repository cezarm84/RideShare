#!/usr/bin/env python3
"""
Test script to verify the chatbot correctly handles ride types and doesn't mention Door-to-Door.
"""

import asyncio
import sys
from pathlib import Path

# Add the app directory to the Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.services.chatbot_service import ChatbotService
from app.core.config import settings

# Test messages related to ride types
RIDE_TYPE_TESTS = [
    "What ride types do you offer?",
    "Tell me about your services",
    "What is RideShare?",
    "How do I book a ride?",
    "What's the difference between ride types?",
    "Do you have door to door service?",
    "Can you pick me up at my house?",
    "I need a ride from my home",
    "What about door-to-door rides?",
    "Tell me about Free Ride",
    "What is Hub-to-Destination?",
]

async def test_ride_types():
    """Test the chatbot's responses about ride types."""
    print("🚗 Testing Ride Type Responses")
    print("=" * 50)
    
    # Create a test database session
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Initialize the chatbot service
        chatbot = ChatbotService(db)
        
        print(f"AI Service Enabled: {chatbot.ai_service.is_enabled()}")
        print()
        
        # Test each message
        for i, message in enumerate(RIDE_TYPE_TESTS, 1):
            print(f"Test {i}: '{message}'")
            print("-" * 40)
            
            try:
                # Process the message
                response = await chatbot.process_message(message, user_id=None)
                
                # Display the response
                response_text = response.get('response', 'No response')
                print(f"Response: {response_text}")
                print(f"Intent: {response.get('intent', 'None')}")
                print(f"Source: {response.get('source', 'Unknown')}")
                
                # Check for problematic terms
                problematic_terms = ["door-to-door", "door to door", "express", "scheduled"]
                found_issues = []
                
                for term in problematic_terms:
                    if term.lower() in response_text.lower():
                        found_issues.append(term)
                
                if found_issues:
                    print(f"⚠️  WARNING: Found problematic terms: {found_issues}")
                else:
                    print("✅ No problematic terms found")
                
                # Check for correct ride types
                correct_terms = ["hub-to-hub", "hub-to-destination", "free ride", "enterprise"]
                found_correct = []
                
                for term in correct_terms:
                    if term.lower() in response_text.lower():
                        found_correct.append(term)
                
                if found_correct:
                    print(f"✅ Found correct terms: {found_correct}")
                
                if response.get('suggestions'):
                    print(f"Suggestions: {response['suggestions']}")
                    
                    # Check suggestions for problematic terms
                    for suggestion in response['suggestions']:
                        for term in problematic_terms:
                            if term.lower() in suggestion.lower():
                                print(f"⚠️  WARNING: Problematic term in suggestion: '{suggestion}'")
                
                print()
                
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                print()
        
        print("🎉 Testing completed!")
        
    except Exception as e:
        print(f"❌ Failed to initialize chatbot: {str(e)}")
    finally:
        db.close()

def main():
    """Main function to run the test."""
    print("🚀 Testing Ride Type Handling")
    print("=" * 50)
    
    # Run the test
    asyncio.run(test_ride_types())

if __name__ == "__main__":
    main()
