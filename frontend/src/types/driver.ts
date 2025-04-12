export enum DriverStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum DriverVerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum VehicleInspectionStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

export enum RideTypePermission {
  HUB_TO_HUB = 'hub_to_hub',
  HUB_TO_DESTINATION = 'hub_to_destination',
  ENTERPRISE = 'enterprise',
  ALL = 'all',
}

export interface DriverProfileBase {
  license_number: string;
  license_expiry: string;
  license_state: string;
  license_country: string;
  license_class?: string;
  profile_photo_url?: string;
  preferred_radius_km?: number;
  max_passengers?: number;
  bio?: string;
  languages?: string;
  ride_type_permissions?: RideTypePermission[];
}

export interface DriverProfileCreate extends DriverProfileBase {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  user_id?: number;
}

export interface DriverProfileUpdate extends Partial<DriverProfileBase> {
  status?: DriverStatus;
  verification_status?: DriverVerificationStatus;
  background_check_date?: string;
  background_check_status?: string;
}

export interface DriverProfileResponse extends DriverProfileBase {
  id: number;
  user_id: number;
  status: DriverStatus;
  verification_status: DriverVerificationStatus;
  average_rating: number;
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  background_check_date?: string;
  background_check_status?: string;
  created_at: string;
  updated_at: string;
}

export interface DriverVehicle {
  id: number;
  driver_id: number;
  vehicle_id: number;
  inspection_status: VehicleInspectionStatus;
  last_inspection_date?: string;
  next_inspection_date?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverSchedule {
  id: number;
  driver_id: number;
  is_recurring: boolean;
  day_of_week?: number;
  specific_date?: string;
  start_time: string;
  end_time: string;
  preferred_starting_hub_id?: number;
  preferred_area?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DriverDocument {
  id: number;
  driver_id: number;
  document_type: string;
  document_url: string;
  filename: string;
  verification_status: DriverVerificationStatus;
  verification_notes?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
} 