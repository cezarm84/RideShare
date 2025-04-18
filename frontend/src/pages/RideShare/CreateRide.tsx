import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  rideType: z.enum(['hub_to_hub', 'hub_to_destination', 'enterprise']),
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [destinations, setDestinations] = useState<Hub[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);

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
          const vehicleTypesWithIds = data.vehicle_types.map(type => ({
            ...type,
            uniqueId: `vehicle_${type.id}`
          }));
          setVehicleTypes(vehicleTypesWithIds);
        }
        if (data.enterprises) {
          const enterprisesWithIds = data.enterprises.map(enterprise => ({
            ...enterprise,
            uniqueId: `enterprise_${enterprise.id}`
          }));
          setEnterprises(enterprisesWithIds);
        }

        // Create a combined array of all locations (hubs + destinations) with unique keys
        const hubsWithPrefix = (data.hubs || []).map(hub => ({
          ...hub,
          uniqueId: `hub_${hub.id}`,
          originalId: hub.id,
          type: 'hub'
        }));

        const destinationsWithPrefix = (data.destinations || []).map(dest => ({
          ...dest,
          uniqueId: `dest_${dest.id}`,
          originalId: dest.id,
          type: 'destination'
        }));

        const allLocations = [
          ...hubsWithPrefix,
          ...destinationsWithPrefix
        ];
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

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CreateRideFormValues>({
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

  const rideType = watch('rideType');

  const handleFormSubmit = async (data: CreateRideFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // Combine date and time
      const departureDateTime = new Date(`${data.departureDate}T${data.departureTime}`);

      // Prepare the payload
      const payload = {
        ride_type: data.rideType,
        starting_hub_id: parseInt(data.startingHubId),
        destination_hub_id: parseInt(data.destinationHubId),
        departure_time: departureDateTime.toISOString(),
        available_seats: parseInt(data.availableSeats),
        price_per_seat: parseFloat(data.pricePerSeat),
        vehicle_type_id: parseInt(data.vehicleTypeId),
        notes: data.notes || '',
        status: 'scheduled',
        recurrence_pattern: 'one_time'
      };

      // Add enterprise_id if it's an enterprise ride
      if (data.rideType === 'enterprise' && data.enterpriseId) {
        Object.assign(payload, { enterprise_id: parseInt(data.enterpriseId) });
      }

      console.log('Creating ride with payload:', payload);

      // Call the API to create the ride
      const response = await RideService.createRide(payload);
      console.log('Ride created successfully:', response);

      // Navigate to the rides page
      navigate('/rides');
    } catch (error) {
      console.error('Error creating ride:', error);
      setError(error instanceof Error ? error.message : 'Failed to create ride. Please try again.');
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger id="rideType">
                    <SelectValue placeholder="Select ride type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hub_to_hub">Hub to Hub</SelectItem>
                    <SelectItem value="hub_to_destination">Hub to Destination</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="startingHubId">
                      <SelectValue placeholder="Select starting hub" />
                    </SelectTrigger>
                    <SelectContent>
                      {allLocations.map((location) => (
                        <SelectItem key={location.uniqueId} value={location.originalId.toString()}>
                          {location.name} {location.type === 'destination' ? '(Destination)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="destinationHubId">
                      <SelectValue placeholder="Select destination hub" />
                    </SelectTrigger>
                    <SelectContent>
                      {allLocations.map((location) => (
                        <SelectItem key={location.uniqueId} value={location.originalId.toString()}>
                          {location.name} {location.type === 'destination' ? '(Destination)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="enterpriseId">
                      <SelectValue placeholder="Select enterprise" />
                    </SelectTrigger>
                    <SelectContent>
                      {enterprises.map((enterprise) => (
                        <SelectItem key={enterprise.uniqueId || `enterprise_${enterprise.id}`} value={enterprise.id.toString()}>
                          {enterprise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger id="vehicleTypeId">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.uniqueId || `vehicle_${type.id}`} value={type.id.toString()}>
                          {type.name} (Capacity: {type.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
