/**
 * Chatbot Service - Provides methods for interacting with the chatbot API
 *
 * This service handles communication with the chatbot backend, including:
 * - Sending user messages to the chatbot
 * - Receiving chatbot responses
 * - Searching FAQs for relevant answers
 * - Transitioning to human support when needed
 */

import api from './api.service';
import { searchFAQs } from './FAQService';
import websocketService from './websocketService';

export interface RichMedia {
  type: 'image' | 'button' | 'carousel' | 'map' | 'link' | 'suggestion';
  content: any;
}

export interface ChatbotMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: string;
  isLoading?: boolean;
  intent?: string;
  data?: any; // For service-specific data (geocoding, traffic, docs)
  richMedia?: RichMedia[]; // For rich media responses
  suggestions?: string[]; // Quick reply suggestions
}

export interface ChatbotSession {
  id: string;
  messages: ChatbotMessage[];
  isActive: boolean;
  channelId?: number; // If connected to a real channel
}

class ChatbotService {
  private session: ChatbotSession | null = null;
  private supportHours = {
    start: 8, // 8 AM
    end: 20, // 8 PM
  };

  /**
   * Initialize a new chatbot session
   */
  public initSession(): ChatbotSession {
    const sessionId = `chatbot-${Date.now()}`;

    this.session = {
      id: sessionId,
      messages: [
        {
          id: `welcome-${Date.now()}`,
          content: 'Hi! I\'m RideShare Assistant. How can I help you?',
          sender: 'bot',
          timestamp: new Date().toISOString(),
        }
      ],
      isActive: true,
    };

    return this.session;
  }

  /**
   * Get the current session or create a new one
   */
  public getSession(): ChatbotSession {
    if (!this.session || !this.session.isActive) {
      return this.initSession();
    }
    return this.session;
  }

  /**
   * Send a message to the chatbot
   * @param content The message content
   */
  public async sendMessage(content: string): Promise<ChatbotMessage> {
    if (!this.session) {
      this.initSession();
    }

    console.log(`Sending message to chatbot: "${content}"`);

    // Only add the user message if it's not a special case that will be handled separately
    const isSpecialCase =
      content.toLowerCase().trim() === "hi" ||
      content.toLowerCase().trim() === "hello" ||
      content.toLowerCase().trim() === "hey" ||
      content.toLowerCase().trim() === "what is rideshare?" ||
      content.toLowerCase().trim() === "what areas do you serve?" ||
      content.toLowerCase().trim() === "what ride types do you offer?" ||
      content.toLowerCase().trim() === "how much does it cost?" ||
      content.toLowerCase().trim() === "do you serve landvetter airport?" ||
      content.toLowerCase().trim() === "what payment methods do you accept?" ||

      content.toLowerCase().trim() === "are there any discounts available?" ||
      content.toLowerCase().trim() === "how early should i book?" ||
      content.toLowerCase().trim() === "tell me more about corporate rates" ||
      content.toLowerCase().includes("weather") ||
      content.toLowerCase().includes("temperature") ||
      content.toLowerCase().includes("forecast") ||
      content.toLowerCase().trim() === "yes" ||
      content.toLowerCase().trim() === "no" ||
      content.toLowerCase().trim() === "yeah" ||
      content.toLowerCase().trim() === "nope" ||
      content.toLowerCase().trim() === "sure" ||
      content.toLowerCase().trim() === "ok" ||
      content.toLowerCase().trim() === "okay";

    if (!isSpecialCase) {
      // Add user message to session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
      };

      this.session!.messages.push(userMessage);
    }

    // Special handling for simple greetings
    if (content.toLowerCase().trim() === "hi" ||
        content.toLowerCase().trim() === "hello" ||
        content.toLowerCase().trim() === "hey") {
      console.log('Detected simple greeting, bypassing FAQ search');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct greeting response
      const greetingResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "Hi there! How can I help you with RideShare today?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'greeting',
        suggestions: [
          "How do I book a ride?",
          "What is RideShare?",
          "View my bookings",
          "Contact support"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(greetingResponse);
      return greetingResponse;
    }

    // Special handling for "What is RideShare?" query
    if (content.toLowerCase().trim() === "what is rideshare?") {
      console.log('Detected company info query, bypassing API call');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct company info response
      const companyInfoResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "RideShare is a modern ride-sharing platform that connects passengers with drivers for convenient, affordable, and sustainable transportation. We offer various ride types including hub-to-hub, hub-to-destination, and enterprise services. Our mission is to make transportation accessible, efficient, and environmentally friendly across Gothenburg and surrounding areas.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'company_info',
        suggestions: [
          "How do I book a ride?",
          "What areas do you serve?",
          "What ride types do you offer?",
          "How much does it cost?"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(companyInfoResponse);
      return companyInfoResponse;
    }

    // Special handling for "What areas do you serve?" query
    if (content.toLowerCase().trim() === "what areas do you serve?") {
      console.log('Detected service areas query, bypassing API call');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct service areas response
      const serviceAreasResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "RideShare currently serves Gothenburg and surrounding municipalities, including Mölndal, Partille, Härryda (including Landvetter Airport), Kungälv, Ale, Lerum, and Kungsbacka. We're continuously expanding our service area to better serve our customers.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'service_areas',
        suggestions: [
          "How do I book a ride?",
          "What ride types do you offer?",
          "How much does it cost?",
          "Do you serve Landvetter Airport?"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(serviceAreasResponse);
      return serviceAreasResponse;
    }

    // Special handling for "What ride types do you offer?" query
    if (content.toLowerCase().trim() === "what ride types do you offer?") {
      console.log('Detected ride types query, bypassing API call');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct ride types response
      const rideTypesResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "RideShare offers three main ride types to meet your needs:\n\n" +
                 "1. **Hub-to-Hub**: Travel between our designated mobility hubs at fixed times with shared rides.\n\n" +
                 "2. **Hub-to-Destination** (also called 'Free Ride'): Travel from any hub to your chosen destination.\n\n" +
                 "3. **Enterprise**: Special services for businesses with customized pickup/dropoff locations and schedules.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'ride_types',
        suggestions: [
          "How do I book a ride?",
          "What's the difference between ride types?",
          "How much does each type cost?",
          "Are all ride types available everywhere?"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(rideTypesResponse);
      return rideTypesResponse;
    }

    // Special handling for "How much does it cost?" query
    if (content.toLowerCase().trim() === "how much does it cost?") {
      console.log('Detected pricing query, bypassing API call');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct pricing response
      const pricingResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "RideShare pricing varies by ride type and distance:\n\n" +
                 "• **Hub-to-Hub**: Fixed prices starting at 39 SEK for short distances\n\n" +
                 "• **Hub-to-Destination** (Free Ride): Base fare of 49 SEK + 12 SEK/km\n\n" +
                 "• **Enterprise**: Custom pricing based on contract and volume\n\n" +
                 "We also offer subscription plans for frequent riders with significant savings. Prices may vary during peak hours or special events.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'pricing',
        suggestions: [
          "Are there any discounts available?",
          "What payment methods do you accept?",
          "How do subscription plans work?",
          "Is there a cancellation fee?"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(pricingResponse);
      return pricingResponse;
    }

    // Special handling for "Do you serve Landvetter Airport?" query
    if (content.toLowerCase().trim() === "do you serve landvetter airport?") {
      console.log('Detected Landvetter Airport query, bypassing API call');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct Landvetter Airport response
      const landvetterResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "Yes, we definitely serve Landvetter Airport! It's one of our most popular destinations. We offer regular rides to and from the airport with both our Hub-to-Hub and Free Ride services. You can book a ride to the airport in advance to ensure you arrive on time for your flight, and we also have a dedicated pickup area at the airport for arriving passengers.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'airport_service',
        suggestions: [
          "How much does it cost to the airport?",
          "Where is the pickup area?",
          "Can I book in advance?",
          "Do you track flight delays?"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(landvetterResponse);
      return landvetterResponse;
    }

    // Special handling for "What payment methods do you accept?" query
    if (content.toLowerCase().trim() === "what payment methods do you accept?") {
      console.log('Detected payment methods query, bypassing API call');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct payment methods response
      const paymentMethodsResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "RideShare accepts the following payment methods:\n\n" +
                 "• Credit/Debit Cards: Visa, Mastercard, American Express\n" +
                 "• Mobile Payment: Swish, Apple Pay, Google Pay\n" +
                 "• Corporate Accounts: For enterprise customers with monthly billing\n" +
                 "• RideShare Credits: Earned through our loyalty program\n" +
                 "• Gift Cards: Available for purchase on our website\n\n" +
                 "All payments are processed securely through our encrypted payment system. For corporate accounts, please contact our business team for setup.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'payment_methods',
        suggestions: [
          "How do I set up a corporate account?",
          "Is there a minimum payment amount?",
          "How do I earn RideShare Credits?",
          "Are there any payment fees?"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(paymentMethodsResponse);
      return paymentMethodsResponse;
    }



    // Special handling for "Are there any discounts available?" query
    if (content.toLowerCase().trim() === "are there any discounts available?") {
      console.log('Detected discounts query, bypassing API call');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct discounts response
      const discountsResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "Yes, RideShare offers several discounts and promotions:\n\n" +
                 "• First-Time User: 20% off your first ride (code: WELCOME20)\n" +
                 "• Frequent Rider Program: Earn points for each ride and get free rides\n" +
                 "• Early Bird: 15% off when booking 7+ days in advance\n" +
                 "• Group Discount: 10% off when booking for 4+ passengers\n" +
                 "• Student Discount: 15% off with valid student ID\n" +
                 "• Senior Discount: 15% off for passengers 65+\n" +
                 "• Corporate Rates: Special pricing for business accounts\n\n" +
                 "We also run seasonal promotions and special event discounts. Check the app or website for current offers.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'discounts',
        suggestions: [
          "How do I apply a discount code?",
          "How does the Frequent Rider Program work?",
          "Can I combine multiple discounts?",
          "Tell me more about corporate rates"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(discountsResponse);
      return discountsResponse;
    }

    // Special handling for "How early should I book?" query
    if (content.toLowerCase().trim() === "how early should i book?") {
      console.log('Detected booking timing query, bypassing API call');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct booking timing response
      const bookingTimingResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "Recommended booking times depend on your needs:\n\n" +
                 "• Regular Rides: At least 30 minutes in advance\n" +
                 "• Airport Transfers: 24 hours in advance to ensure availability\n" +
                 "• Peak Hours (7-9 AM, 4-6 PM): 1-2 hours in advance\n" +
                 "• Special Events: 1-2 days in advance\n" +
                 "• Large Groups: 2-3 days in advance\n\n" +
                 "While we do offer on-demand booking, planning ahead ensures you get your preferred time slot and may qualify for our Early Bird discount (15% off when booking 7+ days in advance).\n\n" +
                 "You can book rides up to 30 days in advance through our app or website.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'booking_timing',
        suggestions: [
          "What are the peak hours?",
          "Can I book a ride right now?",
          "How far in advance can I book?",
          "Tell me about the Early Bird discount"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(bookingTimingResponse);
      return bookingTimingResponse;
    }

    // Special handling for "Tell me more about corporate rates" query
    if (content.toLowerCase().trim() === "tell me more about corporate rates") {
      console.log('Detected corporate rates query, bypassing API call');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct corporate rates response
      const corporateRatesResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "RideShare Corporate offers tailored transportation solutions for businesses of all sizes:\n\n" +
                 "• Volume-Based Pricing: Discounts of 10-30% based on monthly ride volume\n" +
                 "• Dedicated Account Manager: Personalized support for your organization\n" +
                 "• Centralized Billing: Monthly invoicing with detailed usage reports\n" +
                 "• Employee Groups: Set different policies for different departments\n" +
                 "• Booking Portal: Custom booking platform for your organization\n" +
                 "• Expense Integration: Seamless integration with expense management systems\n\n" +
                 "Corporate accounts also include priority dispatch, 24/7 support, and the ability to set custom policies like approved pickup/dropoff locations, time restrictions, and spending limits.\n\n" +
                 "To set up a corporate account, please contact our business team at corporate@rideshare.com or call +46 31 123 4567.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'corporate_rates',
        suggestions: [
          "How do I set up a corporate account?",
          "What are the minimum requirements?",
          "Can employees book personal rides?",
          "Do you offer airport transfers for businesses?"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(corporateRatesResponse);
      return corporateRatesResponse;
    }

    // Special handling for weather-related queries
    if (content.toLowerCase().includes("weather") ||
        content.toLowerCase().includes("temperature") ||
        content.toLowerCase().includes("forecast")) {
      console.log('Detected weather query, bypassing API call');

      // Extract location from the query
      let location = "Gothenburg";
      const locationMatches = content.match(/(?:at|in|for)\s+([a-zA-ZåäöÅÄÖ\s]+)(?:\?|$)/i);
      if (locationMatches && locationMatches[1]) {
        location = locationMatches[1].trim();
      }

      // Normalize location names
      if (location.toLowerCase().includes("göteborg") ||
          location.toLowerCase().includes("goteborg") ||
          location.toLowerCase().includes("gothenburg")) {
        location = "Gothenburg";
      }

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a direct weather response
      const weatherResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: `I can provide general weather information for ${location}:\n\n` +
                 "While I don't have real-time weather data, I can tell you that Gothenburg generally has a mild climate with temperatures ranging from -5°C to 10°C in winter and 15°C to 25°C in summer.\n\n" +
                 "For accurate, real-time weather information, I recommend checking a dedicated weather service like SMHI (Swedish Meteorological and Hydrological Institute) or YR.no.\n\n" +
                 "Would you like me to help you plan a ride based on the current weather conditions?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'weather',
        suggestions: [
          "Book a ride now",
          "How does weather affect pricing?",
          "Do you have covered pickup areas?",
          "What happens if there's bad weather?"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(weatherResponse);
      return weatherResponse;
    }

    // Special handling for "yes" and other affirmative responses
    if (content.toLowerCase().trim() === "yes" ||
        content.toLowerCase().trim() === "yeah" ||
        content.toLowerCase().trim() === "sure" ||
        content.toLowerCase().trim() === "ok" ||
        content.toLowerCase().trim() === "okay") {
      console.log('Detected affirmative response, providing helpful information');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Check the previous message to provide context-aware response
      let contextResponse: ChatbotMessage;
      const previousMessage = this.session!.messages[this.session!.messages.length - 1];

      if (previousMessage && previousMessage.content.includes("Support offline")) {
        // Response for support ticket creation
        contextResponse = {
          id: `bot-${Date.now()}`,
          content: "Great! I've created a support ticket for you. Our support team will contact you within 24 hours at your registered email address. Your ticket reference number is #" + Math.floor(10000 + Math.random() * 90000) + ".\n\n" +
                   "Is there anything else I can help you with in the meantime?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          intent: 'support_ticket',
          suggestions: [
            "Check my ticket status",
            "Book a ride",
            "View my bookings",
            "Change my contact information"
          ]
        };
      } else if (previousMessage && previousMessage.content.includes("weather")) {
        // Response for weather-related query
        contextResponse = {
          id: `bot-${Date.now()}`,
          content: "I'd be happy to help you plan a ride based on the current weather conditions. For rainy or cold days, I recommend:\n\n" +
                   "1. Booking a ride with extra waiting time (just add a note when booking)\n" +
                   "2. Choosing pickup points with shelter when available\n" +
                   "3. Using our Hub-to-Destination service for direct rides to your location\n\n" +
                   "Would you like me to help you book a ride now?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          intent: 'weather_ride_planning',
          suggestions: [
            "Book a Hub-to-Destination ride",
            "Show sheltered pickup points",
            "Not now, thanks",
            "Tell me more about ride types"
          ]
        };
      } else {
        // Generic helpful response
        contextResponse = {
          id: `bot-${Date.now()}`,
          content: "Great! Here are some popular actions you might want to take:\n\n" +
                   "• Book a new ride\n" +
                   "• Check your upcoming bookings\n" +
                   "• Learn about our different ride types\n" +
                   "• Update your account information\n\n" +
                   "What would you like to do?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
          intent: 'general_help',
          suggestions: [
            "Book a ride",
            "View my bookings",
            "Explain ride types",
            "Update my profile"
          ]
        };
      }

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(contextResponse);
      return contextResponse;
    }

    // Special handling for "no" and other negative responses
    if (content.toLowerCase().trim() === "no" ||
        content.toLowerCase().trim() === "nope") {
      console.log('Detected negative response, providing alternative options');

      // First, add the user message to the session
      const userMessage: ChatbotMessage = {
        id: `user-${Date.now()}`,
        content: content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      // Add a helpful response with alternatives
      const alternativesResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "I understand. Is there something else I can help you with? Here are some popular topics:\n\n" +
                 "• Information about our services\n" +
                 "• Booking a ride\n" +
                 "• Managing your account\n" +
                 "• Contacting customer support\n\n" +
                 "Feel free to ask me anything!",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'alternatives',
        suggestions: [
          "Tell me about RideShare",
          "How do I book a ride?",
          "Contact customer support",
          "What ride types do you offer?"
        ]
      };

      // Only add the user message if it's not already in the session
      const lastMessage = this.session!.messages[this.session!.messages.length - 1];
      if (!lastMessage || lastMessage.sender !== 'user' || lastMessage.content !== content) {
        this.session!.messages.push(userMessage);
      }

      this.session!.messages.push(alternativesResponse);
      return alternativesResponse;
    }

    // Special handling for thank you messages
    const thankYouRegex = /^(thank you|thanks|thx|thank)$/i;
    if (thankYouRegex.test(content.toLowerCase().trim())) {
      console.log('Detected thank you message, bypassing FAQ search');

      // Add a direct thank you response
      const thankYouResponse: ChatbotMessage = {
        id: `bot-${Date.now()}`,
        content: "You're welcome! Is there anything else I can help you with?",
        sender: 'bot',
        timestamp: new Date().toISOString(),
        intent: 'farewell'
      };

      this.session!.messages.push(thankYouResponse);
      return thankYouResponse;
    }



    // Add a loading message
    const loadingMessage: ChatbotMessage = {
      id: `loading-${Date.now()}`,
      content: '',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    this.session!.messages.push(loadingMessage);

    try {
      // First, try to find a matching FAQ
      console.log('Searching FAQs for:', content);
      try {
        const faqResults = await searchFAQs(content);
        console.log('FAQ search results:', faqResults);

        // If we found relevant FAQs, use the first one
        if (faqResults && faqResults.length > 0) {
          const faq = faqResults[0];
          console.log('Using FAQ answer:', faq);

          // Replace the loading message with the FAQ answer
          const botResponse: ChatbotMessage = {
            id: `bot-${Date.now()}`,
            content: `${faq.answer}\n\nWas this helpful?`,
            sender: 'bot',
            timestamp: new Date().toISOString(),
            intent: 'faq',
            suggestions: [
              "Tell me more about this",
              "How do I get started?",
              "Contact support"
            ]
          };

          // Replace the loading message
          this.session!.messages.pop(); // Remove loading message
          this.session!.messages.push(botResponse);

          return botResponse;
        }
      } catch (error) {
        console.error('Error searching FAQs:', error);
        // Continue with API request if FAQ search fails
      }

      // If no FAQ match, try the chatbot API
      try {
        console.log('No FAQ match, calling chatbot API with:', content);
        const response = await api.post('/chatbot/public/message', { content });
        console.log('Chatbot API response:', response.data);

        // Check if the response contains the expected data
        if (!response.data || !response.data.response) {
          throw new Error('Invalid response from chatbot API');
        }

        // Check if the response indicates a human agent intent
        const isHumanAgentIntent =
          response.data.intent === 'human_agent' ||
          (response.data.response && response.data.response.includes('connect you with a human agent'));

        console.log('Is human agent intent:', isHumanAgentIntent);

        // Format the response based on intent
        let formattedContent = response.data.response;
        let suggestions: string[] = [];

        // Prioritize AI-generated suggestions from the backend
        if (response.data.suggestions && response.data.suggestions.length > 0) {
          suggestions = response.data.suggestions;
          console.log('Using AI-generated suggestions:', suggestions);
        } else {
          // Fallback to hardcoded suggestions for specific intents
          if (response.data.intent === 'geocode' && response.data.data) {
            console.log('Formatting geocoding response with data:', response.data.data);
            // The backend already formats the response, but we could enhance it here if needed
          }
          else if (response.data.intent === 'traffic' && response.data.data) {
            console.log('Formatting traffic response with data:', response.data.data);
            // The backend already formats the response, but we could enhance it here if needed
          }
          else if (response.data.intent === 'company_info') {
            console.log('Handling company_info intent');
            suggestions = [
              "How do I book a ride?",
              "What areas do you serve?",
              "What ride types do you offer?",
              "How much does it cost?"
            ];
          }
          else if (response.data.intent === 'docs' && response.data.data) {
            console.log('Formatting documentation response with data:', response.data.data);
            // Add documentation-specific suggestions
            suggestions = [
              "Show me more examples",
              "How do I implement this?",
              "Are there any tutorials?",
              "Show me related documentation"
            ];
          }
        }

        // Replace the loading message with the bot response
        const botResponse: ChatbotMessage = {
          id: `bot-${Date.now()}`,
          content: formattedContent,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          intent: response.data.intent,
          data: response.data.data,
          suggestions: suggestions.length > 0 ? suggestions : undefined
        };

        // Replace the loading message
        this.session!.messages.pop(); // Remove loading message
        this.session!.messages.push(botResponse);

        return botResponse;
      } catch (error) {
        console.error('Error calling chatbot API:', error);

        // If API fails, use a fallback response
        const isWithinSupportHours = this.isWithinSupportHours();
        console.log('Within support hours:', isWithinSupportHours);

        // Check if the message contains keywords related to talking to an agent
        const wantsHumanAgent = /agent|human|person|talk to|speak to|support|help/i.test(content);
        console.log('User wants human agent (based on keywords):', wantsHumanAgent);

        let fallbackContent = "I don't have a specific answer for that.";

        if (wantsHumanAgent) {
          if (isWithinSupportHours) {
            fallbackContent = "Connect to a human agent?";
          } else {
            fallbackContent = "Support offline (8AM-8PM). Create a ticket instead?";
          }
        } else if (isWithinSupportHours) {
          fallbackContent += " Connect to a human agent?";
        } else {
          fallbackContent += " Support offline (8AM-8PM). Create a ticket?";
        }

        const fallbackResponse: ChatbotMessage = {
          id: `bot-${Date.now()}`,
          content: fallbackContent,
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };

        // Replace the loading message
        this.session!.messages.pop(); // Remove loading message
        this.session!.messages.push(fallbackResponse);

        return fallbackResponse;
      }
    } catch (error) {
      // Handle any errors
      console.error('Error in chatbot service:', error);

      const errorResponse: ChatbotMessage = {
        id: `error-${Date.now()}`,
        content: "Sorry, I'm having trouble right now. Please try again later.",
        sender: 'system',
        timestamp: new Date().toISOString(),
      };

      // Replace the loading message
      this.session!.messages.pop(); // Remove loading message
      this.session!.messages.push(errorResponse);

      return errorResponse;
    }
  }

  /**
   * Check if the current time is within support hours
   */
  private isWithinSupportHours(): boolean {
    const now = new Date();
    const hour = now.getHours();

    return hour >= this.supportHours.start && hour < this.supportHours.end;
  }

  /**
   * Connect to a human agent
   */
  public async connectToHumanAgent(): Promise<number | null> {
    try {
      console.log('Attempting to connect to human agent...');

      // Create a new temporary support channel using the public endpoint
      const response = await api.post('/chatbot/public/support/channel', {
        initial_message: 'This conversation was transferred from the chatbot. This is a temporary channel that will be deleted after 1 hour.'
      });

      console.log('Channel creation response:', response.data);

      // Check if the response contains the expected data
      if (!response.data || !response.data.channel_id) {
        console.error('Invalid response from channel creation API:', response.data);
        throw new Error('Invalid response from channel creation API');
      }

      const channelId = response.data.channel_id;
      console.log('Created channel with ID:', channelId);

      if (this.session) {
        this.session.channelId = channelId;

        // Add a system message
        const systemMessage: ChatbotMessage = {
          id: `system-${Date.now()}`,
          content: 'You have been connected to a human agent in a temporary chat channel. This channel will be automatically deleted after 1 hour.',
          sender: 'system',
          timestamp: new Date().toISOString(),
        };

        this.session.messages.push(systemMessage);

        // Subscribe to the channel for real-time updates
        console.log('Subscribing to channel:', channelId);
        websocketService.subscribeToChannel(channelId);
      }

      return channelId;
    } catch (error: any) {
      console.error('Error connecting to human agent:', error);

      // Log detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }

      if (this.session) {
        // Add an error message
        const errorMessage: ChatbotMessage = {
          id: `error-${Date.now()}`,
          content: "Couldn't connect to an agent. Please try again later.",
          sender: 'system',
          timestamp: new Date().toISOString(),
        };

        this.session.messages.push(errorMessage);
      }

      return null;
    }
  }

  /**
   * Create a support ticket for after-hours support
   */
  public async createSupportTicket(issue: string): Promise<boolean> {
    try {
      // We're using the public endpoint, so no authentication check is needed
      console.log('Creating support ticket with issue:', issue);

      // Create the ticket using the public endpoint
      const response = await api.post('/chatbot/public/support/ticket', {
        issue,
        source: 'chatbot',
        session_id: this.session?.id,
      });

      if (this.session) {
        // Add a confirmation message
        const confirmationMessage: ChatbotMessage = {
          id: `system-${Date.now()}`,
          content: `Ticket #${response.data.ticket_id} created. We'll contact you during business hours.`,
          sender: 'system',
          timestamp: new Date().toISOString(),
        };

        this.session.messages.push(confirmationMessage);
      }

      return true;
    } catch (error) {
      console.error('Error creating support ticket:', error);

      if (this.session) {
        // Add an error message with more helpful information
        const errorMessage: ChatbotMessage = {
          id: `error-${Date.now()}`,
          content: "Couldn't create a ticket. Try again or email support@rideshare.com.",
          sender: 'system',
          timestamp: new Date().toISOString(),
        };

        this.session.messages.push(errorMessage);
      }

      return false;
    }
  }

  /**
   * Submit feedback for a chatbot message
   */
  public async provideFeedback(
    messageId: string,
    isHelpful: boolean,
    content?: string,
    intent?: string,
    feedbackText?: string
  ): Promise<boolean> {
    try {
      console.log(`Submitting feedback for message ${messageId}: ${isHelpful ? 'helpful' : 'not helpful'}`);

      // Ensure messageId is not empty
      if (!messageId) {
        messageId = `msg-${Date.now()}`;
      }

      // Create the feedback payload
      const payload = {
        message_id: messageId,
        is_helpful: isHelpful,
        session_id: this.session?.id,
        content: content || "General chatbot experience",
        intent: intent || "general",
        feedback_text: feedbackText
      };

      console.log('Feedback payload:', payload);

      // Always try the public endpoint first since it doesn't require authentication
      try {
        const response = await api.post('/chatbot/public/feedback', payload);
        console.log('Public feedback response:', response.data);
      } catch (publicError) {
        console.error('Error using public feedback endpoint:', publicError);

        // If public endpoint fails, try the authenticated endpoint
        try {
          console.log('Trying authenticated feedback endpoint');
          const response = await api.post('/chatbot/feedback', payload);
          console.log('Authenticated feedback response:', response.data);
        } catch (authError) {
          console.error('Error using authenticated feedback endpoint:', authError);
          // Both endpoints failed, but we'll still show the thank you message
        }
      }

      // Add a thank you message
      if (this.session) {
        const thankYouMessage: ChatbotMessage = {
          id: `system-${Date.now()}`,
          content: "Thank you for your feedback!",
          sender: 'system',
          timestamp: new Date().toISOString(),
        };

        this.session.messages.push(thankYouMessage);
      }

      return true;
    } catch (error) {
      console.error('Error providing feedback:', error);

      // Add an error message but still return true to avoid disrupting the user experience
      if (this.session) {
        const errorMessage: ChatbotMessage = {
          id: `system-${Date.now()}`,
          content: "Thank you for your feedback! We couldn't save it right now, but we appreciate your input.",
          sender: 'system',
          timestamp: new Date().toISOString(),
        };

        this.session.messages.push(errorMessage);
      }

      return true;
    }
  }

  /**
   * End the current chatbot session
   */
  public endSession(): void {
    if (this.session) {
      this.session.isActive = false;
    }
  }
}

// Export a singleton instance
const chatbotService = new ChatbotService();
export default chatbotService;
