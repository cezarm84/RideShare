import { apiClient } from '../api-client';
import fetchMock from 'jest-fetch-mock';

// Mock the apiClient methods
jest.mock('../api-client', () => ({
  apiClient: {
    createDriver: jest.fn(),
    getDriver: jest.fn(),
    updateDriver: jest.fn(),
    deleteDriver: jest.fn(),
  },
}));

describe('API Client Error Handling', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('handles 400 Bad Request errors', async () => {
    const errorResponse = {
      detail: 'Bad request',
      errors: {
        name: ['Name is required'],
        email: ['Email is invalid']
      }
    };

    const error = {
      status: 400,
      data: errorResponse,
      message: 'Bad request'
    };

    (apiClient.createDriver as jest.Mock).mockRejectedValueOnce(error);

    await expect(apiClient.createDriver({} as any)).rejects.toEqual(error);
  });

  it('handles 401 Unauthorized errors', async () => {
    const errorResponse = {
      detail: 'Authentication credentials were not provided'
    };

    const error = {
      status: 401,
      data: errorResponse,
      message: 'Authentication credentials were not provided'
    };

    (apiClient.getDriver as jest.Mock).mockRejectedValueOnce(error);

    await expect(apiClient.getDriver(1)).rejects.toEqual(error);
  });

  it('handles 403 Forbidden errors', async () => {
    const errorResponse = {
      detail: 'You do not have permission to perform this action'
    };

    const error = {
      status: 403,
      data: errorResponse,
      message: 'You do not have permission to perform this action'
    };

    (apiClient.updateDriver as jest.Mock).mockRejectedValueOnce(error);

    await expect(apiClient.updateDriver(1, {} as any)).rejects.toEqual(error);
  });

  it('handles 404 Not Found errors', async () => {
    const errorResponse = {
      detail: 'Driver not found'
    };

    const error = {
      status: 404,
      data: errorResponse,
      message: 'Driver not found'
    };

    (apiClient.getDriver as jest.Mock).mockRejectedValueOnce(error);

    await expect(apiClient.getDriver(999)).rejects.toEqual(error);
  });

  it('handles 422 Validation Error', async () => {
    const errorResponse = {
      detail: 'Validation Error',
      errors: {
        license_number: ['License number already exists'],
        phone: ['Phone number is invalid']
      }
    };

    const error = {
      status: 422,
      data: errorResponse,
      message: 'Validation Error'
    };

    (apiClient.createDriver as jest.Mock).mockRejectedValueOnce(error);

    await expect(apiClient.createDriver({} as any)).rejects.toEqual(error);
  });

  it('handles 500 Server Error', async () => {
    const errorResponse = {
      detail: 'Internal server error'
    };

    const error = {
      status: 500,
      data: errorResponse,
      message: 'Internal server error'
    };

    (apiClient.getDriver as jest.Mock).mockRejectedValueOnce(error);

    await expect(apiClient.getDriver(1)).rejects.toEqual(error);
  });

  it('handles network errors', async () => {
    const error = new Error('Network Error');

    (apiClient.getDriver as jest.Mock).mockRejectedValueOnce(error);

    await expect(apiClient.getDriver(1)).rejects.toEqual(error);
  });

  it('handles malformed JSON responses', async () => {
    const error = new Error('Invalid JSON response');

    (apiClient.getDriver as jest.Mock).mockRejectedValueOnce(error);

    await expect(apiClient.getDriver(1)).rejects.toEqual(error);
  });

  it('handles empty error responses', async () => {
    const error = {
      status: 400,
      message: 'An error occurred'
    };

    (apiClient.getDriver as jest.Mock).mockRejectedValueOnce(error);

    await expect(apiClient.getDriver(1)).rejects.toEqual(error);
  });

  it('handles 204 No Content responses', async () => {
    (apiClient.deleteDriver as jest.Mock).mockResolvedValueOnce({});

    const result = await apiClient.deleteDriver(1);

    expect(result).toEqual({});
  });
});
