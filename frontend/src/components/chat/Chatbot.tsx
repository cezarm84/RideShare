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

  // Enhanced scrolling approach
  useEffect(() => {
    // Function to force scroll to bottom
    const forceScrollToBottom = () => {
      try {
        // Get the messages container
        const container = document.getElementById('chatbot-messages');
        if (container) {
          // Force scroll to bottom with animation disabled for reliability
          container.style.scrollBehavior = 'auto';

          // Use a very large value to ensure it reaches the bottom
          container.scrollTop = container.scrollHeight * 2;

          // Re-enable smooth scrolling after forced scroll
          setTimeout(() => {
            container.style.scrollBehavior = 'smooth';
          }, 100);
        }
      } catch (error) {
        console.error('Error in forceScrollToBottom:', error);
      }
    };

    // Apply scroll on message changes with multiple attempts
    if (session?.messages && session.messages.length > 0) {
      // Immediate scroll
      forceScrollToBottom();

      // Additional scrolls with delays to ensure it works
      // Use more frequent attempts at the beginning
      [10, 30, 50, 100, 200, 300, 500, 1000].forEach(delay => {
        setTimeout(forceScrollToBottom, delay);
      });
    }

    return () => {
      // Clean up any pending operations
    };
  }, [session?.messages, message]); // Also trigger on message changes

  // Additional effect for initial load and DOM changes
  useEffect(() => {
    // Initial scroll
    const initialScroll = () => {
      const container = document.getElementById('chatbot-messages');
      if (container) {
        container.scrollTop = container.scrollHeight * 2;
      }
    };

    // Apply initial scroll
    initialScroll();
    setTimeout(initialScroll, 100);
    setTimeout(initialScroll, 300);

    // Set up a resize observer to handle container size changes
    const container = document.getElementById('chatbot-messages');
    if (container && window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        container.scrollTop = container.scrollHeight * 2;
      });

      resizeObserver.observe(container);

      // Clean up
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Show feedback popup when closing the chat
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  // Handle closing the chatbot with feedback popup
  const handleCloseChatbot = () => {
    // Only show feedback popup if there were actual conversations
    if (session?.messages && session.messages.length > 2) {
      setShowFeedbackPopup(true);
    } else {
      setIsOpen(false);
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || message;
    // Check if messageToSend is a string before calling trim()
    if (!messageToSend || (typeof messageToSend === 'string' && !messageToSend.trim()) || isLoading) return;

    setIsLoading(true);

    try {
      // Clear the input field immediately
      setMessage('');

      // Send the message to the service - this will handle adding the user message
      await chatbotService.sendMessage(messageToSend);

      // Update the session state with the bot response
      setSession({ ...chatbotService.getSession() });

      // Force scroll to bottom after sending message
      setTimeout(() => {
        const container = document.getElementById('chatbot-messages');
        if (container) {
          container.scrollTop = container.scrollHeight * 2;
        }
      }, 100);
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
    // Set feedback state to show thank you message and hide feedback buttons
    setShowFeedback(messageId);

    // Log feedback for analytics
    console.log(`Feedback for message ${messageId}: ${isHelpful ? 'helpful' : 'not helpful'}`);

    // If feedback is helpful, just show thank you message
    if (isHelpful) {
      return;
    }

    // If not helpful, show options to connect with support
    const isWithinSupportHours = new Date().getHours() >= 8 && new Date().getHours() < 20;

    // Add appropriate follow-up message based on support hours
    if (session) {
      setTimeout(() => {
        const systemMessage: ChatbotMessage = {
          id: `system-${Date.now()}`,
          content: isWithinSupportHours
            ? "I'm sorry that wasn't helpful. Would you like to chat with a human agent?"
            : "I'm sorry that wasn't helpful. Our support team is offline (8AM-8PM). Create a support ticket instead?",
          sender: 'bot',
          timestamp: new Date().toISOString(),
        };

        chatbotService.getSession().messages.push(systemMessage);
        setSession({ ...chatbotService.getSession() });
      }, 1000); // Increased delay for better UX
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

    // Render rich media if available
    if (message.richMedia && message.richMedia.length > 0) {
      return (
        <div className="space-y-3">
          {/* Regular text content */}
          <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>

          {/* Rich media content */}
          <div className="mt-2">
            {message.richMedia.map((media, index) => {
              switch (media.type) {
                case 'image':
                  return (
                    <div key={index} className="mt-2">
                      <img
                        src={media.content.url}
                        alt={media.content.alt || 'Image'}
                        className="max-w-full rounded-md"
                      />
                      {media.content.caption && (
                        <p className="text-xs mt-1 text-gray-500">{media.content.caption}</p>
                      )}
                    </div>
                  );

                case 'button':
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (media.content.action === 'link' && media.content.url) {
                          window.open(media.content.url, '_blank');
                        } else if (media.content.action === 'message' && media.content.message) {
                          handleSendMessage(media.content.message);
                        }
                      }}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors w-full text-center"
                    >
                      {media.content.text}
                    </button>
                  );

                case 'carousel':
                  return (
                    <div key={index} className="mt-2 overflow-x-auto">
                      <div className="flex space-x-2 pb-2">
                        {media.content.items.map((item: any, itemIndex: number) => (
                          <div
                            key={itemIndex}
                            className={`flex-shrink-0 w-48 p-3 rounded-md border ${
                              theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                            }`}
                          >
                            {item.image && (
                              <img src={item.image} alt={item.title} className="w-full h-24 object-cover rounded-md mb-2" />
                            )}
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            {item.button && (
                              <button
                                onClick={() => {
                                  if (item.button.action === 'link' && item.button.url) {
                                    window.open(item.button.url, '_blank');
                                  } else if (item.button.action === 'message' && item.button.message) {
                                    handleSendMessage(item.button.message);
                                  }
                                }}
                                className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors w-full"
                              >
                                {item.button.text}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                case 'map':
                  return (
                    <div key={index} className="mt-2">
                      <a
                        href={media.content.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="mr-3 text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium">{media.content.title || 'View Location'}</div>
                            <div className="text-xs text-gray-500">{media.content.address}</div>
                          </div>
                        </div>
                      </a>
                    </div>
                  );

                case 'link':
                  return (
                    <div key={index} className="mt-2">
                      <a
                        href={media.content.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="mr-3 text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium">{media.content.title || 'Visit Link'}</div>
                            <div className="text-xs text-gray-500">{media.content.description || media.content.url}</div>
                          </div>
                        </div>
                      </a>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>
        </div>
      );
    }

    // Handle special rendering for geocoding responses
    if (message.intent === 'geocode' && message.data) {
      // The content already includes the formatted response with a map link
      // We can parse markdown links to make them clickable
      const content = message.content.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (_, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${text}</a>`
      );

      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // Handle special rendering for traffic responses
    if (message.intent === 'traffic' && message.data) {
      // The content already includes the formatted response
      // We could add visual indicators for traffic conditions
      const content = message.content;
      const trafficData = message.data;

      // Add color indicators based on congestion level
      let colorClass = 'text-yellow-500'; // Default moderate
      if (trafficData.congestion_level === 'low') {
        colorClass = 'text-green-500';
      } else if (trafficData.congestion_level === 'high') {
        colorClass = 'text-red-500';
      }

      return (
        <div>
          <div className={`font-medium ${colorClass}`}>
            {content.split('.')[0]}.
          </div>
          <div>
            {content.split('.').slice(1).join('.')}
          </div>
        </div>
      );
    }

    // Handle special rendering for documentation responses
    if (message.intent === 'docs' && message.data) {
      // The content already includes the formatted response with markdown
      // We can parse markdown to make it more readable
      return (
        <div className="docs-response">
          {message.content.split('\n\n').map((paragraph, i) => {
            // Handle bold text
            const formattedParagraph = paragraph.replace(
              /\*\*([^*]+)\*\*/g,
              (_, text) => `<strong>${text}</strong>`
            );

            return (
              <div key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: formattedParagraph }} />
            );
          })}
        </div>
      );
    }

    // Default rendering: split the message by newlines and render each line
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
        onClick={isOpen ? handleCloseChatbot : toggleChatbot}
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
              onClick={handleCloseChatbot}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close chatbot"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div
            className="h-80 overflow-y-auto p-3 space-y-3"
            id="chatbot-messages"
            style={{
              scrollBehavior: 'smooth',
              overflowAnchor: 'auto', // Enable browser's native scroll anchoring
              position: 'relative', // Establish positioning context
              display: 'flex',
              flexDirection: 'column',
              overscrollBehavior: 'contain' // Prevent scroll chaining
            }}
          >
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

                  {/* Suggestions */}
                  {msg.sender === 'bot' && !msg.isLoading && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            // Directly send the suggestion as a message
                            handleSendMessage(suggestion);
                          }}
                          className={`text-xs px-3 py-1 rounded-full border ${
                            theme === 'dark'
                              ? 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                              : 'border-gray-300 bg-gray-100 hover:bg-gray-200'
                          } transition-colors`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feedback buttons for bot messages */}
                  {msg.sender === 'bot' && !msg.isLoading && showFeedback !== msg.id && (
                    <div className="mt-2 flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          try {
                            chatbotService.provideFeedback(
                              msg.id || `msg-${Date.now()}`,
                              true,
                              msg.content,
                              msg.intent
                            );
                            handleFeedback(msg.id, true);
                            // Hide feedback buttons immediately
                            setShowFeedback(msg.id);
                          } catch (error) {
                            console.error('Error submitting feedback:', error);
                          }
                        }}
                        className="text-green-500 hover:text-green-600 transition-colors"
                        aria-label="Helpful"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          try {
                            chatbotService.provideFeedback(
                              msg.id || `msg-${Date.now()}`,
                              false,
                              msg.content,
                              msg.intent
                            );
                            handleFeedback(msg.id, false);
                            // Hide feedback buttons immediately
                            setShowFeedback(msg.id);
                          } catch (error) {
                            console.error('Error submitting feedback:', error);
                          }
                        }}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        aria-label="Not helpful"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Show thank you message when feedback is given */}
                  {showFeedback === msg.id && (
                    <div className="mt-2 text-xs text-center py-1 px-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md">
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
            <div ref={messagesEndRef} style={{ float: 'left', clear: 'both', height: '1px', width: '100%' }} />
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
                onClick={() => handleSendMessage()}
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
      {/* Feedback popup */}
      {showFeedbackPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-60 rounded-lg shadow-xl p-4 ${
            theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex justify-center space-x-8">
              <button
                onClick={async () => {
                  console.log('Feedback: Helpful');

                  try {
                    // Get the last bot message
                    const botMessages = session?.messages.filter(m => m.sender === 'bot') || [];
                    if (botMessages.length > 0) {
                      const lastBotMessage = botMessages[botMessages.length - 1];
                      const result = await chatbotService.provideFeedback(
                        lastBotMessage.id || `msg-${Date.now()}`,
                        true,
                        lastBotMessage.content,
                        lastBotMessage.intent
                      );

                      console.log('Feedback submission result:', result);
                    } else {
                      // If no bot messages, still submit generic feedback
                      await chatbotService.provideFeedback(
                        `msg-${Date.now()}`,
                        true,
                        "General chatbot experience",
                        "general"
                      );
                    }
                  } catch (error) {
                    console.error('Error submitting positive feedback:', error);
                  }

                  setShowFeedbackPopup(false);
                  setIsOpen(false);
                }}
                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ThumbsUp className="h-10 w-10 text-green-500" />
              </button>

              <button
                onClick={async () => {
                  console.log('Feedback: Needs Improvement');

                  try {
                    // Get the last bot message
                    const botMessages = session?.messages.filter(m => m.sender === 'bot') || [];
                    if (botMessages.length > 0) {
                      const lastBotMessage = botMessages[botMessages.length - 1];
                      const result = await chatbotService.provideFeedback(
                        lastBotMessage.id || `msg-${Date.now()}`,
                        false,
                        lastBotMessage.content,
                        lastBotMessage.intent
                      );

                      console.log('Feedback submission result:', result);
                    } else {
                      // If no bot messages, still submit generic feedback
                      await chatbotService.provideFeedback(
                        `msg-${Date.now()}`,
                        false,
                        "General chatbot experience",
                        "general"
                      );
                    }
                  } catch (error) {
                    console.error('Error submitting negative feedback:', error);
                  }

                  setShowFeedbackPopup(false);
                  setIsOpen(false);
                }}
                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ThumbsDown className="h-10 w-10 text-red-500" />
              </button>
            </div>

            <div className="flex justify-center mt-2">
              <button
                onClick={() => {
                  setShowFeedbackPopup(false);
                  setIsOpen(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
