import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.user_matching_preference import UserMatchingPreference
from app.schemas.matching_preference import (
    UserMatchingPreferenceResponse,
    UserMatchingPreferenceUpdate,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=UserMatchingPreferenceResponse)
async def get_matching_preferences(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get the current user's matching preferences.
    If no preferences exist, default preferences are returned.
    """
    preferences = (
        db.query(UserMatchingPreference)
        .filter(UserMatchingPreference.user_id == current_user.id)
        .first()
    )

    if not preferences:
        # Create default preferences
        preferences = UserMatchingPreference(
            user_id=current_user.id,
            max_detour_minutes=15,
            max_wait_minutes=10,
            max_walking_distance_meters=1000,
            preferred_gender=None,
            preferred_language=None,
            minimum_driver_rating=4.0,
            prefer_same_enterprise=True,
            prefer_same_destination=True,
            prefer_recurring_rides=True,
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    return preferences


@router.put("", response_model=UserMatchingPreferenceResponse)
async def update_matching_preferences(
    preferences: UserMatchingPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the current user's matching preferences.
    If no preferences exist, they will be created.
    """
    existing_preferences = (
        db.query(UserMatchingPreference)
        .filter(UserMatchingPreference.user_id == current_user.id)
        .first()
    )

    if not existing_preferences:
        # Create new preferences
        new_preferences = UserMatchingPreference(
            user_id=current_user.id, **preferences.dict(exclude_unset=True)
        )
        db.add(new_preferences)
        db.commit()
        db.refresh(new_preferences)
        return new_preferences

    # Update existing preferences
    for key, value in preferences.dict(exclude_unset=True).items():
        setattr(existing_preferences, key, value)

    db.commit()
    db.refresh(existing_preferences)
    return existing_preferences


@router.post("/reset", response_model=UserMatchingPreferenceResponse)
async def reset_matching_preferences(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Reset the current user's matching preferences to default values.
    """
    existing_preferences = (
        db.query(UserMatchingPreference)
        .filter(UserMatchingPreference.user_id == current_user.id)
        .first()
    )

    if existing_preferences:
        # Reset to defaults
        existing_preferences.max_detour_minutes = 15
        existing_preferences.max_wait_minutes = 10
        existing_preferences.max_walking_distance_meters = 1000
        existing_preferences.preferred_gender = None
        existing_preferences.preferred_language = None
        existing_preferences.minimum_driver_rating = 4.0
        existing_preferences.prefer_same_enterprise = True
        existing_preferences.prefer_same_destination = True
        existing_preferences.prefer_recurring_rides = True

        db.commit()
        db.refresh(existing_preferences)
        return existing_preferences

    # Create default preferences if none exist
    return await get_matching_preferences(db, current_user)
