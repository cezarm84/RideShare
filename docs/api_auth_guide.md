# RideShare API Authentication Guide

This guide explains how to authenticate with the RideShare API and use JWT tokens for subsequent requests.

## Getting an Authentication Token

First, you need to obtain a JWT token by authenticating with your credentials:

```
POST /api/v1/auth/token
```

### Request Format:

Send your credentials as form data (not JSON):

```
Content-Type: application/x-www-form-urlencoded

username=admin@rideshare.com&password=admin123
```

If using Postman or a similar tool, use the "x-www-form-urlencoded" format.

### Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "email": "admin@rideshare.com",
  "full_name": "Super Admin",
  "is_admin": true
}
```

## Using the Token for API Requests

For all subsequent API requests, you must include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Example with cURL:

```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Example with Postman:

1. Add a header:

   - Key: `Authorization`
   - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. Send your request to any protected endpoint.

## Common Authentication Issues

If you're getting 401 Unauthorized errors, check the following:

1. **Token Format**: Ensure the format is exactly `Bearer [token]` with a space after "Bearer"
2. **Token Validity**: Tokens expire after a period (default is 30 minutes)
3. **Scope Issues**: Some endpoints require admin privileges

## Testing Authentication

A simple way to test if your authentication is working is to call the `/api/v1/users/me` endpoint:

```
GET /api/v1/users/me
```

This should return your user profile if the token is valid.

## API Token Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │ Auth Service │     │  API Route  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │  POST /auth/token │                   │
       │───────────────────►                   │
       │                   │                   │
       │  TOKEN Response   │                   │
       │◄───────────────────                   │
       │                   │                   │
       │                   │                   │
       │ GET /api/v1/users/me (with token)    │
       │───────────────────────────────────────►
       │                   │                   │
       │                   │  Validate Token   │
       │                   │◄──────────────────┤
       │                   │                   │
       │                   │  Token Valid      │
       │                   │───────────────────►
       │                   │                   │
       │       Response with User Data         │
       │◄─────────────────────────────��─────────
       │                   │                   │
```
