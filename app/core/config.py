"""
Application configuration using Pydantic for settings management.
"""
import os
from typing import Any, Dict, List, Optional, Union
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Use pydantic_settings if available, fallback to BaseSettings from pydantic v1
try:
    from pydantic_settings import BaseSettings
    from pydantic import validator
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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
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
    NOMINATIM_API_URL: str = os.getenv("NOMINATIM_API_URL", "https://nominatim.openstreetmap.org/search")
    
    # Environment settings
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    AUTO_MIGRATE: bool = os.getenv("AUTO_MIGRATE", "False").lower() in ("true", "1", "t")
    
    # File upload settings
    MEDIA_ROOT: str = os.getenv("MEDIA_ROOT", "media")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", 10 * 1024 * 1024))  # Default 10MB
    ALLOWED_EXTENSIONS: str = os.getenv("ALLOWED_EXTENSIONS", "jpg,jpeg,png,gif,pdf,doc,docx,mp3,mp4,wav,ogg")
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
    SCAN_UPLOADS_FOR_VIRUSES: bool = os.getenv("SCAN_UPLOADS_FOR_VIRUSES", "False").lower() in ("true", "1", "t")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()
