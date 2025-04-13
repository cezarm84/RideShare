import React from 'react';
import { RideOption } from './RidePlanner';

interface RideMapProps {
  startLocation: string;
  destination: string;
  selectedRide?: RideOption;
  isRandomTrip?: boolean;
}

const RideMap: React.FC<RideMapProps> = ({ startLocation, destination, selectedRide, isRandomTrip = false }) => {
  // In a real implementation, this would use a map library like Google Maps or Mapbox
  // For now, we'll create a simple placeholder

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {isRandomTrip ? 'Suggested Route Map' : 'Route Map'}
        </h3>
      </div>
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 p-4 flex items-center justify-center relative">
        {/* This is a placeholder for the actual map */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-gray-800 dark:to-gray-900 opacity-50"></div>

        {isRandomTrip ? (
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-24 h-0.5 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {startLocation} to {destination}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {/* Random distance and duration */}
              {`${Math.floor(Math.random() * 15) + 5} km • ${Math.floor(Math.random() * 20) + 10} min`}
            </p>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p>Interactive map would be displayed here using OpenStreetMap</p>
              <p className="mt-2">To implement this feature, we need to use:</p>
              <ul className="mt-1 text-left ml-8 list-disc">
                <li>OpenStreetMap with Leaflet (free, open-source)</li>
                <li>Or Mapbox (requires API key, has free tier)</li>
              </ul>
            </div>
          </div>
        ) : selectedRide ? (
          <div className="relative z-10 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-24 h-0.5 bg-gray-300 dark:bg-gray-600 mx-2"></div>
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {selectedRide.route.startLocation} to {selectedRide.route.destination}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedRide.route.distance} • {selectedRide.route.duration}
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Map visualization would be displayed here using OpenStreetMap
            </p>
          </div>
        ) : (
          <div className="relative z-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a ride to view the route
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RideMap;
