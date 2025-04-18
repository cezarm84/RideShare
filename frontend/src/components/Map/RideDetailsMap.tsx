import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Ride } from '@/components/RideSearch/RideList';
// No external services needed

interface RideDetailsMapProps {
  selectedRide: Ride | null;
}

// No interfaces needed

const RideDetailsMap: React.FC<RideDetailsMapProps> = ({ selectedRide }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fix Leaflet icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    // Clean up function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!selectedRide || !mapContainerRef.current) return;

    setIsLoading(true);

    // Handle different property naming conventions and ensure properties exist
    const startingHubName = selectedRide.startingHub?.name || selectedRide.starting_hub?.name || 'Unknown';
    const destinationHubName = selectedRide.destinationHub?.name || selectedRide.destination_hub?.name || 'Unknown';

    // Log the hub names for debugging
    console.log(`Rendering map for ride: ${startingHubName} → ${destinationHubName}`);

    // If either hub name is missing or Unknown, don't proceed with map rendering
    if (startingHubName === 'Unknown' && destinationHubName === 'Unknown') {
      console.warn('Both starting and destination hubs are unknown. Skipping map rendering.');
      setIsLoading(false);
      return;
    }

    // Get coordinates for the starting hub and destination hub
    const startCoords = getCoordinates(startingHubName);
    const destCoords = getCoordinates(destinationHubName);

    const startLat = startCoords.lat;
    const startLng = startCoords.lng;
    const destLat = destCoords.lat;
    const destLng = destCoords.lng;

    // Log the coordinates for debugging
    console.log(`Start coordinates: ${startLat}, ${startLng}`);
    console.log(`Destination coordinates: ${destLat}, ${destLng}`);

    // Calculate center point and appropriate zoom level
    const centerLat = (startLat + destLat) / 2;
    const centerLng = (startLng + destLng) / 2;

    // Calculate distance to determine zoom level
    const distance = Math.sqrt(
      Math.pow(startLat - destLat, 2) + Math.pow(startLng - destLng, 2)
    );
    const zoom = distance < 0.01 ? 14 : distance < 0.05 ? 13 : 12;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([centerLat, centerLng], zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    } else {
      // Update view if map already exists
      mapRef.current.setView([centerLat, centerLng], zoom);
    }

    // Clear existing layers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add markers
    const startMarker = L.marker([startLat, startLng]).addTo(mapRef.current);
    startMarker.bindPopup(`<b>Start:</b> ${startingHubName}`);

    const destMarker = L.marker([destLat, destLng]).addTo(mapRef.current);
    destMarker.bindPopup(`<b>Destination:</b> ${destinationHubName}`);

    // Generate a realistic route with multiple waypoints
    const generateRealisticRoute = () => {
      // Calculate the direct distance
      const directDistance = Math.sqrt(
        Math.pow(startLat - destLat, 2) + Math.pow(startLng - destLng, 2)
      );

      // Number of waypoints based on distance
      const numWaypoints = Math.max(5, Math.ceil(directDistance * 100));

      // Generate waypoints
      const waypoints = [[startLat, startLng]];

      // Direction vector
      const dirX = destLng - startLng;
      const dirY = destLat - startLat;

      // Check if we have a valid direction vector (not zero length)
      const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
      if (dirLength < 0.0001) {
        // If start and end are too close, just return a direct line
        return [[startLat, startLng], [destLat, destLng]];
      }

      // Add some randomness to the route
      for (let i = 1; i < numWaypoints; i++) {
        const t = i / numWaypoints;

        // Add some random deviation
        const deviation = 0.005 * Math.sin(i * Math.PI / (numWaypoints / 3));
        const perpX = -dirY;
        const perpY = dirX;
        const len = Math.sqrt(perpX * perpX + perpY * perpY);

        // Avoid division by zero
        if (len > 0) {
          const lat = startLat + dirY * t + (perpY / len) * deviation;
          const lng = startLng + dirX * t + (perpX / len) * deviation;
          waypoints.push([lat, lng]);
        } else {
          // If we can't calculate perpendicular, just interpolate directly
          const lat = startLat + dirY * t;
          const lng = startLng + dirX * t;
          waypoints.push([lat, lng]);
        }
      }

      // Add destination
      waypoints.push([destLat, destLng]);

      return waypoints;
    };

    // Generate the route
    const routeWaypoints = generateRealisticRoute();

    // Draw the main route
    const mainRoute = L.polyline(routeWaypoints, {
      color: '#10B981', // emerald-500
      weight: 5,
      opacity: 0.9
    }).addTo(mapRef.current);

    // Add direction arrow markers along the route
    // Only add arrows if we have enough waypoints
    if (routeWaypoints.length > 2) {
      // Calculate how many arrows to add (max 5)
      const numArrows = Math.min(5, Math.floor(routeWaypoints.length / 2));
      const step = Math.floor(routeWaypoints.length / (numArrows + 1));

      for (let i = step; i < routeWaypoints.length - step; i += step) {
        // Make sure we have valid indices
        if (i >= 0 && i < routeWaypoints.length - 1) {
          const p1 = routeWaypoints[i];
          const p2 = routeWaypoints[i + 1];

          // Make sure both points are valid
          if (p1 && p2 && p1.length === 2 && p2.length === 2) {
            // Calculate angle for the arrow
            const dx = p2[1] - p1[1];
            const dy = p2[0] - p1[0];
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            // Create a custom arrow icon
            const arrowIcon = L.divIcon({
              html: `<div style="transform: rotate(${angle}deg); font-size: 16px;">➤</div>`,
              className: 'arrow-icon',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            // Add the arrow marker
            L.marker([p1[0], p1[1]], { icon: arrowIcon }).addTo(mapRef.current);
          }
        }
      }
    }

    // Add a route outline for visual effect
    const routeOutline = L.polyline(routeWaypoints, {
      color: '#000000',
      weight: 8,
      opacity: 0.2,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(mapRef.current);

    // Make sure the route outline is behind the main route
    routeOutline.bringToBack();
    mainRoute.bringToFront();

    // No external data fetching needed

    // Finish loading
    setIsLoading(false);

    // Return cleanup function
    return () => {
      // Clean up map markers and layers when component unmounts or selectedRide changes
      if (mapRef.current) {
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapRef.current?.removeLayer(layer);
          }
        });
      }
    };
  }, [selectedRide]);

  // Helper function to get coordinates for a location
  const getCoordinates = (locationName: string) => {
    // This would normally come from a geocoding service or database
    // For now, we'll use hardcoded values for demo purposes
    const coordinates: Record<string, { lat: number, lng: number }> = {
      'Central Station': { lat: 57.708870, lng: 11.974560 },
      'Lindholmen': { lat: 57.707130, lng: 11.938290 },
      'Mölndal': { lat: 57.655800, lng: 12.013580 },
      'Volvo Headquarters': { lat: 57.720890, lng: 12.025600 },
      'Landvetter Airport': { lat: 57.668799, lng: 12.292314 },
      'Brunnsparken Hub': { lat: 57.708870, lng: 11.974560 },
      'Lindholmen Hub': { lat: 57.707130, lng: 11.938290 },
      'Mölndal Hub': { lat: 57.655800, lng: 12.013580 },
      'Landvetter Hub': { lat: 57.668799, lng: 12.292314 },
      'Partille Hub': { lat: 57.739040, lng: 12.106430 },
      'Partille Centrum Hub': { lat: 57.739040, lng: 12.106430 },
      'Kungsbacka Hub': { lat: 57.483730, lng: 12.076040 },
      'Lerum Hub': { lat: 57.769720, lng: 12.269840 },
      'Kungälv Hub': { lat: 57.871090, lng: 11.975550 },
      'Frölunda Torg Hub': { lat: 57.651200, lng: 11.911600 },
      'Volvo Cars Torslanda': { lat: 57.720890, lng: 12.025600 },
      'Volvo Group Lundby': { lat: 57.715130, lng: 11.935290 },
      'AstraZeneca Mölndal': { lat: 57.660800, lng: 12.011580 },
      'Ericsson Lindholmen': { lat: 57.706130, lng: 11.938290 },
      'SKF Gamlestaden': { lat: 57.728870, lng: 12.014560 },
      // Add more locations as needed
      'Unknown': { lat: 57.708870, lng: 11.974560 } // Default for unknown locations
    };

    // Log if we're missing a location
    if (!coordinates[locationName]) {
      console.warn(`Missing coordinates for location: ${locationName}. Using default.`);
    }

    return coordinates[locationName] || { lat: 57.708870, lng: 11.974560 }; // Default to Central Station
  };

  // Calculate estimated travel time and distance
  const calculateRouteInfo = () => {
    if (!selectedRide) return { distance: '0.0', time: 0 };

    // Handle different property naming conventions and ensure properties exist
    const startingHubName = selectedRide.startingHub?.name || selectedRide.starting_hub?.name || 'Unknown';
    const destinationHubName = selectedRide.destinationHub?.name || selectedRide.destination_hub?.name || 'Unknown';

    // If both hub names are unknown, return default values
    if (startingHubName === 'Unknown' && destinationHubName === 'Unknown') {
      return { distance: '0.0', time: 0 };
    }

    const startCoords = getCoordinates(startingHubName);
    const destCoords = getCoordinates(destinationHubName);

    // Calculate direct distance in kilometers
    const R = 6371; // Earth's radius in km
    const dLat = (destCoords.lat - startCoords.lat) * Math.PI / 180;
    const dLon = (destCoords.lng - startCoords.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(startCoords.lat * Math.PI / 180) * Math.cos(destCoords.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Add 20% for non-direct route
    const routeDistance = distance * 1.2;

    // Estimate time based on average speed of 50 km/h
    const timeInHours = routeDistance / 50;
    const timeInMinutes = Math.round(timeInHours * 60);

    return {
      distance: routeDistance.toFixed(1),
      time: timeInMinutes
    };
  };

  const routeInfo = calculateRouteInfo();

  if (!selectedRide) {
    return (
      <div className="h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Select a ride to view the route</p>
        </div>
      </div>
    );
  }

  // Get hub names safely
  const startingHubName = selectedRide?.startingHub?.name || selectedRide?.starting_hub?.name || 'Unknown';
  const destinationHubName = selectedRide?.destinationHub?.name || selectedRide?.destination_hub?.name || 'Unknown';

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col">
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mb-2 mx-auto"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading map...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              ref={mapContainerRef}
              className="w-full h-full z-10"
            />
            {/* Route info overlay */}
            <div className="absolute top-2 left-2 z-20 bg-white dark:bg-gray-800 p-2 rounded-md shadow-md text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-gray-900 dark:text-white">{startingHubName}</span>
              </div>
              <div className="flex items-center mt-1">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-gray-900 dark:text-white">{destinationHubName}</span>
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                <div>Distance: {routeInfo.distance} km</div>
                <div>Est. time: {routeInfo.time} min</div>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
};

export default RideDetailsMap;
