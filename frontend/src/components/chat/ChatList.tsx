import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.service';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Trash2, Plus, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Channel {
  id: number;
  name: string;
  channel_type: string;
  unread_count: number;
  last_message: {
    content: string;
    created_at: string;
    sender_name: string;
  } | null;
}

interface ChatListProps {
  onSelectChannel: (channelId: number) => void;
  selectedChannelId?: number;
  channelType?: string;
  onChannelDeleted?: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
  onSelectChannel,
  selectedChannelId,
  channelType,
  onChannelDeleted
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [channelToDelete, setChannelToDelete] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedChannelType, setSelectedChannelType] = useState<string>('general');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [enterpriseId, setEnterpriseId] = useState<number | null>(null);
  const [enterprises, setEnterprises] = useState<Array<{id: number, name: string}>>([]);
  const [loadingEnterprises, setLoadingEnterprises] = useState(false);
  const [rideId, setRideId] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchChannels();
  }, [channelType]);

  // Fetch enterprises when the create dialog is opened
  useEffect(() => {
    if (createDialogOpen && selectedChannelType === 'enterprise') {
      fetchEnterprises();
    }
  }, [createDialogOpen, selectedChannelType]);

  const fetchChannels = async () => {
    try {
      console.log('Fetching channels...');
      setLoading(true);
      let url = '/chat/channels';
      if (channelType) {
        url += `?channel_type=${channelType}`;
      }
      console.log('Fetching channels from URL:', url);

      const response = await api.get(url);
      console.log('Channels received:', response.data);
      setChannels(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching channels:', err);
      setError(err.response?.data?.detail || 'Error fetching channels');
      setLoading(false);
    }
  };

  const deleteChannel = async () => {
    if (!channelToDelete) return;

    try {
      setIsDeleting(true);

      // Determine if we should use the admin endpoint
      const isAdmin = user?.user_type === 'admin';
      const endpoint = isAdmin
        ? `/admin/chat/channels/${channelToDelete}`
        : `/chat/channels/${channelToDelete}`;

      await api.delete(endpoint);

      // Remove the channel from the list
      setChannels(channels.filter(c => c.id !== channelToDelete));

      // If the deleted channel was selected, clear the selection
      if (selectedChannelId === channelToDelete) {
        onChannelDeleted?.();
      }

      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setChannelToDelete(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error deleting channel');
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, channelId: number) => {
    e.stopPropagation(); // Prevent channel selection
    setChannelToDelete(channelId);
    setDeleteDialogOpen(true);
    setOpenMenuId(null); // Close the menu
  };

  const toggleMenu = (e: React.MouseEvent, channelId: number) => {
    e.stopPropagation(); // Prevent channel selection
    setOpenMenuId(openMenuId === channelId ? null : channelId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const createChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      setIsCreating(true);
      setError('');

      // Ensure we have at least the current user in the members list
      const memberIds = selectedMembers.length > 0 ? selectedMembers : [];
      if (user && !memberIds.includes(user.id)) {
        memberIds.push(user.id);
      }

      const response = await api.post('/chat/channels', {
        name: newChannelName.trim(),
        channel_type: selectedChannelType || 'general',
        member_ids: memberIds,
        enterprise_id: enterpriseId,
        ride_id: rideId,
        description: description.trim() || undefined,
        initial_message: `Channel created by ${user?.first_name || 'User'}`
      });

      console.log('Channel created successfully:', response.data);

      // Fetch the newly created channel to get its full details
      if (response.data && response.data.channel_id) {
        try {
          const channelResponse = await api.get(`/chat/channels/${response.data.channel_id}`);
          console.log('Fetched new channel details:', channelResponse.data);

          // Add the new channel to the list
          setChannels([...channels, channelResponse.data]);

          // Select the new channel
          onSelectChannel(response.data.channel_id);
        } catch (fetchErr: any) {
          console.error('Error fetching new channel details:', fetchErr);
          // Refresh the entire channel list as fallback
          fetchChannels();
        }
      } else {
        // Refresh the entire channel list
        fetchChannels();
      }

      // Reset the form
      setNewChannelName('');
      setSelectedMembers([]);
      setEnterpriseId(null);
      setRideId(null);
      setDescription('');
      setCreateDialogOpen(false);
      setIsCreating(false);
    } catch (err: any) {
      console.error('Channel creation error:', err.response?.data);
      setError(Array.isArray(err.response?.data?.detail)
        ? err.response?.data?.detail.map((e: any) => e.msg).join(', ')
        : err.response?.data?.detail || 'Error creating channel');
      setIsCreating(false);
    }
  };



  const fetchEnterprises = async () => {
    try {
      setLoadingEnterprises(true);
      console.log('Fetching enterprises...');
      const response = await api.get('/chat/enterprises');
      console.log('Enterprises received:', response.data);
      setEnterprises(response.data);
      setLoadingEnterprises(false);
    } catch (err: any) {
      console.error('Error fetching enterprises:', err);
      setError(err.response?.data?.detail || 'Error fetching enterprises');
      setLoadingEnterprises(false);
    }
  };

  const getChannelTypeLabel = (type: string) => {
    switch (type) {
      case 'admin_driver':
        return 'Admin';
      case 'ride':
        return 'Ride';
      case 'driver_passenger':
        return 'Driver';
      case 'enterprise':
        return 'Enterprise';
      case 'community':
        return 'Community';
      default:
        return type;
    }
  };

  const isChannelAdmin = (channelId: number) => {
    // In a real implementation, you would check if the user is an admin of the channel
    // For now, we'll assume admin users can delete any channel, and regular users can delete channels they created
    return user?.user_type === 'admin';
  };

  return (
    <>
      <div className="flex flex-col py-4 pl-4 pr-2 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full relative w-full">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 pb-2">
          <div className="flex flex-row items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Messages</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs flex items-center transition-colors duration-200"
                title="Create new channel"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New
              </button>
              <button
                onClick={fetchChannels}
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs flex items-center transition-colors duration-200"
              >
                <svg className="h-3.5 w-3.5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
              {error}
            </div>
          )}

          {/* Active Conversations Section */}
          <div className="flex flex-row items-center justify-between text-xs mt-2 px-1">
            <span className="font-medium uppercase tracking-wider text-gray-600 dark:text-gray-400">Active Conversations</span>
            {channels.length > 0 && (
              <span className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 h-5 w-5 rounded text-gray-700 dark:text-gray-300 text-xs">
                {channels.length}
              </span>
            )}
          </div>
        </div>





        <div className="overflow-y-auto custom-scrollbar" style={{ height: 'calc(100% - 100px)' }}>
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : channels.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No messages found</div>
          ) : (
            <div className="flex flex-col space-y-1 mt-2">
            {channels.map((channel) => {
              return channel && channel.id ? (
                <div key={channel.id} className="flex items-center px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md group relative mb-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  {/* Main channel content - clickable area */}
                  <div
                    className={`flex flex-row items-center flex-grow cursor-pointer ${selectedChannelId === channel.id ? 'text-blue-600 dark:text-blue-400' : ''}`}
                    onClick={() => onSelectChannel(channel.id)}
                  >
                    <div className="flex items-center justify-center h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-md text-blue-600 dark:text-blue-400 font-semibold text-xs">
                      {channel.name ? channel.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="ml-2">
                      <div className="text-sm font-medium text-gray-800 dark:text-white overflow-hidden overflow-ellipsis whitespace-nowrap max-w-[120px]">
                        {channel.name || 'Unnamed Channel'}
                      </div>
                      {channel.last_message && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatDate(channel.last_message.created_at, false)}
                        </div>
                      )}
                    </div>

                    {channel.unread_count > 0 && (
                      <div className="flex items-center justify-center ml-auto text-xs text-white bg-red-500 h-5 w-5 rounded-full leading-none">
                        {channel.unread_count}
                      </div>
                    )}
                  </div>

                  {/* Stylish menu button */}
                  {(user?.user_type === 'admin' || isChannelAdmin(channel.id)) && (
                    <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleMenu(e, channel.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded flex items-center justify-center transition-all duration-200"
                        aria-expanded={openMenuId === channel.id ? 'true' : 'false'}
                      >
                        <span className="sr-only">Options</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {/* Animated dropdown menu */}
                      <div
                        className={`absolute right-0 top-0 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden transition-all duration-200 ease-out transform origin-top-right
                          ${openMenuId === channel.id
                            ? 'opacity-100 scale-100 translate-y-0'
                            : 'opacity-0 scale-90 translate-y-1 pointer-events-none'}`}
                      >
                        <div className="py-1">
                          <button
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out"
                            onClick={(e) => handleDeleteClick(e, channel.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Channel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null;
            })}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the channel
              and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteChannel}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create channel dialog */}
      <AlertDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Configure your new communication channel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="py-4 space-y-4">
            {/* Channel Name */}
            <div className="space-y-2">
              <label htmlFor="channel-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Channel Name *
              </label>
              <input
                id="channel-name"
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Enter channel name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-white"
                disabled={isCreating}
                required
              />
            </div>

            {/* Channel Type */}
            <div className="space-y-2">
              <label htmlFor="channel-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Channel Type *
              </label>
              <select
                id="channel-type"
                value={selectedChannelType}
                onChange={(e) => setSelectedChannelType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-white"
                disabled={isCreating}
              >
                <option value="general">General</option>
                <option value="admin_driver">Admin-Driver</option>
                <option value="driver_passenger">Driver-Passenger</option>
                <option value="enterprise">Enterprise</option>
                <option value="ride">Ride</option>
                <option value="community">Community</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter channel description"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-white"
                disabled={isCreating}
                rows={2}
              />
            </div>

            {/* Enterprise Selection - Only show for enterprise channels */}
            {selectedChannelType === 'enterprise' && (
              <div className="space-y-2">
                <label htmlFor="enterprise-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enterprise
                </label>
                {loadingEnterprises ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <svg className="animate-spin h-4 w-4 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading enterprises...</span>
                  </div>
                ) : enterprises.length > 0 ? (
                  <select
                    id="enterprise-id"
                    value={enterpriseId || ''}
                    onChange={(e) => setEnterpriseId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-white"
                    disabled={isCreating}
                  >
                    <option value="">Select an enterprise</option>
                    {enterprises.map(enterprise => (
                      <option key={enterprise.id} value={enterprise.id}>{enterprise.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No enterprises found. Please contact an administrator.
                  </div>
                )}
              </div>
            )}

            {/* Ride ID - Only show for ride channels */}
            {selectedChannelType === 'ride' && (
              <div className="space-y-2">
                <label htmlFor="ride-id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ride ID
                </label>
                <input
                  id="ride-id"
                  type="number"
                  value={rideId || ''}
                  onChange={(e) => setRideId(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter ride ID"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-white"
                  disabled={isCreating}
                />
              </div>
            )}

            {/* Member IDs - For now, just a simple input field */}
            <div className="space-y-2">
              <label htmlFor="member-ids" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Member IDs (comma-separated)
              </label>
              <input
                id="member-ids"
                type="text"
                value={selectedMembers.join(',')}
                onChange={(e) => {
                  const ids = e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                  setSelectedMembers(ids);
                }}
                placeholder="e.g., 1,2,3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:text-white"
                disabled={isCreating}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter user IDs separated by commas. Your ID will be added automatically.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={createChannel}
              disabled={isCreating || !newChannelName.trim()}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatList;
