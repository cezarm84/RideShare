# RideShare Project README

## Project Overview

RideShare is a comprehensive ridesharing platform designed to facilitate efficient, sustainable transportation for individuals and enterprises. The application consists of three primary interfaces:
1. **User App**: Enables riders to book, manage, and track rides.
2. **Enterprise Portal**: Allows company administrators to manage employee transportation and analyze usage.
3. **Admin Dashboard**: Provides system administrators with tools to oversee users, enterprises, rides, and system configurations.

The project aims to streamline commuting by integrating advanced ride-matching algorithms, real-time tracking, and enterprise-specific features, all while prioritizing accessibility, scalability, and user experience.


### Backend Development
- **Data Models**: Defined and implemented SQLAlchemy models for `User`, `Enterprise`, `Hub`, `Location`, `Ride`, `RideBooking`, and `Payment`, supporting spatial data with GeoAlchemy2.
- **Database Initialization**: Set up a SQLite database (configurable to PostgreSQL/PostGIS) with automatic table creation and a fake data generator for testing.
- **Business Services**: Created services for:
  - `AuthService`: User authentication with JWT.
  - `UserService`: User creation and updates with automatic geocoding for addresses.
  - `RideService`: Ride scheduling and management.
  - `BookingService`: Ride booking and payment processing.
  - `MatchingService`: Ride matching based on user location, destination, and time flexibility.
  - `RealTimeService`: Basic WebSocket integration for live updates (e.g., location tracking).
  - `NotificationService`: Placeholder for future email/SMS/push notifications.
  - `AnalyticsService`: Placeholder for usage analytics.
- **API Endpoints**: Implemented RESTful endpoints with FastAPI:
  - `/api/auth/token`: User login.
  - `/api/users`: User registration with geocoding support for home/work addresses.
  - `/api/users/me`: Profile retrieval and updates.
  - `/api/rides`: Ride listing and creation (admin-only).
  - `/api/bookings`: Booking management and payment processing.
  - `/api/matching/find-rides`: Ride matching based on user preferences.
- **Geocoding Integration**: Added OpenStreetMap Nominatim API to automatically convert `home_address` and `work_address` into `home_location` and `work_location` coordinates.
- **Fake Database**: Generated a test database with:
  - 100 Volvo Torslanda employees across 4 hubs.
  - 50 private users sharing a hub and destination.
  - 20 Mölnlycke Industrial Park users with a shared hub.
  - Corresponding rides, bookings, and payments.
- **Testing Framework**: Set up `pytest` with basic tests for user creation and geocoding functionality.

### Project Structure
The backend is organized for clarity and scalability: