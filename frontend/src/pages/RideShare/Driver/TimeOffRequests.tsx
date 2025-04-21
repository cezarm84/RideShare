import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { driverService, TimeOffRequest } from '@/services/driver.service';
import { cn } from '@/lib/utils';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const TimeOffRequests = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<TimeOffRequest[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<TimeOffRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [requestType, setRequestType] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeOffRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get driver ID from user profile
        // Use the user ID as the driver ID for now
        // In a real implementation, you would have a separate driver profile
        const driverId = user?.id || 1; // Fallback to 1 if user ID is not available

        // Fetch pending requests
        const pending = await driverService.getDriverTimeOffRequests(
          driverId,
          { status: 'pending' }
        );
        setPendingRequests(pending);

        // Fetch approved requests
        const approved = await driverService.getDriverTimeOffRequests(
          driverId,
          { status: 'approved' }
        );
        setApprovedRequests(approved);
      } catch (error) {
        console.error('Error fetching time off requests:', error);
        setError('Failed to load time off requests. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeOffRequests();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!requestType) {
      setFormError('Please select a request type');
      return;
    }

    if (!startDate) {
      setFormError('Please select a start date');
      return;
    }

    if (!endDate) {
      setFormError('Please select an end date');
      return;
    }

    if (endDate < startDate) {
      setFormError('End date must be on or after start date');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      // Get driver ID from user profile
      // Use the user ID as the driver ID for now
      // In a real implementation, you would have a separate driver profile
      const driverId = user?.id || 1; // Fallback to 1 if user ID is not available

      // Create the time off request
      await driverService.createTimeOffRequest(driverId, {
        request_type: requestType as any,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        reason,
      });

      // Reset form
      setRequestType('');
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');

      // Refresh the list
      const pending = await driverService.getDriverTimeOffRequests(
        driverId,
        { status: 'pending' }
      );
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error creating time off request:', error);
      setFormError('Failed to submit time off request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      // Get driver ID from user profile
      // Use the user ID as the driver ID for now
      // In a real implementation, you would have a separate driver profile
      const driverId = user?.id || 1; // Fallback to 1 if user ID is not available

      // Delete the time off request
      await driverService.deleteTimeOffRequest(driverId, requestId);

      // Refresh the list
      const pending = await driverService.getDriverTimeOffRequests(
        driverId,
        { status: 'pending' }
      );
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error canceling time off request:', error);
      setError('Failed to cancel time off request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading time off requests...</span>
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
      <h1 className="text-2xl font-bold mb-6">Time Off Requests</h1>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Request Time Off</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>{formError}</p>
              </div>
            )}

            <div>
              <Label htmlFor="request-type">Request Type</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger id="request-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick_leave">Sick Leave</SelectItem>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="parental_leave">Parental Leave (VAB)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Provide additional details about your time off request"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Type</th>
                    <th className="text-left">Start Date</th>
                    <th className="text-left">End Date</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map(request => (
                    <tr key={request.id}>
                      <td className="capitalize">{request.request_type.replace('_', ' ')}</td>
                      <td>{formatDate(request.start_date)}</td>
                      <td>{formatDate(request.end_date)}</td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No pending requests</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Approved Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {approvedRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Type</th>
                    <th className="text-left">Start Date</th>
                    <th className="text-left">End Date</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedRequests.map(request => (
                    <tr key={request.id}>
                      <td className="capitalize">{request.request_type.replace('_', ' ')}</td>
                      <td>{formatDate(request.start_date)}</td>
                      <td>{formatDate(request.end_date)}</td>
                      <td>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No approved requests</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeOffRequests;
