import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/services/api';

interface Ride {
  id: number;
  ride_type: string;
  starting_hub_name: string;
  destination_hub_name: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  driver_name?: string;
  status: string;
  created_at: string;
}

const RidesManagement = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try the admin/rides endpoint first
      try {
        console.log('Fetching rides from admin/rides endpoint');
        const response = await api.get('/admin/rides');
        console.log('Rides data received:', response.data);
        setRides(response.data);
        return;
      } catch (adminErr) {
        console.error('Error fetching from admin/rides endpoint:', adminErr);

        // Try the regular rides endpoint as fallback
        try {
          console.log('Trying fallback to /rides endpoint');
          const response = await api.get('/rides');
          console.log('Rides data received from fallback endpoint:', response.data);

          // Transform the data to match the expected format if needed
          const formattedRides = response.data.map(ride => ({
            id: ride.id,
            ride_type: ride.ride_type,
            starting_hub_name: ride.starting_hub?.name || 'Unknown',
            destination_hub_name: ride.destination?.name || ride.destination_hub?.name || 'Unknown',
            departure_time: ride.departure_time,
            available_seats: ride.available_seats,
            price_per_seat: ride.price_per_seat,
            driver_name: ride.driver?.name || 'Not assigned',
            status: ride.status,
            created_at: ride.created_at
          }));

          setRides(formattedRides);
          return;
        } catch (ridesErr) {
          console.error('Error fetching from rides endpoint:', ridesErr);
          throw ridesErr; // Re-throw to be caught by the outer catch
        }
      }
    } catch (err) {
      console.error('All attempts to fetch rides failed:', err);
      setError('Failed to load rides. Please try again later.');

      // Mock data for development
      const mockRides = [
        {
          id: 1,
          ride_type: 'hub_to_hub',
          starting_hub_name: 'Central Station',
          destination_hub_name: 'Lindholmen',
          departure_time: '2023-05-15T08:30:00Z',
          available_seats: 3,
          price_per_seat: 25,
          driver_name: 'Jane Smith',
          status: 'scheduled',
          created_at: '2023-05-10T14:30:00Z',
        },
        {
          id: 2,
          ride_type: 'enterprise',
          starting_hub_name: 'Central Station',
          destination_hub_name: 'Volvo Headquarters',
          departure_time: '2023-05-15T17:30:00Z',
          available_seats: 5,
          price_per_seat: 30,
          driver_name: 'Michael Johnson',
          status: 'scheduled',
          created_at: '2023-05-11T09:15:00Z',
        },
        {
          id: 3,
          ride_type: 'hub_to_destination',
          starting_hub_name: 'Lindholmen',
          destination_hub_name: 'Landvetter Airport',
          departure_time: '2023-05-14T10:00:00Z',
          available_seats: 0,
          price_per_seat: 45,
          driver_name: 'Jane Smith',
          status: 'completed',
          created_at: '2023-05-09T11:20:00Z',
        },
      ];

      // Only use mock data if we received a 404 (endpoint not found)
      if (err.response && err.response.status === 404) {
        console.log('Using mock ride data since endpoint not found');
        setRides(mockRides);
      } else {
        // For other errors, set empty array to show 'No rides found' message
        setRides([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Rides Management</h2>
        <Button className="bg-brand-500 hover:bg-brand-600">Create New Ride</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  Loading rides...
                </TableCell>
              </TableRow>
            ) : rides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No rides found
                </TableCell>
              </TableRow>
            ) : (
              rides.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell>{ride.id}</TableCell>
                  <TableCell>
                    <span className="capitalize">
                      {ride.ride_type.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{ride.starting_hub_name}</div>
                    <div className="text-sm text-gray-500">→ {ride.destination_hub_name}</div>
                  </TableCell>
                  <TableCell>
                    {new Date(ride.departure_time).toLocaleString()}
                  </TableCell>
                  <TableCell>{ride.available_seats}</TableCell>
                  <TableCell>{ride.price_per_seat} kr</TableCell>
                  <TableCell>{ride.driver_name || 'Not assigned'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(
                        ride.status
                      )}`}
                    >
                      {ride.status.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500">
                        Cancel
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default RidesManagement;
