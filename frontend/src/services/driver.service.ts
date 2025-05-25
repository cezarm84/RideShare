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

export interface DriverProfile {
  id: number;
  user_id: number;
  status: string;
  verification_status: string;
  license_number: string;
  license_expiry: string;
  license_state: string;
  license_country: string;
  license_class?: string;
  profile_photo_url?: string;
  average_rating: number;
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  preferred_radius_km: number;
  max_passengers: number;
  background_check_date?: string;
  background_check_status?: string;
  bio?: string;
  languages?: string;
  created_at: string;
  updated_at: string;
  ride_type_permissions: string[];
}

export interface DriverSchedule {
  id: number;
  driver_id: number;
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'one_time';
  day_of_week?: number;
  specific_date?: string;
  start_time: string;
  end_time: string;
  preferred_starting_hub_id?: number;
  preferred_area?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeOffRequest {
  id: number;
  driver_id: number;
  request_type: 'sick_leave' | 'vacation' | 'parental_leave' | 'other';
  start_date: string;
  end_date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  response_notes?: string;
  responded_by?: number;
  created_at: string;
  updated_at: string;
}

export interface IssueReport {
  id: number;
  driver_id: number;
  issue_type: 'vehicle' | 'passenger' | 'route' | 'other';
  ride_id?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  response?: string;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  photos: IssuePhoto[];
}

export interface IssuePhoto {
  id: number;
  issue_id: number;
  photo_url: string;
  filename: string;
  created_at: string;
}

export interface DriverRide {
  id: number;
  ride_type: string;
  starting_hub_id: number;
  destination_hub_id?: number;
  destination?: any;
  enterprise_id?: number;
  departure_time: string;
  arrival_time?: string;
  status: string;
  available_seats: number;
  driver_id?: number;
  price_per_seat: number;
  vehicle_type_id: number;
  starting_hub: {
    id: number;
    name: string;
    address: string;
    city: string;
  };
  destination_hub?: {
    id: number;
    name: string;
    address: string;
    city: string;
  };
  total_passengers: number;
  is_recurring: boolean;
  bookings: any[];
}

export interface DriverNotification {
  id: number;
  driver_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
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

  // Original methods
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

  // New methods for driver profile
  async getDriverProfile(driverId: number): Promise<DriverProfile> {
    try {
      try {
        const response = await api.get<DriverProfile>(`${this.baseUrl}/${driverId}`);
        return response.data;
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        // If API call fails, return mock data
        return {
          id: driverId,
          user_id: driverId,
          status: 'active',
          verification_status: 'verified',
          license_number: 'DL12345678',
          license_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
          license_state: 'Västra Götaland',
          license_country: 'Sweden',
          license_class: 'B',
          profile_photo_url: 'https://example.com/profile.jpg',
          average_rating: 4.8,
          total_rides: 156,
          completed_rides: 152,
          cancelled_rides: 4,
          preferred_radius_km: 25,
          max_passengers: 4,
          background_check_date: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
          background_check_status: 'passed',
          bio: 'Experienced driver with over 5 years of professional driving experience.',
          languages: 'Swedish, English',
          created_at: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
          updated_at: new Date().toISOString(),
          ride_type_permissions: ['hub_to_destination', 'enterprise', 'free_ride']
        };
      }
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      throw error;
    }
  }

  async updateDriverProfile(driverId: number, data: Partial<DriverProfile>): Promise<DriverProfile> {
    try {
      const response = await api.put<DriverProfile>(`${this.baseUrl}/${driverId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating driver profile:', error);
      throw error;
    }
  }

  // Driver schedule methods
  async getDriverSchedule(driverId: number, params?: { startDate?: string; endDate?: string }): Promise<DriverSchedule[]> {
    try {
      // Try to get data from the API
      try {
        const response = await api.get<DriverSchedule[]>(`${this.baseUrl}/${driverId}/schedule`, { params });
        return response.data;
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        // If API call fails, return mock data
        return [
          {
            id: 1,
            driver_id: driverId,
            recurrence_type: 'weekly',
            day_of_week: 1, // Tuesday
            start_time: '08:00:00',
            end_time: '16:00:00',
            preferred_starting_hub_id: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            driver_id: driverId,
            recurrence_type: 'weekly',
            day_of_week: 3, // Thursday
            start_time: '09:00:00',
            end_time: '17:00:00',
            preferred_starting_hub_id: 2,
            preferred_area: 'North Gothenburg',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 3,
            driver_id: driverId,
            recurrence_type: 'one_time',
            specific_date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
            start_time: '10:00:00',
            end_time: '18:00:00',
            preferred_starting_hub_id: 3,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.error('Error fetching driver schedule:', error);
      throw error;
    }
  }

  async createDriverSchedule(driverId: number, data: Omit<DriverSchedule, 'id' | 'driver_id' | 'created_at' | 'updated_at'>): Promise<DriverSchedule> {
    try {
      const response = await api.post<DriverSchedule>(`${this.baseUrl}/${driverId}/schedule`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating driver schedule:', error);
      throw error;
    }
  }

  async updateDriverSchedule(driverId: number, scheduleId: number, data: Partial<DriverSchedule>): Promise<DriverSchedule> {
    try {
      const response = await api.put<DriverSchedule>(`${this.baseUrl}/${driverId}/schedule/${scheduleId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating driver schedule:', error);
      throw error;
    }
  }

  async deleteDriverSchedule(driverId: number, scheduleId: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${driverId}/schedule/${scheduleId}`);
    } catch (error) {
      console.error('Error deleting driver schedule:', error);
      throw error;
    }
  }

  // Time off request methods
  async getDriverTimeOffRequests(driverId: number, params?: { status?: string }): Promise<TimeOffRequest[]> {
    try {
      try {
        const response = await api.get<TimeOffRequest[]>(`${this.baseUrl}/${driverId}/time-off`, { params });
        return response.data;
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        // If API call fails, return mock data
        const allRequests = [
          {
            id: 1,
            driver_id: driverId,
            request_type: 'vacation',
            start_date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0],
            end_date: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString().split('T')[0],
            reason: 'Annual vacation',
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            driver_id: driverId,
            request_type: 'sick_leave',
            start_date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
            end_date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0],
            reason: 'Cold/flu',
            status: 'approved',
            response_notes: 'Approved. Get well soon!',
            responded_by: 1,
            created_at: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString(),
            updated_at: new Date(new Date().setDate(new Date().getDate() - 6)).toISOString()
          },
          {
            id: 3,
            driver_id: driverId,
            request_type: 'parental_leave',
            start_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            end_date: new Date(new Date().setDate(new Date().getDate() + 35)).toISOString().split('T')[0],
            reason: 'Child is sick',
            status: 'pending',
            created_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
            updated_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
          }
        ];

        // Filter based on status if provided
        if (params?.status) {
          return allRequests.filter(request => request.status === params.status);
        }

        return allRequests;
      }
    } catch (error) {
      console.error('Error fetching driver time off requests:', error);
      throw error;
    }
  }

  async createTimeOffRequest(driverId: number, data: Omit<TimeOffRequest, 'id' | 'driver_id' | 'status' | 'response_notes' | 'responded_by' | 'created_at' | 'updated_at'>): Promise<TimeOffRequest> {
    try {
      const response = await api.post<TimeOffRequest>(`${this.baseUrl}/${driverId}/time-off`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating time off request:', error);
      throw error;
    }
  }

  async updateTimeOffRequest(driverId: number, requestId: number, data: { status: string; response_notes?: string }): Promise<TimeOffRequest> {
    try {
      const response = await api.put<TimeOffRequest>(`${this.baseUrl}/${driverId}/time-off/${requestId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating time off request:', error);
      throw error;
    }
  }

  async deleteTimeOffRequest(driverId: number, requestId: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${driverId}/time-off/${requestId}`);
    } catch (error) {
      console.error('Error deleting time off request:', error);
      throw error;
    }
  }

  // Issue report methods
  async getDriverIssueReports(driverId: number, params?: { status?: string }): Promise<IssueReport[]> {
    try {
      try {
        const response = await api.get<IssueReport[]>(`${this.baseUrl}/${driverId}/issues`, { params });
        return response.data;
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        // If API call fails, return mock data
        const allReports = [
          {
            id: 1,
            driver_id: driverId,
            issue_type: 'vehicle',
            priority: 'medium',
            description: 'Check engine light is on',
            status: 'open',
            created_at: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
            updated_at: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
            photos: []
          },
          {
            id: 2,
            driver_id: driverId,
            issue_type: 'passenger',
            ride_id: 101,
            priority: 'low',
            description: 'Passenger left items in the vehicle',
            status: 'resolved',
            response: 'Items have been returned to the passenger',
            assigned_to: 1,
            created_at: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
            updated_at: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(),
            photos: []
          },
          {
            id: 3,
            driver_id: driverId,
            issue_type: 'route',
            ride_id: 102,
            priority: 'high',
            description: 'Road closure on the regular route',
            status: 'in_progress',
            response: 'We are updating the navigation system with the detour information',
            assigned_to: 1,
            created_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
            updated_at: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
            photos: []
          }
        ];

        // Filter based on status if provided
        if (params?.status) {
          return allReports.filter(report => report.status === params.status);
        }

        return allReports;
      }
    } catch (error) {
      console.error('Error fetching driver issue reports:', error);
      throw error;
    }
  }

  async createIssueReport(driverId: number, data: Omit<IssueReport, 'id' | 'driver_id' | 'status' | 'response' | 'assigned_to' | 'created_at' | 'updated_at' | 'photos'>): Promise<IssueReport> {
    try {
      const response = await api.post<IssueReport>(`${this.baseUrl}/${driverId}/issues`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating issue report:', error);
      throw error;
    }
  }

  async updateIssueReport(driverId: number, issueId: number, data: { status?: string; priority?: string; response?: string; assigned_to?: number }): Promise<IssueReport> {
    try {
      const response = await api.put<IssueReport>(`${this.baseUrl}/${driverId}/issues/${issueId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating issue report:', error);
      throw error;
    }
  }

  async deleteIssueReport(driverId: number, issueId: number): Promise<void> {
    try {
      await api.delete(`${this.baseUrl}/${driverId}/issues/${issueId}`);
    } catch (error) {
      console.error('Error deleting issue report:', error);
      throw error;
    }
  }

  async uploadIssuePhoto(driverId: number, issueId: number, file: File): Promise<IssuePhoto> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<IssuePhoto>(
        `${this.baseUrl}/${driverId}/issues/${issueId}/photos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading issue photo:', error);
      throw error;
    }
  }

  // Driver rides methods
  async getDriverRides(driverId: number, params?: { startDate?: string; endDate?: string; status?: string }): Promise<DriverRide[]> {
    try {
      // For now, return mock data since the driver rides endpoint is not properly implemented
      console.log('Using mock driver rides data for driver:', driverId, 'with params:', params);
      // If API call fails, return mock data
      return [
        {
          id: 101,
          ride_type: 'hub_to_destination',
          starting_hub_id: 1,
          destination_hub_id: 2,
          departure_time: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
          arrival_time: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
          status: 'scheduled',
          available_seats: 4,
          driver_id: driverId,
          price_per_seat: 150,
          vehicle_type_id: 1,
          starting_hub: {
            id: 1,
            name: 'Brunnsparken Hub',
            address: 'Brunnsparken, 411 03 Göteborg',
            city: 'Göteborg'
          },
          destination_hub: {
            id: 2,
            name: 'Lindholmen Hub',
            address: 'Lindholmspiren 5, 417 56 Göteborg',
            city: 'Göteborg'
          },
          total_passengers: 2,
          is_recurring: false,
          bookings: []
        },
        {
          id: 102,
          ride_type: 'hub_to_destination',
          starting_hub_id: 2,
          destination_hub_id: 1,
          departure_time: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
          arrival_time: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
          status: 'scheduled',
          available_seats: 4,
          driver_id: driverId,
          price_per_seat: 150,
          vehicle_type_id: 1,
          starting_hub: {
            id: 2,
            name: 'Lindholmen Hub',
            address: 'Lindholmspiren 5, 417 56 Göteborg',
            city: 'Göteborg'
          },
          destination_hub: {
            id: 1,
            name: 'Brunnsparken Hub',
            address: 'Brunnsparken, 411 03 Göteborg',
            city: 'Göteborg'
          },
          total_passengers: 3,
          is_recurring: false,
          bookings: []
        },
        {
          id: 103,
          ride_type: 'hub_to_destination',
          starting_hub_id: 1,
          destination_hub_id: 3,
          departure_time: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
          arrival_time: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
          status: 'scheduled',
          available_seats: 4,
          driver_id: driverId,
          price_per_seat: 180,
          vehicle_type_id: 1,
          starting_hub: {
            id: 1,
            name: 'Brunnsparken Hub',
            address: 'Brunnsparken, 411 03 Göteborg',
            city: 'Göteborg'
          },
          destination_hub: {
            id: 3,
            name: 'Frölunda Torg Hub',
            address: 'Frölunda Torg, 421 42 Göteborg',
            city: 'Göteborg'
          },
          total_passengers: 0,
          is_recurring: false,
          bookings: []
        }
      ];
    } catch (error) {
      console.error('Error fetching driver rides:', error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  }

  // Driver notifications methods
  async getDriverNotifications(driverId: number): Promise<DriverNotification[]> {
    try {
      // Mock implementation - replace with actual API call when available
      return [
        {
          id: 1,
          driver_id: driverId,
          title: 'New ride assigned',
          message: 'You have been assigned a new ride for tomorrow at 9:00 AM.',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          driver_id: driverId,
          title: 'Vehicle inspection reminder',
          message: 'Your vehicle inspection is due in 7 days. Please schedule an appointment.',
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
      ];
    } catch (error) {
      console.error('Error fetching driver notifications:', error);
      throw error;
    }
  }

  // Driver documents methods
  async getDriverDocuments(driverId: number): Promise<any[]> {
    try {
      try {
        const response = await api.get<any[]>(`${this.baseUrl}/${driverId}/documents`);
        return response.data;
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        // If API call fails, return mock data
        return [
          {
            id: 1,
            driver_id: driverId,
            document_type: 'license',
            document_url: 'https://example.com/documents/license.pdf',
            filename: 'drivers_license.pdf',
            verification_status: 'verified',
            expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0],
            created_at: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString()
          },
          {
            id: 2,
            driver_id: driverId,
            document_type: 'insurance',
            document_url: 'https://example.com/documents/insurance.pdf',
            filename: 'car_insurance.pdf',
            verification_status: 'verified',
            expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
            created_at: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString()
          },
          {
            id: 3,
            driver_id: driverId,
            document_type: 'vehicle_photo',
            document_url: 'https://example.com/documents/vehicle.jpg',
            filename: 'vehicle_front.jpg',
            verification_status: 'verified',
            created_at: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
          },
          {
            id: 4,
            driver_id: driverId,
            document_type: 'profile_photo',
            document_url: 'https://example.com/documents/profile.jpg',
            filename: 'profile_photo.jpg',
            verification_status: 'verified',
            created_at: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString()
          },
          {
            id: 5,
            driver_id: driverId,
            document_type: 'background_check',
            document_url: 'https://example.com/documents/background.pdf',
            filename: 'background_check.pdf',
            verification_status: 'pending',
            created_at: new Date().toISOString()
          }
        ];
      }
    } catch (error) {
      console.error('Error fetching driver documents:', error);
      throw error;
    }
  }

  async uploadDriverDocument(driverId: number, documentType: string, file: File, expiryDate?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('file', file);

      if (expiryDate) {
        formData.append('expiry_date', expiryDate);
      }

      const response = await api.post<any>(
        `${this.baseUrl}/${driverId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error uploading driver document:', error);
      throw error;
    }
  }
}

export const driverService = new DriverService();
