import React from 'react';

interface RideSearchFormProps {
  startLocation: string;
  destination: string;
  date: Date | undefined;
  rideType: 'hub_to_destination' | 'enterprise' | 'custom';
  onStartLocationChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onDateChange: (value: Date | undefined) => void;
  onRideTypeChange: (value: 'hub_to_destination' | 'enterprise' | 'custom') => void;
  onSearch: () => void;
}

const RideSearchForm: React.FC<RideSearchFormProps> = ({
  startLocation,
  destination,
  date,
  rideType,
  onStartLocationChange,
  onDestinationChange,
  onDateChange,
  onRideTypeChange,
  onSearch,
}) => {
  // Mock data for dropdowns (would come from database in real implementation)
  const hubs = [
    { id: '1', name: 'Central Hub' },
    { id: '2', name: 'North Hub' },
    { id: '3', name: 'East Hub' },
    { id: '4', name: 'South Hub' },
    { id: '5', name: 'West Hub' },
  ];

  const destinations = [
    { id: '1', name: 'Volvo Headquarters' },
    { id: '2', name: 'Ericsson Campus' },
    { id: '3', name: 'AstraZeneca R&D' },
    { id: '4', name: 'SKF Factory' },
    { id: '5', name: 'Lindholmen Science Park' },
    { id: '6', name: 'Chalmers University' },
    { id: '7', name: 'Gothenburg Central Station' },
    { id: '8', name: 'Liseberg Amusement Park' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ride Type Selection */}
        <div className="col-span-3">
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-brand-500"
                checked={rideType === 'hub_to_destination'}
                onChange={() => onRideTypeChange('hub_to_destination')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Hub to Destination</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-brand-500"
                checked={rideType === 'enterprise'}
                onChange={() => onRideTypeChange('enterprise')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enterprise</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                className="form-radio h-4 w-4 text-brand-500"
                checked={rideType === 'custom'}
                onChange={() => onRideTypeChange('custom')}
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Custom</span>
            </label>
          </div>
        </div>

        {/* Start Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Hub
          </label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={startLocation}
            onChange={(e) => onStartLocationChange(e.target.value)}
            required
          >
            <option value="">Select a hub</option>
            {hubs.map((hub) => (
              <option key={hub.id} value={hub.name}>
                {hub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Destination
          </label>
          <select
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            required
          >
            <option value="">Select a destination</option>
            {destinations.map((dest) => (
              <option key={dest.id} value={dest.name}>
                {dest.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={date ? date.toISOString().split('T')[0] : ''}
            onChange={(e) => onDateChange(e.target.value ? new Date(e.target.value) : undefined)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-brand-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Find Rides
        </button>
      </div>
    </form>
  );
};

export default RideSearchForm;
