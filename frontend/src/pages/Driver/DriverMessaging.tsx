import React, { useState } from 'react';
import ChatList from '../../components/chat/ChatList';
import ChatInterface from '../../components/chat/ChatInterface';

const DriverMessaging: React.FC = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and reply to messages from administrators and passengers.
        </p>
      </div>

      <div className="flex flex-row h-[calc(100vh-200px)] overflow-hidden">
        <div className="flex flex-col w-64 flex-shrink-0">
          <ChatList
            onSelectChannel={(channelId) => setSelectedChannelId(channelId)}
            selectedChannelId={selectedChannelId || undefined}
            onChannelDeleted={() => setSelectedChannelId(null)}
          />
        </div>

        <div className="flex flex-col flex-auto h-full p-6">
          {selectedChannelId ? (
            <ChatInterface channelId={selectedChannelId} />
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

export default DriverMessaging;
