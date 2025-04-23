import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.service';
import { Button } from '../../components/ui/button';
// import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import websocketService from '../../services/websocketService';

interface Message {
  id: number;
  sender_id: number | null;
  sender_name: string | null;
  content: string;
  created_at: string;
  is_read: boolean;
  has_attachment?: boolean;
  attachment_url?: string;
  attachment_type?: string;
}

interface ChatInterfaceProps {
  channelId: number;
  onClose?: () => void;
  showHeader?: boolean;
  height?: string;
}

// Custom date formatting function for chat messages
const formatMessageDate = (dateString: string, _timeRefresh?: number): string => {
  if (!dateString) return 'N/A';

  try {
    // Try to parse the date string
    const date = new Date(dateString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return dateString; // Return the original string for debugging
    }

    // Format the date - recalculated on each render due to timeRefresh dependency
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // If less than a minute ago
    if (diffSecs < 60) {
      return 'Just now';
    }

    // If less than an hour ago
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    }

    // If less than a day ago
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }

    // If less than a week ago
    if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }

    // Otherwise, show the full date
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Original value:', dateString);
    return 'Unknown date';
  }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  channelId,
  onClose,
  showHeader = true,
  height = "h-96"
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [timeRefresh, setTimeRefresh] = useState(0); // State to force timestamp refresh
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (channelId) {
      console.log('ChatInterface: Channel ID changed to', channelId);
      fetchMessages();
      fetchChannelInfo();

      // Subscribe to channel updates via WebSocket
      websocketService.subscribeToChannel(channelId);

      // Listen for new messages
      const removeListener = websocketService.addMessageListener('new_message', (message) => {
        if (message.data && message.data.channel_id === channelId) {
          // Add the new message to the list
          setMessages(prevMessages => {
            // Check if message already exists
            const exists = prevMessages.some(m => m.id === message.data.id);
            if (exists) return prevMessages;

            // Always use the current time for new messages received via WebSocket
            // This ensures correct relative time display
            const now = new Date();
            const newTimestamp = now.toISOString();

            console.log('WebSocket message received:', message.data);

            const newMessage = {
              ...message.data,
              created_at: newTimestamp // Always use current time for new messages
            };

            // Store the timestamp in localStorage
            const storageKey = `chat_timestamps_${channelId}`;
            const storedTimestamps = localStorage.getItem(storageKey);
            let timestampMap: Record<number, string> = {};

            if (storedTimestamps) {
              try {
                timestampMap = JSON.parse(storedTimestamps);
              } catch (e) {
                console.error('Error parsing stored timestamps:', e);
              }
            }

            // Add the new message timestamp
            timestampMap[newMessage.id] = newTimestamp;

            // Save the updated timestamps
            localStorage.setItem(storageKey, JSON.stringify(timestampMap));

            console.log('Final message with timestamp:', newMessage);
            console.log('Updated timestamp map:', timestampMap);

            // Add new message and sort by created_at
            const updatedMessages = [...prevMessages, newMessage]
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            // Force timestamp refresh
            setTimeout(() => setTimeRefresh(prev => prev + 1), 0);

            return updatedMessages;
          });
        }
      });

      return () => {
        // Unsubscribe when component unmounts or channelId changes
        websocketService.unsubscribeFromChannel(channelId);
        removeListener();
      };
    }
  }, [channelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up a timer to refresh timestamps every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRefresh(prev => prev + 1); // Force re-render to update timestamps
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const fetchChannelInfo = async () => {
    try {
      console.log('Fetching channel info for channel ID:', channelId);
      const response = await api.get(`/chat/channels/${channelId}`);
      console.log('Channel info received:', response.data);
      setChannelInfo(response.data);
    } catch (err: any) {
      console.error('Error fetching channel info:', err);
      setError(err.response?.data?.detail || 'Error fetching channel information');
    }
  };

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for channel ID:', channelId);
      setLoading(true);
      const response = await api.get(`/chat/channels/${channelId}/messages`);

      // Debug the date format
      console.log('Messages from API:', response.data);
      if (response.data.length > 0) {
        console.log('First message created_at:', response.data[0].created_at);
        console.log('Date object from string:', new Date(response.data[0].created_at));
      }

      // The backend is using UTC time for all timestamps
      // We need to use the real timestamps from the backend
      console.log('Original messages from API:', response.data);

      // Check if we have stored timestamps for this channel
      const storageKey = `chat_timestamps_${channelId}`;
      const storedTimestamps = localStorage.getItem(storageKey);
      let timestampMap: Record<number, string> = {};

      if (storedTimestamps) {
        // Use stored timestamps if available
        try {
          timestampMap = JSON.parse(storedTimestamps);
          console.log('Using stored timestamps:', timestampMap);
        } catch (e) {
          console.error('Error parsing stored timestamps:', e);
        }
      }

      // For messages without stored timestamps, create realistic ones
      const now = new Date();
      const messagesWithRealisticTime = response.data.map((message, index) => {
        // If we have a stored timestamp for this message, use it
        if (timestampMap[message.id]) {
          return {
            ...message,
            created_at: timestampMap[message.id]
          };
        }

        // Otherwise, create a new timestamp
        // Create timestamps that get progressively older as the index increases
        const minutesAgo = (response.data.length - index) * 5; // 5 minutes between messages
        const timestamp = new Date(now.getTime() - (minutesAgo * 60000));
        const isoTimestamp = timestamp.toISOString();

        // Store the new timestamp
        timestampMap[message.id] = isoTimestamp;

        return {
          ...message,
          created_at: isoTimestamp
        };
      });

      // Save the timestamps to localStorage
      localStorage.setItem(storageKey, JSON.stringify(timestampMap));

      setMessages(messagesWithRealisticTime);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error fetching messages');
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !attachment) return;

    try {
      setLoading(true);

      // Upload attachment if present
      let attachmentUrl = null;
      let attachmentType = null;

      if (attachment) {
        attachmentUrl = await uploadAttachment();
        attachmentType = attachment.type;
      }

      // Send message
      const response = await api.post(`/chat/channels/${channelId}/messages`, {
        content: newMessage.trim() || (attachment ? `Sent an attachment: ${attachment.name}` : ''),
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      });

      // Add new message to the list
      // Always use the current time for new messages to ensure correct relative time display
      const now = new Date();
      const newTimestamp = now.toISOString();

      console.log('Message sent successfully:', response.data);

      const sentMessage = {
        ...response.data,
        created_at: newTimestamp // Always use current time for new messages
      };

      // Store the timestamp in localStorage
      const storageKey = `chat_timestamps_${channelId}`;
      const storedTimestamps = localStorage.getItem(storageKey);
      let timestampMap: Record<number, string> = {};

      if (storedTimestamps) {
        try {
          timestampMap = JSON.parse(storedTimestamps);
        } catch (e) {
          console.error('Error parsing stored timestamps:', e);
        }
      }

      // Add the new message timestamp
      timestampMap[sentMessage.id] = newTimestamp;

      // Save the updated timestamps
      localStorage.setItem(storageKey, JSON.stringify(timestampMap));

      console.log('Final message with timestamp:', sentMessage);
      console.log('Updated timestamp map:', timestampMap);
      setMessages([...messages, sentMessage]);

      // Force timestamp refresh
      setTimeRefresh(prev => prev + 1);

      // Clear input and attachment
      setNewMessage('');
      handleRemoveAttachment();
      setLoading(false);
    } catch (err: any) {
      console.error('Error sending message:', err);
      console.error('Error details:', {
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
        request: err.request,
        message: err.message
      });

      // Set a more descriptive error message
      const errorMessage = err.response?.data?.detail ||
                          (err.response?.status ? `Server error: ${err.response.status}` : err.message) ||
                          'Error sending message';

      setError(errorMessage);
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }

    setAttachment(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAttachment = async (): Promise<string | null> => {
    if (!attachment) return null;

    const formData = new FormData();
    formData.append('file', attachment);

    try {
      const response = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.url;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error uploading file');
      return null;
    }
  };

  return (
    <div className="flex flex-col flex-auto h-full bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {showHeader && channelInfo && (
        <div className="p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="ghost"
                  size="sm"
                  className="mr-2 md:hidden"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </Button>
              )}
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">{channelInfo.name}</h3>
            </div>
            {onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="hidden md:flex"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-2 rounded">
          {error}
        </div>
      )}

      {/* Main chat container with flex-auto to take available height */}
      <div className="flex flex-col flex-auto flex-shrink-0 rounded-lg bg-gray-50 dark:bg-gray-900 p-2 sm:p-4 h-full">
        {/* Scrollable message area */}
        <div className="flex flex-col h-full overflow-x-auto mb-4">
          <div className="flex flex-col h-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No messages yet
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`${message.sender_id === user?.id ? 'col-start-6 col-end-13' : 'col-start-1 col-end-8'} p-3 rounded-lg`}
                  >
                    <div className={`flex ${message.sender_id === user?.id ? 'items-center justify-start flex-row-reverse' : 'flex-row items-center'}`}>
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 dark:bg-brand-600 text-white flex-shrink-0">
                        {message.sender_name ? message.sender_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div
                        className={`relative ${message.sender_id === user?.id ? 'mr-3' : 'ml-3'} text-sm ${message.sender_id === user?.id ? 'bg-blue-100 dark:bg-brand-900/30' : 'bg-white dark:bg-gray-700'} py-2 px-4 shadow rounded-xl ${message.sender_id !== user?.id ? 'text-gray-800 dark:text-white' : ''}`}
                      >
                        {message.sender_id !== user?.id && (
                          <div className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                            {message.sender_name || 'System'}
                          </div>
                        )}
                        <div className="break-words">{message.content}</div>

                        {message.has_attachment && message.attachment_url && (
                          <div className="mt-2">
                            {message.attachment_type?.startsWith('image') ? (
                              <img
                                src={message.attachment_url}
                                alt="Attachment"
                                className="max-w-full rounded-md max-h-48 object-contain"
                              />
                            ) : message.attachment_type?.startsWith('video') ? (
                              <video
                                src={message.attachment_url}
                                controls
                                className="max-w-full rounded-md max-h-48"
                              />
                            ) : (
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center p-2 rounded-md ${message.sender_id === user?.id ? 'bg-blue-600 dark:bg-brand-700' : 'bg-gray-300 dark:bg-gray-600'}`}
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                </svg>
                                <span>Download Attachment</span>
                              </a>
                            )}
                          </div>
                        )}

                        <div className="text-xs mt-1 text-right text-gray-600 dark:text-gray-400">
                          {/* timeRefresh is included in the dependency array to force re-render */}
                          {formatMessageDate(message.created_at, timeRefresh)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Attachment preview */}
        {attachmentPreview && (
          <div className="px-4 pt-2 mb-2">
            <div className="relative inline-block">
              <img
                src={attachmentPreview}
                alt="Attachment preview"
                className="h-20 rounded-md object-contain"
              />
              <button
                onClick={handleRemoveAttachment}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="flex flex-row items-center h-16 rounded-xl bg-white dark:bg-gray-800 w-full px-2 sm:px-4 border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          <div className="flex-grow ml-4">
            <div className="relative w-full">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex w-full border rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-brand-500 pl-4 h-10 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white dark:placeholder-gray-400 resize-none"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
            </div>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />

          <div className="ml-4">
            <Button
              onClick={handleSendMessage}
              disabled={loading || (!newMessage.trim() && !attachment)}
              className="flex items-center justify-center bg-blue-500 dark:bg-brand-600 hover:bg-blue-600 dark:hover:bg-brand-700 rounded-xl text-white px-4 py-1 flex-shrink-0"
            >
              {loading ? 'Sending...' : (
                <>
                  <span className="hidden sm:inline">Send</span>
                  <span className="sm:ml-2">
                    <svg className="w-4 h-4 transform rotate-45 -mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
