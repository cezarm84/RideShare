import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RideService from '@/services/ride.service';
import { useAuth } from '@/context/AuthContext';

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  availableSeats: number;
  price: number;
  status: 'active' | 'completed' | 'cancelled';
  driver: {
    id: string;
    name: string;
  };
}

const Rides = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const data = await RideService.getAllRides();
      setRides(data as unknown as Ride[]);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRide = () => {
    navigate('/rides/new');
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rides</h1>
        <Button onClick={handleCreateRide}>Create New Ride</Button>
      </div>

      <div className="grid gap-6">
        {rides.map((ride) => (
          <Card key={ride.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  {ride.origin} → {ride.destination}
                </h3>
                <p className="text-gray-600 mt-1">
                  Departure: {new Date(ride.departureTime).toLocaleString()}
                </p>
                <p className="text-gray-600">
                  Driver: {ride.driver.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">${ride.price}</p>
                <p className="text-sm text-gray-600">
                  {ride.availableSeats} seats available
                </p>
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  ride.status === 'active' ? 'bg-green-100 text-green-800' :
                  ride.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {ride.status}
                </span>
                <div className="mt-4 flex space-x-2">
                  <Button
                    onClick={() => navigate(`/rides/${ride.id}/edit`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => console.log(`Delete ride ${ride.id}`)}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Rides;
