"""Script to reset the database and recreate all tables with the latest model definitions."""

import sys
from pathlib import Path

# Add the parent directory to the path so we can import app modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine, inspect

from app.db.base_class import Base

# Import all models to register them with Base.metadata
# Make sure to import these in the correct order to avoid circular references

try:
    from app.models.address import Address  # Import if it exists
except ImportError:
    pass  # Skip if it doesn't exist

# Get the database path
DB_PATH = "sqlite:///rideshare.db"  # Update this if your connection string is different


def reset_database():
    """Drop all tables and recreate them."""
    print("Creating engine...")
    engine = create_engine(DB_PATH)

    print("Checking for existing tables...")
    inspector = inspect(engine)
    tables = inspector.get_table_names()

    if tables:
        print(f"Found {len(tables)} tables: {', '.join(tables)}")
        print("Dropping all tables...")
        Base.metadata.drop_all(engine)
        print("All tables dropped.")
    else:
        print("No existing tables found.")

    print("Creating all tables from current models...")
    Base.metadata.create_all(engine)

    tables = inspect(engine).get_table_names()
    print(f"Created {len(tables)} tables: {', '.join(tables)}")
    print("Database reset complete!")


if __name__ == "__main__":
    proceed = input(
        "This will DELETE ALL DATA in your database. Type 'yes' to proceed: "
    )
    if proceed.lower() == "yes":
        reset_database()
    else:
        print("Database reset cancelled.")
