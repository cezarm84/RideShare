import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import ChatList from '../../components/chat/ChatList';
import ChatInterface from '../../components/chat/ChatInterface';

const AdminMessaging: React.FC = () => {
  const navigate = useNavigate();
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [channelType, setChannelType] = useState<string>('all');
  const [channelTypes, setChannelTypes] = useState<{label: string, value: string}[]>([
    { label: 'All', value: 'all' },
    { label: 'Driver', value: 'admin_driver' },
    { label: 'Ride', value: 'ride' },
    { label: 'Enterprise', value: 'enterprise' },
    { label: 'Community', value: 'community' }
  ]);

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Messaging</h1>
          <Button
            onClick={() => navigate('/admin')}
            variant="outline"
          >
            Back to Admin
          </Button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage all messaging channels in the RideShare system.
        </p>
      </div>

      <div className="mb-4">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Filter Channels</h2>
          <div className="flex flex-wrap gap-2">
            {channelTypes.map((type) => (
              <button
                key={type.value}
                className={`px-4 py-2 rounded-md ${
                  channelType === type.value
                    ? 'bg-blue-500 dark:bg-brand-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={() => setChannelType(type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-row h-[calc(100vh-280px)] overflow-hidden">
        <div className="flex flex-col w-64 flex-shrink-0">
          <ChatList
            onSelectChannel={(channelId) => setSelectedChannelId(channelId)}
            selectedChannelId={selectedChannelId || undefined}
            channelType={channelType === 'all' ? undefined : channelType}
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

export default AdminMessaging;
