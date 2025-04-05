import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "CHANGE_THIS_TO_A_RANDOM_SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    NOMINATIM_API_URL: str = os.getenv("NOMINATIM_API_URL", "https://nominatim.openstreetmap.org/search")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")

settings = Settings()
