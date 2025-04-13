/**
 * Weather Service - Provides both real and mock weather data
 * Real data is fetched from OpenWeatherMap API
 * Mock data is used as fallback or for testing
 */

export interface WeatherData {
  condition: string;
  temperature: string;
  icon: string;
  description: string;
  windSpeed: string;
  humidity: string;
  feelsLike: string;
}

// Weather conditions with more variety
const weatherConditions = [
  {
    condition: 'Sunny',
    icons: ['☀️'],
    descriptions: ['Clear skies', 'Not a cloud in sight', 'Bright and clear'],
    tempRange: [18, 28]
  },
  {
    condition: 'Partly Cloudy',
    icons: ['⛅', '🌤️'],
    descriptions: ['Some clouds', 'Scattered clouds', 'Mostly sunny'],
    tempRange: [15, 25]
  },
  {
    condition: 'Cloudy',
    icons: ['☁️'],
    descriptions: ['Overcast', 'Gray skies', 'Cloudy conditions'],
    tempRange: [12, 22]
  },
  {
    condition: 'Light Rain',
    icons: ['🌦️', '🌧️'],
    descriptions: ['Occasional showers', 'Light precipitation', 'Drizzle'],
    tempRange: [10, 18]
  },
  {
    condition: 'Rainy',
    icons: ['🌧️', '⛈️'],
    descriptions: ['Steady rain', 'Showers', 'Wet conditions'],
    tempRange: [8, 15]
  },
  {
    condition: 'Thunderstorm',
    icons: ['⛈️', '🌩️'],
    descriptions: ['Thunder and lightning', 'Stormy conditions', 'Heavy rain with thunder'],
    tempRange: [10, 20]
  },
  {
    condition: 'Snowy',
    icons: ['❄️', '🌨️'],
    descriptions: ['Light snowfall', 'Snowy conditions', 'Winter weather'],
    tempRange: [-5, 2]
  },
  {
    condition: 'Foggy',
    icons: ['🌫️'],
    descriptions: ['Reduced visibility', 'Misty conditions', 'Fog patches'],
    tempRange: [5, 15]
  }
];

/**
 * Get mock weather based on location, date and time
 * Used for testing or as fallback when API is unavailable
 */
export const getMockWeatherData = (
  lat: number,
  lng: number,
  date?: string
): WeatherData => {
  // In a real implementation, this would call a weather API
  // For now, we'll generate realistic weather based on coordinates and date

  // Use coordinates to seed the random generator for location-based consistency
  const locationSeed = Math.abs(lat * 1000 + lng * 1000) % 100;

  // Use date to adjust weather (more likely to be warm in summer, cold in winter)
  const dateObj = new Date(date);
  const month = dateObj.getMonth(); // 0-11

  // Adjust weather probability based on season (Northern Hemisphere)
  let weatherIndex;

  if (month >= 5 && month <= 8) {
    // Summer months (June-September): More likely sunny/warm
    weatherIndex = Math.floor((locationSeed + dateObj.getDate()) % 100) % 5;
  } else if (month >= 11 || month <= 2) {
    // Winter months (December-March): More likely cold/snowy
    weatherIndex = Math.floor((locationSeed + dateObj.getDate()) % 100) % weatherConditions.length;
    if (weatherIndex < 3) weatherIndex += 4; // Bias toward colder weather
  } else {
    // Spring/Fall: More variable
    weatherIndex = Math.floor((locationSeed + dateObj.getDate()) % 100) % weatherConditions.length;
  }

  const weather = weatherConditions[weatherIndex];

  // Generate temperature based on weather condition and season
  const baseTemp = weather.tempRange[0] + (weather.tempRange[1] - weather.tempRange[0]) * (locationSeed % 100) / 100;

  // Adjust for season: +5 in summer, -5 in winter
  let seasonalAdjustment = 0;
  if (month >= 5 && month <= 8) seasonalAdjustment = 5;
  if (month >= 11 || month <= 2) seasonalAdjustment = -5;

  const temperature = Math.round(baseTemp + seasonalAdjustment);

  // Select a random icon and description from the options
  const iconIndex = Math.floor((locationSeed + dateObj.getDate()) % weather.icons.length);
  const descIndex = Math.floor((locationSeed + dateObj.getDate() + 1) % weather.descriptions.length);

  // Generate wind speed (0-20 km/h)
  const windSpeed = Math.floor((locationSeed + dateObj.getDate() + 2) % 20) + ' km/h';

  // Generate humidity (30-90%)
  const humidity = Math.floor(30 + (locationSeed + dateObj.getDate() + 3) % 60) + '%';

  // Calculate "feels like" temperature
  const feelsLike = Math.round(temperature + (Math.random() * 4 - 2));

  return {
    condition: weather.condition,
    temperature: `${temperature}°C`,
    icon: weather.icons[iconIndex],
    description: weather.descriptions[descIndex],
    windSpeed,
    humidity,
    feelsLike: `${feelsLike}°C`,
  };
};

/**
 * OpenWeatherMap icon mapping to emoji icons
 */
const weatherIconMap: Record<string, string> = {
  '01d': '☀️', // clear sky day
  '01n': '🌙', // clear sky night
  '02d': '⛅', // few clouds day
  '02n': '☁️', // few clouds night
  '03d': '☁️', // scattered clouds day
  '03n': '☁️', // scattered clouds night
  '04d': '☁️', // broken clouds day
  '04n': '☁️', // broken clouds night
  '09d': '🌧️', // shower rain day
  '09n': '🌧️', // shower rain night
  '10d': '🌦️', // rain day
  '10n': '🌧️', // rain night
  '11d': '⛈️', // thunderstorm day
  '11n': '⛈️', // thunderstorm night
  '13d': '❄️', // snow day
  '13n': '❄️', // snow night
  '50d': '🌫️', // mist day
  '50n': '🌫️', // mist night
};

/**
 * Map OpenWeatherMap condition codes to readable conditions
 */
const mapWeatherCondition = (id: number): string => {
  if (id >= 200 && id < 300) return 'Thunderstorm';
  if (id >= 300 && id < 400) return 'Drizzle';
  if (id >= 500 && id < 600) return 'Rainy';
  if (id >= 600 && id < 700) return 'Snowy';
  if (id >= 700 && id < 800) return 'Foggy';
  if (id === 800) return 'Clear';
  if (id > 800) return 'Cloudy';
  return 'Unknown';
};

/**
 * Get driving advice based on weather condition
 */
export const getDrivingAdvice = (condition: string): string => {
  switch (condition) {
    case 'Clear':
      return 'Perfect conditions for your commute';
    case 'Cloudy':
      return 'Good visibility for driving';
    case 'Partly Cloudy':
      return 'Good conditions for travel';
    case 'Rainy':
    case 'Drizzle':
      return 'Drive with caution, roads may be slippery';
    case 'Thunderstorm':
      return 'Consider delaying travel if possible';
    case 'Snowy':
      return 'Reduced visibility and slippery roads, drive carefully';
    case 'Foggy':
      return 'Reduced visibility, use fog lights and drive slowly';
    default:
      return 'Check local conditions before driving';
  }
};

/**
 * Fetch real weather data from our backend API
 * The backend will handle the OpenWeatherMap API call
 */
export const fetchWeatherData = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    // Get API key and URL from environment variables
    const apiKey = import.meta.env.VITE_OPENWEATHERMAP_API_KEY;
    const apiUrl = import.meta.env.VITE_OPENWEATHERMAP_API_URL || 'https://api.openweathermap.org/data/2.5';

    console.log('API Key available:', !!apiKey);

    // Check if API key is available
    if (!apiKey) {
      console.warn('OpenWeatherMap API key not found in environment variables. Using mock data.');
      return getMockWeatherData(lat, lng);
    }

    // Call OpenWeatherMap API directly
    const url = `${apiUrl}/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`;
    console.log('Calling OpenWeatherMap API:', url.replace(apiKey, 'API_KEY_HIDDEN'));

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Weather API error:', response.status, response.statusText);
      return getMockWeatherData(lat, lng); // Fallback to mock data
    }

    const data = await response.json();
    console.log('Raw weather data:', data);

    // Parse the response from OpenWeatherMap
    const condition = mapWeatherCondition(data.weather[0].id);
    const temperature = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const windSpeed = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
    const iconCode = data.weather[0].icon;
    const description = data.weather[0].description;

    const weatherData = {
      condition,
      temperature: `${temperature}°C`,
      icon: weatherIconMap[iconCode] || '🌡️',
      description,
      feelsLike: `${feelsLike}°C`,
      humidity: `${humidity}%`,
      windSpeed: `${windSpeed} km/h`
    };

    console.log('Processed weather data:', weatherData);
    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return getMockWeatherData(lat, lng); // Fallback to mock data
  }
};

/**
 * Get weather data - tries to fetch real data first, falls back to mock data
 */
export const getWeatherData = async (lat: number, lng: number): Promise<WeatherData> => {
  try {
    console.log(`Getting weather data for coordinates: ${lat}, ${lng}`);
    // Check if we have valid coordinates
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error(`Invalid coordinates: ${lat}, ${lng}`);
    }

    // Try to get real weather data
    return await fetchWeatherData(lat, lng);
  } catch (error) {
    console.error('Falling back to mock weather data:', error);
    return getMockWeatherData(lat, lng);
  }
};
