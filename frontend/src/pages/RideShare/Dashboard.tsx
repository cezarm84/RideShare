import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { rideService } from '@/services/ride.service';
import { bookingService } from '@/services/booking.service';

interface DashboardStats {
  totalRides: number;
  activeRides: number;
  totalBookings: number;
  pendingBookings: number;
  revenue: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRides: 0,
    activeRides: 0,
    totalBookings: 0,
    pendingBookings: 0,
    revenue: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [rides, bookings] = await Promise.all([
          rideService.getRides(),
          bookingService.getBookings(),
        ]);

        setStats({
          totalRides: rides.length,
          activeRides: rides.filter(ride => ride.status === 'active').length,
          totalBookings: bookings.length,
          pendingBookings: bookings.filter(booking => booking.status === 'pending').length,
          revenue: bookings.reduce((acc, booking) => acc + (booking.price || 0), 0),
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-600">Total Rides</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalRides}</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-600">Active Rides</h3>
          <p className="text-3xl font-bold mt-2">{stats.activeRides}</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-600">Total Bookings</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalBookings}</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-600">Revenue</h3>
          <p className="text-3xl font-bold mt-2">${stats.revenue.toFixed(2)}</p>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          {/* Add recent activity list here */}
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Rides</h3>
          {/* Add upcoming rides list here */}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 