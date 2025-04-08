# Booking Management

This document provides detailed examples for managing bookings in the RideShare API.

## Creating a Booking

To book a seat on a ride:

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

### Required Fields:
- `ride_id`: ID of the ride to book
- `seats_booked`: Number of seats to book (default: 1, max: 10)

### Response:

```json
{
  "id": 123,
  "ride_id": 1,
  "passenger_id": 456,
  "seats_booked": 1,
  "booking_status": "confirmed",
  "created_at": "2023-04-15T14:30:00"
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
    "seats_booked": 1,
    "booking_status": "confirmed",
    "created_at": "2023-04-15T14:30:00",
    "ride": {
      "id": 1,
      "starting_hub_id": 1,
      "destination_hub_id": 2,
      "departure_time": "2023-04-16T08:00:00",
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
    "seats_booked": 1,
    "booking_status": "confirmed",
    "created_at": "2023-04-15T14:30:00",
    "passenger": {
      "id": 456,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com"
    }
  }
]
```

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
