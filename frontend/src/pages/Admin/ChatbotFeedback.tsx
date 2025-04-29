import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination } from '@/components/ui/pagination';
import { ThumbsUp, ThumbsDown, Search, RefreshCw } from 'lucide-react';
import api from '@/services/api';

interface ChatbotFeedback {
  id: number;
  user_id: number | null;
  message_id: string;
  is_helpful: boolean;
  session_id: string | null;
  content: string | null;
  intent: string | null;
  feedback_text: string | null;
  created_at: string;
  user_email?: string;
}

interface IntentStats {
  intent: string;
  helpful_count: number;
  unhelpful_count: number;
  total_count: number;
  helpfulness_ratio: number;
  last_updated: string;
}

const ChatbotFeedback = () => {
  const [feedback, setFeedback] = useState<ChatbotFeedback[]>([]);
  const [intents, setIntents] = useState<IntentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIntent, setFilterIntent] = useState<string>('');
  const [filterHelpful, setFilterHelpful] = useState<string>('');
  const [activeTab, setActiveTab] = useState('feedback');

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found, using mock data');
        const mockFeedback = generateMockFeedback();
        setFeedback(mockFeedback);
        setTotalPages(5);
        setLoading(false);
        return;
      }

      // Construct query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (filterIntent && filterIntent !== 'all') {
        params.append('intent', filterIntent);
      }

      if (filterHelpful && filterHelpful !== 'all') {
        params.append('is_helpful', filterHelpful);
      }

      console.log(`Fetching feedback with params: ${params.toString()}`);
      const response = await api.get(`/admin/chatbot?${params.toString()}`);
      console.log('Feedback response:', response.data);

      // If we're using mock data or the endpoint doesn't exist yet
      if (!response.data || response.status !== 200) {
        console.log('Invalid response, using mock data');
        const mockFeedback = generateMockFeedback();
        setFeedback(mockFeedback);
        setTotalPages(5);
      } else {
        setFeedback(response.data.items || []);
        setTotalPages(response.data.total_pages || 1);
      }
    } catch (error) {
      console.error('Error fetching chatbot feedback:', error);
      // Generate mock data if API fails
      const mockFeedback = generateMockFeedback();
      setFeedback(mockFeedback);
      setTotalPages(5);
    } finally {
      setLoading(false);
    }
  };

  const fetchIntentStats = async () => {
    setLoading(true);
    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found, using mock data');
        const mockIntents = generateMockIntentStats();
        setIntents(mockIntents);
        setLoading(false);
        return;
      }

      console.log('Fetching intent stats');
      const response = await api.get('/admin/chatbot/intent-stats');
      console.log('Intent stats response:', response.data);

      // If we're using mock data or the endpoint doesn't exist yet
      if (!response.data || response.status !== 200) {
        console.log('Invalid response, using mock data');
        const mockIntents = generateMockIntentStats();
        setIntents(mockIntents);
      } else {
        setIntents(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching intent stats:', error);
      // Generate mock data if API fails
      const mockIntents = generateMockIntentStats();
      setIntents(mockIntents);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock feedback data for development
  const generateMockFeedback = (): ChatbotFeedback[] => {
    const intents = ['greeting', 'booking', 'faq', 'weather', 'pricing', 'support', 'ride_types'];
    const contents = [
      'How do I book a ride?',
      'What is RideShare?',
      'What payment methods do you accept?',
      'How much does it cost?',
      'What areas do you serve?',
      'Do you serve Landvetter Airport?',
      'Tell me more about corporate rates'
    ];

    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      user_id: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 1 : null,
      message_id: `msg-${Math.floor(Math.random() * 1000)}`,
      is_helpful: Math.random() > 0.3,
      session_id: `session-${Math.floor(Math.random() * 500)}`,
      content: contents[Math.floor(Math.random() * contents.length)],
      intent: intents[Math.floor(Math.random() * intents.length)],
      feedback_text: Math.random() > 0.7 ? 'This could be improved by providing more specific information.' : null,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      user_email: Math.random() > 0.3 ? `user${Math.floor(Math.random() * 100)}@example.com` : undefined
    }));
  };

  // Generate mock intent stats for development
  const generateMockIntentStats = (): IntentStats[] => {
    const intents = ['greeting', 'booking', 'faq', 'weather', 'pricing', 'support', 'ride_types'];

    return intents.map(intent => {
      const helpful = Math.floor(Math.random() * 100) + 10;
      const unhelpful = Math.floor(Math.random() * 50) + 5;
      const total = helpful + unhelpful;

      return {
        intent,
        helpful_count: helpful,
        unhelpful_count: unhelpful,
        total_count: total,
        helpfulness_ratio: helpful / total,
        last_updated: new Date().toISOString()
      };
    });
  };

  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchFeedback();
    } else if (activeTab === 'stats') {
      fetchIntentStats();
    }
  }, [page, searchTerm, filterIntent, filterHelpful, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page when searching
    fetchFeedback();
  };

  const handleRefresh = () => {
    if (activeTab === 'feedback') {
      fetchFeedback();
    } else if (activeTab === 'stats') {
      fetchIntentStats();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getHelpfulnessRatioColor = (ratio: number) => {
    if (ratio >= 0.8) return 'bg-green-100 text-green-800';
    if (ratio >= 0.6) return 'bg-lime-100 text-lime-800';
    if (ratio >= 0.4) return 'bg-yellow-100 text-yellow-800';
    if (ratio >= 0.2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chatbot Feedback</h1>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="feedback">Feedback Entries</TabsTrigger>
          <TabsTrigger value="stats">Intent Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback">
          <Card className="p-6">
            <div className="mb-6">
              <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search feedback content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-full md:w-48">
                  <Select value={filterIntent} onValueChange={setFilterIntent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by intent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Intents</SelectItem>
                      {Array.from(new Set(feedback.map(f => f.intent).filter(Boolean))).map(intent => (
                        <SelectItem key={intent} value={intent as string}>
                          {intent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Select value={filterHelpful} onValueChange={setFilterHelpful}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by helpfulness" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Feedback</SelectItem>
                      <SelectItem value="true">Helpful</SelectItem>
                      <SelectItem value="false">Not Helpful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full md:w-auto">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Loading feedback data...
                      </TableCell>
                    </TableRow>
                  ) : feedback.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No feedback found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    feedback.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>
                          {item.is_helpful ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              Helpful
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-100 text-red-800 flex items-center gap-1">
                              <ThumbsDown className="h-3 w-3" />
                              Not Helpful
                            </Badge>
                          )}
                          {item.feedback_text && (
                            <div className="mt-2 text-sm text-gray-600 italic">
                              "{item.feedback_text}"
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {item.content || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {item.intent ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {item.intent}
                            </Badge>
                          ) : (
                            'N/A'
                          )}
                        </TableCell>
                        <TableCell>
                          {item.user_id ? (
                            item.user_email || `User #${item.user_id}`
                          ) : (
                            <span className="text-gray-500">Anonymous</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(item.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card className="p-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intent</TableHead>
                    <TableHead>Helpful</TableHead>
                    <TableHead>Not Helpful</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Helpfulness Ratio</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Loading intent statistics...
                      </TableCell>
                    </TableRow>
                  ) : intents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No intent statistics found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    intents.map((item) => (
                      <TableRow key={item.intent}>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            {item.intent}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-green-600">{item.helpful_count}</TableCell>
                        <TableCell className="text-red-600">{item.unhelpful_count}</TableCell>
                        <TableCell>{item.total_count}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getHelpfulnessRatioColor(item.helpfulness_ratio)}
                          >
                            {(item.helpfulness_ratio * 100).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.last_updated)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatbotFeedback;
