import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BasicSelect } from '@/components/ui/basic-select';
import { Card } from '@/components/ui/card';
import RideService from '@/services/ride.service';
import { DatePickerWithPreview } from '@/components/ui/date-picker-with-preview';

// Define the form schema with Zod
const searchSchema = z.object({
  startLocation: z.string().min(1, 'Starting location is required'),
  destination: z.string().min(1, 'Destination is required'),
  date: z.string().min(1, 'Date is required'),
  rideType: z.enum(['hub_to_hub', 'hub_to_destination', 'enterprise']),
  passengers: z.number().int().min(1).max(50, 'Maximum 50 passengers allowed'),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface Hub {
  id: number;
  name: string;
  address: string;
  locationId?: string;  // Optional property for unique identification
}

interface RideSearchFormProps {
  onSearch: (values: SearchFormValues) => void;
}

const RideSearchForm = ({ onSearch }: RideSearchFormProps) => {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [destinations, setDestinations] = useState<Hub[]>([]);
  const [allLocations, setAllLocations] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      startLocation: 'hub_1', // Default to Brunnsparken Hub
      destination: 'hub_2',   // Default to Lindholmen Hub
      date: new Date().toISOString().split('T')[0],
      rideType: 'hub_to_hub',
      passengers: 1,
    },
  });

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoading(true);
        // Fetch reference data from the API
        const data = await RideService.getRideReferenceData();
        console.log('Reference data for search form:', data);

        // Update state with fetched data
        if (data.hubs) setHubs(data.hubs);
        if (data.destinations) setDestinations(data.destinations);

        // Create a combined array of all locations (hubs + destinations)
        // Make sure to create unique IDs for each location
        const hubsWithIds = (data.hubs || []).map(hub => ({
          ...hub,
          locationId: `hub_${hub.id}`  // Add a unique identifier
        }));

        const destinationsWithIds = (data.destinations || []).map(dest => ({
          ...dest,
          locationId: `dest_${dest.id}`  // Add a unique identifier
        }));

        const allLocations = [
          ...hubsWithIds,
          ...destinationsWithIds
        ];
        setAllLocations(allLocations);
      } catch (err) {
        console.error('Error fetching reference data:', err);
        // Use default data if API fails - with 8 hubs and 5 destinations (total 13)
        const defaultHubs = [
          { id: 1, name: 'Brunnsparken Hub', address: 'Brunnsparken, 411 03 Göteborg', city: 'Göteborg', locationId: 'hub_1' },
          { id: 2, name: 'Lindholmen Hub', address: 'Lindholmspiren 5, 417 56 Göteborg', city: 'Göteborg', locationId: 'hub_2' },
          { id: 3, name: 'Mölndal Hub', address: 'Göteborgsvägen 97, 431 30 Mölndal', city: 'Mölndal', locationId: 'hub_3' },
          { id: 4, name: 'Landvetter Hub', address: 'Flygplatsvägen 90, 438 80 Landvetter', city: 'Landvetter', locationId: 'hub_4' },
          { id: 5, name: 'Partille Hub', address: 'Partille Centrum, 433 38 Partille', city: 'Partille', locationId: 'hub_5' },
          { id: 6, name: 'Kungsbacka Hub', address: 'Kungsbacka Station, 434 30 Kungsbacka', city: 'Kungsbacka', locationId: 'hub_6' },
          { id: 7, name: 'Lerum Hub', address: 'Lerum Station, 443 30 Lerum', city: 'Lerum', locationId: 'hub_7' },
          { id: 8, name: 'Kungälv Hub', address: 'Kungälv Resecentrum, 442 30 Kungälv', city: 'Kungälv', locationId: 'hub_8' },
        ];

        const defaultDestinations = [
          { id: 101, name: 'Volvo Cars Torslanda', address: 'Torslandavägen 1, 405 31 Göteborg', city: 'Göteborg', locationId: 'dest_101' },
          { id: 102, name: 'Volvo Group Lundby', address: 'Gropegårdsgatan 2, 417 15 Göteborg', city: 'Göteborg', locationId: 'dest_102' },
          { id: 103, name: 'AstraZeneca Mölndal', address: 'Pepparedsleden 1, 431 83 Mölndal', city: 'Mölndal', locationId: 'dest_103' },
          { id: 104, name: 'Ericsson Lindholmen', address: 'Lindholmspiren 11, 417 56 Göteborg', city: 'Göteborg', locationId: 'dest_104' },
          { id: 105, name: 'SKF Gamlestaden', address: 'Hornsgatan 1, 415 50 Göteborg', city: 'Göteborg', locationId: 'dest_105' },
        ];

        setHubs(defaultHubs);
        setDestinations(defaultDestinations);
        setAllLocations([...defaultHubs, ...defaultDestinations]);
      } finally {
        setLoading(false);
      }
    };

    fetchReferenceData();
  }, []);

  const handleFormSubmit = (data: SearchFormValues) => {
    console.log('Form submitted with data:', data);
    // Ensure all required fields are present
    const validatedData = {
      ...data,
      startLocation: data.startLocation || 'hub_1',
      destination: data.destination || 'hub_2',
      date: data.date || new Date().toISOString().split('T')[0],
      rideType: data.rideType || 'hub_to_hub',
      passengers: data.passengers || 1
    };

    console.log('Validated search form data:', validatedData);
    onSearch(validatedData);
  };

  return (
    <Card className="p-6 shadow-sm border-gray-200 dark:border-gray-700 dark:bg-gray-800">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Find Available Rides</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Route */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Route</h3>

            <div className="space-y-2">
              <Label htmlFor="startLocation" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Starting Location
              </Label>
              <Controller
                name="startLocation"
                control={control}
                render={({ field }) => (
                  <BasicSelect
                    id="startLocation"
                    options={allLocations.map(location => ({
                      value: location.locationId || location.id.toString(),
                      label: location.name
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select starting location"
                    disabled={loading}
                  />
                )}
              />
              {errors.startLocation && (
                <p className="text-sm text-red-500 mt-1">{errors.startLocation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Destination
              </Label>
              <Controller
                name="destination"
                control={control}
                render={({ field }) => (
                  <BasicSelect
                    id="destination"
                    options={allLocations.map(location => ({
                      value: location.locationId || location.id.toString(),
                      label: location.name
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select destination location"
                    disabled={loading}
                  />
                )}
              />
              {errors.destination && (
                <p className="text-sm text-red-500 mt-1">{errors.destination.message}</p>
              )}
            </div>
          </div>

          {/* Right column - Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Details</h3>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Travel Date
              </Label>
              <Controller
                name="date"
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
                      label="Date"
                      placeholder="Select travel date"
                      className="w-full"
                    />
                  );
                }}
              />
              {errors.date && (
                <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rideType" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Ride Type
                </Label>
                <Controller
                  name="rideType"
                  control={control}
                  render={({ field }) => (
                    <BasicSelect
                      id="rideType"
                      options={[
                        { value: 'hub_to_hub', label: 'Hub to Hub' },
                        { value: 'hub_to_destination', label: 'Hub to Destination' },
                        { value: 'enterprise', label: 'Enterprise' }
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select type"
                    />
                  )}
                />
                {errors.rideType && (
                  <p className="text-sm text-red-500 mt-1">{errors.rideType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passengers" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Passengers
                </Label>
                <Controller
                  name="passengers"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        id="passengers"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full appearance-none"
                        value={field.value}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value)) {
                            // Ensure value is between 1 and 50
                            const clampedValue = Math.min(Math.max(value, 1), 50);
                            field.onChange(clampedValue);
                          } else if (e.target.value === '') {
                            // Allow empty field temporarily while typing
                            field.onChange('');
                          }
                        }}
                        onBlur={(e) => {
                          // When field loses focus, ensure we have a valid number
                          const value = parseInt(e.target.value);
                          if (isNaN(value) || e.target.value === '') {
                            field.onChange(1); // Default to 1 if invalid
                          }
                        }}
                      />
                      <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center pr-2">
                        <button
                          type="button"
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                          onClick={() => {
                            const newValue = Math.min(field.value === '' ? 1 : parseInt(field.value) + 1, 50);
                            field.onChange(newValue);
                          }}
                          aria-label="Increase passengers"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                          onClick={() => {
                            const newValue = Math.max(field.value === '' ? 1 : parseInt(field.value) - 1, 1);
                            field.onChange(newValue);
                          }}
                          aria-label="Decrease passengers"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter a number between 1 and 50
                </div>
                {errors.passengers && (
                  <p className="text-sm text-red-500 mt-1">{errors.passengers.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            className="w-full md:w-auto bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Find Rides'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default RideSearchForm;
