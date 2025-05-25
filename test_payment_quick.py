#!/usr/bin/env python3
"""
Quick test for payment responses.
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.services.chatbot_service import ChatbotService

async def test_payment():
    engine = create_engine('sqlite:///./test_chatbot.db', connect_args={'check_same_thread': False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    chatbot = ChatbotService(db)

    questions = [
        'how to pay?',
        'How to complete payment?',
        'How much does it cost?',
        'What payment methods do you accept?'
    ]

    for q in questions:
        print(f'Q: {q}')
        response = await chatbot.process_message(q)
        intent = response.get('intent', 'None')
        resp_text = response.get('response', 'No response')
        print(f'Intent: {intent}')
        print(f'Response: {resp_text[:200]}...')
        print('-' * 50)

    db.close()

if __name__ == "__main__":
    asyncio.run(test_payment())
