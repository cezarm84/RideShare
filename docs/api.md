# RideShare API Documentation

## Authentication

All API calls (except registration and login) require authentication using Bearer tokens.

### Login

```
POST /api/auth/token
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
POST /api/users
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "0701234567",
  "home_address": "123 Main St, Gothenburg",
  "work_address": "456 Work St, Gothenburg",
  "latitude": 57.7089,
  "longitude": 11.9746
}
```

### Get Current User

```
GET /api/users/me
```

**Headers:**

```
Authorization: Bearer {your_token}
```

### Update Current User

```
PUT /api/users/me
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

## Admin Endpoints

All admin endpoints require a user with admin privileges.

### Get All Users

```
GET /api/users
```


