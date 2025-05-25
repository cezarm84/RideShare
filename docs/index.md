# RideShare API Documentation

Welcome to the RideShare API documentation. This comprehensive documentation covers all aspects of the RideShare platform, including APIs, features, and implementation guides.

## Table of Contents

### Getting Started

- [API Documentation](api_consolidated.md) - Comprehensive API reference with authentication, endpoints, and examples
- [Architecture](architecture.md) - System architecture overview
- [Authentication Flow](auth_flow.md) - Detailed authentication process
- [Project Status](project_status.md) - Current development status and completed features

### Core Features

- [Booking Management](booking_management.md) - Guide for managing ride bookings
- [Ride Creation Examples](ride_creation_examples.md) - Detailed examples for creating different types of rides
- [Payment Methods](payment_methods.md) - Payment processing and management
- [User Preferences](user_preferences.md) - User preference system documentation

### Communication & AI

- [AI Chatbot System](ai_chatbot_system.md) - **NEW** AI-powered chatbot with OpenAI GPT integration
- [Messaging System](messaging_system.md) - **NEW** Real-time WebSocket messaging and chat channels
- [Email System](email_system.md) - Email service with SMTP integration and templates

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

- `GET /api/v1/rides` - List available rides with filtering
- `POST /api/v1/rides` - Create a new ride
- `GET /api/v1/rides/{id}` - Get ride details

### Bookings

- `GET /api/v1/bookings` - List user bookings
- `POST /api/v1/bookings` - Create a new booking
- `POST /api/v1/bookings/{id}/payment` - Process payment for booking

### AI Chatbot **NEW**

- `POST /api/v1/chatbot/chat` - Send message to AI chatbot (authenticated)
- `POST /api/v1/chatbot/public/chat` - Send message to AI chatbot (public)
- `POST /api/v1/chatbot/public/feedback` - Submit chatbot feedback

### Real-Time Messaging **NEW**

- `POST /api/v1/messaging/channels` - Create a new chat channel
- `GET /api/v1/messaging/channels` - List user's channels
- `POST /api/v1/messaging/channels/{id}/messages` - Send message to channel
- `WebSocket /api/v1/messaging/ws` - Real-time messaging connection

### Email System **NEW**

- `POST /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token

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
- `PUT /api/v1/drivers/me` - Update driver profile

### Admin Features

- `GET /api/v1/admin/users` - List all users with verification status
- `GET /api/v1/admin/drivers` - List all drivers
- `GET /api/v1/admin/enterprises` - List all enterprises
- `GET /api/v1/admin/chatbot/feedback` - Get chatbot feedback for review

## Development Resources

- [Database Schema](database_schema.md) - Complete database structure and relationships
- [Frontend Components](frontend_components.md) - React component documentation
- [Pre-commit Setup](pre-commit-setup.md) - Development workflow and code quality
- [CI/CD Documentation](CI_CD_DOCS.md) - Continuous integration and deployment
- [Backend Testing Plan](backend-testing-plan.md) - Testing strategies and guidelines
- [Frontend Testing Plan](frontend-testing-plan.md) - Frontend testing approaches

## Recent Features ✨

### AI-Powered Chatbot

- **OpenAI GPT Integration** for intelligent responses
- **Context-aware conversations** with sentiment analysis
- **Human agent escalation** with temporary chat channels
- **Multi-language support** and FAQ integration

### Real-Time Messaging

- **WebSocket-based communication** for instant messaging
- **Multi-channel support** (support, driver, enterprise, community)
- **Message types** including text, system, and media messages
- **Admin moderation tools** and channel management

### Enhanced Email System

- **SMTP integration** with template support
- **Email verification** and password reset workflows
- **Notification emails** for bookings and system events
- **Development testing** with MailHog integration

### Advanced Admin Dashboard

- **Comprehensive user management** with verification status
- **Real-time analytics** and system monitoring
- **Chatbot feedback review** and performance metrics
- **Multi-role management** for drivers and enterprises

## Technology Stack

- **Backend**: FastAPI (Python 3.11+) with SQLAlchemy 2.0
- **Frontend**: React 18 with TypeScript and Tailwind CSS
- **Database**: PostgreSQL with Alembic migrations
- **AI**: OpenAI GPT-4o-mini for chatbot intelligence
- **Real-time**: WebSocket for messaging and notifications
- **Email**: aiosmtplib with Jinja2 templates

## Support

If you need help with the RideShare API or platform:

- **Documentation**: Check this comprehensive documentation
- **AI Chatbot**: Use the built-in AI assistant for instant help
- **Support Channels**: Create a support ticket through the messaging system
- **Email**: Contact support@rideshare.com for technical assistance
