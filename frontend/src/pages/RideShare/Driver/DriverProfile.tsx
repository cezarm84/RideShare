import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { driverService, DriverProfile as DriverProfileType } from '@/services/driver.service';
import { cn } from '@/lib/utils';

const DriverProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DriverProfileType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    license_number: '',
    license_expiry: undefined as Date | undefined,
    license_state: '',
    license_country: '',
    license_class: '',
    preferred_radius_km: 10,
    max_passengers: 4,
    bio: '',
    languages: '',
  });
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Vehicle form state
  const [vehicleFormData, setVehicleFormData] = useState({
    vehicle_model: '',
    license_plate: '',
    year: '',
    color: '',
  });
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [vehicleFormError, setVehicleFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get driver ID from user profile
        // In a real implementation, this would come from the user object
        const driverId = 1; // Mock driver ID

        // Fetch driver profile
        const profileData = await driverService.getDriverProfile(driverId);
        setProfile(profileData);

        // Initialize form data
        setFormData({
          license_number: profileData.license_number,
          license_expiry: profileData.license_expiry ? new Date(profileData.license_expiry) : undefined,
          license_state: profileData.license_state,
          license_country: profileData.license_country,
          license_class: profileData.license_class || '',
          preferred_radius_km: profileData.preferred_radius_km,
          max_passengers: profileData.max_passengers,
          bio: profileData.bio || '',
          languages: profileData.languages || '',
        });

        // Mock vehicle data
        setVehicleFormData({
          vehicle_model: 'Toyota Prius',
          license_plate: 'ABC123',
          year: '2020',
          color: 'Blue',
        });
      } catch (error) {
        console.error('Error fetching driver profile:', error);
        setError('Failed to load driver profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleVehicleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicleFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.license_number) {
      setFormError('License number is required');
      return;
    }

    if (!formData.license_expiry) {
      setFormError('License expiry date is required');
      return;
    }

    if (!formData.license_state) {
      setFormError('License state is required');
      return;
    }

    if (!formData.license_country) {
      setFormError('License country is required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      // Get driver ID from user profile
      // In a real implementation, this would come from the user object
      const driverId = 1; // Mock driver ID

      // Update the profile
      const updateData = {
        license_number: formData.license_number,
        license_expiry: formData.license_expiry?.toISOString().split('T')[0],
        license_state: formData.license_state,
        license_country: formData.license_country,
        license_class: formData.license_class,
        preferred_radius_km: formData.preferred_radius_km,
        max_passengers: formData.max_passengers,
        bio: formData.bio,
        languages: formData.languages,
      };

      await driverService.updateDriverProfile(driverId, updateData);

      // Upload profile photo if changed
      if (profilePhoto) {
        await driverService.uploadDriverDocument(
          driverId,
          'profile_photo',
          profilePhoto
        );
      }

      // Refresh the profile
      const updatedProfile = await driverService.getDriverProfile(driverId);
      setProfile(updatedProfile);

      // Show success message
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating driver profile:', error);
      setFormError('Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!vehicleFormData.vehicle_model) {
      setVehicleFormError('Vehicle model is required');
      return;
    }

    if (!vehicleFormData.license_plate) {
      setVehicleFormError('License plate is required');
      return;
    }

    try {
      setSubmittingVehicle(true);
      setVehicleFormError(null);

      // Mock implementation - in a real app, this would call an API
      console.log('Updating vehicle:', vehicleFormData);

      // Show success message
      alert('Vehicle updated successfully');
    } catch (error) {
      console.error('Error updating vehicle:', error);
      setVehicleFormError('Failed to update vehicle. Please try again.');
    } finally {
      setSubmittingVehicle(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Profile & Vehicle</h1>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Driver Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>{formError}</p>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="mb-4">
                  <Label htmlFor="photo-upload">Profile Photo</Label>
                  <div className="mt-1">
                    <div className="flex items-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {profile?.profile_photo_url ? (
                          <img
                            src={profile.profile_photo_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : profilePhoto ? (
                          <img
                            src={URL.createObjectURL(profilePhoto)}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400">No Photo</span>
                        )}
                      </div>
                      <Label
                        htmlFor="photo-upload"
                        className="ml-4 cursor-pointer"
                      >
                        <div className="flex items-center">
                          <Upload className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">Upload photo</span>
                          <Input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={handleProfilePhotoChange}
                          />
                        </div>
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={5}
                  />
                </div>

                <div>
                  <Label htmlFor="languages">Languages</Label>
                  <Input
                    id="languages"
                    name="languages"
                    placeholder="e.g., English, Swedish, Spanish"
                    value={formData.languages}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="md:w-2/3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license_number">License Number</Label>
                    <Input
                      id="license_number"
                      name="license_number"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="license_expiry">License Expiry</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            !formData.license_expiry && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.license_expiry ? format(formData.license_expiry, "PPP") : <span>Pick a date</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.license_expiry}
                          onSelect={(date) => setFormData(prev => ({ ...prev, license_expiry: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="license_state">License State</Label>
                    <Input
                      id="license_state"
                      name="license_state"
                      value={formData.license_state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="license_country">License Country</Label>
                    <Input
                      id="license_country"
                      name="license_country"
                      value={formData.license_country}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="license_class">License Class</Label>
                    <Input
                      id="license_class"
                      name="license_class"
                      value={formData.license_class}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferred_radius_km">Preferred Radius (km)</Label>
                    <Input
                      id="preferred_radius_km"
                      name="preferred_radius_km"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.preferred_radius_km}
                      onChange={handleNumberInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="max_passengers">Max Passengers</Label>
                    <Input
                      id="max_passengers"
                      name="max_passengers"
                      type="number"
                      min="1"
                      max="50"
                      value={formData.max_passengers}
                      onChange={handleNumberInputChange}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Driver Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">Rating</div>
                      <div className="text-lg font-medium">{profile?.average_rating}/5</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">Total Rides</div>
                      <div className="text-lg font-medium">{profile?.total_rides}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">Completed</div>
                      <div className="text-lg font-medium">{profile?.completed_rides}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-sm text-gray-500">Cancelled</div>
                      <div className="text-lg font-medium">{profile?.cancelled_rides}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="mt-6">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Profile'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVehicleSubmit} className="space-y-4">
            {vehicleFormError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>{vehicleFormError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle_model">Vehicle Model</Label>
                <Input
                  id="vehicle_model"
                  name="vehicle_model"
                  value={vehicleFormData.vehicle_model}
                  onChange={handleVehicleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  name="license_plate"
                  value={vehicleFormData.license_plate}
                  onChange={handleVehicleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  value={vehicleFormData.year}
                  onChange={handleVehicleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  value={vehicleFormData.color}
                  onChange={handleVehicleInputChange}
                />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2">Inspection Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="text-lg font-medium">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Passed
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Next Inspection</div>
                  <div className="text-lg font-medium">2023-12-15</div>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={submittingVehicle} className="mt-6">
              {submittingVehicle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Vehicle'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverProfile;
