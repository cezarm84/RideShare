# Driver Management

This document provides detailed examples for driver-related operations in the RideShare API.

## Driver Registration and Authentication

### Registration Process

#### Driver Registration (Recommended Method)

The recommended way to register as a driver is using the one-step registration process:

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
  "bio": "Experienced driver with 5 years of driving history",
  "languages": "Swedish, English",
  "ride_type_permissions": ["hub_to_hub", "hub_to_destination"]
}
```

This endpoint creates both a user account with driver privileges and a driver profile in one step. After registration, the driver can immediately log in with their email and password.

#### Admin-Only Driver Profile Creation

For administrative purposes, there is also an endpoint that allows admins to create a driver profile for an existing user:

```
POST /api/v1/drivers
```

**Note:** This endpoint is primarily for admin use and backward compatibility. For new driver registrations, use the `/api/v1/drivers/with-user` endpoint instead.

Request body:

```json
{
  "user_id": 123, // ID of an existing user
  "license_number": "DL12345678",
  "license_expiry": "2026-04-08",
  "license_state": "Västra Götaland",
  "license_country": "Sweden",
  "license_class": "B",
  "preferred_radius_km": 15.0,
  "max_passengers": 4,
  "bio": "Experienced driver with 5 years of driving history",
  "languages": "Swedish, English",
  "ride_type_permissions": ["hub_to_hub", "hub_to_destination"]
}
```

### Using the Driver Creation Script

For convenience, a script is provided to create both a user account and driver profile in one step:

```
python -m app.scripts.create_driver_user [email] [password] [first_name] [last_name]
```

Example:

```
python -m app.scripts.create_driver_user driver@example.com password123 John Driver
```

This script:

1. Creates a new user with the provided credentials (or updates an existing user)
2. Creates a driver profile linked to that user
3. Sets the driver status to ACTIVE and verification status to VERIFIED

### Driver Authentication

Once the registration process is complete, drivers can authenticate using the standard authentication endpoint:

```
POST /api/v1/auth/token
```

Request body:

```
username=driver@example.com&password=password123
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 123,
  "email": "driver@example.com",
  "full_name": "John Driver"
}
```

## Driver Profile Management

### Get Current Driver Profile

```
GET /api/v1/drivers/me
```

Headers:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Response:

```json
{
  "id": 1,
  "user_id": 123,
  "status": "active",
  "verification_status": "verified",
  "license_number": "DL12345678",
  "license_expiry": "2026-04-08",
  "license_state": "Västra Götaland",
  "license_country": "Sweden",
  "license_class": "B",
  "profile_photo_url": "https://example.com/driver/profile/photo1.jpg",
  "average_rating": 4.8,
  "total_rides": 120,
  "completed_rides": 115,
  "cancelled_rides": 5,
  "preferred_radius_km": 15.0,
  "max_passengers": 4,
  "bio": "Experienced driver with 5 years of driving history",
  "languages": "Swedish, English, German",
  "created_at": "2023-01-15T10:30:00",
  "updated_at": "2023-04-08T14:45:00",
  "ride_type_permissions": ["hub_to_hub", "hub_to_destination"]
}
```

### Update Current Driver Profile

```
PUT /api/v1/drivers/me
```

Headers:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Request body (include only fields to update):

```json
{
  "bio": "Updated driver bio",
  "languages": "Swedish, English, German, Spanish",
  "preferred_radius_km": 20.0,
  "max_passengers": 6
}
```

Response: Updated driver profile object

## Driver Management (Admin Only)

### List All Drivers

```
GET /api/v1/drivers
```

Optional query parameters:

- `status`: Filter by driver status (active, pending, inactive, suspended, rejected)
- `skip`: Number of records to skip (pagination)
- `limit`: Maximum number of records to return (pagination)

### Get Specific Driver

```
GET /api/v1/drivers/{driver_id}
```

### Create a New Driver

```
POST /api/v1/drivers
```

Request body:

```json
{
  "user_id": 123,
  "license_number": "DL12345678",
  "license_expiry": "2026-04-08",
  "license_state": "Västra Götaland",
  "license_country": "Sweden",
  "license_class": "B",
  "profile_photo_url": "https://example.com/driver/profile/photo1.jpg",
  "preferred_radius_km": 15.0,
  "max_passengers": 4,
  "bio": "Experienced driver with 5 years of driving history",
  "languages": "Swedish, English, German",
  "ride_type_permissions": ["hub_to_hub", "hub_to_destination"]
}
```

### Update Driver Information

```
PUT /api/v1/drivers/{driver_id}
```

Request body (include only fields to update):

```json
{
  "status": "active",
  "verification_status": "verified",
  "license_expiry": "2027-04-08",
  "preferred_radius_km": 20.0
}
```

### Delete a Driver

```
DELETE /api/v1/drivers/{driver_id}
```

## Driver Status Management

### Update Driver Status

```
PUT /api/v1/drivers/{driver_id}/status?status=active
```

Valid status values:

- `pending`: Driver application is pending review
- `active`: Driver is active and can accept rides
- `inactive`: Driver is temporarily inactive
- `suspended`: Driver is suspended due to violations
- `rejected`: Driver application was rejected

## Driver Location Management

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

## Driver Vehicle Management

### Add Vehicle to Driver

```
POST /api/v1/drivers/{driver_id}/vehicles
```

Request body:

```json
{
  "vehicle_id": 1,
  "inspection_status": "passed",
  "last_inspection_date": "2023-01-15",
  "next_inspection_date": "2024-01-15",
  "is_primary": true
}
```

### Get Driver Vehicles

```
GET /api/v1/drivers/{driver_id}/vehicles
```

## Driver Document Management

### Upload Driver Document

```
POST /api/v1/drivers/{driver_id}/documents
```

Form data:

- `document_type`: Type of document (license, insurance, registration, vehicle_photo, profile_photo, background_check, other)
- `file`: Document file to upload
- `expiry_date`: Document expiry date (optional)

### Get Driver Documents

```
GET /api/v1/drivers/{driver_id}/documents
```

Optional query parameters:

- `document_type`: Filter by document type

## Driver Schedule Management

### Add Driver Schedule

```
POST /api/v1/drivers/{driver_id}/schedules
```

Request body:

```json
{
  "is_recurring": true,
  "day_of_week": 1, // 0 = Monday, 6 = Sunday
  "start_time": "08:00:00",
  "end_time": "17:00:00",
  "preferred_starting_hub_id": 1,
  "preferred_area": "Gothenburg Central",
  "is_active": true
}
```

For a specific date (non-recurring):

```json
{
  "is_recurring": false,
  "specific_date": "2023-05-15",
  "start_time": "08:00:00",
  "end_time": "17:00:00",
  "preferred_starting_hub_id": 1,
  "is_active": true
}
```

### Get Driver Schedules

```
GET /api/v1/drivers/{driver_id}/schedules
```

Optional query parameters:

- `active_only`: Only return active schedules (true/false)

## Driver Statistics

### Get Driver Statistics

```
GET /api/v1/drivers/{driver_id}/statistics
```

Optional query parameters:

- `period_days`: Statistics period in days (default: 30)

Response:

```json
{
  "driver_id": 1,
  "period_days": 30,
  "total_rides": 45,
  "completed_rides": 43,
  "cancelled_rides": 2,
  "average_rating": 4.8,
  "status": "active"
}
```
