# Booking Management

This document provides detailed examples for managing bookings in the RideShare API.

## Creating a Booking

To book a seat on a ride:

```
POST /api/v1/bookings
```

### Request Body:

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
  "matching_preferences": {
    "prefer_same_enterprise": true,
    "prefer_same_starting_hub": true
  }
}
```

### Required Fields:

- `ride_id`: ID of the ride to book
- `passengers`: List of passengers for this booking
  - At least one passenger is required
  - Maximum 10 passengers per booking
  - For each passenger, provide either:
    - `user_id`: ID of a registered user
    - OR `email`, `name`, and `phone` for non-registered passengers

### Optional Fields:

- `matching_preferences`: Preferences for ride matching
  - `prefer_same_enterprise`: Prefer passengers from the same enterprise
  - `prefer_same_starting_hub`: Prefer passengers starting from the same hub

### Backward Compatibility:

- `seats_booked`: Number of seats to book (default: 1, max: 10)

### Response:

```json
{
  "id": 123,
  "ride_id": 1,
  "passenger_id": 456,
  "seats_booked": 2,
  "booking_status": "confirmed",
  "created_at": "2025-04-15T14:30:00",
  "passengers": [
    {
      "id": 1,
      "booking_id": 123,
      "user_id": 456,
      "email": null,
      "name": null,
      "phone": null,
      "is_primary": true,
      "created_at": "2025-04-15T14:30:00",
      "user_details": {
        "id": 456,
        "email": "user@example.com",
        "name": "John Doe",
        "phone": "+46701234567"
      }
    },
    {
      "id": 2,
      "booking_id": 123,
      "user_id": null,
      "email": "guest@example.com",
      "name": "Guest User",
      "phone": "+46701234567",
      "is_primary": false,
      "created_at": "2025-04-15T14:30:00",
      "user_details": null
    }
  ]
}
```

## Getting User Bookings

To get all bookings for the current user:

```
GET /api/v1/bookings
```

Optional query parameters:

- `status`: Filter by booking status (confirmed, cancelled, completed)
- `limit`: Limit the number of results
- `skip`: Skip the first N results

### Response:

```json
[
  {
    "id": 123,
    "ride_id": 1,
    "passenger_id": 456,
    "seats_booked": 2,
    "booking_status": "confirmed",
    "created_at": "2025-04-15T14:30:00",
    "passengers": [
      {
        "id": 1,
        "booking_id": 123,
        "user_id": 456,
        "email": null,
        "name": null,
        "phone": null,
        "is_primary": true,
        "created_at": "2025-04-15T14:30:00",
        "user_details": {
          "id": 456,
          "email": "user@example.com",
          "name": "John Doe",
          "phone": "+46701234567"
        }
      },
      {
        "id": 2,
        "booking_id": 123,
        "user_id": null,
        "email": "guest@example.com",
        "name": "Guest User",
        "phone": "+46701234567",
        "is_primary": false,
        "created_at": "2025-04-15T14:30:00",
        "user_details": null
      }
    ],
    "ride": {
      "id": 1,
      "starting_hub_id": 1,
      "destination_hub_id": 2,
      "departure_time": "2025-04-16T08:00:00",
      "status": "scheduled"
    }
  }
]
```

## Getting Ride Bookings (Admin or Driver Only)

To get all bookings for a specific ride:

```
GET /api/v1/rides/{ride_id}/bookings
```

### Response:

```json
[
  {
    "id": 123,
    "ride_id": 1,
    "passenger_id": 456,
    "seats_booked": 2,
    "booking_status": "confirmed",
    "created_at": "2025-04-15T14:30:00",
    "passengers": [
      {
        "id": 1,
        "booking_id": 123,
        "user_id": 456,
        "email": null,
        "name": null,
        "phone": null,
        "is_primary": true,
        "created_at": "2025-04-15T14:30:00",
        "user_details": {
          "id": 456,
          "email": "john.doe@example.com",
          "name": "John Doe",
          "phone": "+46701234567"
        }
      },
      {
        "id": 2,
        "booking_id": 123,
        "user_id": null,
        "email": "guest@example.com",
        "name": "Guest User",
        "phone": "+46701234567",
        "is_primary": false,
        "created_at": "2025-04-15T14:30:00",
        "user_details": null
      }
    ]
  }
]
```

## Ride Matching

The booking system supports intelligent ride matching based on user preferences:

1. **Enterprise Matching**: Users from the same enterprise can be matched for rides
2. **Hub Matching**: Users starting from the same hub can be matched for rides
3. **Destination Matching**: Users going to the same destination can be matched for rides

To enable matching, include the `matching_preferences` object in the booking request.

## Cancelling a Booking

To cancel a booking:

```
POST /api/v1/bookings/{booking_id}/cancel
```

### Response:

```json
{
  "id": 123,
  "ride_id": 1,
  "passenger_id": 456,
  "seats_booked": 1,
  "booking_status": "cancelled",
  "created_at": "2023-04-15T14:30:00"
}
```

## Common Errors

1. **Ride not found**: The specified ride_id does not exist
2. **Not enough seats**: The ride doesn't have enough available seats
3. **Ride already departed**: Cannot book a ride that has already departed
4. **Ride cancelled**: Cannot book a cancelled ride
5. **Booking not found**: The specified booking_id does not exist
6. **Unauthorized**: You don't have permission to view or modify this booking
