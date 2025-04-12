import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  rating: number;
  totalRides: number;
  vehicle: {
    model: string;
    plateNumber: string;
  };
}

const Drivers = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      // TODO: Implement driver service
      const mockDrivers: Driver[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          status: 'active',
          rating: 4.5,
          totalRides: 150,
          vehicle: {
            model: 'Toyota Camry',
            plateNumber: 'ABC123',
          },
        },
        // Add more mock data as needed
      ];
      setDrivers(mockDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDriver = async (driverId: string) => {
    try {
      // TODO: Implement driver verification
      console.log('Verifying driver:', driverId);
    } catch (error) {
      console.error('Error verifying driver:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Drivers</h1>
        <Button>Add New Driver</Button>
      </div>

      <div className="grid gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{driver.name}</h3>
                <p className="text-gray-600 mt-1">{driver.email}</p>
                <p className="text-gray-600">{driver.phone}</p>
                <p className="text-gray-600">
                  Vehicle: {driver.vehicle.model} ({driver.vehicle.plateNumber})
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end mb-2">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span className="font-semibold">{driver.rating}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {driver.totalRides} rides completed
                </p>
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  driver.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {driver.status}
                </span>
                {driver.status === 'inactive' && (
                  <Button
                    className="mt-2"
                    onClick={() => handleVerifyDriver(driver.id)}
                  >
                    Verify Driver
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Drivers;
