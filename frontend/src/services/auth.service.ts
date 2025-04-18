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
      // Clear the token if we get an error
      localStorage.removeItem('token');
      throw error;
    }
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Check if token is expired (if it's a JWT)
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return true; // Not a JWT token

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const { exp } = JSON.parse(jsonPayload);
      const expired = exp ? Date.now() >= exp * 1000 : false;

      if (expired) {
        console.log('Token is expired, removing it');
        localStorage.removeItem('token');
        return false;
      }
    } catch (e) {
      console.error('Error checking token expiration:', e);
      // If we can't parse the token, assume it's valid
    }

    return true;
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
