"""AI service for intelligent chatbot responses using OpenAI GPT models."""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """Service for AI-powered chatbot responses using OpenAI."""

    def __init__(self):
        """Initialize the AI service."""
        self.client = None
        self.enabled = settings.AI_CHATBOT_ENABLED and bool(settings.OPENAI_API_KEY)

        if self.enabled:
            try:
                import openai
                self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized successfully")
            except ImportError:
                logger.warning("OpenAI package not installed. AI features disabled.")
                self.enabled = False
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {str(e)}")
                self.enabled = False
        else:
            logger.info("AI chatbot disabled or no API key provided")

    def is_enabled(self) -> bool:
        """Check if AI service is enabled and ready."""
        return self.enabled and self.client is not None

    async def generate_smart_response(
        self,
        user_message: str,
        context: Optional[Dict] = None,
        user_info: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None,
        intent: Optional[str] = None,
        sentiment: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate an intelligent response using OpenAI GPT.

        Args:
            user_message: The user's message
            context: Current conversation context
            user_info: User information for personalization
            conversation_history: Recent conversation history
            intent: Detected intent (if any)
            sentiment: Sentiment score (-1 to 1)

        Returns:
            Dict containing the AI response and metadata
        """
        if not self.is_enabled():
            return {
                "response": None,
                "error": "AI service not available",
                "fallback_required": True
            }

        try:
            # Build the system prompt
            system_prompt = self._build_system_prompt(user_info, context, intent, sentiment)

            # Build the conversation messages
            messages = self._build_conversation_messages(
                system_prompt, user_message, conversation_history, context
            )

            # Call OpenAI API
            response = await self._call_openai_api(messages)

            if response:
                return {
                    "response": response,
                    "source": "ai",
                    "intent": intent,
                    "sentiment": sentiment,
                    "ai_generated": True,
                    "model": settings.OPENAI_MODEL
                }
            else:
                return {
                    "response": None,
                    "error": "Failed to generate AI response",
                    "fallback_required": True
                }

        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            return {
                "response": None,
                "error": str(e),
                "fallback_required": True
            }

    def _build_system_prompt(
        self,
        user_info: Optional[Dict] = None,
        context: Optional[Dict] = None,
        intent: Optional[str] = None,
        sentiment: Optional[float] = None
    ) -> str:
        """Build the system prompt for the AI model."""

        base_prompt = """You are RideShare Assistant, a helpful and friendly AI chatbot for RideShare, a modern ride-sharing platform in Gothenburg, Sweden.

ABOUT RIDESHARE:
- RideShare connects passengers with drivers for convenient, affordable, and sustainable transportation
- We operate in Gothenburg and surrounding municipalities including Landvetter
- We offer three main ride types: Hub-to-Hub, Hub-to-Destination (also called Free Ride), and Enterprise services
- Our mission is to make transportation accessible, efficient, and environmentally friendly

AVAILABLE RIDE TYPES:
1. **Hub-to-Hub**: Fixed routes between designated transportation hubs at scheduled times
2. **Hub-to-Destination** (also called "Free Ride"): Travel from any hub to your chosen destination
3. **Enterprise**: Special services for businesses with customized pickup/dropoff locations and schedules

IMPORTANT: We do NOT offer "Door-to-Door" service. Do not mention or suggest this option.

YOUR ROLE:
- Provide helpful, accurate, and concise responses about RideShare services
- Be friendly, professional, and empathetic
- Guide users through booking processes, account management, and general inquiries
- Escalate to human agents when needed
- Keep responses conversational but informative

RESPONSE GUIDELINES:
- Keep responses concise (2-3 sentences max unless detailed explanation needed)
- Use a friendly, helpful tone
- Provide specific, actionable information
- Ask follow-up questions when clarification is needed
- Suggest next steps or alternatives when appropriate
- If you don't know something specific, admit it and offer to connect them with support

BOOKING PROCESS:
1. Go to 'Bookings' page or click 'Book a Ride'
2. Select pickup location and destination
3. Choose date and time
4. Enter number of passengers
5. Review details and proceed to payment
6. Sign in if prompted and complete payment

SUPPORT HOURS: 8 AM to 8 PM (Swedish time)"""

        # Add user personalization
        if user_info:
            base_prompt += f"\n\nUSER INFO:\n- Name: {user_info.get('first_name', 'User')}"
            if user_info.get('user_type'):
                base_prompt += f"\n- User type: {user_info['user_type']}"
            if user_info.get('recent_bookings'):
                base_prompt += f"\n- Has {len(user_info['recent_bookings'])} recent bookings"

        # Add context information
        if context:
            base_prompt += f"\n\nCONVERSATION CONTEXT:\n- Current topic: {context.get('topic', 'general')}"
            if context.get('intent'):
                base_prompt += f"\n- Previous intent: {context['intent']}"

        # Add intent information
        if intent:
            base_prompt += f"\n\nDETECTED INTENT: {intent}"
            if intent == "booking":
                base_prompt += "\n- Focus on helping with ride booking process"
            elif intent == "account":
                base_prompt += "\n- Focus on account-related assistance"
            elif intent == "human_agent":
                base_prompt += "\n- User wants to speak with a human agent"
            elif intent == "support_ticket":
                base_prompt += "\n- User wants to create a support ticket"

        # Add sentiment information
        if sentiment is not None:
            if sentiment <= -0.6:
                base_prompt += "\n\nUSER SENTIMENT: Very negative - be extra empathetic and offer human support"
            elif sentiment <= -0.2:
                base_prompt += "\n\nUSER SENTIMENT: Negative - be understanding and helpful"
            elif sentiment >= 0.6:
                base_prompt += "\n\nUSER SENTIMENT: Very positive - maintain the positive energy"
            elif sentiment >= 0.2:
                base_prompt += "\n\nUSER SENTIMENT: Positive - be friendly and engaging"

        base_prompt += "\n\nRespond naturally and helpfully to the user's message."

        return base_prompt

    def _build_conversation_messages(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
        context: Optional[Dict] = None
    ) -> List[Dict[str, str]]:
        """Build the conversation messages for the API call."""

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (last 5 messages)
        if conversation_history:
            for msg in conversation_history[-5:]:
                if isinstance(msg, str):
                    messages.append({"role": "user", "content": msg})
                elif isinstance(msg, dict) and "content" in msg:
                    role = "assistant" if msg.get("sender") == "bot" else "user"
                    messages.append({"role": role, "content": msg["content"]})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        return messages

    async def _call_openai_api(self, messages: List[Dict[str, str]]) -> Optional[str]:
        """Call the OpenAI API and return the response."""
        try:
            response = self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE,
                top_p=1,
                frequency_penalty=0,
                presence_penalty=0
            )

            if response.choices and len(response.choices) > 0:
                return response.choices[0].message.content.strip()
            else:
                logger.warning("No choices returned from OpenAI API")
                return None

        except Exception as e:
            logger.error(f"OpenAI API call failed: {str(e)}")
            return None

    async def analyze_intent_with_ai(self, user_message: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Use AI to analyze user intent more accurately.

        Args:
            user_message: The user's message
            context: Current conversation context

        Returns:
            Dict containing intent analysis results
        """
        if not self.is_enabled():
            return {"intent": None, "confidence": 0.0, "error": "AI service not available"}

        try:
            system_prompt = """You are an intent classification system for RideShare chatbot. Analyze the user's message and classify it into one of these intents:

INTENTS:
- greeting: Hello, hi, good morning, etc.
- farewell: Goodbye, bye, thanks, etc.
- booking: Anything related to booking rides, reservations, scheduling
- cancellation: Canceling bookings, refunds, cancellation policy
- account: Account management, profile, login, password, settings
- payment: Payment methods, how to pay, pricing, costs
- help: General help requests, what can you do, assistance
- human_agent: Wants to speak with a human, agent, representative
- support_ticket: Wants to create a support ticket, report issue
- company_info: About RideShare, what is RideShare, company information
- geocode: Location queries, where is, find location, coordinates
- traffic: Traffic conditions, congestion, road conditions
- docs: Documentation, API, how to use, guides
- faq: General questions that might be in FAQ

Respond with ONLY a JSON object in this format:
{
    "intent": "detected_intent_name",
    "confidence": 0.95,
    "reasoning": "Brief explanation of why this intent was chosen"
}

If multiple intents are possible, choose the most likely one."""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Classify this message: '{user_message}'"}
            ]

            response = await self._call_openai_api(messages)

            if response:
                try:
                    # Parse JSON response
                    result = json.loads(response)
                    return {
                        "intent": result.get("intent"),
                        "confidence": result.get("confidence", 0.0),
                        "reasoning": result.get("reasoning", ""),
                        "source": "ai"
                    }
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse AI intent response: {response}")
                    return {"intent": None, "confidence": 0.0, "error": "Invalid AI response format"}
            else:
                return {"intent": None, "confidence": 0.0, "error": "No AI response"}

        except Exception as e:
            logger.error(f"Error analyzing intent with AI: {str(e)}")
            return {"intent": None, "confidence": 0.0, "error": str(e)}

    async def generate_follow_up_questions(self, user_message: str, intent: str, context: Optional[Dict] = None) -> List[str]:
        """
        Generate smart follow-up questions based on user message and intent.

        Args:
            user_message: The user's message
            intent: Detected intent
            context: Current conversation context

        Returns:
            List of follow-up questions
        """
        if not self.is_enabled():
            return []

        try:
            system_prompt = f"""Generate 2-3 helpful follow-up questions for a RideShare chatbot user based on their message and detected intent.

Intent: {intent}
User message: "{user_message}"

Guidelines:
- Questions should be relevant and helpful
- Keep questions short and clear
- Focus on common next steps or clarifications
- Make questions actionable

Return ONLY a JSON array of strings, like:
["Question 1?", "Question 2?", "Question 3?"]"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate follow-up questions"}
            ]

            response = await self._call_openai_api(messages)

            if response:
                try:
                    questions = json.loads(response)
                    return questions if isinstance(questions, list) else []
                except json.JSONDecodeError:
                    logger.warning(f"Failed to parse follow-up questions: {response}")
                    return []
            else:
                return []

        except Exception as e:
            logger.error(f"Error generating follow-up questions: {str(e)}")
            return []
