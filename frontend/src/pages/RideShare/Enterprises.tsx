import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { Search, Filter, Building2, MapPin, Users, Activity, AlertCircle, Plus, X } from 'lucide-react';
import PageMeta from '@/components/common/PageMeta';
import api from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

// Backend Enterprise interface (matching the actual API)
interface Enterprise {
  id: number;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
}

// Extended interface for display with calculated stats
interface EnterpriseWithStats extends Enterprise {
  stats?: {
    totalUsers: number;
    totalRides: number;
    activeUsers: number;
  };
}

const Enterprises = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Enterprise creation state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEnterprise, setNewEnterprise] = useState({
    name: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Sweden',
    is_active: true,
  });

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const fetchEnterprises = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching enterprises from API...');

      // Try to fetch real data from the admin endpoint first (for admin users)
      let response;
      try {
        response = await api.get('/admin/enterprises');
        console.log('Admin enterprises response:', response.data);
      } catch (adminError: any) {
        // If admin endpoint fails, try the chat endpoint
        if (adminError.response?.status === 403 || adminError.response?.status === 401) {
          console.log('Admin access denied, trying chat endpoint...');
          try {
            response = await api.get('/chat/enterprises');
            console.log('Chat enterprises response:', response.data);
          } catch (chatError: any) {
            // If both fail and user is not authenticated, show demo data
            if (!isAuthenticated) {
              console.log('User not authenticated, showing demo data');
              const demoEnterprises: Enterprise[] = [
                {
                  id: 1,
                  name: 'Tech Solutions AB',
                  address: 'Storgatan 15',
                  city: 'Göteborg',
                  postal_code: '411 38',
                  country: 'Sweden',
                  latitude: 57.7089,
                  longitude: 11.9746,
                  is_active: true,
                },
                {
                  id: 2,
                  name: 'Green Transport Co',
                  address: 'Avenyn 42',
                  city: 'Göteborg',
                  postal_code: '411 36',
                  country: 'Sweden',
                  is_active: true,
                },
                {
                  id: 3,
                  name: 'Nordic Logistics',
                  address: 'Hamngatan 8',
                  city: 'Göteborg',
                  postal_code: '411 14',
                  country: 'Sweden',
                  is_active: false,
                },
              ];
              setEnterprises(demoEnterprises);
              return;
            }
            throw chatError;
          }
        } else {
          throw adminError;
        }
      }

      setEnterprises(response.data || []);
    } catch (error: any) {
      console.error('Error fetching enterprises:', error);
      setError(error.response?.data?.detail || 'Failed to load enterprises. Please try again.');
      setEnterprises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnterprise = () => {
    setShowCreateDialog(true);
  };

  const handleCreateEnterprise = async () => {
    if (!newEnterprise.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Enterprise name is required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/admin/enterprises', newEnterprise);
      console.log('Enterprise created:', response.data);

      toast({
        title: "Success",
        description: "Enterprise created successfully",
        variant: "default",
      });

      // Reset form and close dialog
      setNewEnterprise({
        name: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Sweden',
        is_active: true,
      });
      setShowCreateDialog(false);

      // Refresh the enterprises list
      fetchEnterprises();
    } catch (error: any) {
      console.error('Error creating enterprise:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || 'Failed to create enterprise',
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewEnterprise({
      name: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'Sweden',
      is_active: true,
    });
  };

  // Filter enterprises based on search and status
  const filteredEnterprises = useMemo(() => {
    return enterprises.filter(enterprise => {
      // Search filter
      const matchesSearch = !searchTerm ||
        enterprise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enterprise.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enterprise.city?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && enterprise.is_active) ||
        (statusFilter === 'inactive' && !enterprise.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [enterprises, searchTerm, statusFilter]);

  // Separate active and inactive enterprises
  const activeEnterprises = filteredEnterprises.filter(e => e.is_active);
  const inactiveEnterprises = filteredEnterprises.filter(e => !e.is_active);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-gray-500">Loading enterprises...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageMeta
        title="RideShare - Enterprise Partners"
        description="Explore our enterprise partners and business clients using RideShare services."
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Enterprise Partners
          </h1>
          <p className="text-gray-600 mt-1">
            Companies and organizations using RideShare for their transportation needs
          </p>
        </div>
        {isAuthenticated && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleAddEnterprise} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Enterprise
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Enterprise</DialogTitle>
                <DialogDescription>
                  Add a new enterprise partner to the RideShare platform.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Enterprise Name *</Label>
                  <Input
                    id="name"
                    value={newEnterprise.name}
                    onChange={(e) => setNewEnterprise({ ...newEnterprise, name: e.target.value })}
                    placeholder="Enter enterprise name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newEnterprise.address}
                    onChange={(e) => setNewEnterprise({ ...newEnterprise, address: e.target.value })}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={newEnterprise.city}
                      onChange={(e) => setNewEnterprise({ ...newEnterprise, city: e.target.value })}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={newEnterprise.postal_code}
                      onChange={(e) => setNewEnterprise({ ...newEnterprise, postal_code: e.target.value })}
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={newEnterprise.country}
                    onChange={(e) => setNewEnterprise({ ...newEnterprise, country: e.target.value })}
                    placeholder="Enter country"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={newEnterprise.is_active}
                    onChange={(e) => setNewEnterprise({ ...newEnterprise, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_active">Active Enterprise</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateEnterprise}
                  disabled={creating || !newEnterprise.name.trim()}
                >
                  {creating ? 'Creating...' : 'Create Enterprise'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isAuthenticated && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You're viewing sample enterprise data. Sign in to see real enterprise partners and access additional features.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search enterprises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredEnterprises.length} of {enterprises.length} enterprises
          </div>
        </div>

        {showFilters && (
          <Card className="p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="statusFilter" className="text-sm font-medium mb-1 block">
                  Status
                </Label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Enterprises ({filteredEnterprises.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeEnterprises.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveEnterprises.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <EnterpriseGrid enterprises={filteredEnterprises} />
        </TabsContent>

        <TabsContent value="active">
          <EnterpriseGrid enterprises={activeEnterprises} />
        </TabsContent>

        <TabsContent value="inactive">
          <EnterpriseGrid enterprises={inactiveEnterprises} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Enterprise Grid Component
const EnterpriseGrid = ({ enterprises }: { enterprises: Enterprise[] }) => {
  if (enterprises.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No enterprises found</h3>
        <p className="text-gray-500">
          No enterprises match your current filters. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {enterprises.map((enterprise) => (
        <EnterpriseCard key={enterprise.id} enterprise={enterprise} />
      ))}
    </div>
  );
};

// Enterprise Card Component
const EnterpriseCard = ({ enterprise }: { enterprise: Enterprise }) => {
  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "success" : "secondary"}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const formatAddress = (enterprise: Enterprise) => {
    const parts = [
      enterprise.address,
      enterprise.city,
      enterprise.postal_code,
      enterprise.country
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {enterprise.name}
          </h3>
        </div>
        {getStatusBadge(enterprise.is_active)}
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600 line-clamp-2">
            {formatAddress(enterprise)}
          </p>
        </div>

        {enterprise.latitude && enterprise.longitude && (
          <div className="text-xs text-gray-500">
            Coordinates: {enterprise.latitude.toFixed(4)}, {enterprise.longitude.toFixed(4)}
          </div>
        )}

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Enterprise ID</span>
            <span className="font-medium text-gray-900">#{enterprise.id}</span>
          </div>
        </div>

        {/* Placeholder for future stats */}
        <div className="pt-2">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>Users: N/A</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Rides: N/A</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Enterprises;
