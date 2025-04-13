# RideShare API Documentation

This document provides examples of request and response bodies for the main endpoints of the RideShare API.

## Table of Contents

- [Authentication](#authentication)
  - [Login](#login)
  - [Get Current User](#get-current-user)
- [Users](#users)
  - [Create User](#create-user)
  - [Update User](#update-user)
- [Rides](#rides)
  - [Create Ride](#create-ride)
  - [Get Rides](#get-rides)
- [Bookings](#bookings)
  - [Create Booking](#create-booking)
  - [Get User Bookings](#get-user-bookings)
- [Ride Matching](#ride-matching)
  - [Find Matching Rides](#find-matching-rides)

## Authentication

### Login

**Endpoint:** `POST /api/auth/token`

**Request Body:**

```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response Body:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_admin": false
}
```

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Body:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_admin": false,
  "is_superadmin": false
}
```

## Users

### Create User

**Endpoint:** `POST /api/v1/users`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+46701234567",
  "user_type": "private",
  "home_address": "Avenyn 1, 41136 Göteborg",
  "work_address": "Lindholmspiren 5, 41756 Göteborg",
  "home_street": "Avenyn",
  "home_house_number": "1",
  "home_post_code": "41136",
  "home_city": "Göteborg",
  "work_street": "Lindholmspiren",
  "work_house_number": "5",
  "work_post_code": "41756",
  "work_city": "Göteborg"
}
```

**Note:** Latitude and longitude coordinates are automatically calculated from the provided addresses using geocoding.

**Response Body:**

```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+46701234567",
  "home_address": "Avenyn 1, 41136 Göteborg",
  "work_address": "Lindholmspiren 5, 41756 Göteborg",
  "user_type": "private",
  "latitude": 57.701706,
  "longitude": 11.9726,
  "work_latitude": 57.7069472,
  "work_longitude": 11.9396881,
  "id": 163,
  "user_id": "UID-1C51A2BC",
  "created_at": "2025-04-13T15:35:09.274700",
  "is_active": true,
  "home_coordinates": null,
  "work_coordinates": null,
  "full_name": "John Doe"
}
```

**Note:** The `latitude`, `longitude`, `work_latitude`, and `work_longitude` fields in the response are automatically calculated from the provided addresses using geocoding.

### Update User

**Endpoint:** `PUT /api/users/me`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "first_name": "Updated",
  "last_name": "Name",
  "home_address": "New Address",
  "work_address": "New Work Address"
}
```

**Response Body:**

```json
{
  "id": 1,
  "user_id": "UID-A1B2C3D4",
  "email": "user@example.com",
  "first_name": "Updated",
  "last_name": "Name",
  "full_name": "Updated Name",
  "phone_number": "0701234567",
  "user_type": "private",
  "is_active": true,
  "created_at": "2023-06-15T14:30:45.123456",
  "updated_at": "2023-06-16T09:22:15.654321",
  "home_coordinates": [57.7089, 11.9746],
  "work_coordinates": null
}
```

## Rides

### Create Ride

**Endpoint:** `POST /api/rides`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
// For ride_type: "hub_to_hub"
{
  "starting_hub_id": 1,
  "destination_hub_id": 2,
  "departure_time": "2023-07-01T08:00:00Z",
  "price_per_seat": 50.0,
  "available_seats": 4,
  "vehicle_type_id": 1,
  "ride_type": "hub_to_hub",
  "recurrence_pattern": "one_time"
}

// For ride_type: "hub_to_destination"
{
  "starting_hub_id": 1,
  "destination": {
    "name": "Shopping Mall",
    "address": "123 Mall Road",
    "city": "Gothenburg",
    "latitude": 57.7089,
    "longitude": 11.9746
  },
  "departure_time": "2023-07-01T09:00:00Z",
  "price_per_seat": 60.0,
  "available_seats": 3,
  "vehicle_type_id": 1,
  "ride_type": "hub_to_destination",
  "recurrence_pattern": "one_time"
}
```

**Response Body:**

```json
// For ride_type: "hub_to_hub"
{
  "id": 1,
  "ride_type": "hub_to_hub",
  "departure_time": "2023-07-01T08:00:00Z",
  "status": "scheduled",
  "available_seats": 4,
  "price_per_seat": 50.0,
  "starting_hub": {
    "id": 1,
    "name": "Central Station",
    "city": "Gothenburg"
  },
  "destination_hub": {
    "id": 2,
    "name": "Business Park",
    "city": "Gothenburg"
  }
}

// For ride_type: "hub_to_destination"
{
  "id": 2,
  "ride_type": "hub_to_destination",
  "departure_time": "2023-07-01T08:00:00Z",
  "status": "scheduled",
  "available_seats": 4,
  "price_per_seat": 50.0,
  "starting_hub": {
    "id": 1,
    "name": "Central Station",
    "city": "Gothenburg"
  },
  "destination": {
    "id": 2,
    "name": "Business Park",
    "city": "Gothenburg"
  }
}
```

### Get Rides

**Endpoint:** `GET /api/rides`

**Query Parameters:**

- `destination_id` (optional): Filter by destination ID
- `hub_id` (optional): Filter by hub ID
- `status` (optional): Filter by ride status
- `future_only` (optional): Only include future rides

**Response Body:**

```json
[
  {
    "id": 1,
    "ride_type": "hub_to_hub",
    "departure_time": "2023-07-01T08:00:00Z",
    "status": "scheduled",
    "available_seats": 4,
    "price_per_seat": 50.0,
    "starting_hub": {
      "id": 1,
      "name": "Central Station",
      "city": "Gothenburg"
    },
    "destination_hub": {
      "id": 2,
      "name": "Business Park",
      "city": "Gothenburg"
    }
  },
  {
    "id": 2,
    "ride_type": "hub_to_destination",
    "departure_time": "2023-07-01T09:00:00Z",
    "status": "scheduled",
    "available_seats": 3,
    "price_per_seat": 60.0,
    "starting_hub": {
      "id": 1,
      "name": "Central Station",
      "city": "Gothenburg"
    },
    "destination": {
      "id": 3,
      "name": "Shopping Mall",
      "city": "Gothenburg"
    }
  }
]
```

## Bookings

### Create Booking

**Endpoint:** `POST /api/bookings`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "ride_id": 1,
  "passenger_count": 1
}
```

**Response Body:**

```json
{
  "id": 1,
  "user_id": 1,
  "ride_id": 1,
  "passenger_count": 1,
  "status": "confirmed",
  "price": 50.0,
  "booking_time": "2023-06-15T14:30:45.123456",
  "notes": null
}
```

### Get User Bookings

**Endpoint:** `GET /api/bookings`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Body:**

```json
[
  {
    "id": 1,
    "user_id": 1,
    "ride_id": 1,
    "passenger_count": 1,
    "status": "confirmed",
    "price": 50.0,
    "booking_time": "2023-06-15T14:30:45.123456",
    "notes": null
  },
  {
    "id": 2,
    "user_id": 1,
    "ride_id": 3,
    "passenger_count": 2,
    "status": "confirmed",
    "price": 100.0,
    "booking_time": "2023-06-16T10:15:30.654321",
    "notes": null
  }
]
```

## Ride Matching

### Find Matching Rides

**Endpoint:** `POST /api/matching/find-rides`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
  "destination_id": 1,
  "departure_time": "2023-07-01T08:00:00Z",
  "time_flexibility": 30,
  "max_results": 5
}
```

**Response Body:**

```json
[
  {
    "ride_id": 1,
    "departure_time": "2023-07-01T08:15:00Z",
    "arrival_time": "2023-07-01T08:45:00Z",
    "hub_id": 2,
    "hub_name": "Business Park",
    "vehicle_type": "sedan",
    "available_seats": 3,
    "total_capacity": 4,
    "overall_score": 85.5
  },
  {
    "ride_id": 5,
    "departure_time": "2023-07-01T07:45:00Z",
    "arrival_time": "2023-07-01T08:30:00Z",
    "hub_id": 3,
    "hub_name": "Residential Area",
    "vehicle_type": "minivan",
    "available_seats": 5,
    "total_capacity": 7,
    "overall_score": 72.3
  }
]
```
