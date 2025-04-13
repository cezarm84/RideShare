import React, { useState } from 'react';
import DesktopRidePlanner from './DesktopRidePlanner';
import MobileRidePlanner from './MobileRidePlanner';
import RandomTripInfo from './RandomTripInfo';

export type RideOption = {
  id: string;
  driver: {
    name: string;
    rating: number;
    image: string;
  };
  vehicle: {
    type: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  route: {
    startLocation: string;
    destination: string;
    startCoordinates: [number, number];
    endCoordinates: [number, number];
    distance: string;
    duration: string;
  };
  departureTime: string;
  arrivalTime: string;
  price: number;
  availableSeats: number;
  rideType: 'hub_to_destination' | 'enterprise' | 'custom';
};

const RidePlanner: React.FC = () => {
  const [startLocation, setStartLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  // Time is now handled by the backend
  const [rideType, setRideType] = useState<'hub_to_destination' | 'enterprise' | 'custom'>('hub_to_destination');
  const [isLoading, setIsLoading] = useState(false);
  const [availableRides, setAvailableRides] = useState<RideOption[]>([]);
  const [showRandomTrip, setShowRandomTrip] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string>('');

  // Mock data for demonstration
  const mockRides: RideOption[] = [
    {
      id: '1',
      driver: {
        name: 'John Smith',
        rating: 4.8,
        image: '/images/avatars/avatar-1.png',
      },
      vehicle: {
        type: 'Sedan',
        model: 'Tesla Model 3',
        color: 'White',
        licensePlate: 'ABC123',
      },
      route: {
        startLocation: 'Central Hub',
        destination: 'Volvo Headquarters',
        startCoordinates: [57.7089, 11.9746],
        endCoordinates: [57.7189, 11.9946],
        distance: '8.5 km',
        duration: '15 min',
      },
      departureTime: '08:00',
      arrivalTime: '08:15',
      price: 85,
      availableSeats: 3,
      rideType: 'hub_to_destination',
    },
    {
      id: '2',
      driver: {
        name: 'Emma Johnson',
        rating: 4.9,
        image: '/images/avatars/avatar-2.png',
      },
      vehicle: {
        type: 'SUV',
        model: 'Volvo XC60',
        color: 'Black',
        licensePlate: 'XYZ789',
      },
      route: {
        startLocation: 'North Hub',
        destination: 'Volvo Headquarters',
        startCoordinates: [57.7289, 11.9546],
        endCoordinates: [57.7189, 11.9946],
        distance: '6.2 km',
        duration: '12 min',
      },
      departureTime: '08:15',
      arrivalTime: '08:27',
      price: 75,
      availableSeats: 4,
      rideType: 'hub_to_destination',
    },
    {
      id: '3',
      driver: {
        name: 'Michael Brown',
        rating: 4.7,
        image: '/images/avatars/avatar-3.png',
      },
      vehicle: {
        type: 'Minivan',
        model: 'Volvo V90',
        color: 'Silver',
        licensePlate: 'DEF456',
      },
      route: {
        startLocation: 'East Hub',
        destination: 'Volvo Headquarters',
        startCoordinates: [57.7189, 12.0046],
        endCoordinates: [57.7189, 11.9946],
        distance: '7.8 km',
        duration: '18 min',
      },
      departureTime: '08:30',
      arrivalTime: '08:48',
      price: 90,
      availableSeats: 6,
      rideType: 'hub_to_destination',
    },
  ];

  const handleSearch = () => {
    if (!startLocation || !destination) {
      // Show error toast
      return;
    }

    setIsLoading(true);
    setShowRandomTrip(false);

    // Simulate API call
    setTimeout(() => {
      // Randomly decide whether to show rides or a random trip
      const showRides = Math.random() > 0.5;

      if (showRides) {
        // Show actual rides from the mock database
        setAvailableRides(mockRides);
        setSelectedRideId(mockRides[0].id);
      } else {
        // Show a random selection of rides from the mock database
        // In a real implementation, this would be a different set of rides from the database
        // that match the general criteria but might have different times or slight route variations
        setAvailableRides([]);
        setShowRandomTrip(true);
      }

      setIsLoading(false);
    }, 1500);
  };

  const handleBookRide = (rideId: string) => {
    // Implement booking logic
    console.log(`Booking ride ${rideId}`);
    // Show success toast
    // Redirect to booking confirmation page
  };

  return (
    <div className="h-full">
      {/* Desktop view */}
      <div className="hidden md:block h-full">
        <DesktopRidePlanner
          startLocation={startLocation}
          destination={destination}
          date={date}
          rideType={rideType}
          isLoading={isLoading}
          availableRides={availableRides}
          selectedRideId={selectedRideId}
          showRandomTrip={showRandomTrip}
          onStartLocationChange={setStartLocation}
          onDestinationChange={setDestination}
          onDateChange={setDate}
          onRideTypeChange={setRideType}
          onSearch={handleSearch}
          onSelectRide={setSelectedRideId}
          onBookRide={handleBookRide}
        />
      </div>

      {/* Mobile view */}
      <div className="md:hidden h-full">
        <MobileRidePlanner
          startLocation={startLocation}
          destination={destination}
          date={date}
          rideType={rideType}
          isLoading={isLoading}
          availableRides={availableRides}
          selectedRideId={selectedRideId}
          showRandomTrip={showRandomTrip}
          onStartLocationChange={setStartLocation}
          onDestinationChange={setDestination}
          onDateChange={setDate}
          onRideTypeChange={setRideType}
          onSearch={handleSearch}
          onSelectRide={setSelectedRideId}
          onBookRide={handleBookRide}
        />
      </div>
    </div>
  );
};

export default RidePlanner;
