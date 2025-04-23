# RideShare - Modern Ride-Sharing Platform

## Project Overview

RideShare is a comprehensive ride-sharing platform designed to facilitate efficient, sustainable transportation for individuals and enterprises. Unlike traditional ride-hailing services (Uber/Lyft/Bolt), RideShare focuses on collective and flexible traffic solutions with targeted enterprise customers.

Currently available in Gothenburg (Göteborg) and surrounding municipalities, including Landvetter, RideShare aims to create a more sustainable and efficient transportation network by connecting commuters and optimizing routes.

The RideShare office is located at Norra Stommen 296, 438 32 Landvetter, Sweden, serving as the headquarters for our operations throughout the region.

## Key Features

- **User Management**: Complete user registration, authentication, and profile management with email verification
- **Ride Booking**: Flexible ride booking system supporting hub-to-hub, hub-to-destination, and enterprise rides
- **Enterprise Support**: Special features for companies to manage employee transportation with company-specific rides
- **Driver Management**: Comprehensive driver profiles, vehicle management, document management, scheduling, and status tracking
- **Intelligent Matching**: Advanced algorithms to match riders based on routes, preferences, and shared enterprise addresses
- **Real-time Updates**: Live tracking and notifications for rides with weather and traffic information
- **Secure Payments**: Multiple payment method support (Swish, PayPal, Apple Pay, Google Pay) with transaction history in SEK
- **Admin Dashboard**: Powerful tools for system administrators to manage all aspects of the platform

## System Architecture

The application consists of three primary interfaces:

1. **User App**: Enables riders to book, manage, and track rides with an intuitive interface
2. **Enterprise Portal**: Allows company administrators to manage employee transportation and analyze usage
3. **Admin Dashboard**: Provides system administrators with tools to oversee users, enterprises, rides, drivers, and system configurations

The project is built with a modern tech stack:

- **Backend**: FastAPI (Python) with SQLAlchemy ORM and Pydantic v2 for validation
- **Frontend**: React/Next.js with TypeScript, TailwindCSS, and shadcn UI components
- **Database**: SQLite (development) / PostgreSQL with PostGIS (production)
- **Authentication**: JWT-based authentication with role-based access control (superadmin/admin/manager/driver/user)
- **Email System**: SMTP integration for user verification, password management, and ride notifications
- **Geocoding**: Integration with OpenStreetMap Nominatim API for address coordinates

RideShare aims to streamline commuting by integrating advanced ride-matching algorithms, real-time tracking, and enterprise-specific features, all while prioritizing accessibility, scalability, and user experience.

## Email Verification and Communication System

RideShare includes a comprehensive email system for user verification and communications:

- **User Verification**: Email verification for new user registrations with secure tokens
- **Password Management**: Secure password reset functionality with expiring tokens
- **Ride Notifications**: Automated emails for ride bookings, confirmations, and updates
- **Driver Communications**: Notifications for driver assignments and schedule changes
- **Customizable Templates**: HTML email templates for all communications

The email system is built with:

- Asynchronous SMTP client (aiosmtplib) for non-blocking operations
- Jinja2 templating engine for email content
- Background task processing for improved performance
- Secure token generation and validation

For detailed documentation, see [Email System Documentation](docs/email_system.md).

### Email Testing System

RideShare includes a comprehensive email testing system for development and testing:

- **Mailhog Integration**: Capture all outgoing emails in a web interface during development
- **Database Storage**: Store emails in the database for easy access through the admin interface
- **Domain Simulation**: Test sending and receiving emails between different domains (@rideshare.com, @driver.rideshare.com, @enterprise.rideshare.com)
- **Email Inbox**: Simulated inbox for viewing, replying to, and managing received emails
- **Test Email Viewer**: View all emails sent by the system, including HTML and plain text content
- **User Generation**: Create realistic users with domain-specific email addresses for drivers and enterprises

To set up the email testing system:

1. Run the setup script: `python scripts/setup_email_testing.py`
2. Access the Mailhog web interface at http://localhost:8025
3. Access the email domain testing page at http://localhost:8000/admin/email-domains
4. Access the email inbox at http://localhost:8000/admin/email-inbox
5. Access the test email viewer at http://localhost:8000/admin/test-emails

For detailed documentation, see [Email Testing Documentation](frontend/public/docs/email_testing.md).

### Driver Management System

RideShare includes a comprehensive driver management system:

- **Driver Profiles**: Complete driver information with ratings and permissions
- **Vehicle Management**: Track and manage driver vehicles with inspection status
- **Document Management**: Store and verify driver documents and licenses
- **Work Scheduling**: Flexible scheduling system for driver availability
- **Issue Reporting**: System for drivers to report issues and request assistance
- **Time Off Requests**: Manage driver vacation and sick leave requests

For detailed documentation, see [Driver Management Documentation](docs/driver_management.md).

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/rideshare.git
cd rideshare
```

2. Set up the backend:

```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install pydantic-settings  # Required for Pydantic v2

# Set up environment variables
cp .env.example .env  # Then edit .env with your settings

# Run database migrations
python scripts/apply_email_system_migrations.py
python scripts/create_test_emails_table.py

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

3. Set up the frontend:

```bash
cd frontend
npm install  # or yarn install
npm install @heroicons/react @radix-ui/react-tabs  # Required dependencies
npm run dev  # or yarn dev
```

4. Access the application:

   - Backend API: http://localhost:8000
   - Frontend: http://localhost:5174
   - API Documentation: http://localhost:8000/docs
   - Admin Dashboard: http://localhost:5174/admin
   - Email Testing: http://localhost:8000/admin/test-emails

5. Default admin credentials:
   - Email: admin@rideshare.com
   - Password: admin123

## Recent Updates

- **Email Testing System**: Added a robust email testing system with Mailhog integration, database storage, and fake enterprise user generation
- **Email Verification System**: Implemented a comprehensive email system for user verification, password reset, and ride notifications
- **Driver Management System**: Complete implementation of driver profiles, vehicle management, document management, scheduling, and status tracking
- **Driver Issue Reporting**: Added system for drivers to report issues and request assistance
- **Driver Time Off Requests**: Implemented management of driver vacation and sick leave requests
- **Enterprise Ride Types**: Support for enterprise-specific rides with company addresses as destinations
- **One-Step Driver Registration**: Simplified driver registration process with a single API call

## Project Status

RideShare is currently in active development with 37 more features and improvements planned for implementation. The core functionality is operational, and we're working on enhancing the user experience, adding more features, and improving performance.

### Coming Soon

- Enhanced ride matching algorithms
- Improved enterprise features
- More driver management capabilities
- Additional payment processing options
- Enhanced analytics and reporting
- UI/UX improvements
- Performance optimizations
