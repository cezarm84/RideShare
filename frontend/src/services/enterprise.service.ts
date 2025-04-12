import { api } from './api';

export interface Enterprise {
  id: string;
  name: string;
  type: 'corporate' | 'government' | 'educational' | 'other';
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'active' | 'inactive';
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    startDate: string;
    endDate: string;
  };
  stats: {
    totalEmployees: number;
    activeUsers: number;
    totalRides: number;
  };
}

export interface CreateEnterpriseDto {
  name: string;
  type: 'corporate' | 'government' | 'educational' | 'other';
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    startDate: string;
    endDate: string;
  };
}

export interface UpdateEnterpriseDto {
  name?: string;
  type?: 'corporate' | 'government' | 'educational' | 'other';
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  status?: 'active' | 'inactive';
  subscription?: {
    plan?: 'basic' | 'premium' | 'enterprise';
    startDate?: string;
    endDate?: string;
  };
}

class EnterpriseService {
  private readonly baseUrl = '/enterprises';

  async getEnterprises(): Promise<Enterprise[]> {
    const response = await api.get<Enterprise[]>(this.baseUrl);
    return response.data;
  }

  async getEnterprise(id: string): Promise<Enterprise> {
    const response = await api.get<Enterprise>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createEnterprise(data: CreateEnterpriseDto): Promise<Enterprise> {
    const response = await api.post<Enterprise>(this.baseUrl, data);
    return response.data;
  }

  async updateEnterprise(id: string, data: UpdateEnterpriseDto): Promise<Enterprise> {
    const response = await api.patch<Enterprise>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteEnterprise(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getEnterpriseStats(id: string): Promise<{
    totalRides: number;
    activeUsers: number;
    totalSpent: number;
    averageRidesPerUser: number;
    popularRoutes: {
      origin: string;
      destination: string;
      count: number;
    }[];
  }> {
    const response = await api.get(`${this.baseUrl}/${id}/stats`);
    return response.data;
  }

  async updateSubscription(id: string, subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    startDate: string;
    endDate: string;
  }): Promise<Enterprise> {
    const response = await api.patch<Enterprise>(`${this.baseUrl}/${id}/subscription`, { subscription });
    return response.data;
  }
}

export const enterpriseService = new EnterpriseService();
