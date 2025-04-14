/**
 * Application Constants
 *
 * This file contains constants used throughout the application.
 */

/**
 * Base URL for API requests
 * In development, this should match the backend server URL
 * In production, this would typically be the same domain or a dedicated API domain
 */
export const API_BASE_URL = '/api/v1';

/**
 * Maximum file upload size in bytes (10MB)
 */
export const MAX_FILE_UPLOAD_SIZE = 10 * 1024 * 1024;

/**
 * Allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALL: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

/**
 * Default pagination limits
 */
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * Date and time formats
 */
export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';
export const DISPLAY_DATE_FORMAT = 'MMM D, YYYY';
export const DISPLAY_TIME_FORMAT = 'h:mm A';
export const DISPLAY_DATETIME_FORMAT = 'MMM D, YYYY h:mm A';
