# Email Testing System

This document explains how to use the email testing system in the RideShare application.

## Overview

The RideShare email testing system allows developers and administrators to:

1. Test email functionality without sending real emails
2. View all emails sent by the system
3. Generate fake enterprise users with realistic email addresses
4. Verify that email templates are rendering correctly

## Development Setup

### Using Mailhog

For local development, we recommend using Mailhog, a self-hosted email testing tool that captures all outgoing emails:

1. Run the setup script:

```bash
python scripts/setup_mailhog.py
```

This will:
- Check if Docker is installed
- Start Mailhog in a Docker container
- Update your .env file with the correct settings

2. View emails at http://localhost:8025

### Using the Database Email Storage

In development mode, all emails are also stored in the database for easy access through the admin interface:

1. Make sure your .env file has `ENVIRONMENT=development`
2. Access the Test Emails page in the admin interface at `/admin/test-emails`

## Admin Interface

### Test Emails Page

The Test Emails page allows you to:

1. View all emails sent by the system
2. See the full content of each email
3. Delete individual emails or all emails at once

This is useful for:
- Verifying that emails are being sent correctly
- Checking that email templates are rendering properly
- Testing email functionality without sending real emails

### Fake Enterprise Users Page

The Fake Enterprise Users page allows you to:

1. Generate fake users for any enterprise in the system
2. Specify how many users to create
3. View the generated users and their details

This is useful for:
- Testing enterprise-specific features
- Populating the system with realistic test data
- Testing email functionality with enterprise users

## Email Templates

All email templates are stored in `app/templates/email/` and use Jinja2 for templating:

1. `base_email.html`: Base template with common styling
2. `verification_email.html`: Email verification template
3. `welcome_email.html`: Welcome email template
4. `password_reset_email.html`: Password reset template
5. `ride_confirmation_email.html`: Ride booking confirmation template
6. `ride_reminder_email.html`: Upcoming ride reminder template
7. `driver_assignment_email.html`: Driver assignment notification template

To modify a template:

1. Edit the corresponding HTML file
2. Use Jinja2 syntax for dynamic content
3. Maintain the base structure from `base_email.html`

## Production Configuration

For production, you'll need to:

1. Update your .env file with real SMTP settings:

```
EMAIL_SMTP_SERVER=your-smtp-server
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-smtp-username
EMAIL_SMTP_PASSWORD=your-smtp-password
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
```

2. Set `ENVIRONMENT=production` to disable database email storage

3. Set up proper email domains for your production environment
