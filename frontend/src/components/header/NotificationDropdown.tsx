import { useState, useEffect, useRef } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link, useNavigate } from "react-router-dom";
import { Notification, useNotifications } from "../../contexts/NotificationContext";
import { formatDate } from "../../utils/dateUtils";
import websocketService from "../../services/websocketService";
import { Bell, MessageSquare, Car, AlertTriangle, User, Building } from "lucide-react";

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    unreadMessages,
    notifications,
    unreadNotifications,
    refreshUnreadCount,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  useEffect(() => {
    // Set notifying to true if there are unread messages or notifications
    if (unreadMessages > 0 || unreadNotifications > 0) {
      setNotifying(true);
    }

    // Set up WebSocket listener for new notifications
    const removeNewMessageListener = websocketService.addMessageListener('new_message', () => {
      refreshNotifications();
      setNotifying(true);
    });

    // Set up WebSocket listener for notifications
    const removeNotificationListener = websocketService.addMessageListener('notification', () => {
      refreshNotifications();
      setNotifying(true);
    });

    return () => {
      removeNewMessageListener();
      removeNotificationListener();
    };
  }, [unreadMessages, unreadNotifications]);

  // Add window resize listener to recalculate dropdown position
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate dropdown position based on button position and window size
  const calculateDropdownPosition = () => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    // Position the dropdown on the right side of the screen with a small margin
    setDropdownPosition({
      top: buttonRect.bottom + window.scrollY + 5, // 5px gap below the button
      right: 10 // 10px from the right edge of the screen
    });
  };

  function toggleDropdown() {
    if (!isOpen) {
      calculateDropdownPosition();
      refreshNotifications();
    }
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Navigate to the link if provided
    if (notification.link_to) {
      navigate(notification.link_to);
    }

    // Close dropdown
    closeDropdown();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setNotifying(false);
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
    <div className="relative">
      <button
        ref={buttonRef}
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !notifying ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-50 flex flex-col h-[480px] w-[300px] sm:w-[350px] md:w-[361px] rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark overflow-hidden"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            maxWidth: 'calc(100vw - 20px)',
            maxHeight: 'calc(100vh - 100px)'
          }}
        >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <div className="flex space-x-2">
            {unreadNotifications > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {loading ? (
            <li className="p-4 text-center text-gray-500 dark:text-gray-400">Loading notifications...</li>
          ) : notifications.length === 0 ? (
            <li className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</li>
          ) : (
            notifications.map((notification) => (
              <li key={notification.id}>
                <DropdownItem
                  onItemClick={() => handleNotificationClick(notification)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${!notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                >
                  <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full">
                      {getNotificationIcon(notification.type)}
                    </div>
                    {!notification.is_read && (
                      <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-red-500 dark:border-gray-900"></span>
                    )}
                  </span>

                  <span className="block flex-grow">
                    <span className="mb-1.5 block text-theme-sm font-medium text-gray-800 dark:text-white/90">
                      {notification.title}
                    </span>
                    <span className="block text-theme-sm text-gray-500 dark:text-gray-400">
                      {notification.content}
                    </span>
                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400 mt-1">
                      <span className="capitalize">{notification.type.toLowerCase()}</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{formatDate(notification.created_at, false)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>
        <Link
          to="/notifications"
          onClick={closeDropdown}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View All Notifications
        </Link>
        </div>
      )}
    </div>
  );
}
