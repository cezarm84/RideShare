import React from 'react';
import { RideOption } from './RidePlanner';

interface RideOptionsListProps {
  rides: RideOption[];
  selectedRideId: string;
  onSelectRide: (id: string) => void;
  isMobile?: boolean;
}

const RideOptionsList: React.FC<RideOptionsListProps> = ({
  rides,
  selectedRideId,
  onSelectRide,
  isMobile = false,
}) => {
  if (rides.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-4">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No rides available. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {rides.length} {rides.length === 1 ? 'Ride' : 'Rides'} Available
        </h3>
      </div>
      <div className="flex-1 overflow-auto">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {rides.map((ride) => (
            <li
              key={ride.id}
              className={`cursor-pointer transition-colors ${
                selectedRideId === ride.id
                  ? 'bg-brand-50 dark:bg-brand-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => onSelectRide(ride.id)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={ride.driver.image}
                        alt={ride.driver.name}
                      />
                    </div>
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
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {ride.price} kr
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {ride.availableSeats} {ride.availableSeats === 1 ? 'seat' : 'seats'} left
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <span className="font-medium">{ride.departureTime}</span>
                      <svg
                        className="h-4 w-4 mx-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                      <span className="font-medium">{ride.arrivalTime}</span>
                    </div>
                    <span className="mx-2">•</span>
                    <span>{ride.route.duration}</span>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>{ride.vehicle.model}</span>
                    <span className="mx-1">•</span>
                    <span>{ride.vehicle.color}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RideOptionsList;
