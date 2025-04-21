import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BasicSelect } from '@/components/ui/basic-select';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { DatePickerWithPreview } from '@/components/ui/date-picker-with-preview';
import { TimePickerWithPreview } from '@/components/ui/time-picker-with-preview';
import RideService from '@/services/ride.service';
import VehicleTypeService from '@/services/vehicleType.service';

// Define the form schema with Zod
const createRideSchema = z.object({
  rideType: z.enum(['hub_to_hub', 'hub_to_destination', 'free_ride', 'enterprise']),
  startingHubId: z.string().min(1, 'Starting hub is required'),
  destinationHubId: z.string().min(1, 'Destination hub is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  departureTime: z.string().min(1, 'Departure time is required'),
  availableSeats: z.string().transform((val) => parseInt(val, 10)).refine((val) => val >= 1 && val <= 50, {
    message: 'Available seats must be between 1 and 50',
  }),
  pricePerSeat: z.string().transform((val) => parseFloat(val)).refine((val) => val >= 0, {
    message: 'Price must be a positive number',
  }),
  vehicleTypeId: z.string().min(1, 'Vehicle type is required'),
  enterpriseId: z.string().optional(),
  notes: z.string().optional(),
});

type CreateRideFormValues = z.infer<typeof createRideSchema>;

interface Hub {
  id: number;
  name: string;
  address: string;
}

interface Location extends Hub {
  uniqueId: string;
  originalId: number;
  type: 'hub' | 'destination';
}

interface VehicleType {
  id: number;
  name: string;
  capacity: number;
  uniqueId?: string;
}

interface Enterprise {
  id: number;
  name: string;
  uniqueId?: string;
}

const CreateRide = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [destinations, setDestinations] = useState<Hub[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin', { state: { from: '/rides/create' } });
    }
  }, [isAuthenticated, navigate]);

  // Fetch reference data when component mounts
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true);
        // Fetch reference data from the API (will use mock data as fallback)
        const data = await RideService.getRideReferenceData();
        console.log('Reference data:', data);

        // Update state with fetched data
        if (data.hubs) setHubs(data.hubs);
        if (data.destinations) setDestinations(data.destinations);
        if (data.vehicle_types) {
          const vehicleTypesWithIds = data.vehicle_types.map((type, index) => ({
            ...type,
            uniqueId: `vehicle_${type.id}_${index}`  // Add index to ensure uniqueness
          }));
          setVehicleTypes(vehicleTypesWithIds);
        }
        if (data.enterprises) {
          const enterprisesWithIds = data.enterprises.map((enterprise, index) => ({
            ...enterprise,
            uniqueId: `enterprise_${enterprise.id}_${index}`  // Add index to ensure uniqueness
          }));
          setEnterprises(enterprisesWithIds);
        }

        // Create a combined array of all locations (hubs + destinations) with unique keys
        // Use a prefix in the uniqueId to ensure uniqueness even if hub and destination IDs overlap
        console.log('Processing hubs and destinations for allLocations');
        const hubsWithPrefix = (data.hubs || []).map((hub, index) => {
          console.log(`Processing hub ${index}:`, hub);
          return {
            ...hub,
            uniqueId: `hub_${hub.id}_${index}`,  // Add index to ensure uniqueness
            originalId: hub.id,
            type: 'hub'
          };
        });

        const destinationsWithPrefix = (data.destinations || []).map((dest, index) => {
          console.log(`Processing destination ${index}:`, dest);

          // Add default coordinates if not present
          const enhancedDest = {
            ...dest,
            uniqueId: `dest_${dest.id}_${index}`,  // Add index to ensure uniqueness
            originalId: dest.id,
            type: 'destination'
          };

          // Add default coordinates if not present
          if (!enhancedDest.latitude || !enhancedDest.longitude) {
            console.log(`Adding default coordinates for destination ${dest.name}`);

            // Default coordinates based on destination name
            const defaultCoordinates = {
              'Volvo Cars Torslanda': { latitude: 57.720890, longitude: 12.025600 },
              'Volvo Group Lundby': { latitude: 57.715130, longitude: 11.935290 },
              'AstraZeneca Mölndal': { latitude: 57.660800, longitude: 12.011580 },
              'Ericsson Lindholmen': { latitude: 57.706130, longitude: 11.938290 },
              'SKF Gamlestaden': { latitude: 57.728870, longitude: 12.014560 },
              'Landvetter Airport': { latitude: 57.668799, longitude: 12.292314 }
            };

            // Use specific coordinates if available, otherwise use Gothenburg central
            if (defaultCoordinates[dest.name]) {
              enhancedDest.latitude = defaultCoordinates[dest.name].latitude;
              enhancedDest.longitude = defaultCoordinates[dest.name].longitude;
            } else {
              enhancedDest.latitude = 57.708870; // Gothenburg central
              enhancedDest.longitude = 11.974560;
            }
          }

          return enhancedDest;
        });

        const allLocations = [
          ...hubsWithPrefix,
          ...destinationsWithPrefix
        ];
        console.log('Final allLocations:', allLocations);
        setAllLocations(allLocations);

        setError(null);
      } catch (err) {
        console.error('Error fetching reference data:', err);
        setError('Failed to load reference data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReferenceData();
  }, []);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<CreateRideFormValues>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      rideType: 'hub_to_hub',
      startingHubId: '',
      destinationHubId: '',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '08:00',
      availableSeats: '4',
      pricePerSeat: '25',
      vehicleTypeId: '1',
      notes: '',
    },
  });

  // Set default values once data is loaded
  useEffect(() => {
    if (allLocations.length > 0 && vehicleTypes.length > 0) {
      console.log('Setting default form values with loaded data');

      // Set default starting hub if available
      if (allLocations.length > 0) {
        const firstHub = allLocations.find(loc => loc.type === 'hub');
        if (firstHub) {
          console.log('Setting default starting hub:', `${firstHub.type}_${firstHub.originalId}`);
          setValue('startingHubId', `${firstHub.type}_${firstHub.originalId}`);
        }
      }

      // Set default destination hub if available
      if (allLocations.length > 1) {
        const secondHub = allLocations.filter(loc => loc.type === 'hub')[1];
        if (secondHub) {
          console.log('Setting default destination hub:', `${secondHub.type}_${secondHub.originalId}`);
          setValue('destinationHubId', `${secondHub.type}_${secondHub.originalId}`);
        }
      }

      // Set default vehicle type if available
      if (vehicleTypes.length > 0) {
        console.log('Setting default vehicle type:', vehicleTypes[0].id.toString());
        setValue('vehicleTypeId', vehicleTypes[0].id.toString());
      }
    }
  }, [allLocations, vehicleTypes, setValue]);

  const rideType = watch('rideType');

  const handleFormSubmit = async (data: CreateRideFormValues) => {
    console.log('Form submitted with data:', data);
    setLoading(true);
    setError(null);

    try {
      // Combine date and time
      const departureDateTime = new Date(`${data.departureDate}T${data.departureTime}`);
      console.log('Departure date time:', departureDateTime);

      // Parse the hub IDs from the format "type_id"
      const startingHubParts = data.startingHubId.split('_');
      const destinationHubParts = data.destinationHubId.split('_');

      const startingHubType = startingHubParts[0];
      const startingHubId = parseInt(startingHubParts[1]);

      const destinationHubType = destinationHubParts[0];
      const destinationHubId = parseInt(destinationHubParts[1]);

      console.log('Parsed starting hub:', { type: startingHubType, id: startingHubId });
      console.log('Parsed destination hub:', { type: destinationHubType, id: destinationHubId });

      // Prepare the payload
      const payload = {
        ride_type: data.rideType,
        starting_hub_id: startingHubId,
        destination_hub_id: destinationHubId,
        departure_time: departureDateTime.toISOString(),
        available_seats: parseInt(data.availableSeats),
        price_per_seat: parseFloat(data.pricePerSeat),
        vehicle_type_id: parseInt(data.vehicleTypeId),
        notes: data.notes || '',
        status: 'scheduled',
        recurrence_pattern: 'one_time'
      };

      console.log('Initial payload:', payload);

      // Add additional fields required by the backend
      if (data.rideType === 'hub_to_destination' || data.rideType === 'free_ride') {
        // For hub_to_destination, we need to set destination_hub_id to null
        // and provide a destination object
        payload.destination_hub_id = null;

        console.log('Looking for destination location with ID:', destinationHubId);
        console.log('Available locations:', allLocations);

        // Get the destination location from allLocations
        const destinationLocation = allLocations.find(
          location => location.type === destinationHubType && location.originalId === destinationHubId
        );

        console.log('Found destination location:', destinationLocation);

        // Log all properties of the destination location
        if (destinationLocation) {
          console.log('Destination location properties:', Object.keys(destinationLocation));
          console.log('Destination location latitude:', destinationLocation.latitude);
          console.log('Destination location longitude:', destinationLocation.longitude);
          console.log('Destination location address:', destinationLocation.address);
        }

        if (destinationLocation) {
          // Extract city from address if available
          let city = 'Gothenburg'; // Default city
          if (destinationLocation.address && destinationLocation.address.includes(',')) {
            const addressParts = destinationLocation.address.split(',');
            if (addressParts.length >= 2) {
              // Try to extract city from address (usually after the first comma)
              const cityWithPostalCode = addressParts[1].trim();
              // Extract just the city name if it includes a postal code
              if (cityWithPostalCode.includes(' ')) {
                const cityParts = cityWithPostalCode.split(' ');
                // Assume the last part is the city name
                city = cityParts[cityParts.length - 1].trim();
              } else {
                city = cityWithPostalCode;
              }
            }
          }

          // Use coordinates if available, otherwise use default Gothenburg coordinates
          const latitude = destinationLocation.latitude || 57.708870;
          const longitude = destinationLocation.longitude || 11.974560;

          payload.destination = {
            name: destinationLocation.name,
            address: destinationLocation.address || '',
            city: city,
            latitude: latitude,
            longitude: longitude
          };

          console.log('Added destination to payload:', payload.destination);
        } else {
          console.warn('Could not find destination location with ID:', data.destinationHubId);
        }
      }

      // Add enterprise_id if it's an enterprise ride
      if (data.rideType === 'enterprise' && data.enterpriseId) {
        console.log('Adding enterprise ID to payload:', data.enterpriseId);
        Object.assign(payload, { enterprise_id: parseInt(data.enterpriseId) });
      } else if (data.rideType === 'enterprise') {
        console.warn('Enterprise ride type selected but no enterprise ID provided');
      }

      console.log('Creating ride with payload:', payload);

      // Call the API to create the ride
      try {
        const response = await RideService.createRide(payload);
        console.log('Ride created successfully:', response);

        // Navigate to the rides page
        navigate('/rides');
      } catch (apiError) {
        console.error('API error creating ride:', apiError);
        throw apiError; // Re-throw to be caught by the outer catch block
      }
    } catch (error) {
      console.error('Error creating ride:', error);

      // Display a more user-friendly error message
      if (error instanceof Error) {
        // Check if it's a validation error
        if (error.message.startsWith('Validation error:')) {
          setError(error.message);
        } else {
          setError(`Failed to create ride: ${error.message}`);
        }
      } else {
        setError('Failed to create ride. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <PageMeta
        title="RideShare - Create a New Ride"
        description="Create a new ride and share your journey with others."
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create a New Ride</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/rides')}
        >
          Cancel
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rideType">Ride Type</Label>
            <Controller
              name="rideType"
              control={control}
              render={({ field }) => (
                <BasicSelect
                  id="rideType"
                  options={[
                    { value: 'hub_to_hub', label: 'Hub to Hub' },
                    { value: 'hub_to_destination', label: 'Hub to Destination' },
                    { value: 'free_ride', label: 'Free Ride' },
                    { value: 'enterprise', label: 'Enterprise' }
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select ride type"
                />
              )}
            />
            {errors.rideType && (
              <p className="text-sm text-red-500">{errors.rideType.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startingHubId">Starting Hub</Label>
              <Controller
                name="startingHubId"
                control={control}
                render={({ field }) => (
                  <BasicSelect
                    id="startingHubId"
                    options={allLocations.map(location => ({
                      value: `${location.type}_${location.originalId}`,
                      label: `${location.name} ${location.type === 'destination' ? '(Destination)' : ''}`
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select starting hub"
                  />
                )}
              />
              {errors.startingHubId && (
                <p className="text-sm text-red-500">{errors.startingHubId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinationHubId">Destination Hub</Label>
              <Controller
                name="destinationHubId"
                control={control}
                render={({ field }) => (
                  <BasicSelect
                    id="destinationHubId"
                    options={allLocations.map(location => ({
                      value: `${location.type}_${location.originalId}`,
                      label: `${location.name} ${location.type === 'destination' ? '(Destination)' : ''}`
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select destination hub"
                  />
                )}
              />
              {errors.destinationHubId && (
                <p className="text-sm text-red-500">{errors.destinationHubId.message}</p>
              )}
            </div>
          </div>

          {rideType === 'enterprise' && (
            <div className="space-y-2">
              <Label htmlFor="enterpriseId">Enterprise</Label>
              <Controller
                name="enterpriseId"
                control={control}
                render={({ field }) => (
                  <BasicSelect
                    id="enterpriseId"
                    options={enterprises.map(enterprise => ({
                      value: enterprise.id.toString(),
                      label: enterprise.name
                    }))}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Select enterprise"
                  />
                )}
              />
              {errors.enterpriseId && (
                <p className="text-sm text-red-500">{errors.enterpriseId.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Controller
                name="departureDate"
                control={control}
                render={({ field }) => {
                  // Convert string date to Date object for the DatePickerWithPreview
                  const dateValue = field.value ? new Date(field.value) : undefined;

                  return (
                    <DatePickerWithPreview
                      date={dateValue}
                      setDate={(date) => {
                        if (date) {
                          // Format date as YYYY-MM-DD without timezone issues
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          field.onChange(dateStr);
                        }
                      }}
                      label="Departure Date"
                      placeholder="Select departure date"
                    />
                  );
                }}
              />
              {errors.departureDate && (
                <p className="text-sm text-red-500">{errors.departureDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Controller
                name="departureTime"
                control={control}
                render={({ field }) => (
                  <TimePickerWithPreview
                    time={field.value || ''}
                    setTime={(timeStr) => {
                      field.onChange(timeStr);
                    }}
                    label="Departure Time"
                    placeholder="Select departure time"
                  />
                )}
              />
              {errors.departureTime && (
                <p className="text-sm text-red-500">{errors.departureTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vehicleTypeId">Vehicle Type</Label>
              <Controller
                name="vehicleTypeId"
                control={control}
                render={({ field }) => (
                  <BasicSelect
                    id="vehicleTypeId"
                    options={vehicleTypes.map(type => ({
                      value: type.id.toString(),
                      label: `${type.name} (Capacity: ${type.capacity})`
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select vehicle type"
                  />
                )}
              />
              {errors.vehicleTypeId && (
                <p className="text-sm text-red-500">{errors.vehicleTypeId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="availableSeats">Available Seats</Label>
              <Input
                id="availableSeats"
                type="number"
                min="1"
                max="50"
                {...register('availableSeats')}
              />
              {errors.availableSeats && (
                <p className="text-sm text-red-500">{errors.availableSeats.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerSeat">Price Per Seat (kr)</Label>
              <div className="relative">
                <Input
                  id="pricePerSeat"
                  type="number"
                  min="0"
                  step="1"
                  className="pl-10"
                  {...register('pricePerSeat')}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                  kr
                </div>
              </div>
              {errors.pricePerSeat && (
                <p className="text-sm text-red-500">{errors.pricePerSeat.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional information about the ride"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/rides')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mr-2">Creating...</span>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                </>
              ) : (
                'Create Ride'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateRide;
