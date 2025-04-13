import React, { useState } from 'react';
import { RideOption } from './RidePlanner';
import RideSearchForm from './RideSearchForm';
import RideOptionsList from './RideOptionsList';
import RideDetails from './RideDetails';
import RideMap from './RideMap';
import LoadingIndicator from '../common/LoadingIndicator';

interface MobileRidePlannerProps {
  startLocation: string;
  destination: string;
  date: Date | undefined;
  rideType: 'hub_to_destination' | 'enterprise' | 'custom';
  isLoading: boolean;
  availableRides: RideOption[];
  selectedRideId: string;
  showRandomTrip: boolean;
  onStartLocationChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onDateChange: (value: Date | undefined) => void;

  onRideTypeChange: (value: 'hub_to_destination' | 'enterprise' | 'custom') => void;
  onSearch: () => void;
  onSelectRide: (id: string) => void;
  onBookRide: (id: string) => void;
}

const MobileRidePlanner: React.FC<MobileRidePlannerProps> = ({
  startLocation,
  destination,
  date,
  rideType,
  isLoading,
  availableRides,
  selectedRideId,
  showRandomTrip,
  onStartLocationChange,
  onDestinationChange,
  onDateChange,

  onRideTypeChange,
  onSearch,
  onSelectRide,
  onBookRide,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'details' | 'random-trip'>('search');
  const selectedRide = availableRides.find(ride => ride.id === selectedRideId);

  const handleSelectRide = (id: string) => {
    onSelectRide(id);
    setActiveTab('details');
  };

  const handleBackToResults = () => {
    setActiveTab('results');
  };

  const handleBackToSearch = () => {
    setActiveTab('search');
  };

  const handleSearch = () => {
    onSearch();
    if (startLocation && destination) {
      if (showRandomTrip) {
        setActiveTab('random-trip');
      } else {
        setActiveTab('results');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow">
      {activeTab === 'search' && (
        <div className="p-4">
          <RideSearchForm
            startLocation={startLocation}
            destination={destination}
            date={date}
            time={time}
            rideType={rideType}
            onStartLocationChange={onStartLocationChange}
            onDestinationChange={onDestinationChange}
            onDateChange={onDateChange}
            onTimeChange={onTimeChange}
            onRideTypeChange={onRideTypeChange}
            onSearch={handleSearch}
          />
        </div>
      )}

      {activeTab === 'results' && (
        <>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBackToSearch}
              className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Search
            </button>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-2">
              Available Rides
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              From {startLocation} to {destination}
            </p>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <LoadingIndicator message={`Finding rides from ${startLocation} to ${destination}...`} />
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4">
              <RideOptionsList
                rides={availableRides}
                selectedRideId={selectedRideId}
                onSelectRide={handleSelectRide}
                isMobile={true}
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'random-trip' && (
        <>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBackToSearch}
              className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Search
            </button>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-2">
              Suggested Trip
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Alternative route from {startLocation} to {destination}
            </p>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="h-48">
              <RideMap
                startLocation={startLocation}
                destination={destination}
                isRandomTrip={true}
              />
            </div>
            <div className="p-4">
              <RandomTripInfo
                startLocation={startLocation}
                destination={destination}
                date={date}
                isMobile={true}
              />
            </div>
          </div>
        </>
      )}

      {activeTab === 'details' && selectedRide && (
        <>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBackToResults}
              className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Results
            </button>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-2">
              Ride Details
            </h3>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="h-48">
              <RideMap
                startLocation={startLocation}
                destination={destination}
                selectedRide={selectedRide}
              />
            </div>
            <div className="p-4">
              <RideDetails
                ride={selectedRide}
                onBookRide={() => onBookRide(selectedRideId)}
                isMobile={true}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileRidePlanner;
