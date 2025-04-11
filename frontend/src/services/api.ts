import axios from 'axios';
import { User } from '@/types/user';
import { Ride } from '@/types/ride';
import { MatchingPreferences } from '@/types/preferences';
import { TravelPattern } from '@/types/travel-pattern';

// Mock data for development
const MOCK_DATA = {
  user: {
    id: 1,
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    phone_number: '+46701234567',
    home_address: '123 Home Street, Stockholm',
    work_address: '456 Work Avenue, Stockholm',
    user_type: 'Regular User',
    enterprise_id: 2,
    enterprise_name: 'TechCorp',
    preferred_starting_hub_id: 1,
    preferred_vehicle_type_id: 2
  } as User,
  
  matchingPreferences: {
    user_id: 1,
    max_detour_minutes: 15,
    max_wait_minutes: 10,
    max_walking_distance_meters: 1000,
    preferred_gender: null,
    preferred_language: null,
    minimum_driver_rating: 4.0,
    prefer_same_enterprise: true,
    prefer_same_destination: true,
    prefer_recurring_rides: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as MatchingPreferences,
  
  travelPatterns: [
    {
      id: 1,
      user_id: 1,
      origin_type: 'hub',
      origin_id: 1,
      origin_name: 'Central Station',
      origin_latitude: 57.7089,
      origin_longitude: 11.9746,
      destination_type: 'custom',
      destination_id: null,
      destination_name: 'Office Park',
      destination_latitude: 57.7189,
      destination_longitude: 11.9846,
      day_of_week: 1, // Tuesday
      departure_time: '08:00:00',
      frequency: 12,
      last_traveled: '2023-05-01'
    },
    {
      id: 2,
      user_id: 1,
      origin_type: 'hub',
      origin_id: 1,
      origin_name: 'Central Station',
      origin_latitude: 57.7089,
      origin_longitude: 11.9746,
      destination_type: 'custom',
      destination_id: null,
      destination_name: 'Office Park',
      destination_latitude: 57.7189,
      destination_longitude: 11.9846,
      day_of_week: 3, // Thursday
      departure_time: '08:15:00',
      frequency: 8,
      last_traveled: '2023-05-03'
    },
    {
      id: 3,
      user_id: 1,
      origin_type: 'hub',
      origin_id: 2,
      origin_name: 'North Station',
      origin_latitude: 57.7289,
      origin_longitude: 11.9546,
      destination_type: 'hub',
      destination_id: 3,
      destination_name: 'South Station',
      destination_latitude: 57.6989,
      destination_longitude: 11.9946,
      day_of_week: 1, // Tuesday
      departure_time: '17:30:00',
      frequency: 10,
      last_traveled: '2023-05-01'
    },
    {
      id: 4,
      user_id: 1,
      origin_type: 'hub',
      origin_id: 2,
      origin_name: 'North Station',
      origin_latitude: 57.7289,
      origin_longitude: 11.9546,
      destination_type: 'hub',
      destination_id: 3,
      destination_name: 'South Station',
      destination_latitude: 57.6989,
      destination_longitude: 11.9946,
      day_of_week: 3, // Thursday
      departure_time: '17:45:00',
      frequency: 7,
      last_traveled: '2023-05-03'
    },
    {
      id: 5,
      user_id: 1,
      origin_type: 'hub',
      origin_id: 4,
      origin_name: 'East Hub',
      origin_latitude: 57.7189,
      origin_longitude: 12.0046,
      destination_type: 'custom',
      destination_id: null,
      destination_name: 'Shopping Mall',
      destination_latitude: 57.7289,
      destination_longitude: 12.0146,
      day_of_week: 5, // Saturday
      departure_time: '10:00:00',
      frequency: 4,
      last_traveled: '2023-04-29'
    }
  ] as TravelPattern[],
  
  rideMatches: [
    {
      ride_id: 1,
      departure_time: new Date(new Date().getTime() + 5 * 60000).toISOString(),
      arrival_time: new Date(new Date().getTime() + 35 * 60000).toISOString(),
      hub_id: 1,
      hub_name: 'Central Station',
      destination_name: 'Business Park',
      vehicle_type: 'Sedan',
      available_seats: 3,
      total_capacity: 4,
      overall_score: 92,
      match_reasons: [
        'Exact time match',
        'Preferred starting hub',
        'Matches your regular travel pattern'
      ],
      driver_name: 'John Driver',
      driver_rating: 4.8,
      estimated_price: 75
    },
    {
      ride_id: 2,
      departure_time: new Date(new Date().getTime() + 15 * 60000).toISOString(),
      arrival_time: new Date(new Date().getTime() + 45 * 60000).toISOString(),
      hub_id: 1,
      hub_name: 'Central Station',
      destination_name: 'University Campus',
      vehicle_type: 'SUV',
      available_seats: 2,
      total_capacity: 6,
      overall_score: 85,
      match_reasons: [
        'Close departure time (15 min difference)',
        'Rode together 2 times before',
        'Same enterprise'
      ],
      driver_name: 'Jane Driver',
      driver_rating: 4.9,
      estimated_price: 85
    },
    {
      ride_id: 3,
      departure_time: new Date(new Date().getTime() - 10 * 60000).toISOString(),
      arrival_time: new Date(new Date().getTime() + 20 * 60000).toISOString(),
      hub_id: 1,
      hub_name: 'Central Station',
      destination_name: 'Shopping Mall',
      vehicle_type: 'Minivan',
      available_seats: 4,
      total_capacity: 7,
      overall_score: 78,
      match_reasons: [
        'Close departure time (10 min difference)',
        'Walking distance to starting hub',
        'Good overall match'
      ],
      driver_name: 'Sam Driver',
      driver_rating: 4.5,
      estimated_price: 65
    }
  ] as Ride[],
  
  hubs: [
    { id: 1, name: 'Central Station', latitude: 57.7089, longitude: 11.9746 },
    { id: 2, name: 'North Hub', latitude: 57.7289, longitude: 11.9546 },
    { id: 3, name: 'South Station', latitude: 57.6989, longitude: 11.9946 },
    { id: 4, name: 'East Hub', latitude: 57.7189, longitude: 12.0046 },
    { id: 5, name: 'West Station', latitude: 57.7089, longitude: 11.9346 }
  ],
  
  destinations: [
    { id: 1, name: 'Business Park', latitude: 57.7189, longitude: 11.9846 },
    { id: 2, name: 'University Campus', latitude: 57.7289, longitude: 11.9746 },
    { id: 3, name: 'Shopping Mall', latitude: 57.7289, longitude: 12.0146 },
    { id: 4, name: 'Airport', latitude: 57.6689, longitude: 12.2946 },
    { id: 5, name: 'Hospital', latitude: 57.7189, longitude: 11.9546 }
  ]
};

// Set to true to use mock data instead of real API
const USE_MOCK_DATA = true;

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Function to handle mock responses
const getMockResponse = (url: string, method: string, data?: any) => {
  if (url.includes('/auth/login')) {
    return {
      data: {
        access_token: 'mock_token_12345',
        user: MOCK_DATA.user
      }
    };
  }
  
  if (url.includes('/users/me')) {
    return { data: MOCK_DATA.user };
  }
  
  if (url.includes('/matching-preferences')) {
    if (method === 'get') {
      return { data: MOCK_DATA.matchingPreferences };
    }
    
    if (method === 'put') {
      const updatedPreferences = {
        ...MOCK_DATA.matchingPreferences,
        ...(typeof data === 'string' ? JSON.parse(data) : data),
        updated_at: new Date().toISOString()
      };
      
      MOCK_DATA.matchingPreferences = updatedPreferences;
      return { data: updatedPreferences };
    }
    
    if (url.includes('/reset')) {
      const defaultPreferences = {
        user_id: 1,
        max_detour_minutes: 15,
        max_wait_minutes: 10,
        max_walking_distance_meters: 1000,
        preferred_gender: null,
        preferred_language: null,
        minimum_driver_rating: 4.0,
        prefer_same_enterprise: true,
        prefer_same_destination: true,
        prefer_recurring_rides: true,
        created_at: MOCK_DATA.matchingPreferences.created_at,
        updated_at: new Date().toISOString()
      };
      
      MOCK_DATA.matchingPreferences = defaultPreferences;
      return { data: defaultPreferences };
    }
  }
  
  if (url.includes('/user-travel-patterns')) {
    return { data: MOCK_DATA.travelPatterns };
  }
  
  if (url.includes('/matching/find-rides')) {
    return { data: MOCK_DATA.rideMatches };
  }
  
  if (url.includes('/admin/hubs')) {
    return { data: MOCK_DATA.hubs };
  }
  
  if (url.includes('/admin/destinations')) {
    return { data: MOCK_DATA.destinations };
  }
  
  return { data: { message: 'Mock data not available for this endpoint' } };
};

// Override axios methods for mock data
if (USE_MOCK_DATA) {
  const originalMethods = {
    get: api.get,
    post: api.post,
    put: api.put,
    delete: api.delete
  };
  
  api.get = (url, config) => {
    console.log(`MOCK API GET: ${url}`);
    return Promise.resolve(getMockResponse(url, 'get'));
  };
  
  api.post = (url, data, config) => {
    console.log(`MOCK API POST: ${url}`, data);
    return Promise.resolve(getMockResponse(url, 'post', data));
  };
  
  api.put = (url, data, config) => {
    console.log(`MOCK API PUT: ${url}`, data);
    return Promise.resolve(getMockResponse(url, 'put', data));
  };
  
  api.delete = (url, config) => {
    console.log(`MOCK API DELETE: ${url}`);
    return Promise.resolve(getMockResponse(url, 'delete'));
  };
}

// API service with typed methods
const apiService = {
  // Auth
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  // User
  getCurrentUser: () => 
    api.get<User>('/users/me'),
  
  // Matching Preferences
  getMatchingPreferences: () => 
    api.get<MatchingPreferences>('/matching-preferences'),
  
  updateMatchingPreferences: (preferences: Partial<MatchingPreferences>) => 
    api.put<MatchingPreferences>('/matching-preferences', preferences),
  
  resetMatchingPreferences: () => 
    api.post<MatchingPreferences>('/matching-preferences/reset'),
  
  // Travel Patterns
  getTravelPatterns: () => 
    api.get<TravelPattern[]>('/user-travel-patterns'),
  
  // Ride Matching
  findMatchingRides: (params: {
    starting_hub_id: number;
    destination_id?: number;
    departure_time: string;
    time_flexibility?: number;
    max_results?: number;
  }) => api.post<Ride[]>('/matching/find-rides', params),
  
  // Booking
  bookRide: (ride_id: number, payment_method_id: number) => 
    api.post(`/bookings`, { ride_id, payment_method_id }),
    
  // Hubs and Destinations
  getHubs: () => api.get('/admin/hubs'),
  
  getDestinations: () => api.get('/admin/destinations')
};

export default apiService;
