from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.security import verify_password
import logging

# Set up logging
logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def authenticate_user(self, email: str, password: str):
        """Authenticate a user with email and password."""
        if not email or not password:
            logger.warning("Authentication attempt with empty email or password")
            return None
            
        try:
            logger.info(f"Attempting authentication for email: {email}")
            
            # Use a SQL query that only selects columns we know exist
            stmt = text("""
                SELECT id, email, password_hash, first_name, last_name, 
                       phone_number, user_type, is_active, user_id, created_at
                FROM "users"
                WHERE email = :email
                LIMIT 1
            """)
            result = self.db.execute(stmt, {"email": email}).fetchone()
            
            if not result:
                logger.warning(f"No user found with email: {email}")
                return None
                
            # Create a simple dictionary with user data instead of User model
            # This avoids any potential ORM issues
            user = {
                "id": result[0],
                "email": result[1],
                "password_hash": result[2],
                "first_name": result[3],
                "last_name": result[4],
                "phone_number": result[5],
                "user_type": result[6],
                "is_active": result[7],
                "user_id": result[8],
                "created_at": result[9]
            }
            
            # Verify password
            if not verify_password(password, user["password_hash"]):
                logger.warning(f"Invalid password for user: {email}")
                return None
                
            if not user["is_active"]:
                logger.warning(f"Inactive user attempted login: {email}")
                return None
                
            logger.info(f"Successfully authenticated user: {email}")
            return user
            
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}", exc_info=True)
            return None

    def check_user_exists(self, email: str):
        """Check if a user exists without performing password verification."""
        try:
            stmt = text('SELECT 1 FROM "users" WHERE email = :email LIMIT 1')
            result = self.db.execute(stmt, {"email": email}).fetchone()
            return result is not None
        except Exception as e:
            logger.error(f"Error checking user existence: {str(e)}")
            return False
