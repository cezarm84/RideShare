import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Add the parent directory to the path so we can import the app
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import Base from your app
from app.db.base import Base

# Import all your models here so they're recognized by Alembic
# These imports are needed for Alembic to detect model changes, even if they're not directly used in this file
# pylint: disable=unused-import

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
    # Handle the case where we might be using SQLite in development but PostgreSQL in production
    if settings.DATABASE_URL.startswith("sqlite"):
        # SQLite doesn't support ALTER statements in transactions
        connectable = engine_from_config(
            config.get_section(config.config_ini_section),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                # For SQLite, we need to disable transaction control
                render_as_batch=True,
            )

            with context.begin_transaction():
                context.run_migrations()
    else:
        # For PostgreSQL and other databases
        connectable = engine_from_config(
            config.get_section(config.config_ini_section),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                # Include schema name for PostgreSQL if needed
                include_schemas=(
                    True if not settings.DATABASE_URL.startswith("sqlite") else False
                ),
            )

            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
