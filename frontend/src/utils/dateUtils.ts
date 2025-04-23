/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param includeTime Whether to include the time in the formatted string
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, includeTime: boolean = true): string => {
  if (!date) return 'N/A';

  try {
    // If it's a string, convert to Date object
    // Make sure to handle ISO date strings correctly
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date string:', date);
      return 'Invalid date';
    }

    // For chat messages, we want to show relative time
    // Check if includeTime parameter is using its default value
    const isDefaultIncludeTime = includeTime === true;
    if (isDefaultIncludeTime) {
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
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
    }

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return dateObj.toLocaleString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error, 'Original value:', date);
    return 'Invalid date';
  }
};

/**
 * Check if a date is in the past
 * @param date The date to check
 * @returns True if the date is in the past
 */
export const isDateInPast = (date: Date | string): boolean => {
  if (!date) return false;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
  } catch (error) {
    console.error('Error checking if date is in past:', error);
    return false;
  }
};

/**
 * Get the difference in days between two dates
 * @param date1 The first date
 * @param date2 The second date (defaults to now)
 * @returns The difference in days
 */
export const getDaysDifference = (date1: Date | string, date2: Date | string = new Date()): number => {
  if (!date1) return 0;

  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

    // Convert to UTC to avoid timezone issues
    const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());

    // Calculate difference in days
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    return Math.floor((utc2 - utc1) / MS_PER_DAY);
  } catch (error) {
    console.error('Error calculating days difference:', error);
    return 0;
  }
};

/**
 * Format a time string for display in the UI
 *
 * @param date Date object or ISO date string
 * @returns Formatted time string
 */
export const formatTime = (date: Date | string): string => {
  if (!date) return 'N/A';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return dateObj.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};