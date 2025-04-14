# RideShare API Documentation

Welcome to the RideShare API documentation. This documentation provides detailed information about the RideShare API, including endpoints, models, and usage examples.

## Table of Contents

### Getting Started

- [API Documentation](api_consolidated.md) - Comprehensive API reference with authentication, endpoints, and examples
- [Architecture](architecture.md) - System architecture overview
- [Authentication Flow](auth_flow.md) - Detailed authentication process

### Core Features

- [Booking Management](booking_management.md) - Guide for managing ride bookings
- [Ride Creation Examples](ride_creation_examples.md) - Detailed examples for creating different types of rides
- [Payment Methods](payment_methods.md) - Payment processing and management
- [User Preferences](user_preferences.md) - User preference system documentation

### Administration

- [Driver Management](driver_management.md) - Guide for driver-related operations
- [Vehicle Management](vehicle_management.md) - Vehicle and inspection management
- [Enterprise Operations](enterprise_operations.md) - Enterprise-specific operations

### Development

- [Database Schema](database_schema.md) - Database schema documentation
- [Database Migrations](database_migrations.md) - Database migration utilities
- [Project Status](project_status.md) - Current project status
- [Roadmap](roadmap.md) - Future development plans
- [Frontend Components](frontend_components.md) - UI component documentation
- [Pre-commit Setup](pre-commit-setup.md) - Development workflow setup

## Key API Endpoints

For a complete list of endpoints with detailed request/response examples, see the [API Documentation](api_consolidated.md).

### Authentication

- `POST /api/v1/auth/token` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh-token` - Refresh authentication token

### Users

- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile

### Rides

- `GET /api/v1/rides` - List available rides
- `POST /api/v1/rides` - Create a new ride

### Bookings

- `GET /api/v1/bookings` - List user bookings
- `POST /api/v1/bookings` - Create a new booking

### User Preferences

- `GET /api/v1/user-preferences` - Get user preferences
- `PUT /api/v1/user-preferences` - Update user preferences

### Vehicle Management

- `GET /api/v1/admin/vehicle-types` - List vehicle types
- `PUT /api/v1/admin/vehicle-types/{id}/inspection-status` - Update inspection status
- `POST /api/v1/admin/vehicle-types/check-inspections` - Trigger inspection checks

### Driver Management

- `POST /api/v1/drivers` - Register as a driver
- `GET /api/v1/drivers/me` - Get current driver profile

## Development Resources

- [Database Schema](database_schema.md)
- [API Response Formats](api_response_formats.md)
- [Error Codes](error_codes.md)
- [Webhooks](webhooks.md)

## Support

If you need help with the RideShare API, please contact our support team at support@rideshare.example.com.
