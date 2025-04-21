import logging
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_admin_or_driver_user,
    get_current_admin_user,
    get_current_user,
)
from app.db.session import get_db
from app.models.driver import DriverProfile
from app.models.driver_issue import DriverIssueReport, IssuePhoto, IssueStatus
from app.models.user import User
from app.schemas.driver_issue import (
    IssueReportCreate,
    IssueReportResponse,
    IssueReportUpdate,
    IssueStatus,
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


@router.get("/{driver_id}/issues", response_model=List[IssueReportResponse])
async def get_issue_reports(
    driver_id: int,
    status: Optional[IssueStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a driver's issue reports.
    Admin users can access any driver's reports, while drivers can only access their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Get the driver's issue reports
    query = db.query(DriverIssueReport).filter(DriverIssueReport.driver_id == driver_id)

    if status:
        query = query.filter(DriverIssueReport.status == status)

    issue_reports = query.order_by(DriverIssueReport.created_at.desc()).all()

    return issue_reports


@router.post(
    "/{driver_id}/issues",
    response_model=IssueReportResponse,
    status_code=status.HTTP_201_CREATED,
)
async def report_issue(
    driver_id: int,
    issue_data: IssueReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit an issue report.
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

    # Create the issue report
    issue_report = DriverIssueReport(
        driver_id=driver_id,
        issue_type=issue_data.issue_type,
        ride_id=issue_data.ride_id,
        priority=issue_data.priority,
        description=issue_data.description,
        status=IssueStatus.OPEN,
    )

    db.add(issue_report)
    db.flush()  # Flush to get the issue_id

    # Add photos if provided
    if issue_data.photos:
        for photo_data in issue_data.photos:
            photo = IssuePhoto(
                issue_id=issue_report.id,
                photo_url=photo_data.photo_url,
                filename=photo_data.filename,
            )
            db.add(photo)

    db.commit()
    db.refresh(issue_report)

    return issue_report


@router.post(
    "/{driver_id}/issues/{issue_id}/photos",
    status_code=status.HTTP_201_CREATED,
)
async def upload_issue_photo(
    driver_id: int,
    issue_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a photo for an issue report.
    Admin users can upload for any driver, while drivers can only upload for their own reports.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Check if the issue report exists and belongs to the driver
    issue_report = (
        db.query(DriverIssueReport)
        .filter(
            DriverIssueReport.id == issue_id, DriverIssueReport.driver_id == driver_id
        )
        .first()
    )

    if not issue_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue report not found"
        )

    # TODO: Implement file upload to storage service
    # For now, we'll just use a placeholder URL
    photo_url = f"https://example.com/issue-photos/{issue_id}/{file.filename}"

    # Create the photo record
    photo = IssuePhoto(
        issue_id=issue_id,
        photo_url=photo_url,
        filename=file.filename,
    )

    db.add(photo)
    db.commit()
    db.refresh(photo)

    return {"id": photo.id, "photo_url": photo_url, "filename": file.filename}


@router.put(
    "/{driver_id}/issues/{issue_id}",
    response_model=IssueReportResponse,
)
async def update_issue_report(
    driver_id: int,
    issue_id: int,
    issue_data: IssueReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_admin_user
    ),  # Only admins can update status
):
    """
    Update an issue report status (admin only).
    """
    # Get the issue report
    issue_report = (
        db.query(DriverIssueReport)
        .filter(
            DriverIssueReport.id == issue_id, DriverIssueReport.driver_id == driver_id
        )
        .first()
    )

    if not issue_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue report not found"
        )

    # Update the issue report
    update_data = issue_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(issue_report, key, value)

    db.commit()
    db.refresh(issue_report)

    return issue_report


@router.delete(
    "/{driver_id}/issues/{issue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_issue_report(
    driver_id: int,
    issue_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_driver_user),
):
    """
    Delete an issue report.
    Admin users can delete any report, while drivers can only delete their own open reports.
    """
    # Get the issue report
    issue_report = (
        db.query(DriverIssueReport)
        .filter(
            DriverIssueReport.id == issue_id, DriverIssueReport.driver_id == driver_id
        )
        .first()
    )

    if not issue_report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Issue report not found"
        )

    # Check if the user is allowed to delete this report
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
        not is_driver_owner or issue_report.status != IssueStatus.OPEN
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this issue report",
        )

    # Delete the issue report (cascade will delete photos)
    db.delete(issue_report)
    db.commit()

    return None
