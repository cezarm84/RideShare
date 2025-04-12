import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BookingService from '@/services/booking.service';
import { useAuth } from '@/context/AuthContext';

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
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

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
    </div>
  );
};

export default Bookings;