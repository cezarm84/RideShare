import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config/constants';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we have a refresh token mechanism, we could implement it here
      // For now, just log the user out
      localStorage.removeItem('token');
      window.location.href = '/signin';
      return Promise.reject(error);
    }
    
    // Handle network errors with retry logic
    if (error.message === 'Network Error' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Wait 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Retry the request
      return apiClient(originalRequest);
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

// API service with typed methods
const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    apiClient.get<T>(url, config),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    apiClient.post<T>(url, data, config),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    apiClient.put<T>(url, data, config),
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => 
    apiClient.delete<T>(url, config),
    
  // Helper method to handle errors consistently
  handleError: (error: any): never => {
    if (axios.isAxiosError(error)) {
      const serverError = error.response?.data;
      if (serverError?.detail) {
        throw new Error(serverError.detail);
      }
    }
    throw error;
  }
};

export default api;
