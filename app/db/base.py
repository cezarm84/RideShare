# Import all models here that should be registered with SQLAlchemy
# This file is imported by alembic
# Import base first to ensure proper initialization
from app.db.base_class import Base

# Import all models to register them with SQLAlchemy

# Import the chatbot models
from app.models.chatbot import ChatbotFeedback, ChatbotIntentStats

# Do not import Message here to avoid circular import
# from app.models.message import Message

# Note: This import approach allows Alembic to detect models
# without causing circular import issues
