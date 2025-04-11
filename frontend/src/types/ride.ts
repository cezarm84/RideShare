export type Ride = {
  ride_id: number;
  departure_time: string;
  arrival_time: string;
  hub_id: number;
  hub_name: string;
  destination_name?: string;
  vehicle_type: string;
  available_seats: number;
  total_capacity: number;
  overall_score: number;
  match_reasons?: string[];
  driver_name?: string;
  driver_rating?: number;
  estimated_price?: number;
};
