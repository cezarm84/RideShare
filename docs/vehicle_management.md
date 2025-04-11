# Vehicle Management

This document provides detailed information about vehicle management in the RideShare application, including vehicle types, inspection status, and related operations.

## Vehicle Types

Vehicle types define the categories of vehicles available in the system. Each vehicle type has specific characteristics such as capacity and price factor.

### Vehicle Type Management (Admin Only)

#### List All Vehicle Types

```
GET /api/v1/admin/vehicle-types
```

Optional query parameters:
- `skip`: Number of records to skip (pagination)
- `limit`: Maximum number of records to return (pagination)

#### Create a New Vehicle Type

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

#### Get a Specific Vehicle Type

```
GET /api/v1/admin/vehicle-types/{vehicle_type_id}
```

#### Update a Vehicle Type

```
PUT /api/v1/admin/vehicle-types/{vehicle_type_id}
```

Request body (include only fields to update):

```json
{
  "description": "Updated description",
  "capacity": 10,
  "price_factor": 1.8
}
```

#### Delete a Vehicle Type

```
DELETE /api/v1/admin/vehicle-types/{vehicle_type_id}
```

## Vehicle Inspection Management

The RideShare application includes a comprehensive vehicle inspection management system to ensure all vehicles meet safety standards.

### Inspection Status Values

- `pending`: Vehicle is waiting for inspection
- `passed`: Vehicle has passed inspection and is approved for use
- `failed`: Vehicle has failed inspection and needs repairs
- `expired`: Vehicle's inspection has expired and needs re-inspection

### Update Vehicle Type Inspection Status

```
PUT /api/v1/admin/vehicle-types/{vehicle_type_id}/inspection-status
```

Query parameters:
- `inspection_status`: New inspection status (passed, failed, pending, expired)
- `last_inspection_date`: Date of last inspection (YYYY-MM-DD)
- `next_inspection_date`: Date of next inspection (YYYY-MM-DD)

This endpoint updates the inspection status for all vehicles of a specific type and sends notifications to affected drivers and admins.

### Manually Trigger Inspection Checks

```
POST /api/v1/admin/vehicle-types/check-inspections
```

This endpoint manually triggers the inspection date check process, which:
1. Finds vehicles with expired inspection dates
2. Updates their status from "passed" to "pending"
3. Sends notifications to drivers and admins

### Automatic Inspection Status Updates

The system automatically checks inspection dates daily and:
- Updates vehicles with expired inspection dates from "passed" to "pending"
- Sends notifications to drivers and admins about expired inspections
- Sends reminders about inspections expiring within 7 days

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

**Note**: Vehicles with "pending" inspection status cannot be added to a driver. The vehicle must pass inspection first.

### Get Driver Vehicles

```
GET /api/v1/drivers/{driver_id}/vehicles
```

### Update Driver Vehicle Inspection Status

```
PUT /api/v1/drivers/{driver_id}/vehicles/{vehicle_id}/inspection
```

Query parameters:
- `inspection_status`: New inspection status (passed, failed, expired)
- `last_inspection_date`: Date of last inspection
- `next_inspection_date`: Date of next inspection

## Inspection Notifications

The system sends notifications to drivers and admins in the following scenarios:

### Expired Inspection Notifications

When a vehicle's inspection expires, notifications are sent to:
- The driver, informing them that their vehicle cannot be used for rides until it passes a new inspection
- All admins, alerting them about the expired vehicle inspection

### Inspection Reminder Notifications

When a vehicle's inspection is approaching expiration (within 7 days), notifications are sent to:
- The driver, reminding them to schedule an inspection soon
- All admins, informing them about the upcoming inspection deadline

## Implementation Details

### Inspection Check Process

The inspection check process runs:
- Automatically every day at 1:00 AM
- Manually when triggered through the admin API

The process:
1. Identifies vehicles with expired inspection dates
2. Updates their status from "passed" to "pending"
3. Sends appropriate notifications
4. Identifies vehicles with upcoming inspection deadlines
5. Sends reminder notifications

### Ride Creation Validation

The system prevents drivers from creating rides if they don't have a vehicle with "passed" inspection status. This ensures that only properly inspected vehicles are used for rides.

## Best Practices

1. **Regular Inspections**: Schedule regular vehicle inspections to ensure safety
2. **Timely Updates**: Update inspection status promptly after inspections
3. **Monitoring**: Regularly check the inspection status summary to identify vehicles needing attention
4. **Documentation**: Maintain records of all inspections and status changes
5. **Driver Communication**: Ensure drivers understand the importance of timely inspections
