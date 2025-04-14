import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactForm from '../ContactForm';
import { mockSubmitContactMessage } from '../../../services/ContactService';

// Mock the ContactService
jest.mock('../../../services/ContactService', () => ({
  mockSubmitContactMessage: jest.fn().mockResolvedValue({
    id: 123,
    status: 'new',
    created_at: '2023-01-01T00:00:00Z'
  })
}));

// Mock the AuthContext
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null
  })
}));

describe('ContactForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form fields', () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<ContactForm />);

    // Submit the form without filling any fields
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    // Check for validation errors
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/subject is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/message is required/i)).toBeInTheDocument();
  });

  it('submits the form successfully when all required fields are filled', async () => {
    render(<ContactForm />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'This is a test message that is long enough to pass validation.' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    // Wait for the success message
    await waitFor(() => {
      expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    });

    // Check that the service was called with the correct data
    expect(mockSubmitContactMessage).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '',
      subject: 'Test Subject',
      message: 'This is a test message that is long enough to pass validation.',
      category: 'general'
    });
  });

  it('shows an error message when submission fails', async () => {
    // Mock the service to reject
    (mockSubmitContactMessage as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    render(<ContactForm />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/subject/i), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'This is a test message that is long enough to pass validation.' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/error sending message/i)).toBeInTheDocument();
      expect(screen.getByText(/test error/i)).toBeInTheDocument();
    });
  });
});
