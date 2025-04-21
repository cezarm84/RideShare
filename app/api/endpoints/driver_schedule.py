import logging
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_admin_or_driver_user,
    get_current_user,
)
from app.db.session import get_db
from app.models.driver import DriverProfile, DriverSchedule
from app.models.user import User
from app.schemas.driver_schedule import (
    DriverScheduleCreate,
    DriverScheduleResponse,
    DriverScheduleUpdate,
)

router = APIRouter()
logger = logging.getLogger(__name__)


def check_driver_access(driver_id: int, current_user: User, db: Session):
    """
    Check if the current user has access to the driver's data.
    Admin users can access any driver, while drivers can only access their own data.
    """
    # Check if the user is an admin
    if (
        hasattr(current_user, "has_admin_privileges")
        and current_user.has_admin_privileges()
    ):
        return True

    # Check if the user is the driver
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    if driver.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this driver's data",
        )

    return True


@router.get("/{driver_id}/schedule", response_model=List[DriverScheduleResponse])
async def get_driver_schedule(
    driver_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a driver's schedule for a specific date range.
    Admin users can access any driver's schedule, while drivers can only access their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Get the driver's schedule
    query = db.query(DriverSchedule).filter(DriverSchedule.driver_id == driver_id)

    if start_date:
        query = query.filter(
            (DriverSchedule.specific_date >= start_date)
            | (DriverSchedule.specific_date == None)
        )

    if end_date:
        query = query.filter(
            (DriverSchedule.specific_date <= end_date)
            | (DriverSchedule.specific_date == None)
        )

    schedules = query.all()

    return schedules


@router.post(
    "/{driver_id}/schedule",
    response_model=DriverScheduleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_driver_schedule(
    driver_id: int,
    schedule_data: DriverScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_driver_user),
):
    """
    Create a new schedule entry for a driver.
    Admin users can create schedules for any driver, while drivers can only create for themselves.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Check if driver exists
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    # Create the schedule
    schedule = DriverSchedule(
        driver_id=driver_id,
        is_recurring=schedule_data.is_recurring,
        day_of_week=schedule_data.day_of_week,
        specific_date=schedule_data.specific_date,
        start_time=schedule_data.start_time,
        end_time=schedule_data.end_time,
        preferred_starting_hub_id=schedule_data.preferred_starting_hub_id,
        preferred_area=schedule_data.preferred_area,
        is_active=schedule_data.is_active,
    )

    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    return schedule


@router.put(
    "/{driver_id}/schedule/{schedule_id}", response_model=DriverScheduleResponse
)
async def update_driver_schedule(
    driver_id: int,
    schedule_id: int,
    schedule_data: DriverScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_driver_user),
):
    """
    Update a driver's schedule entry.
    Admin users can update schedules for any driver, while drivers can only update their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Get the schedule
    schedule = (
        db.query(DriverSchedule)
        .filter(DriverSchedule.id == schedule_id, DriverSchedule.driver_id == driver_id)
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    # Update the schedule
    update_data = schedule_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)

    db.commit()
    db.refresh(schedule)

    return schedule


@router.delete(
    "/{driver_id}/schedule/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_driver_schedule(
    driver_id: int,
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_driver_user),
):
    """
    Delete a driver's schedule entry.
    Admin users can delete schedules for any driver, while drivers can only delete their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Get the schedule
    schedule = (
        db.query(DriverSchedule)
        .filter(DriverSchedule.id == schedule_id, DriverSchedule.driver_id == driver_id)
        .first()
    )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found"
        )

    # Delete the schedule
    db.delete(schedule)
    db.commit()

    return None
