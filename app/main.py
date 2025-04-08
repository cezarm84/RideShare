import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sqlalchemy as sa
import time

# Import base class first
from app.db.base_class import Base

# Import all models to ensure they're registered with SQLAlchemy
# Order matters to avoid circular imports
from app.models.user import User
from app.models.address import Address
from app.models.location import Location
from app.models.hub import Hub
from app.models.vehicle import VehicleType, Vehicle
from app.models.enterprise import Enterprise
from app.models.destination import Destination
from app.models.ride import Ride, RideBooking
from app.models.payment import Payment
from app.models.attachment import MessageAttachment
# Import message after all others to avoid circular dependencies
from app.models.message import Message, Conversation

# Import API router after all models are loaded
from app.api.router import api_router
from app.core.config import settings
from app.db import configure_relationships

# Configure logging
logging.basicConfig(level=getattr(logging, settings.ENVIRONMENT.upper(), logging.INFO))
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for the RideShare application",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add middleware for request timing
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Initialize database at startup
@app.on_event("startup")
async def startup_db_client():
    """Initialize database on startup"""

    # Create tables if they don't exist (for development)
    # In production, you should use proper migrations instead
    from app.db.session import engine

    if settings.ENVIRONMENT != "production":
        inspector = sa.inspect(engine)
        if not inspector.has_table("users"):
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created")

    # Configure SQLAlchemy relationships
    for _ in range(2):  # Try configuring twice to handle any ordering issues
        if configure_relationships():
            logger.info("SQLAlchemy relationships configured successfully")

            # Force mapper configuration after relationships are set up
            try:
                from sqlalchemy.orm import configure_mappers
                configure_mappers()
                logger.info("SQLAlchemy mappers configured successfully")
                break
            except Exception as e:
                logger.error(f"Error configuring mappers: {e}")
        else:
            logger.error("Failed to configure SQLAlchemy relationships")

    logger.info("Application startup complete")

    # Log available routes for debugging
    routes = [
        {"path": route.path, "name": route.name}
        for route in app.routes
    ]
    logger.debug(f"Available routes: {routes}")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Application shutdown complete")

# Include API router with the correct prefix
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}. Visit /docs for API documentation.",
        "environment": settings.ENVIRONMENT,
        "api_path": settings.API_V1_STR
    }
