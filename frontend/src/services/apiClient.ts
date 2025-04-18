/**
 * API Client Service
 *
 * This file provides a centralized client for making API requests
 * with proper error handling and authentication.
 */

import { API_BASE_URL } from '../config/constants';

/**
 * Custom fetch function with error handling
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Promise with the parsed JSON response
 */
export const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  // Ensure endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${formattedEndpoint}`;

  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authentication token if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Create the request
  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    // Log request before making it
    console.log(`Making API Request: ${options.method || 'GET'} ${url}`);
    console.log('Request Options:', JSON.stringify(requestOptions, null, 2));

    // Make the request
    const response = await fetch(url, requestOptions);

    // Log response details
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    console.log('Response Status:', response.status);

    // Handle non-OK responses
    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      let errorData: any = null;

      try {
        // For 422 Unprocessable Entity, we need to check the response format
        if (response.status === 422) {
          errorData = await response.json();
          console.log('Validation error details:', errorData);

          // Extract validation error details
          if (errorData.detail && Array.isArray(errorData.detail)) {
            // FastAPI validation errors format
            const validationErrors = errorData.detail.map((err: any) =>
              `${err.loc.join('.')}: ${err.msg}`
            ).join(', ');
            errorMessage = `Validation Error: ${validationErrors}`;
          } else if (typeof errorData === 'object') {
            errorMessage = errorData.detail || errorData.message || errorMessage;
          }
        } else {
          errorData = await response.json();
          if (typeof errorData === 'object') {
            errorMessage = errorData.detail || errorData.message || errorMessage;
          }
        }
      } catch (e) {
        // If we can't parse the error as JSON, use the status text
        console.log('Could not parse error response as JSON');
      }

      // Create a custom error object with additional properties
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.data = errorData;

      throw error;
    }

    // Parse the response as JSON
    const data = await response.json();
    return data as T;
  } catch (error) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Request Failed:', error);
    } else {
      // In production, log a more generic message
      console.error('API Request Failed');
    }
    throw error;
  }
};

/**
 * API client with methods for common HTTP verbs
 */
export const apiClient = {
  /**
   * Make a GET request
   * @param endpoint The API endpoint
   * @param options Additional fetch options
   * @returns Promise with the parsed JSON response
   */
  get: <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  },

  /**
   * Make a POST request
   * @param endpoint The API endpoint
   * @param data The data to send
   * @param options Additional fetch options
   * @returns Promise with the parsed JSON response
   */
  post: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Make a PUT request
   * @param endpoint The API endpoint
   * @param data The data to send
   * @param options Additional fetch options
   * @returns Promise with the parsed JSON response
   */
  put: <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Make a DELETE request
   * @param endpoint The API endpoint
   * @param options Additional fetch options
   * @returns Promise with the parsed JSON response
   */
  delete: <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },
};
