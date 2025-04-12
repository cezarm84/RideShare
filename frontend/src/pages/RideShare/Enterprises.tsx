import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface Enterprise {
  id: string;
  name: string;
  type: 'corporate' | 'government' | 'educational' | 'other';
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  status: 'active' | 'inactive';
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise';
    startDate: string;
    endDate: string;
  };
  stats: {
    totalEmployees: number;
    activeUsers: number;
    totalRides: number;
  };
}

const Enterprises = () => {
  const { user } = useAuth();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const fetchEnterprises = async () => {
    try {
      // TODO: Implement enterprise service
      const mockEnterprises: Enterprise[] = [
        {
          id: '1',
          name: 'Tech Corp',
          type: 'corporate',
          contact: {
            name: 'Jane Smith',
            email: 'jane@techcorp.com',
            phone: '+1234567890',
          },
          status: 'active',
          subscription: {
            plan: 'enterprise',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          },
          stats: {
            totalEmployees: 500,
            activeUsers: 350,
            totalRides: 1200,
          },
        },
        // Add more mock data as needed
      ];
      setEnterprises(mockEnterprises);
    } catch (error) {
      console.error('Error fetching enterprises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnterprise = () => {
    // TODO: Implement enterprise creation modal/form
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Enterprises</h1>
        <Button onClick={handleAddEnterprise}>Add New Enterprise</Button>
      </div>

      <div className="grid gap-6">
        {enterprises.map((enterprise) => (
          <Card key={enterprise.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{enterprise.name}</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {enterprise.type}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600">
                    Contact: {enterprise.contact.name}
                  </p>
                  <p className="text-gray-600">{enterprise.contact.email}</p>
                  <p className="text-gray-600">{enterprise.contact.phone}</p>
                </div>
                <div className="mt-2">
                  <p className="text-gray-600">
                    Subscription: {enterprise.subscription.plan}
                  </p>
                  <p className="text-gray-600">
                    Valid until: {new Date(enterprise.subscription.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Usage Statistics</p>
                  <div className="mt-2">
                    <p className="text-sm">
                      Employees: {enterprise.stats.totalEmployees}
                    </p>
                    <p className="text-sm">
                      Active Users: {enterprise.stats.activeUsers}
                    </p>
                    <p className="text-sm">
                      Total Rides: {enterprise.stats.totalRides}
                    </p>
                  </div>
                </div>
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  enterprise.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {enterprise.status}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Enterprises; 