export type MatchingPreferences = {
  user_id: number;
  max_detour_minutes: number;
  max_wait_minutes: number;
  max_walking_distance_meters: number;
  preferred_gender: string | null;
  preferred_language: string | null;
  minimum_driver_rating: number;
  prefer_same_enterprise: boolean;
  prefer_same_destination: boolean;
  prefer_recurring_rides: boolean;
  created_at: string;
  updated_at: string;
};
