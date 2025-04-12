import logging
from datetime import datetime, timedelta
from typing import Any, Optional, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

# Setup logging
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")


# Simple User class that doesn't depend on SQLAlchemy models
class SimpleUser:
    def __init__(
        self,
        id,
        user_id,
        email,
        first_name,
        last_name,
        password_hash,
        is_active,
        is_superadmin,
        user_type,
    ):
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


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Error verifying password: {str(e)}")
        return False


def get_password_hash(password: str) -> str:
    """Generate a password hash"""
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def get_user_by_email(db: Session, email: str) -> Optional[SimpleUser]:
    """Get a user by email using raw SQL"""
    try:
        # Use raw SQL to avoid ORM relationship issues
        result = db.execute(
            text(
                """
            SELECT id, user_id, email, first_name, last_name, password_hash,
                   is_active, is_superadmin, user_type
            FROM users
            WHERE email = :email
        """
            ),
            {"email": email},
        ).fetchone()

        if not result:
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
            user_type=result[8],
        )

        return user
    except Exception as e:
        logger.error(f"Error getting user by email: {str(e)}")
        return None


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> SimpleUser:
    """Get the current user from the JWT token"""
    try:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        # Decode token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            logger.warning("Token missing 'sub' claim")
            raise credentials_exception

        logger.debug(f"Token belongs to user: {email}")

        # Get user from database using raw SQL
        user = get_user_by_email(db, email)
        if user is None:
            logger.warning(f"User not found: {email}")
            raise credentials_exception

        if not user.is_active:
            logger.warning(f"Inactive user: {email}")
            raise HTTPException(status_code=400, detail="Inactive user")

        return user
    except jwt.JWTError as e:
        logger.error(f"JWT validation error: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        raise credentials_exception


def get_current_active_user(
    current_user: SimpleUser = Depends(get_current_user),
) -> SimpleUser:
    """Check if the current user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_admin_user(
    current_user: SimpleUser = Depends(get_current_user),
) -> SimpleUser:
    """Check if the current user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return current_user


def get_current_superadmin_user(
    current_user: SimpleUser = Depends(get_current_user),
) -> SimpleUser:
    """Check if the current user is a superadmin"""
    if not current_user.is_superadmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions, superadmin required",
        )
    return current_user
