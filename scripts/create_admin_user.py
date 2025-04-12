"""
Ultra minimal script to create just an admin user
This avoids ALL relationships to prevent circular dependencies
"""

import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
    create_engine,
    inspect,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base, sessionmaker

# Add parent directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

try:
    from app.core.config import settings
    from app.core.security import get_password_hash
except ImportError:
    print("Error importing core modules")
    # Fallback values if we can't import
    settings = type("obj", (object,), {"DATABASE_URL": "sqlite:///rideshare.db"})

    def get_password_hash(password):
        """Simple fallback for password hashing"""
        return f"hashed_{password}"


# Create direct engine connection
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a simple Base without complex relationships
Base = declarative_base()


class AdminUser(Base):
    """Simplified User model just for admin creation"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    phone_number = Column(String, nullable=True)
    password_hash = Column(String)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_superadmin = Column(Boolean, default=False)
    user_type = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)


def create_admin_user():
    """Create admin user directly with minimal dependencies"""
    try:
        # Check if table exists using the correct API - using inspect()
        inspector = inspect(engine)
        if not inspector.has_table("users"):
            print("Users table does not exist, creating it...")
            AdminUser.__table__.create(engine)
            print("Created users table")
        else:
            print("Users table already exists")

        # Create a session
        db = SessionLocal()

        try:
            # Check if admin already exists
            existing_admin = (
                db.query(AdminUser)
                .filter(AdminUser.email == "admin@rideshare.com")
                .first()
            )
            if existing_admin:
                print("Admin user already exists. Skipping creation.")
                return

            # Create super admin
            admin = AdminUser(
                user_id="UID-ADMIN123",
                email="admin@rideshare.com",
                password_hash=get_password_hash("admin123"),
                first_name="Super",
                last_name="Admin",
                phone_number="0123456789",
                user_type="admin",
                is_superadmin=True,
                created_at=datetime.utcnow(),
            )

            db.add(admin)
            db.commit()
            print("Successfully created admin user:")
            print("  - Admin: admin@rideshare.com / admin123")

        except SQLAlchemyError as e:
            db.rollback()
            print(f"Database error: {e}")
            raise
        finally:
            db.close()

    except Exception as e:
        print(f"Error creating admin user: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    create_admin_user()
