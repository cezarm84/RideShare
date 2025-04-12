import { apiClient } from '../api-client';
import { mockDriverProfile, mockErrorResponse, mockApiResponse, mockApiError } from '@/test-utils/api-mocks';
import { DriverProfileCreate, DriverProfileUpdate } from '@/types/driver';

describe('API Client', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
  });

  describe('createDriver', () => {
    const driverData: DriverProfileCreate = {
      license_number: 'DL123456',
      license_expiry: '2025-12-31',
      license_state: 'CA',
      license_country: 'USA',
      email: 'john@example.com',
      phone_number: '1234567890',
    };

    it('successfully creates a driver', async () => {
      mockFetch.mockResolvedValueOnce(mockApiResponse(mockDriverProfile));

      const result = await apiClient.createDriver(driverData);

      expect(result).toEqual(mockDriverProfile);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/drivers',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(driverData),
        })
      );
    });

    it('handles validation errors', async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      await expect(apiClient.createDriver(driverData)).rejects.toThrow('An error occurred');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(mockApiError);

      await expect(apiClient.createDriver(driverData)).rejects.toThrow('Network Error');
    });
  });

  describe('updateDriver', () => {
    const driverId = 1;
    const updateData: DriverProfileUpdate = {
      license_number: 'DL123456',
      license_expiry: '2025-12-31',
      license_state: 'CA',
      license_country: 'USA',
      email: 'john@example.com',
      phone_number: '1234567890',
    };

    it('successfully updates a driver', async () => {
      mockFetch.mockResolvedValueOnce(mockApiResponse(mockDriverProfile));

      const result = await apiClient.updateDriver(driverId, updateData);

      expect(result).toEqual(mockDriverProfile);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/v1/drivers/${driverId}`,
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(updateData),
        })
      );
    });

    it('handles validation errors', async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      await expect(apiClient.updateDriver(driverId, updateData)).rejects.toThrow('An error occurred');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(mockApiError);

      await expect(apiClient.updateDriver(driverId, updateData)).rejects.toThrow('Network Error');
    });
  });

  describe('getDriver', () => {
    const driverId = 1;

    it('successfully retrieves a driver', async () => {
      mockFetch.mockResolvedValueOnce(mockApiResponse(mockDriverProfile));

      const result = await apiClient.getDriver(driverId);

      expect(result).toEqual(mockDriverProfile);
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/v1/drivers/${driverId}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('handles not found errors', async () => {
      mockFetch.mockResolvedValueOnce(mockErrorResponse);

      await expect(apiClient.getDriver(driverId)).rejects.toThrow('An error occurred');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(mockApiError);

      await expect(apiClient.getDriver(driverId)).rejects.toThrow('Network Error');
    });
  });

  describe('deleteDriver', () => {
    const driverId = 1;

    it('successfully deletes a driver', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await apiClient.deleteDriver(driverId);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/drivers/${driverId}`),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('handles not found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Driver not found' }),
      });

      await expect(apiClient.deleteDriver(driverId)).rejects.toThrow('Driver not found');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(mockApiError);

      await expect(apiClient.deleteDriver(driverId)).rejects.toThrow('Network Error');
    });
  });
}); 