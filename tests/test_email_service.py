"""
Tests for the email service.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.user import User
from app.services.email_service import EmailService


@pytest.fixture
def mock_user():
    """Create a mock user for testing."""
    return User(
        id=1,
        email="test@example.com",
        first_name="Test",
        last_name="User",
        password_hash="hashed_password",
        is_active=True,
        is_verified=False,
    )


@pytest.fixture
def email_service():
    """Create an email service instance for testing."""
    with patch("app.services.email_service.settings") as mock_settings:
        # Configure mock settings
        mock_settings.EMAIL_ENABLED = True
        mock_settings.EMAIL_SENDER_NAME = "RideShare Test"
        mock_settings.EMAIL_SENDER_EMAIL = "test@rideshare.com"
        mock_settings.EMAIL_SMTP_SERVER = "smtp.example.com"
        mock_settings.EMAIL_SMTP_PORT = 587
        mock_settings.EMAIL_SMTP_USER = "test_user"
        mock_settings.EMAIL_SMTP_PASSWORD = "test_password"
        mock_settings.EMAIL_USE_TLS = True
        mock_settings.EMAIL_USE_SSL = False
        mock_settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS = 48
        mock_settings.EMAIL_TEMPLATES_DIR = "app/templates/email"
        mock_settings.FRONTEND_URL = "http://localhost:5173"

        service = EmailService()
        yield service


@pytest.mark.asyncio
async def test_send_email(email_service):
    """Test sending an email."""
    with patch("app.services.email_service.aiosmtplib.SMTP") as mock_smtp:
        # Configure mock SMTP
        mock_smtp_instance = AsyncMock()
        mock_smtp.return_value = mock_smtp_instance

        # Test sending an email
        result = await email_service.send_email(
            to_email="recipient@example.com",
            subject="Test Subject",
            html_content="<p>Test content</p>",
        )

        # Verify the result
        assert result is True

        # Verify SMTP calls
        mock_smtp.assert_called_once()
        mock_smtp_instance.connect.assert_called_once()
        mock_smtp_instance.login.assert_called_once()
        mock_smtp_instance.send_message.assert_called_once()
        mock_smtp_instance.quit.assert_called_once()


@pytest.mark.asyncio
async def test_send_verification_email(email_service, mock_user):
    """Test sending a verification email."""
    with patch.object(
        email_service, "send_email", return_value=True
    ) as mock_send_email:
        with patch.object(
            email_service, "render_template", return_value="<p>Test template</p>"
        ) as mock_render:
            # Test sending a verification email
            token = "test_verification_token"
            result = await email_service.send_verification_email(mock_user, token)

            # Verify the result
            assert result is True

            # Verify method calls
            mock_render.assert_called_once()
            mock_send_email.assert_called_once()

            # Verify the email was sent to the correct recipient
            assert mock_send_email.call_args[0][0] == mock_user.email

            # Verify the subject contains "Verify"
            assert "Verify" in mock_send_email.call_args[0][1]


@pytest.mark.asyncio
async def test_send_password_reset_email(email_service, mock_user):
    """Test sending a password reset email."""
    with patch.object(
        email_service, "send_email", return_value=True
    ) as mock_send_email:
        with patch.object(
            email_service, "render_template", return_value="<p>Test template</p>"
        ) as mock_render:
            # Test sending a password reset email
            token = "test_reset_token"
            result = await email_service.send_password_reset_email(mock_user, token)

            # Verify the result
            assert result is True

            # Verify method calls
            mock_render.assert_called_once()
            mock_send_email.assert_called_once()

            # Verify the email was sent to the correct recipient
            assert mock_send_email.call_args[0][0] == mock_user.email

            # Verify the subject contains "Reset"
            assert "Reset" in mock_send_email.call_args[0][1]


def test_generate_verification_token(email_service):
    """Test generating a verification token."""
    token = email_service.generate_verification_token()

    # Verify the token is a non-empty string
    assert isinstance(token, str)
    assert len(token) > 0


def test_get_verification_link(email_service):
    """Test generating a verification link."""
    token = "test_token"
    link = email_service.get_verification_link(token)

    # Verify the link contains the token and the correct path
    assert token in link
    assert "verify-email" in link
    assert link.startswith(email_service.frontend_url)


def test_get_password_reset_link(email_service):
    """Test generating a password reset link."""
    token = "test_token"
    link = email_service.get_password_reset_link(token)

    # Verify the link contains the token and the correct path
    assert token in link
    assert "reset-password" in link
    assert link.startswith(email_service.frontend_url)


@pytest.mark.asyncio
async def test_send_ride_confirmation_email(email_service, mock_user):
    """Test sending a ride confirmation email."""
    with patch.object(
        email_service, "send_email", return_value=True
    ) as mock_send_email:
        with patch.object(
            email_service, "render_template", return_value="<p>Test template</p>"
        ) as mock_render:
            # Test sending a ride confirmation email
            ride_details = {
                "id": 123,
                "departure_date": "2023-05-01",
                "departure_time": "08:30",
                "origin_name": "Central Hub",
                "destination_name": "Downtown Office",
            }

            result = await email_service.send_ride_confirmation_email(
                mock_user, ride_details
            )

            # Verify the result
            assert result is True

            # Verify method calls
            mock_render.assert_called_once()
            mock_send_email.assert_called_once()

            # Verify the email was sent to the correct recipient
            assert mock_send_email.call_args[0][0] == mock_user.email

            # Verify the subject contains "confirmation"
            assert "confirmation" in mock_send_email.call_args[0][1].lower()


def test_render_template(email_service):
    """Test rendering a template."""
    with patch("app.services.email_service.Environment") as mock_env:
        # Configure mock environment
        mock_template = MagicMock()
        mock_template.render.return_value = "<p>Rendered template</p>"

        mock_env_instance = MagicMock()
        mock_env_instance.get_template.return_value = mock_template
        mock_env.return_value = mock_env_instance

        # Create a new service to use our mocked environment
        service = EmailService()

        # Test rendering a template
        context = {"name": "Test User"}
        result = service.render_template("test_template", context)

        # Verify the result
        assert result == "<p>Rendered template</p>"

        # Verify method calls
        mock_env_instance.get_template.assert_called_once_with("test_template.html")
        mock_template.render.assert_called_once_with(**context)
