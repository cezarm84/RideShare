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

export interface ChatbotMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: string;
  isLoading?: boolean;
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
          content: 'Hello! I\'m RideShare Assistant. How can I help you today?',
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

    // Add user message to session
    const userMessage: ChatbotMessage = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    this.session!.messages.push(userMessage);

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
          };

          // Replace the loading message
          this.session!.messages.pop(); // Remove loading message
          this.session!.messages.push(botResponse);

          return botResponse;
        }
      } catch (error) {
        console.error('Error searching FAQs:', error);
        // Continue with API request if FAQ search fails

        // Continue with API request
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

        // Replace the loading message with the bot response
        const botResponse: ChatbotMessage = {
          id: `bot-${Date.now()}`,
          content: response.data.response,
          sender: 'bot',
          timestamp: new Date().toISOString(),
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

        let fallbackContent = "I'm sorry, I couldn't find a specific answer to your question.";

        if (wantsHumanAgent) {
          if (isWithinSupportHours) {
            fallbackContent = "I'd be happy to connect you with a human agent. Would you like me to do that now?";
          } else {
            fallbackContent = "Our support team is currently offline. They're available from 8 AM to 8 PM. Would you like me to create a support ticket for you instead?";
          }
        } else if (isWithinSupportHours) {
          fallbackContent += " Would you like me to connect you with a human agent?";
        } else {
          fallbackContent += " Our support team is currently offline. They're available from 8 AM to 8 PM. Would you like me to create a support ticket for you?";
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
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again later.",
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

      // Create a new support channel using the public endpoint
      const response = await api.post('/chatbot/public/support/channel', {
        initial_message: 'This conversation was transferred from the chatbot. A support agent will assist you shortly.'
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
          content: 'You have been connected to a human agent. Please wait while they review your conversation.',
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
          content: "I'm sorry, I couldn't connect you to a human agent right now. Please try again later.",
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
          content: `Your support ticket #${response.data.ticket_id} has been created. Our team will contact you during business hours.`,
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
          content: "I'm sorry, I couldn't create a support ticket right now. Please try again later or email support@rideshare.com directly with your issue.",
          sender: 'system',
          timestamp: new Date().toISOString(),
        };

        this.session.messages.push(errorMessage);
      }

      return false;
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
