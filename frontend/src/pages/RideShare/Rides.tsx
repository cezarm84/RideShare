import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Search, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BasicSelect } from '@/components/ui/basic-select';
import { DatePickerWithPreview } from '@/components/ui/date-picker-with-preview';
import RideList, { Ride } from '@/components/RideSearch/RideList';
import PageMeta from '@/components/common/PageMeta';
import RideService from '@/services/ride.service';

const Rides = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all-rides');
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [startLocationFilter, setStartLocationFilter] = useState<string>('');
  const [destinationFilter, setDestinationFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [rideTypeFilter, setRideTypeFilter] = useState<string>('');
  const [minSeatsFilter, setMinSeatsFilter] = useState<number>(1);

  // Reference data
  const [referenceData, setReferenceData] = useState<any>({
    hubs: [],
    destinations: [],
    ride_types: []
  });

  // Fetch all rides and reference data on component mount
  useEffect(() => {
    console.log('Rides component mounted - fetching data');

    // First fetch reference data
    const fetchData = async () => {
      try {
        await fetchReferenceData();
        console.log('Reference data loaded, now fetching rides');

        // Then fetch rides
        await fetchAllRides();
      } catch (error) {
        console.error('Error in initial data loading:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch user rides when authenticated and on the my-rides tab
  useEffect(() => {
    if (activeTab === 'my-rides' && isAuthenticated) {
      console.log('My rides tab active and user authenticated - fetching my rides');
      fetchMyRides();
    }
  }, [isAuthenticated, activeTab]);

  // Fetch reference data for filters
  const fetchReferenceData = async () => {
    try {
      const data = await RideService.getRideReferenceData();
      setReferenceData(data);
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  const fetchAllRides = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching all rides from Rides component');
      console.log('Authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
      console.log('User:', user);

      const rides = await RideService.getAllRides();
      console.log(`Found ${rides.length} rides in the database`);
      console.log('Rides data:', rides);
      setAllRides(rides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError('Failed to load rides. Please try again.');
      setAllRides([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRides = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching my rides from Rides component');
      console.log('Authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
      console.log('User:', user);

      const rides = await RideService.getMyRides();
      console.log(`Found ${rides.length} user rides in the database`);
      console.log('My rides data:', rides);
      setMyRides(rides);
    } catch (error) {
      console.error('Error fetching user rides:', error);
      setError('Failed to load your rides. Please try again.');
      setMyRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRide = () => {
    navigate('/rides/create');
  };

  const handleBookRide = (rideId: string) => {
    console.log('Booking ride with ID:', rideId);
    navigate(`/bookings/create?rideId=${rideId}`);
  };

  const resetFilters = () => {
    setStartLocationFilter('');
    setDestinationFilter('');
    setDateFilter(undefined);
    setRideTypeFilter('');
    setMinSeatsFilter(1);
  };

  // Apply filters to rides
  const filteredRides = useMemo(() => {
    return allRides.filter(ride => {
      // Get the starting hub and destination hub names
      const startHubName = ride.startingHub?.name || ride.starting_hub?.name || '';
      const destHubName = ride.destinationHub?.name || ride.destination_hub?.name || ride.destination?.name || '';
      const startHubId = ride.startingHub?.id || ride.starting_hub?.id || ride.starting_hub_id || 0;
      const destHubId = ride.destinationHub?.id || ride.destination_hub?.id || ride.destination_hub_id || ride.destination_id || 0;
      const rideType = ride.rideType || ride.ride_type || '';
      const availableSeats = ride.availableSeats || ride.available_seats || 0;
      const departureTime = ride.departureTime || ride.departure_time || '';

      // Filter by starting location
      if (startLocationFilter && startLocationFilter !== startHubId.toString()) {
        return false;
      }

      // Filter by destination
      if (destinationFilter && destinationFilter !== destHubId.toString()) {
        return false;
      }

      // Filter by date
      if (dateFilter) {
        const rideDate = new Date(departureTime).toDateString();
        const filterDate = dateFilter.toDateString();
        if (rideDate !== filterDate) {
          return false;
        }
      }

      // Filter by ride type
      if (rideTypeFilter && rideTypeFilter !== rideType) {
        return false;
      }

      // Filter by minimum available seats
      if (minSeatsFilter > availableSeats) {
        return false;
      }

      return true;
    });
  }, [allRides, startLocationFilter, destinationFilter, dateFilter, rideTypeFilter, minSeatsFilter]);

  // Combine all locations for the filters
  const allLocations = useMemo(() => {
    return [
      ...(referenceData.hubs || []),
      ...(referenceData.destinations || [])
    ];
  }, [referenceData]);

  return (
    <div className="p-6">
      <PageMeta
        title="RideShare - Find and Book Rides"
        description="Search for available rides, book seats, or create your own ride."
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rides</h1>
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
          {isAuthenticated && (
            <TabsTrigger value="my-rides">My Rides</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all-rides">
          {/* Filter UI */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Available Rides</h2>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {showFilters && (
              <Card className="p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Starting Location Filter */}
                  <div>
                    <Label htmlFor="startLocationFilter" className="text-sm font-medium mb-1 block">
                      Starting Location
                    </Label>
                    <BasicSelect
                      id="startLocationFilter"
                      value={startLocationFilter}
                      onChange={setStartLocationFilter}
                      placeholder="Any location"
                      options={[
                        { value: "", label: "Any location" },
                        ...(referenceData.hubs || []).map((hub: any) => ({
                          value: hub.id.toString(),
                          label: hub.name
                        }))
                      ]}
                    />
                  </div>

                  {/* Destination Filter */}
                  <div>
                    <Label htmlFor="destinationFilter" className="text-sm font-medium mb-1 block">
                      Destination
                    </Label>
                    <BasicSelect
                      id="destinationFilter"
                      value={destinationFilter}
                      onChange={setDestinationFilter}
                      placeholder="Any destination"
                      options={[
                        { value: "", label: "Any destination" },
                        ...(allLocations || []).map((location: any) => ({
                          value: location.id.toString(),
                          label: location.name
                        }))
                      ]}
                    />
                  </div>

                  {/* Date Filter */}
                  <div>
                    <Label htmlFor="dateFilter" className="text-sm font-medium mb-1 block">
                      Date
                    </Label>
                    <DatePickerWithPreview
                      date={dateFilter}
                      setDate={setDateFilter}
                      label="Date"
                      placeholder="Any date"
                    />
                  </div>

                  {/* Ride Type Filter */}
                  <div>
                    <Label htmlFor="rideTypeFilter" className="text-sm font-medium mb-1 block">
                      Ride Type
                    </Label>
                    <BasicSelect
                      id="rideTypeFilter"
                      value={rideTypeFilter}
                      onChange={setRideTypeFilter}
                      placeholder="Any type"
                      options={[
                        { value: "", label: "Any type" },
                        { value: "hub_to_hub", label: "Hub to Hub" },
                        { value: "hub_to_destination", label: "Hub to Destination" },
                        { value: "free_ride", label: "Free Ride" },
                        { value: "enterprise", label: "Enterprise" }
                      ]}
                    />
                  </div>

                  {/* Min Seats Filter */}
                  <div>
                    <Label htmlFor="minSeatsFilter" className="text-sm font-medium mb-1 block">
                      Min. Available Seats
                    </Label>
                    <div className="relative">
                      <Input
                        id="minSeatsFilter"
                        type="number"
                        min="1"
                        max="50"
                        value={minSeatsFilter}
                        onChange={(e) => setMinSeatsFilter(parseInt(e.target.value) || 1)}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="mr-2"
                  >
                    Reset Filters
                  </Button>
                </div>
              </Card>
            )}

            {/* Results count */}
            <div className="text-sm text-gray-500 mb-2">
              Showing {filteredRides.length} {filteredRides.length === 1 ? 'ride' : 'rides'}
            </div>
          </div>

          <RideList
            rides={filteredRides}
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
