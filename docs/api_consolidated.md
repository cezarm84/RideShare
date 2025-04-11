# RideShare API Documentation

This comprehensive guide provides detailed information about the RideShare API, including authentication, endpoints, request/response formats, and usage examples.

## Table of Contents

- [Authentication](#authentication)
  - [Getting a Token](#getting-a-token)
  - [Using the Token](#using-the-token)
  - [Token Refresh](#token-refresh)
- [Core Resources](#core-resources)
  - [Users](#users)
  - [Rides](#rides)
  - [Bookings](#bookings)
  - [Payments](#payments)
  - [User Preferences](#user-preferences)
- [Admin Resources](#admin-resources)
  - [Vehicle Types](#vehicle-types)
  - [Driver Management](#driver-management)
  - [Enterprise Management](#enterprise-management)
- [Advanced Features](#advanced-features)
  - [Ride Matching](#ride-matching)
  - [Analytics](#analytics)
  - [Messaging](#messaging)

## Authentication

All API requests (except for login and registration) require authentication using a JWT token.

### Getting a Token

```
POST /api/v1/auth/token
```

**Request Body:**

```json
{
  "username": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Using the Token

Include the token in the Authorization header of all subsequent requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

When your token is about to expire, you can get a new one without re-authenticating:

```
POST /api/v1/auth/refresh-token
```

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Core Resources

### Users

#### Get Current User

```
GET /api/v1/users/me
```

**Response:**

```json
{
  "id": 123,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "0701234567",
  "home_address": "123 Main St, Gothenburg",
  "work_address": "456 Office Blvd, Gothenburg",
  "user_type": "private",
  "full_name": "John Doe"
}
```

#### Update Current User

```
PUT /api/v1/users/me
```

**Request Body:**

```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone_number": "0701234567",
  "home_address": "123 New St, Gothenburg"
}
```

### Rides

#### Create a Ride

```
POST /api/v1/rides
```

**Request Body (Hub-to-Hub):**

```json
{
  "ride_type": "hub_to_hub",
  "starting_hub_id": 1,
  "destination_hub_id": 2,
  "departure_time": "2023-05-15T08:00:00",
  "available_seats": 3,
  "vehicle_type_id": 1,
  "price_per_seat": 50.00,
  "recurring": false
}
```

**Request Body (Hub-to-Destination):**

```json
{
  "ride_type": "hub_to_destination",
  "starting_hub_id": 1,
  "destination": {
    "address": "123 Main St, Gothenburg",
    "latitude": 57.7089,
    "longitude": 11.9746
  },
  "departure_time": "2023-05-15T08:00:00",
  "available_seats": 3,
  "vehicle_type_id": 1,
  "price_per_seat": 50.00,
  "recurring": false
}
```

**Request Body (Enterprise):**

```json
{
  "ride_type": "enterprise",
  "enterprise_id": 1,
  "starting_hub_id": 1,
  "departure_time": "2023-05-15T08:00:00",
  "available_seats": 3,
  "vehicle_type_id": 1,
  "price_per_seat": 50.00,
  "recurring": false
}
```

#### Get Available Rides

```
GET /api/v1/rides
```

Optional query parameters:
- `starting_hub_id`: Filter by starting hub
- `destination_hub_id`: Filter by destination hub
- `date`: Filter by date (YYYY-MM-DD)
- `min_available_seats`: Minimum number of available seats
- `vehicle_type_id`: Filter by vehicle type
- `ride_type`: Filter by ride type (hub_to_hub, hub_to_destination, enterprise)

### Bookings

#### Create a Booking

```
POST /api/v1/bookings
```

**Request Body:**

```json
{
  "ride_id": 1,
  "passengers": [
    {
      "user_id": 123,
      "email": null,
      "name": null,
      "phone": null
    },
    {
      "user_id": null,
      "email": "guest@example.com",
      "name": "Guest User",
      "phone": "+46701234567"
    }
  ],
  "payment_method_id": 1
}
```

#### Get User Bookings

```
GET /api/v1/bookings
```

Optional query parameters:
- `status`: Filter by booking status (confirmed, pending, cancelled)
- `upcoming`: Only show upcoming bookings (true/false)

### Payments

#### Process Payment

```
POST /api/v1/payments/process
```

**Request Body:**

```json
{
  "booking_id": 1,
  "payment_method_id": 1,
  "amount": 150.00
}
```

#### Get Payment Methods

```
GET /api/v1/payment-methods
```

#### Add Payment Method

```
POST /api/v1/payment-methods
```

**Request Body:**

```json
{
  "type": "credit_card",
  "card_number": "4111111111111111",
  "expiry_month": 12,
  "expiry_year": 2025,
  "card_holder_name": "John Doe",
  "is_default": true
}
```

### User Preferences

#### Get User Preferences

```
GET /api/v1/user-preferences
```

**Response:**

```json
{
  "id": 1,
  "user_id": 123,
  "theme": "dark",
  "language": "en",
  "notifications": true,
  "email_frequency": "daily",
  "push_enabled": true,
  "created_at": "2023-04-15T14:30:00",
  "updated_at": "2023-04-15T14:30:00"
}
```

#### Update User Preferences

```
PUT /api/v1/user-preferences
```

**Request Body:**

```json
{
  "theme": "light",
  "notifications": false
}
```

## Admin Resources

### Vehicle Types

#### List All Vehicle Types

```
GET /api/v1/admin/vehicle-types
```

#### Create a New Vehicle Type

```
POST /api/v1/admin/vehicle-types
```

**Request Body:**

```json
{
  "name": "Luxury Van",
  "description": "Comfortable van with premium features",
  "capacity": 8,
  "is_active": true,
  "price_factor": 1.5
}
```

#### Update Vehicle Type Inspection Status

```
PUT /api/v1/admin/vehicle-types/{vehicle_type_id}/inspection-status
```

Query parameters:
- `inspection_status`: New inspection status (passed, failed, pending, expired)
- `last_inspection_date`: Date of last inspection (YYYY-MM-DD)
- `next_inspection_date`: Date of next inspection (YYYY-MM-DD)

#### Manually Trigger Inspection Checks

```
POST /api/v1/admin/vehicle-types/check-inspections
```

### Driver Management

#### List All Drivers

```
GET /api/v1/drivers
```

Optional query parameters:
- `status`: Filter by driver status (active, pending, inactive, suspended, rejected)
- `skip`: Number of records to skip (pagination)
- `limit`: Maximum number of records to return (pagination)

#### Create a New Driver

```
POST /api/v1/drivers
```

**Request Body (Self-registration):**

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

**Request Body (Admin-only):**

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

#### Add Vehicle to Driver

```
POST /api/v1/drivers/{driver_id}/vehicles
```

**Request Body:**

```json
{
  "vehicle_id": 1,
  "inspection_status": "passed",
  "last_inspection_date": "2023-01-15",
  "next_inspection_date": "2024-01-15",
  "is_primary": true
}
```

### Enterprise Management

#### List All Enterprises

```
GET /api/v1/admin/enterprises
```

#### Create a New Enterprise

```
POST /api/v1/admin/enterprises
```

**Request Body:**

```json
{
  "name": "Acme Corporation",
  "address": "123 Business Ave, Gothenburg",
  "is_active": true
}
```

## Advanced Features

### Ride Matching

#### Find Matching Rides

```
GET /api/v1/matching/rides
```

Query parameters:
- `starting_hub_id`: Starting hub ID
- `destination_hub_id`: Destination hub ID (for hub-to-hub rides)
- `destination_latitude`: Destination latitude (for hub-to-destination rides)
- `destination_longitude`: Destination longitude (for hub-to-destination rides)
- `date`: Date of travel (YYYY-MM-DD)
- `passengers`: Number of passengers
- `max_results`: Maximum number of results to return

### Analytics

#### Get Ride Usage Statistics

```
GET /api/v1/analytics/ride-usage
```

Query parameters:
- `start_date`: Start date for statistics (YYYY-MM-DD)
- `end_date`: End date for statistics (YYYY-MM-DD)

### Messaging

#### Get User Conversations

```
GET /api/v1/messaging/conversations
```

#### Send a Message

```
POST /api/v1/messaging/messages
```

**Request Body:**

```json
{
  "recipient_id": 456,
  "content": "Hello, I have a question about the ride.",
  "conversation_id": 123
}
```

## Error Handling

All API endpoints return appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

Error responses include a detail message explaining the error:

```json
{
  "detail": "Ride with ID 123 not found"
}
```

## Pagination

Endpoints that return multiple items support pagination using `skip` and `limit` parameters:

```
GET /api/v1/rides?skip=0&limit=10
```

The response includes pagination metadata:

```json
{
  "items": [...],
  "total": 45,
  "page": 1,
  "pages": 5,
  "size": 10
}
```

## Filtering

Many endpoints support filtering using query parameters. The specific parameters are documented with each endpoint.

## Sorting

Some endpoints support sorting using the `sort_by` and `sort_order` parameters:

```
GET /api/v1/rides?sort_by=departure_time&sort_order=desc
```

Valid values for `sort_order` are `asc` (ascending) and `desc` (descending).
