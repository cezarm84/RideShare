/**
 * Geocoding Service - Provides geocoding functionality using OpenCage API
 * Converts addresses to coordinates and vice versa
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  formatted: string;
  components: {
    country?: string;
    county?: string;
    city?: string;
    postcode?: string;
    road?: string;
    house_number?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Default coordinates for Gothenburg, Sweden (used as fallback)
 */
const DEFAULT_COORDINATES = {
  lat: 57.70887,
  lng: 11.97456,
  formatted: "Gothenburg, Sweden",
  components: {
    country: "Sweden",
    city: "Gothenburg"
  }
};

/**
 * Geocode an address to coordinates using OpenCage API
 * @param address The address to geocode
 * @returns Promise with geocoding result or null if geocoding fails
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  if (!address || address.trim() === "") {
    console.warn("Empty address provided for geocoding");
    return null;
  }

  try {
    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;

    // Check if API key is available
    if (!apiKey) {
      console.warn('OpenCage API key not found in environment variables. Using default coordinates.');
      return DEFAULT_COORDINATES;
    }

    // Prepare the API URL
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}&limit=1`;

    // Make the API request
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText);
      return DEFAULT_COORDINATES;
    }

    const data = await response.json();

    // Check if we got any results
    if (data.total_results === 0 || !data.results || data.results.length === 0) {
      console.warn(`No geocoding results for: ${address}`);
      return DEFAULT_COORDINATES;
    }

    // Extract the first result
    const result = data.results[0];

    return {
      lat: result.geometry.lat,
      lng: result.geometry.lng,
      formatted: result.formatted,
      components: result.components || {}
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return DEFAULT_COORDINATES;
  }
};

/**
 * Reverse geocode coordinates to an address using OpenCage API
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise with geocoding result or null if reverse geocoding fails
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodingResult | null> => {
  try {
    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;

    // Check if API key is available
    if (!apiKey) {
      console.warn('OpenCage API key not found in environment variables. Using default coordinates.');
      return DEFAULT_COORDINATES;
    }

    // Prepare the API URL
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}&limit=1`;

    // Make the API request
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Reverse geocoding API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    // Check if we got any results
    if (data.total_results === 0 || !data.results || data.results.length === 0) {
      console.warn(`No reverse geocoding results for: ${lat}, ${lng}`);
      return null;
    }

    // Extract the first result
    const result = data.results[0];

    return {
      lat: result.geometry.lat,
      lng: result.geometry.lng,
      formatted: result.formatted,
      components: result.components || {}
    };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Get distance between two coordinates in kilometers
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};
