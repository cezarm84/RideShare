import axios from 'axios';
import api from '../api';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
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

// Mock window.location
const locationMock = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true,
});

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    locationMock.href = '';
  });

  it('should create axios instance with correct config', () => {
    // Assert
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  describe('Request Interceptor', () => {
    it('should add authorization header when token exists', () => {
      // Arrange
      const mockAxiosInstance = axios.create();
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const mockConfig = { headers: {} };
      localStorageMock.setItem('token', 'test-token');

      // Act
      const result = requestInterceptor(mockConfig);

      // Assert
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should not add authorization header when token does not exist', () => {
      // Arrange
      const mockAxiosInstance = axios.create();
      const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
      const mockConfig = { headers: {} };

      // Act
      const result = requestInterceptor(mockConfig);

      // Assert
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('Response Interceptor', () => {
    it('should handle 401 error by redirecting to signin', () => {
      // Arrange
      const mockAxiosInstance = axios.create();
      const responseErrorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const mockError = {
        response: {
          status: 401,
        },
      };
      localStorageMock.setItem('token', 'test-token');

      // Act
      try {
        responseErrorInterceptor(mockError);
      } catch (error) {
        // Expected to throw
      }

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(locationMock.href).toBe('/signin');
    });

    it('should pass through other errors', async () => {
      // Arrange
      const mockAxiosInstance = axios.create();
      const responseErrorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
      const mockError = {
        response: {
          status: 500,
        },
        message: 'Server error',
      };

      // Act & Assert
      await expect(responseErrorInterceptor(mockError)).rejects.toEqual(mockError);
    });
  });
});
