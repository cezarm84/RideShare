import React from 'react';
import { RideOption } from './RidePlanner';

interface RideStatsProps {
  availableRides: RideOption[];
}

const RideStats: React.FC<RideStatsProps> = ({ availableRides }) => {
  if (availableRides.length === 0) {
    return null;
  }

  // Calculate average price
  const totalPrice = availableRides.reduce((sum, ride) => sum + ride.price, 0);
  const averagePrice = totalPrice / availableRides.length;

  // Find the fastest ride
  const fastestRide = availableRides.reduce((fastest, ride) => {
    const currentDuration = parseInt(ride.route.duration.split(' ')[0]);
    const fastestDuration = fastest ? parseInt(fastest.route.duration.split(' ')[0]) : Infinity;
    return currentDuration < fastestDuration ? ride : fastest;
  }, null as RideOption | null);

  // Count available seats
  const totalSeats = availableRides.reduce((sum, ride) => sum + ride.availableSeats, 0);

  return (
    <div className="flex space-x-4">
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">Rides</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{availableRides.length}</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Price</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{Math.round(averagePrice)} kr</p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">Fastest</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {fastestRide ? fastestRide.route.duration : 'N/A'}
        </p>
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">Seats</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalSeats}</p>
      </div>
    </div>
  );
};

export default RideStats;
