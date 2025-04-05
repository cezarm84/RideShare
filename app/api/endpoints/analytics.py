from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.services.analytics_service import AnalyticsService
from app.models.user import User

router = APIRouter(tags=["analytics"])

@router.get("/ride-usage", response_model=dict)
async def get_ride_usage(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    analytics_service = AnalyticsService(db)
    return analytics_service.get_ride_usage_summary(start_date, end_date)

@router.get("/user-activity/{user_id}", response_model=dict)
async def get_user_activity(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    analytics_service = AnalyticsService(db)
    activity = analytics_service.get_user_activity(user_id)
    if "error" in activity:
        raise HTTPException(status_code=404, detail=activity["error"])
    return activity

@router.get("/enterprise-usage/{enterprise_id}", response_model=dict)
async def get_enterprise_usage(
    enterprise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    analytics_service = AnalyticsService(db)
    usage = analytics_service.get_enterprise_usage(enterprise_id)
    if "error" in usage:
        raise HTTPException(status_code=404, detail=usage["error"])
    return usage