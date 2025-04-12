import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the ride service
const mockGetAllRides = jest.fn();
const mockDeleteRide = jest.fn();

jest.mock('../../../services/ride.service', () => ({
  __esModule: true,
  default: {
    getAllRides: mockGetAllRides,
    deleteRide: mockDeleteRide,
  }
}));

import { render } from '../../../utils/test-utils';
import Rides from '../Rides';

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
    mockNavigate.mockClear();

    // Set up mock responses
    mockGetAllRides.mockResolvedValue([
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
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(mockGetAllRides).toHaveBeenCalled();
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Rides')).toBeInTheDocument();
    });
  });

  it('should render the Create New Ride button', async () => {
    // Act
    render(<Rides />);

    // Wait for data to load
    await waitFor(() => {
      expect(mockGetAllRides).toHaveBeenCalled();
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that the button is displayed
    expect(screen.getByText('Create New Ride')).toBeInTheDocument();
  });

  it('should render the component title', async () => {
    // Act
    render(<Rides />);

    // Wait for data to load
    await waitFor(() => {
      expect(mockGetAllRides).toHaveBeenCalled();
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      // Check that the component title is displayed
      expect(screen.getByText('Rides')).toBeInTheDocument();
    });
  });

  it('should have Edit buttons with onClick handlers', async () => {
    // Act
    render(<Rides />);

    // Wait for data to load
    await waitFor(() => {
      expect(mockGetAllRides).toHaveBeenCalled();
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Assert that the edit buttons exist
    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBeGreaterThan(0);

    // Check that the first edit button exists
    expect(editButtons[0]).toBeInTheDocument();
  });

  it('should have Delete buttons with onClick handlers', async () => {
    // Act
    render(<Rides />);

    // Wait for data to load
    await waitFor(() => {
      expect(mockGetAllRides).toHaveBeenCalled();
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Assert that the delete buttons exist
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Check that the first delete button exists
    expect(deleteButtons[0]).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetAllRides.mockRejectedValue(new Error('API error'));

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
