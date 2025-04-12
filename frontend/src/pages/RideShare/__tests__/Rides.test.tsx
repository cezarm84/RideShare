import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Rides from '../Rides';
import { rideService } from '../../../services/ride.service';
import { useNavigate } from 'react-router-dom';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../../services/ride.service', () => ({
  rideService: {
    getAllRides: jest.fn(),
    deleteRide: jest.fn(),
  },
}));

// Mock the DataTable component
jest.mock('@/components/ui/data-table', () => ({
  DataTable: ({ data }: { data: any[] }) => (
    <div data-testid="data-table">
      <table>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.origin}</td>
              <td>{item.destination}</td>
              <td>{item.departureTime}</td>
              <td>
                <button onClick={() => item.onEdit()}>Edit</button>
                <button onClick={() => item.onDelete()}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}));

// Mock the Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe('Rides Component', () => {
  const mockNavigate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useNavigate
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    
    // Mock service responses
    (rideService.getAllRides as jest.Mock).mockResolvedValue([
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
      {
        id: '2',
        origin: 'Boston',
        destination: 'Chicago',
        departureTime: '2023-01-02T12:00:00Z',
        availableSeats: 2,
        price: 75,
        status: 'active',
        driver: { id: '2', name: 'Jane Smith' },
      },
    ]);
  });

  it('should render rides list', async () => {
    // Act
    render(<Rides />);
    
    // Assert - initially should show loading state
    expect(screen.getByText('Rides')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(rideService.getAllRides).toHaveBeenCalled();
    });
    
    // Check rides are displayed
    await waitFor(() => {
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getByText('Boston')).toBeInTheDocument();
      expect(screen.getByText('Chicago')).toBeInTheDocument();
    });
  });

  it('should navigate to create ride page when add button is clicked', async () => {
    // Act
    render(<Rides />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(rideService.getAllRides).toHaveBeenCalled();
    });
    
    // Click the add button
    fireEvent.click(screen.getByText('Add Ride'));
    
    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/rides/new');
  });

  it('should navigate to edit ride page when edit button is clicked', async () => {
    // Act
    render(<Rides />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(rideService.getAllRides).toHaveBeenCalled();
    });
    
    // Click the edit button for the first ride
    fireEvent.click(screen.getAllByText('Edit')[0]);
    
    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/rides/1/edit');
  });

  it('should delete ride when delete button is clicked', async () => {
    // Arrange
    (rideService.deleteRide as jest.Mock).mockResolvedValue({});
    
    // Act
    render(<Rides />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(rideService.getAllRides).toHaveBeenCalled();
    });
    
    // Click the delete button for the first ride
    fireEvent.click(screen.getAllByText('Delete')[0]);
    
    // Assert
    await waitFor(() => {
      expect(rideService.deleteRide).toHaveBeenCalledWith('1');
      expect(rideService.getAllRides).toHaveBeenCalledTimes(2); // Initial load + after delete
    });
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (rideService.getAllRides as jest.Mock).mockRejectedValue(new Error('API error'));
    
    // Act
    render(<Rides />);
    
    // Assert
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching rides:', expect.any(Error));
    });
    
    // Should still render the page structure
    expect(screen.getByText('Rides')).toBeInTheDocument();
    
    // Cleanup
    consoleErrorSpy.mockRestore();
  });
});
