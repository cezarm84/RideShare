import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
)

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            logger.warning(f"Failed login attempt for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )

        logger.info(f"User {user.email} authenticated successfully")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin,
        }
    except Exception as e:
        logger.error(f"Error during authentication: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error occurred",
        )


@router.get("/me", response_model=dict)
async def read_users_me(current_user=Depends(get_current_user)):
    """
    Get current user authentication information.

    This endpoint returns only authentication-related information about the current user,
    such as user ID, roles, and permissions. For complete profile information,
    use the /api/v1/users/me endpoint instead.

    Returns:
        dict: Basic authentication information about the current user
    """
    from app.models.user import UserRole

    # Get the user's role
    role = getattr(current_user, "role", UserRole.USER)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": role,
        "is_admin": current_user.is_admin,
        "is_superadmin": current_user.is_superadmin,
        "has_admin_privileges": current_user.has_admin_privileges(),
        "auth_status": "authenticated",
        "permissions": [
            "read:profile" if current_user.is_active else None,
            "write:profile" if current_user.is_active else None,
            "read:rides" if current_user.is_active else None,
            (
                "write:rides"
                if current_user.has_admin_privileges() or current_user.is_driver
                else None
            ),
            "admin:access" if current_user.has_admin_privileges() else None,
        ],
    }


@router.post("/test-token", response_model=dict)
def test_token_endpoint():
    """
    Test endpoint for checking if the auth router is properly mounted
    """
    return {"status": "success", "message": "Auth endpoints are working correctly"}
