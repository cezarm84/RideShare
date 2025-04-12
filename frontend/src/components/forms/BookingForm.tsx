import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { bookingService } from '@/services/booking.service';
import { rideService } from '@/services/ride.service';
import { Ride } from '@/services/ride.service';

const bookingSchema = z.object({
  rideId: z.string().min(1, 'Ride is required'),
  seats: z.coerce.number().min(1, 'At least 1 seat is required'),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  initialData?: {
    id: string;
    rideId: string;
    seats: number;
    notes?: string;
  };
  onSubmit: (data: BookingFormValues) => Promise<void>;
  onCancel: () => void;
}

const BookingForm = ({ initialData, onSubmit, onCancel }: BookingFormProps) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: initialData || {
      rideId: '',
      seats: 1,
      notes: '',
    },
  });

  const selectedRideId = watch('rideId');

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const data = await rideService.getRides();
        // Filter to only show active rides
        const activeRides = data.filter(ride => ride.status === 'active');
        setRides(activeRides);
      } catch (error) {
        console.error('Error fetching rides:', error);
      }
    };

    fetchRides();
  }, []);

  const handleFormSubmit = async (data: BookingFormValues) => {
    try {
      setLoading(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedRide = rides.find(ride => ride.id === selectedRideId);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rideId">Select Ride</Label>
        <Select
          onValueChange={(value) => setValue('rideId', value)}
          defaultValue={initialData?.rideId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a ride" />
          </SelectTrigger>
          <SelectContent>
            {rides.map((ride) => (
              <SelectItem key={ride.id} value={ride.id}>
                {ride.origin} → {ride.destination} ({new Date(ride.departureTime).toLocaleString()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.rideId && (
          <p className="text-sm text-red-500">{errors.rideId.message}</p>
        )}
      </div>

      {selectedRide && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium">Ride Details</h3>
          <p className="text-sm text-gray-600">Driver: {selectedRide.driver.name}</p>
          <p className="text-sm text-gray-600">Price: ${selectedRide.price}</p>
          <p className="text-sm text-gray-600">Available Seats: {selectedRide.availableSeats}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="seats">Number of Seats</Label>
        <Input
          id="seats"
          type="number"
          min="1"
          max={selectedRide?.availableSeats || 1}
          {...register('seats')}
        />
        {errors.seats && (
          <p className="text-sm text-red-500">{errors.seats.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Enter any additional notes"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update Booking' : 'Create Booking'}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm; 