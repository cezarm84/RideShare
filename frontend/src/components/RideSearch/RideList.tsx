import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import RideDetailsMap from '@/components/Map/RideDetailsMap';

export interface Ride {
  id: string | number;
  // Support both camelCase and snake_case property names
  rideType?: 'hub_to_hub' | 'hub_to_destination' | 'enterprise';
  ride_type?: string;
  startingHub?: {
    id: number;
    name: string;
    address: string;
  };
  starting_hub?: {
    id: number;
    name: string;
    address: string;
  };
  starting_hub_id?: number;
  destinationHub?: {
    id: number;
    name: string;
    address: string;
  };
  destination_hub?: {
    id: number;
    name: string;
    address: string;
  };
  destination_hub_id?: number;
  destination?: {
    id: number;
    name: string;
    address: string;
  };
  destination_id?: number;
  departureTime?: string;
  departure_time?: string;
  availableSeats?: number;
  available_seats?: number;
  pricePerSeat?: number;
  price_per_seat?: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  driver?: {
    id: string;
    name: string;
    rating: number;
  };
  vehicleType?: {
    id: number;
    name: string;
    capacity: number;
  };
  vehicle_type?: {
    id: number;
    name: string;
    capacity: number;
  };
  vehicle_type_id?: number;
  enterprise?: {
    id: number;
    name: string;
  };
  enterprise_id?: number;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
}

interface RideListProps {
  rides: Ride[];
  loading: boolean;
  onBookRide: (rideId: string) => void;
  isAdminView?: boolean;
  onEditRide?: (rideId: string) => void;
  onDeleteRide?: (rideId: string) => void;
}

const RideList = ({ rides, loading, onBookRide, isAdminView = false, onEditRide, onDeleteRide }: RideListProps) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);

  // Debug the rides data
  useEffect(() => {
    console.log('RideList received rides:', rides);
    if (rides.length > 0) {
      console.log('First ride example:', rides[0]);

      // Check if the rides have the expected structure
      const firstRide = rides[0];
      if (!firstRide.startingHub && !firstRide.starting_hub) {
        console.warn('Ride is missing starting hub information');
      }
      if (!firstRide.destinationHub && !firstRide.destination_hub) {
        console.warn('Ride is missing destination hub information');
      }

      // Log the structure of the first ride
      console.log('Ride structure:', Object.keys(firstRide));
    }
  }, [rides]);

  const handleBookRide = (rideId: string | number) => {
    // Let the ProtectedRoute component handle authentication
    onBookRide(rideId.toString());
  };

  const toggleExpandRide = (rideId: string | number) => {
    const rideIdStr = rideId.toString();
    setExpandedRideId(expandedRideId === rideIdStr ? null : rideIdStr);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-xl font-semibold mb-2">No rides found</h3>
        <p className="text-gray-600 mb-4">
          Try adjusting your search criteria or check back later for more options.
        </p>
        {isAdminView && (
          <div className="flex justify-center">
            <Button
              onClick={() => navigate('/rides/create')}
              className="bg-brand-500 hover:bg-brand-600"
            >
              Create a Ride
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Available Rides</h2>
      {rides.map((ride) => (
        <Card
          key={ride.id}
          className="p-6 hover:shadow-md transition-shadow"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <div className="flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center mb-2">
                    <Badge
                      className={
                        (ride.rideType || ride.ride_type) === 'hub_to_hub' ? 'bg-blue-100 text-blue-800' :
                        (ride.rideType || ride.ride_type) === 'hub_to_destination' ? 'bg-purple-100 text-purple-800' :
                        (ride.rideType || ride.ride_type) === 'free_ride' ? 'bg-amber-100 text-amber-800' :
                        'bg-green-100 text-green-800'
                      }
                    >
                      {((ride.rideType || ride.ride_type || 'unknown')).replace(/_/g, ' ')}
                    </Badge>
                    <Badge
                      className={`ml-2 ${
                        ride.status === 'active' ? 'bg-green-100 text-green-800' :
                        ride.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        ride.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {ride.status}
                    </Badge>
                    {ride.enterprise && (
                      <Badge className="ml-2 bg-indigo-100 text-indigo-800">
                        {ride.enterprise.name}
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold">
                    {(ride.startingHub?.name ||
                      ride.starting_hub?.name ||
                      (ride.starting_hub_id ? `Hub ID: ${ride.starting_hub_id}` : '') ||
                      'Unknown')}
                    →
                    {(ride.destinationHub?.name ||
                      ride.destination_hub?.name ||
                      ride.destination?.name ||
                      (ride.destination_hub_id ? `Hub ID: ${ride.destination_hub_id}` : '') ||
                      (ride.destination_id ? `Destination ID: ${ride.destination_id}` : '') ||
                      'Unknown')}
                  </h3>

                  <p className="text-gray-600 mt-1">
                    <span className="font-medium">Departure:</span> {new Date(ride.departureTime || ride.departure_time || '').toLocaleString()}
                  </p>

                  {ride.driver && (
                    <p className="text-gray-600">
                      <span className="font-medium">Driver:</span> {ride.driver.name} ({ride.driver.rating}★)
                    </p>
                  )}

                  <p className="text-gray-600">
                    <span className="font-medium">Vehicle:</span> {(ride.vehicleType?.name || ride.vehicle_type?.name || 'Unknown')}
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the card click event from firing
                      toggleExpandRide(ride.id);
                    }}
                    data-ride-id={ride.id}
                    className="text-brand-500 hover:text-brand-600 text-sm mt-2 flex items-center"
                  >
                    {expandedRideId === ride.id.toString() ? 'Show less' : 'Show more'}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 ml-1 transition-transform ${expandedRideId === ride.id.toString() ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedRideId === ride.id.toString() && (
                    <div className="mt-4 space-y-2 text-sm text-gray-600 border-t pt-4">
                      <p><span className="font-medium">Starting Address:</span> {ride.startingHub?.address || ride.starting_hub?.address || 'Unknown'}</p>
                      <p><span className="font-medium">Destination Address:</span> {ride.destinationHub?.address || ride.destination_hub?.address || ride.destination?.address || 'Unknown'}</p>
                      <p><span className="font-medium">Vehicle Capacity:</span> {ride.vehicleType?.capacity || ride.vehicle_type?.capacity || 'Unknown'} passengers</p>
                      <p><span className="font-medium">Available Seats:</span> {ride.availableSeats || ride.available_seats || 'Unknown'}</p>
                      <p><span className="font-medium">Price per Seat:</span> {ride.pricePerSeat || ride.price_per_seat || 'Unknown'} SEK</p>
                      <p><span className="font-medium">Ride ID:</span> {ride.id}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="md:col-span-1 h-full">
              {/* Always render the map component */}
              <RideDetailsMap selectedRide={ride} />
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            {isAdminView ? (
              <>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRide && onEditRide(ride.id.toString());
                  }}
                  data-ride-id={ride.id}
                  className="bg-blue-500 hover:bg-blue-600 w-full md:w-auto"
                >
                  Edit
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRide && onDeleteRide(ride.id.toString());
                  }}
                  data-ride-id={ride.id}
                  className="bg-red-500 hover:bg-red-600 w-full md:w-auto"
                >
                  Delete
                </Button>
              </>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the card click event from firing
                  handleBookRide(ride.id);
                }}
                data-ride-id={ride.id}
                className="bg-brand-500 hover:bg-brand-600 w-full md:w-auto"
                disabled={(ride.availableSeats || ride.available_seats || 0) < 1 || (ride.status !== 'active' && ride.status !== 'scheduled')}
              >
                {(ride.availableSeats || ride.available_seats || 0) < 1 ? 'Fully Booked' : 'Book Now'}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RideList;
