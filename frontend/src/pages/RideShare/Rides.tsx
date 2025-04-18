import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import RideSearchForm from '@/components/RideSearch/RideSearchForm';
import RideList, { Ride } from '@/components/RideSearch/RideList';
import PageMeta from '@/components/common/PageMeta';
import RideService from '@/services/ride.service';

interface SearchFormValues {
  startLocation: string;
  destination: string;
  date: string;
  rideType: 'hub_to_hub' | 'hub_to_destination' | 'enterprise';
  passengers: number;
}

const Rides = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all-rides');
  const [searchResults, setSearchResults] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // When the component mounts or the tab changes, load the appropriate data
    if (activeTab === 'all-rides') {
      console.log('Loading all rides...');
      fetchAllRides();
    } else if (activeTab === 'my-rides' && isAuthenticated) {
      console.log('Loading user rides...');
      fetchMyRides();
    } else if (activeTab === 'search') {
      // If we're on the search tab and no search has been performed yet,
      // load some default results
      if (!searchPerformed) {
        console.log('On search tab, loading default search results');
        // Use the same results as all rides for now
        fetchAllRides();
      }
    }
  }, [isAuthenticated, activeTab]);

  const fetchAllRides = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch rides from the API using RideService
      const rides = await RideService.getAllRides();
      console.log(`Found ${rides.length} rides in the database`);
      setSearchResults(rides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError('Failed to load rides. Please try again.');
      // Don't use mock data anymore - show the error instead
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRides = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch user's rides from the API using RideService
      const rides = await RideService.getMyRides();
      console.log(`Found ${rides.length} user rides in the database`);
      setMyRides(rides);
    } catch (error) {
      console.error('Error fetching user rides:', error);
      setError('Failed to load your rides. Please try again.');
      setMyRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (values: SearchFormValues) => {
    console.log('Search form submitted with values:', values);
    setLoading(true);
    setSearchPerformed(true);
    setError(null);

    try {
      // Prepare filters for the RideService
      const filters = {
        start_hub_id: values.startLocation ? parseInt(values.startLocation) : undefined,
        destination_hub_id: values.destination ? parseInt(values.destination) : undefined,
        ride_type: values.rideType,
        departure_date: values.date,
        min_available_seats: values.passengers
      };

      console.log('Searching rides with filters:', filters);

      // Use RideService to search for rides
      const rides = await RideService.getAllRides(filters);
      console.log(`Found ${rides.length} rides matching search criteria`);

      setSearchResults(rides);
    } catch (error) {
      console.error('Error searching rides:', error);
      setError('Failed to search for rides. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRide = () => {
    navigate('/rides/create');
  };

  const handleBookRide = (rideId: string) => {
    navigate(`/bookings/create?rideId=${rideId}`);
  };



  return (
    <div className="p-6">
      <PageMeta
        title="RideShare - Find and Book Rides"
        description="Search for available rides, book seats, or create your own ride."
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rides</h1>
        {/* Only show Create Ride button for admin users */}
        {user && (user.is_admin || user.is_superadmin) && (
          <Button onClick={handleCreateRide} className="bg-brand-500 hover:bg-brand-600">
            Create New Ride
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs
        defaultValue="all-rides"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="all-rides">All Rides</TabsTrigger>
          <TabsTrigger value="search">Search Rides</TabsTrigger>
          {isAuthenticated && (
            <TabsTrigger value="my-rides">My Rides</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <RideSearchForm onSearch={handleSearch} />

          <RideList
            rides={searchResults}
            loading={loading}
            onBookRide={handleBookRide}
          />
        </TabsContent>

        <TabsContent value="all-rides">
          <RideList
            rides={searchResults}
            loading={loading}
            onBookRide={handleBookRide}
          />
        </TabsContent>

        {isAuthenticated && (
          <TabsContent value="my-rides">
            <RideList
              rides={myRides}
              loading={loading}
              onBookRide={handleBookRide}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Rides;
