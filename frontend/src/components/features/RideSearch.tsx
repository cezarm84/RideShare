import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { MapPinIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import apiService from '@/services/api';
import { Ride } from '@/types/ride';
import RideMatchResults from './RideMatchResults';

interface Hub {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface Destination {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

const RideSearch: React.FC = () => {
  const [startingHubId, setStartingHubId] = useState<number | ''>('');
  const [destinationId, setDestinationId] = useState<number | ''>('');
  const [departureDate, setDepartureDate] = useState<Date>(new Date());
  const [departureTime, setDepartureTime] = useState<string>('08:00');
  const [timeFlexibility, setTimeFlexibility] = useState<number>(15);
  
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [matches, setMatches] = useState<Ride[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch hubs and destinations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hubsResponse, destinationsResponse] = await Promise.all([
          apiService.getHubs(),
          apiService.getDestinations()
        ]);
        
        setHubs(hubsResponse.data);
        setDestinations(destinationsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load hubs and destinations. Please try again later.');
      }
    };

    fetchData();
  }, []);

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startingHubId) {
      setError('Please select a starting hub');
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      
      // Combine date and time
      const [hours, minutes] = departureTime.split(':');
      const departureDateTime = new Date(departureDate);
      departureDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const response = await apiService.findMatchingRides({
        starting_hub_id: Number(startingHubId),
        destination_id: destinationId ? Number(destinationId) : undefined,
        departure_time: departureDateTime.toISOString(),
        time_flexibility: timeFlexibility,
        max_results: 10
      });
      
      setMatches(response.data);
      setSearchPerformed(true);
    } catch (err) {
      console.error('Error searching for rides:', err);
      setError('Failed to search for rides. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle booking a ride
  const handleBookRide = (rideId: number) => {
    // In a real app, this would navigate to a booking page or open a modal
    alert(`Booking ride ${rideId}. This would open the booking flow in a real app.`);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Find a Ride</CardTitle>
          <CardDescription>
            Search for rides that match your travel needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="starting-hub" className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Hub
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="starting-hub"
                    value={startingHubId}
                    onChange={(e) => setStartingHubId(e.target.value ? Number(e.target.value) : '')}
                    className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Select starting hub"
                  >
                    <option value="">Select a starting hub</option>
                    {hubs.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                  Destination (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="destination"
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value ? Number(e.target.value) : '')}
                    className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Select destination"
                  >
                    <option value="">Any destination</option>
                    {destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <DatePicker
                    id="departure-date"
                    selected={departureDate}
                    onChange={(date: Date) => setDepartureDate(date)}
                    minDate={new Date()}
                    className="pl-10 block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    aria-label="Select departure date"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="departure-time" className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Time
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ClockIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="departure-time"
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="pl-10"
                    aria-label="Select departure time"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="time-flexibility" className="block text-sm font-medium text-gray-700 mb-1">
                  Time Flexibility (minutes)
                </label>
                <Input
                  id="time-flexibility"
                  type="number"
                  min={5}
                  max={60}
                  step={5}
                  value={timeFlexibility}
                  onChange={(e) => setTimeFlexibility(parseInt(e.target.value))}
                  aria-label="Set time flexibility in minutes"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSearching}
                className="relative"
                aria-label="Search for rides"
              >
                {isSearching ? (
                  <>
                    <span className="opacity-0">Search</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {searchPerformed && (
        <RideMatchResults 
          matches={matches} 
          isLoading={isSearching} 
          onBookRide={handleBookRide} 
        />
      )}
    </div>
  );
};

export default RideSearch;
