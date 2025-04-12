import { api } from './api';

export interface Hub {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  status: 'active' | 'inactive';
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
}

export interface CreateHubDto {
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  capacity: number;
  facilities: string[];
}

export interface UpdateHubDto {
  name?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  status?: 'active' | 'inactive';
  capacity?: number;
  facilities?: string[];
}

class HubService {
  private readonly baseUrl = '/hubs';

  async getHubs(): Promise<Hub[]> {
    const response = await api.get<Hub[]>(this.baseUrl);
    return response.data;
  }

  async getHub(id: string): Promise<Hub> {
    const response = await api.get<Hub>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createHub(data: CreateHubDto): Promise<Hub> {
    const response = await api.post<Hub>(this.baseUrl, data);
    return response.data;
  }

  async updateHub(id: string, data: UpdateHubDto): Promise<Hub> {
    const response = await api.patch<Hub>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteHub(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getHubStats(id: string): Promise<{
    totalRides: number;
    activeDrivers: number;
    averageOccupancy: number;
    peakHours: {
      hour: number;
      occupancy: number;
    }[];
  }> {
    const response = await api.get(`${this.baseUrl}/${id}/stats`);
    return response.data;
  }

  async updateHubOccupancy(id: string, occupancy: number): Promise<Hub> {
    const response = await api.patch<Hub>(`${this.baseUrl}/${id}/occupancy`, { occupancy });
    return response.data;
  }
}

export const hubService = new HubService(); 