import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Clock, CreditCard, MapPin, User, Users, Calendar, Info } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';

const BookingProgress = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Sample booking process steps
  const steps = [
    { id: 'select-ride', label: 'Select Ride', icon: <MapPin className="h-5 w-5" />, completed: true },
    { id: 'passenger-info', label: 'Passenger Info', icon: <User className="h-5 w-5" />, completed: true },
    { id: 'payment', label: 'Payment', icon: <CreditCard className="h-5 w-5" />, completed: false },
    { id: 'confirmation', label: 'Confirmation', icon: <CheckCircle className="h-5 w-5" />, completed: false },
  ];

  // Sample booking details
  const bookingDetails = {
    ride: {
      id: '3',
      origin: 'Central Station',
      destination: 'Lindholmen',
      departureTime: new Date(Date.now() + 3600000).toISOString(),
      price: 25,
      availableSeats: 3,
      driver: {
        name: 'Johan Andersson',
        rating: 4.8,
      },
      vehicle: {
        type: 'Sedan',
        capacity: 4,
      },
    },
    passengers: [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+46701234567',
      },
    ],
    payment: {
      method: 'credit_card',
      total: 25,
      status: 'pending',
    },
  };

  return (
    <div className="p-6">
      <PageMeta
        title="RideShare - Booking Process"
        description="Overview of the booking process in RideShare."
      />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Booking Process</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center h-12 w-12 rounded-full ${
                    step.completed
                      ? 'bg-green-100 text-green-600'
                      : index === steps.findIndex((s) => !s.completed)
                      ? 'bg-blue-100 text-blue-600 animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.icon}
                </div>
                <p className="mt-2 text-sm font-medium">{step.label}</p>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-16 mt-6 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ride-details">Ride Details</TabsTrigger>
            <TabsTrigger value="passenger-info">Passenger Info</TabsTrigger>
            <TabsTrigger value="payment">Payment Options</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Process Overview</h2>
              <p className="mb-4">
                The RideShare booking process consists of four main steps:
              </p>

              <ol className="space-y-4 mb-6">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 mt-0.5">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Select a Ride</h3>
                    <p className="text-gray-600">
                      Browse available rides and select one that matches your travel needs.
                      You can filter by origin, destination, date, and time.
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 mt-0.5">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Enter Passenger Information</h3>
                    <p className="text-gray-600">
                      Provide details for all passengers, including name, email, and phone number.
                      You can add multiple passengers if needed.
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 mt-0.5">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">Payment</h3>
                    <p className="text-gray-600">
                      Choose your preferred payment method and complete the payment process.
                      We support credit cards, PayPal, Swish, and more.
                    </p>
                  </div>
                </li>

                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mr-3 mt-0.5">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium">Confirmation</h3>
                    <p className="text-gray-600">
                      Review your booking details and receive a confirmation.
                      A confirmation email will be sent to your email address.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="flex justify-end">
                <Button onClick={() => navigate('/rides')}>Browse Available Rides</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ride-details">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Ride Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Route</h3>
                    <div className="flex items-center mt-1">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="font-medium">
                        {bookingDetails.ride.origin} → {bookingDetails.ride.destination}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Departure Time</h3>
                    <div className="flex items-center mt-1">
                      <Clock className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="font-medium">
                        {new Date(bookingDetails.ride.departureTime).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Price</h3>
                    <p className="font-medium mt-1">
                      ${bookingDetails.ride.price} per seat
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Driver</h3>
                    <div className="flex items-center mt-1">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="font-medium">
                        {bookingDetails.ride.driver.name} ({bookingDetails.ride.driver.rating}★)
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Vehicle</h3>
                    <p className="font-medium mt-1">
                      {bookingDetails.ride.vehicle.type} (Capacity: {bookingDetails.ride.vehicle.capacity})
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Available Seats</h3>
                    <div className="flex items-center mt-1">
                      <Users className="h-5 w-5 text-gray-400 mr-2" />
                      <p className="font-medium">
                        {bookingDetails.ride.availableSeats} seats available
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('passenger-info')}>
                  Continue to Passenger Info
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="passenger-info">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Passenger Information</h2>
              
              <div className="space-y-6 mb-6">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Primary Passenger</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{bookingDetails.passengers[0].name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{bookingDetails.passengers[0].email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{bookingDetails.passengers[0].phone}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-md border-dashed">
                  <div className="flex items-center justify-center h-20">
                    <Button variant="outline" className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Add Additional Passenger
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-md bg-gray-50">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                    Special Requests
                  </h3>
                  <p className="text-sm text-gray-600">
                    You can add special requests such as luggage requirements, accessibility needs, or any other information that might be helpful for your ride.
                  </p>
                  <div className="mt-2 p-3 bg-white border rounded-md text-gray-400 italic">
                    No special requests added
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('ride-details')}>
                  Back to Ride Details
                </Button>
                <Button onClick={() => setActiveTab('payment')}>
                  Continue to Payment
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Options</h2>
              
              <div className="space-y-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors border-blue-500 bg-blue-50">
                    <CreditCard className="h-8 w-8 mb-2 text-blue-500" />
                    <p className="font-medium">Credit Card</p>
                  </div>
                  
                  <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="h-8 w-8 mb-2 flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-600">S</span>
                    </div>
                    <p className="font-medium">Swish</p>
                  </div>
                  
                  <div className="border rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="h-8 w-8 mb-2 flex items-center justify-center">
                      <span className="text-xl font-bold text-blue-800">P</span>
                    </div>
                    <p className="font-medium">PayPal</p>
                  </div>
                </div>

                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-4">Credit Card Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 bg-gray-100 rounded-md">
                      <p className="text-sm text-gray-500">Card Number</p>
                      <p className="font-medium">•••• •••• •••• 1234</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-100 rounded-md">
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="font-medium">12/25</p>
                      </div>
                      
                      <div className="p-3 bg-gray-100 rounded-md">
                        <p className="text-sm text-gray-500">CVV</p>
                        <p className="font-medium">•••</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-gray-100 rounded-md">
                      <p className="text-sm text-gray-500">Cardholder Name</p>
                      <p className="font-medium">John Doe</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-md bg-gray-50">
                  <h3 className="font-medium mb-2">Payment Summary</h3>
                  <div className="flex justify-between mb-2">
                    <p>Price per seat</p>
                    <p>${bookingDetails.ride.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-between mb-2">
                    <p>Number of seats</p>
                    <p>{bookingDetails.passengers.length}</p>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                    <p>Total</p>
                    <p>${bookingDetails.payment.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('passenger-info')}>
                  Back to Passenger Info
                </Button>
                <Button onClick={() => navigate('/bookings/confirmation?bookingId=demo123')}>
                  Complete Payment
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2 flex items-center">
            <Info className="h-5 w-5 mr-2" />
            About This Page
          </h3>
          <p className="text-sm text-blue-700">
            This is a demonstration page showing the booking process features in RideShare.
            You can navigate through the tabs to see different stages of the booking process.
            To create an actual booking, please go to the <a href="/rides" className="underline">Rides page</a> and select a ride.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingProgress;
