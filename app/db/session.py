import logging

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

from app.core.config import settings

logger = logging.getLogger(__name__)


# Configure database engine with appropriate pooling settings
def get_engine_config():
    """Get database engine configuration based on environment"""
    # Base configuration
    config = {
        "pool_pre_ping": True,  # Check connection before using it
        "pool_recycle": 3600,  # Recycle connections after 1 hour
        "echo": settings.ENVIRONMENT == "development",  # Log SQL in development
    }

    # SQLite specific configuration
    if settings.DATABASE_URL.startswith("sqlite"):
        config["connect_args"] = {"check_same_thread": False}
    # PostgreSQL specific configuration
    elif settings.DATABASE_URL.startswith("postgresql"):
        config.update(
            {
                "pool_size": 20,  # Maximum number of connections in the pool
                "max_overflow": 10,  # Maximum number of connections that can be created beyond pool_size
                "poolclass": QueuePool,  # Use QueuePool for connection pooling
            }
        )

    return config


# Create engine with appropriate configuration
engine = create_engine(settings.DATABASE_URL, **get_engine_config())


# Add event listeners for connection pool
@event.listens_for(engine, "connect")
def connect(dbapi_connection, connection_record):
    # pylint: disable=unused-argument
    logger.debug("Database connection established")


@event.listens_for(engine, "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    # pylint: disable=unused-argument
    logger.debug("Database connection checked out from pool")


@event.listens_for(engine, "checkin")
def checkin(dbapi_connection, connection_record):
    # pylint: disable=unused-argument
    logger.debug("Database connection returned to pool")


# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Get a database session with proper error handling.

    This function is used as a dependency in FastAPI endpoints.
    It yields a database session and ensures it's properly closed
    even if an exception occurs.
    """
    db = SessionLocal()
    try:
        # Log session creation in debug mode
        logger.debug("Database session created")
        yield db
    except Exception as e:
        # Log any exceptions that occur during session use
        logger.error(f"Error using database session: {e}")
        # Rollback any pending transactions
        db.rollback()
        raise
    finally:
        # Always close the session
        logger.debug("Database session closed")
        db.close()
