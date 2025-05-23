import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { rideService } from '../../services/ride.service'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { driverService } from '../../services/driver.service';
import { Driver } from '../../services/driver.service';
import { DatePickerWithPreview } from '../ui/date-picker-with-preview';
import { TimePickerWithPreview } from '../ui/time-picker-with-preview';

const rideSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  departureTime: z.string().min(1, 'Departure time is required'),
  availableSeats: z.coerce.number().min(1, 'Available seats must be greater than 0'),
  price: z.coerce.number().min(0, 'Price must be greater than 0'),
  driverId: z.string().min(1, 'Driver is required'),
  notes: z.string().optional(),
}).refine(data => {
  const date = new Date(`${data.departureDate}T${data.departureTime}`);
  return date > new Date();
}, {
  message: 'Departure date and time must be in the future',
  path: ['departureDate'] // Show the error on the date field
});

type RideFormValues = z.infer<typeof rideSchema>;

interface RideFormProps {
  initialData?: {
    id: string;
    origin: string;
    destination: string;
    departureTime: string; // ISO string format
    availableSeats: number;
    price: number;
    driverId: string;
    notes?: string;
  };
  onSubmit: (data: RideFormValues) => Promise<void>;
  onCancel: () => void;
}

const RideForm = ({ initialData, onSubmit, onCancel }: RideFormProps) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [driverError, setDriverError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    setValue,
    control,
    trigger,
  } = useForm<RideFormValues>({
    resolver: zodResolver(rideSchema),
    defaultValues: initialData ? {
      origin: initialData.origin,
      destination: initialData.destination,
      departureDate: initialData.departureTime ? new Date(initialData.departureTime).toISOString().split('T')[0] : '',
      departureTime: initialData.departureTime ? new Date(initialData.departureTime).toISOString().split('T')[1].substring(0, 5) : '',
      availableSeats: initialData.availableSeats,
      price: initialData.price,
      driverId: initialData.driverId,
      notes: initialData.notes || '',
    } : {
      origin: '',
      destination: '',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '08:00',
      availableSeats: 1,
      price: 0,
      driverId: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await driverService.getDrivers();
        setDrivers(data);
        setDriverError(null);

        if (initialData?.driverId) {
          setValue('driverId', initialData.driverId);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching drivers:', error);
          setError(error);
          setDriverError('Error loading drivers. Please try again.');
        }
      }
    };

    fetchDrivers();
  }, [initialData, setValue]);

  const handleFormSubmit = async (data: RideFormValues) => {
    setLoading(true);
    setError(null);
    try {
      // Combine date and time into a single ISO string
      const combinedData = {
        ...data,
        departureTime: `${data.departureDate}T${data.departureTime}`,
      };

      // Remove the separate date field before submitting
      const { departureDate, ...submitData } = combinedData;

      await onSubmit(submitData as RideFormValues);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error submitting form:', error);
        setError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger validation on form submission for testing
  const onFormSubmit = async (e: React.FormEvent) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!isSubmitted) {
      await trigger();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" role="form" onClick={onFormSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="origin">Origin</Label>
          <Input
            id="origin"
            {...register('origin')}
            placeholder="Enter origin"
          />
          {errors.origin && (
            <p className="text-sm text-red-500">{errors.origin.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            {...register('destination')}
            placeholder="Enter destination"
          />
          {errors.destination && (
            <p className="text-sm text-red-500">{errors.destination.message}</p>
          )}
        </div>

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

        <div className="space-y-2">
          <Label htmlFor="driverId">Driver</Label>
          <Controller
            name="driverId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger id="driverId">
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.driverId && (
            <p className="text-sm text-red-500">{errors.driverId.message}</p>
          )}
          {driverError && (
            <p className="text-sm text-red-500">{driverError}</p>
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
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            {...register('price')}
          />
          {errors.price && (
            <p className="text-sm text-red-500">{errors.price.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Enter any additional notes"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">
          {error.message || 'An error occurred. Please try again.'}
        </p>
      )}

      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          aria-label={loading ? 'Saving...' : initialData ? 'Update Ride' : 'Create Ride'}
          data-testid="submit-button"
        >
          {loading ? 'Saving...' : initialData ? 'Update Ride' : 'Create Ride'}
        </Button>
      </div>
    </form>
  );
};

export default RideForm;
