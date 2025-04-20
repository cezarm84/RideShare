import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import PageMeta from '@/components/common/PageMeta';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'booking' | 'ride';
  status: 'confirmed' | 'scheduled' | 'completed' | 'cancelled';
}

interface Ride {
  id: string;
  startingHub: {
    name: string;
  };
  destinationHub: {
    name: string;
  };
  departureTime: string;
  arrivalTime?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

interface Booking {
  id: string;
  rideId: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  ride: Ride;
}

const Calendar = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    // Fetch events regardless of authentication status
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // In a real app, we would fetch from the API
      // const bookingsResponse = await apiClient.get<Booking[]>('/bookings');
      // const ridesResponse = await apiClient.get<Ride[]>('/rides/my-rides');

      // For now, use mock data
      setTimeout(() => {
        const mockEvents = getMockEvents();
        setEvents(mockEvents);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setLoading(false);
    }
  };

  const getMockEvents = (): CalendarEvent[] => {
    const now = new Date();
    const events: CalendarEvent[] = [];

    // Add some mock bookings
    events.push({
      id: 'booking1',
      title: 'Ride: Central Station → Lindholmen',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 8, 0),
      type: 'booking',
      status: 'confirmed'
    });

    events.push({
      id: 'booking2',
      title: 'Ride: Central Station → Landvetter Airport',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 14, 30),
      type: 'booking',
      status: 'confirmed'
    });

    // Add some mock rides (as a driver)
    events.push({
      id: 'ride1',
      title: 'Drive: Mölndal → Volvo HQ',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 7, 0),
      type: 'ride',
      status: 'scheduled'
    });

    events.push({
      id: 'ride2',
      title: 'Drive: Lindholmen → Central Station',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 17, 0),
      type: 'ride',
      status: 'scheduled'
    });

    // Add a past booking
    events.push({
      id: 'booking3',
      title: 'Ride: Lindholmen → Central Station',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 17, 30),
      type: 'booking',
      status: 'completed'
    });

    return events;
  };

  const handleEventClick = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event?.type === 'booking') {
      navigate(`/bookings/${eventId}`);
    } else if (event?.type === 'ride') {
      navigate(`/rides/${eventId}`);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Navigate to ride search with the selected date
    const formattedDate = date.toISOString().split('T')[0];
    navigate(`/rides?date=${formattedDate}`);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24 border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800"></div>
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = events.filter(event => {
        const eventDate = event.date;
        return eventDate.getFullYear() === year &&
               eventDate.getMonth() === month &&
               eventDate.getDate() === day;
      });

      days.push(
        <div
          key={`day-${day}`}
          className="h-24 border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          onClick={() => handleDateClick(date)}
        >
          <div className="font-semibold">{day}</div>
          <div className="space-y-1 mt-1 overflow-y-auto max-h-16">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate ${getEventColor(event)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(event.id);
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.type === 'booking') {
      if (event.status === 'confirmed') {
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      } else if (event.status === 'completed') {
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      } else if (event.status === 'cancelled') {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      }
    } else if (event.type === 'ride') {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
    }
    return '';
  };

  // No need to check authentication here, the ProtectedRoute component in App.tsx
  // will handle redirecting if needed

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6">
      <PageMeta
        title="RideShare - Calendar"
        description="View your scheduled rides and bookings in a calendar view."
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Calendar</h1>
        <div className="flex space-x-4">
          <Button
            onClick={() => navigate('/rides')}
            className="bg-brand-500 hover:bg-brand-600"
          >
            Find Rides
          </Button>
        </div>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center items-center h-[600px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <Button variant="outline" onClick={handlePrevMonth}>&lt; Prev</Button>
              <h2 className="text-xl font-semibold">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
              <Button variant="outline" onClick={handleNextMonth}>Next &gt;</Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(day => (
                <div key={day} className="font-semibold text-center p-2">{day}</div>
              ))}
              {renderCalendar()}
            </div>
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span>Confirmed Bookings</span>
        </Card>

        <Card className="p-4 flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-gray-500"></div>
          <span>Completed Bookings</span>
        </Card>

        <Card className="p-4 flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-red-500"></div>
          <span>Cancelled Bookings</span>
        </Card>

        <Card className="p-4 flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-purple-500"></div>
          <span>Your Rides (as Driver)</span>
        </Card>
      </div>
    </div>
  );
};

export default Calendar;
