from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import get_current_user
from app.schemas.user_preference import UserPreferenceCreate, UserPreferenceUpdate, UserPreferenceResponse
from app.services.user_preference_service import UserPreferenceService
from app.models.user import User
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=UserPreferenceResponse)
async def get_user_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get preferences for the current user"""
    preference_service = UserPreferenceService(db)
    preferences = preference_service.get_user_preferences(current_user.id)
    return preferences

@router.post("", response_model=UserPreferenceResponse, status_code=status.HTTP_201_CREATED)
async def create_user_preferences(
    preferences: UserPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create preferences for the current user"""
    try:
        preference_service = UserPreferenceService(db)
        db_preferences = preference_service.create_user_preferences(current_user.id, preferences)
        return db_preferences
    except HTTPException as e:
        # Pass through HTTP exceptions
        raise e
    except Exception as e:
        # Log any other errors
        logger.error(f"Error creating user preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user preferences: {str(e)}"
        )

@router.put("", response_model=UserPreferenceResponse)
async def update_user_preferences(
    preferences: UserPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update preferences for the current user"""
    try:
        preference_service = UserPreferenceService(db)
        db_preferences = preference_service.update_user_preferences(current_user.id, preferences)
        return db_preferences
    except HTTPException as e:
        # Pass through HTTP exceptions
        raise e
    except Exception as e:
        # Log any other errors
        logger.error(f"Error updating user preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user preferences: {str(e)}"
        )
