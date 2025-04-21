import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    get_current_user,
)
from app.services.email_service import email_service

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
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

        # Check if email verification is required and user is not verified
        if settings.EMAIL_VERIFICATION_REQUIRED and not user.is_verified:
            # Get the full user object from the database
            full_user = db.query(User).filter(User.id == user.id).first()

            if full_user and background_tasks:
                # Send verification email in background
                token = email_service.generate_verification_token()
                full_user.verification_token = token
                full_user.verification_token_expires = datetime.now(
                    timezone.utc
                ) + timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS)
                db.commit()

                background_tasks.add_task(
                    email_service.send_verification_email, full_user, token
                )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. A verification email has been sent to your email address.",
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
            "is_verified": user.is_verified,
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
