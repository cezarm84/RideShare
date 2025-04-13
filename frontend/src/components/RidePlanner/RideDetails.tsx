import React from 'react';
import { RideOption } from './RidePlanner';

interface RideDetailsProps {
  ride: RideOption;
  onBookRide: () => void;
  isMobile?: boolean;
}

const RideDetails: React.FC<RideDetailsProps> = ({ ride, onBookRide, isMobile = false }) => {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">Ride Details</h3>
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
                    {ride.route.startLocation}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Departure: {ride.departureTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {ride.route.destination}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Arrival: {ride.arrivalTime}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Journey Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Distance</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ride.route.distance}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Duration</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ride.route.duration}</p>
            </div>
          </div>

          {/* Driver Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Driver</h4>
            <div className="flex items-center">
              <img
                className="h-10 w-10 rounded-full"
                src={ride.driver.image}
                alt={ride.driver.name}
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {ride.driver.name}
                </p>
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    {ride.driver.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Vehicle</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                <p className="text-sm text-gray-900 dark:text-white">{ride.vehicle.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Model</p>
                <p className="text-sm text-gray-900 dark:text-white">{ride.vehicle.model}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Color</p>
                <p className="text-sm text-gray-900 dark:text-white">{ride.vehicle.color}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">License Plate</p>
                <p className="text-sm text-gray-900 dark:text-white">{ride.vehicle.licensePlate}</p>
              </div>
            </div>
          </div>

          {/* Price and Seats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Price</h4>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{ride.price} kr</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Available Seats</h4>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {ride.availableSeats} {ride.availableSeats === 1 ? 'seat' : 'seats'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBookRide}
          className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-brand-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Book This Ride
        </button>
      </div>
    </div>
  );
};

export default RideDetails;
