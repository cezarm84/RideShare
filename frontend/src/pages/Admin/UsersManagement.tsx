import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import api from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  is_active: boolean;
  is_admin: boolean;
  is_superadmin: boolean;
  is_verified?: boolean;
  user_type: string;
  role?: string;
  created_at: string;
  enterprise_id?: number;
  enterprise_name?: string;
  driver_id?: number;
  license_number?: string;
  license_expiry?: string;
}

interface Enterprise {
  id: number;
  name: string;
  is_active: boolean;
}

interface NewUserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type: string;
  role: string;
  enterprise_id?: number;
  is_active: boolean;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();

  const [formData, setFormData] = useState<NewUserFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    user_type: 'enterprise',
    role: 'user',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
    fetchEnterprises();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try the admin/users endpoint first
      try {
        console.log('Fetching users from admin/users endpoint');
        const response = await api.get('/admin/users');
        console.log('Users data received:', response.data);
        setUsers(response.data);
        return;
      } catch (adminErr) {
        console.error('Error fetching from admin/users endpoint:', adminErr);

        // Try the regular users endpoint as fallback
        try {
          console.log('Trying fallback to /users endpoint with increased limit');
          // Use a much higher limit to get all users, including those with ID > 100
          const response = await api.get('/users?limit=1000');
          console.log('Users data received from fallback endpoint:', response.data);

          // Check if user 166 and user 3 are in the results
          const apiUsers = response.data;
          const hasUser166 = apiUsers.some((user: any) => user.id === 166);
          const hasUser3 = apiUsers.some((user: any) => user.id === 3);
          console.log('Does the API response include user 166?', hasUser166);
          console.log('Does the API response include user 3?', hasUser3);

          // Log details about user 3 and user 166 if they exist
          const user3 = apiUsers.find((user: any) => user.id === 3);
          const user166 = apiUsers.find((user: any) => user.id === 166);
          console.log('User 3 details:', user3);
          console.log('User 166 details:', user166);

          if (!hasUser166) {
            console.log('User 166 not found in paginated results, will be added separately by fetchDriverUsers');
          }

          setUsers(response.data);
          return;
        } catch (usersErr) {
          console.error('Error fetching from users endpoint:', usersErr);
          throw usersErr; // Re-throw to be caught by the outer catch
        }
      }
    } catch (err) {
      console.error('All attempts to fetch users failed:', err);
      setError('Failed to load users. Please try again later.');

      // Only use mock data if we got an empty response or a 404
      const mockUsers = [
        {
          id: 1,
          email: 'admin@rideshare.com',
          first_name: 'Admin',
          last_name: 'User',
          phone_number: '+46 70 123 4567',
          is_active: true,
          is_admin: true,
          is_superadmin: true,
          is_verified: true,
          user_type: 'admin',
          role: 'admin',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          email: 'john.doe@example.com',
          first_name: 'John',
          last_name: 'Doe',
          phone_number: '+46 70 987 6543',
          is_active: true,
          is_admin: false,
          is_superadmin: false,
          is_verified: true,
          user_type: 'passenger',
          role: 'user',
          created_at: '2023-01-02T00:00:00Z',
        },
        {
          id: 3,
          email: 'jane.smith@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          phone_number: '+46 70 555 1234',
          is_active: true,
          is_admin: false,
          is_superadmin: false,
          is_verified: true,
          user_type: 'driver',
          role: 'driver',
          created_at: '2023-01-03T00:00:00Z',
        },
        {
          id: 4,
          email: 'enterprise.user@volvo.com',
          first_name: 'Enterprise',
          last_name: 'User',
          phone_number: '+46 70 123 9876',
          is_active: true,
          is_admin: false,
          is_superadmin: false,
          is_verified: true,
          user_type: 'enterprise',
          role: 'manager',
          created_at: '2023-01-04T00:00:00Z',
          enterprise_id: 1,
          enterprise_name: 'Volvo AB',
        },
      ];

      // Only use mock data if we received a 404 (endpoint not found)
      if (err.response && err.response.status === 404) {
        console.log('Using mock user data since endpoint not found');
        setUsers(mockUsers);
      } else {
        // For other errors, set empty array to show 'No users found' message
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch driver users - removed as we now get all users from the API
  /*const fetchDriverUsers = async () => {
    console.log('Specifically looking for driver with user ID 166');

    // First, try to directly fetch the specific driver with user ID 166
    try {
      console.log('Directly fetching user with ID 166');
      const specificUserResponse = await api.get('/users/166');
      console.log('User 166 data received:', specificUserResponse.data);

      if (specificUserResponse.data) {
        // Now try to find the driver record for this user
        try {
          console.log('Fetching driver record for user ID 166');
          const driverResponse = await api.get('/drivers');
          console.log('All drivers data received:', driverResponse.data);

          // Find the driver record that has user_id = 166
          const driverRecord = driverResponse.data.find((driver: any) => driver.user_id === 166);
          console.log('Found driver record for user 166:', driverRecord);

          if (driverRecord) {
            // Create a complete driver user object
            const driverUser = {
              id: specificUserResponse.data.id,
              email: specificUserResponse.data.email,
              first_name: specificUserResponse.data.first_name || '',
              last_name: specificUserResponse.data.last_name || '',
              phone_number: specificUserResponse.data.phone_number || '',
              is_active: specificUserResponse.data.is_active,
              is_admin: specificUserResponse.data.is_admin || false,
              is_superadmin: specificUserResponse.data.is_superadmin || false,
              user_type: 'driver',
              role: 'driver',
              created_at: specificUserResponse.data.created_at,
              driver_id: driverRecord.id,
              license_number: driverRecord.license_number,
              license_expiry: driverRecord.license_expiry
            };

            console.log('Created driver user object:', driverUser);

            // Add this user to the users list with driver information
            setUsers(prevUsers => {
              // Check if this user is already in the list
              const existingUser = prevUsers.find(user => user.id === 166);
              if (!existingUser) {
                console.log('Adding user 166 with driver info to the users list');
                return [...prevUsers, driverUser];
              }
              return prevUsers;
            });
          }
        } catch (driverError) {
          console.error('Error fetching driver record for user 166:', driverError);
        }
      }
    } catch (userError) {
      console.error('Error fetching specific user 166:', userError);
    }

    // Continue with the regular driver fetching
    try {
      console.log('Fetching all drivers to extract user information');
      const response = await api.get('/drivers');
      console.log('All drivers data received:', response.data);

      if (response.data && response.data.length > 0) {
        // Extract user information from drivers
        const driverUsers = await Promise.all(response.data.map(async (driver: any) => {
          if (driver.user_id) {
            try {
              // Try to fetch user details for this driver
              const userResponse = await api.get(`/users/${driver.user_id}`);
              if (userResponse.data) {
                return {
                  ...userResponse.data,
                  user_type: 'driver',
                  role: 'driver',
                  driver_id: driver.id,
                  license_number: driver.license_number,
                  license_expiry: driver.license_expiry
                };
              }
            } catch (error) {
              console.error(`Error fetching user details for driver user ID ${driver.user_id}:`, error);
              // Create a minimal user object from driver data
              return {
                id: driver.user_id,
                email: driver.email,
                first_name: driver.first_name || '',
                last_name: driver.last_name || '',
                phone_number: driver.phone_number || '',
                is_active: driver.is_active || driver.status === 'active',
                is_admin: false,
                is_superadmin: false,
                user_type: 'driver',
                role: 'driver',
                created_at: driver.created_at || new Date().toISOString(),
                driver_id: driver.id,
                license_number: driver.license_number,
                license_expiry: driver.license_expiry
              };
            }
          }
          return null;
        }));

        // Filter out null values and add to users list
        const validDriverUsers = driverUsers.filter(user => user !== null);
        console.log('Valid driver users:', validDriverUsers);

        // Add driver users to the existing users list
        setUsers(prevUsers => {
          // Create a map of existing user IDs to avoid duplicates
          const existingUserIds = new Set(prevUsers.map(user => user.id));

          // Only add driver users that don't already exist in the users list
          const newDriverUsers = validDriverUsers.filter(user => !existingUserIds.has(user.id));

          return [...prevUsers, ...newDriverUsers];
        });
      }
    } catch (error) {
      console.error('Error fetching driver users:', error);
    }

    // We already tried to fetch user 166 at the beginning of this function
  };*/

  const fetchEnterprises = async () => {
    try {
      console.log('Fetching enterprises from API');
      const response = await api.get('/enterprises');
      console.log('Enterprises data received:', response.data);
      setEnterprises(response.data);
    } catch (err) {
      console.error('Failed to fetch enterprises:', err);

      // Mock data for development
      const mockEnterprises = [
        {
          id: 1,
          name: 'Volvo AB',
          is_active: true,
        },
        {
          id: 2,
          name: 'Ericsson',
          is_active: true,
        },
        {
          id: 3,
          name: 'IKEA',
          is_active: true,
        },
      ];

      // Only use mock data if we received a 404 (endpoint not found)
      if (err.response && err.response.status === 404) {
        console.log('Using mock enterprise data since endpoint not found');
        setEnterprises(mockEnterprises);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Prepare the data for the API
      const userData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        user_type: formData.user_type,
        role: formData.role,
        enterprise_id: formData.enterprise_id,
        is_active: formData.is_active
      };

      // Try to create the user
      try {
        console.log('Creating new user with data:', userData);
        const response = await api.post('/users', userData);
        console.log('User created successfully:', response.data);

        // Show success message
        toast({
          title: 'Success',
          description: 'User created successfully',
          variant: 'default',
        });

        // Close the dialog and refresh the users list
        setIsDialogOpen(false);
        fetchUsers();

        // Reset the form
        setFormData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          phone_number: '',
          user_type: 'enterprise',
          role: 'user',
          is_active: true
        });
      } catch (error) {
        console.error('Error creating user:', error);
        toast({
          title: 'Error',
          description: 'Failed to create user. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      console.log(`Updating user ${userId} status to ${newStatus ? 'active' : 'inactive'}`);

      // Try to update the user status
      try {
        await api.put(`/users/${userId}`, { is_active: newStatus });

        // Update the local state
        setUsers(prev =>
          prev.map(user =>
            user.id === userId ? { ...user, is_active: newStatus } : user
          )
        );

        toast({
          title: 'Success',
          description: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
          variant: 'default',
        });
      } catch (error) {
        console.error('Error updating user status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update user status. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  // Add a hardcoded driver user for ID 166 if it doesn't exist - removed as we now get all users from the API
  /*React.useEffect(() => {
    // Only run this once when the component mounts
    console.log('Adding hardcoded driver with ID 166');

    // Directly fetch the driver with ID 166
    const fetchDriver166 = async () => {
      try {
        // Try to fetch the real user data
        const userResponse = await api.get('/users/166');
        console.log('Successfully fetched user 166:', userResponse.data);

        // Try to fetch the driver record
        try {
          const driversResponse = await api.get('/drivers');
          const driverRecord = driversResponse.data.find((driver: any) => driver.user_id === 166);

          if (driverRecord) {
            console.log('Found driver record for user 166:', driverRecord);

            // Create a complete user object with driver info
            const driver166 = {
              ...userResponse.data,
              user_type: 'driver',
              role: 'driver',
              driver_id: driverRecord.id,
              license_number: driverRecord.license_number,
              license_expiry: driverRecord.license_expiry
            };

            // Add to users list
            setUsers(prevUsers => {
              // Check if this user is already in the list
              const existingUser = prevUsers.find(user => user.id === 166);
              if (!existingUser) {
                console.log('Adding real user 166 with driver info to the users list');
                return [...prevUsers, driver166];
              }
              return prevUsers;
            });
          } else {
            console.log('No driver record found for user 166, adding with default driver info');

            // Add user with default driver info
            setUsers(prevUsers => {
              // Check if this user is already in the list
              const existingUser = prevUsers.find(user => user.id === 166);
              if (!existingUser) {
                return [...prevUsers, {
                  ...userResponse.data,
                  user_type: 'driver',
                  role: 'driver',
                  driver_id: 1,
                  license_number: 'Unknown',
                  license_expiry: new Date().toISOString()
                }];
              }
              return prevUsers;
            });
          }
        } catch (driverError) {
          console.error('Error fetching driver record for user 166:', driverError);

          // Add user with default driver info
          setUsers(prevUsers => {
            // Check if this user is already in the list
            const existingUser = prevUsers.find(user => user.id === 166);
            if (!existingUser) {
              return [...prevUsers, {
                ...userResponse.data,
                user_type: 'driver',
                role: 'driver',
                driver_id: 1,
                license_number: 'Unknown',
                license_expiry: new Date().toISOString()
              }];
            }
            return prevUsers;
          });
        }
      } catch (userError) {
        console.error('Error fetching user 166, adding hardcoded entry:', userError);

        // Add a hardcoded entry for user 166
        setUsers(prevUsers => {
          // Check if this user is already in the list
          const existingUser = prevUsers.find(user => user.id === 166);
          if (!existingUser) {
            return [...prevUsers, {
              id: 166,
              email: 'driver166@rideshare.com',
              first_name: 'Olof',
              last_name: 'Driver',
              phone_number: '+46 70 166 1666',
              is_active: true,
              is_admin: false,
              is_superadmin: false,
              user_type: 'driver',
              role: 'driver',
              created_at: new Date().toISOString(),
              driver_id: 1,
              license_number: 'DL-166-2023',
              license_expiry: '2025-12-31'
            }];
          }
          return prevUsers;
        });
      }
    };

    fetchDriver166();
  }, []);*/

  // Special handling for filtering users
  const filteredUsers = React.useMemo(() => {
    // If showing all users, return the complete list
    if (roleFilter === 'all') {
      return users;
    }

    // For driver filter, log details about filtering
    if (roleFilter === 'driver') {
      console.log('Filtering for drivers, checking users:', users);

      // Check if user 3 and user 166 would be included in the filter
      const user3 = users.find(user => user.id === 3);
      const user166 = users.find(user => user.id === 166);

      if (user3) {
        console.log('User 3 driver check:',
          'user_type:', user3.user_type,
          'role:', user3.role,
          'Would be included:', user3.user_type === 'driver' || user3.role === 'driver');
      }

      if (user166) {
        console.log('User 166 driver check:',
          'user_type:', user166.user_type,
          'role:', user166.role,
          'Would be included:', user166.user_type === 'driver' || user166.role === 'driver');
      }
    }

    // For all filters, use standard filtering with special handling for missing fields
    return users.filter(user => {
      // Handle case where role might be undefined but user_type is set
      if (roleFilter === 'driver' && user.user_type === 'driver') {
        return true;
      }

      // Standard filtering
      return user.user_type === roleFilter || (user.role && user.role === roleFilter);
    });
  }, [users, roleFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Users Management</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="role-filter">Filter by role:</Label>
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value)}>
              <SelectTrigger id="role-filter" className="w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="enterprise">Enterprise Users</SelectItem>
                <SelectItem value="driver">Drivers</SelectItem>
                <SelectItem value="passenger">Regular Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-500 hover:bg-brand-600">Add Enterprise User</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Enterprise User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* User Information */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
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

                  {/* Enterprise Information */}
                  <div className="space-y-2">
                    <Label htmlFor="enterprise_id">Enterprise</Label>
                    <Select
                      value={formData.enterprise_id?.toString() || ''}
                      onValueChange={(value) => handleSelectChange('enterprise_id', value)}
                    >
                      <SelectTrigger id="enterprise_id">
                        <SelectValue placeholder="Select enterprise" />
                      </SelectTrigger>
                      <SelectContent>
                        {enterprises.map(enterprise => (
                          <SelectItem key={enterprise.id} value={enterprise.id.toString()}>
                            {enterprise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleSelectChange('role', value)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Regular User</SelectItem>
                        <SelectItem value="manager">Enterprise Manager</SelectItem>
                      </SelectContent>
                    </Select>
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
                    {submitting ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
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
                <th className="h-10 px-2 text-left font-medium">Role</th>
                <th className="h-10 px-2 text-left font-medium">Details</th>
                <th className="h-10 px-2 text-center font-medium">Status</th>
                <th className="h-10 px-2 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2 align-middle">
                      <div className="font-medium">#{user.id}</div>
                    </td>
                    <td className="p-2 align-middle">
                      <div>
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="p-2 align-middle">
                      <div>{user.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.phone_number || 'No phone'}
                      </div>
                    </td>
                    <td className="p-2 align-middle">
                      <div className="capitalize">{user.user_type}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {user.role || (user.is_superadmin ? 'superadmin' : user.is_admin ? 'admin' : 'user')}
                      </div>
                      {user.user_type === 'driver' && user.driver_id && (
                        <div className="text-xs text-muted-foreground">
                          Driver ID: {user.driver_id}
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-middle">
                      {user.user_type === 'enterprise' ? (
                        user.enterprise_name || (user.enterprise_id ? `ID: ${user.enterprise_id}` : 'N/A')
                      ) : user.user_type === 'driver' ? (
                        <div>
                          <div className="text-xs">{user.license_number || 'No license'}</div>
                          {user.license_expiry && (
                            <div className="text-xs text-muted-foreground">
                              Expires: {new Date(user.license_expiry).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td className="p-2 align-middle text-center">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-2 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          Edit
                        </Button>
                        <div className="flex items-center gap-1">
                          <Switch
                            id={`user-status-${user.id}`}
                            checked={user.is_active}
                            onCheckedChange={() => toggleUserStatus(user.id, user.is_active)}
                          />
                          <Label htmlFor={`user-status-${user.id}`} className="text-xs">
                            {user.is_active ? 'Active' : 'Inactive'}
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

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-lg font-semibold">User Information</Label>
                </div>
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {editingUser.id}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {editingUser.first_name} {editingUser.last_name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {editingUser.email}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {editingUser.phone_number || 'No phone'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>User Type</Label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded capitalize">
                    {editingUser.user_type}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded capitalize">
                    {editingUser.role || (editingUser.is_superadmin ? 'superadmin' : editingUser.is_admin ? 'admin' : 'user')}
                  </div>
                </div>
                {editingUser.user_type === 'enterprise' && (
                  <div className="space-y-2">
                    <Label>Enterprise</Label>
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {editingUser.enterprise_name || (editingUser.enterprise_id ? `ID: ${editingUser.enterprise_id}` : 'N/A')}
                    </div>
                  </div>
                )}
                {editingUser.user_type === 'driver' && (
                  <>
                    <div className="space-y-2">
                      <Label>Driver ID</Label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {editingUser.driver_id || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>License</Label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {editingUser.license_number || 'No license'}
                      </div>
                    </div>
                    {editingUser.license_expiry && (
                      <div className="space-y-2">
                        <Label>License Expiry</Label>
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          {new Date(editingUser.license_expiry).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-is-active"
                      checked={editingUser.is_active}
                      onCheckedChange={() => toggleUserStatus(editingUser.id, editingUser.is_active)}
                    />
                    <Label htmlFor="edit-is-active">
                      {editingUser.is_active ? 'Active' : 'Inactive'}
                    </Label>
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
  );
};

export default UsersManagement;
