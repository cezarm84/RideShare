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

interface Enterprise {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code?: string;
  country?: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  is_active: boolean;
}

const EnterprisesManagement = () => {
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
    contact_email: '',
    contact_phone: '',
    description: '',
  });

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const fetchEnterprises = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/enterprises');
      setEnterprises(response.data);
    } catch (err) {
      console.error('Error fetching enterprises:', err);
      setError('Failed to load enterprises. Please try again later.');
      // Use mock data for development
      setEnterprises([
        {
          id: 1,
          name: 'Volvo',
          address: 'Gropegårdsgatan 2',
          city: 'Gothenburg',
          postal_code: '41715',
          country: 'Sweden',
          contact_email: 'transport@volvo.com',
          contact_phone: '+46 31 123 4567',
          description: 'Volvo Cars transportation services',
          is_active: true,
        },
        {
          id: 2,
          name: 'Ericsson',
          address: 'Lindholmspiren 11',
          city: 'Gothenburg',
          postal_code: '41756',
          country: 'Sweden',
          contact_email: 'transport@ericsson.com',
          contact_phone: '+46 31 987 6543',
          description: 'Ericsson employee transportation',
          is_active: true,
        },
      ]);
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
      await api.post('/admin/enterprises', formData);
      setIsDialogOpen(false);
      setFormData({
        name: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Sweden',
        contact_email: '',
        contact_phone: '',
        description: '',
      });
      fetchEnterprises();
    } catch (err) {
      console.error('Error creating enterprise:', err);
      setError('Failed to create enterprise. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Enterprises Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-500 hover:bg-brand-600">Add New Enterprise</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Enterprise</DialogTitle>
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
                <Label htmlFor="name">Enterprise Name</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
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
                  {loading ? 'Creating...' : 'Create Enterprise'}
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
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading enterprises...
                </TableCell>
              </TableRow>
            ) : enterprises.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No enterprises found
                </TableCell>
              </TableRow>
            ) : (
              enterprises.map((enterprise) => (
                <TableRow key={enterprise.id}>
                  <TableCell>{enterprise.id}</TableCell>
                  <TableCell>{enterprise.name}</TableCell>
                  <TableCell>{enterprise.address}</TableCell>
                  <TableCell>{enterprise.city}</TableCell>
                  <TableCell>
                    {enterprise.contact_email && (
                      <div className="text-sm">{enterprise.contact_email}</div>
                    )}
                    {enterprise.contact_phone && (
                      <div className="text-sm text-gray-500">{enterprise.contact_phone}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        enterprise.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {enterprise.is_active ? 'Active' : 'Inactive'}
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

export default EnterprisesManagement;
