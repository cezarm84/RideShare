import React, { useState, useEffect } from 'react';

interface RandomTripInfoProps {
  startLocation: string;
  destination: string;
  date?: Date;
  isMobile?: boolean;
}

// Mock data for vehicle types (would come from database in real implementation)
const vehicleTypes = [
  { id: 1, name: 'Tesla Model 3', type: 'Electric Car', capacity: 4, image: '/images/vehicles/tesla.png' },
  { id: 2, name: 'Volvo XC60', type: 'SUV', capacity: 5, image: '/images/vehicles/volvo.png' },
  { id: 3, name: 'Toyota Prius', type: 'Hybrid', capacity: 4, image: '/images/vehicles/toyota.png' },
  { id: 4, name: 'Mercedes Sprinter', type: 'Minivan', capacity: 8, image: '/images/vehicles/mercedes.png' },
  { id: 5, name: 'BMW i3', type: 'Electric Car', capacity: 4, image: '/images/vehicles/bmw.png' },
  { id: 6, name: 'Volvo V90', type: 'Station Wagon', capacity: 5, image: '/images/vehicles/volvo-v90.png' },
  { id: 7, name: 'Volkswagen ID.4', type: 'Electric SUV', capacity: 5, image: '/images/vehicles/vw-id4.png' },
  { id: 8, name: 'Scania Citywide', type: 'Bus', capacity: 40, image: '/images/vehicles/scania-bus.png' },
];

// Mock data for weather conditions
const weatherConditions = [
  { condition: 'Sunny', temperature: '22°C', icon: '☀️' },
  { condition: 'Partly Cloudy', temperature: '18°C', icon: '⛅' },
  { condition: 'Cloudy', temperature: '16°C', icon: '☁️' },
  { condition: 'Light Rain', temperature: '15°C', icon: '🌦️' },
  { condition: 'Rainy', temperature: '12°C', icon: '🌧️' },
];

// Mock data for traffic conditions
const trafficConditions = [
  { status: 'Light', description: 'Traffic is flowing smoothly', color: 'green' },
  { status: 'Moderate', description: 'Some congestion, but moving steadily', color: 'yellow' },
  { status: 'Heavy', description: 'Significant delays expected', color: 'orange' },
];

const RandomTripInfo: React.FC<RandomTripInfoProps> = ({
  startLocation,
  destination,
  date,
  isMobile = false
}) => {
  const [randomVehicle, setRandomVehicle] = useState<typeof vehicleTypes[0] | null>(null);
  const [weather, setWeather] = useState<typeof weatherConditions[0] | null>(null);
  const [traffic, setTraffic] = useState<typeof trafficConditions[0] | null>(null);
  const [departureTime, setDepartureTime] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    // In a real implementation, this would fetch alternative rides from the database
    // based on the selected start location and destination

    // For now, we'll generate random data to simulate database results
    const vehicle = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
    const weatherInfo = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const trafficInfo = trafficConditions[Math.floor(Math.random() * trafficConditions.length)];

    // Generate departure and arrival times based on the selected date
    // In a real implementation, these would be actual scheduled times from the database
    const selectedDate = date || new Date();
    const departureHour = 7 + Math.floor(Math.random() * 12); // Between 7 AM and 7 PM
    const departureMinute = Math.floor(Math.random() * 60);
    const durationMinutes = Math.floor(Math.random() * 30) + 15;

    const departureDate = new Date(selectedDate);
    departureDate.setHours(departureHour, departureMinute, 0);
    const arrivalDate = new Date(departureDate.getTime() + durationMinutes * 60000);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Calculate price based on distance, vehicle type, and traffic conditions
    // In a real implementation, this would use actual pricing algorithms
    const basePrice = Math.floor(Math.random() * 50) + 50;
    const trafficMultiplier = trafficInfo.status === 'Light' ? 1 : trafficInfo.status === 'Moderate' ? 1.2 : 1.5;
    const vehicleMultiplier = vehicle.type === 'Bus' ? 0.8 : vehicle.type.includes('Electric') ? 1.1 : 1;
    const finalPrice = Math.round(basePrice * trafficMultiplier * vehicleMultiplier);

    setRandomVehicle(vehicle);
    setWeather(weatherInfo);
    setTraffic(trafficInfo);
    setDepartureTime(formatTime(departureDate));
    setArrivalTime(formatTime(arrivalDate));
    setPrice(finalPrice);
  }, [startLocation, destination, date]);

  if (!randomVehicle || !weather || !traffic) {
    return <div className="p-4">Loading trip information...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">Trip Information</h3>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {/* Route Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Route</h4>
            <div className="flex items-start">
              <div className="flex flex-col items-center mr-4">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="w-0.5 h-10 bg-gray-300 dark:bg-gray-600"></div>
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {startLocation}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Departure: {departureTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {destination}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Arrival: {arrivalTime}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Weather</h4>
            <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-3xl mr-3">{weather.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{weather.condition}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{weather.temperature}</p>
              </div>
            </div>
          </div>

          {/* Traffic Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Traffic</h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 bg-${traffic.color}-500`}
                ></div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{traffic.status} Traffic</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{traffic.description}</p>
            </div>
          </div>

          {/* Vehicle Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Suggested Vehicle</h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-lg">🚗</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{randomVehicle.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{randomVehicle.type} • {randomVehicle.capacity} seats</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Estimated Price</h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{price} kr</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Price may vary based on traffic and demand
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-brand-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Book This Trip
        </button>
      </div>
    </div>
  );
};

export default RandomTripInfo;
