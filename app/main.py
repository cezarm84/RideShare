import logging
from fastapi import FastAPI
from app.api.router import api_router
from app.db.session import engine
from app.db.base import Base
# Import all models to ensure they're registered with SQLAlchemy
import app.models.address
import app.models.user
import app.models.location
try:
    import app.models.ride
except ImportError:
    pass
try:
    import app.models.payment
except ImportError:
    pass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RideShare API")

# Create database tables at startup
@app.on_event("startup")
async def create_tables():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

# Include API router with /api prefix to match expected route patterns
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to RideShare API. Visit /docs for API documentation."}