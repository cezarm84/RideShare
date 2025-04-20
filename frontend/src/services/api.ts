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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log detailed request information for debugging
    console.log('Making API Request:', config.method?.toUpperCase(), config.url);
    console.log('Request Options:', {
      method: config.method,
      headers: config.headers,
      baseURL: config.baseURL,
      withCredentials: config.withCredentials,
      data: config.data ? '(data present)' : '(no data)',
    });

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
    console.log('Response Data Preview:', response.data ? '(data received)' : '(no data)');
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
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
