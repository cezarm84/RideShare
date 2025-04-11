import React from 'react';
import { format, parseISO } from 'date-fns';
import { 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  TruckIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Ride } from '@/types/ride';

interface RideMatchResultsProps {
  matches: Ride[];
  isLoading?: boolean;
  onBookRide: (rideId: number) => void;
}

const RideMatchResults: React.FC<RideMatchResultsProps> = ({ 
  matches, 
  isLoading = false,
  onBookRide 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <MapPinIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
        </div>
        <h3 className="mt-3 text-lg font-medium text-gray-900">No matches found</h3>
        <p className="mt-2 text-sm text-gray-500">
          We couldn't find any rides that match your criteria. Try adjusting your preferences or search for a different time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        We found these rides that match your preferences. Rides are sorted by best match first.
      </p>

      {matches.map((match) => (
        <Card 
          key={match.ride_id} 
          className="relative overflow-visible transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
        >
          {/* Match score indicator */}
          <div 
            className={`absolute -top-3 right-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white text-white font-bold text-lg shadow-md z-10 ${
              match.overall_score > 90 ? 'bg-green-500' : 
              match.overall_score > 80 ? 'bg-blue-500' : 
              match.overall_score > 70 ? 'bg-blue-400' : 'bg-yellow-500'
            }`}
          >
            {Math.round(match.overall_score)}%
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <div className="flex items-center mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {match.hub_name} to {match.destination_name}
                    </h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <ClockIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      {format(parseISO(match.departure_time), 'h:mm a')} - {format(parseISO(match.arrival_time), 'h:mm a')}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {match.vehicle_type}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span>
                        {match.available_seats} of {match.total_capacity} seats available
                      </span>
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <CurrencyDollarIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                      <span>Estimated price: {match.estimated_price} kr</span>
                    </div>
                  </div>
                  
                  <div>
                    {match.driver_name && (
                      <div className="flex items-center text-sm text-gray-500">
                        <TruckIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span>Driver: {match.driver_name}</span>
                      </div>
                    )}
                    
                    {match.driver_rating && (
                      <div className="mt-2 flex items-center text-sm">
                        <span className="text-gray-500 mr-1">Rating:</span>
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-400" />
                          <span className="ml-1 text-gray-700">{match.driver_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-4">
                <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Why this is a good match:</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <ul className="list-disc space-y-1 pl-5">
                          {match.match_reasons?.map((reason, index) => (
                            <li 
                              key={index}
                              className={`opacity-${100 - (index * 15)}`}
                            >
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4 flex justify-end">
              <Button
                onClick={() => onBookRide(match.ride_id)}
                className="px-6 py-2 rounded-md font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                aria-label={`Book ride from ${match.hub_name} to ${match.destination_name}`}
              >
                <TruckIcon className="h-5 w-5 mr-2" />
                Book This Ride
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RideMatchResults;
