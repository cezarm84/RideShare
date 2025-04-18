import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import PageMeta from '@/components/common/PageMeta';

interface Booking {
  id: string;
  rideId: string;
  userId: string;
  numberOfSeats: number;
  totalPrice: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  createdAt: string;
  ride: {
    startingHub: {
      name: string;
      address: string;
    };
    destinationHub: {
      name: string;
      address: string;
    };
    departureTime: string;
    driver?: {
      name: string;
      phone?: string;
    };
    vehicleType: {
      name: string;
    };
  };
}

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    const params = new URLSearchParams(location.search);
    const bookingId = params.get('bookingId');
    
    if (!bookingId) {
      navigate('/bookings');
      return;
    }

    // Fetch booking details
    const fetchBooking = async () => {
      setLoading(true);
      try {
        // In a real app, we would fetch from the API
        // const response = await apiClient.get<Booking>(`/bookings/${bookingId}`);
        // setBooking(response);
        
        // For now, use mock data
        setTimeout(() => {
          setBooking({
            id: bookingId,
            rideId: 'ride123',
            userId: 'user456',
            numberOfSeats: 2,
            totalPrice: 50,
            status: 'confirmed',
            paymentMethod: 'credit_card',
            paymentStatus: 'paid',
            createdAt: new Date().toISOString(),
            ride: {
              startingHub: {
                name: 'Central Station',
                address: 'Drottningtorget 5, 411 03 Göteborg'
              },
              destinationHub: {
                name: 'Lindholmen',
                address: 'Lindholmspiren 7, 417 56 Göteborg'
              },
              departureTime: new Date(Date.now() + 3600000).toISOString(),
              driver: {
                name: 'Johan Andersson',
                phone: '+46 70 123 4567'
              },
              vehicleType: {
                name: 'Sedan'
              }
            }
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching booking:', error);
        navigate('/bookings');
      }
    };

    fetchBooking();
  }, [isAuthenticated, location.search, navigate]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
        <p className="mb-4">The booking you're looking for could not be found.</p>
        <Button onClick={() => navigate('/bookings')}>View My Bookings</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageMeta 
        title="RideShare - Booking Confirmation" 
        description="Your ride booking has been confirmed."
      />
      
      <div className="max-w-3xl mx-auto">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600">
              Your booking has been successfully confirmed. Below are your booking details.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Booking Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Booking ID</p>
                <p className="font-medium">{booking.id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Booking Date</p>
                <p className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium capitalize">{booking.status}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-medium capitalize">{booking.paymentMethod.replace('_', ' ')}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="font-medium capitalize">{booking.paymentStatus}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Number of Seats</p>
                <p className="font-medium">{booking.numberOfSeats}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Ride Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">From</p>
                <p className="font-medium">{booking.ride.startingHub.name}</p>
                <p className="text-sm text-gray-600">{booking.ride.startingHub.address}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">To</p>
                <p className="font-medium">{booking.ride.destinationHub.name}</p>
                <p className="text-sm text-gray-600">{booking.ride.destinationHub.address}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Departure Time</p>
                <p className="font-medium">{new Date(booking.ride.departureTime).toLocaleString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Vehicle Type</p>
                <p className="font-medium">{booking.ride.vehicleType.name}</p>
              </div>
              
              {booking.ride.driver && (
                <div>
                  <p className="text-sm text-gray-600">Driver</p>
                  <p className="font-medium">{booking.ride.driver.name}</p>
                  {booking.ride.driver.phone && (
                    <p className="text-sm text-gray-600">{booking.ride.driver.phone}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Payment Summary</h2>
            <div className="flex justify-between mb-2">
              <p>Price per seat</p>
              <p>${(booking.totalPrice / booking.numberOfSeats).toFixed(2)}</p>
            </div>
            
            <div className="flex justify-between mb-2">
              <p>Number of seats</p>
              <p>{booking.numberOfSeats}</p>
            </div>
            
            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
              <p>Total</p>
              <p>${booking.totalPrice.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={() => navigate('/bookings')}
              className="bg-brand-500 hover:bg-brand-600"
            >
              View My Bookings
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/rides')}
            >
              Find More Rides
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BookingConfirmation;
