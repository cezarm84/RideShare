import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

const AuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('Login attempt with:', credentials.username);

    // Create URLSearchParams for x-www-form-urlencoded format
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    try {
      const response = await api.post<AuthResponse>('/auth/token', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('Login successful, token received:', !!response.data.access_token);

      // Store token in localStorage
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
      }

      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    return api.post('/users', data);
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    console.log('Fetching current user data');
    try {
      const response = await api.get<UserProfile>('/users/me');
      console.log('User data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  verifySession: async () => {
    try {
      // Call the auth/me endpoint to verify the token is still valid
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Session verification failed:', error);
      // If the token is invalid, this will throw an error
      // which will be caught by the caller
      throw error;
    }
  },
};

export default AuthService;
