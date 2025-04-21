import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { driverService, DriverSchedule as DriverScheduleType, DriverRide } from '@/services/driver.service';
import { Loader2 } from 'lucide-react';

const formatTime = (timeString: string) => {
  const date = new Date(`2000-01-01T${timeString}`);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getRouteDescription = (ride: DriverRide) => {
  return `${ride.starting_hub.name} → ${ride.destination_hub?.name || 'Custom destination'}`;
};

// Mock components for the calendar views
const DayView = ({
  date,
  schedules,
  rides
}: {
  date: Date;
  schedules: DriverScheduleType[];
  rides: DriverRide[];
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">{date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>

      <div className="space-y-4">
        <h4 className="font-medium">Scheduled Hours</h4>
        {schedules.length > 0 ? (
          <ul className="space-y-2">
            {schedules.map(schedule => (
              <li key={schedule.id} className="p-2 bg-gray-50 rounded">
                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                {schedule.preferred_area && <span className="ml-2 text-gray-500">({schedule.preferred_area})</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No scheduled hours for this day</p>
        )}

        <h4 className="font-medium mt-6">Rides</h4>
        {rides.length > 0 ? (
          <ul className="space-y-2">
            {rides.map(ride => (
              <li key={ride.id} className="p-2 bg-gray-50 rounded">
                <div className="flex justify-between">
                  <span>{formatTime(ride.departure_time)}</span>
                  <span className="font-medium">{getRouteDescription(ride)}</span>
                  <span>{ride.total_passengers} passengers</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No rides scheduled for this day</p>
        )}
      </div>
    </div>
  );
};

const WeekView = ({
  date,
  schedules,
  rides,
  onDateSelect
}: {
  date: Date;
  schedules: DriverScheduleType[];
  rides: DriverRide[];
  onDateSelect: (date: Date) => void;
}) => {
  // Get the start of the week (Monday)
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  // Create an array of dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekDates.map((date, index) => (
          <div
            key={index}
            className="text-center cursor-pointer hover:bg-gray-100 p-2 rounded"
            onClick={() => onDateSelect(date)}
          >
            <div className="text-sm font-medium">{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
            <div className="text-lg">{date.getDate()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 h-96 border rounded">
        {weekDates.map((date, index) => {
          const dayRides = rides.filter(ride => {
            const rideDate = new Date(ride.departure_time);
            return rideDate.getDate() === date.getDate() &&
                   rideDate.getMonth() === date.getMonth() &&
                   rideDate.getFullYear() === date.getFullYear();
          });

          const daySchedules = schedules.filter(schedule => {
            if (schedule.specific_date) {
              const scheduleDate = new Date(schedule.specific_date);
              return scheduleDate.getDate() === date.getDate() &&
                     scheduleDate.getMonth() === date.getMonth() &&
                     scheduleDate.getFullYear() === date.getFullYear();
            } else if (schedule.day_of_week !== undefined) {
              // 0 = Monday in our system, but getDay() returns 0 for Sunday
              const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
              return schedule.day_of_week === dayOfWeek;
            }
            return false;
          });

          return (
            <div key={index} className="border-r last:border-r-0 p-1 overflow-y-auto">
              {daySchedules.length > 0 && (
                <div className="bg-blue-100 text-blue-800 p-1 mb-1 text-xs rounded">
                  {daySchedules.map(schedule => (
                    <div key={schedule.id}>
                      {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                    </div>
                  ))}
                </div>
              )}

              {dayRides.map(ride => (
                <div key={ride.id} className="bg-green-100 text-green-800 p-1 mb-1 text-xs rounded">
                  {formatTime(ride.departure_time)}: {getRouteDescription(ride)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MonthView = ({
  date,
  schedules,
  rides,
  onDateSelect
}: {
  date: Date;
  schedules: DriverScheduleType[];
  rides: DriverRide[];
  onDateSelect: (date: Date) => void;
}) => {
  return (
    <div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={(date) => date && onDateSelect(date)}
        className="rounded-md border"
      />

      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Selected Date: {date.toLocaleDateString()}</h3>

        <DayView
          date={date}
          schedules={schedules.filter(schedule => {
            if (schedule.specific_date) {
              const scheduleDate = new Date(schedule.specific_date);
              return scheduleDate.getDate() === date.getDate() &&
                     scheduleDate.getMonth() === date.getMonth() &&
                     scheduleDate.getFullYear() === date.getFullYear();
            } else if (schedule.day_of_week !== undefined) {
              // 0 = Monday in our system, but getDay() returns 0 for Sunday
              const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1;
              return schedule.day_of_week === dayOfWeek;
            }
            return false;
          })}
          rides={rides.filter(ride => {
            const rideDate = new Date(ride.departure_time);
            return rideDate.getDate() === date.getDate() &&
                   rideDate.getMonth() === date.getMonth() &&
                   rideDate.getFullYear() === date.getFullYear();
          })}
        />
      </div>
    </div>
  );
};

const DriverSchedule = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('week');
  const [schedules, setSchedules] = useState<DriverScheduleType[]>([]);
  const [upcomingRides, setUpcomingRides] = useState<DriverRide[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get driver ID from user profile
        // Use the user ID as the driver ID for now
        // In a real implementation, you would have a separate driver profile
        const driverId = user?.id || 1; // Fallback to 1 if user ID is not available

        // Fetch driver schedules
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // Get next 30 days

        const scheduleData = await driverService.getDriverSchedule(
          driverId,
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }
        );
        setSchedules(scheduleData);

        // Fetch upcoming rides
        const rides = await driverService.getDriverRides(
          driverId,
          {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }
        );
        setUpcomingRides(rides);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
        setError('Failed to load schedule data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading schedule...</span>
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
      <h1 className="text-2xl font-bold mb-6">My Schedule</h1>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week" onValueChange={setView}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
              <div>
                <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
              </div>
            </div>

            <TabsContent value="day">
              <DayView
                date={selectedDate}
                schedules={schedules.filter(schedule => {
                  if (schedule.specific_date) {
                    const scheduleDate = new Date(schedule.specific_date);
                    return scheduleDate.getDate() === selectedDate.getDate() &&
                           scheduleDate.getMonth() === selectedDate.getMonth() &&
                           scheduleDate.getFullYear() === selectedDate.getFullYear();
                  } else if (schedule.day_of_week !== undefined) {
                    // 0 = Monday in our system, but getDay() returns 0 for Sunday
                    const dayOfWeek = selectedDate.getDay() === 0 ? 6 : selectedDate.getDay() - 1;
                    return schedule.day_of_week === dayOfWeek;
                  }
                  return false;
                })}
                rides={upcomingRides.filter(ride => {
                  const rideDate = new Date(ride.departure_time);
                  return rideDate.getDate() === selectedDate.getDate() &&
                         rideDate.getMonth() === selectedDate.getMonth() &&
                         rideDate.getFullYear() === selectedDate.getFullYear();
                })}
              />
            </TabsContent>

            <TabsContent value="week">
              <WeekView
                date={selectedDate}
                schedules={schedules}
                rides={upcomingRides}
                onDateSelect={setSelectedDate}
              />
            </TabsContent>

            <TabsContent value="month">
              <MonthView
                date={selectedDate}
                schedules={schedules}
                rides={upcomingRides}
                onDateSelect={setSelectedDate}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Upcoming Rides</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingRides.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Date</th>
                    <th className="text-left">Time</th>
                    <th className="text-left">Route</th>
                    <th className="text-left">Passengers</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRides.map(ride => (
                    <tr key={ride.id}>
                      <td>{formatDate(ride.departure_time)}</td>
                      <td>{formatTime(ride.departure_time)}</td>
                      <td>{getRouteDescription(ride)}</td>
                      <td>{ride.total_passengers}/{ride.available_seats}</td>
                      <td>{ride.status}</td>
                      <td>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No upcoming rides</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Availability Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Set your regular working hours and preferred areas</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Regular Working Hours</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="day">Day of Week</Label>
                  <Select>
                    <SelectTrigger id="day">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Monday</SelectItem>
                      <SelectItem value="1">Tuesday</SelectItem>
                      <SelectItem value="2">Wednesday</SelectItem>
                      <SelectItem value="3">Thursday</SelectItem>
                      <SelectItem value="4">Friday</SelectItem>
                      <SelectItem value="5">Saturday</SelectItem>
                      <SelectItem value="6">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input id="start-time" type="time" />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input id="end-time" type="time" />
                  </div>
                </div>

                <Button>Add Working Hours</Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Preferred Areas</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="hub">Preferred Starting Hub</Label>
                  <Select>
                    <SelectTrigger id="hub">
                      <SelectValue placeholder="Select hub" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Central Station</SelectItem>
                      <SelectItem value="2">Airport</SelectItem>
                      <SelectItem value="3">University</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="area">Preferred Area</Label>
                  <Input id="area" placeholder="e.g., North Gothenburg" />
                </div>

                <Button>Save Preferences</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverSchedule;
