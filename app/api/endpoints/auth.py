from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import logging

from app.db.session import get_db
from app.schemas.user import TokenResponse
from app.services.auth_service import AuthService
from app.core.security import create_access_token

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/token", response_model=TokenResponse)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    try:
        auth_service = AuthService(db)
        
        # Check if user exists first
        user_exists = auth_service.check_user_exists(form_data.username)
        if not user_exists:
            logger.warning(f"Login attempt for non-existent user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Attempt authentication
        user = auth_service.authenticate_user(form_data.username, form_data.password)
        
        if not user:
            logger.warning(f"Failed login attempt for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"Successful login for user: {form_data.username}")
        access_token = create_access_token(data={"sub": user["email"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user["id"],
            "user_type": user["user_type"]
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during authentication",
            headers={"WWW-Authenticate": "Bearer"},
        )
