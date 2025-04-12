import { rideService } from '../ride.service';
import api from '../api';

// Mock the axios instance
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('RideService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRides', () => {
    it('should fetch all rides without filters', async () => {
      // Arrange
      const mockRides = [
        {
          id: '1',
          origin: 'New York',
          destination: 'Boston',
          departureTime: '2023-01-01T10:00:00Z',
          availableSeats: 3,
          price: 50,
          status: 'active',
          driver: { id: '1', name: 'John Doe' },
        },
      ];
      
      const mockResponse = { data: mockRides };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const result = await rideService.getAllRides();
      
      // Assert
      expect(api.get).toHaveBeenCalledWith('/rides', { params: undefined });
      expect(result).toEqual(mockRides);
    });

    it('should fetch rides with filters', async () => {
      // Arrange
      const filters = {
        start_hub_id: 1,
        min_available_seats: 2,
      };
      
      const mockRides = [
        {
          id: '1',
          origin: 'New York',
          destination: 'Boston',
          departureTime: '2023-01-01T10:00:00Z',
          availableSeats: 3,
          price: 50,
          status: 'active',
          driver: { id: '1', name: 'John Doe' },
        },
      ];
      
      const mockResponse = { data: mockRides };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const result = await rideService.getAllRides(filters);
      
      // Assert
      expect(api.get).toHaveBeenCalledWith('/rides', { params: filters });
      expect(result).toEqual(mockRides);
    });
  });

  describe('getRideById', () => {
    it('should fetch a ride by id', async () => {
      // Arrange
      const rideId = 1;
      const mockRide = {
        id: '1',
        origin: 'New York',
        destination: 'Boston',
        departureTime: '2023-01-01T10:00:00Z',
        availableSeats: 3,
        price: 50,
        status: 'active',
        driver: { id: '1', name: 'John Doe' },
      };
      
      const mockResponse = { data: mockRide };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const result = await rideService.getRideById(rideId);
      
      // Assert
      expect(api.get).toHaveBeenCalledWith(`/rides/${rideId}`);
      expect(result).toEqual(mockRide);
    });
  });

  describe('createRide', () => {
    it('should create a new ride', async () => {
      // Arrange
      const rideData = {
        start_hub_id: 1,
        destination_hub_id: 2,
        ride_type: 'hub_to_hub' as const,
        departure_time: '2023-01-01T10:00:00Z',
        available_seats: 4,
        price: 50,
        vehicle_type_id: 1,
      };
      
      const mockRide = {
        id: '1',
        ...rideData,
        status: 'active',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };
      
      const mockResponse = { data: mockRide };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const result = await rideService.createRide(rideData);
      
      // Assert
      expect(api.post).toHaveBeenCalledWith('/rides', rideData);
      expect(result).toEqual(mockRide);
    });
  });

  describe('updateRide', () => {
    it('should update an existing ride', async () => {
      // Arrange
      const rideId = 1;
      const rideData = {
        available_seats: 3,
        price: 60,
      };
      
      const mockRide = {
        id: '1',
        origin: 'New York',
        destination: 'Boston',
        departureTime: '2023-01-01T10:00:00Z',
        availableSeats: 3,
        price: 60,
        status: 'active',
        driver: { id: '1', name: 'John Doe' },
      };
      
      const mockResponse = { data: mockRide };
      (api.put as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const result = await rideService.updateRide(rideId, rideData);
      
      // Assert
      expect(api.put).toHaveBeenCalledWith(`/rides/${rideId}`, rideData);
      expect(result).toEqual(mockRide);
    });
  });

  describe('deleteRide', () => {
    it('should delete a ride', async () => {
      // Arrange
      const rideId = 1;
      (api.delete as jest.Mock).mockResolvedValue({});
      
      // Act
      await rideService.deleteRide(rideId);
      
      // Assert
      expect(api.delete).toHaveBeenCalledWith(`/rides/${rideId}`);
    });
  });
});
