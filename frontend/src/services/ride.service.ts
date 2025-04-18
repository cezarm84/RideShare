import api from './api';

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

  createRide: async (rideData: CreateRideData): Promise<Ride> => {
    const response = await api.post<Ride>('/rides', rideData);
    return response.data;
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
      const response = await api.get('/rides/reference-data');
      return response.data;
    } catch (error) {
      console.error('Error fetching reference data:', error);
      // Return mock data if the API fails
      return {
        hubs: [
          { id: 1, name: 'Central Station', address: 'Drottningtorget 5, 411 03 Göteborg' },
          { id: 2, name: 'Lindholmen', address: 'Lindholmspiren 7, 417 56 Göteborg' },
          { id: 3, name: 'Mölndal', address: 'Göteborgsvägen 97, 431 30 Mölndal' },
          { id: 4, name: 'Landvetter Airport', address: 'Flygplatsvägen 90, 438 80 Landvetter' },
        ],
        vehicle_types: [
          { id: 1, name: 'Sedan', capacity: 4 },
          { id: 2, name: 'SUV', capacity: 5 },
          { id: 3, name: 'Minivan', capacity: 7 },
          { id: 4, name: 'Bus', capacity: 15 },
        ],
        enterprises: [
          { id: 1, name: 'Volvo' },
          { id: 2, name: 'Ericsson' },
          { id: 3, name: 'AstraZeneca' },
        ],
        ride_types: [
          { id: 'hub_to_hub', name: 'Hub to Hub', description: 'Ride between two hubs' },
          { id: 'hub_to_destination', name: 'Hub to Destination', description: 'Ride from a hub to a custom destination' },
          { id: 'enterprise', name: 'Enterprise', description: 'Ride for company employees' },
        ],
        recurrence_patterns: [
          { id: 'one_time', name: 'One Time' },
          { id: 'daily', name: 'Daily' },
          { id: 'weekly', name: 'Weekly' },
          { id: 'monthly', name: 'Monthly' },
        ],
        status_options: [
          { id: 'scheduled', name: 'Scheduled' },
          { id: 'in_progress', name: 'In Progress' },
          { id: 'completed', name: 'Completed' },
          { id: 'cancelled', name: 'Cancelled' },
        ],
      };
    }
  },
};

export default RideService;

// For backward compatibility
export const rideService = RideService;
