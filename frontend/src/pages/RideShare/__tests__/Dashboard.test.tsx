import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { useAuth } from '../../../context/AuthContext';
import { rideService } from '../../../services/ride.service';
import { bookingService } from '../../../services/booking.service';

// Mock the dependencies
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/ride.service', () => ({
  rideService: {
    getRides: jest.fn(),
  },
}));

jest.mock('../../../services/booking.service', () => ({
  bookingService: {
    getBookings: jest.fn(),
  },
}));

// Mock the Card component
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useAuth
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 1, name: 'Test User' },
    });
    
    // Mock service responses
    (rideService.getRides as jest.Mock).mockResolvedValue([
      { id: '1', status: 'active' },
      { id: '2', status: 'completed' },
      { id: '3', status: 'active' },
    ]);
    
    (bookingService.getBookings as jest.Mock).mockResolvedValue([
      { id: '1', status: 'pending', price: 50 },
      { id: '2', status: 'confirmed', price: 75 },
      { id: '3', status: 'pending', price: 30 },
    ]);
  });

  it('should render dashboard with stats', async () => {
    // Act
    render(<Dashboard />);
    
    // Assert - initially should show loading state or empty stats
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(rideService.getRides).toHaveBeenCalled();
      expect(bookingService.getBookings).toHaveBeenCalled();
    });
    
    // Check stats are displayed correctly
    await waitFor(() => {
      expect(screen.getByText('Total Rides')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total rides
      expect(screen.getByText('Active Rides')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Active rides
      expect(screen.getByText('Total Bookings')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total bookings
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('$155.00')).toBeInTheDocument(); // Total revenue
    });
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (rideService.getRides as jest.Mock).mockRejectedValue(new Error('API error'));
    
    // Act
    render(<Dashboard />);
    
    // Assert
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching dashboard data:', expect.any(Error));
    });
    
    // Should still render the dashboard structure
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Rides')).toBeInTheDocument();
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });

  it('should render recent activity and upcoming rides sections', async () => {
    // Act
    render(<Dashboard />);
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Rides')).toBeInTheDocument();
    });
  });
});
