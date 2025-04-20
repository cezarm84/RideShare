import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/services/api';

interface Hub {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  is_active: boolean;
}

const HubsManagement = () => {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    description: '',
  });

  useEffect(() => {
    fetchHubs();
  }, []);

  // Mock data for development
  const mockHubs = [
    {
      id: 1,
      name: 'Central Station',
      address: 'Drottningtorget 5',
      city: 'Gothenburg',
      postal_code: '41103',
      latitude: 57.7089,
      longitude: 11.9746,
      description: 'Main transportation hub in central Gothenburg',
      is_active: true,
    },
    {
      id: 2,
      name: 'Lindholmen',
      address: 'Lindholmspiren 7',
      city: 'Gothenburg',
      postal_code: '41756',
      latitude: 57.7075,
      longitude: 11.9386,
      description: 'Tech hub on Hisingen',
      is_active: true,
    },
    {
      id: 3,
      name: 'Landvetter Airport',
      address: 'Flygplatsvägen 82',
      city: 'Härryda',
      postal_code: '43832',
      latitude: 57.6685,
      longitude: 12.2955,
      description: 'International airport serving Gothenburg',
      is_active: true,
    },
  ];

  const fetchHubs = async () => {
    setLoading(true);
    setError(null);

    // Check if using mock admin token
    const token = localStorage.getItem('token');
    const isMockToken = token && token.startsWith('mock_admin_token_');

    if (isMockToken) {
      console.log('Using mock admin token - loading mock hubs data');
      // Use mock data for development with mock token
      setTimeout(() => {
        setHubs(mockHubs);
        setLoading(false);
      }, 500); // Add a small delay to simulate API call
      return;
    }

    try {
      console.log('Fetching hubs from API...');
      const response = await api.get('/admin/hubs');
      console.log('Hubs data received:', response.data);
      setHubs(response.data);
    } catch (err: any) {
      console.error('Error fetching hubs:', err);

      // Check for specific error types
      if (err.message.includes('Network Error')) {
        setError('Network error: Unable to connect to the server. Please check your connection.');
      } else if (err.response && err.response.status === 401) {
        setError('Authentication error: Please sign in again.');
      } else if (err.response && err.response.status === 403) {
        setError('Access denied: You do not have permission to view hubs.');
      } else if (err.response && err.response.status === 404) {
        setError('Endpoint not found: The requested resource does not exist.');
      } else {
        setError('Failed to load hubs. Using mock data for development.');
      }

      // Use mock data for development
      console.log('Using mock hubs data');
      setHubs(mockHubs);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log('Creating new hub with data:', formData);
      await api.post('/admin/hubs', formData);
      setIsDialogOpen(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        postal_code: '',
        description: '',
      });

      // Show success message
      console.log('Hub created successfully');

      // Refresh the hubs list
      fetchHubs();
    } catch (err: any) {
      console.error('Error creating hub:', err);

      // Check for specific error types
      if (err.message.includes('Network Error')) {
        setError('Network error: Unable to connect to the server. Please check your connection.');
      } else if (err.response && err.response.status === 401) {
        setError('Authentication error: Please sign in again.');
      } else if (err.response && err.response.status === 403) {
        setError('Access denied: You do not have permission to create hubs.');
      } else if (err.response && err.response.status === 422) {
        setError('Validation error: Please check your input data.');
      } else {
        setError('Failed to create hub. Please try again.');
      }

      // For development: Simulate successful creation with mock data
      if (localStorage.getItem('token')?.startsWith('mock_admin_token_')) {
        console.log('Using mock data: Simulating successful hub creation');
        setIsDialogOpen(false);
        setFormData({
          name: '',
          address: '',
          city: '',
          postal_code: '',
          description: '',
        });

        // Add the new hub to the mock data
        const newHub = {
          id: mockHubs.length + 1,
          name: formData.name,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code || '',
          description: formData.description || '',
          is_active: true,
        };

        setHubs([...mockHubs, newHub]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Hubs Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-500 hover:bg-brand-600">Add New Hub</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Hub</DialogTitle>
            </DialogHeader>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hub Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-500 hover:bg-brand-600"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Hub'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  Loading hubs...
                </TableCell>
              </TableRow>
            ) : hubs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No hubs found
                </TableCell>
              </TableRow>
            ) : (
              hubs.map((hub) => (
                <TableRow key={hub.id}>
                  <TableCell>{hub.id}</TableCell>
                  <TableCell>{hub.name}</TableCell>
                  <TableCell>{hub.address}</TableCell>
                  <TableCell>{hub.city}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        hub.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {hub.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500">
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default HubsManagement;
