import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MapPinIcon, ClockIcon, ArrowLongRightIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import apiService from '@/services/api';
import { TravelPattern } from '@/types/travel-pattern';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TravelPatternVisualization: React.FC = () => {
  const [patterns, setPatterns] = useState<TravelPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDay, setActiveDay] = useState<number>(new Date().getDay());

  // Fetch travel patterns on component mount
  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getTravelPatterns();
        setPatterns(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching travel patterns:', err);
        setError('Failed to load your travel patterns. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatterns();
  }, []);

  // Filter patterns by active day
  const filteredPatterns = patterns.filter(pattern => pattern.day_of_week === activeDay);

  // Handle day tab click
  const handleDayClick = (day: number) => {
    setActiveDay(day);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Travel Patterns</CardTitle>
        <CardDescription>
          Based on your past rides and preferences, we've identified these common travel patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Day of week tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Days of the week">
            {DAYS_OF_WEEK.map((day, index) => (
              <button
                key={day}
                onClick={() => handleDayClick(index)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeDay === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                aria-current={activeDay === index ? 'page' : undefined}
                tabIndex={0}
                aria-label={`View travel patterns for ${day}`}
              >
                {day}
              </button>
            ))}
          </nav>
        </div>

        {/* Patterns for selected day */}
        <div className="mt-6">
          {filteredPatterns.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <ClockIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">No travel patterns</h3>
              <p className="mt-2 text-sm text-gray-500">
                We haven't identified any regular travel patterns for {DAYS_OF_WEEK[activeDay]} yet.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredPatterns.map((pattern) => {
                // Parse time from format like "08:00:00"
                const [hours, minutes] = pattern.departure_time.split(':');
                const formattedTime = format(
                  new Date().setHours(parseInt(hours), parseInt(minutes)), 
                  'h:mm a'
                );
                
                return (
                  <li key={pattern.id} className="py-4">
                    <div className="flex items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center text-lg font-medium text-gray-900 mb-1">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                          {pattern.origin_name}
                          <ArrowLongRightIcon className="h-5 w-5 text-gray-400 mx-2" />
                          <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                          {pattern.destination_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {formattedTime}
                          <span className="mx-2">•</span>
                          <span>Frequency: {pattern.frequency} times</span>
                          <span className="mx-2">•</span>
                          <span>Last traveled: {format(new Date(pattern.last_traveled), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span 
                          className={`
                            inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${pattern.origin_type === 'hub' && pattern.destination_type === 'hub'
                              ? 'bg-purple-100 text-purple-800'
                              : pattern.origin_type === 'hub'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          `}
                        >
                          {pattern.origin_type === 'hub' && pattern.destination_type === 'hub'
                            ? 'Hub to Hub'
                            : pattern.origin_type === 'hub'
                              ? 'Hub to Destination'
                              : 'Custom Route'
                          }
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TravelPatternVisualization;
