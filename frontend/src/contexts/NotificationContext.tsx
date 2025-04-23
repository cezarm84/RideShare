import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api.service';
import { useAuth } from '../context/AuthContext';
import websocketService from '../services/websocketService';

export interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  link_to?: string;
  source_id?: number;
  meta_data?: Record<string, any>;
}

interface NotificationContextType {
  unreadMessages: number;
  notifications: Notification[];
  unreadNotifications: number;
  refreshUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadMessages: 0,
  notifications: [],
  unreadNotifications: 0,
  refreshUnreadCount: async () => {},
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {}
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUnreadCount();
      refreshNotifications();

      // Set up polling for unread messages as a fallback
      const interval = setInterval(() => {
        refreshUnreadCount();
        refreshNotifications();
      }, 60000); // Check every minute

      // Set up WebSocket listener for real-time updates
      const removeNewMessageListener = websocketService.addMessageListener('new_message', () => {
        // When a new message arrives, refresh the unread count
        refreshUnreadCount();
      });

      // Set up WebSocket listener for channel deletion
      const removeChannelDeletedListener = websocketService.addMessageListener('channel_deleted', () => {
        // When a channel is deleted, refresh the unread count
        refreshUnreadCount();
      });

      // Set up WebSocket listener for notifications
      const removeNotificationListener = websocketService.addMessageListener('notification', (data) => {
        // When a new notification arrives, refresh notifications
        refreshNotifications();
      });

      return () => {
        clearInterval(interval);
        removeNewMessageListener();
        removeChannelDeletedListener();
        removeNotificationListener();
      };
    }
  }, [isAuthenticated, user]);

  const refreshUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/chat/unread-count');
      setUnreadMessages(response.data.count);
    } catch (err) {
      console.error('Error fetching unread message count:', err);
    }
  };

  const refreshNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadNotifications(response.data.unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (notificationId: number) => {
    if (!isAuthenticated) return;

    try {
      await api.post(`/notifications/mark-read/${notificationId}`);

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!isAuthenticated) return;

    try {
      await api.post('/notifications/mark-all-read');

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotifications(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      unreadMessages,
      notifications,
      unreadNotifications,
      refreshUnreadCount,
      refreshNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
