export type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  home_address?: string;
  work_address?: string;
  user_type: string;
  enterprise_id?: number;
  enterprise_name?: string;
  preferred_starting_hub_id?: number;
  preferred_vehicle_type_id?: number;
};
