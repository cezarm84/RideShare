import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

interface Driver {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  license_number: string;
  license_expiry: string;
  rating: number;
  is_active: boolean;
  created_at: string;
  user?: User; // Optional user details
}

interface NewDriverFormData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  license_number: string;
  license_expiry: string;
  license_country: string;
  license_class: string;
  is_active: boolean;
}

const DriversManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState<NewDriverFormData>({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    license_number: '',
    license_expiry: new Date().toISOString().split('T')[0],
    license_country: 'Sweden',
    license_class: 'B',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Function to fetch user details for a driver
  const fetchUserDetails = async (userId: number): Promise<User | null> => {
    try {
      console.log(`Fetching user details for user ID: ${userId}`);
      const response = await api.get(`/users/${userId}`);
      console.log(`User details received for user ID ${userId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user details for user ID ${userId}:`, error);
      return null;
    }
  };

  // Function to enhance drivers with user details
  const enhanceDriversWithUserDetails = async (drivers: Driver[]): Promise<Driver[]> => {
    const enhancedDrivers = await Promise.all(
      drivers.map(async (driver) => {
        if (driver.user_id) {
          const userDetails = await fetchUserDetails(driver.user_id);
          if (userDetails) {
            return {
              ...driver,
              user: userDetails,
              // If driver doesn't have these fields, use the user's fields
              first_name: driver.first_name || userDetails.first_name,
              last_name: driver.last_name || userDetails.last_name,
              phone_number: driver.phone_number || userDetails.phone_number
            };
          }
        }
        return driver;
      })
    );
    return enhancedDrivers;
  };

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try the admin/drivers endpoint first
      try {
        console.log('Fetching drivers from admin/drivers endpoint');
        const response = await api.get('/admin/drivers');
        console.log('Drivers data received:', response.data);
        const enhancedDrivers = await enhanceDriversWithUserDetails(response.data);
        setDrivers(enhancedDrivers);
        return;
      } catch (adminErr) {
        console.error('Error fetching from admin/drivers endpoint:', adminErr);

        // Try the regular drivers endpoint as fallback
        try {
          console.log('Trying fallback to /drivers endpoint');
          const response = await api.get('/drivers');
          console.log('Drivers data received from fallback endpoint:', response.data);
          console.log('Driver user IDs:', response.data.map((driver: any) => driver.user_id));

          // Also fetch users with user_type = 'driver' who might not have a driver record
          console.log('Fetching users with user_type = driver');
          const usersResponse = await api.get('/users?limit=1000');
          const driverUsers = usersResponse.data.filter((user: any) => user.user_type === 'driver');
          console.log('Users with user_type = driver:', driverUsers);

          // Create driver records for users who don't have one
          const existingDriverUserIds = new Set(response.data.map((driver: any) => driver.user_id));
          const usersWithoutDriverRecord = driverUsers.filter((user: any) => !existingDriverUserIds.has(user.id));
          console.log('Users with user_type = driver but no driver record:', usersWithoutDriverRecord);

          // Create synthetic driver records for these users
          const syntheticDrivers = usersWithoutDriverRecord.map((user: any) => ({
            id: -user.id, // Use negative ID to avoid conflicts with real driver IDs
            user_id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_number: user.phone_number,
            license_number: 'Not provided',
            license_expiry: new Date().toISOString(),
            rating: null,
            is_active: user.is_active,
            created_at: user.created_at,
            status: user.is_active ? 'active' : 'inactive',
            user: user, // Include the full user object
            synthetic: true // Mark as synthetic for UI differentiation
          }));

          // Combine real drivers with synthetic ones
          const allDrivers = [...response.data, ...syntheticDrivers];
          console.log('Combined drivers list:', allDrivers);

          const enhancedDrivers = await enhanceDriversWithUserDetails(allDrivers);
          setDrivers(enhancedDrivers);
          return;
        } catch (driversErr) {
          console.error('Error fetching from drivers endpoint:', driversErr);
          throw driversErr; // Re-throw to be caught by the outer catch
        }
      }
    } catch (err) {
      console.error('All attempts to fetch drivers failed:', err);
      setError('Failed to load drivers. Please try again later.');

      // Mock data for development
      const mockDrivers = [
        {
          id: 1,
          user_id: 3,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          phone_number: '+46 70 123 4567',
          license_number: 'DL12345678',
          license_expiry: '2025-12-31',
          rating: 4.8,
          is_active: true,
          created_at: '2023-01-03T00:00:00Z',
        },
        {
          id: 2,
          user_id: 4,
          first_name: 'Michael',
          last_name: 'Johnson',
          email: 'michael.johnson@example.com',
          phone_number: '+46 70 987 6543',
          license_number: 'DL87654321',
          license_expiry: '2024-10-15',
          rating: 4.5,
          is_active: true,
          created_at: '2023-02-15T00:00:00Z',
        },
      ];

      // Only use mock data if we received a 404 (endpoint not found)
      if (err.response && err.response.status === 404) {
        console.log('Using mock driver data since endpoint not found');
        setDrivers(mockDrivers);
      } else {
        // For other errors, set empty array to show 'No drivers found' message
        setDrivers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to generate a unique driver email
  const generateUniqueDriverEmail = (firstName: string, lastName: string): string => {
    if (!firstName || !lastName) return '';

    // Create a standardized email address for drivers
    const baseEmailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
      .normalize('NFD') // Normalize diacritical marks
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
      .replace(/[^a-z0-9.]/g, ''); // Remove any non-alphanumeric characters except dots

    // Check if this email already exists in the drivers list
    let emailPrefix = baseEmailPrefix;
    let counter = 1;
    let email = `${emailPrefix}@driver.rideshare.com`;

    // Check if this email already exists in the drivers list
    while (drivers.some(driver => driver.email === email)) {
      // If it exists, add a number to make it unique
      emailPrefix = `${baseEmailPrefix}${counter}`;
      email = `${emailPrefix}@driver.rideshare.com`;
      counter++;
    }

    return email;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    // Auto-generate email when first_name or last_name changes
    if (name === 'first_name' || name === 'last_name') {
      const firstName = name === 'first_name' ? value : formData.first_name;
      const lastName = name === 'last_name' ? value : formData.last_name;

      if (firstName && lastName) {
        newFormData.email = generateUniqueDriverEmail(firstName, lastName);
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Generate a random temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-4);

      // Prepare the data for the API
      const driverData = {
        email: formData.email,
        password: tempPassword, // Include a random password that the driver will change later
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        license_number: formData.license_number,
        license_expiry: formData.license_expiry,
        license_state: 'Västra Götaland', // Default value for Sweden
        license_country: formData.license_country,
        license_class: formData.license_class,
        is_active: formData.is_active
      };

      // Try to create the driver
      try {
        console.log('Creating new driver with data:', driverData);
        const response = await api.post('/drivers/with-user', driverData);
        console.log('Driver created successfully:', response.data);

        // Show success message
        toast({
          title: 'Success',
          description: 'Driver created successfully. An email with temporary password has been sent to the driver.',
          variant: 'default',
        });

        // Close the dialog and refresh the drivers list
        setIsDialogOpen(false);
        fetchDrivers();

        // Reset the form
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          license_number: '',
          license_expiry: new Date().toISOString().split('T')[0],
          license_country: 'Sweden',
          license_class: 'B',
          is_active: true
        });
      } catch (error) {
        console.error('Error creating driver:', error);
        toast({
          title: 'Error',
          description: 'Failed to create driver. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setIsEditDialogOpen(true);
  };

  // Function to create a driver record for an existing user
  const createDriverForExistingUser = async (userId: number) => {
    try {
      // Prepare the data for the API
      const driverData = {
        user_id: userId,
        license_number: 'DL-TEST-2023',
        license_expiry: '2025-12-31',
        license_state: 'Västra Götaland',
        license_country: 'Sweden',
        license_class: 'B',
        preferred_radius_km: 15.0,
        max_passengers: 4,
        bio: 'Test driver with real driver record',
        languages: 'Swedish, English'
      };

      console.log(`Creating driver record for existing user ID ${userId}:`, driverData);
      const response = await api.post('/drivers', driverData);
      console.log('Driver record created successfully:', response.data);

      toast({
        title: 'Success',
        description: `Driver record created for user ID ${userId}`,
        variant: 'default',
      });

      // Refresh the drivers list
      fetchDrivers();
    } catch (error) {
      console.error(`Error creating driver record for user ID ${userId}:`, error);
      toast({
        title: 'Error',
        description: `Failed to create driver record for user ID ${userId}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Call this function to create a driver record for user ID 3
  useEffect(() => {
    // Only run once when the component mounts
    const createDriverForUser3 = async () => {
      try {
        // Check if user 3 already has a driver record
        const response = await api.get('/drivers');
        const existingDrivers = response.data;
        const hasDriverRecord = existingDrivers.some((driver: any) => driver.user_id === 3);

        if (!hasDriverRecord) {
          console.log('User ID 3 does not have a driver record. Creating one...');
          await createDriverForExistingUser(3);
        } else {
          console.log('User ID 3 already has a driver record.');
        }
      } catch (error) {
        console.error('Error checking if user 3 has a driver record:', error);
      }
    };

    createDriverForUser3();
  }, []);

  const toggleDriverStatus = async (driverId: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const statusValue = newStatus ? 'active' : 'inactive';
      console.log(`Updating driver ${driverId} status to ${statusValue}`);

      // Try to update the driver status
      try {
        // Update the driver status using the status endpoint
        const response = await api.put(`/drivers/${driverId}/status?status=${statusValue}`);
        console.log('Status update response:', response.data);

        // Update the local state
        setDrivers(prev =>
          prev.map(driver =>
            driver.id === driverId ? {
              ...driver,
              is_active: newStatus,
              status: statusValue
            } : driver
          )
        );

        toast({
          title: 'Success',
          description: `Driver ${newStatus ? 'activated' : 'deactivated'} successfully`,
          variant: 'default',
        });

        // Refresh the drivers list to ensure we have the latest data
        fetchDrivers();
      } catch (error) {
        console.error('Error updating driver status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update driver status. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling driver status:', error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Drivers Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-500 hover:bg-brand-600">Add New Driver</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Driver</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* User Information */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="email">Driver Email (Auto-generated)</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    className="bg-gray-100 dark:bg-gray-800"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This standardized email will be used for driver login. A temporary password will be generated and sent to this email address.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Driver Information */}
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_expiry">License Expiry</Label>
                  <Input
                    id="license_expiry"
                    name="license_expiry"
                    type="date"
                    value={formData.license_expiry}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_country">License Country</Label>
                  <Input
                    id="license_country"
                    name="license_country"
                    value={formData.license_country}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_class">License Class</Label>
                  <Input
                    id="license_class"
                    name="license_class"
                    value={formData.license_class}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2 flex items-center">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Driver'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Driver Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Driver</DialogTitle>
            </DialogHeader>
            {editingDriver && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-lg font-semibold">Driver Information</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Driver ID</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {editingDriver.id}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {editingDriver.user_id}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {editingDriver.first_name && editingDriver.last_name
                        ? `${editingDriver.first_name} ${editingDriver.last_name}`
                        : editingDriver.user?.first_name && editingDriver.user?.last_name
                          ? `${editingDriver.user.first_name} ${editingDriver.user.last_name}`
                          : 'Unknown'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {editingDriver.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {editingDriver.phone_number || editingDriver.user?.phone_number || 'No phone'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-is-active"
                        checked={editingDriver.status === 'active' || editingDriver.is_active}
                        onCheckedChange={() => toggleDriverStatus(editingDriver.id, editingDriver.status === 'active' || editingDriver.is_active)}
                      />
                      <Label htmlFor="edit-is-active">
                        {editingDriver.status === 'active' || editingDriver.is_active ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-lg font-semibold mt-4">License Information</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>License Number</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {editingDriver.license_number}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>License Expiry</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {new Date(editingDriver.license_expiry).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded flex items-center">
                      <span className="text-yellow-500 mr-1">★</span>
                      {editingDriver.rating ? editingDriver.rating.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
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

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-2 text-left font-medium">ID</th>
                <th className="h-10 px-2 text-left font-medium">Name</th>
                <th className="h-10 px-2 text-left font-medium">Contact</th>
                <th className="h-10 px-2 text-left font-medium">License</th>
                <th className="h-10 px-2 text-center font-medium">Rating</th>
                <th className="h-10 px-2 text-center font-medium">Status</th>
                <th className="h-10 px-2 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">Loading drivers...</td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">No drivers found</td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className={`border-b ${driver.synthetic ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}>
                    <td className="p-2 align-middle">
                      <div className="font-medium">#{driver.id}</div>
                      <div className="text-xs text-muted-foreground">User: {driver.user_id}</div>
                      {driver.synthetic && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                          User marked as driver but no driver record exists
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-middle">
                      <div>
                        {driver.first_name && driver.last_name
                          ? `${driver.first_name} ${driver.last_name}`
                          : driver.user?.first_name && driver.user?.last_name
                            ? `${driver.user.first_name} ${driver.user.last_name}`
                            : `Unknown`
                        }
                      </div>
                    </td>
                    <td className="p-2 align-middle">
                      <div>{driver.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {driver.phone_number || driver.user?.phone_number || 'No phone'}
                      </div>
                    </td>
                    <td className="p-2 align-middle">
                      {driver.synthetic ? (
                        <div className="text-muted-foreground italic">Not provided</div>
                      ) : (
                        <>
                          <div>{driver.license_number}</div>
                          <div className="text-xs text-muted-foreground">
                            Expires: {new Date(driver.license_expiry).toLocaleDateString()}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="p-2 align-middle text-center">
                      <div className="inline-flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        {driver.rating ? driver.rating.toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td className="p-2 align-middle text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          driver.status === 'active' || driver.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {driver.status === 'active' || driver.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-2 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDriver(driver)}
                        >
                          Edit
                        </Button>
                        <div className="flex items-center gap-1">
                          <Switch
                            id={`driver-status-${driver.id}`}
                            checked={driver.status === 'active' || driver.is_active}
                            onCheckedChange={() => toggleDriverStatus(driver.id, driver.status === 'active' || driver.is_active)}
                          />
                          <Label htmlFor={`driver-status-${driver.id}`} className="text-xs">
                            {driver.status === 'active' || driver.is_active ? 'Active' : 'Inactive'}
                          </Label>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DriversManagement;
