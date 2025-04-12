import api from './api';

export interface Booking {
  id: number;
  ride_id: number;
  user_id: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_id?: number;
  payment_status?: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  ride_id: number;
  payment_method_id?: number;
}

export interface BookingWithRideDetails extends Booking {
  ride: {
    id: number;
    start_hub_id: number;
    destination_hub_id?: number;
    destination?: {
      address: string;
      latitude: number;
      longitude: number;
    };
    departure_time: string;
    arrival_time?: string;
    status: string;
    price: number;
  };
}

const BookingService = {
  getAllBookings: async (): Promise<Booking[]> => {
    const response = await api.get<Booking[]>('/bookings');
    return response.data;
  },
  
  getBookingById: async (id: number): Promise<Booking> => {
    const response = await api.get<Booking>(`/bookings/${id}`);
    return response.data;
  },
  
  createBooking: async (bookingData: CreateBookingData): Promise<Booking> => {
    const response = await api.post<Booking>('/bookings', bookingData);
    return response.data;
  },
  
  cancelBooking: async (id: number): Promise<Booking> => {
    const response = await api.put<Booking>(`/bookings/${id}/cancel`);
    return response.data;
  },
  
  // Get bookings for the current user
  getMyBookings: async (): Promise<BookingWithRideDetails[]> => {
    const response = await api.get<BookingWithRideDetails[]>('/bookings/me');
    return response.data;
  },
  
  // Process payment for a booking
  processPayment: async (bookingId: number, paymentMethodId: number): Promise<Booking> => {
    const response = await api.post<Booking>(`/bookings/${bookingId}/payment`, {
      payment_method_id: paymentMethodId
    });
    return response.data;
  },
};

export default BookingService;
