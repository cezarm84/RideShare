import React from 'react';
import { RideOption } from './RidePlanner';
import RideSearchForm from './RideSearchForm';
import RideOptionsList from './RideOptionsList';
import RideDetails from './RideDetails';
import RideMap from './RideMap';
import LoadingIndicator from '../common/LoadingIndicator';
import RideStats from './RideStats';

interface DesktopRidePlannerProps {
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

const DesktopRidePlanner: React.FC<DesktopRidePlannerProps> = ({
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
  const selectedRide = availableRides.find(ride => ride.id === selectedRideId);

  return (
    <div className="flex flex-col h-full">
      {/* Search Form */}
      <div className="p-4 grid grid-cols-4 gap-4 bg-white dark:bg-gray-800 rounded-t-lg shadow">
        <div className="col-span-3">
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
            onSearch={onSearch}
          />
        </div>

        <div className="col-span-1 flex justify-end items-center">
          <RideStats availableRides={availableRides} />
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 grid grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-b-lg shadow min-h-0">
        {isLoading ? (
          <div className="col-span-4 flex items-center justify-center">
            <LoadingIndicator message={`Finding rides from ${startLocation} to ${destination}...`} />
          </div>
        ) : (
          <>
            {availableRides.length > 0 ? (
              <>
                <div className="col-span-1 h-full overflow-hidden flex flex-col">
                  <RideOptionsList
                    rides={availableRides}
                    selectedRideId={selectedRideId}
                    onSelectRide={onSelectRide}
                  />
                </div>

                <div className="col-span-2 h-full overflow-hidden">
                  <RideMap
                    startLocation={startLocation}
                    destination={destination}
                    selectedRide={selectedRide}
                  />
                </div>

                <div className="col-span-1 h-full overflow-hidden flex flex-col">
                  {selectedRide && (
                    <RideDetails
                      ride={selectedRide}
                      onBookRide={() => onBookRide(selectedRideId)}
                    />
                  )}
                </div>
              </>
            ) : showRandomTrip ? (
              <>
                <div className="col-span-3 h-full overflow-hidden">
                  <RideMap
                    startLocation={startLocation}
                    destination={destination}
                    isRandomTrip={true}
                  />
                </div>

                <div className="col-span-1 h-full overflow-hidden flex flex-col">
                  <RandomTripInfo
                    startLocation={startLocation}
                    destination={destination}
                    date={date}
                  />
                </div>
              </>
            ) : (
              <div className="col-span-4 flex items-center justify-center">
                <div className="text-center p-8">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No rides found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your search criteria or select a different date/time.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DesktopRidePlanner;
