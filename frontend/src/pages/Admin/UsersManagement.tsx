import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_admin: boolean;
  is_superadmin: boolean;
  user_type: string;
  created_at: string;
}

const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
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
          console.log('Trying fallback to /users endpoint');
          const response = await api.get('/users');
          console.log('Users data received from fallback endpoint:', response.data);
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
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          is_active: true,
          is_admin: true,
          is_superadmin: true,
          user_type: 'admin',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 2,
          email: 'john.doe@example.com',
          first_name: 'John',
          last_name: 'Doe',
          is_active: true,
          is_admin: false,
          is_superadmin: false,
          user_type: 'passenger',
          created_at: '2023-01-02T00:00:00Z',
        },
        {
          id: 3,
          email: 'jane.smith@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          is_active: true,
          is_admin: false,
          is_superadmin: false,
          user_type: 'driver',
          created_at: '2023-01-03T00:00:00Z',
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Users Management</h2>
        <Button className="bg-brand-500 hover:bg-brand-600">Add New User</Button>
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
              <TableHead>Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{`${user.first_name} ${user.last_name}`}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className="capitalize">{user.user_type}</span>
                  </TableCell>
                  <TableCell>
                    {user.is_superadmin
                      ? 'Superadmin'
                      : user.is_admin
                      ? 'Admin'
                      : 'User'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500">
                        Deactivate
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

export default UsersManagement;
