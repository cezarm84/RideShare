# Email System Production Deployment

This document explains how to deploy the RideShare email system to production environments, specifically when using GitHub Pages for the frontend and Google Cloud Run for the backend.

## Overview

The RideShare email testing system is designed for local development, but it can be adapted for production use with some modifications. This document outlines the necessary changes to make the system work in a production environment.

## Frontend Deployment (GitHub Pages)

When deploying the frontend to GitHub Pages, you'll need to make the following adjustments:

### 1. API Base URL Configuration

Update the API base URL in the frontend to point to your production backend:

```tsx
// frontend/src/services/api.service.ts
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend-domain.com/api/v1'
  : 'http://localhost:8000/api/v1';
```

### 2. CORS Configuration

Ensure that your backend CORS settings allow requests from your GitHub Pages domain:

```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-github-pages-domain.com",  # Add your GitHub Pages domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Environment Variables

Set up environment variables for your GitHub Pages deployment using GitHub Actions:

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      # ... other steps
      - name: Build
        env:
          REACT_APP_API_URL: https://your-backend-domain.com/api/v1
        run: npm run build
```

## Backend Deployment (Google Cloud Run)

When deploying the backend to Google Cloud Run, you'll need to make the following adjustments:

### 1. Email Service Configuration

For production, you'll need to use a real SMTP server instead of Mailhog. Update your `.env` file or environment variables in Google Cloud Run:

```
EMAIL_ENABLED=True
EMAIL_SENDER_NAME=RideShare
EMAIL_SENDER_EMAIL=noreply@yourdomain.com
EMAIL_SMTP_SERVER=smtp.gmail.com  # Or your preferred SMTP server
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
ENVIRONMENT=production  # Important: Set to production
```

### 2. Database Configuration

For production, you'll need to use a persistent database instead of SQLite. Configure your database connection in Google Cloud Run:

```
DATABASE_URL=postgresql://username:password@host:port/database
```

### 3. Email Domain Configuration

For production, you'll need to register and configure real email domains. There are two approaches:

#### Option 1: Use a Third-Party Email Service (Recommended)

1. Sign up for a service like SendGrid, Mailgun, or Amazon SES
2. Configure your domain with the service (add DNS records)
3. Update the email service to use the third-party API instead of SMTP

```python
# app/services/email_service.py
async def send_email(self, to_email, subject, html_content, text_content=None, cc=None, bcc=None):
    if settings.EMAIL_PROVIDER == 'sendgrid':
        # Use SendGrid API
        return await self._send_with_sendgrid(to_email, subject, html_content, text_content, cc, bcc)
    elif settings.EMAIL_PROVIDER == 'mailgun':
        # Use Mailgun API
        return await self._send_with_mailgun(to_email, subject, html_content, text_content, cc, bcc)
    else:
        # Use SMTP
        return await self._send_with_smtp(to_email, subject, html_content, text_content, cc, bcc)
```

#### Option 2: Set Up Your Own Mail Server

1. Register your domain (e.g., rideshare.com)
2. Set up subdomains (driver.rideshare.com, enterprise.rideshare.com)
3. Configure MX records to point to your mail server
4. Set up a mail server (e.g., Postfix) on a separate VM
5. Configure DKIM, SPF, and DMARC for better deliverability

### 4. Disable Development Features

In production, you should disable development-specific features:

```python
# app/services/email_service.py
async def send_email(self, to_email, subject, html_content, text_content=None, cc=None, bcc=None):
    # ... existing code ...
    
    # In development mode, store email in database instead of sending
    if settings.ENVIRONMENT.lower() == "development":
        # Store in database for testing
        # ... existing code ...
    else:
        # In production, actually send the email
        # ... existing code ...
```

### 5. Email Testing in Production

For testing emails in production:

1. Create a dedicated test environment that mimics production
2. Use a separate subdomain for testing (e.g., test.rideshare.com)
3. Configure a catch-all email address for the test domain
4. Use real email addresses with a plus sign for testing (e.g., test+user1@yourdomain.com)

## Alternative Approach: Simplified Production Setup

If you don't need the full domain simulation in production, you can simplify the setup:

1. Use a third-party email service like SendGrid or Mailgun
2. Use a single sender domain (e.g., noreply@rideshare.com)
3. Keep the email templates and verification system
4. Remove the domain simulation and inbox functionality

This approach is simpler but still provides the core email functionality needed for user verification, password reset, and notifications.

## Conclusion

The RideShare email system can be adapted for production use with some modifications. The key considerations are:

1. Use a real SMTP server or third-party email service
2. Configure your domains properly for better deliverability
3. Disable development-specific features in production
4. Set up proper environment variables for different environments

By following these guidelines, you can successfully deploy the RideShare email system to production environments like GitHub Pages and Google Cloud Run.
