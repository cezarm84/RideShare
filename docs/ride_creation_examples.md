# Ride Creation Examples

This document provides detailed examples for creating different types of rides in the RideShare API.

## Prerequisites

Before creating rides, you should:

1. Authenticate and get a JWT token
2. Have admin or driver privileges
3. Know the IDs of hubs, vehicle types, and enterprises (if applicable)

You can get reference data using:
```
GET /api/v1/rides/reference-data
```

## 1. Hub-to-Hub Ride (One-Time)

For a simple one-time ride between two transportation hubs:

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

### Required Fields:
- `ride_type`: Must be "hub_to_hub"
- `starting_hub_id`: ID of the starting hub
- `destination_hub_id`: ID of the destination hub
- `departure_time`: For one-time rides
- `vehicle_type_id`: ID of the vehicle type
- `price_per_seat`: Price per seat in currency units
- `available_seats`: Number of available seats

## 2. Hub-to-Hub Ride (Recurring)

For a recurring ride between two transportation hubs:

```json
{
  "ride_type": "hub_to_hub",
  "starting_hub_id": 1,
  "destination_hub_id": 2,
  "recurrence_pattern": "weekdays",
  "start_date": "2025-04-15",
  "end_date": "2025-05-15",
  "departure_times": [
    "08:00",
    "17:00"
  ],
  "vehicle_type_id": 1,
  "price_per_seat": 50,
  "available_seats": 15,
  "status": "scheduled"
}
```

### Required Fields for Recurring Rides:
- `recurrence_pattern`: "daily", "weekdays", "weekly", or "monthly"
- `start_date`: Start date for the recurrence pattern
- `departure_times`: List of departure times for each day

## 3. Hub-to-Destination Ride

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

### Required Fields:
- `ride_type`: Must be "hub_to_destination"
- `destination`: Object with destination details
  - `name`: Name of the destination
  - `address`: Street address
  - `city`: City name
  - `latitude`: Latitude coordinate
  - `longitude`: Longitude coordinate
  - `postal_code`: Optional postal code
  - `country`: Optional country name

## 4. Enterprise Ride (One-Time)

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

### Required Fields:
- `ride_type`: Must be "enterprise"
- `enterprise_id`: ID of the enterprise
- Note: The destination will automatically use the enterprise's address

## 5. Enterprise Ride (Recurring)

For recurring rides for company employees:

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

## 6. Enterprise Ride with Custom Destination

If you need to specify a custom destination for an enterprise ride:

```json
{
  "ride_type": "enterprise",
  "starting_hub_id": 1,
  "enterprise_id": 1,
  "destination": {
    "name": "Company Event Location",
    "address": "456 Event St",
    "city": "Gothenburg",
    "latitude": 57.7089,
    "longitude": 11.9746
  },
  "recurrence_pattern": "one_time",
  "departure_time": "2025-04-15T08:00:00",
  "vehicle_type_id": 1,
  "price_per_seat": 0,
  "available_seats": 15,
  "status": "scheduled"
}
```

## 7. Enterprise Ride with Destination Hub

For enterprise rides to a transportation hub:

```json
{
  "ride_type": "enterprise",
  "starting_hub_id": 1,
  "enterprise_id": 1,
  "destination_hub_id": 2,
  "recurrence_pattern": "one_time",
  "departure_time": "2025-04-15T08:00:00",
  "vehicle_type_id": 1,
  "price_per_seat": 0,
  "available_seats": 15,
  "status": "scheduled"
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

## Common Errors

1. **Missing required fields**: Each ride type has specific required fields
2. **Invalid hub ID**: Make sure the hub IDs exist in the system
3. **Invalid enterprise ID**: Make sure the enterprise ID exists
4. **Invalid date/time format**: Use one of the supported formats
5. **Missing departure_time for one-time rides**: One-time rides require departure_time
6. **Missing departure_times for recurring rides**: Recurring rides require departure_times
