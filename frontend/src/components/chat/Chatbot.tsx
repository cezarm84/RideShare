import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useTheme } from '../../context/ThemeContext';
import chatbotService, { ChatbotMessage, ChatbotSession } from '../../services/chatbot.service';
import { formatDistanceToNow } from 'date-fns';

interface ChatbotProps {
  initialOpen?: boolean;
}

const Chatbot: React.FC<ChatbotProps> = ({ initialOpen = false }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<ChatbotSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize the chatbot session
  useEffect(() => {
    if (isOpen && !session) {
      const newSession = chatbotService.getSession();
      setSession(newSession);
    }
  }, [isOpen, session]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.messages]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);

    try {
      await chatbotService.sendMessage(message);
      setMessage('');
      // Update the session state
      setSession({ ...chatbotService.getSession() });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConnectToAgent = async () => {
    setIsLoading(true);

    try {
      const channelId = await chatbotService.connectToHumanAgent();
      setSession({ ...chatbotService.getSession() });

      if (channelId) {
        // Wait a moment before redirecting to give user time to read the message
        setTimeout(() => {
          navigate(`/passenger/messages?channel=${channelId}`);
          setIsOpen(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error connecting to agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    setIsLoading(true);

    try {
      // Use the last user message as the ticket issue
      const userMessages = session?.messages.filter(m => m.sender === 'user') || [];
      const lastUserMessage = userMessages[userMessages.length - 1]?.content || 'Support request';

      await chatbotService.createSupportTicket(lastUserMessage);
      setSession({ ...chatbotService.getSession() });
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = (messageId: string, isHelpful: boolean) => {
    setShowFeedback(messageId);

    // In a real implementation, you would send this feedback to the server
    console.log(`Feedback for message ${messageId}: ${isHelpful ? 'helpful' : 'not helpful'}`);

    // If not helpful, show options but don't automatically create a ticket
    if (!isHelpful) {
      // Add a message offering options
      const isWithinSupportHours = new Date().getHours() >= 8 && new Date().getHours() < 20;

      if (isWithinSupportHours) {
        // Add a message offering to connect to an agent
        if (session) {
          const systemMessage: ChatbotMessage = {
            id: `system-${Date.now()}`,
            content: "Would you like to chat with a human agent?",
            sender: 'bot',
            timestamp: new Date().toISOString(),
          };

          chatbotService.getSession().messages.push(systemMessage);
          setSession({ ...chatbotService.getSession() });
        }
      } else {
        // Add a message offering to create a ticket
        if (session) {
          const systemMessage: ChatbotMessage = {
            id: `system-${Date.now()}`,
            content: "Our support team is offline (8 AM to 8 PM). Create a support ticket instead?",
            sender: 'bot',
            timestamp: new Date().toISOString(),
          };

          chatbotService.getSession().messages.push(systemMessage);
          setSession({ ...chatbotService.getSession() });
        }
      }
    }
  };

  const renderMessageContent = (message: ChatbotMessage) => {
    if (message.isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Thinking...</span>
        </div>
      );
    }

    // Split the message by newlines and render each line
    return message.content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < message.content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Just now';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chatbot toggle button */}
      <button
        onClick={toggleChatbot}
        className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-colors duration-200 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
        aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chatbot dialog */}
      {isOpen && (
        <div className={`absolute bottom-16 right-0 w-80 sm:w-96 rounded-lg shadow-xl overflow-hidden transition-all duration-200 ${
          theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Header */}
          <div className="bg-blue-500 text-white p-3 flex justify-between items-center">
            <h3 className="font-medium">RideShare Assistant</h3>
            <button
              onClick={toggleChatbot}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chatbot"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-3 space-y-3">
            {session?.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : msg.sender === 'system'
                        ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'
                        : theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="text-sm">{renderMessageContent(msg)}</div>

                  {/* Timestamp */}
                  <div className={`text-xs mt-1 ${
                    msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(msg.timestamp)}
                  </div>

                  {/* Feedback buttons for bot answers */}
                  {msg.sender === 'bot' && !msg.isLoading && msg.content.includes('Was this helpful?') && showFeedback !== msg.id && (
                    <div className="flex items-center space-x-2 mt-2">
                      <button
                        onClick={() => handleFeedback(msg.id, true)}
                        className="flex items-center space-x-1 text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        <ThumbsUp size={12} />
                        <span>Yes</span>
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, false)}
                        className="flex items-center space-x-1 text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                      >
                        <ThumbsDown size={12} />
                        <span>No</span>
                      </button>
                    </div>
                  )}

                  {/* Feedback confirmation */}
                  {showFeedback === msg.id && (
                    <div className="text-xs mt-2 text-green-500">
                      Thank you for your feedback!
                    </div>
                  )}

                  {/* Action buttons for specific messages */}
                  {msg.sender === 'bot' && !msg.isLoading && (
                    <>
                      {msg.content.includes('connect you with a human agent') && (
                        <Button
                          onClick={handleConnectToAgent}
                          className="mt-2 w-full text-xs h-8"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Connect to agent
                        </Button>
                      )}

                      {(msg.content.toLowerCase().includes('create a support ticket') ||
                       msg.content.toLowerCase().includes('support ticket')) && (
                        <Button
                          onClick={handleCreateTicket}
                          className="mt-2 w-full text-xs h-8"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Create support ticket
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-end space-x-2">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="resize-none"
                rows={2}
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="h-10 w-10 p-0 flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
