import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.hub import Hub
from app.models.user import User
from app.models.user_travel_pattern import UserTravelPattern
from app.schemas.travel_pattern import TravelPatternResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=List[TravelPatternResponse])
async def get_user_travel_patterns(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Get the current user's travel patterns.
    These are automatically collected based on ride history.
    """
    patterns = (
        db.query(UserTravelPattern)
        .filter(UserTravelPattern.user_id == current_user.id)
        .all()
    )

    # Enhance patterns with location names
    result = []
    for pattern in patterns:
        pattern_dict = {
            "id": pattern.id,
            "user_id": pattern.user_id,
            "origin_type": pattern.origin_type,
            "origin_id": pattern.origin_id,
            "origin_latitude": pattern.origin_latitude,
            "origin_longitude": pattern.origin_longitude,
            "destination_type": pattern.destination_type,
            "destination_id": pattern.destination_id,
            "destination_latitude": pattern.destination_latitude,
            "destination_longitude": pattern.destination_longitude,
            "day_of_week": pattern.day_of_week,
            "departure_time": pattern.departure_time,
            "frequency": pattern.frequency,
            "last_traveled": pattern.last_traveled,
            "origin_name": None,
            "destination_name": None,
        }

        # Get origin name
        if pattern.origin_type == "hub" and pattern.origin_id:
            hub = db.query(Hub).filter(Hub.id == pattern.origin_id).first()
            if hub:
                pattern_dict["origin_name"] = hub.name

        # Get destination name
        if pattern.destination_type == "hub" and pattern.destination_id:
            hub = db.query(Hub).filter(Hub.id == pattern.destination_id).first()
            if hub:
                pattern_dict["destination_name"] = hub.name
        elif pattern.destination_type == "custom":
            # For custom destinations, we could look up in saved locations
            # For now, just use a generic name
            pattern_dict["destination_name"] = (
                f"Custom Location ({pattern.destination_latitude:.4f}, {pattern.destination_longitude:.4f})"
            )

        result.append(pattern_dict)

    return result


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_travel_patterns(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Manually refresh the user's travel patterns based on ride history.
    """
    try:
        from app.tasks.travel_pattern_updater import update_travel_pattern_for_user

        patterns_updated = update_travel_pattern_for_user(current_user.id)
        return {"message": f"Successfully updated {patterns_updated} travel patterns"}
    except Exception as e:
        logger.error(f"Error refreshing travel patterns: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to refresh travel patterns",
        )
