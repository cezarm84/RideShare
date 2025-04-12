import { driverService } from '../driver.service';
import api from '../api';

// Mock the axios instance
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('DriverService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDrivers', () => {
    it('should fetch all drivers', async () => {
      // Arrange
      const mockDrivers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          status: 'active',
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          status: 'inactive',
        },
      ];

      const mockResponse = { data: mockDrivers };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await driverService.getDrivers();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/drivers');
      expect(result).toEqual(mockDrivers);
    });
  });

  describe('getDriver', () => {
    it('should fetch a driver by id', async () => {
      // Arrange
      const driverId = '1';
      const mockDriver = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        status: 'active',
      };

      const mockResponse = { data: mockDriver };
      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await driverService.getDriver(driverId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/drivers/${driverId}`);
      expect(result).toEqual(mockDriver);
    });
  });

  describe('createDriver', () => {
    it('should create a new driver', async () => {
      // Arrange
      const driverData = {
        user_id: '1',
        license_number: 'DL12345',
        license_expiry: '2025-01-01',
        vehicle_type_ids: [1, 2],
      };

      const mockDriver = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        status: 'active',
        license_number: 'DL12345',
        license_expiry: '2025-01-01',
      };

      const mockResponse = { data: mockDriver };
      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await driverService.createDriver(driverData);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/drivers', driverData);
      expect(result).toEqual(mockDriver);
    });
  });

  describe('updateDriver', () => {
    it('should update an existing driver', async () => {
      // Arrange
      const driverId = '1';
      const driverData = {
        phone: '+9876543210',
        status: 'inactive',
      };

      const mockDriver = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+9876543210',
        status: 'inactive',
      };

      const mockResponse = { data: mockDriver };
      (api.patch as jest.Mock).mockResolvedValue(mockResponse);

      // Act
      const result = await driverService.updateDriver(driverId, driverData);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/drivers/${driverId}`, driverData);
      expect(result).toEqual(mockDriver);
    });
  });

  describe('deleteDriver', () => {
    it('should delete a driver', async () => {
      // Arrange
      const driverId = '1';
      (api.delete as jest.Mock).mockResolvedValue({});

      // Act
      await driverService.deleteDriver(driverId);

      // Assert
      expect(api.delete).toHaveBeenCalledWith(`/drivers/${driverId}`);
    });
  });
});
