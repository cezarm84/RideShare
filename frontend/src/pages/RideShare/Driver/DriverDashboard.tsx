import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { driverService, DriverProfile, DriverRide, DriverNotification } from '@/services/driver.service';
import { Loader2 } from 'lucide-react';

const formatTime = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleDateString();
};

const getVehicleStatus = () => {
  // Mock implementation
  return 'Passed';
};

const getNextInspectionDate = () => {
  // Mock implementation
  const date = new Date();
  date.setMonth(date.getMonth() + 3);
  return date.toISOString();
};

const getRouteDescription = (ride: DriverRide) => {
  return `${ride.starting_hub.name} → ${ride.destination_hub?.name || 'Custom destination'}`;
};

const DriverDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [todayRides, setTodayRides] = useState<DriverRide[]>([]);
  const [notifications, setNotifications] = useState<DriverNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get driver ID from user profile
        // Use the user ID as the driver ID for now
        // In a real implementation, you would have a separate driver profile
        const driverId = user?.id || 1; // Fallback to 1 if user ID is not available

        // Fetch driver profile
        const profile = await driverService.getDriverProfile(driverId);
        setDriverProfile(profile);

        // Fetch today's rides
        const today = new Date().toISOString().split('T')[0];
        const rides = await driverService.getDriverRides(driverId, { startDate: today });
        setTodayRides(rides);

        // Fetch notifications
        const notifications = await driverService.getDriverNotifications(driverId);
        setNotifications(notifications);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Driver Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {todayRides.length > 0 ? (
              <div>
                <p>Next ride: {formatTime(todayRides[0].departure_time)}</p>
                <p>{todayRides.length} rides today</p>
                <Button
                  className="mt-3 w-full"
                  onClick={() => navigate('/driver/schedule')}
                >
                  View Schedule
                </Button>
              </div>
            ) : (
              <p>No rides scheduled for today</p>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {driverProfile ? (
              <>
                <p>Rating: {driverProfile.average_rating}/5</p>
                <p>On-time rate: 98%</p>
                <p>Completed rides: {driverProfile.completed_rides}</p>
              </>
            ) : (
              <p>No performance data available</p>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length > 0 ? (
              <ul>
                {notifications.slice(0, 3).map(notification => (
                  <li key={notification.id} className="mb-2">
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-gray-500">{notification.message}</p>
                  </li>
                ))}
                {notifications.length > 3 && (
                  <Button variant="link" className="p-0">
                    View all {notifications.length} notifications
                  </Button>
                )}
              </ul>
            ) : (
              <p>No new notifications</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => navigate('/driver/issues/new')}>
                Report Issue
              </Button>
              <Button onClick={() => navigate('/driver/time-off/new')}>
                Request Time Off
              </Button>
              <Button onClick={() => navigate('/driver/profile')}>
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vehicle Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Inspection status: {getVehicleStatus()}</p>
            <p>Next inspection: {formatDate(getNextInspectionDate())}</p>
            <Button
              className="mt-3 w-full"
              onClick={() => navigate('/driver/documents')}
            >
              Manage Documents
            </Button>
          </CardContent>
        </Card>

        {/* Earnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This week: 4,500 SEK</p>
            <p>Last week: 5,200 SEK</p>
            <Button
              className="mt-3 w-full"
              onClick={() => navigate('/driver/earnings')}
            >
              View Earnings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;
