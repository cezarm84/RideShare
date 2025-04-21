/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Format a date to a readable string
 * @param date The date to format
 * @param includeTime Whether to include the time in the formatted string
 * @returns Formatted date string
 */
export const formatDate = (date: Date, includeTime: boolean = true): string => {
  if (!date) return 'N/A';

  try {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return new Date(date).toLocaleString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error);
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
