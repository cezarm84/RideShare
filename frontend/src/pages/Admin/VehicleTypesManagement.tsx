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

interface VehicleType {
  id: number;
  name: string;
  description: string;
  capacity: number;
  is_active: boolean;
  price_factor: number;
}

const VehicleTypesManagement = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '4',
    price_factor: '1.0',
  });

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/vehicle-types');
      setVehicleTypes(response.data);
    } catch (err) {
      console.error('Error fetching vehicle types:', err);
      setError('Failed to load vehicle types. Please try again later.');
      // Use mock data for development
      setVehicleTypes([
        {
          id: 1,
          name: 'Sedan',
          description: 'Standard 4-door sedan',
          capacity: 4,
          is_active: true,
          price_factor: 1.0,
        },
        {
          id: 2,
          name: 'SUV',
          description: 'Sport utility vehicle with extra space',
          capacity: 6,
          is_active: true,
          price_factor: 1.2,
        },
        {
          id: 3,
          name: 'Minivan',
          description: 'Larger vehicle for groups',
          capacity: 8,
          is_active: true,
          price_factor: 1.5,
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
      const payload = {
        ...formData,
        capacity: parseInt(formData.capacity),
        price_factor: parseFloat(formData.price_factor),
      };
      await api.post('/admin/vehicle-types', payload);
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        capacity: '4',
        price_factor: '1.0',
      });
      fetchVehicleTypes();
    } catch (err) {
      console.error('Error creating vehicle type:', err);
      setError('Failed to create vehicle type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Vehicle Types Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-500 hover:bg-brand-600">Add New Vehicle Type</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Vehicle Type</DialogTitle>
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
                <Label htmlFor="name">Vehicle Type Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (Seats)</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_factor">Price Factor</Label>
                  <Input
                    id="price_factor"
                    name="price_factor"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.price_factor}
                    onChange={handleInputChange}
                    required
                  />
                </div>
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
                  {loading ? 'Creating...' : 'Create Vehicle Type'}
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
              <TableHead>Description</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Price Factor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading vehicle types...
                </TableCell>
              </TableRow>
            ) : vehicleTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No vehicle types found
                </TableCell>
              </TableRow>
            ) : (
              vehicleTypes.map((vehicleType) => (
                <TableRow key={vehicleType.id}>
                  <TableCell>{vehicleType.id}</TableCell>
                  <TableCell>{vehicleType.name}</TableCell>
                  <TableCell>{vehicleType.description}</TableCell>
                  <TableCell>{vehicleType.capacity}</TableCell>
                  <TableCell>{vehicleType.price_factor.toFixed(1)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        vehicleType.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {vehicleType.is_active ? 'Active' : 'Inactive'}
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

export default VehicleTypesManagement;
