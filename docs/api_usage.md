# RideShare API Usage Guide

This guide explains how to use the RideShare API, including authentication, available endpoints, and common operations with detailed examples for each ride type.

## Authentication

All API requests (except for login) require authentication using a JWT token.

### Getting a Token

```
POST /api/v1/auth/token
```

Request body:

```json
{
  "username": "your-email@example.com",
  "password": "your-password"
}
```

Response:

```json
{
  "access_token": "your.jwt.token",
  "token_type": "bearer"
}
```

### Using the Token

Include the token in the Authorization header for all subsequent requests:

```
Authorization: Bearer your.jwt.token
```

#### Get Current User Profile

```
GET /api/v1/users/me
```

#### Get All Users (Admin Only)

```
GET /api/v1/users
```

#### Get Specific User (Admin or Own User)

```
GET /api/v1/users/{user_id}
```

#### Create New User (Admin Only)

```
POST /api/v1/users
```

Request body:

```json
{
  "email": "new-user@example.com",
  "password": "password123",
  "first_name": "New",
  "last_name": "User",
  "phone_number": "1234567890",
  "user_type": "private"
}
```

## Ride Management

### Get Reference Data

get all necessary reference data including hubs, vehicle types, and enterprises:

```
GET /api/v1/rides/reference-data
```

### Get Available Rides

```
GET /api/v1/rides?destination_hub_id={destination_hub_id}&starting_hub_id={starting_hub_id}
```

Optional query parameters:

- `future_only=true` - Only show future rides
- `include_passengers=true` - Include passenger details
- `limit=10` - Limit the number of results
- `skip=0` - Skip the first N results

### Get Specific Ride

```
GET /api/v1/rides/{ride_id}
```

### Create a New Ride

```
POST /api/v1/rides
```

#### 1. Hub-to-Hub Ride

For rides between two transportation hubs:

```json
{
  "ride_type": "hub_to_hub",
  "starting_hub_id": 1,
  "destination_hub_id": 2,
  "recurrence_pattern": "one_time",
  "departure_time": "2025-04-15T08:00:00",
  "vehicle_type_id": 1,
  "price_per_seat": 50,
  "available_seats": 15,
  "status": "scheduled"
}
```

#### 2. Hub-to-Destination Ride

For rides from a hub to a custom destination:

```json
{
  "ride_type": "hub_to_destination",
  "starting_hub_id": 1,
  "destination": {
    "name": "Custom Destination",
    "address": "123 Main St",
    "city": "Gothenburg",
    "latitude": 57.7089,
    "longitude": 11.9746,
    "postal_code": "41111",
    "country": "Sweden"
  },
  "recurrence_pattern": "one_time",
  "departure_time": "2025-04-15T08:00:00",
  "vehicle_type_id": 1,
  "price_per_seat": 50,
  "available_seats": 15,
  "status": "scheduled"
}
```

#### 3. Enterprise Ride (One-Time)

For one-time rides for company employees:

```json
{
  "ride_type": "enterprise",
  "starting_hub_id": 1,
  "enterprise_id": 1,
  "recurrence_pattern": "one_time",
  "departure_time": "2025-04-15T08:00:00",
  "vehicle_type_id": 1,
  "price_per_seat": 0,
  "available_seats": 15,
  "status": "scheduled"
}
```

#### 4. Enterprise Ride (Recurring)

For recurring rides for company employees:

```json
{
  "ride_type": "enterprise",
  "starting_hub_id": 1,
  "enterprise_id": 1,
  "recurrence_pattern": "weekdays",
  "start_date": "2025-04-15",
  "end_date": "2025-05-15",
  "departure_times": ["08:00", "17:00"],
  "vehicle_type_id": 1,
  "price_per_seat": 0,
  "available_seats": 15,
  "status": "scheduled"
}
```

### Update a Ride (Admin or Driver Only)

```
PUT /api/v1/rides/{ride_id}
```

Request body (include only fields to update):

```json
{
  "available_seats": 10,
  "status": "in_progress"
}
```

### Cancel a Ride (Admin or Driver Only)

```
POST /api/v1/rides/{ride_id}/cancel
```

### Delete a Ride (Admin Only)

```
DELETE /api/v1/rides/{ride_id}
```

## Booking Management

### Create a Booking

```
POST /api/v1/bookings
```

Request body:

```json
{
  "ride_id": 1,
  "seats_booked": 1
}
```

### Get User Bookings

```
GET /api/v1/bookings
```

### Get Ride Bookings

```
GET /api/v1/rides/{ride_id}/bookings
```

## Hub Management (Admin Only)

### Get All Hubs

```
GET /api/v1/admin/hubs
```

### Create a New Hub

```
POST /api/v1/admin/hubs
```

Request body:

```json
{
  "name": "New Hub",
  "address": "456 Hub Street",
  "city": "Gothenburg",
  "postal_code": "41111",
  "country": "Sweden",
  "latitude": 57.7089,
  "longitude": 11.9746,
  "is_active": true
}
```

## Vehicle Type Management (Admin Only)

### Get All Vehicle Types

```
GET /api/v1/admin/vehicle-types
```

### Create a New Vehicle Type

```
POST /api/v1/admin/vehicle-types
```

Request body:

```json
{
  "name": "Luxury Van",
  "description": "Comfortable van with premium features",
  "capacity": 8,
  "is_active": true,
  "price_factor": 1.5
}
```

## Driver Management

### Driver Registration Process

#### Recommended Method

The recommended way to register as a driver is using the one-step registration process:

```
POST /api/v1/drivers/with-user
```

This endpoint creates both a user account with driver privileges and a driver profile in one step. After registration, the driver can immediately log in with their email and password.

#### Admin-Only Method

For administrative purposes, there is also an endpoint that allows admins to create a driver profile for an existing user:

```
POST /api/v1/drivers
```

**Note:** This endpoint is primarily for admin use and backward compatibility. For new driver registrations, use the `/api/v1/drivers/with-user` endpoint instead.

Once registration is complete, the user can log in with their email/password and access driver-specific endpoints.

### Get Current Driver Profile

```
GET /api/v1/drivers/me
```

### Update Current Driver Profile

```
PUT /api/v1/drivers/me
```

Request body (include only fields to update):

```json
{
  "bio": "Updated driver bio",
  "languages": "Swedish, English, German",
  "preferred_radius_km": 20.0
}
```

### List All Drivers (Admin Only)

```
GET /api/v1/drivers
```

### Get Specific Driver

```
GET /api/v1/drivers/{driver_id}
```

### Create a New Driver (Recommended)

```
POST /api/v1/drivers/with-user
```

Request body:

```json
{
  "email": "driver@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Driver",
  "phone_number": "0701234567",
  "license_number": "DL12345678",
  "license_expiry": "2026-04-08",
  "license_state": "Västra Götaland",
  "license_country": "Sweden",
  "license_class": "B",
  "preferred_radius_km": 15.0,
  "max_passengers": 4,
  "bio": "Experienced driver",
  "languages": "Swedish, English"
}
```

**Note:** This is the recommended endpoint for driver registration as it creates both the user account and driver profile in one step.

### Create a Driver Profile (Admin Only)

```
POST /api/v1/drivers
```

**Note:** This endpoint is primarily for admin use and backward compatibility. For new driver registrations, use the `/api/v1/drivers/with-user` endpoint instead.

Request body:

```json
{
  "user_id": 123, // ID of an existing user account
  "license_number": "DL12345678",
  "license_expiry": "2026-04-08",
  "license_state": "Västra Götaland",
  "license_country": "Sweden",
  "license_class": "B",
  "preferred_radius_km": 15.0,
  "max_passengers": 4,
  "bio": "Experienced driver",
  "languages": "Swedish, English"
}
```

### Update Driver Location

```
PUT /api/v1/drivers/{driver_id}/location
```

Request body:

```json
{
  "latitude": 57.7089,
  "longitude": 11.9746
}
```

For more detailed information about driver management, see [Driver Management](driver_management.md).

## Enterprise Management (Admin Only)

### Get All Enterprises

```
GET /api/v1/admin/enterprises
```

### Create a New Enterprise

```
POST /api/v1/admin/enterprises
```

Request body:

```json
{
  "name": "New Company",
  "address": "789 Company Street",
  "city": "Gothenburg",
  "postal_code": "41111",
  "country": "Sweden",
  "latitude": 57.7089,
  "longitude": 11.9746,
  "is_active": true
}
```

## Date and Time Formats

The API accepts various date and time formats:

### Date Formats

- ISO format: "2025-04-15"
- European format: "15/04/2025"
- American format: "04/15/2025"
- With text month: "15 Apr 2025" or "Apr 15 2025"

### Time Formats

- 24-hour format: "14:30" or "14:30:00"
- With timezone: "2025-04-15T14:30:00Z"

## Common Issues and Solutions

1. **401 Unauthorized** - Check your token is valid and not expired. Re-authenticate if needed.
2. **404 Not Found** - Verify the endpoint path is correct, including version (/api/v1/).
3. **400 Bad Request** - Check your request body for missing or invalid fields.

## User Types and Permissions

- **Private users** can view and book rides, manage their own profile and bookings.
- **Enterprise users** have the same permissions as private users but are associated with an enterprise.
- **Driver users** can manage their driver profile, vehicles, documents, schedules, and update their status and location.
- **Admin users** can access all endpoints, including user management, ride creation, and analytics.
- **Super admin users** have additional permissions for managing other admins and system configuration.
