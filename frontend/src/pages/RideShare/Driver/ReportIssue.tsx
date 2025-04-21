import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { driverService, IssueReport, DriverRide } from '@/services/driver.service';
import { Loader2, Upload } from 'lucide-react';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const formatTime = (timeString: string) => {
  const date = new Date(timeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getRouteDescription = (ride: DriverRide) => {
  return `${ride.starting_hub.name} → ${ride.destination_hub?.name || 'Custom destination'}`;
};

const ReportIssue = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentRides, setRecentRides] = useState<DriverRide[]>([]);
  const [recentReports, setRecentReports] = useState<IssueReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [issueType, setIssueType] = useState('');
  const [relatedRideId, setRelatedRideId] = useState<string>('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get driver ID from user profile
        // Use the user ID as the driver ID for now
        // In a real implementation, you would have a separate driver profile
        const driverId = user?.id || 1; // Fallback to 1 if user ID is not available

        // Fetch recent rides
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Last 7 days

        const rides = await driverService.getDriverRides(
          driverId,
          {
            startDate: startDate.toISOString().split('T')[0]
          }
        );
        setRecentRides(rides);

        // Fetch recent reports
        const reports = await driverService.getDriverIssueReports(driverId);
        setRecentReports(reports);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!issueType) {
      setFormError('Please select an issue type');
      return;
    }

    if (!priority) {
      setFormError('Please select a priority');
      return;
    }

    if (!description) {
      setFormError('Please provide a description');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      // Get driver ID from user profile
      // Use the user ID as the driver ID for now
      // In a real implementation, you would have a separate driver profile
      const driverId = user?.id || 1; // Fallback to 1 if user ID is not available

      // Create the issue report
      const reportData = {
        issue_type: issueType as any,
        ride_id: relatedRideId && relatedRideId !== 'none' ? parseInt(relatedRideId) : undefined,
        priority: priority as any,
        description,
      };

      const report = await driverService.createIssueReport(driverId, reportData);

      // Upload photos if any
      if (photos.length > 0 && report.id) {
        for (const photo of photos) {
          await driverService.uploadIssuePhoto(driverId, report.id, photo);
        }
      }

      // Reset form
      setIssueType('');
      setRelatedRideId('');
      setPriority('');
      setDescription('');
      setPhotos([]);

      // Refresh the list
      const reports = await driverService.getDriverIssueReports(driverId);
      setRecentReports(reports);
    } catch (error) {
      console.error('Error creating issue report:', error);
      setFormError('Failed to submit issue report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...fileArray]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
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
      <h1 className="text-2xl font-bold mb-6">Report Issue</h1>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Issue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>{formError}</p>
              </div>
            )}

            <div>
              <Label htmlFor="issue-type">Issue Type</Label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger id="issue-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="passenger">Passenger</SelectItem>
                  <SelectItem value="route">Route</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="related-ride">Related Ride (Optional)</Label>
              <Select value={relatedRideId} onValueChange={setRelatedRideId}>
                <SelectTrigger id="related-ride">
                  <SelectValue placeholder="Select ride or 'Not related to ride'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not related to ride</SelectItem>
                  {recentRides.map(ride => (
                    <SelectItem key={ride.id} value={ride.id.toString()}>
                      {formatDate(ride.departure_time)} {formatTime(ride.departure_time)} - {getRouteDescription(ride)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide details about the issue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="photos">Upload Photos (Optional)</Label>
              <div className="mt-1">
                <Label
                  htmlFor="photo-upload"
                  className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:border-gray-400"
                >
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <span>Upload photos</span>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </Label>
              </div>

              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${index + 1}`}
                        className="h-24 w-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
                        onClick={() => removePhoto(index)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Priority</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map(report => (
                    <tr key={report.id}>
                      <td>{formatDate(report.created_at)}</td>
                      <td className="capitalize">{report.issue_type}</td>
                      <td className="capitalize">{report.priority}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'open' ? 'bg-blue-100 text-blue-800' :
                          report.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="truncate max-w-xs">{report.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No recent reports</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportIssue;
