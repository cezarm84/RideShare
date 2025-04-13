import React, { useState, useEffect } from 'react';
import PageMeta from '../../components/common/PageMeta';
import MapComponent from '../../components/Map/MapComponent';
import { getWeatherData, getDrivingAdvice } from '../../services/WeatherService';
import { getTrafficForRoute } from '../../services/TrafficService';

// Mock data for hubs with coordinates (would come from database in real implementation)
const hubs = [
  { id: '1', name: 'Central Hub', lat: 57.708870, lng: 11.974560 },
  { id: '2', name: 'North Hub', lat: 57.735180, lng: 11.989780 },
  { id: '3', name: 'East Hub', lat: 57.720890, lng: 12.025600 },
  { id: '4', name: 'South Hub', lat: 57.680950, lng: 11.986500 },
  { id: '5', name: 'West Hub', lat: 57.699440, lng: 11.918980 },
];

// Mock data for destinations with coordinates
const destinations = [
  { id: '1', name: 'Volvo Headquarters', lat: 57.720890, lng: 11.951940 },
  { id: '2', name: 'Ericsson Campus', lat: 57.706700, lng: 11.937800 },
  { id: '3', name: 'AstraZeneca R&D', lat: 57.741390, lng: 11.974560 },
  { id: '4', name: 'SKF Factory', lat: 57.722500, lng: 12.006700 },
  { id: '5', name: 'Lindholmen Science Park', lat: 57.706700, lng: 11.938600 },
  { id: '6', name: 'Chalmers University', lat: 57.689720, lng: 11.973890 },
  { id: '7', name: 'Gothenburg Central Station', lat: 57.708870, lng: 11.973330 },
  { id: '8', name: 'Liseberg Amusement Park', lat: 57.694440, lng: 11.991110 },
  // Add more real locations with accurate coordinates
  { id: '9', name: 'Sahlgrenska University Hospital', lat: 57.683590, lng: 11.960610 },
  { id: '10', name: 'Gothenburg Botanical Garden', lat: 57.681390, lng: 11.952780 },
  { id: '11', name: 'Universeum Science Center', lat: 57.696940, lng: 11.986670 },
];

// Mock data for weather conditions based on location and time of day
const weatherConditions = [
  // Daytime conditions
  { condition: 'Sunny', temperature: '22°C', icon: '☀️', description: 'Clear skies', timeOfDay: 'day' },
  { condition: 'Partly Cloudy', temperature: '18°C', icon: '⛅', description: 'Some clouds', timeOfDay: 'day' },
  { condition: 'Cloudy', temperature: '16°C', icon: '☁️', description: 'Overcast', timeOfDay: 'day' },
  { condition: 'Light Rain', temperature: '15°C', icon: '🌦️', description: 'Occasional showers', timeOfDay: 'day' },
  { condition: 'Rainy', temperature: '12°C', icon: '🌧️', description: 'Steady rain', timeOfDay: 'day' },

  // Nighttime conditions
  { condition: 'Clear Night', temperature: '10°C', icon: '🌙', description: 'Clear night sky', timeOfDay: 'night' },
  { condition: 'Partly Cloudy Night', temperature: '8°C', icon: '🌘', description: 'Some clouds', timeOfDay: 'night' },
  { condition: 'Cloudy Night', temperature: '7°C', icon: '☁️', description: 'Overcast', timeOfDay: 'night' },
  { condition: 'Light Rain Night', temperature: '6°C', icon: '🌧️', description: 'Light precipitation', timeOfDay: 'night' },
  { condition: 'Rainy Night', temperature: '5°C', icon: '🌧️', description: 'Steady rain', timeOfDay: 'night' },
];

// Mock data for traffic conditions based on routes
const trafficConditions = [
  { status: 'Light', description: 'Traffic is flowing smoothly', color: 'green', details: ['All routes clear', 'No delays reported'] },
  { status: 'Moderate', description: 'Some congestion, but moving steadily', color: 'yellow', details: ['Minor delays on E20', 'Construction on Älvsborgsbron'] },
  { status: 'Heavy', description: 'Significant delays expected', color: 'red', details: ['Major accident on E6', 'Heavy congestion in city center'] },
];

const Dashboard: React.FC = () => {
  const [selectedHub, setSelectedHub] = useState<string>('');
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [randomHub, setRandomHub] = useState<typeof hubs[0] | null>(null);
  const [randomDestination, setRandomDestination] = useState<typeof destinations[0] | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [traffic, setTraffic] = useState<typeof trafficConditions[0] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const generateRandomRide = () => {
    setIsLoading(true);

    // Use selected hub and destination if provided, otherwise use random values
    let hub;
    let destination;

    if (selectedHub) {
      // Use the selected hub
      hub = hubs.find(h => h.name === selectedHub) || hubs[Math.floor(Math.random() * hubs.length)];
    } else {
      // No hub selected, use a random one
      hub = hubs[Math.floor(Math.random() * hubs.length)];
    }

    if (selectedDestination) {
      // Use the selected destination
      destination = destinations.find(d => d.name === selectedDestination) ||
                   destinations[Math.floor(Math.random() * destinations.length)];
    } else {
      // No destination selected, use a random one that's different from the hub
      do {
        destination = destinations[Math.floor(Math.random() * destinations.length)];
      } while (destination.name === hub.name);
    }

    // Get traffic conditions based on route
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
    let trafficInfo;

    if (hub && destination) {
      trafficInfo = getTrafficForRoute(
        hub.lat,
        hub.lng,
        destination.lat,
        destination.lng,
        currentDate,
        currentTime
      );
      console.log('Traffic data for route:', trafficInfo);
    } else {
      // Fallback to random traffic if no hub or destination
      trafficInfo = trafficConditions[Math.floor(Math.random() * trafficConditions.length)];
    }

    // Fetch real weather data for the destination
    const fetchWeather = async (lat: number, lng: number) => {
      try {
        console.log('Fetching weather for coordinates:', lat, lng);
        // Ensure we have valid coordinates
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          console.error('Invalid coordinates:', lat, lng);
          return;
        }

        // Use fixed precision to avoid floating point issues
        const fixedLat = parseFloat(lat.toFixed(6));
        const fixedLng = parseFloat(lng.toFixed(6));

        const weatherData = await getWeatherData(fixedLat, fixedLng);
        console.log('Weather data received:', weatherData);
        setWeather(weatherData);
      } catch (error) {
        console.error('Error fetching weather:', error);
        // Weather will be set in the setTimeout below as fallback
      }
    };

    // Simulate API delay
    setTimeout(() => {
      setRandomHub(hub);
      setRandomDestination(destination);

      // Always fetch fresh weather data when generating a new ride
      if (destination) {
        console.log('Selected destination:', destination.name, destination.lat, destination.lng);
        fetchWeather(destination.lat, destination.lng);
      } else {
        console.warn('No destination selected for weather data');
      }

      setTraffic(trafficInfo);
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    // Generate initial random ride when component mounts
    generateRandomRide();
  }, []);

  // Separate useEffect to handle weather data updates
  useEffect(() => {
    // Immediately fetch weather when destination changes
    if (randomDestination) {
      console.log('Fetching weather for new destination:', randomDestination.name);
      const fetchWeather = async () => {
        try {
          const weatherData = await getWeatherData(randomDestination.lat, randomDestination.lng);
          console.log('Weather data received in useEffect:', weatherData);
          setWeather(weatherData);
        } catch (error) {
          console.error('Error fetching weather data in useEffect:', error);
        }
      };
      fetchWeather();

      // Set up a timer to refresh weather data every 10 minutes
      const weatherRefreshInterval = setInterval(() => {
        console.log('Refreshing weather data for:', randomDestination.name);
        fetchWeather();
      }, 10 * 60 * 1000); // 10 minutes

      return () => {
        clearInterval(weatherRefreshInterval);
      };
    }
  }, [randomDestination]);
  return (
    <>
      <PageMeta
        title="Dashboard | RideShare - Modern Ride-Sharing Platform"
        description="RideShare dashboard - Find and book rides, view your upcoming trips, and manage your account"
      />
      <div className="px-4 pt-6 pb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome to RideShare
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Find and book your next ride, or manage your existing bookings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Find a Ride</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Hub
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                >
                  <option value="">Select a hub</option>
                  {hubs.map(hub => (
                    <option key={hub.id} value={hub.name}>{hub.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Destination
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                >
                  <option value="">Select a destination</option>
                  {destinations.map(dest => (
                    <option key={dest.id} value={dest.name}>{dest.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent bg-brand-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                onClick={generateRandomRide}
                disabled={isLoading}
              >
                {isLoading ? 'Finding Rides...' : 'Find Rides'}
              </button>
            </form>
          </div>

          {/* Map Card */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Route Map</h3>
              {randomHub && randomDestination && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {randomHub.name} to {randomDestination.name}
                </p>
              )}
            </div>
            <div className="h-80 bg-gray-100 dark:bg-gray-700 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-gray-800 dark:to-gray-900 opacity-50"></div>
              <div className="relative z-10 h-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-2 mx-auto"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Finding the best route...
                      </p>
                    </div>
                  </div>
                ) : randomHub && randomDestination ? (
                  <MapComponent
                    startLat={randomHub.lat}
                    startLng={randomHub.lng}
                    startName={randomHub.name}
                    destLat={randomDestination.lat}
                    destLng={randomDestination.lng}
                    destName={randomDestination.name}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Loading route information...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Rides */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Upcoming Rides</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Central Hub → Volvo HQ</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tomorrow, 08:15</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      Confirmed
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">East Hub → Ericsson Campus</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Friday, 09:00</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                      Pending
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Weather Forecast</h3>
              {randomDestination && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  At {randomDestination.name}
                </p>
              )}
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-12 w-12"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ) : weather ? (
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-4xl mr-4">{weather.icon}</div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">{weather.condition}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{weather.temperature} • {weather.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getDrivingAdvice(weather.condition)}
                    </p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Humidity:</span> {weather.humidity}
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Wind:</span> {weather.windSpeed}
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Feels like:</span> {weather.feelsLike}
                      </div>
                    </div>
                  </div>
                </div>
              ) : randomDestination ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600 mr-2"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fetching real-time weather data...</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select a destination to see weather information</p>
                </div>
              )}
            </div>
          </div>

          {/* Traffic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Traffic Conditions</h3>
              {randomHub && randomDestination && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Route from {randomHub.name} to {randomDestination.name}
                </p>
              )}
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="animate-pulse space-y-2">
                    <div className="flex items-center">
                      <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-3 w-3 mr-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                    </div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-2"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                  </div>
                </div>
              ) : traffic ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 bg-${traffic.color}-500`}></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{traffic.status} Traffic</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {traffic.description}
                  </p>
                  {traffic.estimatedDelay && (
                    <div className="mt-2 mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Estimated delay: </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{traffic.estimatedDelay}</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {traffic.details && traffic.details.map((detail, index) => (
                      <p key={index}>• {detail}</p>
                    ))}
                  </div>
                </div>
              ) : randomHub && randomDestination ? (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600 mr-2"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Fetching real-time traffic data...</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Select a route to see traffic information</p>
                </div>
              )}
            </div>
          </div>

          {/* Environmental Impact */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Environmental Impact</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your contribution to a greener planet
              </p>
            </div>
            <div className="p-4">
              <div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">CO2 Reduction</h4>
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="text-2xl mr-3">🌱</div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">0.32 tons</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">CO2 saved this year</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mb-1">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">42% of your annual carbon footprint goal</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sustainable Transport */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Sustainable Transport</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your eco-friendly travel stats
              </p>
            </div>
            <div className="p-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Monthly Summary</h4>
                </div>
                <div className="flex items-center mb-3">
                  <div className="text-2xl mr-3">🌍</div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">42 trips</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sustainable journeys this month</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Car trips avoided:</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">28</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Km not driven:</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">386 km</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Fuel saved:</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">32.4 liters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ride Impact */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Ride Impact</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Emissions comparison by ride type
              </p>
            </div>
            <div className="p-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">CO2 Emissions</h4>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Solo driving</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">2.8 kg CO2</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">2 person carpool</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">1.4 kg CO2</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">RideShare (4 people)</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">0.7 kg CO2</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ride Matching System */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow md:col-span-3">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">How Our Matching System Works</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Intelligent ride matching for optimal carpooling
                </p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 dark:text-blue-300 text-lg">1</span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Route Analysis</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    We analyze your route and find overlapping journeys with other users
                  </p>

                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 dark:text-green-300 text-lg">2</span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Schedule Matching</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    We match users with similar schedules and departure times
                  </p>

                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 dark:text-purple-300 text-lg">3</span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Preference Optimization</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    We consider your preferences for vehicle type, music, and conversation
                  </p>

                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-red-600 dark:text-red-300 text-lg">4</span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Smart Suggestions</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    We suggest the most efficient matches to maximize savings and minimize detours
                  </p>

                </div>
              </div>

              <div className="mt-4 p-3 bg-brand-50 dark:bg-gray-700 rounded-lg border border-brand-200 dark:border-gray-600">
                <div className="flex items-start">
                  <div className="text-2xl mr-3">💡</div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Did you know?</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Our matching algorithm has helped users save an average of 850 kr per month on transportation costs while reducing their carbon footprint by up to 45%.
                    </p>

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Growth Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow md:col-span-3">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">RideShare Growth</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Our community is growing steadily
              </p>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Active Users</h4>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">+12%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">1,458</p>
                  <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                    </svg>
                    156 new users this month
                  </div>

                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Completed Rides</h4>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">+18%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">3,892</p>
                  <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                    </svg>
                    245 rides this week
                  </div>

                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Enterprise Partners</h4>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">+8%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
                  <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3 h-3 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd"></path>
                    </svg>
                    2 new partners this quarter
                  </div>

                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Monthly Active Users</h4>
                </div>
                <div className="h-24 flex items-end space-x-2">
                  {[15, 22, 28, 35, 42, 48, 55, 62, 68, 75, 82, 90].map((height, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-brand-500 dark:bg-brand-400 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  <span>Growth trend shows consistent increase in user adoption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
