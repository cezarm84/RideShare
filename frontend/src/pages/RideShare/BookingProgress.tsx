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
import api from '@/services/api';

// Vehicle Type interface
interface VehicleType {
  id: number;
  name: string;
  description?: string;
  capacity: number;
  is_active: boolean;
  price_factor: number;
}

// Hub interface
interface Hub {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

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
  const [pickup, setPickup] = useState('Göteborg Central Station');
  const [dropoff, setDropoff] = useState('Lindholmen Science Park');
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

  // Real data from API
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch reference data on component mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const response = await api.get('/reference-data/ride-reference-data');
        console.log('Reference data:', response.data);

        setVehicleTypes(response.data.vehicle_types || []);
        setHubs(response.data.hubs || []);

        // Set default pickup/dropoff from hubs if available
        if (response.data.hubs && response.data.hubs.length > 0) {
          const brunnsparken = response.data.hubs.find((hub: Hub) =>
            hub.name.toLowerCase().includes('brunnsparken')
          );
          const lindholmen = response.data.hubs.find((hub: Hub) =>
            hub.name.toLowerCase().includes('lindholmen')
          );

          if (brunnsparken) setPickup(brunnsparken.name);
          if (lindholmen) setDropoff(lindholmen.name);
        }
      } catch (error) {
        console.error('Error fetching reference data:', error);
        // Fallback to default vehicle types if API fails
        setVehicleTypes([
          { id: 1, name: 'Sedan', description: 'Standard car', capacity: 4, is_active: true, price_factor: 1.0 },
          { id: 2, name: 'Van', description: 'Medium capacity vehicle', capacity: 6, is_active: true, price_factor: 1.2 },
          { id: 3, name: 'Bus', description: 'Large capacity vehicle', capacity: 40, is_active: true, price_factor: 0.8 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchReferenceData();
  }, []);

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
    const selectedVehicleType = vehicleTypes.find(vt => vt.name.toLowerCase() === selectedVehicle);

    // Base price calculation based on vehicle type and capacity
    let basePrice = 150; // Default base price in SEK

    if (selectedVehicleType) {
      // Price based on capacity and price factor from database
      const capacityFactor = selectedVehicleType.capacity <= 4 ? 1.2 :
                            selectedVehicleType.capacity <= 8 ? 1.0 : 0.6;
      basePrice = Math.round(150 * selectedVehicleType.price_factor * capacityFactor);
    }

    // Seat position premium/discount
    let seatMultiplier = 1.0;

    switch (selectedVehicle) {
      case 'bus':
        // Window seats (positions 1 and 4 in each row of 4) cost more
        if (seatNum % 4 === 1 || seatNum % 4 === 0) {
          seatMultiplier = 1.15; // 15% premium for window seats
        } else {
          seatMultiplier = 1.0; // Standard price for aisle seats
        }
        break;
      case 'sedan':
      case 'car':
        // Front seats cost more due to better view and comfort
        if (seatNum <= 2) {
          seatMultiplier = 1.1; // 10% premium for front seats
        } else {
          seatMultiplier = 0.95; // 5% discount for back seats
        }
        break;
      case 'van':
        // Front row costs more, middle row standard, back row slightly less
        if (seatNum <= 2) {
          seatMultiplier = 1.1; // 10% premium for front row
        } else if (seatNum <= 4) {
          seatMultiplier = 1.0; // Standard price for middle row
        } else {
          seatMultiplier = 0.95; // 5% discount for back row
        }
        break;
      default:
        seatMultiplier = 1.0;
    }

    return Math.round(basePrice * seatMultiplier);
  };

  const calculateTotalPrice = () => {
    return selectedSeats.reduce((total, seatId) => {
      return total + getSeatPrice(seatId);
    }, 0);
  };

  // Helper function to format currency in SEK
  const formatSEK = (amount: number) => {
    return `${Math.round(amount)} SEK`;
  };

  // Get base price for a vehicle type (used for estimates)
  const getBasePrice = (vehicleTypeName: string) => {
    const vehicleType = vehicleTypes.find(vt => vt.name.toLowerCase() === vehicleTypeName.toLowerCase());
    if (vehicleType) {
      const capacityFactor = vehicleType.capacity <= 4 ? 1.2 :
                            vehicleType.capacity <= 8 ? 1.0 : 0.6;
      return Math.round(150 * vehicleType.price_factor * capacityFactor);
    }
    return 150; // Default base price
  };

  // Calculate real distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Get route information based on selected pickup and dropoff
  const getRouteInfo = () => {
    if (!pickup || !dropoff) {
      return null;
    }

    const pickupHub = hubs.find(hub => hub.name === pickup);
    const dropoffHub = hubs.find(hub => hub.name === dropoff);

    if (!pickupHub || !dropoffHub || !pickupHub.latitude || !pickupHub.longitude || !dropoffHub.latitude || !dropoffHub.longitude) {
      return {
        distance: 'N/A',
        time: 'N/A',
        route: 'Route information not available'
      };
    }

    const distance = calculateDistance(
      pickupHub.latitude,
      pickupHub.longitude,
      dropoffHub.latitude,
      dropoffHub.longitude
    );

    // Estimate travel time (assuming average speed of 30 km/h in city traffic)
    const estimatedTime = Math.round((distance / 30) * 60); // in minutes

    // Generate route description based on actual hub locations
    const getRouteDescription = (from: string, to: string) => {
      const routes: { [key: string]: string } = {
        'Brunnsparken Hub-Lindholmen Hub': 'via Göta älvbron and Lindholmsallén',
        'Lindholmen Hub-Brunnsparken Hub': 'via Lindholmsallén and Göta älvbron',
        'Brunnsparken Hub-Frölunda Torg Hub': 'via Kungsportsavenyn and Frölundavägen',
        'Frölunda Torg Hub-Brunnsparken Hub': 'via Frölundavägen and Kungsportsavenyn',
        'Brunnsparken Hub-Angered Centrum Hub': 'via Göteborgsvägen and Angeredsbron',
        'Angered Centrum Hub-Brunnsparken Hub': 'via Angeredsbron and Göteborgsvägen',
        'Lindholmen Hub-Frölunda Torg Hub': 'via Göta älvbron and Frölundavägen',
        'Frölunda Torg Hub-Lindholmen Hub': 'via Frölundavägen and Göta älvbron',
        'Brunnsparken Hub-Korsvägen Hub': 'via Kungsportsavenyn',
        'Korsvägen Hub-Brunnsparken Hub': 'via Kungsportsavenyn',
        'Brunnsparken Hub-Backaplan Hub': 'via Göteborgsvägen',
        'Backaplan Hub-Brunnsparken Hub': 'via Göteborgsvägen',
        'Brunnsparken Hub-Mölndal Centrum Hub': 'via E6/E20 motorway',
        'Mölndal Centrum Hub-Brunnsparken Hub': 'via E6/E20 motorway',
        'Brunnsparken Hub-Partille Centrum Hub': 'via Göteborgsvägen and Route 190',
        'Partille Centrum Hub-Brunnsparken Hub': 'via Route 190 and Göteborgsvägen',
      };

      const routeKey = `${from}-${to}`;
      return routes[routeKey] || 'via city center roads';
    };

    return {
      distance: `${distance.toFixed(1)} km`,
      time: `${estimatedTime} minutes`,
      route: getRouteDescription(pickup, dropoff)
    };
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
        // 10 rows of 4 seats (2 on each side with aisle)
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
      case 'van':
        // 3 rows of 2 seats each (6 seats total)
        return [
          ['1', '2'],
          ['3', '4'],
          ['5', '6'],
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
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-500 mt-2">Loading vehicle types...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {vehicleTypes.filter(vt => vt.is_active).map((vehicleType) => {
                          const isSelected = selectedVehicle === vehicleType.name.toLowerCase();
                          const getIcon = (name: string) => {
                            const lowerName = name.toLowerCase();
                            if (lowerName.includes('car') || lowerName.includes('sedan')) return <Car className="h-8 w-8 mx-auto mb-2 text-blue-500" />;
                            if (lowerName.includes('van') || lowerName.includes('truck')) return <Truck className="h-8 w-8 mx-auto mb-2 text-blue-500" />;
                            if (lowerName.includes('bus')) return <Bus className="h-8 w-8 mx-auto mb-2 text-blue-500" />;
                            return <Car className="h-8 w-8 mx-auto mb-2 text-blue-500" />;
                          };

                          const getPriceRange = (capacity: number, priceFactor: number) => {
                            // Base price in SEK based on Swedish transport market
                            const basePrice = capacity <= 4 ? 180 : capacity <= 8 ? 150 : 90;
                            const capacityFactor = capacity <= 4 ? 1.2 : capacity <= 8 ? 1.0 : 0.6;
                            const adjustedPrice = Math.round(basePrice * priceFactor * capacityFactor);

                            // Price range with seat position variations
                            const minPrice = Math.round(adjustedPrice * 0.95); // Discount seats
                            const maxPrice = Math.round(adjustedPrice * 1.15); // Premium seats
                            return `${minPrice}-${maxPrice} SEK`;
                          };

                          return (
                            <div
                              key={vehicleType.id}
                              className={`border rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}
                              onClick={() => setSelectedVehicle(vehicleType.name.toLowerCase())}
                            >
                              {getIcon(vehicleType.name)}
                              <p className="font-medium">{vehicleType.name}</p>
                              <p className="text-sm text-gray-600">Up to {vehicleType.capacity} passengers</p>
                              <p className="text-sm font-semibold mt-2">{getPriceRange(vehicleType.capacity, vehicleType.price_factor)}</p>
                              {vehicleType.description && (
                                <p className="text-xs text-gray-500 mt-1">{vehicleType.description}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Date Selection */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Select Date</h2>
                    <div className="bg-background p-4 rounded-lg border border-border">
                      <div className="flex justify-between items-center mb-4">
                        <button
                          onClick={getPreviousMonth}
                          className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                          <ChevronLeft className="h-5 w-5 text-foreground" />
                        </button>
                        <h3 className="font-semibold text-foreground">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={getNextMonth}
                          className="p-2 rounded-full hover:bg-muted transition-colors"
                        >
                          <ChevronRight className="h-5 w-5 text-foreground" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="font-medium text-sm py-2 text-muted-foreground">{day}</div>
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
                              className={`h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-colors text-sm
                                ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                                ${isCurrentDay && !isSelected ? 'border border-primary text-primary' : ''}
                                ${isPast ? 'text-muted-foreground cursor-not-allowed' : !isSelected ? 'text-foreground hover:bg-muted' : ''}
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
                          className={`border border-border rounded-lg p-2 text-center cursor-pointer transition-colors text-sm
                            ${selectedTime === time ? 'bg-primary text-primary-foreground border-primary' : 'text-foreground hover:bg-muted'}
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
                            <div className="mb-4">
                              <div className="flex items-center justify-center mb-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                <span className="text-sm font-medium text-green-700">{pickup}</span>
                              </div>
                              <div className="flex justify-center">
                                <div className="w-px h-8 bg-gray-300"></div>
                              </div>
                              <div className="flex items-center justify-center mt-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                                <span className="text-sm font-medium text-red-700">{dropoff}</span>
                              </div>
                            </div>
                            {(() => {
                              const routeInfo = getRouteInfo();
                              if (routeInfo) {
                                return (
                                  <>
                                    <p className="text-sm">
                                      Distance: {routeInfo.distance} | Estimated time: {routeInfo.time}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      Route {routeInfo.route}
                                    </p>
                                  </>
                                );
                              }
                              return (
                                <p className="text-sm text-gray-400">
                                  Calculating route information...
                                </p>
                              );
                            })()}
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
                        <div className="flex-1">
                          <Label htmlFor="pickup" className="text-sm font-medium mb-1 block">
                            Pickup Location
                          </Label>
                          <select
                            id="pickup"
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select pickup location</option>
                            {hubs.map((hub) => (
                              <option key={hub.id} value={hub.name}>
                                {hub.name} - {hub.city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                          <Flag className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="dropoff" className="text-sm font-medium mb-1 block">
                            Dropoff Location
                          </Label>
                          <select
                            id="dropoff"
                            value={dropoff}
                            onChange={(e) => setDropoff(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select dropoff location</option>
                            {hubs.map((hub) => (
                              <option key={hub.id} value={hub.name}>
                                {hub.name} - {hub.city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ride Summary */}
                  <div className="bg-muted/50 p-4 rounded-lg border border-border">
                    <h2 className="text-xl font-semibold mb-4">Ride Summary</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span className="font-medium text-foreground">
                          {vehicleTypes.find(vt => vt.name.toLowerCase() === selectedVehicle)?.name || 'Not selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium text-foreground">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium text-foreground">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pickup:</span>
                        <span className="font-medium text-foreground">{pickup || 'Not selected'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dropoff:</span>
                        <span className="font-medium text-foreground">{dropoff || 'Not selected'}</span>
                      </div>
                      <div className="border-t border-border my-2"></div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Estimated Price:</span>
                        <span>{formatSEK(getBasePrice(selectedVehicle))}</span>
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
                                title={`Seat ${seat} - ${formatSEK(getSeatPrice(seat))}`}
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
                          {vehicleTypes.find(vt => vt.name.toLowerCase() === selectedVehicle)?.name || 'Not selected'}
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
                                Seat {seat} - {formatSEK(getSeatPrice(seat))}
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
                          <span>{formatSEK(calculateTotalPrice())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes & Fees (25% VAT):</span>
                          <span>{formatSEK(calculateTotalPrice() * 0.25)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>{formatSEK(calculateTotalPrice() * 1.25)}</span>
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
                      <div className="grid grid-cols-4 gap-3">
                        <div
                          className={`border rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition ${selectedPaymentMethod === 'credit_card' ? 'border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => setSelectedPaymentMethod('credit_card')}
                        >
                          <CreditCardIcon className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                          <p className="text-sm">Credit Card</p>
                        </div>
                        <div
                          className={`border rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition ${selectedPaymentMethod === 'swish' ? 'border-blue-500 bg-blue-50' : ''}`}
                          onClick={() => setSelectedPaymentMethod('swish')}
                        >
                          <div className="h-6 w-6 mx-auto mb-2 flex items-center justify-center bg-pink-500 rounded text-white font-bold text-xs">
                            S
                          </div>
                          <p className="text-sm">Swish</p>
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

                    {selectedPaymentMethod === 'swish' && (
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <div className="text-center mb-4">
                          <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center bg-pink-500 rounded-full text-white font-bold text-lg">
                            S
                          </div>
                          <h4 className="font-medium text-pink-800 mb-2">Pay with Swish</h4>
                          <p className="text-sm text-pink-700 mb-4">
                            Enter your phone number to receive a Swish payment request
                          </p>
                        </div>
                        <div className="mb-4">
                          <Label htmlFor="swish-phone" className="block text-pink-700 mb-2">Phone Number</Label>
                          <Input
                            id="swish-phone"
                            type="tel"
                            placeholder="+46 70 123 45 67"
                            className="w-full border-pink-300 focus:border-pink-500 focus:ring-pink-500"
                          />
                        </div>
                        <div className="text-center">
                          <Button className="bg-pink-500 hover:bg-pink-600 text-white w-full">
                            Send Swish Request
                          </Button>
                          <p className="text-xs text-pink-600 mt-2">
                            You will receive a push notification in your Swish app
                          </p>
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
                          {vehicleTypes.find(vt => vt.name.toLowerCase() === selectedVehicle)?.name || 'Not selected'}
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
                          <span>{formatSEK(calculateTotalPrice())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxes & Fees (25% VAT):</span>
                          <span>{formatSEK(calculateTotalPrice() * 0.25)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>{formatSEK(calculateTotalPrice() * 1.25)}</span>
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
