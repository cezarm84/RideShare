import { DriverProfileResponse, DriverProfileCreate, DriverProfileUpdate } from '@/types/driver';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new ApiError(
          errorData?.detail || 'An error occurred',
          response.status,
          errorData
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Network Error',
        0
      );
    }
  }

  // Driver endpoints
  async createDriver(data: DriverProfileCreate): Promise<DriverProfileResponse> {
    return this.request<DriverProfileResponse>('/drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDriver(
    driverId: number,
    data: DriverProfileUpdate
  ): Promise<DriverProfileResponse> {
    return this.request<DriverProfileResponse>(`/drivers/${driverId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getDriver(driverId: number): Promise<DriverProfileResponse> {
    return this.request<DriverProfileResponse>(`/drivers/${driverId}`);
  }

  async deleteDriver(driverId: number): Promise<void> {
    await this.request(`/drivers/${driverId}`, {
      method: 'DELETE',
    });
  }

  // Add more API methods here as needed
}

export const apiClient = new ApiClient(); 