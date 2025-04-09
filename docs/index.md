# RideShare API Documentation

Welcome to the RideShare API documentation. This documentation provides detailed information about the RideShare API, including endpoints, models, and usage examples.

## Table of Contents

### Getting Started
- [Introduction](introduction.md)
- [Authentication](authentication.md)
- [API Overview](api_overview.md)

### Core Features
- [Users and Authentication](users.md)
- [Rides](rides.md)
- [Bookings](bookings.md)
- [Payments](payments.md)
- [Payment Methods](payment_methods.md)
- [User Preferences](user_preferences.md)
- [Messaging](messaging.md)
- [Locations and Hubs](locations.md)

### Administration
- [Admin Features](admin_features.md)
- [Driver Management](driver_management.md)
- [Vehicle Management](vehicle_management.md)

### Development
- [Database Migration Utilities](database_migration_utilities.md)
- [Error Handling](error_handling.md)
- [Testing](testing.md)
- [Deployment](deployment.md)

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh-token` - Refresh authentication token

### Users
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update current user profile
- `GET /api/v1/users/{user_id}` - Get user by ID

### Rides
- `GET /api/v1/rides` - List available rides
- `GET /api/v1/rides/{ride_id}` - Get ride details
- `POST /api/v1/rides` - Create a new ride
- `PUT /api/v1/rides/{ride_id}` - Update a ride
- `DELETE /api/v1/rides/{ride_id}` - Delete a ride

### Bookings
- `GET /api/v1/bookings` - List user bookings
- `GET /api/v1/bookings/{booking_id}` - Get booking details
- `POST /api/v1/bookings` - Create a new booking
- `POST /api/v1/bookings/{booking_id}/payment` - Process payment for a booking

### Payment Methods
- `GET /api/v1/payment-methods` - List user payment methods
- `POST /api/v1/payment-methods` - Create a new payment method
- `GET /api/v1/payment-methods/{payment_method_id}` - Get payment method details
- `PUT /api/v1/payment-methods/{payment_method_id}` - Update a payment method
- `DELETE /api/v1/payment-methods/{payment_method_id}` - Delete a payment method
- `POST /api/v1/payment-methods/{payment_method_id}/set-default` - Set a payment method as default

### User Preferences
- `GET /api/v1/user-preferences` - Get user preferences
- `POST /api/v1/user-preferences` - Create user preferences
- `PUT /api/v1/user-preferences` - Update user preferences

### Messages
- `GET /api/v1/messages` - List user messages
- `GET /api/v1/messages/{message_id}` - Get message details
- `POST /api/v1/messages` - Send a new message

### Admin
- `GET /api/v1/admin/users` - List all users (admin only)
- `GET /api/v1/admin/rides` - List all rides (admin only)
- `GET /api/v1/admin/bookings` - List all bookings (admin only)

## Models

- [User](models/user.md)
- [Ride](models/ride.md)
- [Booking](models/booking.md)
- [Payment](models/payment.md)
- [PaymentMethod](models/payment_method.md)
- [UserPreference](models/user_preference.md)
- [Message](models/message.md)
- [Location](models/location.md)
- [Hub](models/hub.md)

## Development Resources

- [Database Schema](database_schema.md)
- [API Response Formats](api_response_formats.md)
- [Error Codes](error_codes.md)
- [Webhooks](webhooks.md)

## Support

If you need help with the RideShare API, please contact our support team at support@rideshare.example.com.
