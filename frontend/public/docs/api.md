# RideShare API Documentation

## Authentication

All API calls (except registration and login) require authentication using Bearer tokens.

### Login

```
POST /api/v1/auth/token
```

**Request Body:**

```json
{
  "username": "user@example.com", // Email address
  "password": "yourpassword"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "user_type": "private"
}
```

## Users

### Create User

```
POST /api/v1/users
```

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

### Get Current User

```
GET /api/v1/users/me
```

**Headers:**

```
Authorization: Bearer {your_token}
```

### Update Current User

```
PUT /api/v1/users/me
```

**Headers:**

```
Authorization: Bearer {your_token}
```

**Request Body:**

```json
{
  "first_name": "Updated",
  "last_name": "Name",
  "home_address": "New Address"
}
```

## Driver Endpoints

### Driver Registration

```
POST /api/v1/drivers/with-user
```

**Request Body:**

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

### Get Driver Profile

```
GET /api/v1/drivers/me
```

**Headers:**

```
Authorization: Bearer {your_token}
```

### Update Driver Profile

```
PUT /api/v1/drivers/me
```

**Headers:**

```
Authorization: Bearer {your_token}
```

**Request Body:**

```json
{
  "bio": "Updated driver bio",
  "languages": "Swedish, English, German",
  "preferred_radius_km": 20.0
}
```

### Update Driver Location

```
PUT /api/v1/drivers/{driver_id}/location
```

**Headers:**

```
Authorization: Bearer {your_token}
```

**Request Body:**

```json
{
  "latitude": 57.7089,
  "longitude": 11.9746
}
```

### Add Vehicle to Driver

```
POST /api/v1/drivers/{driver_id}/vehicles
```

**Headers:**

```
Authorization: Bearer {your_token}
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

## Admin Endpoints

All admin endpoints require a user with admin privileges.

### Get All Users

```
GET /api/v1/users
```

### Get All Drivers

```
GET /api/v1/drivers
```

### Update Driver Status

```
PUT /api/v1/drivers/{driver_id}/status
```

**Request Body:**

```json
{
  "status": "active"
}
```
