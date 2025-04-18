/**
 * Mock reference data for ride creation
 * This is used as a fallback when the API fails to return reference data
 */

export const mockReferenceData = {
  hubs: [
    { id: 1, name: 'Brunnsparken Hub', address: 'Brunnsparken, 411 03 Göteborg', city: 'Göteborg', latitude: 57.7072, longitude: 11.9668 },
    { id: 2, name: 'Lindholmen Hub', address: 'Lindholmspiren 5, 417 56 Göteborg', city: 'Göteborg', latitude: 57.7067, longitude: 11.9386 },
    { id: 3, name: 'Mölndal Hub', address: 'Göteborgsvägen 97, 431 30 Mölndal', city: 'Mölndal', latitude: 57.6560, longitude: 12.0127 },
    { id: 4, name: 'Landvetter Hub', address: 'Flygplatsvägen 90, 438 80 Landvetter', city: 'Landvetter', latitude: 57.6685, longitude: 12.2966 },
    { id: 5, name: 'Partille Hub', address: 'Partille Centrum, 433 38 Partille', city: 'Partille', latitude: 57.7394, longitude: 12.1061 },
    { id: 6, name: 'Kungsbacka Hub', address: 'Kungsbacka Station, 434 30 Kungsbacka', city: 'Kungsbacka', latitude: 57.4954, longitude: 12.0765 },
    { id: 7, name: 'Lerum Hub', address: 'Lerum Station, 443 30 Lerum', city: 'Lerum', latitude: 57.7696, longitude: 12.2699 },
    { id: 8, name: 'Kungälv Hub', address: 'Kungälv Resecentrum, 442 30 Kungälv', city: 'Kungälv', latitude: 57.8707, longitude: 11.9767 },
  ],
  
  destinations: [
    { id: 101, name: 'Volvo Cars Torslanda', address: 'Torslandavägen 1, 405 31 Göteborg', city: 'Göteborg', latitude: 57.7208, longitude: 11.8519 },
    { id: 102, name: 'Volvo Group Lundby', address: 'Gropegårdsgatan 2, 417 15 Göteborg', city: 'Göteborg', latitude: 57.7208, longitude: 11.9519 },
    { id: 103, name: 'AstraZeneca Mölndal', address: 'Pepparedsleden 1, 431 83 Mölndal', city: 'Mölndal', latitude: 57.6613, longitude: 12.0147 },
    { id: 104, name: 'Ericsson Lindholmen', address: 'Lindholmspiren 11, 417 56 Göteborg', city: 'Göteborg', latitude: 57.7067, longitude: 11.9386 },
    { id: 105, name: 'SKF Gamlestaden', address: 'Hornsgatan 1, 415 50 Göteborg', city: 'Göteborg', latitude: 57.7289, longitude: 12.0122 },
  ],
  
  vehicle_types: [
    { id: 1, name: 'Sedan', capacity: 4, description: 'Standard 4-door sedan', is_active: true, price_factor: 1.0 },
    { id: 2, name: 'SUV', capacity: 5, description: 'Sport utility vehicle with extra space', is_active: true, price_factor: 1.2 },
    { id: 3, name: 'Minivan', capacity: 7, description: 'Larger vehicle for groups', is_active: true, price_factor: 1.5 },
    { id: 4, name: 'Bus', capacity: 15, description: 'Small bus for larger groups', is_active: true, price_factor: 2.0 },
  ],
  
  enterprises: [
    { id: 1, name: 'Volvo', address: 'Volvo HQ, Gothenburg', city: 'Gothenburg' },
    { id: 2, name: 'Ericsson', address: 'Ericsson HQ, Stockholm', city: 'Stockholm' },
    { id: 3, name: 'AstraZeneca', address: 'AstraZeneca HQ, Gothenburg', city: 'Gothenburg' },
  ],
  
  ride_types: [
    { id: 'hub_to_hub', name: 'Hub to Hub', description: 'Ride between two hubs' },
    { id: 'hub_to_destination', name: 'Hub to Destination', description: 'Ride from a hub to a custom destination' },
    { id: 'enterprise', name: 'Enterprise', description: 'Ride for company employees' },
  ],
  
  recurrence_patterns: [
    { id: 'one_time', name: 'One Time' },
    { id: 'daily', name: 'Daily' },
    { id: 'weekly', name: 'Weekly' },
    { id: 'monthly', name: 'Monthly' },
  ],
  
  status_options: [
    { id: 'scheduled', name: 'Scheduled' },
    { id: 'in_progress', name: 'In Progress' },
    { id: 'completed', name: 'Completed' },
    { id: 'cancelled', name: 'Cancelled' },
  ],
};

export default mockReferenceData;
