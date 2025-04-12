import * as z from 'zod';

// Driver validation schema
export const driverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  vehicleModel: z.string().min(1, 'Vehicle model is required'),
  licensePlate: z.string().min(1, 'License plate is required'),
});

export type DriverFormValues = z.infer<typeof driverSchema>;

// Hub validation schema
export const hubSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  facilities: z.array(z.string()).optional(),
  status: z.enum(['active', 'maintenance', 'inactive']),
});

export type HubFormValues = z.infer<typeof hubSchema>;

// Ride validation schema
export const rideSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required'),
  departureTime: z.string().min(1, 'Departure time is required'),
  seatsAvailable: z.number().min(1, 'At least one seat must be available'),
  price: z.number().min(0, 'Price cannot be negative'),
  driverId: z.string().min(1, 'Driver is required'),
  hubId: z.string().min(1, 'Hub is required'),
});

export type RideFormValues = z.infer<typeof rideSchema>;

// Booking validation schema
export const bookingSchema = z.object({
  rideId: z.string().min(1, 'Ride is required'),
  passengerName: z.string().min(1, 'Passenger name is required'),
  passengerEmail: z.string().email('Invalid email address'),
  passengerPhone: z.string().min(10, 'Phone number must be at least 10 digits'),
  seats: z.number().min(1, 'At least one seat must be booked'),
  paymentMethod: z.enum(['cash', 'card', 'wallet']),
  specialRequests: z.string().optional(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

// User validation schema
export const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  role: z.enum(['admin', 'driver', 'passenger']),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export type UserFormValues = z.infer<typeof userSchema>;

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// Password reset validation schema
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

// Password change validation schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
