import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import apiService from '@/services/api';
import { MatchingPreferences as MatchingPreferencesType } from '@/types/preferences';

const MatchingPreferences: React.FC = () => {
  const [preferences, setPreferences] = useState<MatchingPreferencesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.getMatchingPreferences();
        setPreferences(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching matching preferences:', err);
        setError('Failed to load your preferences. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Handle slider changes
  const handleSliderChange = (field: keyof MatchingPreferencesType, value: number) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [field]: value
    });
  };

  // Handle switch changes
  const handleSwitchChange = (field: keyof MatchingPreferencesType, checked: boolean) => {
    if (!preferences) return;
    
    setPreferences({
      ...preferences,
      [field]: checked
    });
  };

  // Save preferences
  const handleSave = async () => {
    if (!preferences) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      await apiService.updateMatchingPreferences(preferences);
      
      setSuccessMessage('Preferences saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save your preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset preferences to default
  const handleReset = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      const response = await apiService.resetMatchingPreferences();
      setPreferences(response.data);
      
      setSuccessMessage('Preferences reset to default values!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error resetting preferences:', err);
      setError('Failed to reset your preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
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

  if (!preferences) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Unable to load preferences. Please try again later.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              aria-label="Reload page"
            >
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Matching Preferences</CardTitle>
        <CardDescription>
          Customize how we match you with rides and other passengers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {successMessage}
          </div>
        )}
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Time & Distance</h3>
          
          <Slider
            id="max-detour"
            aria-label="Maximum Detour Time"
            min={5}
            max={30}
            step={5}
            value={preferences.max_detour_minutes}
            onChange={(value) => handleSliderChange('max_detour_minutes', value)}
            valueSuffix=" min"
          />
          
          <Slider
            id="max-wait"
            aria-label="Maximum Wait Time"
            min={5}
            max={30}
            step={5}
            value={preferences.max_wait_minutes}
            onChange={(value) => handleSliderChange('max_wait_minutes', value)}
            valueSuffix=" min"
          />
          
          <Slider
            id="max-walking"
            aria-label="Maximum Walking Distance"
            min={250}
            max={2000}
            step={250}
            value={preferences.max_walking_distance_meters}
            onChange={(value) => handleSliderChange('max_walking_distance_meters', value)}
            valueSuffix=" m"
          />
          
          <Slider
            id="min-rating"
            aria-label="Minimum Driver Rating"
            min={3.0}
            max={5.0}
            step={0.1}
            value={preferences.minimum_driver_rating}
            onChange={(value) => handleSliderChange('minimum_driver_rating', value)}
            valuePrefix="★ "
          />
        </div>
        
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-medium">Matching Priorities</h3>
          
          <Switch
            id="same-enterprise"
            label="Prefer passengers from my company"
            description="Prioritize matching with people from the same enterprise"
            checked={preferences.prefer_same_enterprise}
            onChange={(checked) => handleSwitchChange('prefer_same_enterprise', checked)}
          />
          
          <Switch
            id="same-destination"
            label="Prefer same destination"
            description="Prioritize rides going to the same destination"
            checked={preferences.prefer_same_destination}
            onChange={(checked) => handleSwitchChange('prefer_same_destination', checked)}
          />
          
          <Switch
            id="recurring-rides"
            label="Prefer recurring rides"
            description="Prioritize rides that match your regular travel patterns"
            checked={preferences.prefer_recurring_rides}
            onChange={(checked) => handleSwitchChange('prefer_recurring_rides', checked)}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isSaving}
          aria-label="Reset preferences to default values"
        >
          Reset to Default
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="relative"
          aria-label="Save preferences"
        >
          {isSaving ? (
            <>
              <span className="opacity-0">Save Changes</span>
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MatchingPreferences;
