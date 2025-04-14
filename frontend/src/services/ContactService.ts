/**
 * Contact Service - Provides methods for interacting with the Contact API
 *
 * This service handles submitting contact form data to the backend API
 * and retrieving contact messages for authenticated users.
 */

import { API_BASE_URL } from '../config/constants';
import { useAuth } from '../context/AuthContext';

/**
 * Contact Message interface
 */
export interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: string;
  recaptcha_token?: string;
}

/**
 * Contact Message Response interface
 */
export interface ContactMessageResponse {
  id: number;
  status: string;
  created_at: string;
}

/**
 * Contact Message Detail interface (for authenticated users)
 */
export interface ContactMessageDetail extends ContactMessageResponse {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: string;
  is_read: boolean;
  updated_at: string;
}

/**
 * Submit a contact message
 * @param message The contact message to submit
 * @returns Promise with the response
 */
export const submitContactMessage = async (message: ContactMessage): Promise<ContactMessageResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if user is logged in
        ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error submitting contact message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting contact message:', error);
    throw error;
  }
};

/**
 * Get contact messages for the current user
 * @param skip Number of items to skip
 * @param limit Maximum number of items to return
 * @returns Promise with the user's contact messages
 */
export const getMyContactMessages = async (skip: number = 0, limit: number = 10): Promise<ContactMessageDetail[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/contact/me?skip=${skip}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error fetching contact messages: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    throw error;
  }
};

/**
 * Mock function to simulate contact form submission
 * @param message The contact message to submit
 * @returns Promise with a mock response
 */
export const mockSubmitContactMessage = async (message: ContactMessage): Promise<ContactMessageResponse> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve({
        id: Math.floor(Math.random() * 1000),
        status: 'new',
        created_at: new Date().toISOString()
      });
    }, 1000);
  });
};
