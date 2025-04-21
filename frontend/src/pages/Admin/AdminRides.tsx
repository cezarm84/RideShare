import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import RideService from '@/services/ride.service';
import RideList from '@/components/RideSearch/RideList';
import PageMeta from '../../components/common/PageMeta';

const AdminRides = () => {
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching all rides from AdminRides component');
      const rides = await RideService.getAllRides();
      console.log(`Found ${rides.length} rides in the database`);
      console.log('Rides data:', rides);
      setRides(rides);
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError('Failed to load rides. Please try again.');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRide = () => {
    navigate('/rides/create');
  };

  const handleEditRide = (rideId: string) => {
    navigate(`/admin/rides/${rideId}/edit`);
  };

  const handleDeleteRide = async (rideId: string) => {
    if (window.confirm('Are you sure you want to delete this ride?')) {
      try {
        await RideService.deleteRide(Number(rideId));
        setRides(rides.filter(ride => ride.id !== rideId));
      } catch (error) {
        console.error('Error deleting ride:', error);
        setError('Failed to delete ride. Please try again.');
      }
    }
  };

  return (
    <div className="p-6">
      <PageMeta
        title="RideShare Admin - Manage Rides"
        description="Admin interface for managing rides"
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Rides</h1>
        <Button onClick={handleCreateRide} className="bg-brand-500 hover:bg-brand-600">
          Create New Ride
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <RideList
            rides={rides}
            loading={loading}
            onBookRide={() => {}}
            isAdminView={true}
            onEditRide={handleEditRide}
            onDeleteRide={handleDeleteRide}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRides;
