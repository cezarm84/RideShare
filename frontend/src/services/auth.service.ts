import api from './api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
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
  is_admin?: boolean;
  is_superadmin?: boolean;
  created_at: string;
}

const AuthService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    console.log('Login attempt with:', credentials.username);

    // Try real authentication first
    try {
      // Create URLSearchParams for x-www-form-urlencoded format
      const formData = new URLSearchParams();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      console.log('Attempting real authentication with backend');
      const response = await api.post<AuthResponse>('/auth/token', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('Login successful, token received:', !!response.data.access_token);

      // Store token in localStorage
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        console.log('Token stored in localStorage:', response.data.access_token.substring(0, 10) + '...');

        // Set the token in the API client
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        console.log('Authorization header set in API client');
      } else {
        console.warn('No access_token received from API');
      }

      return response.data;
    } catch (error) {
      console.error('Real authentication failed, trying mock login:', error);

      // Fallback to mock login for development - but only if not using admin credentials
      // For admin credentials, we want to show the real error
      if (!(credentials.username === 'admin@example.com' || credentials.username === 'admin@rideshare.com')) {
        console.log('Not using admin credentials, could try mock login for development');
        // We're not implementing mock login for non-admin users to ensure real backend integration
      }

      // If not using mock credentials or credentials are incorrect, throw a more specific error
      console.error('Login failed - invalid credentials');
      throw new Error('Invalid credentials');
    }


  },

  register: async (data: RegisterData) => {
    return api.post('/users', data);
  },

  signup: async (credentials: SignupCredentials) => {
    console.log('Signup attempt with:', credentials);
    try {
      // Create the request payload based on API requirements
      const userData = {
        email: credentials.email,
        password: credentials.password,
        first_name: credentials.first_name,
        last_name: credentials.last_name,
        is_active: true,
        is_superuser: false,
        phone_number: "",  // Add empty phone number
        home_address: "",  // Add empty home address
        work_address: "",  // Add empty work address
        home_coordinates: null,  // Add null coordinates
        work_coordinates: null   // Add null coordinates
      };

      console.log('Sending user data:', userData);
      const response = await api.post('/users/', userData);

      // After successful signup, automatically log in the user
      const loginResponse = await api.post<AuthResponse>('/auth/token',
        new URLSearchParams({
          'username': credentials.email,
          'password': credentials.password
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Store the token
      const { access_token } = loginResponse.data;
      localStorage.setItem('token', access_token);

      // Set the token in the API client
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return response.data;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  },

  logout: () => {
    console.log('Logging out user from AuthService');
    // Clear all auth-related items from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('mock_user_email');
    localStorage.removeItem('mock_login_time');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');

    // Remove Authorization header from API
    delete api.defaults.headers.common['Authorization'];

    console.log('User logged out successfully, localStorage cleared');
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    console.log('Fetching current user data');

    // Try to get real user data first
    try {
      console.log('Attempting to fetch real user data');
      const response = await api.get<UserProfile>('/users/me');
      console.log('User data received:', response.data);

      // Add admin properties based on email or is_superuser
      const userData = { ...response.data };

      // Set admin flags based on email or superuser status
      if (userData.email === 'admin@rideshare.com' ||
          userData.is_superuser) {
        userData.is_admin = true;
        userData.is_superadmin = userData.is_superuser;
      }

      console.log('Enhanced user data:', userData);
      return userData;
    } catch (error) {
      console.error('Failed to fetch real user data, checking for mock user:', error);

      // We're not using mock admin login anymore
      console.log('No fallback to mock user - requiring real backend authentication');

      // Clean up any old mock data that might be in localStorage
      localStorage.removeItem('mock_user_email');
      localStorage.removeItem('mock_login_time');

      // If no mock user, rethrow the error
      throw error;
    }


  },

  isAuthenticated: (): boolean => {
    console.log('Checking if user is authenticated');
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? `${token.substring(0, 10)}...` : 'not found');

    if (!token) {
      console.log('No token found, user is not authenticated');
      return false;
    }

    // We're not using mock tokens anymore
    if (token.startsWith('mock_admin_token_')) {
      console.log('Found old mock token - removing it');
      localStorage.removeItem('token');
      return false;
    }

    // Check if token is expired (if it's a JWT)
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) {
        console.log('Token is not a JWT, assuming it is valid');
        return true; // Not a JWT token
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const { exp } = JSON.parse(jsonPayload);
      console.log('Token expiration timestamp:', exp);
      console.log('Current timestamp:', Math.floor(Date.now() / 1000));

      const expired = exp ? Date.now() >= exp * 1000 : false;

      if (expired) {
        console.log('Token is expired, removing it');
        localStorage.removeItem('token');
        return false;
      } else {
        console.log('Token is valid and not expired');
      }
    } catch (e) {
      console.error('Error checking token expiration:', e);
      // If we can't parse the token, assume it's valid
      console.log('Could not parse token, assuming it is valid');
    }

    console.log('User is authenticated');
    return true;
  },

  verifySession: async () => {
    // We're not using mock tokens anymore
    const token = localStorage.getItem('token');
    if (token && token.startsWith('mock_admin_token_')) {
      console.log('Found old mock token during session verification - removing it');
      localStorage.removeItem('token');
      return { valid: false };
    }

    try {
      // Call the auth/me endpoint to verify the token is still valid
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Session verification failed:', error);

      // If it's a network error or CORS issue, don't invalidate the session
      if (error.message && (error.message.includes('Network Error') || error.message.includes('CORS'))) {
        console.log('Network or CORS error during session verification - keeping session active');
        return { valid: true };
      }

      // If it's a 401 or 403, the token is invalid
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        throw error;
      }

      // For other errors (like 500), keep the session active
      console.log('Server error during session verification - keeping session active');
      return { valid: true };
    }
  },
};

export default AuthService;
