import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  Clock,
  CreditCard,
  MapPin,
  User,
  Users,
  Calendar,
  Info,
  Truck,
  Bus,
  Car,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  CreditCard as CreditCardIcon,
  Wallet,
  Apple,
  LogIn
} from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const BookingProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('details');
  const [selectedVehicle, setSelectedVehicle] = useState('bus');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [pickup, setPickup] = useState('Central Station');
  const [dropoff, setDropoff] = useState('Lindholmen');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedSeats] = useState<string[]>(["3", "7", "12", "15", "21", "25", "30", "34"]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [passengerDetails, setPassengerDetails] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

  // Handle tab change with authentication check for payment
  const handleTabChange = (value: string) => {
    // If trying to access payment tab and not authenticated, redirect to sign in
    if (value === 'payment' && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to proceed with payment",
        variant: "default",
      });
      // Save current booking state in session storage
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        vehicle: selectedVehicle,
        date: selectedDate,
        time: selectedTime,
        seats: selectedSeats,
        pickup,
        dropoff
      }));
      // Redirect to sign in with return URL
      navigate('/signin', { state: { from: location } });
      return;
    }

    setActiveTab(value);
  };

  // Helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date: Date, day: number) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isPastDate = (date: Date, day: number) => {
    const today = new Date();
    const checkDate = new Date(date.getFullYear(), date.getMonth(), day);
    return checkDate < new Date(today.setHours(0, 0, 0, 0));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const getNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour % 12 || 12;
        const period = hour < 12 ? 'AM' : 'PM';
        const formattedMinute = minute.toString().padStart(2, '0');
        slots.push(`${formattedHour}:${formattedMinute} ${period}`);
      }
    }
    return slots;
  };

  const isSeatBooked = (seatId: string) => {
    return bookedSeats.includes(seatId);
  };

  const isSeatSelected = (seatId: string) => {
    return selectedSeats.includes(seatId);
  };

  const toggleSeatSelection = (seatId: string) => {
    if (isSeatBooked(seatId)) return;

    if (isSeatSelected(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const getSeatPrice = (seatId: string) => {
    const seatNum = parseInt(seatId, 10);

    switch (selectedVehicle) {
      case 'bus':
        // Window seats cost more
        if (seatNum % 4 === 1 || seatNum % 4 === 0) {
          return 25.99;
        }
        return 19.99;
      case 'car':
        // Front seats cost more
        if (seatNum <= 2) {
          return 15.99;
        }
        return 12.99;
      case 'truck':
        // Middle seat costs less
        if (seatNum === 2) {
          return 10.99;
        }
        return 12.99;
      default:
        return 15.00;
    }
  };

  const calculateTotalPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      return total + getSeatPrice(seatId);
    }, 0);
  };

  const formatCreditCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = [];

    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }

    return groups.join(' ');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 16) {
      setCardNumber(formatCreditCardNumber(value));
    }
  };

  // Generate seat layout for the selected vehicle
  const generateSeatLayout = () => {
    switch (selectedVehicle) {
      case 'bus':
        // 5 rows of 8 seats (4 on each side with aisle)
        return [
          ['1', '2', null, '3', '4'],
          ['5', '6', null, '7', '8'],
          ['9', '10', null, '11', '12'],
          ['13', '14', null, '15', '16'],
          ['17', '18', null, '19', '20'],
          ['21', '22', null, '23', '24'],
          ['25', '26', null, '27', '28'],
          ['29', '30', null, '31', '32'],
          ['33', '34', null, '35', '36'],
          ['37', '38', null, '39', '40'],
        ];
      case 'car':
        // 2 rows of 2-3 seats
        return [
          ['1', '2', null],
          ['3', '4', '5'],
        ];
      case 'truck':
        // 1 row of 3 seats
        return [
          ['1', '2', '3'],
        ];
      default:
        return [
          ['1', '2', null, '3', '4'],
          ['5', '6', null, '7', '8'],
        ];
    }
  };

  // Sample booking process steps
  const steps = [
    { id: 'details', label: 'Ride Details', icon: <MapPin className="h-5 w-5" />, completed: activeTab !== 'details' },
    { id: 'seats', label: 'Seat Selection', icon: <Users className="h-5 w-5" />, completed: activeTab === 'payment' },
    { id: 'payment', label: 'Payment', icon: <CreditCard className="h-5 w-5" />, completed: false },
  ];

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

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="details">Ride Details</TabsTrigger>
            <TabsTrigger value="seats">Seat Selection</TabsTrigger>
            <TabsTrigger value="payment">
              {!isAuthenticated && <LogIn className="h-4 w-4 mr-1" />}
              Payment Options
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div>
                  {/* Vehicle Selection */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Select Vehicle Type</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className={`border rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition ${selectedVehicle === 'car' ? 'border-blue-500 bg-blue-50' : ''}`}
                        onClick={() => setSelectedVehicle('car')}
                      >
                        <Car className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <p className="font-medium">Sedan</p>
                        <p className="text-sm text-gray-600">Up to 3 passengers</p>
                        <p className="text-sm font-semibold mt-2">$25-35</p>
                      </div>
                      <div
                        className={`border rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition ${selectedVehicle === 'truck' ? 'border-blue-500 bg-blue-50' : ''}`}
                        onClick={() => setSelectedVehicle('truck')}
                      >
                        <Truck className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <p className="font-medium">SUV</p>
                        <p className="text-sm text-gray-600">Up to 5 passengers</p>
                        <p className="text-sm font-semibold mt-2">$35-50</p>
                      </div>
                      <div
                        className={`border rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition ${selectedVehicle === 'bus' ? 'border-blue-500 bg-blue-50' : ''}`}
                        onClick={() => setSelectedVehicle('bus')}
                      >
                        <Bus className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <p className="font-medium">Bus</p>
                        <p className="text-sm text-gray-600">Up to 40 passengers</p>
                        <p className="text-sm font-semibold mt-2">$10-15</p>
                      </div>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Select Date</h2>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={getPreviousMonth}
                          className="p-2 rounded-full hover:bg-gray-100"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <h3 className="font-semibold">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={getNextMonth}
                          className="p-2 rounded-full hover:bg-gray-100"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="font-medium text-sm py-2">{day}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
                          <div key={`empty-${i}`} className="h-10 w-10"></div>
                        ))}

                        {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
                          const day = i + 1;
                          const isCurrentDay = isToday(currentMonth, day);
                          const isPast = isPastDate(currentMonth, day);
                          const isSelected =
                            selectedDate.getDate() === day &&
                            selectedDate.getMonth() === currentMonth.getMonth() &&
                            selectedDate.getFullYear() === currentMonth.getFullYear();

                          return (
                            <div
                              key={`day-${day}`}
                              className={`h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-colors
                                ${isSelected ? 'bg-blue-600 text-white' : ''}
                                ${isCurrentDay && !isSelected ? 'border border-blue-600 text-blue-600' : ''}
                                ${isPast ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}
                              `}
                              onClick={() => {
                                if (!isPast) {
                                  setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                                }
                              }}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Select Time</h2>
                    <div className="grid grid-cols-4 gap-2">
                      {generateTimeSlots().map(time => (
                        <div
                          key={time}
                          className={`border rounded-lg p-2 text-center cursor-pointer transition-colors
                            ${selectedTime === time ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}
                          `}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  {/* Map */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Pickup & Dropoff Locations</h2>
                    <div
                      ref={mapRef}
                      className="w-full h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center"
                    >
                      <div className="text-gray-500">
                        {pickup && dropoff ? (
                          <div className="text-center">
                            <p>Map would show route from {pickup} to {dropoff}</p>
                            <p className="mt-2">
                              Distance: 5.2 km | Estimated time: 15 minutes
                            </p>
                          </div>
                        ) : (
                          <p>Select pickup and dropoff locations to see the route</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <MapPin className="h-5 w-5 text-blue-500" />
                        </div>
                        <Input
                          type="text"
                          value={pickup}
                          onChange={(e) => setPickup(e.target.value)}
                          className="flex-1"
                          placeholder="Enter pickup location"
                        />
                      </div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                          <Flag className="h-5 w-5 text-red-500" />
                        </div>
                        <Input
                          type="text"
                          value={dropoff}
                          onChange={(e) => setDropoff(e.target.value)}
                          className="flex-1"
                          placeholder="Enter dropoff location"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ride Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h2 className="text-xl font-semibold mb-4">Ride Summary</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vehicle:</span>
                        <span className="font-medium">
                          {selectedVehicle === 'car' ? 'Sedan' : selectedVehicle === 'truck' ? 'SUV' : 'Bus'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup:</span>
                        <span className="font-medium">{pickup || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dropoff:</span>
                        <span className="font-medium">{dropoff || 'Not selected'}</span>
                      </div>
                      <div className="border-t border-gray-200 my-2"></div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Estimated Price:</span>
                        <span>
                          ${selectedVehicle === 'bus' ? '12.50' : selectedVehicle === 'car' ? '30.00' : '45.00'}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-6"
                      onClick={() => handleTabChange('seats')}
                    >
                      Continue to Seat Selection
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="seats">
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Select Your Seats</h2>
                  <p className="text-gray-600 mb-6">Click on available seats to select them. Green seats are available, red are already booked.</p>

                  {/* Bus Layout */}
                  <div className="bg-gray-100 p-6 rounded-lg border">
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {selectedVehicle === 'car' ? (
                          <Car className="h-4 w-4 text-gray-600" />
                        ) : selectedVehicle === 'truck' ? (
                          <Truck className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Bus className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {generateSeatLayout().map((row, rowIndex) => (
                        <div key={`row-${rowIndex}`} className="flex justify-center space-x-2">
                          {row.map((seat, seatIndex) => {
                            if (seat === null) {
                              // Aisle
                              return <div key={`aisle-${rowIndex}-${seatIndex}`} className="w-8 h-8"></div>;
                            }

                            const isBooked = isSeatBooked(seat);
                            const isSelected = isSeatSelected(seat);

                            return (
                              <div
                                key={`seat-${seat}`}
                                className={`
                                  w-8 h-8 flex items-center justify-center rounded cursor-pointer text-xs
                                  ${isBooked ? 'bg-red-400 text-white cursor-not-allowed' : ''}
                                  ${isSelected ? 'bg-blue-600 text-white' : ''}
                                  ${!isBooked && !isSelected ? 'bg-green-200 hover:bg-green-300' : ''}
                                `}
                                onClick={() => toggleSeatSelection(seat)}
                                title={`Seat ${seat} - $${getSeatPrice(seat).toFixed(2)}`}
                              >
                                {seat}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <h3 className="font-medium mb-2">Passenger Details</h3>
                      <div className="space-y-4">
                        {selectedSeats.length > 0 ? (
                          selectedSeats.map(seat => (
                            <div key={`passenger-${seat}`} className="p-4 border rounded-lg">
                              <h4 className="font-medium mb-3">Passenger for Seat {seat}</h4>
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <Label htmlFor={`first-name-${seat}`} className="block text-sm text-gray-600 mb-1">First Name</Label>
                                  <Input
                                    id={`first-name-${seat}`}
                                    type="text"
                                    className="w-full"
                                    placeholder="First name"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`last-name-${seat}`} className="block text-sm text-gray-600 mb-1">Last Name</Label>
                                  <Input
                                    id={`last-name-${seat}`}
                                    type="text"
                                    className="w-full"
                                    placeholder="Last name"
                                  />
                                </div>
                              </div>
                              <div className="mb-3">
                                <Label htmlFor={`email-${seat}`} className="block text-sm text-gray-600 mb-1">Email</Label>
                                <Input
                                  id={`email-${seat}`}
                                  type="email"
                                  className="w-full"
                                  placeholder="email@example.com"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`phone-${seat}`} className="block text-sm text-gray-600 mb-1">Phone</Label>
                                <Input
                                  id={`phone-${seat}`}
                                  type="tel"
                                  className="w-full"
                                  placeholder="+46 (123) 456-7890"
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 border border-dashed rounded-lg text-center text-gray-500">
                            Please select at least one seat to continue
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div className="bg-gray-50 p-6 rounded-lg border sticky top-4">
                    <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vehicle:</span>
                        <span className="font-medium">
                          {selectedVehicle === 'car' ? 'Sedan' : selectedVehicle === 'truck' ? 'SUV' : 'Bus'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup:</span>
                        <span className="font-medium">{pickup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dropoff:</span>
                        <span className="font-medium">{dropoff}</span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div>
                        <h3 className="font-medium mb-2">Selected Seats</h3>
                        {selectedSeats.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {selectedSeats.map(seat => (
                              <div key={`selected-${seat}`} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center">
                                Seat {seat} - ${getSeatPrice(seat).toFixed(2)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm mb-4">No seats selected</p>
                        )}
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Base Fare (x{selectedSeats.length}):</span>
                          <span>${calculateTotalPrice().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes & Fees:</span>
                          <span>${(calculateTotalPrice() * 0.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>${(calculateTotalPrice() * 1.1).toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full mt-6"
                        onClick={() => handleTabChange('payment')}
                        disabled={selectedSeats.length === 0}
                      >
                        {!isAuthenticated ? (
                          <>
                            <LogIn className="h-4 w-4 mr-1" />
                            Sign in to Continue
                          </>
                        ) : (
                          "Continue to Payment"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>



          <TabsContent value="payment">
            <Card className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Payment Information</h2>

                  <div className="bg-white p-6 rounded-lg border">
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">Payment Method</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div
                          className={`border rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition ${selectedPaymentMethod === 'credit_card' ? 'border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => setSelectedPaymentMethod('credit_card')}
                        >
                          <CreditCardIcon className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm">Credit Card</p>
                        </div>
                        <div
                          className={`border rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition ${selectedPaymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => setSelectedPaymentMethod('paypal')}
                        >
                          <div className="h-6 w-6 mx-auto mb-2 flex items-center justify-center">
                            <span className="text-lg font-bold text-blue-600">P</span>
                          </div>
                          <p className="text-sm">PayPal</p>
                        </div>
                        <div
                          className={`border rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition ${selectedPaymentMethod === 'apple_pay' ? 'border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => setSelectedPaymentMethod('apple_pay')}
                        >
                          <Apple className="h-6 w-6 mx-auto mb-2 text-gray-800" />
                          <p className="text-sm">Apple Pay</p>
                        </div>
                      </div>
                    </div>

                    {selectedPaymentMethod === 'credit_card' && (
                      <div>
                        <div className="mb-4">
                          <Label htmlFor="card-number" className="block text-gray-700 mb-2">Card Number</Label>
                          <Input
                            id="card-number"
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full"
                            placeholder="1234 5678 9012 3456"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label htmlFor="expiry-date" className="block text-gray-700 mb-2">Expiry Date</Label>
                            <div className="flex">
                              <Input
                                id="expiry-month"
                                type="text"
                                value={expiryMonth}
                                onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                                className="w-1/2 rounded-r-none"
                                placeholder="MM"
                              />
                              <div className="flex items-center justify-center px-2 border-t border-b border-gray-300">
                                /
                              </div>
                              <Input
                                id="expiry-year"
                                type="text"
                                value={expiryYear}
                                onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
                                className="w-1/2 rounded-l-none"
                                placeholder="YY"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="cvv" className="block text-gray-700 mb-2">CVV</Label>
                            <Input
                              id="cvv"
                              type="text"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              className="w-full"
                              placeholder="123"
                            />
                          </div>
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="cardholder-name" className="block text-gray-700 mb-2">Cardholder Name</Label>
                          <Input
                            id="cardholder-name"
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>
                    )}

                    {selectedPaymentMethod === 'paypal' && (
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <p className="mb-4">You will be redirected to PayPal to complete your payment</p>
                        <Button className="bg-blue-500 text-white">Pay with PayPal</Button>
                      </div>
                    )}

                    {selectedPaymentMethod === 'apple_pay' && (
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <p className="mb-4">Click the button below to pay with Apple Pay</p>
                        <Button className="bg-black text-white flex items-center justify-center mx-auto">
                          <Apple className="h-5 w-5 mr-2" />
                          Pay
                        </Button>
                      </div>
                    )}

                    <div className="mt-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="save-payment"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor="save-payment" className="ml-2">
                          Save this payment method for future bookings
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div className="bg-gray-50 p-6 rounded-lg border sticky top-4">
                    <h2 className="text-xl font-semibold mb-4">Final Booking Summary</h2>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vehicle:</span>
                        <span className="font-medium">
                          {selectedVehicle === 'car' ? 'Sedan' : selectedVehicle === 'truck' ? 'SUV' : 'Bus'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pickup:</span>
                        <span className="font-medium">{pickup}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Dropoff:</span>
                        <span className="font-medium">{dropoff}</span>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div>
                        <h3 className="font-medium mb-2">Passengers</h3>
                        <div className="space-y-2">
                          {selectedSeats.map((seat, index) => (
                            <div key={`summary-passenger-${seat}`} className="flex justify-between items-center">
                              <span>Seat {seat}:</span>
                              <span className="font-medium">Passenger {index + 1}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 my-3"></div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Base Fare:</span>
                          <span>${calculateTotalPrice().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes & Fees:</span>
                          <span>${(calculateTotalPrice() * 0.1).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>${(calculateTotalPrice() * 1.1).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            className="h-4 w-4 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="terms" className="ml-2">
                            I agree to the <a href="/terms" className="text-blue-500">Terms & Conditions</a> and <a href="/terms" className="text-blue-500">Privacy Policy</a>
                          </Label>
                        </div>
                      </div>

                      <Button
                        className="w-full mt-6 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast({
                              title: "Authentication Required",
                              description: "Please sign in to complete your booking",
                              variant: "default",
                            });
                            // Save current booking state in session storage
                            sessionStorage.setItem('pendingBooking', JSON.stringify({
                              vehicle: selectedVehicle,
                              date: selectedDate,
                              time: selectedTime,
                              seats: selectedSeats,
                              pickup,
                              dropoff
                            }));
                            // Redirect to sign in with return URL
                            navigate('/signin', { state: { from: location } });
                          } else {
                            navigate('/bookings/confirmation?bookingId=demo123');
                          }
                        }}
                        disabled={!agreeToTerms || selectedSeats.length === 0}
                      >
                        Confirm & Book Now
                      </Button>
                    </div>
                  </div>
                </div>
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
