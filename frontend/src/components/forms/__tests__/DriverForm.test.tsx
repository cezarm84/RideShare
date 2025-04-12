import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test-utils/test-setup';
import { mockErrorResponse, mockApiError } from '@/test-utils/api-mocks';
// import { mockApiResponse } from '@/test-utils/api-mocks'; // Unused import
import DriverForm from '../DriverForm';
import { useToast } from '@/components/ui/use-toast';
// import { DriverProfileCreate } from '@/types/driver'; // Unused import

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}));

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  createDriver: jest.fn(),
  updateDriver: jest.fn(),
}));

describe('DriverForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  it('renders all form fields', () => {
    renderWithProviders(<DriverForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByLabelText(/driver name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vehicle model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/license plate/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty form submission', async () => {
    renderWithProviders(<DriverForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /add driver/i }));

    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/phone number must be at least 10 digits/i)).toBeInTheDocument();
      expect(screen.getByText(/vehicle model is required/i)).toBeInTheDocument();
      expect(screen.getByText(/license plate is required/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    renderWithProviders(<DriverForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/driver name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/vehicle model/i), {
      target: { value: 'Toyota Camry' },
    });
    fireEvent.change(screen.getByLabelText(/license plate/i), {
      target: { value: 'ABC123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add driver/i }));

    // Check if onSubmit was called with correct data
    await waitFor(() => {
      // Check that onSubmit was called at least once
      expect(mockOnSubmit).toHaveBeenCalled();

      // Get the first argument of the first call
      const firstCallArg = mockOnSubmit.mock.calls[0][0];

      // Check the data structure
      expect(firstCallArg).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        vehicleModel: 'Toyota Camry',
        licensePlate: 'ABC123',
      });
    });
  });

  it('handles API error responses', async () => {
    // Mock the onSubmit function to throw an error
    mockOnSubmit.mockRejectedValueOnce(mockErrorResponse);

    renderWithProviders(<DriverForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/driver name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/vehicle model/i), {
      target: { value: 'Toyota Camry' },
    });
    fireEvent.change(screen.getByLabelText(/license plate/i), {
      target: { value: 'ABC123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add driver/i }));

    // Check if error message is shown in the UI
    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    // Mock the onSubmit function to throw a network error
    mockOnSubmit.mockRejectedValueOnce(mockApiError);

    renderWithProviders(<DriverForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/driver name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/vehicle model/i), {
      target: { value: 'Toyota Camry' },
    });
    fireEvent.change(screen.getByLabelText(/license plate/i), {
      target: { value: 'ABC123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add driver/i }));

    // Check if error message is shown in the UI
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    // Mock the onSubmit function to delay
    mockOnSubmit.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderWithProviders(<DriverForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/driver name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/vehicle model/i), {
      target: { value: 'Toyota Camry' },
    });
    fireEvent.change(screen.getByLabelText(/license plate/i), {
      target: { value: 'ABC123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /add driver/i }));

    // Check if loading state is shown
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // The button remains in "Saving..." state after submission
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    renderWithProviders(<DriverForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('pre-fills form with initial data when editing', () => {
    const initialData = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      vehicleModel: 'Toyota Camry',
      licensePlate: 'ABC123',
    };

    renderWithProviders(
      <DriverForm
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/driver name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('1234567890');
    expect(screen.getByLabelText(/vehicle model/i)).toHaveValue('Toyota Camry');
    expect(screen.getByLabelText(/license plate/i)).toHaveValue('ABC123');
  });
});