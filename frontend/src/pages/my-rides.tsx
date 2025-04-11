import React, { useState } from 'react';
import Head from 'next/head';
import { format, parseISO } from 'date-fns';
import { 
  ClockIcon, 
  MapPinIcon, 
  UserIcon, 
  TruckIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Mock data for upcoming rides
const upcomingRides = [
  {
    id: 1,
    departure_time: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    arrival_time: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    hub_name: 'Central Station',
    destination_name: 'Business Park',
    vehicle_type: 'Sedan',
    driver_name: 'John Driver',
    driver_rating: 4.8,
    estimated_price: 75,
    status: 'confirmed'
  },
  {
    id: 2,
    departure_time: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    arrival_time: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
    hub_name: 'North Hub',
    destination_name: 'University Campus',
    vehicle_type: 'SUV',
    driver_name: 'Jane Driver',
    driver_rating: 4.9,
    estimated_price: 85,
    status: 'confirmed'
  }
];

// Mock data for past rides
const pastRides = [
  {
    id: 3,
    departure_time: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    arrival_time: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000).toISOString(),
    hub_name: 'Central Station',
    destination_name: 'Shopping Mall',
    vehicle_type: 'Minivan',
    driver_name: 'Sam Driver',
    driver_rating: 4.5,
    estimated_price: 65,
    status: 'completed',
    user_rating: 5
  },
  {
    id: 4,
    departure_time: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    arrival_time: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000).toISOString(),
    hub_name: 'East Hub',
    destination_name: 'Airport',
    vehicle_type: 'Sedan',
    driver_name: 'Alex Driver',
    driver_rating: 4.7,
    estimated_price: 95,
    status: 'completed',
    user_rating: 4
  },
  {
    id: 5,
    departure_time: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    arrival_time: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    hub_name: 'West Station',
    destination_name: 'Business Park',
    vehicle_type: 'SUV',
    driver_name: 'Taylor Driver',
    driver_rating: 4.6,
    estimated_price: 80,
    status: 'cancelled'
  }
];

const MyRidesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  const handleCancelRide = (rideId: number) => {
    // In a real app, this would call an API to cancel the ride
    alert(`Cancelling ride ${rideId}. This would call the API in a real app.`);
  };
  
  const handleRateRide = (rideId: number, rating: number) => {
    // In a real app, this would call an API to rate the ride
    alert(`Rating ride ${rideId} with ${rating} stars. This would call the API in a real app.`);
  };
  
  return (
    <Layout>
      <Head>
        <title>My Rides | RideShare</title>
        <meta name="description" content="View your upcoming and past rides" />
      </Head>
      
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              My Rides
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your upcoming and past rides
            </p>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              aria-current={activeTab === 'upcoming' ? 'page' : undefined}
              tabIndex={0}
              aria-label="View upcoming rides"
            >
              Upcoming Rides
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'past'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
              aria-current={activeTab === 'past' ? 'page' : undefined}
              tabIndex={0}
              aria-label="View past rides"
            >
              Past Rides
            </button>
          </nav>
        </div>
        
        {/* Ride list */}
        <div className="space-y-4">
          {activeTab === 'upcoming' ? (
            upcomingRides.length > 0 ? (
              upcomingRides.map((ride) => (
                <Card 
                  key={ride.id} 
                  className="hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {ride.hub_name} to {ride.destination_name}
                            </h3>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <ClockIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              {format(parseISO(ride.departure_time), 'EEE, MMM d, yyyy')} at {format(parseISO(ride.departure_time), 'h:mm a')}
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Confirmed
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <div className="flex items-center text-sm text-gray-500">
                              <TruckIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span>Driver: {ride.driver_name}</span>
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm">
                              <span className="text-gray-500 mr-1">Rating:</span>
                              <div className="flex items-center">
                                <StarIcon className="h-4 w-4 text-yellow-400" />
                                <span className="ml-1 text-gray-700">{ride.driver_rating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center text-sm text-gray-500">
                              <UserIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span>Vehicle: {ride.vehicle_type}</span>
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <CurrencyDollarIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span>Price: {ride.estimated_price} kr</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                        <Button
                          variant="outline"
                          className="justify-center"
                          aria-label="View ride details"
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-center text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleCancelRide(ride.id)}
                          aria-label="Cancel ride"
                        >
                          Cancel Ride
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <ClockIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">No upcoming rides</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You don't have any upcoming rides scheduled. Find a ride to get started.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => window.location.href = '/find-rides'}
                    aria-label="Find rides"
                  >
                    Find Rides
                  </Button>
                </div>
              </div>
            )
          ) : (
            pastRides.length > 0 ? (
              pastRides.map((ride) => (
                <Card 
                  key={ride.id} 
                  className="hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {ride.hub_name} to {ride.destination_name}
                            </h3>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <ClockIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              {format(parseISO(ride.departure_time), 'EEE, MMM d, yyyy')} at {format(parseISO(ride.departure_time), 'h:mm a')}
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {ride.status === 'completed' ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                <CheckCircleIcon className="mr-1 h-3 w-3" />
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                <XCircleIcon className="mr-1 h-3 w-3" />
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <div className="flex items-center text-sm text-gray-500">
                              <TruckIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span>Driver: {ride.driver_name}</span>
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm">
                              <span className="text-gray-500 mr-1">Rating:</span>
                              <div className="flex items-center">
                                <StarIcon className="h-4 w-4 text-yellow-400" />
                                <span className="ml-1 text-gray-700">{ride.driver_rating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center text-sm text-gray-500">
                              <UserIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span>Vehicle: {ride.vehicle_type}</span>
                            </div>
                            
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <CurrencyDollarIcon className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                              <span>Price: {ride.estimated_price} kr</span>
                            </div>
                          </div>
                        </div>
                        
                        {ride.status === 'completed' && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-gray-500">Your Rating:</p>
                            <div className="flex items-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon
                                  key={star}
                                  className={`h-5 w-5 ${
                                    star <= (ride.user_rating || 0)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                  aria-hidden="true"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                        <Button
                          variant="outline"
                          className="justify-center"
                          aria-label="View ride details"
                        >
                          View Details
                        </Button>
                        
                        {ride.status === 'completed' && !ride.user_rating && (
                          <div className="flex flex-col space-y-2">
                            <p className="text-sm font-medium text-center text-gray-500">Rate this ride:</p>
                            <div className="flex justify-center space-x-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  onClick={() => handleRateRide(ride.id, rating)}
                                  className="p-1 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-full"
                                  aria-label={`Rate ${rating} stars`}
                                >
                                  <StarIcon className="h-6 w-6 text-gray-300 hover:text-yellow-400" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <ClockIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">No past rides</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You haven't taken any rides yet. Find a ride to get started.
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => window.location.href = '/find-rides'}
                    aria-label="Find rides"
                  >
                    Find Rides
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyRidesPage;
