import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import PageMeta from '@/components/common/PageMeta';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import HubsManagement from './HubsManagement';
import DestinationsManagement from './DestinationsManagement';
import VehicleTypesManagement from './VehicleTypesManagement';
import EnterprisesManagement from './EnterprisesManagement';
import UsersManagement from './UsersManagement';
import DriversManagement from './DriversManagement';
import RidesManagement from './RidesManagement';
import SystemSettings from './SystemSettings';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect non-admin users
  if (!user?.is_admin && !user?.is_superadmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="p-6">
      <PageMeta
        title="RideShare Admin Dashboard"
        description="Administrative dashboard for RideShare platform management"
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <Card className="p-6">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:grid-cols-8 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="hubs">Hubs</TabsTrigger>
            <TabsTrigger value="destinations">Destinations</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="enterprises">Enterprises</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="rides">Rides</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-600">Total Hubs</h3>
                <p className="text-3xl font-bold mt-2">-</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-600">Total Destinations</h3>
                <p className="text-3xl font-bold mt-2">-</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-600">Active Rides</h3>
                <p className="text-3xl font-bold mt-2">-</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold text-gray-600">Total Users</h3>
                <p className="text-3xl font-bold mt-2">-</p>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <p className="text-gray-500">No recent activity to display</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>API Status</span>
                    <span className="text-green-500">Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database</span>
                    <span className="text-green-500">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Backup</span>
                    <span>Never</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="hubs">
            <HubsManagement />
          </TabsContent>

          <TabsContent value="destinations">
            <DestinationsManagement />
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleTypesManagement />
          </TabsContent>

          <TabsContent value="enterprises">
            <EnterprisesManagement />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="drivers">
            <DriversManagement />
          </TabsContent>

          <TabsContent value="rides">
            <RidesManagement />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default AdminDashboard;
