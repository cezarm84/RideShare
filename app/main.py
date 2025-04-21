import datetime
import logging
import time
from contextlib import asynccontextmanager

import sqlalchemy as sa
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Import API router after all models are loaded
from app.api.router import api_router
from app.core.config import settings
from app.db import configure_relationships

# Import base class first
from app.db.base_class import Base

# Import message after all others to avoid circular dependencies

# Import all models to ensure they're registered with SQLAlchemy
# Order matters to avoid circular imports

# Configure logging
logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper(), logging.WARNING))

# Set SQLAlchemy logging to WARNING to reduce query logs
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for the RideShare application",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Set up CORS with more restrictive settings for production
if settings.CORS_ORIGINS:
    # Parse CORS origins based on environment
    if isinstance(settings.CORS_ORIGINS, list):
        origins = [str(origin) for origin in settings.CORS_ORIGINS]
    else:
        origins = [str(origin) for origin in settings.CORS_ORIGINS.split(",")]

    # Log the configured CORS origins
    logger.info(f"Configuring CORS with origins: {origins}")

    # Add CORS middleware with appropriate settings
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "Accept", "X-Requested-With"],
        max_age=86400,  # 24 hours in seconds
    )

# Add rate limiting middleware for production
if settings.ENVIRONMENT == "production":
    import time
    from collections import defaultdict

    from fastapi import Request
    from fastapi.responses import JSONResponse

    # Simple in-memory rate limiter
    class RateLimiter:
        def __init__(self, requests_per_minute=60):
            self.requests_per_minute = requests_per_minute
            self.requests = defaultdict(list)

        def is_rate_limited(self, client_ip):
            now = time.time()
            minute_ago = now - 60

            # Remove requests older than 1 minute
            self.requests[client_ip] = [
                req_time
                for req_time in self.requests[client_ip]
                if req_time > minute_ago
            ]

            # Check if client has exceeded rate limit
            if len(self.requests[client_ip]) >= self.requests_per_minute:
                return True

            # Add current request timestamp
            self.requests[client_ip].append(now)
            return False

    # Create rate limiter instance
    rate_limiter = RateLimiter(requests_per_minute=60)  # 60 requests per minute

    @app.middleware("http")
    async def rate_limit_middleware(request: Request, call_next):
        client_ip = request.client.host

        # Skip rate limiting for certain paths (like health checks)
        if request.url.path in ["/health", "/metrics"]:
            return await call_next(request)

        # Check if client is rate limited
        if rate_limiter.is_rate_limited(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
            )

        # Process the request normally
        return await call_next(request)


# Add middleware for request timing
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Use the new lifespan approach instead of on_event


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application"""
    # Startup logic
    logger.info("Starting up application...")

    # Create tables if they don't exist (for development)
    # In production, you should use proper migrations instead
    from app.db.session import engine

    if settings.ENVIRONMENT != "production":
        inspector = sa.inspect(engine)
        if not inspector.has_table("users"):
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created")
    elif settings.AUTO_MIGRATE:
        # Apply migrations in production if AUTO_MIGRATE is enabled
        try:
            import subprocess

            logger.info("Applying database migrations...")
            result = subprocess.run(
                ["python", "scripts/apply_migrations.py"],
                capture_output=True,
                text=True,
            )
            if result.returncode == 0:
                logger.info("Migrations applied successfully")
            else:
                logger.error(f"Error applying migrations: {result.stderr}")
        except Exception as e:
            logger.error(f"Error running migration script: {e}")

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

    # Start the task scheduler
    try:
        from app.tasks.scheduler_new import scheduler

        scheduler.start()
        logger.info("Task scheduler started successfully")
    except Exception as e:
        logger.error(f"Error starting task scheduler: {e}")

    logger.info("Application startup complete")

    # Log available routes for debugging
    routes = [{"path": route.path, "name": route.name} for route in app.routes]
    logger.debug(f"Available routes: {routes}")

    # Yield control back to FastAPI
    yield

    # Shutdown logic
    logger.info("Shutting down application...")

    # Stop the task scheduler
    try:
        from app.tasks.scheduler_new import scheduler

        scheduler.shutdown()
        logger.info("Task scheduler stopped successfully")
    except Exception as e:
        logger.error(f"Error stopping task scheduler: {e}")

    logger.info("Application shutdown complete")


# Update the FastAPI app to use the lifespan
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for the RideShare application",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://localhost:5180",
        "http://localhost:5181",
        "http://localhost:5182",
        "http://localhost:5183",
        "http://localhost:5184",
        "http://localhost:5185",
    ],  # Frontend development servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API router with the correct prefix
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}. Visit /docs for API documentation.",
        "environment": settings.ENVIRONMENT,
        "api_path": settings.API_V1_STR,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers"""
    from app.db.session import SessionLocal

    # Check database connection
    db_status = "healthy"
    try:
        db = SessionLocal()
        # Execute a simple query
        db.execute("SELECT 1")
        db.close()
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"

    # Check scheduler status
    scheduler_status = "healthy"
    try:
        from app.tasks.scheduler_new import scheduler

        if not scheduler.running:
            scheduler_status = "stopped"
    except Exception as e:
        logger.error(f"Scheduler health check failed: {e}")
        scheduler_status = "unhealthy"

    # Overall status
    is_healthy = db_status == "healthy" and scheduler_status == "healthy"
    status = "healthy" if is_healthy else "unhealthy"

    # Prepare response data
    response_data = {
        "status": status,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "version": "1.0.0",
        "services": {"database": db_status, "scheduler": scheduler_status},
    }

    # Return with appropriate status code
    if not is_healthy:
        return JSONResponse(content=response_data, status_code=503)
    return response_data


@app.get("/metrics")
async def metrics():
    """Metrics endpoint for monitoring"""
    import gc

    import psutil

    # System metrics
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory_info = psutil.virtual_memory()
    disk_info = psutil.disk_usage("/")

    # Python process metrics
    process = psutil.Process()
    process_memory = process.memory_info().rss / (1024 * 1024)  # MB
    process_cpu = process.cpu_percent(interval=0.1)

    # GC metrics
    gc_counts = gc.get_count()

    return {
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory_info.percent,
            "memory_available_mb": memory_info.available / (1024 * 1024),
            "disk_percent": disk_info.percent,
            "disk_free_gb": disk_info.free / (1024 * 1024 * 1024),
        },
        "process": {
            "memory_mb": process_memory,
            "cpu_percent": process_cpu,
            "threads": process.num_threads(),
        },
        "python": {"gc_counts": gc_counts},
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
