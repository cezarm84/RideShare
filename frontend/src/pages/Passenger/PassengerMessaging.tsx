import React, { useState, useEffect } from 'react';
import ChatList from '../../components/chat/ChatList';
import ChatInterface from '../../components/chat/ChatInterface';
import { Menu, X } from 'lucide-react';

const PassengerMessaging: React.FC = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile and adjust the UI accordingly
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        // On mobile, hide sidebar by default if a channel is selected
        setShowSidebar(!selectedChannelId);
      } else {
        // On desktop, always show sidebar
        setShowSidebar(true);
      }
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedChannelId]);

  // Handle channel selection
  const handleSelectChannel = (channelId: number) => {
    setSelectedChannelId(channelId);
    // On mobile, hide sidebar when a channel is selected
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  // Handle channel deletion
  const handleChannelDeleted = () => {
    setSelectedChannelId(null);
    // On mobile, show sidebar when no channel is selected
    if (isMobile) {
      setShowSidebar(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and reply to messages from drivers and other passengers.
          </p>
        </div>
        {isMobile && (
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {showSidebar ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>

      <div className="flex flex-row h-[calc(100vh-200px)] overflow-hidden relative">
        {/* Sidebar - hidden on mobile when a channel is selected */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-64 flex-shrink-0 absolute md:relative z-10 h-full`}>
          <ChatList
            onSelectChannel={handleSelectChannel}
            selectedChannelId={selectedChannelId || undefined}
            onChannelDeleted={handleChannelDeleted}
          />
        </div>

        {/* Main chat area */}
        <div className={`flex flex-col flex-auto h-full p-2 md:p-6 ${showSidebar && isMobile ? 'hidden' : 'flex'} md:flex`}>
          {selectedChannelId ? (
            <ChatInterface
              channelId={selectedChannelId}
              onClose={isMobile ? () => {
                setSelectedChannelId(null);
                setShowSidebar(true);
              } : undefined}
              showHeader={true}
            />
          ) : (
            <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-900 h-full p-4 flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PassengerMessaging;
