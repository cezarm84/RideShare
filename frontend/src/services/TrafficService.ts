// This service would normally fetch real traffic data from an API like Google Maps or TomTom
// For now, we'll simulate it with more realistic data based on route and time

interface TrafficData {
  status: string;
  color: string;
  description: string;
  details: string[];
  estimatedDelay: string;
  alternativeRoute?: string;
}

// Major roads in Gothenburg
const majorRoads = [
  'E6', 'E20', 'E45', 'Rv40',
  'Älvsborgsbron', 'Tingstadstunneln',
  'Lundbyleden', 'Hisingsleden',
  'Göta älvbron', 'Oscarsleden'
];

// Areas in Gothenburg
const areas = [
  'city center', 'Hisingen', 'Lindholmen',
  'Mölndal', 'Partille', 'Frölunda',
  'Torslanda', 'Angered', 'Backa'
];

// Traffic incidents
const incidents = [
  'accident', 'construction work', 'road closure',
  'broken down vehicle', 'traffic jam', 'special event',
  'police control', 'spillage on road', 'fallen tree'
];

// Get traffic based on route and time
export const getTrafficForRoute = (
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  date: string,
  time?: string
): TrafficData => {
  // In a real implementation, this would call a traffic API
  // For now, we'll generate realistic traffic based on coordinates, date and time

  // Use coordinates to seed the random generator for route-based consistency
  const routeSeed = Math.abs(startLat * 1000 + startLng * 1000 + destLat * 1000 + destLng * 1000) % 100;

  // Use date and time to adjust traffic conditions
  const dateObj = new Date(date);
  const hour = time ? parseInt(time.split(':')[0]) : dateObj.getHours();
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Traffic is typically worse during rush hours (7-9 AM, 4-6 PM) on weekdays
  let trafficFactor = 0;

  // Weekend vs weekday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend
    trafficFactor += 0;
  } else {
    // Weekday
    trafficFactor += 3;
  }

  // Time of day
  if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
    // Rush hour
    trafficFactor += 5;
  } else if ((hour >= 10 && hour <= 15) || (hour >= 19 && hour <= 21)) {
    // Normal daytime
    trafficFactor += 2;
  } else {
    // Night time
    trafficFactor += 0;
  }

  // Distance factor (longer routes have more chance of delays)
  const distance = Math.sqrt(
    Math.pow(startLat - destLat, 2) + Math.pow(startLng - destLng, 2)
  );
  trafficFactor += Math.min(5, Math.floor(distance * 1000));

  // Random factor (weather, events, etc.)
  trafficFactor += Math.floor(routeSeed % 5);

  // Determine traffic status based on total factor
  let status, color, description, estimatedDelay;
  let details: string[] = [];

  if (trafficFactor < 5) {
    status = 'Light';
    color = 'green';
    description = 'Traffic is flowing smoothly';
    estimatedDelay = 'No delays';

    // Generate 1-2 details
    if (Math.random() > 0.5) {
      details.push('All routes clear');
    }
    details.push('No significant delays reported');

  } else if (trafficFactor < 10) {
    status = 'Moderate';
    color = 'yellow';
    description = 'Some congestion, but moving steadily';
    estimatedDelay = `${Math.floor(5 + (routeSeed % 10))} min delay`;

    // Generate 2-3 details
    const road1 = majorRoads[Math.floor(routeSeed % majorRoads.length)];
    const road2 = majorRoads[Math.floor((routeSeed + 1) % majorRoads.length)];

    details.push(`Minor delays on ${road1}`);
    if (Math.random() > 0.3) {
      details.push(`Slow traffic near ${areas[Math.floor(routeSeed % areas.length)]}`);
    }
    details.push(`${road2} moving normally`);

  } else {
    status = 'Heavy';
    color = 'red';
    description = 'Significant delays expected';
    estimatedDelay = `${Math.floor(15 + (routeSeed % 20))} min delay`;

    // Generate 2-3 details with more severe issues
    const road = majorRoads[Math.floor(routeSeed % majorRoads.length)];
    const incident = incidents[Math.floor(routeSeed % incidents.length)];
    const area = areas[Math.floor((routeSeed + 2) % areas.length)];

    details.push(`${incident.charAt(0).toUpperCase() + incident.slice(1)} on ${road}`);
    details.push(`Heavy congestion in ${area}`);

    if (Math.random() > 0.5) {
      const alternativeRoad = majorRoads[Math.floor((routeSeed + 3) % majorRoads.length)];
      details.push(`Consider using ${alternativeRoad} as an alternative route`);
    }
  }

  return {
    status,
    color,
    description,
    details,
    estimatedDelay
  };
};
