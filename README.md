# RideShare Project README

## Project Overview

RideShare is a comprehensive ridesharing platform designed to facilitate efficient, sustainable transportation for individuals and enterprises. The application consists of three primary interfaces:

1. **User App**: Enables riders to book, manage, and track rides.
2. **Enterprise Portal**: Allows company administrators to manage employee transportation and analyze usage.
3. **Admin Dashboard**: Provides system administrators with tools to oversee users, enterprises, rides, and system configurations.

The project aims to streamline commuting by integrating advanced ride-matching algorithms, real-time tracking, and enterprise-specific features, all while prioritizing accessibility, scalability, and user experience.

### Backend Development

- **Data Models**: Defined and implemented SQLAlchemy models for `User`, `Enterprise`, `Hub`, `Location`, `Ride`, `RideBooking`, `DriverProfile`, `DriverVehicle`, `DriverDocument`, `DriverSchedule`, and `Payment`, supporting spatial data with GeoAlchemy2.
- **Database Initialization**: Set up a SQLite database (configurable to PostgreSQL/PostGIS) with automatic table creation and a fake data generator for testing.
- **Business Services**: Created services for:
  - `AuthService`: User authentication with JWT, supporting different user roles (admin, driver, regular user).
  - `UserService`: User creation and updates with automatic geocoding for addresses.
  - `RideService`: Ride scheduling and management for hub-to-hub, hub-to-destination, and enterprise rides.
  - `BookingService`: Ride booking and payment processing.
  - `DriverService`: Driver profile management, vehicle management, document management, and scheduling.
  - `EnterpriseService`: Enterprise profile management and enterprise-specific ride creation.
  - `MatchingService`: Ride matching based on user location, destination, and time flexibility.
  - `RealTimeService`: Basic WebSocket integration for live updates (e.g., location tracking).
  - `NotificationService`: Placeholder for future email/SMS/push notifications.
  - `AnalyticsService`: Placeholder for usage analytics.
- **API Endpoints**: Implemented RESTful endpoints with FastAPI:
  - `/api/v1/auth/token`: User login.
  - `/api/v1/users`: User registration with geocoding support for home/work addresses.
  - `/api/v1/users/me`: Profile retrieval and updates.
  - `/api/v1/rides`: Ride listing and creation (admin-only).
  - `/api/v1/bookings`: Booking management and payment processing.
  - `/api/v1/drivers/with-user`: One-step driver registration.
  - `/api/v1/drivers/me`: Driver profile management.
  - `/api/v1/drivers/{driver_id}/vehicles`: Driver vehicle management.
  - `/api/v1/drivers/{driver_id}/documents`: Driver document management.
  - `/api/v1/drivers/{driver_id}/schedule`: Driver schedule management.
  - `/api/v1/enterprises`: Enterprise profile management.
  - `/api/v1/matching/find-rides`: Ride matching based on user preferences.
- **Geocoding Integration**: Added OpenStreetMap Nominatim API to automatically convert `home_address` and `work_address` into `home_location` and `work_location` coordinates.
- **Fake Database**: Generated a test database with:
  - 100 Volvo Torslanda employees across 4 hubs.
  - 50 private users sharing a hub and destination.
  - 20 Mölnlycke Industrial Park users with a shared hub.
  - 10 drivers with vehicles and documents.
  - Corresponding rides, bookings, and payments.
- **Testing Framework**: Set up `pytest` with basic tests for user creation, driver management, and geocoding functionality.

### Project Structure

The backend is organized for clarity and scalability:

### Documentation

Detailed API documentation is available in the following files:

- [API Usage Guide](docs/api_usage.md): General guide for using the API, including authentication and common endpoints
- [API Documentation](docs/api.md): Comprehensive API reference with all endpoints
- [Ride Creation Examples](docs/ride_creation_examples.md): Detailed examples for creating different types of rides
- [Booking Management](docs/booking_management.md): Guide for managing ride bookings
- [Driver Management](docs/driver_management.md): Guide for driver-related operations and endpoints
- [Enterprise Operations](docs/enterprise_operations.md): Enterprise-specific operations and examples
- [Project Status](docs/project_status.md): Current state of the project, completed features, and upcoming tasks
- [Roadmap](docs/roadmap.md): Development roadmap with planned features and milestones

### Recent Updates

- **Driver Management System**: Complete implementation of driver profiles, vehicle management, document management, scheduling, and status tracking.
- **Enterprise Ride Types**: Support for enterprise-specific rides with company addresses as destinations.
- **One-Step Driver Registration**: Simplified driver registration process with a single API call.
- **Project Organization**: Improved project structure with development tools moved to a separate directory and updated .gitignore.
- **Documentation Updates**: Comprehensive documentation for all API endpoints, including driver management and enterprise operations.
