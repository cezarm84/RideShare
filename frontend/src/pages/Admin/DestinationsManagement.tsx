import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/services/api';

interface Destination {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  enterprise_id?: number;
  is_active: boolean;
}

interface Enterprise {
  id: number;
  name: string;
}

const DestinationsManagement = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Sweden',
    enterprise_id: '',
    description: '',
  });

  useEffect(() => {
    fetchDestinations();
    fetchEnterprises();
  }, []);

  const fetchDestinations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/destinations');
      setDestinations(response.data);
    } catch (err) {
      console.error('Error fetching destinations:', err);
      setError('Failed to load destinations. Please try again later.');
      // Use mock data for development
      setDestinations([
        {
          id: 1,
          name: 'Volvo Headquarters',
          address: 'Gropegårdsgatan 2',
          city: 'Gothenburg',
          postal_code: '41715',
          country: 'Sweden',
          latitude: 57.7156,
          longitude: 11.9923,
          enterprise_id: 1,
          is_active: true,
        },
        {
          id: 2,
          name: 'Landvetter Airport',
          address: 'Flygplatsvägen 82',
          city: 'Härryda',
          postal_code: '43832',
          country: 'Sweden',
          latitude: 57.6685,
          longitude: 12.2955,
          is_active: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnterprises = async () => {
    try {
      const response = await api.get('/admin/enterprises');
      setEnterprises(response.data);
    } catch (err) {
      console.error('Error fetching enterprises:', err);
      // Use mock data for development
      setEnterprises([
        { id: 1, name: 'Volvo' },
        { id: 2, name: 'Ericsson' },
      ]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
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
      await api.post('/admin/destinations', formData);
      setIsDialogOpen(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Sweden',
        enterprise_id: '',
        description: '',
      });
      fetchDestinations();
    } catch (err) {
      console.error('Error creating destination:', err);
      setError('Failed to create destination. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Destinations Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-500 hover:bg-brand-600">Add New Destination</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Destination</DialogTitle>
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
                <Label htmlFor="name">Destination Name</Label>
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
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="Sweden"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enterprise_id">Enterprise (Optional)</Label>
                <Select
                  value={formData.enterprise_id}
                  onValueChange={(value) => handleSelectChange('enterprise_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an enterprise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {enterprises.map((enterprise) => (
                      <SelectItem key={enterprise.id} value={enterprise.id.toString()}>
                        {enterprise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  {loading ? 'Creating...' : 'Create Destination'}
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
              <TableHead>Enterprise</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading destinations...
                </TableCell>
              </TableRow>
            ) : destinations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No destinations found
                </TableCell>
              </TableRow>
            ) : (
              destinations.map((destination) => (
                <TableRow key={destination.id}>
                  <TableCell>{destination.id}</TableCell>
                  <TableCell>{destination.name}</TableCell>
                  <TableCell>{destination.address}</TableCell>
                  <TableCell>{destination.city}</TableCell>
                  <TableCell>
                    {destination.enterprise_id
                      ? enterprises.find(e => e.id === destination.enterprise_id)?.name || 'Unknown'
                      : 'None'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        destination.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {destination.is_active ? 'Active' : 'Inactive'}
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

export default DestinationsManagement;
