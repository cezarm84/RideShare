import api from './api';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  rating: number;
  totalRides: number;
  vehicle: {
    model: string;
    plateNumber: string;
  };
}

export interface CreateDriverDto {
  name: string;
  email: string;
  phone: string;
  vehicle: {
    model: string;
    plateNumber: string;
  };
}

export interface UpdateDriverDto {
  name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  vehicle?: {
    model: string;
    plateNumber: string;
  };
}

class DriverService {
  private readonly baseUrl = '/drivers';

  async getDrivers(): Promise<Driver[]> {
    const response = await api.get<Driver[]>(this.baseUrl);
    return response.data;
  }

  async getDriver(id: string): Promise<Driver> {
    const response = await api.get<Driver>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createDriver(data: CreateDriverDto): Promise<Driver> {
    const response = await api.post<Driver>(this.baseUrl, data);
    return response.data;
  }

  async updateDriver(id: string, data: UpdateDriverDto): Promise<Driver> {
    const response = await api.patch<Driver>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteDriver(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async verifyDriver(id: string): Promise<Driver> {
    const response = await api.post<Driver>(`${this.baseUrl}/${id}/verify`);
    return response.data;
  }

  async getDriverStats(id: string): Promise<{
    totalRides: number;
    completedRides: number;
    cancelledRides: number;
    averageRating: number;
  }> {
    const response = await api.get(`${this.baseUrl}/${id}/stats`);
    return response.data;
  }
}

export const driverService = new DriverService();
