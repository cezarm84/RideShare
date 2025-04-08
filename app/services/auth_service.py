from datetime import datetime, timedelta
from typing import Optional
import logging
import traceback
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.security import verify_password
from app.db.session import get_db

# Set up logging
logger = logging.getLogger(__name__)

# Define a simple user class that doesn't depend on SQLAlchemy models
class SimpleUser:
    def __init__(self, id, user_id, email, first_name, last_name, password_hash, is_active, is_superadmin, user_type):
        self.id = id
        self.user_id = user_id
        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.password_hash = password_hash
        self.is_active = is_active
        self.is_superadmin = is_superadmin
        self.user_type = user_type
    
    @property
    def is_admin(self):
        return self.user_type == "admin"
        
    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

def authenticate_user(db: Session, email: str, password: str) -> Optional[SimpleUser]:
    """Authenticate a user by email and password using raw SQL"""
    try:
        # Use raw SQL to avoid ORM relationship issues
        result = db.execute(text("""
            SELECT id, user_id, email, first_name, last_name, password_hash, 
                   is_active, is_superadmin, user_type 
            FROM users 
            WHERE email = :email
        """), {"email": email}).fetchone()
        
        if not result:
            logger.warning(f"No user found with email: {email}")
            return None
        
        # Create a SimpleUser instance
        user = SimpleUser(
            id=result[0],
            user_id=result[1],
            email=result[2],
            first_name=result[3],
            last_name=result[4],
            password_hash=result[5],
            is_active=result[6],
            is_superadmin=result[7],
            user_type=result[8]
        )
        
        # Verify password
        if not verify_password(password, user.password_hash):
            logger.warning(f"Invalid password for user: {email}")
            return None
        
        return user
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        logger.debug(traceback.format_exc())
        return None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Log the token payload for debugging
    logger.debug(f"Creating token with payload: {to_encode}")
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

# Helper function to extract token from request
async def get_token_from_request(request: Request) -> Optional[str]:
    """Extract token from various possible locations in the request"""
    # Check Authorization header first
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")
    
    # Check query parameters
    token = request.query_params.get("token")
    if token:
        return token
    
    # If no token found
    return None

# Modified dependency for getting current user
async def get_current_user(request: Request, db: Session = Depends(get_db)) -> SimpleUser:
    """Get the current user from the JWT token in the request"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token from request
    token = await get_token_from_request(request)
    if not token:
        logger.warning("No token found in request")
        raise credentials_exception
    
    try:
        # Log the token for debugging
        token_preview = f"{token[:10]}...{token[-10:]}" if len(token) > 20 else token
        logger.debug(f"Decoding token: {token_preview}")
        
        # Decode token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            logger.warning("Token missing 'sub' claim")
            raise credentials_exception
            
        logger.debug(f"Token belongs to user: {email}")
    except JWTError as e:
        logger.warning(f"JWT validation error: {str(e)}")
        raise credentials_exception
    
    # Use raw SQL to avoid ORM relationship issues
    try:
        result = db.execute(text("""
            SELECT id, user_id, email, first_name, last_name, password_hash, 
                  is_active, is_superadmin, user_type 
            FROM users 
            WHERE email = :email
        """), {"email": email}).fetchone()
        
        if result is None:
            logger.warning(f"User from token not found in database: {email}")
            raise credentials_exception
        
        # Create a SimpleUser instance
        user = SimpleUser(
            id=result[0],
            user_id=result[1],
            email=result[2],
            first_name=result[3],
            last_name=result[4],
            password_hash=result[5],
            is_active=result[6],
            is_superadmin=result[7],
            user_type=result[8]
        )
        
        if not user.is_active:
            logger.warning(f"User account is inactive: {email}")
            raise HTTPException(status_code=400, detail="Inactive user")
        
        return user
    except Exception as e:
        logger.error(f"Error retrieving user from database: {str(e)}")
        raise credentials_exception

# Legacy function signature for compatibility
def get_current_user_legacy(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> SimpleUser:
    """Legacy version for backward compatibility"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Use raw SQL to avoid ORM relationship issues
    result = db.execute(text("""
        SELECT id, user_id, email, first_name, last_name, password_hash, 
               is_active, is_superadmin, user_type 
        FROM users 
        WHERE email = :email
    """), {"email": email}).fetchone()
    
    if result is None:
        raise credentials_exception
    
    # Create a SimpleUser instance
    user = SimpleUser(
        id=result[0],
        user_id=result[1],
        email=result[2],
        first_name=result[3],
        last_name=result[4],
        password_hash=result[5],
        is_active=result[6],
        is_superadmin=result[7],
        user_type=result[8]
    )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user

def get_current_active_user(current_user: SimpleUser = Depends(get_current_user)) -> SimpleUser:
    """Check if the current user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_admin_user(current_user: SimpleUser = Depends(get_current_user)) -> SimpleUser:
    """Check if the current user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not enough permissions"
        )
    return current_user

def get_current_superadmin_user(current_user: SimpleUser = Depends(get_current_user)) -> SimpleUser:
    """Check if the current user is a superadmin"""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not enough permissions, superadmin required"
        )
    return current_user
