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
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<AuthResponse>('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Store token in localStorage
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }

    return response.data;
  },

  register: async (data: RegisterData) => {
    return api.post('/users', data);
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me');
    return response.data;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

export default AuthService;
