import { DriverProfileResponse, DriverStatus, DriverVerificationStatus } from '@/types/driver';

export const mockDriverProfile = {
  id: 1,
  license_number: 'DL123456',
  license_expiry: '2025-12-31',
  license_state: 'CA',
  license_country: 'USA',
  email: 'john@example.com',
  phone_number: '1234567890',
  first_name: 'John',
  last_name: 'Doe',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockErrorResponse = {
  ok: false,
  status: 400,
  json: () => Promise.resolve({ detail: 'An error occurred' }),
};

export const mockNetworkError = {
  message: "Network Error",
  code: "ERR_NETWORK"
};

export const mockApiResponse = (data: any) => ({
  ok: true,
  json: () => Promise.resolve(data),
});

export const mockApiError = new Error('Network Error');
