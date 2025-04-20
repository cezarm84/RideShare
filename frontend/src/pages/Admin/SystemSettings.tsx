import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SystemSettings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'RideShare',
    siteDescription: 'Modern ride-sharing platform',
    contactEmail: 'support@rideshare.com',
    maxRidesPerDay: '50',
    defaultPricePerKm: '5',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    enablePushNotifications: true,
    notifyAdminsOnNewRides: true,
    notifyAdminsOnNewUsers: true,
    reminderHoursBeforeRide: '2',
  });

  const [apiSettings, setApiSettings] = useState({
    geocodingProvider: 'opencage',
    geocodingApiKey: '********',
    weatherApiKey: '********',
    mapboxApiKey: '********',
    enableExternalApis: true,
  });

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: value,
    });
  };

  const handleNotificationSettingsChange = (name: string, value: boolean | string) => {
    setNotificationSettings({
      ...notificationSettings,
      [name]: value,
    });
  };

  const handleApiSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiSettings({
      ...apiSettings,
      [name]: value,
    });
  };

  const handleApiToggleChange = (name: string, value: boolean) => {
    setApiSettings({
      ...apiSettings,
      [name]: value,
    });
  };

  const handleSaveSettings = (settingsType: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(`${settingsType} settings saved successfully`);
    }, 1000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">System Settings</h2>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-500 text-green-800">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="p-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api">API Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  name="siteName"
                  value={generalSettings.siteName}
                  onChange={handleGeneralSettingsChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Input
                  id="siteDescription"
                  name="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={handleGeneralSettingsChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={generalSettings.contactEmail}
                  onChange={handleGeneralSettingsChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxRidesPerDay">Max Rides Per Day</Label>
                  <Input
                    id="maxRidesPerDay"
                    name="maxRidesPerDay"
                    type="number"
                    value={generalSettings.maxRidesPerDay}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultPricePerKm">Default Price Per Km (kr)</Label>
                  <Input
                    id="defaultPricePerKm"
                    name="defaultPricePerKm"
                    type="number"
                    value={generalSettings.defaultPricePerKm}
                    onChange={handleGeneralSettingsChange}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  className="bg-brand-500 hover:bg-brand-600"
                  onClick={() => handleSaveSettings('General')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableEmailNotifications">Enable Email Notifications</Label>
                <Switch
                  id="enableEmailNotifications"
                  checked={notificationSettings.enableEmailNotifications}
                  onCheckedChange={(checked) =>
                    handleNotificationSettingsChange('enableEmailNotifications', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enableSmsNotifications">Enable SMS Notifications</Label>
                <Switch
                  id="enableSmsNotifications"
                  checked={notificationSettings.enableSmsNotifications}
                  onCheckedChange={(checked) =>
                    handleNotificationSettingsChange('enableSmsNotifications', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enablePushNotifications">Enable Push Notifications</Label>
                <Switch
                  id="enablePushNotifications"
                  checked={notificationSettings.enablePushNotifications}
                  onCheckedChange={(checked) =>
                    handleNotificationSettingsChange('enablePushNotifications', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifyAdminsOnNewRides">Notify Admins on New Rides</Label>
                <Switch
                  id="notifyAdminsOnNewRides"
                  checked={notificationSettings.notifyAdminsOnNewRides}
                  onCheckedChange={(checked) =>
                    handleNotificationSettingsChange('notifyAdminsOnNewRides', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="notifyAdminsOnNewUsers">Notify Admins on New Users</Label>
                <Switch
                  id="notifyAdminsOnNewUsers"
                  checked={notificationSettings.notifyAdminsOnNewUsers}
                  onCheckedChange={(checked) =>
                    handleNotificationSettingsChange('notifyAdminsOnNewUsers', checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderHoursBeforeRide">Reminder Hours Before Ride</Label>
                <Input
                  id="reminderHoursBeforeRide"
                  type="number"
                  value={notificationSettings.reminderHoursBeforeRide}
                  onChange={(e) =>
                    handleNotificationSettingsChange('reminderHoursBeforeRide', e.target.value)
                  }
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  className="bg-brand-500 hover:bg-brand-600"
                  onClick={() => handleSaveSettings('Notification')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="geocodingProvider">Geocoding Provider</Label>
                <Input
                  id="geocodingProvider"
                  name="geocodingProvider"
                  value={apiSettings.geocodingProvider}
                  onChange={handleApiSettingsChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="geocodingApiKey">Geocoding API Key</Label>
                <Input
                  id="geocodingApiKey"
                  name="geocodingApiKey"
                  type="password"
                  value={apiSettings.geocodingApiKey}
                  onChange={handleApiSettingsChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weatherApiKey">Weather API Key</Label>
                <Input
                  id="weatherApiKey"
                  name="weatherApiKey"
                  type="password"
                  value={apiSettings.weatherApiKey}
                  onChange={handleApiSettingsChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mapboxApiKey">Mapbox API Key</Label>
                <Input
                  id="mapboxApiKey"
                  name="mapboxApiKey"
                  type="password"
                  value={apiSettings.mapboxApiKey}
                  onChange={handleApiSettingsChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enableExternalApis">Enable External APIs</Label>
                <Switch
                  id="enableExternalApis"
                  checked={apiSettings.enableExternalApis}
                  onCheckedChange={(checked) =>
                    handleApiToggleChange('enableExternalApis', checked)
                  }
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  className="bg-brand-500 hover:bg-brand-600"
                  onClick={() => handleSaveSettings('API')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default SystemSettings;
