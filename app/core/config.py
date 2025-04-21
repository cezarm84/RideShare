"""
Application configuration using Pydantic for settings management.
"""

import os
from typing import List, Union

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Use pydantic_settings if available, fallback to BaseSettings from pydantic v1
try:
    from pydantic import validator
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings, validator


class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "RideShare API")

    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///rideshare.db")

    # Security settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_THIS_TO_A_RANDOM_SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

    # CORS settings
    CORS_ORIGINS: Union[str, List[str]] = []

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        elif isinstance(v, str):
            return v
        raise ValueError(f"Invalid CORS_ORIGINS format: {v}")

    # API settings
    NOMINATIM_API_URL: str = os.getenv(
        "NOMINATIM_API_URL", "https://nominatim.openstreetmap.org/search"
    )

    # OpenCage API settings
    OPENCAGE_API_KEY: str = os.getenv("OPENCAGE_API_KEY", "")
    OPENCAGE_API_URL: str = os.getenv(
        "OPENCAGE_API_URL", "https://api.opencagedata.com/geocode/v1/json"
    )

    # Environment settings
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    AUTO_MIGRATE: bool = os.getenv("AUTO_MIGRATE", "False").lower() in (
        "true",
        "1",
        "t",
    )

    # Logging settings
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "WARNING")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json")

    # File upload settings
    MEDIA_ROOT: str = os.getenv("MEDIA_ROOT", "media")
    MAX_FILE_SIZE: int = int(
        os.getenv("MAX_FILE_SIZE", 10 * 1024 * 1024)
    )  # Default 10MB
    ALLOWED_EXTENSIONS: str = os.getenv(
        "ALLOWED_EXTENSIONS", "jpg,jpeg,png,gif,pdf,doc,docx,mp3,mp4,wav,ogg"
    )
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")

    # Configure storage backend (local, s3, azure, etc.)
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")

    # S3 settings (if using S3 storage)
    S3_ACCESS_KEY: str = os.getenv("S3_ACCESS_KEY", "")
    S3_SECRET_KEY: str = os.getenv("S3_SECRET_KEY", "")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "")
    S3_REGION: str = os.getenv("S3_REGION", "us-east-1")

    # Image processing settings
    IMAGE_MAX_DIMENSION: int = int(os.getenv("IMAGE_MAX_DIMENSION", 2000))
    THUMBNAIL_SIZE: str = os.getenv("THUMBNAIL_SIZE", "200x200")

    # Security settings for uploads
    SCAN_UPLOADS_FOR_VIRUSES: bool = os.getenv(
        "SCAN_UPLOADS_FOR_VIRUSES", "False"
    ).lower() in ("true", "1", "t")

    # Contact form settings
    CONTACT_NOTIFICATION_EMAIL: str = os.getenv("CONTACT_NOTIFICATION_EMAIL", "")
    RECAPTCHA_ENABLED: bool = os.getenv("RECAPTCHA_ENABLED", "False").lower() in (
        "true",
        "1",
        "t",
    )
    RECAPTCHA_SITE_KEY: str = os.getenv("RECAPTCHA_SITE_KEY", "")
    RECAPTCHA_SECRET_KEY: str = os.getenv("RECAPTCHA_SECRET_KEY", "")

    # Email settings
    EMAIL_ENABLED: bool = os.getenv("EMAIL_ENABLED", "True").lower() in (
        "true",
        "1",
        "t",
    )
    EMAIL_SENDER_NAME: str = os.getenv("EMAIL_SENDER_NAME", "RideShare")
    EMAIL_SENDER_EMAIL: str = os.getenv("EMAIL_SENDER_EMAIL", "noreply@rideshare.com")
    EMAIL_SMTP_SERVER: str = os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
    EMAIL_SMTP_PORT: int = int(os.getenv("EMAIL_SMTP_PORT", "587"))
    EMAIL_SMTP_USER: str = os.getenv("EMAIL_SMTP_USER", "")
    EMAIL_SMTP_PASSWORD: str = os.getenv("EMAIL_SMTP_PASSWORD", "")
    EMAIL_USE_TLS: bool = os.getenv("EMAIL_USE_TLS", "True").lower() in (
        "true",
        "1",
        "t",
    )
    EMAIL_USE_SSL: bool = os.getenv("EMAIL_USE_SSL", "False").lower() in (
        "true",
        "1",
        "t",
    )
    EMAIL_VERIFICATION_REQUIRED: bool = os.getenv(
        "EMAIL_VERIFICATION_REQUIRED", "True"
    ).lower() in (
        "true",
        "1",
        "t",
    )
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = int(
        os.getenv("EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS", "48")
    )
    EMAIL_TEMPLATES_DIR: str = os.getenv("EMAIL_TEMPLATES_DIR", "app/templates/email")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
