# Enterprise Operations

This document provides detailed examples for enterprise-related operations in the RideShare API.

## Enterprise Management (Admin Only)

### Get All Enterprises

```
GET /api/v1/admin/enterprises
```

### Response:

```json
[
  {
    "id": 1,
    "name": "Volvo",
    "address": "Volvo Headquarters, 405 31",
    "city": "Gothenburg",
    "postal_code": "405 31",
    "country": "Sweden",
    "latitude": 57.7089,
    "longitude": 11.9746,
    "is_active": true
  }
]
```

### Get Specific Enterprise

```
GET /api/v1/admin/enterprises/{enterprise_id}
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

### Update an Enterprise

```
PUT /api/v1/admin/enterprises/{enterprise_id}
```

Request body (include only fields to update):

```json
{
  "address": "New Address",
  "latitude": 57.7090,
  "longitude": 11.9747
}
```

## Enterprise Rides

### Get Enterprise Rides

```
GET /api/v1/enterprises/{enterprise_id}/rides
```

Optional query parameters:
- `future_only=true` - Only show future rides
- `limit=10` - Limit the number of results
- `skip=0` - Skip the first N results

### Create an Enterprise Ride

```
POST /api/v1/rides
```

#### One-Time Enterprise Ride

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

#### Recurring Enterprise Ride

```json
{
  "ride_type": "enterprise",
  "starting_hub_id": 1,
  "enterprise_id": 1,
  "recurrence_pattern": "weekdays",
  "start_date": "2025-04-15",
  "end_date": "2025-05-15",
  "departure_times": [
    "08:00",
    "17:00"
  ],
  "vehicle_type_id": 1,
  "price_per_seat": 0,
  "available_seats": 15,
  "status": "scheduled"
}
```

## Enterprise Users

### Get Enterprise Users

```
GET /api/v1/enterprises/{enterprise_id}/users
```

### Add User to Enterprise

```
POST /api/v1/enterprises/{enterprise_id}/users
```

Request body:

```json
{
  "user_id": 123,
  "employee_id": "EMP123",
  "department": "Engineering",
  "position": "Software Developer"
}
```

### Create New Enterprise User

```
POST /api/v1/users
```

Request body:

```json
{
  "email": "employee@company.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "1234567890",
  "user_type": "enterprise",
  "enterprise_id": 1,
  "employee_id": "EMP123",
  "department": "Engineering",
  "position": "Software Developer"
}
```

## Enterprise Statistics (Admin Only)

### Get Enterprise Ride Statistics

```
GET /api/v1/enterprises/{enterprise_id}/statistics
```

### Response:

```json
{
  "total_rides": 150,
  "completed_rides": 120,
  "total_passengers": 450,
  "average_occupancy": 75,
  "most_popular_times": [
    {
      "hour": 8,
      "count": 45
    },
    {
      "hour": 17,
      "count": 42
    }
  ],
  "most_popular_days": [
    {
      "day": "Monday",
      "count": 32
    },
    {
      "day": "Friday",
      "count": 30
    }
  ]
}
```

## Common Errors

1. **Enterprise not found**: The specified enterprise_id does not exist
2. **Missing required fields**: Make sure all required fields are provided
3. **Invalid coordinates**: Latitude must be between -90 and 90, longitude between -180 and 180
4. **User already in enterprise**: The user is already associated with this enterprise
5. **User not found**: The specified user_id does not exist
