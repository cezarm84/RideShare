import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import BookingService from '@/services/booking.service';
import { useAuth } from '@/context/AuthContext';
import { LogIn, Calendar, MapPin, Clock, Users, Info } from 'lucide-react';

interface Booking {
  id: string;
  rideId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  seats: number;
  price: number;
  ride: {
    origin: string;
    destination: string;
    departureTime: string;
    driver: {
      name: string;
    };
  };
}

const Bookings = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    } else {
      // For unauthenticated users, we don't need to fetch anything
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      const data = await BookingService.getMyBookings();
      setBookings(data as unknown as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await BookingService.cancelBooking(bookingId);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // For unauthenticated users, show a welcome page with booking options
  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">RideShare Bookings</h1>

        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Welcome to RideShare Bookings
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Browse and book rides without signing in. You'll only need to sign in when you're ready to complete your payment.
          </p>
          <Button
            onClick={() => navigate('/bookings/progress')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Start Booking Now
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Browse Available Rides</h3>
            <p className="text-gray-600 text-sm mb-4">
              View all upcoming rides and their details without signing in
            </p>
            <Button
              variant="outline"
              className="mt-auto"
              onClick={() => navigate('/rides')}
            >
              View Rides
            </Button>
          </Card>

          <Card className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Plan Your Journey</h3>
            <p className="text-gray-600 text-sm mb-4">
              Select your pickup and dropoff locations, date, and time
            </p>
            <Button
              variant="outline"
              className="mt-auto"
              onClick={() => navigate('/bookings/progress')}
            >
              Plan Journey
            </Button>
          </Card>

          <Card className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Sign In for More</h3>
            <p className="text-gray-600 text-sm mb-4">
              Sign in to view your bookings, save preferences, and complete payments
            </p>
            <Button
              variant="outline"
              className="mt-auto"
              onClick={() => navigate('/signin')}
            >
              Sign In
            </Button>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How Booking Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <span className="font-semibold">1</span>
              </div>
              <h3 className="font-medium mb-2">Select Your Ride</h3>
              <p className="text-sm text-gray-600">
                Browse available rides or create a custom booking
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <span className="font-semibold">2</span>
              </div>
              <h3 className="font-medium mb-2">Choose Seats</h3>
              <p className="text-sm text-gray-600">
                Select your preferred seats and enter passenger details
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <span className="font-semibold">3</span>
              </div>
              <h3 className="font-medium mb-2">Pay & Confirm</h3>
              <p className="text-sm text-gray-600">
                Sign in to complete payment and confirm your booking
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // For authenticated users, show their bookings
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <Button
          onClick={() => navigate('/bookings/progress')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Create New Booking
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-6 text-center">
          <h3 className="font-semibold mb-2">No Bookings Found</h3>
          <p className="text-gray-600 mb-4">You haven't made any bookings yet.</p>
          <Button
            onClick={() => navigate('/bookings/progress')}
          >
            Create Your First Booking
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {booking.ride.origin} → {booking.ride.destination}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Departure: {new Date(booking.ride.departureTime).toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    Driver: {booking.ride.driver.name}
                  </p>
                  <p className="text-gray-600">
                    Seats: {booking.seats}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${booking.price}</p>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status}
                  </span>
                  {booking.status === 'pending' && (
                    <Button
                      variant="destructive"
                      className="mt-2"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;
