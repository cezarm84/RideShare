import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, useNotifications } from '../../contexts/NotificationContext';
import { formatDate } from '../../utils/dateUtils';
import { Bell, MessageSquare, Car, AlertTriangle, User, Building } from 'lucide-react';
import { Button } from '../../components/ui/button';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead 
  } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    refreshNotifications();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(notifications.filter(n => !n.is_read));
    }
  }, [notifications, activeTab]);
  
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate to the link if provided
    if (notification.link_to) {
      navigate(notification.link_to);
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case 'RIDE':
        return <Car className="h-5 w-5 text-green-500" />;
      case 'SYSTEM':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'DRIVER':
        return <User className="h-5 w-5 text-purple-500" />;
      case 'ENTERPRISE':
        return <Building className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadNotifications > 0 && (
          <Button 
            onClick={markAllAsRead}
            variant="outline"
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <div className="mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${
              activeTab === 'unread'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('unread')}
          >
            Unread {unreadNotifications > 0 && `(${unreadNotifications})`}
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {filteredNotifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No {activeTab === 'unread' ? 'unread ' : ''}notifications
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotifications.map((notification) => (
              <li 
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {notification.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
