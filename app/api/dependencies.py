from fastapi import Depends, HTTPException, status, WebSocket
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

# Configure OAuth2 password bearer for token extraction
# Set auto_error=False to allow handling missing tokens in get_current_user
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token", auto_error=False)

def get_current_user_optional(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    Dependency to get the current authenticated user from JWT token, or None if no token.

    Args:
        db: Database session
        token: JWT token extracted from request

    Returns:
        User object if authentication is successful, None if no token
    """
    if token is None:
        return None

    try:
        # Decode the token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            return None

        # Get the user from the database
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            return None

        return user
    except JWTError:
        return None

def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.

    Args:
        db: Database session
        token: JWT token extracted from request

    Returns:
        User object if authentication is successful

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Check if token is None and raise a more specific error
    if token is None:
        logger.warning("No authentication token provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")

        if email is None:
            logger.warning("Token missing 'sub' claim")
            raise credentials_exception

    except JWTError as e:
        logger.warning(f"JWT validation error: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error during token validation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error",
        )

    user = db.query(User).filter(User.email == email).first()

    if user is None:
        logger.warning(f"User not found for email: {email}")
        raise credentials_exception

    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to get the current active user.

    Args:
        current_user: User from get_current_user dependency

    Returns:
        User object if user is active

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user

def get_optional_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    Dependency to get the current user if authenticated, but doesn't require authentication.

    Args:
        db: Database session
        token: JWT token extracted from request (optional)

    Returns:
        User object if a valid token was provided, None otherwise
    """
    if token is None:
        logger.debug("No authentication token provided")
        return None

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")

        if email is None:
            logger.warning("Token missing 'sub' claim")
            return None

        user = db.query(User).filter(User.email == email).first()

        if user is None:
            logger.warning(f"User not found for email: {email}")
            return None

        return user

    except JWTError as e:
        logger.debug(f"JWT validation error in optional auth: {str(e)}")
        return None
    except Exception as e:
        logger.warning(f"Error in optional authentication: {str(e)}")
        return None

def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Checks if the current user is an admin or has admin privileges.

    Args:
        current_user: User from get_current_active_user dependency

    Returns:
        User object if user is an admin

    Raises:
        HTTPException: If user is not an admin
    """
    if not current_user.has_admin_privileges():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

def get_current_superadmin_user(current_user: User = Depends(get_current_admin_user)) -> User:
    """
    Checks if the current user is a superadmin.
    This requires either the is_superadmin flag to be True or the role to be SUPERADMIN.

    Args:
        current_user: User from get_current_admin_user dependency

    Returns:
        User object if user is a superadmin

    Raises:
        HTTPException: If user is not a superadmin
    """
    from app.models.user import UserRole

    if not (getattr(current_user, 'is_superadmin', False) or current_user.role == UserRole.SUPERADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin privileges required"
        )
    return current_user

def get_current_manager_user(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Checks if the current user is a manager.

    Args:
        current_user: User from get_current_active_user dependency

    Returns:
        User object if user is a manager

    Raises:
        HTTPException: If user is not a manager
    """
    from app.models.user import UserRole

    if not current_user.is_manager and current_user.role != UserRole.MANAGER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager privileges required"
        )
    return current_user

def get_current_driver_user(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Checks if the current user is a driver.

    Args:
        current_user: User from get_current_active_user dependency

    Returns:
        User object if user is a driver

    Raises:
        HTTPException: If user is not a driver
    """
    from app.models.user import UserRole, UserType

    if not (current_user.is_driver or
            current_user.role == UserRole.DRIVER or
            current_user.user_type == UserType.DRIVER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver privileges required"
        )
    return current_user

def get_admin_or_driver_user(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Checks if the current user is either an admin/manager or a driver.
    This is useful for endpoints that should be accessible to both admins and drivers.

    Args:
        current_user: User from get_current_active_user dependency

    Returns:
        User object if user is an admin or driver

    Raises:
        HTTPException: If user is neither an admin nor a driver
    """
    try:
        # Try as admin first
        return get_current_admin_user(current_user)
    except HTTPException:
        # If not admin, try as driver
        try:
            return get_current_driver_user(current_user)
        except HTTPException:
            # If neither admin nor driver, raise exception
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or driver privileges required"
            )

def get_db_session() -> Session:
    return Depends(get_db)

async def websocket_auth(token: str, db: Session) -> Optional[User]:
    """
    Authenticate a WebSocket connection using a JWT token

    Args:
        token: JWT token from query params
        db: Database session

    Returns:
        User object if authentication succeeds, None otherwise
    """
    if not token:
        logger.warning("WebSocket auth failed: No token provided")
        return None

    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Extract user ID
        user_id = payload.get("sub")
        if user_id is None:
            logger.warning("WebSocket auth failed: Missing subject claim")
            return None

        # Check token expiration
        exp = payload.get("exp")
        if exp is None or datetime.utcnow() > datetime.utcfromtimestamp(exp):
            logger.warning("WebSocket auth failed: Token expired")
            return None

        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            logger.warning(f"WebSocket auth failed: User {user_id} not found")
            return None

        # Check if user is active
        if not user.is_active:
            logger.warning(f"WebSocket auth failed: User {user_id} inactive")
            return None

        return user

    except JWTError as e:
        logger.warning(f"WebSocket auth failed: Invalid token - {str(e)}")
        return None
    except Exception as e:
        logger.error(f"WebSocket auth error: {str(e)}")
        return None
