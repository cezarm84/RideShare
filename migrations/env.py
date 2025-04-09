from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import Base from your app
from app.db.base import Base
# Import all your models here so they're recognized by Alembic
from app.models.user import User
from app.models.ride import Ride, RideBooking
from app.models.hub import Hub  # Import Hub from hub.py
from app.models.location import Location, GeocodingCache
from app.models.payment import Payment
from app.models.payment_method import PaymentMethod
from app.models.booking_passenger import BookingPassenger
from app.models.user_preference import UserPreference
from app.models.message import Conversation, Message, UserMessageSettings

# This is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
fileConfig(config.config_file_name)

# Set the target metadata
target_metadata = Base.metadata

# Import your app's config
from app.core.config import settings

# Override the SQLAlchemy URL with the one from your app settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
