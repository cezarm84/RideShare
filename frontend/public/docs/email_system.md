# RideShare Email System

This document provides comprehensive documentation for the email verification and communication system in the RideShare application, including its purpose, implementation, usage, and extension points.

## Overview

The RideShare email system provides:

1. **Email Verification**: Ensures user email addresses are valid and belong to the user
2. **Password Recovery**: Allows users to reset their passwords securely
3. **Transactional Emails**: Sends notifications for important events like ride bookings
4. **Marketing Communications**: Supports sending announcements and promotions

## Configuration

Email settings are configured through environment variables in the `.env` file:

```
# Email settings
EMAIL_ENABLED=True
EMAIL_SENDER_NAME=RideShare
EMAIL_SENDER_EMAIL=noreply@rideshare.com
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASSWORD=your-app-password
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
EMAIL_VERIFICATION_REQUIRED=True
EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS=48
EMAIL_TEMPLATES_DIR=app/templates/email
FRONTEND_URL=http://localhost:5173
```

### Important Settings

- `EMAIL_ENABLED`: Set to `True` to enable email functionality, `False` to disable
- `EMAIL_VERIFICATION_REQUIRED`: Set to `True` to require email verification before login
- `EMAIL_SMTP_USER` and `EMAIL_SMTP_PASSWORD`: Your SMTP credentials
- `FRONTEND_URL`: The URL of your frontend application (used for email links)

## Email Templates

Email templates are stored in `app/templates/email/` and use Jinja2 for templating:

1. `base_email.html`: Base template with common styling
2. `verification_email.html`: Email verification template
3. `welcome_email.html`: Welcome email template
4. `password_reset_email.html`: Password reset template
5. `ride_confirmation_email.html`: Ride booking confirmation template
6. `ride_reminder_email.html`: Upcoming ride reminder template
7. `driver_assignment_email.html`: Driver assignment notification template

## API Endpoints

### Email Verification

- `POST /api/v1/email/request-verification`: Request a verification email
  ```json
  {
    "email": "user@example.com"
  }
  ```

- `POST /api/v1/email/verify`: Verify email with token
  ```json
  {
    "token": "verification-token"
  }
  ```

### Password Reset

- `POST /api/v1/email/request-password-reset`: Request a password reset email
  ```json
  {
    "email": "user@example.com"
  }
  ```

- `POST /api/v1/email/reset-password`: Reset password with token
  ```json
  {
    "token": "reset-token",
    "new_password": "new-password"
  }
  ```

## Implementation Details

### Email Service Architecture

The email system is built around the `EmailService` class in `app/services/email_service.py`, which provides a comprehensive set of methods for all email-related functionality:

```python
class EmailService:
    def __init__(self):
        # Initialize with settings from config

    async def send_email(self, to_email, subject, html_content, text_content=None, cc=None, bcc=None):
        # Send an email using SMTP

    def render_template(self, template_name, context):
        # Render an email template with the given context

    def generate_verification_token(self):
        # Generate a secure token for email verification

    def generate_password_reset_token(self):
        # Generate a secure token for password reset

    def get_verification_link(self, token):
        # Get the full verification link for the given token

    def get_password_reset_link(self, token):
        # Get the full password reset link for the given token

    async def send_verification_email(self, user, token):
        # Send an email verification email to a user

    async def send_welcome_email(self, user):
        # Send a welcome email to a new user

    async def send_password_reset_email(self, user, token):
        # Send a password reset email to a user

    async def send_ride_confirmation_email(self, user, ride_details):
        # Send a ride booking confirmation email to a user

    async def send_ride_reminder_email(self, user, ride_details):
        # Send a ride reminder email to a user

    async def send_driver_assignment_email(self, user, ride_details, driver_details):
        # Send a driver assignment email to a user
```

The service is implemented as a singleton to ensure consistent configuration across the application.

### Database Schema

The User model has been extended with fields for email verification:

```python
class User(Base):
    # Existing fields...

    is_verified = Column(Boolean, default=False)

    # Email verification fields
    verification_token = Column(String, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    password_reset_token = Column(String, nullable=True)
    password_reset_token_expires = Column(DateTime, nullable=True)
```

### API Endpoints

The email system exposes several endpoints in `app/api/endpoints/email_verification.py`:

```python
@router.post("/request-verification", response_model=VerificationResponse)
async def request_verification_email(request: EmailVerificationRequest, background_tasks: BackgroundTasks, db: Session):
    # Request a verification email

@router.post("/verify", response_model=VerificationResponse)
async def verify_email(request: TokenVerifyRequest, db: Session):
    # Verify a user's email using a token

@router.post("/request-password-reset", response_model=VerificationResponse)
async def request_password_reset(request: PasswordResetRequest, background_tasks: BackgroundTasks, db: Session):
    # Request a password reset email

@router.post("/reset-password", response_model=VerificationResponse)
async def reset_password(request: PasswordResetConfirm, db: Session):
    # Reset a user's password using a token
```

### Authentication Integration

The email verification system is integrated with the authentication system in `app/api/endpoints/auth.py`:

```python
@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm, background_tasks: BackgroundTasks, db: Session):
    # Authenticate user
    user = authenticate_user(db, form_data.username, form_data.password)

    # Check if email verification is required
    if settings.EMAIL_VERIFICATION_REQUIRED and not user.is_verified:
        # Send verification email and return error
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. A verification email has been sent to your email address."
        )
```

### Frontend Components

The frontend includes several components for email verification and password reset:

1. `EmailVerification.tsx`: Component for verifying email addresses
2. `ForgotPassword.tsx`: Component for requesting password resets
3. `ResetPassword.tsx`: Component for resetting passwords

### Authentication Flow

1. User registers with email and password
2. System generates a verification token and sends verification email
3. User clicks verification link in email
4. System verifies token, marks email as verified, and redirects to login
5. User can now log in

### Password Reset Flow

1. User clicks "Forgot Password" on login page
2. User enters email address
3. System generates a reset token and sends password reset email
4. User clicks reset link in email
5. User enters new password
6. System verifies token, updates password, and redirects to login

## Testing

You can test the email system using the provided test script:

```bash
python scripts/test_email_system.py
```

This script tests:
1. Sending verification emails
2. Sending welcome emails
3. Sending password reset emails
4. Sending ride confirmation emails

## Troubleshooting

### Common Issues

1. **Emails not sending**:
   - Check `EMAIL_ENABLED` is set to `True`
   - Verify SMTP credentials are correct
   - Check SMTP server and port settings

2. **Verification links not working**:
   - Ensure `FRONTEND_URL` is set correctly
   - Check that the token is being properly included in the URL

3. **Token expiration issues**:
   - Adjust `EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS` as needed
   - Check server time is correct

### Logging

Email-related logs are available in the application logs. Set `LOG_LEVEL=DEBUG` in your `.env` file for more detailed logging.

## Security Considerations

- Tokens are generated using `secrets.token_urlsafe()` for cryptographic security
- Tokens have expiration times to limit the window of vulnerability
- Password reset links are single-use only
- Email templates avoid including sensitive information

## Extending the Email System

### Adding New Email Types

To add a new type of email notification:

1. Create a new HTML template in `app/templates/email/`
2. Add a new method to the `EmailService` class:

```python
async def send_new_notification_email(self, user, data):
    context = {
        "user_name": f"{user.first_name} {user.last_name}",
        # Add any other context variables needed by the template
        "company_name": self.sender_name,
        "support_email": self.sender_email,
    }

    html_content = self.render_template("new_notification_email", context)
    subject = f"Your notification from {self.sender_name}"

    return await self.send_email(user.email, subject, html_content)
```

3. Call the new method from your application code where needed

### Customizing Email Templates

All email templates are located in `app/templates/email/`. To customize a template:

1. Edit the corresponding HTML file
2. Use Jinja2 syntax for dynamic content
3. Maintain the base structure from `base_email.html`

### Integrating with Third-Party Email Services

The current implementation uses SMTP directly, but you can extend it to use third-party services:

1. Create a new service adapter class (e.g., `SendGridAdapter`, `MailgunAdapter`)
2. Implement the same interface as the current `send_email` method
3. Update the `EmailService` class to use the adapter based on configuration

### Adding Email Queue

For improved reliability, you can add a queue system:

1. Implement a queue using Redis, RabbitMQ, or a database table
2. Modify the `send_email` method to add messages to the queue
3. Create a background worker to process the queue

## Future Enhancements

Planned enhancements for the email system:

1. Email queue for better performance and reliability
2. HTML/plain text multipart emails (currently basic implementation)
3. Email templates customization through admin interface
4. Email analytics and tracking
5. Integration with third-party email services like SendGrid or Mailgun
6. Email scheduling for marketing campaigns
7. User subscription preferences management
