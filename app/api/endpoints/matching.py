from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.matching import MatchRequest, MatchResponse
from app.services.matching_service import MatchingService

router = APIRouter()


@router.post("/find-rides", response_model=List[MatchResponse])
async def find_rides(
    match_request: MatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    matching_service = MatchingService(db)
    matches = matching_service.find_matches_for_user(current_user.id, match_request)
    return matches
