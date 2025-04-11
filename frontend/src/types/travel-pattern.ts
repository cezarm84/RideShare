export type TravelPattern = {
  id: number;
  user_id: number;
  origin_type: string;
  origin_id: number | null;
  origin_name: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_type: string;
  destination_id: number | null;
  destination_name: string;
  destination_latitude: number;
  destination_longitude: number;
  day_of_week: number;
  departure_time: string;
  frequency: number;
  last_traveled: string;
};
