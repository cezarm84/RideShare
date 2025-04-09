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
  "departure_times": ["08:00:00", "17:00:00"],
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
  "departure_times": ["08:00", "17:00"],
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

## Date and Time Fields Explained

The API uses two different time-related fields that serve distinct purposes:

### Understanding the Difference

1. **`departure_time`**: Specifies the exact date and time of a one-time ride or the first instance of a recurring ride

   - Used for: One-time rides and the first instance of recurring rides
   - **Required format**: ISO 8601 datetime format: "2025-04-15T08:00:00"
   - Includes both date and time components
   - The date portion should match the `start_date`

2. **`departure_times`**: Specifies the time(s) of day for all instances of a recurring ride
   - Used for: Recurring rides (daily, weekly, monthly)
   - **Required format**: 24-hour time format: "08:00:00"
   - Includes only the time component (no date)
   - Can contain multiple times for multiple departures on each day
   - Example: `["08:00:00", "17:00:00"]` for rides at 8 AM and 5 PM on each day

### Example Usage

- **One-time ride**: Only `departure_time` is used
- **Recurring ride**: `departure_time` is used for the first instance, and `departure_times` is used for all instances

#### Recurring Ride Example

```json
{
  "ride_type": "hub_to_hub",
  "starting_hub_id": 1,
  "destination_hub_id": 2,
  "recurrence_pattern": "weekly",
  "start_date": "2025-05-15",
  "end_date": "2025-06-15",
  "departure_time": "2025-05-15T08:00:00", // First instance date and time
  "departure_times": ["08:00:00", "17:00:00"], // Times for all recurring instances
  "vehicle_type_id": 1,
  "price_per_seat": 50,
  "available_seats": 4,
  "status": "scheduled"
}
```

This creates a weekly recurring ride from May 15 to June 15, with two departures each day: one at 8:00 AM and another at 5:00 PM.

### Required Formats

- For `start_date` and `end_date`: ISO format: "2025-04-15"
- For `departure_time`: ISO 8601 datetime format: "2025-04-15T08:00:00"
- For `departure_times`: 24-hour time format: "08:00:00"

### Important Notes

- For `departure_time`, you **must** use the ISO 8601 datetime format (YYYY-MM-DDThh:mm:ss)
- For `departure_times` in recurring rides, you **must** use the 24-hour time format (HH:MM:SS)
- Always ensure dates are in the future
- Always set `available_seats` to at least 1
- Using incorrect formats will result in validation errors

## Preloaded Request Templates

When using the API documentation interface, you may receive default templates with placeholder values like "string" and "0". Below are improved templates with realistic values that you can use directly.

### Hub-to-Hub Ride Template

```json
{
  "ride_type": "hub_to_hub",
  "starting_hub_id": 1,
  "destination_hub_id": 2,
  "destination": null,
  "enterprise_id": null,
  "recurrence_pattern": "one_time",
  "start_date": "2023-04-15",
  "end_date": "2023-04-15",
  "departure_time": "2023-04-15T08:00:00",
  "departure_times": ["08:00:00"],
  "vehicle_type_id": 1,
  "price_per_seat": 40,
  "available_seats": 4,
  "status": "scheduled"
}
```

### Hub-to-Destination Ride Template

```json
{
  "ride_type": "hub_to_destination",
  "starting_hub_id": 1,
  "destination_hub_id": null,
  "destination": {
    "name": "Gothenburg Central Station",
    "address": "Drottningtorget 5",
    "city": "Gothenburg",
    "latitude": 57.7089,
    "longitude": 11.9746,
    "postal_code": "411 03",
    "country": "Sweden"
  },
  "enterprise_id": null,
  "recurrence_pattern": "one_time",
  "start_date": "2023-04-15",
  "end_date": "2023-04-15",
  "departure_time": "2023-04-15T08:00:00",
  "departure_times": ["08:00:00"],
  "vehicle_type_id": 1,
  "price_per_seat": 45,
  "available_seats": 4,
  "status": "scheduled"
}
```

### Enterprise Ride Template

```json
{
  "ride_type": "enterprise",
  "starting_hub_id": 1,
  "destination_hub_id": null,
  "destination": {
    "name": "Volvo Cars Headquarters",
    "address": "Assar Gabrielssons Väg 9",
    "city": "Gothenburg",
    "latitude": 57.7242,
    "longitude": 11.9079,
    "postal_code": "405 31",
    "country": "Sweden"
  },
  "enterprise_id": 1,
  "recurrence_pattern": "one_time",
  "start_date": "2023-04-15",
  "end_date": "2023-04-15",
  "departure_time": "2023-04-15T08:00:00",
  "departure_times": ["08:00:00"],
  "vehicle_type_id": 1,
  "price_per_seat": 50,
  "available_seats": 4,
  "status": "scheduled"
}
```

### Recurring Ride Template (Weekly)

```json
{
  "ride_type": "hub_to_hub",
  "starting_hub_id": 1,
  "destination_hub_id": 2,
  "destination": null,
  "enterprise_id": null,
  "recurrence_pattern": "weekly",
  "start_date": "2023-04-15",
  "end_date": "2023-05-15",
  "departure_time": "2023-04-15T08:00:00",
  "departure_times": ["08:00:00"],
  "vehicle_type_id": 1,
  "price_per_seat": 40,
  "available_seats": 4,
  "status": "scheduled"
}
```

## Common Errors

1. **Missing required fields**: Each ride type has specific required fields
2. **Invalid hub ID**: Make sure the hub IDs exist in the system
3. **Invalid enterprise ID**: Make sure the enterprise ID exists
4. **Invalid date/time format**: Use one of the supported formats
5. **Missing departure_time for one-time rides**: One-time rides require departure_time
6. **Missing departure_times for recurring rides**: Recurring rides require departure_times
7. **Invalid available_seats**: Must be at least 1
