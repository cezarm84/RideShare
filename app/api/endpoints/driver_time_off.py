import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_admin_or_driver_user,
    get_current_admin_user,
    get_current_user,
)
from app.db.session import get_db
from app.models.driver import DriverProfile
from app.models.driver_time_off import DriverTimeOffRequest, TimeOffRequestStatus
from app.models.user import User
from app.schemas.driver_time_off import (
    TimeOffRequestCreate,
    TimeOffRequestResponse,
    TimeOffRequestUpdate,
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


@router.get("/{driver_id}/time-off", response_model=List[TimeOffRequestResponse])
async def get_time_off_requests(
    driver_id: int,
    status: Optional[TimeOffRequestStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a driver's time off requests.
    Admin users can access any driver's requests, while drivers can only access their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Get the driver's time off requests
    query = db.query(DriverTimeOffRequest).filter(
        DriverTimeOffRequest.driver_id == driver_id
    )

    if status:
        query = query.filter(DriverTimeOffRequest.status == status)

    time_off_requests = query.order_by(DriverTimeOffRequest.created_at.desc()).all()

    return time_off_requests


@router.post(
    "/{driver_id}/time-off",
    response_model=TimeOffRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_time_off(
    driver_id: int,
    request_data: TimeOffRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit a time off request.
    Admin users can submit for any driver, while drivers can only submit for themselves.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Check if driver exists
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    # Create the time off request
    time_off_request = DriverTimeOffRequest(
        driver_id=driver_id,
        request_type=request_data.request_type,
        start_date=request_data.start_date,
        end_date=request_data.end_date,
        reason=request_data.reason,
        status=TimeOffRequestStatus.PENDING,
    )

    db.add(time_off_request)
    db.commit()
    db.refresh(time_off_request)

    return time_off_request


@router.put(
    "/{driver_id}/time-off/{request_id}",
    response_model=TimeOffRequestResponse,
)
async def update_time_off_request(
    driver_id: int,
    request_id: int,
    request_data: TimeOffRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_user
    ),  # Only admins can update status
):
    """
    Update a time off request status (admin only).
    """
    # Get the time off request
    time_off_request = (
        db.query(DriverTimeOffRequest)
        .filter(
            DriverTimeOffRequest.id == request_id,
            DriverTimeOffRequest.driver_id == driver_id,
        )
        .first()
    )

    if not time_off_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Time off request not found"
        )

    # Update the time off request
    update_data = request_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(time_off_request, key, value)

    # Set the responder
    time_off_request.responded_by = current_user.id

    db.commit()
    db.refresh(time_off_request)

    return time_off_request


@router.delete(
    "/{driver_id}/time-off/{request_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_time_off_request(
    driver_id: int,
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_driver_user),
):
    """
    Delete a time off request.
    Admin users can delete any request, while drivers can only delete their own pending requests.
    """
    # Get the time off request
    time_off_request = (
        db.query(DriverTimeOffRequest)
        .filter(
            DriverTimeOffRequest.id == request_id,
            DriverTimeOffRequest.driver_id == driver_id,
        )
        .first()
    )

    if not time_off_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Time off request not found"
        )

    # Check if the user is allowed to delete this request
    is_admin = (
        hasattr(current_user, "has_admin_privileges")
        and current_user.has_admin_privileges()
    )
    is_driver_owner = (
        db.query(DriverProfile)
        .filter(DriverProfile.id == driver_id, DriverProfile.user_id == current_user.id)
        .first()
        is not None
    )

    if not is_admin and (
        not is_driver_owner or time_off_request.status != TimeOffRequestStatus.PENDING
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this time off request",
        )

    # Delete the time off request
    db.delete(time_off_request)
    db.commit()

    return None
