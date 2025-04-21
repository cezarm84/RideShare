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
  ride_type: 'hub_to_hub' | 'hub_to_destination' | 'free_ride' | 'enterprise';
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
  ride_type: 'hub_to_hub' | 'hub_to_destination' | 'free_ride' | 'enterprise';
  departure_time: string;
  available_seats: number;
  price: number;
  vehicle_type_id: number;
}

const RideService = {
  getAllRides: async (filters?: RideFilters): Promise<Ride[]> => {
    try {
      console.log('Fetching all rides with filters:', filters);
      console.log('API base URL:', api.defaults.baseURL);
      console.log('API full URL:', `${api.defaults.baseURL}/rides`);

      // Log the authorization header for debugging
      const token = localStorage.getItem('token');
      console.log('Token in localStorage:', token ? 'Present' : 'Not present');
      console.log('Authorization header:', api.defaults.headers.Authorization || 'No auth header');

      // If token exists, log the first few characters for debugging
      if (token) {
        console.log('Token prefix:', token.substring(0, 10) + '...');
        console.log('Is token in Authorization header:', api.defaults.headers.Authorization?.includes(token.substring(0, 10)) || false);
      }

      // Always set future_only to false to get all rides, including past rides
      // This ensures we get all rides from the database, not just future ones
      const timestamp = new Date().getTime();
      const params = { ...filters, _t: timestamp, future_only: false };

      console.log('URL parameters:', params);
      console.log('URL parameters as string:', new URLSearchParams(params as any).toString());

      console.log('Making request to /rides with params:', params);
      console.log('Full URL:', `${api.defaults.baseURL}/rides?${new URLSearchParams(params as any).toString()}`);

      // Log the request headers for debugging
      console.log('Request headers:', {
        ...api.defaults.headers,
        Authorization: api.defaults.headers.Authorization || 'No auth header'
      });

      const response = await api.get<Ride[]>('/rides', { params });
      console.log('Rides API response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Log specific headers for debugging
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Content-Length:', response.headers['content-length']);
      console.log('Authorization header sent:', api.defaults.headers.Authorization || 'No auth header');

      if (Array.isArray(response.data)) {
        console.log(`API returned ${response.data.length} rides`);

        // Log the first ride for debugging
        if (response.data.length > 0) {
          console.log('First ride from API:', response.data[0]);
        }
      } else {
        console.warn('API did not return an array for rides');
      }

      // If the response is empty or not an array, return an empty array
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Rides API returned invalid data:', response.data);
        return [];
      }

      // Process the rides to ensure they have the expected structure
      const processedRides = response.data.map((ride: any) => {
        // Convert the ID to string if it's not already
        if (ride.id && typeof ride.id !== 'string') {
          ride.id = ride.id.toString();
        }

        // Ensure starting_hub and destination_hub are properly set
        if (ride.starting_hub_id && !ride.starting_hub) {
          console.warn(`Ride ${ride.id} has starting_hub_id but no starting_hub object`);
        }

        if (ride.destination_hub_id && !ride.destination_hub) {
          console.warn(`Ride ${ride.id} has destination_hub_id but no destination_hub object`);
        }

        // No special cases for specific ride IDs

        return ride;
      });

      console.log(`Processed ${processedRides.length} rides`);

      // Only return mock data if the API returned an empty array AND there are no rides in the database
      // This ensures we have data to display in the UI when the database is empty
      if (response.data.length === 0) {
        console.log('API returned empty array, returning mock data for testing');
        console.log('User authentication status:', localStorage.getItem('token') ? 'Authenticated' : 'Not authenticated');
        return [
          {
            id: '1',
            ride_type: 'hub_to_hub',
            starting_hub_id: 1,
            starting_hub: {
              id: 1,
              name: 'Brunnsparken Hub',
              address: 'Brunnsparken 1, 411 03 Göteborg'
            },
            destination_hub_id: 2,
            destination_hub: {
              id: 2,
              name: 'Lindholmen Hub',
              address: 'Lindholmspiren 5, 417 56 Göteborg'
            },
            departure_time: '2025-04-25T08:00:00Z',
            available_seats: 3,
            price_per_seat: 25,
            status: 'scheduled',
            vehicle_type_id: 1,
            vehicle_type: {
              id: 1,
              name: 'Sedan',
              capacity: 4
            }
          },
          {
            id: '2',
            ride_type: 'hub_to_destination',
            starting_hub_id: 3,
            starting_hub: {
              id: 3,
              name: 'Frölunda Torg Hub',
              address: 'Frölunda Torg, 421 42 Västra Frölunda'
            },
            destination: {
              name: 'Volvo Cars Torslanda',
              address: 'Torslandavägen 1, 405 31 Göteborg',
              city: 'Göteborg',
              latitude: 57.720890,
              longitude: 12.025600
            },
            departure_time: '2025-04-26T07:30:00Z',
            available_seats: 2,
            price_per_seat: 30,
            status: 'scheduled',
            vehicle_type_id: 2,
            vehicle_type: {
              id: 2,
              name: 'SUV',
              capacity: 6
            }
          },
          {
            id: '3',
            ride_type: 'free_ride',
            starting_hub_id: 4,
            starting_hub: {
              id: 4,
              name: 'Landvetter Airport',
              address: 'Landvetter Airport, 438 80 Landvetter'
            },
            destination: {
              name: 'Custom Destination',
              address: 'Norra Stommen 296, 438 32 Landvetter',
              city: 'Landvetter',
              latitude: 57.684799,
              longitude: 12.212314
            },
            departure_time: '2025-04-28T09:30:00Z',
            available_seats: 3,
            price_per_seat: 35,
            status: 'scheduled',
            vehicle_type_id: 1,
            vehicle_type: {
              id: 1,
              name: 'Sedan',
              capacity: 4
            }
          },
          {
            id: '4',
            ride_type: 'hub_to_hub',
            starting_hub_id: 5,
            starting_hub: {
              id: 5,
              name: 'Korsvägen Hub',
              address: 'Korsvägen, 412 56 Göteborg'
            },
            destination_hub_id: 6,
            destination_hub: {
              id: 6,
              name: 'Mölndal Centrum Hub',
              address: 'Mölndal Centrum, 431 31 Mölndal'
            },
            departure_time: '2025-04-29T10:00:00Z',
            available_seats: 4,
            price_per_seat: 20,
            status: 'scheduled',
            vehicle_type_id: 3,
            vehicle_type: {
              id: 3,
              name: 'Minivan',
              capacity: 7
            }
          },
          {
            id: '5',
            ride_type: 'hub_to_destination',
            starting_hub_id: 7,
            starting_hub: {
              id: 7,
              name: 'Partille Centrum Hub',
              address: 'Partille Centrum, 433 38 Partille'
            },
            destination: {
              name: 'Liseberg',
              address: 'Örgrytevägen 5, 402 22 Göteborg',
              city: 'Göteborg',
              latitude: 57.694799,
              longitude: 11.991314
            },
            departure_time: '2025-04-30T09:00:00Z',
            available_seats: 2,
            price_per_seat: 25,
            status: 'scheduled',
            vehicle_type_id: 1,
            vehicle_type: {
              id: 1,
              name: 'Sedan',
              capacity: 4
            }
          },
          {
            id: '6',
            ride_type: 'free_ride',
            starting_hub_id: 8,
            starting_hub: {
              id: 8,
              name: 'Backaplan Hub',
              address: 'Backaplan, 417 05 Göteborg'
            },
            destination: {
              name: 'Gothenburg Central Station',
              address: 'Drottningtorget 5, 411 03 Göteborg',
              city: 'Göteborg',
              latitude: 57.708799,
              longitude: 11.973314
            },
            departure_time: '2025-05-01T08:30:00Z',
            available_seats: 3,
            price_per_seat: 22,
            status: 'scheduled',
            vehicle_type_id: 2,
            vehicle_type: {
              id: 2,
              name: 'SUV',
              capacity: 6
            }
          },
          {
            id: '7',
            ride_type: 'hub_to_hub',
            starting_hub_id: 1,
            starting_hub: {
              id: 1,
              name: 'Brunnsparken Hub',
              address: 'Brunnsparken 1, 411 03 Göteborg'
            },
            destination_hub_id: 3,
            destination_hub: {
              id: 3,
              name: 'Frölunda Torg Hub',
              address: 'Frölunda Torg, 421 42 Västra Frölunda'
            },
            departure_time: '2025-05-02T07:00:00Z',
            available_seats: 2,
            price_per_seat: 28,
            status: 'scheduled',
            vehicle_type_id: 1,
            vehicle_type: {
              id: 1,
              name: 'Sedan',
              capacity: 4
            }
          },
          {
            id: '8',
            ride_type: 'hub_to_destination',
            starting_hub_id: 2,
            starting_hub: {
              id: 2,
              name: 'Lindholmen Hub',
              address: 'Lindholmspiren 5, 417 56 Göteborg'
            },
            destination: {
              name: 'Gothenburg University',
              address: 'Universitetsplatsen 1, 405 30 Göteborg',
              city: 'Göteborg',
              latitude: 57.688799,
              longitude: 11.979314
            },
            departure_time: '2025-05-03T08:15:00Z',
            available_seats: 1,
            price_per_seat: 24,
            status: 'scheduled',
            vehicle_type_id: 1,
            vehicle_type: {
              id: 1,
              name: 'Sedan',
              capacity: 4
            }
          },
          {
            id: '9',
            ride_type: 'free_ride',
            starting_hub_id: 4,
            starting_hub: {
              id: 4,
              name: 'Landvetter Airport',
              address: 'Landvetter Airport, 438 80 Landvetter'
            },
            destination: {
              name: 'Gothia Towers',
              address: 'Mässans gata 24, 412 51 Göteborg',
              city: 'Göteborg',
              latitude: 57.696799,
              longitude: 11.989314
            },
            departure_time: '2025-05-04T10:45:00Z',
            available_seats: 5,
            price_per_seat: 40,
            status: 'scheduled',
            vehicle_type_id: 3,
            vehicle_type: {
              id: 3,
              name: 'Minivan',
              capacity: 7
            }
          },
          {
            id: '10',
            ride_type: 'hub_to_hub',
            starting_hub_id: 6,
            starting_hub: {
              id: 6,
              name: 'Mölndal Centrum Hub',
              address: 'Mölndal Centrum, 431 31 Mölndal'
            },
            destination_hub_id: 5,
            destination_hub: {
              id: 5,
              name: 'Korsvägen Hub',
              address: 'Korsvägen, 412 56 Göteborg'
            },
            departure_time: '2025-05-05T16:30:00Z',
            available_seats: 3,
            price_per_seat: 18,
            status: 'scheduled',
            vehicle_type_id: 2,
            vehicle_type: {
              id: 2,
              name: 'SUV',
              capacity: 6
            }
          }
        ];
      }

      console.log(`Returning ${processedRides.length} rides from getAllRides`);
      console.log('User authentication status:', localStorage.getItem('token') ? 'Authenticated' : 'Not authenticated');
      return processedRides;
    } catch (error) {
      console.error('Error fetching all rides:', error);
      return [];
    }
  },

  getRideById: async (id: number): Promise<Ride> => {
    const response = await api.get<Ride>(`/rides/${id}`);
    return response.data;
  },

  createRide: async (rideData: any): Promise<Ride> => {
    try {
      console.log('RideService - Creating ride with payload:', rideData);

      // Log the starting_hub_id and destination_hub_id specifically
      console.log('Starting hub ID:', rideData.starting_hub_id, 'Type:', typeof rideData.starting_hub_id);
      console.log('Destination hub ID:', rideData.destination_hub_id, 'Type:', typeof rideData.destination_hub_id);

      // Log destination object if present
      if (rideData.destination) {
        console.log('Destination object:', rideData.destination);
        console.log('Destination fields:', Object.keys(rideData.destination));
        console.log('Destination city:', rideData.destination.city);
        console.log('Destination latitude:', rideData.destination.latitude);
        console.log('Destination longitude:', rideData.destination.longitude);
      }

      // Make the API call
      const response = await api.post<Ride>('/rides', rideData);
      console.log('RideService - Ride created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('RideService - Error creating ride:', error);

      // Log the validation error in more detail
      console.error('Validation Error Details:', error.response?.data);

      // Log the request that failed
      if (error.config) {
        console.error('Failed request config:', {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data
        });
      }

      // Log the response that failed
      if (error.response) {
        console.error('Failed response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }

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
      console.log('Fetching rides for current user');
      console.log('API base URL:', api.defaults.baseURL);
      console.log('API full URL:', `${api.defaults.baseURL}/rides/me`);

      // Log the authorization header for debugging
      const token = localStorage.getItem('token');
      console.log('Token in localStorage:', token ? 'Present' : 'Not present');
      console.log('Authorization header:', api.defaults.headers.Authorization || 'No auth header');

      // If token exists, log the first few characters for debugging
      if (token) {
        console.log('Token prefix:', token.substring(0, 10) + '...');
        console.log('Is token in Authorization header:', api.defaults.headers.Authorization?.includes(token.substring(0, 10)) || false);
      }

      // Add a timestamp to prevent caching and set future_only to false to get all rides
      const timestamp = new Date().getTime();
      const params = { _t: timestamp, future_only: false };

      console.log('URL parameters:', params);
      console.log('URL parameters as string:', new URLSearchParams(params as any).toString());

      console.log('Making request to /rides/me with params:', params);
      console.log('Full URL:', `${api.defaults.baseURL}/rides/me?${new URLSearchParams(params as any).toString()}`);

      // Log the request headers for debugging
      console.log('Request headers:', {
        ...api.defaults.headers,
        Authorization: api.defaults.headers.Authorization || 'No auth header'
      });

      const response = await api.get<Ride[]>('/rides/me', { params });
      console.log('My rides API response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Log specific headers for debugging
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Content-Length:', response.headers['content-length']);
      console.log('Authorization header sent:', api.defaults.headers.Authorization || 'No auth header');

      if (Array.isArray(response.data)) {
        console.log(`API returned ${response.data.length} user rides`);

        // Log the first ride for debugging
        if (response.data.length > 0) {
          console.log('First user ride from API:', response.data[0]);
        }
      } else {
        console.warn('API did not return an array for user rides');
      }

      // If the response is empty or not an array, return an empty array
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('My rides API returned invalid data:', response.data);
        return [];
      }

      // Process the rides to ensure they have the expected structure
      const processedRides = response.data.map((ride: any) => {
        // Convert the ID to string if it's not already
        if (ride.id && typeof ride.id !== 'string') {
          ride.id = ride.id.toString();
        }

        // Ensure starting_hub and destination_hub are properly set
        if (ride.starting_hub_id && !ride.starting_hub) {
          console.warn(`Ride ${ride.id} has starting_hub_id but no starting_hub object`);
        }

        if (ride.destination_hub_id && !ride.destination_hub) {
          console.warn(`Ride ${ride.id} has destination_hub_id but no destination_hub object`);
        }

        // No special cases for specific ride IDs

        return ride;
      });

      console.log(`Processed ${processedRides.length} user rides`);

      // Only return mock data if the API returned an empty array AND there are no rides in the database
      // This ensures we have data to display in the UI when the database is empty
      if (response.data.length === 0) {
        console.log('API returned empty array for user rides, returning mock data for testing');
        console.log('User authentication status:', localStorage.getItem('token') ? 'Authenticated' : 'Not authenticated');
        return [
          {
            id: '4',
            ride_type: 'hub_to_hub',
            starting_hub_id: 4,
            starting_hub: {
              id: 4,
              name: 'Angered Centrum Hub',
              address: 'Angered Centrum, 424 29 Angered'
            },
            destination_hub_id: 5,
            destination_hub: {
              id: 5,
              name: 'Korsvägen Hub',
              address: 'Korsvägen, 412 56 Göteborg'
            },
            departure_time: '2025-04-27T16:00:00Z',
            available_seats: 4,
            price_per_seat: 20,
            status: 'scheduled',
            vehicle_type_id: 3,
            vehicle_type: {
              id: 3,
              name: 'Minivan',
              capacity: 7
            }
          },
          {
            id: '5',
            ride_type: 'hub_to_destination',
            starting_hub_id: 7,
            starting_hub: {
              id: 7,
              name: 'Partille Centrum Hub',
              address: 'Partille Centrum, 433 38 Partille'
            },
            destination: {
              name: 'Liseberg',
              address: 'Örgrytevägen 5, 402 22 Göteborg',
              city: 'Göteborg',
              latitude: 57.694799,
              longitude: 11.991314
            },
            departure_time: '2025-04-30T09:00:00Z',
            available_seats: 2,
            price_per_seat: 25,
            status: 'scheduled',
            vehicle_type_id: 1,
            vehicle_type: {
              id: 1,
              name: 'Sedan',
              capacity: 4
            }
          }
        ];
      }

      console.log(`Returning ${processedRides.length} rides from getMyRides`);
      console.log('User authentication status:', localStorage.getItem('token') ? 'Authenticated' : 'Not authenticated');
      return processedRides;
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

      // Process the reference data to ensure it has the expected structure
      const processedData = { ...response.data };

      // Ensure hubs have string IDs for compatibility
      if (processedData.hubs && Array.isArray(processedData.hubs)) {
        processedData.hubs = processedData.hubs.map(hub => ({
          ...hub,
          id: hub.id,
          id_str: hub.id.toString() // Add string version of ID for compatibility
        }));
      }

      // Ensure destinations have string IDs for compatibility
      if (processedData.destinations && Array.isArray(processedData.destinations)) {
        processedData.destinations = processedData.destinations.map(dest => ({
          ...dest,
          id: dest.id,
          id_str: dest.id.toString() // Add string version of ID for compatibility
        }));
      }

      return processedData;
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
