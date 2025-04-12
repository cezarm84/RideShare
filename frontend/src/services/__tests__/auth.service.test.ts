import AuthService, { LoginCredentials, RegisterData } from '../auth.service';
import api from '../api';

// Mock the axios instance
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('login', () => {
    it('should call api.post with correct parameters and store token', async () => {
      // Arrange
      const credentials: LoginCredentials = {
        username: 'test@example.com',
        password: 'password123',
      };
      
      const mockResponse = {
        data: {
          access_token: 'mock-token',
          token_type: 'bearer',
        },
      };
      
      (api.post as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const result = await AuthService.login(credentials);
      
      // Assert
      expect(api.post).toHaveBeenCalledWith(
        '/auth/token',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle login error', async () => {
      // Arrange
      const credentials: LoginCredentials = {
        username: 'test@example.com',
        password: 'wrong-password',
      };
      
      const mockError = new Error('Invalid credentials');
      (api.post as jest.Mock).mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(AuthService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should call api.post with correct parameters', async () => {
      // Arrange
      const registerData: RegisterData = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      };
      
      const mockResponse = { data: { id: 1 } };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      await AuthService.register(registerData);
      
      // Assert
      expect(api.post).toHaveBeenCalledWith('/users', registerData);
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage', () => {
      // Arrange
      localStorageMock.setItem('token', 'mock-token');
      
      // Act
      AuthService.logout();
      
      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });

  describe('getCurrentUser', () => {
    it('should call api.get with correct parameters', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        is_active: true,
        is_superuser: false,
        created_at: '2023-01-01T00:00:00Z',
      };
      
      const mockResponse = { data: mockUser };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const result = await AuthService.getCurrentUser();
      
      // Assert
      expect(api.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      // Arrange
      localStorageMock.setItem('token', 'mock-token');
      
      // Act
      const result = AuthService.isAuthenticated();
      
      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
      expect(result).toBe(true);
    });

    it('should return false when token does not exist', () => {
      // Arrange - localStorage is empty
      
      // Act
      const result = AuthService.isAuthenticated();
      
      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('token');
      expect(result).toBe(false);
    });
  });
});
