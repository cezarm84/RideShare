import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

console.log('Using API base URL:', API_BASE_URL);

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Don't include credentials in requests to avoid CORS preflight issues
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'Present' : 'Not present');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added Authorization header with token');
    } else {
      console.log('No token found in localStorage, not adding Authorization header');
    }

    // Log detailed request information for debugging
    console.log('Making API Request:', config.method?.toUpperCase(), config.url);
    console.log('Request Options:', {
      method: config.method,
      headers: config.headers,
      baseURL: config.baseURL,
      withCredentials: config.withCredentials,
      data: config.data ? config.data : '(no data)',
    });

    // Log the full authorization header for debugging
    if (config.headers.Authorization) {
      console.log('Full Authorization header:', config.headers.Authorization);
    }

    // Log the full request data for POST and PUT requests
    if (config.method === 'post' || config.method === 'put') {
      console.log('Request Data:', config.data);

      // Check for common issues with ride creation
      if (config.url?.includes('/rides') && config.method === 'post') {
        const data = config.data;
        if (typeof data === 'object' && data !== null) {
          // Check for required fields
          const requiredFields = ['ride_type', 'starting_hub_id', 'departure_time', 'available_seats'];
          const missingFields = requiredFields.filter(field => !(field in data));

          if (missingFields.length > 0) {
            console.warn('Missing required fields for ride creation:', missingFields);
          }

          // Check for proper types
          if (data.starting_hub_id && typeof data.starting_hub_id !== 'number') {
            console.warn('starting_hub_id should be a number, got:', typeof data.starting_hub_id);
          }

          if (data.destination_hub_id && typeof data.destination_hub_id !== 'number') {
            console.warn('destination_hub_id should be a number, got:', typeof data.destination_hub_id);
          }
        }
      }
    }

    // Check if token is a mock token (for development)
    if (token && token.startsWith('mock_admin_token_')) {
      console.log('Using mock admin token for authentication');
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Request Successful:', response.config.method?.toUpperCase(), response.config.url);
    console.log('Response Status:', response.status);
    console.log('Response Data:', response.data);

    // Log the authorization header that was sent with the request
    console.log('Authorization header sent with request:', response.config.headers?.Authorization || 'No auth header');

    // Log the content type of the response
    console.log('Response Content-Type:', response.headers['content-type']);

    // For ride-related responses, log more details
    if (response.config.url?.includes('/rides')) {
      if (Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} rides`);
        if (response.data.length > 0) {
          console.log('First ride example:', response.data[0]);
        }
      } else if (response.data && typeof response.data === 'object') {
        console.log('Ride details:', response.data);
      }
    }

    return response;
  },
  (error) => {
    console.error('API Request Failed:', error.message);

    // Log detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });

      // Log the request that failed
      console.error('Failed Request:', {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        data: error.config?.data
      });

      // For validation errors (422), log more details
      if (error.response.status === 422) {
        console.error('Validation Error Details:', error.response.data);

        // If it's a ride creation error, log specific details
        if (error.config?.url?.includes('/rides') && error.config?.method === 'post') {
          console.error('Ride Creation Validation Error');
          console.error('Request Payload:', error.config.data);
        }
      }

      // Handle 401 Unauthorized errors (token expired)
      if (error.response.status === 401) {
        console.log('Authentication error: Token expired or invalid');
        localStorage.removeItem('token');
        localStorage.removeItem('mock_user_email');
        // Don't redirect, let the components handle authentication
      }

      // Handle CORS errors
      if (error.message.includes('Network Error') || error.message.includes('CORS')) {
        console.error('Possible CORS issue detected');
        console.error('Request URL:', error.config?.url);
        console.error('Request Method:', error.config?.method);
        console.error('Request Headers:', error.config?.headers);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      console.error('Request Config:', error.config);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      console.error('Error Stack:', error.stack);
    }

    return Promise.reject(error);
  }
);

export default api;
