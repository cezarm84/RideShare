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
    const response = await api.get<Ride[]>('/rides/me');
    return response.data;
  },

  // Get reference data for ride creation
  getRideReferenceData: async () => {
    const response = await api.get('/rides/reference-data');
    return response.data;
  },
};

export default RideService;

// For backward compatibility
export const rideService = RideService;
