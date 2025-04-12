import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Drivers from '../Drivers';
import { driverService } from '../../../services/driver.service';
import { useNavigate } from 'react-router-dom';

// Mock the dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../../services/driver.service', () => ({
  driverService: {
    getDrivers: jest.fn(),
    deleteDriver: jest.fn(),
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
              <td>{item.name}</td>
              <td>{item.email}</td>
              <td>{item.phone}</td>
              <td>{item.status}</td>
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

describe('Drivers Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useNavigate
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);

    // Mock service responses
    (driverService.getDrivers as jest.Mock).mockResolvedValue([
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
    ]);
  });

  it('should render drivers list', async () => {
    // Act
    render(<Drivers />);

    // Assert - initially should show loading state
    expect(screen.getByText('Drivers')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(driverService.getDrivers).toHaveBeenCalled();
    });

    // Check drivers are displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('inactive')).toBeInTheDocument();
    });
  });

  it('should navigate to create driver page when add button is clicked', async () => {
    // Act
    render(<Drivers />);

    // Wait for data to load
    await waitFor(() => {
      expect(driverService.getDrivers).toHaveBeenCalled();
    });

    // Click the add button
    fireEvent.click(screen.getByText('Add Driver'));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/drivers/new');
  });

  it('should navigate to edit driver page when edit button is clicked', async () => {
    // Act
    render(<Drivers />);

    // Wait for data to load
    await waitFor(() => {
      expect(driverService.getDrivers).toHaveBeenCalled();
    });

    // Click the edit button for the first driver
    fireEvent.click(screen.getAllByText('Edit')[0]);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/drivers/1/edit');
  });

  it('should delete driver when delete button is clicked', async () => {
    // Arrange
    (driverService.deleteDriver as jest.Mock).mockResolvedValue({});

    // Act
    render(<Drivers />);

    // Wait for data to load
    await waitFor(() => {
      expect(driverService.getDrivers).toHaveBeenCalled();
    });

    // Click the delete button for the first driver
    fireEvent.click(screen.getAllByText('Delete')[0]);

    // Assert
    await waitFor(() => {
      expect(driverService.deleteDriver).toHaveBeenCalledWith('1');
      expect(driverService.getDrivers).toHaveBeenCalledTimes(2); // Initial load + after delete
    });
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (driverService.getDrivers as jest.Mock).mockRejectedValue(new Error('API error'));

    // Act
    render(<Drivers />);

    // Assert
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching drivers:', expect.any(Error));
    });

    // Should still render the page structure
    expect(screen.getByText('Drivers')).toBeInTheDocument();

    // Cleanup
    consoleErrorSpy.mockRestore();
  });
});
