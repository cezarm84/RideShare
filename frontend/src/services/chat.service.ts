import api from './api';

export interface Message {
  id: number;
  channel_id: number;
  sender_id: number | null;
  sender_name: string | null;
  message_type: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface Channel {
  id: number;
  name: string;
  description: string | null;
  channel_type: string;
  ride_id: number | null;
  enterprise_id: number | null;
  created_at: string;
  updated_at: string;
  unread_count: number;
  member_count: number;
  last_message: {
    content: string;
    created_at: string;
    sender_name: string | null;
  } | null;
}

const ChatService = {
  // Get all channels for the current user
  getChannels: async (channelType?: string): Promise<Channel[]> => {
    let url = '/chat/channels';
    if (channelType) {
      url += `?channel_type=${channelType}`;
    }
    const response = await api.get<Channel[]>(url);
    return response.data;
  },

  // Get a specific channel
  getChannel: async (channelId: number): Promise<Channel> => {
    const response = await api.get<Channel>(`/chat/channels/${channelId}`);
    return response.data;
  },

  // Get messages for a channel
  getMessages: async (channelId: number): Promise<Message[]> => {
    const response = await api.get<Message[]>(`/chat/channels/${channelId}/messages`);
    return response.data;
  },

  // Send a message to a channel
  sendMessage: async (channelId: number, content: string): Promise<Message> => {
    const response = await api.post<Message>(`/chat/channels/${channelId}/messages`, { content });
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (channelId: number): Promise<void> => {
    await api.post(`/chat/channels/${channelId}/read`);
  },

  // Get unread message count
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ count: number }>('/chat/unread-count');
    return response.data.count;
  },

  // Create a new channel
  createChannel: async (data: {
    name: string;
    description?: string;
    channel_type: string;
    ride_id?: number;
    enterprise_id?: number;
    member_ids?: number[];
  }): Promise<Channel> => {
    const response = await api.post<Channel>('/chat/channels', data);
    return response.data;
  },

  // Add members to a channel
  addMembers: async (channelId: number, memberIds: number[]): Promise<void> => {
    await api.post(`/chat/channels/${channelId}/members`, { member_ids: memberIds });
  },

  // Remove a member from a channel
  removeMember: async (channelId: number, memberId: number): Promise<void> => {
    await api.delete(`/chat/channels/${channelId}/members/${memberId}`);
  },

  // Get ride-specific channel
  getRideChannel: async (rideId: number): Promise<Channel | null> => {
    try {
      const response = await api.get<Channel>(`/chat/ride/${rideId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Get driver-passenger channel
  getDriverPassengerChannel: async (driverId: number): Promise<Channel | null> => {
    try {
      const response = await api.get<Channel>(`/chat/driver/${driverId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }
};

export default ChatService;
