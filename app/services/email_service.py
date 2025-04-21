"""
Email service for sending emails using SMTP.
"""

import logging
import secrets
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import aiosmtplib
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings
from app.db.session import get_db
from app.models.test_email import TestEmail
from app.models.user import User

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails."""

    def __init__(self):
        """Initialize the email service."""
        self.sender_name = settings.EMAIL_SENDER_NAME
        self.sender_email = settings.EMAIL_SENDER_EMAIL
        self.smtp_server = settings.EMAIL_SMTP_SERVER
        self.smtp_port = settings.EMAIL_SMTP_PORT
        self.smtp_user = settings.EMAIL_SMTP_USER
        self.smtp_password = settings.EMAIL_SMTP_PASSWORD
        self.use_tls = settings.EMAIL_USE_TLS
        self.use_ssl = settings.EMAIL_USE_SSL
        self.enabled = settings.EMAIL_ENABLED
        self.frontend_url = settings.FRONTEND_URL

        # Set up Jinja2 environment for email templates
        templates_dir = Path(settings.EMAIL_TEMPLATES_DIR)
        self.jinja_env = Environment(
            loader=FileSystemLoader(templates_dir),
            autoescape=select_autoescape(["html", "xml"]),
            trim_blocks=True,
            lstrip_blocks=True,
        )

    async def send_email(
        self,
        to_email: Union[str, List[str]],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
    ) -> bool:
        """
        Send an email using SMTP.

        Args:
            to_email: Recipient email address or list of addresses
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content of the email (optional)
            cc: List of CC recipients (optional)
            bcc: List of BCC recipients (optional)

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        if not self.enabled:
            logger.info(
                f"Email sending is disabled. Would have sent to {to_email}: {subject}"
            )
            return True

        # In development mode, store email in database instead of sending
        if settings.ENVIRONMENT.lower() == "development":
            try:
                # Convert single email to list
                recipients = [to_email] if isinstance(to_email, str) else to_email
                recipient_str = ", ".join(recipients)

                # Store email in database
                db = next(get_db())
                test_email = TestEmail(
                    to_email=recipient_str,
                    from_email=f"{self.sender_name} <{self.sender_email}>",
                    subject=subject,
                    html_content=html_content,
                    text_content=text_content,
                    cc=", ".join(cc) if cc else None,
                    bcc=", ".join(bcc) if bcc else None,
                )
                db.add(test_email)
                db.commit()

                logger.info(f"Email stored in database: {subject} to {recipient_str}")
                return True
            except Exception as e:
                logger.error(f"Failed to store email in database: {str(e)}")
                # Continue with normal email sending as fallback

        if not text_content:
            # Create a simple text version from HTML if not provided
            text_content = html_content.replace("<br>", "\n").replace("</p>", "\n\n")
            # Remove HTML tags
            import re

            text_content = re.sub(r"<[^>]*>", "", text_content)

        # Convert single email to list
        recipients = [to_email] if isinstance(to_email, str) else to_email

        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.sender_name} <{self.sender_email}>"
            message["To"] = ", ".join(recipients)

            if cc:
                message["Cc"] = ", ".join(cc)
                recipients.extend(cc)

            if bcc:
                message["Bcc"] = ", ".join(bcc)
                recipients.extend(bcc)

            # Attach parts
            part1 = MIMEText(text_content, "plain")
            part2 = MIMEText(html_content, "html")
            message.attach(part1)
            message.attach(part2)

            # Send email
            smtp = aiosmtplib.SMTP(
                hostname=self.smtp_server,
                port=self.smtp_port,
                use_tls=self.use_tls,
                start_tls=self.use_tls and not self.use_ssl,
            )

            await smtp.connect()

            if self.smtp_user and self.smtp_password:
                await smtp.login(self.smtp_user, self.smtp_password)

            await smtp.send_message(message)
            await smtp.quit()

            logger.info(f"Email sent successfully to {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render an email template with the given context.

        Args:
            template_name: Name of the template file
            context: Dictionary of variables to pass to the template

        Returns:
            str: Rendered HTML content
        """
        try:
            template = self.jinja_env.get_template(f"{template_name}.html")
            return template.render(**context)
        except Exception as e:
            logger.error(f"Failed to render email template {template_name}: {str(e)}")
            # Fallback to a simple message if template rendering fails
            return f"<p>This is an automated message from {self.sender_name}.</p>"

    def generate_verification_token(self) -> str:
        """
        Generate a secure token for email verification.

        Returns:
            str: Secure random token
        """
        return secrets.token_urlsafe(32)

    def generate_password_reset_token(self) -> str:
        """
        Generate a secure token for password reset.

        Returns:
            str: Secure random token
        """
        return secrets.token_urlsafe(32)

    def get_verification_link(self, token: str) -> str:
        """
        Get the full verification link for the given token.

        Args:
            token: Verification token

        Returns:
            str: Full verification URL
        """
        return f"{self.frontend_url}/verify-email?token={token}"

    def get_password_reset_link(self, token: str) -> str:
        """
        Get the full password reset link for the given token.

        Args:
            token: Password reset token

        Returns:
            str: Full password reset URL
        """
        return f"{self.frontend_url}/reset-password?token={token}"

    async def send_verification_email(self, user: User, token: str) -> bool:
        """
        Send an email verification email to a user.

        Args:
            user: User to send verification email to
            token: Verification token

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        verification_link = self.get_verification_link(token)
        context = {
            "user_name": f"{user.first_name} {user.last_name}",
            "verification_link": verification_link,
            "company_name": self.sender_name,
            "support_email": self.sender_email,
            "expires_hours": settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS,
        }

        html_content = self.render_template("verification_email", context)
        subject = f"Verify your email address for {self.sender_name}"

        return await self.send_email(user.email, subject, html_content)

    async def send_welcome_email(self, user: User) -> bool:
        """
        Send a welcome email to a new user.

        Args:
            user: User to send welcome email to

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        context = {
            "user_name": f"{user.first_name} {user.last_name}",
            "login_link": f"{self.frontend_url}/login",
            "company_name": self.sender_name,
            "support_email": self.sender_email,
        }

        html_content = self.render_template("welcome_email", context)
        subject = f"Welcome to {self.sender_name}!"

        return await self.send_email(user.email, subject, html_content)

    async def send_password_reset_email(self, user: User, token: str) -> bool:
        """
        Send a password reset email to a user.

        Args:
            user: User to send password reset email to
            token: Password reset token

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        reset_link = self.get_password_reset_link(token)
        context = {
            "user_name": f"{user.first_name} {user.last_name}",
            "reset_link": reset_link,
            "company_name": self.sender_name,
            "support_email": self.sender_email,
            "expires_hours": 24,  # Password reset tokens expire after 24 hours
        }

        html_content = self.render_template("password_reset_email", context)
        subject = f"Reset your {self.sender_name} password"

        return await self.send_email(user.email, subject, html_content)

    async def send_ride_confirmation_email(
        self, user: User, ride_details: Dict[str, Any]
    ) -> bool:
        """
        Send a ride booking confirmation email to a user.

        Args:
            user: User to send confirmation email to
            ride_details: Dictionary containing ride details

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        context = {
            "user_name": f"{user.first_name} {user.last_name}",
            "ride_id": ride_details.get("id"),
            "ride_date": ride_details.get("departure_date"),
            "ride_time": ride_details.get("departure_time"),
            "origin": ride_details.get("origin_name"),
            "destination": ride_details.get("destination_name"),
            "booking_link": f"{self.frontend_url}/rides/{ride_details.get('id')}",
            "company_name": self.sender_name,
            "support_email": self.sender_email,
        }

        html_content = self.render_template("ride_confirmation_email", context)
        subject = f"Your {self.sender_name} ride confirmation"

        return await self.send_email(user.email, subject, html_content)

    async def send_ride_reminder_email(
        self, user: User, ride_details: Dict[str, Any]
    ) -> bool:
        """
        Send a ride reminder email to a user.

        Args:
            user: User to send reminder email to
            ride_details: Dictionary containing ride details

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        context = {
            "user_name": f"{user.first_name} {user.last_name}",
            "ride_id": ride_details.get("id"),
            "ride_date": ride_details.get("departure_date"),
            "ride_time": ride_details.get("departure_time"),
            "origin": ride_details.get("origin_name"),
            "destination": ride_details.get("destination_name"),
            "ride_link": f"{self.frontend_url}/rides/{ride_details.get('id')}",
            "company_name": self.sender_name,
            "support_email": self.sender_email,
        }

        html_content = self.render_template("ride_reminder_email", context)
        subject = f"Reminder: Your upcoming {self.sender_name} ride"

        return await self.send_email(user.email, subject, html_content)

    async def send_driver_assignment_email(
        self, user: User, ride_details: Dict[str, Any], driver_details: Dict[str, Any]
    ) -> bool:
        """
        Send a driver assignment email to a user.

        Args:
            user: User to send driver assignment email to
            ride_details: Dictionary containing ride details
            driver_details: Dictionary containing driver details

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        context = {
            "user_name": f"{user.first_name} {user.last_name}",
            "ride_id": ride_details.get("id"),
            "ride_date": ride_details.get("departure_date"),
            "ride_time": ride_details.get("departure_time"),
            "origin": ride_details.get("origin_name"),
            "destination": ride_details.get("destination_name"),
            "driver_name": driver_details.get("name"),
            "driver_rating": driver_details.get("rating"),
            "vehicle_model": driver_details.get("vehicle_model"),
            "vehicle_color": driver_details.get("vehicle_color"),
            "vehicle_plate": driver_details.get("vehicle_plate"),
            "ride_link": f"{self.frontend_url}/rides/{ride_details.get('id')}",
            "company_name": self.sender_name,
            "support_email": self.sender_email,
        }

        html_content = self.render_template("driver_assignment_email", context)
        subject = f"Your {self.sender_name} driver has been assigned"

        return await self.send_email(user.email, subject, html_content)


# Create a singleton instance
email_service = EmailService()
