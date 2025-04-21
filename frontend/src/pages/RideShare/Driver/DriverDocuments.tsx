import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { driverService } from '@/services/driver.service';
import { cn } from '@/lib/utils';

interface Document {
  id: number;
  document_type: string;
  document_url: string;
  filename: string;
  verification_status: string;
  expiry_date?: string;
  created_at: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const DriverDocuments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [documentType, setDocumentType] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get driver ID from user profile
        // Use the user ID as the driver ID for now
        // In a real implementation, you would have a separate driver profile
        const driverId = user?.id || 1; // Fallback to 1 if user ID is not available

        // Fetch driver documents
        const docs = await driverService.getDriverDocuments(driverId);
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching driver documents:', error);
        setError('Failed to load documents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!documentType) {
      setFormError('Please select a document type');
      return;
    }

    if (!file) {
      setFormError('Please select a file to upload');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      // Get driver ID from user profile
      // Use the user ID as the driver ID for now
      // In a real implementation, you would have a separate driver profile
      const driverId = user?.id || 1; // Fallback to 1 if user ID is not available

      // Upload the document
      await driverService.uploadDriverDocument(
        driverId,
        documentType,
        file,
        expiryDate?.toISOString().split('T')[0]
      );

      // Reset form
      setDocumentType('');
      setExpiryDate(undefined);
      setFile(null);

      // Refresh the list
      const docs = await driverService.getDriverDocuments(driverId);
      setDocuments(docs);

      // Show success message
      alert('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      setFormError('Failed to upload document. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading documents...</span>
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
      <h1 className="text-2xl font-bold mb-6">Documents & Certifications</h1>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Upload Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>{formError}</p>
              </div>
            )}

            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="license">Driver's License</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="registration">Vehicle Registration</SelectItem>
                  <SelectItem value="vehicle_photo">Vehicle Photo</SelectItem>
                  <SelectItem value="profile_photo">Profile Photo</SelectItem>
                  <SelectItem value="background_check">Background Check</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expiry-date">Expiry Date (if applicable)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="file">Upload File</Label>
              <div className="mt-1">
                <Label
                  htmlFor="file-upload"
                  className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-md p-6 cursor-pointer hover:border-gray-400"
                >
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <span>Upload a file</span>
                      <Input
                        id="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, PNG, JPG up to 10MB
                    </p>
                  </div>
                </Label>
              </div>

              {file && (
                <div className="mt-2 text-sm text-gray-500">
                  Selected file: {file.name}
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Document'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>My Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Type</th>
                    <th className="text-left">Filename</th>
                    <th className="text-left">Uploaded</th>
                    <th className="text-left">Expiry Date</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td className="capitalize">{doc.document_type.replace('_', ' ')}</td>
                      <td>{doc.filename}</td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td>{formatDate(doc.expiry_date)}</td>
                      <td>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          doc.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                          doc.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          doc.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.verification_status}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.document_url, '_blank')}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No documents uploaded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDocuments;
