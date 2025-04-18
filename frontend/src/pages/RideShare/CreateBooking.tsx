import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import PageMeta from '@/components/common/PageMeta';

// Define the form schema with Zod
const createBookingSchema = z.object({
  numberOfSeats: z.string().transform((val) => parseInt(val, 10)).refine((val) => val >= 1 && val <= 10, {
    message: 'Number of seats must be between 1 and 10',
  }),
  paymentMethod: z.enum(['credit_card', 'paypal', 'swish', 'apple_pay', 'google_pay']),
  specialRequests: z.string().optional(),
});

type CreateBookingFormValues = z.infer<typeof createBookingSchema>;

interface Ride {
  id: string;
  rideType: 'hub_to_hub' | 'hub_to_destination' | 'enterprise';
  startingHub: {
    id: number;
    name: string;
    address: string;
  };
  destinationHub: {
    id: number;
    name: string;
    address: string;
  };
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  driver?: {
    id: string;
    name: string;
    rating: number;
  };
  vehicleType: {
    id: number;
    name: string;
    capacity: number;
  };
  enterprise?: {
    id: number;
    name: string;
  };
}

const CreateBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ride, setRide] = useState<Ride | null>(null);
  const [loadingRide, setLoadingRide] = useState(true);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<CreateBookingFormValues>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      numberOfSeats: '1',
      paymentMethod: 'credit_card',
      specialRequests: '',
    },
  });

  const numberOfSeats = watch('numberOfSeats');
  const paymentMethod = watch('paymentMethod');

  // Get the ride ID from the URL query parameters
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin?redirect=' + encodeURIComponent(location.pathname + location.search));
      return;
    }

    const params = new URLSearchParams(location.search);
    const rideId = params.get('rideId');
    
    if (!rideId) {
      navigate('/rides');
      return;
    }

    // Fetch ride details
    const fetchRide = async () => {
      setLoadingRide(true);
      try {
        // In a real app, we would fetch from the API
        // const response = await apiClient.get<Ride>(`/rides/${rideId}`);
        // setRide(response);
        
        // For now, use mock data
        setTimeout(() => {
          setRide({
            id: rideId,
            rideType: 'hub_to_hub',
            startingHub: {
              id: 1,
              name: 'Central Station',
              address: 'Drottningtorget 5, 411 03 Göteborg'
            },
            destinationHub: {
              id: 2,
              name: 'Lindholmen',
              address: 'Lindholmspiren 7, 417 56 Göteborg'
            },
            departureTime: new Date(Date.now() + 3600000).toISOString(),
            availableSeats: 3,
            pricePerSeat: 25,
            status: 'active',
            driver: {
              id: 'd1',
              name: 'Johan Andersson',
              rating: 4.8
            },
            vehicleType: {
              id: 1,
              name: 'Sedan',
              capacity: 4
            }
          });
          setLoadingRide(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching ride:', error);
        navigate('/rides');
      }
    };

    fetchRide();
  }, [isAuthenticated, location.pathname, location.search, navigate]);

  const handleFormSubmit = async (data: CreateBookingFormValues) => {
    if (!ride) return;
    
    setLoading(true);
    
    try {
      // Prepare the payload
      const payload = {
        ride_id: ride.id,
        number_of_seats: parseInt(data.numberOfSeats),
        payment_method: data.paymentMethod,
        special_requests: data.specialRequests || '',
        total_price: ride.pricePerSeat * parseInt(data.numberOfSeats),
      };
      
      console.log('Creating booking with payload:', payload);
      
      // In a real app, we would send this to the API
      // const response = await apiClient.post('/bookings', payload);
      
      // For now, simulate a successful API call
      setTimeout(() => {
        setLoading(false);
        navigate('/bookings/confirmation?bookingId=mock123');
      }, 1500);
    } catch (error) {
      console.error('Error creating booking:', error);
      setLoading(false);
    }
  };

  if (loadingRide) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Ride Not Found</h1>
        <p className="mb-4">The ride you're looking for could not be found.</p>
        <Button onClick={() => navigate('/rides')}>Back to Rides</Button>
      </div>
    );
  }

  const totalPrice = ride.pricePerSeat * parseInt(numberOfSeats || '1');

  return (
    <div className="p-6">
      <PageMeta 
        title="RideShare - Book a Ride" 
        description="Complete your booking for the selected ride."
      />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Book a Ride</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/rides')}
        >
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Booking Details</h2>
                <p className="text-gray-600">Please complete the information below to book your ride.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfSeats">Number of Seats</Label>
                <Controller
                  name="numberOfSeats"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger id="numberOfSeats">
                        <SelectValue placeholder="Select number of seats" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: Math.min(ride.availableSeats, 10) }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'seat' : 'seats'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.numberOfSeats && (
                  <p className="text-sm text-red-500">{errors.numberOfSeats.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="swish">Swish</SelectItem>
                        <SelectItem value="apple_pay">Apple Pay</SelectItem>
                        <SelectItem value="google_pay">Google Pay</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.paymentMethod && (
                  <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
                )}
              </div>

              {paymentMethod === 'credit_card' && (
                <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardholderName">Cardholder Name</Label>
                    <Input
                      id="cardholderName"
                      placeholder="John Doe"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                <Textarea
                  id="specialRequests"
                  placeholder="Any special requirements or requests for your ride"
                  {...register('specialRequests')}
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/rides')}
                  disabled={loading}
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
                      <span className="mr-2">Processing...</span>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    </>
                  ) : (
                    'Complete Booking'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Ride Summary</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Route</p>
                <p className="font-medium">{ride.startingHub.name} → {ride.destinationHub.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Departure Time</p>
                <p className="font-medium">{new Date(ride.departureTime).toLocaleString()}</p>
              </div>
              
              {ride.driver && (
                <div>
                  <p className="text-sm text-gray-600">Driver</p>
                  <p className="font-medium">{ride.driver.name} ({ride.driver.rating}★)</p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600">Vehicle</p>
                <p className="font-medium">{ride.vehicleType.name}</p>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between mb-2">
                  <p>Price per seat</p>
                  <p>${ride.pricePerSeat.toFixed(2)}</p>
                </div>
                
                <div className="flex justify-between mb-2">
                  <p>Number of seats</p>
                  <p>{numberOfSeats || 1}</p>
                </div>
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <p>Total</p>
                  <p>${totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateBooking;
