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
      // Return mock data if the API fails - with 8 hubs and 5 destinations (total 13)
      return {
        hubs: [
          { id: 1, name: 'Brunnsparken Hub', address: 'Brunnsparken, 411 03 Göteborg', city: 'Göteborg' },
          { id: 2, name: 'Lindholmen Hub', address: 'Lindholmspiren 5, 417 56 Göteborg', city: 'Göteborg' },
          { id: 3, name: 'Mölndal Hub', address: 'Göteborgsvägen 97, 431 30 Mölndal', city: 'Mölndal' },
          { id: 4, name: 'Landvetter Hub', address: 'Flygplatsvägen 90, 438 80 Landvetter', city: 'Landvetter' },
          { id: 5, name: 'Partille Hub', address: 'Partille Centrum, 433 38 Partille', city: 'Partille' },
          { id: 6, name: 'Kungsbacka Hub', address: 'Kungsbacka Station, 434 30 Kungsbacka', city: 'Kungsbacka' },
          { id: 7, name: 'Lerum Hub', address: 'Lerum Station, 443 30 Lerum', city: 'Lerum' },
          { id: 8, name: 'Kungälv Hub', address: 'Kungälv Resecentrum, 442 30 Kungälv', city: 'Kungälv' },
        ],
        destinations: [
          { id: 101, name: 'Volvo Cars Torslanda', address: 'Torslandavägen 1, 405 31 Göteborg', city: 'Göteborg' },
          { id: 102, name: 'Volvo Group Lundby', address: 'Gropegårdsgatan 2, 417 15 Göteborg', city: 'Göteborg' },
          { id: 103, name: 'AstraZeneca Mölndal', address: 'Pepparedsleden 1, 431 83 Mölndal', city: 'Mölndal' },
          { id: 104, name: 'Ericsson Lindholmen', address: 'Lindholmspiren 11, 417 56 Göteborg', city: 'Göteborg' },
          { id: 105, name: 'SKF Gamlestaden', address: 'Hornsgatan 1, 415 50 Göteborg', city: 'Göteborg' },
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
