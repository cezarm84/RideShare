import api from './api';
import mockReferenceData from './mockReferenceData';

export interface Ride {
  id: number;
  start_hub_id: number;
  destination_hub_id?: number;
  destination?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  enterprise_id?: number;
  driver_id?: number;
  vehicle_id?: number;
  ride_type: 'hub_to_hub' | 'hub_to_destination' | 'enterprise';
  departure_time: string;
  arrival_time?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  available_seats: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface RideFilters {
  start_hub_id?: number;
  destination_hub_id?: number;
  ride_type?: string;
  departure_date?: string;
  min_available_seats?: number;
}

export interface CreateRideData {
  start_hub_id: number;
  destination_hub_id?: number;
  destination?: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  enterprise_id?: number;
  ride_type: 'hub_to_hub' | 'hub_to_destination' | 'enterprise';
  departure_time: string;
  available_seats: number;
  price: number;
  vehicle_type_id: number;
}

const RideService = {
  getAllRides: async (filters?: RideFilters): Promise<Ride[]> => {
    const response = await api.get<Ride[]>('/rides', { params: filters });
    return response.data;
  },

  getRideById: async (id: number): Promise<Ride> => {
    const response = await api.get<Ride>(`/rides/${id}`);
    return response.data;
  },

  createRide: async (rideData: any): Promise<Ride> => {
    try {
      console.log('Creating ride with payload:', rideData);
      const response = await api.post<Ride>('/rides', rideData);
      console.log('Ride created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating ride:', error);

      // Check if we have validation errors in the response
      if (error.response && error.response.status === 422 && error.response.data) {
        console.error('Validation errors:', error.response.data);

        // Format validation errors into a more readable message
        let errorMessage = 'Validation error: ';
        if (error.response.data.detail) {
          if (Array.isArray(error.response.data.detail)) {
            errorMessage += error.response.data.detail.map((err: any) =>
              `${err.loc.join('.')} - ${err.msg}`
            ).join('; ');
          } else {
            errorMessage += error.response.data.detail;
          }
        } else {
          errorMessage += JSON.stringify(error.response.data);
        }

        throw new Error(errorMessage);
      }

      throw error;
    }
  },

  updateRide: async (id: number, rideData: Partial<CreateRideData>): Promise<Ride> => {
    const response = await api.put<Ride>(`/rides/${id}`, rideData);
    return response.data;
  },

  deleteRide: async (id: number): Promise<void> => {
    await api.delete(`/rides/${id}`);
  },

  // Get rides for the current user (as a passenger)
  getMyRides: async (): Promise<Ride[]> => {
    try {
      const response = await api.get<Ride[]>('/rides/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user rides:', error);
      // Return empty array if the API fails
      return [];
    }
  },

  // Get reference data for ride creation
  getRideReferenceData: async () => {
    try {
      // Try the new endpoint first
      const response = await api.get('/reference-data/ride-reference-data');
      console.log('Successfully fetched reference data from API:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching reference data from new endpoint:', error);

      try {
        // Fall back to the old endpoint if the new one fails
        const response = await api.get('/rides/reference-data');
        console.log('Successfully fetched reference data from old API endpoint:', response.data);
        return response.data;
      } catch (fallbackError) {
        console.error('Error fetching reference data from fallback endpoint:', fallbackError);
        console.log('Using mock reference data as final fallback');
        return mockReferenceData;
      }
    }
  },
};

export default RideService;

// For backward compatibility
export const rideService = RideService;
