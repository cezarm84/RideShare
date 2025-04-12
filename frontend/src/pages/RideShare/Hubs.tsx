import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface Hub {
  id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  status: 'active' | 'inactive';
  capacity: number;
  currentOccupancy: number;
  facilities: string[];
}

const Hubs = () => {
  const { user } = useAuth();
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      // TODO: Implement hub service
      const mockHubs: Hub[] = [
        {
          id: '1',
          name: 'Central Hub',
          location: {
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            country: 'USA',
            coordinates: {
              lat: 40.7128,
              lng: -74.0060,
            },
          },
          status: 'active',
          capacity: 100,
          currentOccupancy: 75,
          facilities: ['Parking', 'Restrooms', 'WiFi', 'Charging Stations'],
        },
        // Add more mock data as needed
      ];
      setHubs(mockHubs);
    } catch (error) {
      console.error('Error fetching hubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHub = () => {
    // TODO: Implement hub creation modal/form
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hubs</h1>
        <Button onClick={handleAddHub}>Add New Hub</Button>
      </div>

      <div className="grid gap-6">
        {hubs.map((hub) => (
          <Card key={hub.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{hub.name}</h3>
                <p className="text-gray-600 mt-1">
                  {hub.location.address}, {hub.location.city}, {hub.location.state}
                </p>
                <p className="text-gray-600">{hub.location.country}</p>
                <div className="mt-2">
                  <h4 className="font-medium">Facilities:</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {hub.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Occupancy</p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(hub.currentOccupancy / hub.capacity) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {hub.currentOccupancy}/{hub.capacity}
                  </p>
                </div>
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  hub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hub.status}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Hubs; 