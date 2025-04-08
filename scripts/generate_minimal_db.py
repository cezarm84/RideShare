"""Minimal script to generate essential test users"""
import sys
from pathlib import Path
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Add the parent directory to sys.path to find the 'app' module
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.db.base import Base
from app.models.user import User, UserType 
from app.core.security import get_password_hash
from app.core.config import settings

# Database setup
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

def create_essential_users():
    """Create just the essential admin and test users"""
    try:
        print("Creating minimal database with admin users...")
        
        with Session(engine) as session:
            # Check if users already exist
            existing_admin = session.query(User).filter(User.email == "admin@rideshare.com").first()
            if existing_admin:
                print("Admin user already exists. Skipping creation.")
                return
            
            # Create super admin
            super_admin = User(
                user_id="UID-ADMIN",
                email="admin@rideshare.com",
                password_hash=get_password_hash("admin123"),
                first_name="Super",
                last_name="Admin",
                phone_number="0123456789",
                user_type=UserType.ADMIN,
                is_superadmin=True,
                created_at=datetime.utcnow()
            )
            
            # Create regular admin
            regular_admin = User(
                user_id="UID-MANAGER",
                email="manager@rideshare.com", 
                password_hash=get_password_hash("manager123"),
                first_name="Regular",
                last_name="Admin",
                phone_number="9876543210",
                user_type=UserType.ADMIN,
                is_superadmin=False,
                created_at=datetime.utcnow()
            )
            
            # Create test user
            test_user = User(
                user_id="UID-TESTUSER",
                email="johndoen@example.com",
                password_hash=get_password_hash("testuser123"),
                first_name="John",
                last_name="Doen",
                phone_number="1234509876",
                user_type=UserType.PRIVATE,
                created_at=datetime.utcnow()
            )
            
            # Add users to session
            session.add_all([super_admin, regular_admin, test_user])
            session.commit()
            
            print(f"Successfully created users:")
            print(f"  - Super Admin: admin@rideshare.com / admin123")
            print(f"  - Regular Admin: manager@rideshare.com / manager123")  
            print(f"  - Test User: johndoen@example.com / testuser123")
            
    except Exception as e:
        print(f"Error creating users: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_essential_users()