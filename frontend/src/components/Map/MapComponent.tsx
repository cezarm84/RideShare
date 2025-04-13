import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  startLat: number;
  startLng: number;
  startName: string;
  destLat: number;
  destLng: number;
  destName: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  startLat,
  startLng,
  startName,
  destLat,
  destLng,
  destName
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fix Leaflet icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });

    // Make sure the map container is available
    if (!mapContainerRef.current) return;

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
    startMarker.bindPopup(`<b>Start:</b> ${startName}`);

    const destMarker = L.marker([destLat, destLng]).addTo(mapRef.current);
    destMarker.bindPopup(`<b>Destination:</b> ${destName}`);

    // Generate a realistic route with multiple waypoints
    // This simulates what a routing API would provide
    const generateRealisticRoute = () => {
      // Calculate the direct distance
      const directDistance = Math.sqrt(
        Math.pow(startLat - destLat, 2) + Math.pow(startLng - destLng, 2)
      );

      // Determine how many waypoints to add based on distance
      const numWaypoints = Math.max(3, Math.min(8, Math.ceil(directDistance * 500)));

      // Generate waypoints along a realistic path
      const waypoints = [];

      // Add starting point
      waypoints.push([startLat, startLng]);

      // Create a slight curve by using a bezier-like approach
      // We'll offset the midpoint perpendicular to the direct line
      const midLat = (startLat + destLat) / 2;
      const midLng = (startLng + destLng) / 2;

      // Calculate perpendicular offset
      const dx = destLng - startLng;
      const dy = destLat - startLat;
      const length = Math.sqrt(dx * dx + dy * dy);

      // Normalize and rotate 90 degrees
      const offsetX = -dy / length * 0.005;
      const offsetY = dx / length * 0.005;

      // Apply offset to midpoint
      const curvedMidLat = midLat + offsetY;
      const curvedMidLng = midLng + offsetX;

      // Add intermediate waypoints
      for (let i = 1; i < numWaypoints - 1; i++) {
        const t = i / (numWaypoints - 1);

        // Quadratic bezier curve formula
        const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * curvedMidLat + t * t * destLat;
        const lng = (1 - t) * (1 - t) * startLng + 2 * (1 - t) * t * curvedMidLng + t * t * destLng;

        // Add some randomness to make it look more like a real road
        const jitter = 0.0005 * Math.sin(i * 5);

        waypoints.push([lat + jitter, lng + jitter]);
      }

      // Add destination point
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
    for (let i = 1; i < routeWaypoints.length - 1; i += 2) {
      const p1 = routeWaypoints[i];
      const p2 = routeWaypoints[i + 1];

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

    // Clean up function
    return () => {
      // We don't remove the map on cleanup to prevent flickering
      // Just clear the markers and routes
      if (mapRef.current) {
        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapRef.current?.removeLayer(layer);
          }
        });
      }
    };
  }, [startLat, startLng, startName, destLat, destLng, destName]);

  // Calculate estimated travel time and distance
  const calculateRouteInfo = () => {
    // Calculate direct distance in kilometers
    const R = 6371; // Earth's radius in km
    const dLat = (destLat - startLat) * Math.PI / 180;
    const dLon = (destLng - startLng) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(startLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) *
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

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full z-10"
      />
      {/* Route info overlay */}
      <div className="absolute top-2 left-2 z-20 bg-white dark:bg-gray-800 p-2 rounded-md shadow-md text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          <span className="text-gray-900 dark:text-white">{startName}</span>
        </div>
        <div className="flex items-center mt-1">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          <span className="text-gray-900 dark:text-white">{destName}</span>
        </div>
      </div>

      {/* Compact navigation info */}
      <div className="absolute bottom-2 right-2 z-20 bg-white dark:bg-gray-800 p-2 rounded-md shadow-md text-xs flex items-center space-x-3">
        <div className="flex items-center">
          <svg className="w-3 h-3 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-gray-900 dark:text-white">
            {routeInfo.time < 60 ? `${routeInfo.time} min` : `${Math.floor(routeInfo.time/60)}h ${routeInfo.time % 60}m`}
          </span>
        </div>
        <div className="flex items-center">
          <svg className="w-3 h-3 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="font-medium text-gray-900 dark:text-white">{routeInfo.distance} km</span>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
