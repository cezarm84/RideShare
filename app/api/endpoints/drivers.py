from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.db.session import get_db
from app.api.dependencies import (
    get_current_user,
    get_current_admin_user,
    get_current_driver_user
)
from app.models.user import User, UserRole, UserType
from app.models.driver import DriverProfile, DriverVehicle, DriverDocument, DriverSchedule, DriverStatus, DriverVerificationStatus
from app.schemas.driver import (
    DriverProfileCreate,
    DriverProfileUpdate,
    DriverProfileResponse,
    DriverVehicleCreate,
    DriverVehicleResponse,
    DriverDocumentResponse,
    DriverScheduleCreate,
    DriverScheduleResponse,
    DriverStatus,
    DocumentType,
    DriverWithUserCreate
)
from app.core.security import get_password_hash
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Helper function to check if user can access driver data
def check_driver_access(driver_id: int, current_user: User, db: Session):
    """
    Check if the current user has access to the driver's data.
    Admin users can access any driver, while drivers can only access their own data.
    """
    # If user is admin, allow access
    if current_user.has_admin_privileges():
        return True

    # If user is a driver, check if they're accessing their own profile
    driver_profile = db.query(DriverProfile).filter(
        DriverProfile.id == driver_id
    ).first()

    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    if driver_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this driver's data"
        )

    return True

@router.get("/me", response_model=DriverProfileResponse)
async def get_current_driver_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver_user)
):
    """
    Get the current driver's profile.
    Only accessible to users with driver role.
    """
    driver = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found for current user"
        )

    return driver

@router.put("/me", response_model=DriverProfileResponse)
async def update_current_driver_profile(
    driver_data: DriverProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver_user)
):
    """
    Update the current driver's profile.
    Only accessible to users with driver role.
    """
    driver = db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found for current user"
        )

    # Admin-only fields
    admin_only_fields = ["status", "verification_status", "background_check_date", "background_check_status"]

    # Remove admin-only fields from update data
    update_data = driver_data.dict(exclude_unset=True)
    for field in admin_only_fields:
        if field in update_data:
            del update_data[field]

    # Update driver profile with remaining data
    for key, value in update_data.items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)

    return driver

@router.get("", response_model=List[DriverProfileResponse])
async def get_drivers(
    status: Optional[DriverStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)  # Admin only
):
    """
    Get all drivers with optional filtering by status.
    Admin only endpoint.
    """
    query = db.query(DriverProfile)

    # Apply status filter if provided
    if status:
        query = query.filter(DriverProfile.status == status)

    # Apply pagination
    drivers = query.offset(skip).limit(limit).all()

    return drivers

@router.get("/{driver_id}", response_model=DriverProfileResponse)
async def get_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific driver's profile.
    Admin users can access any driver, while drivers can only access their own profile.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    return driver

@router.post("/with-user", response_model=DriverProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_driver_with_user(
    driver_data: DriverWithUserCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new user account and driver profile in one step.
    This endpoint allows creating a driver with login credentials in a single API call.
    """
    # Check if user with this email already exists
    existing_user = db.query(User).filter(User.email == driver_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user with driver role
    new_user = User(
        email=driver_data.email,
        password_hash=get_password_hash(driver_data.password),
        first_name=driver_data.first_name,
        last_name=driver_data.last_name,
        phone_number=driver_data.phone_number,
        role=UserRole.DRIVER,
        user_type=UserType.DRIVER,
        is_active=True
    )

    db.add(new_user)
    db.flush()  # Flush to get the user ID

    # Create new driver profile
    new_driver = DriverProfile(
        user_id=new_user.id,
        license_number=driver_data.license_number,
        license_expiry=driver_data.license_expiry,
        license_state=driver_data.license_state,
        license_country=driver_data.license_country,
        license_class=driver_data.license_class,
        profile_photo_url=driver_data.profile_photo_url,
        preferred_radius_km=driver_data.preferred_radius_km,
        max_passengers=driver_data.max_passengers,
        bio=driver_data.bio,
        languages=driver_data.languages,
        status=DriverStatus.PENDING,  # New drivers start as pending
        verification_status=DriverVerificationStatus.PENDING
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return new_driver

@router.post("", response_model=DriverProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(
    driver_data: DriverProfileCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)  # Admin only
):
    """
    Create a new driver profile for an existing user.
    Admin only endpoint. For driver self-registration, use the /drivers/with-user endpoint.
    """
    # Check if driver profile already exists for this user
    existing_profile = db.query(DriverProfile).filter(
        DriverProfile.user_id == driver_data.user_id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Driver profile already exists for this user"
        )

    # Create new driver profile
    new_driver = DriverProfile(
        user_id=driver_data.user_id,
        license_number=driver_data.license_number,
        license_expiry=driver_data.license_expiry,
        license_state=driver_data.license_state,
        license_country=driver_data.license_country,
        license_class=driver_data.license_class,
        profile_photo_url=driver_data.profile_photo_url,
        preferred_radius_km=driver_data.preferred_radius_km,
        max_passengers=driver_data.max_passengers,
        bio=driver_data.bio,
        languages=driver_data.languages,
        status=DriverStatus.PENDING,  # New drivers start as pending
        verification_status=DriverVerificationStatus.PENDING
    )

    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)

    return new_driver

@router.put("/{driver_id}", response_model=DriverProfileResponse)
async def update_driver(
    driver_id: int,
    driver_data: DriverProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a driver's profile.
    Admin users can update any driver, while drivers can only update their own profile.
    Some fields can only be updated by admins (status, verification_status, etc.).
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    # Admin-only fields
    admin_only_fields = ["status", "verification_status", "background_check_date", "background_check_status"]

    # Check if non-admin user is trying to update admin-only fields
    if not current_user.has_admin_privileges():
        for field in admin_only_fields:
            if getattr(driver_data, field, None) is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Field '{field}' can only be updated by admins"
                )

    # Update driver profile with provided data
    update_data = driver_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(driver, key, value)

    db.commit()
    db.refresh(driver)

    return driver

@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)  # Admin only
):
    """
    Delete a driver profile.
    Admin only endpoint.
    """
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    db.delete(driver)
    db.commit()

    return None

@router.post("/{driver_id}/vehicles", response_model=DriverVehicleResponse)
async def add_vehicle_to_driver(
    driver_id: int,
    vehicle_data: DriverVehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a vehicle to a driver's profile.
    Admin users can add vehicles to any driver, while drivers can only add to their own profile.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Check if driver exists
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    # Create new vehicle
    new_vehicle = DriverVehicle(
        driver_id=driver_id,
        vehicle_id=vehicle_data.vehicle_id,
        inspection_status=vehicle_data.inspection_status,
        last_inspection_date=vehicle_data.last_inspection_date,
        next_inspection_date=vehicle_data.next_inspection_date,
        is_primary=vehicle_data.is_primary
    )

    # If this is set as primary, unset any existing primary vehicles
    if new_vehicle.is_primary:
        existing_primary = db.query(DriverVehicle).filter(
            DriverVehicle.driver_id == driver_id,
            DriverVehicle.is_primary == True
        ).all()

        for vehicle in existing_primary:
            vehicle.is_primary = False

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return new_vehicle

@router.get("/{driver_id}/vehicles", response_model=List[DriverVehicleResponse])
async def get_driver_vehicles(
    driver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all vehicles associated with a driver.
    Admin users can access any driver's vehicles, while drivers can only access their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    vehicles = db.query(DriverVehicle).filter(DriverVehicle.driver_id == driver_id).all()

    return vehicles

@router.post("/{driver_id}/documents", response_model=DriverDocumentResponse)
async def upload_driver_document(
    driver_id: int,
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    expiry_date: Optional[date] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document for a driver.
    Admin users can upload documents for any driver, while drivers can only upload for themselves.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Check if driver exists
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    # TODO: Implement file upload to storage service
    # For now, we'll just store the filename
    document_url = f"https://storage.example.com/driver-documents/{driver_id}/{document_type}/{file.filename}"

    # Create new document record
    new_document = DriverDocument(
        driver_id=driver_id,
        document_type=document_type,
        document_url=document_url,
        filename=file.filename,
        verification_status=DriverVerificationStatus.PENDING,
        expiry_date=expiry_date
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return new_document

@router.get("/{driver_id}/documents", response_model=List[DriverDocumentResponse])
async def get_driver_documents(
    driver_id: int,
    document_type: Optional[DocumentType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all documents associated with a driver.
    Admin users can access any driver's documents, while drivers can only access their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    query = db.query(DriverDocument).filter(DriverDocument.driver_id == driver_id)

    # Apply document type filter if provided
    if document_type:
        query = query.filter(DriverDocument.document_type == document_type)

    documents = query.all()

    return documents

@router.post("/{driver_id}/schedules", response_model=DriverScheduleResponse)
async def add_driver_schedule(
    driver_id: int,
    schedule_data: DriverScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a schedule for a driver.
    Admin users can add schedules for any driver, while drivers can only add for themselves.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Check if driver exists
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    # Create new schedule
    new_schedule = DriverSchedule(
        driver_id=driver_id,
        is_recurring=schedule_data.is_recurring,
        day_of_week=schedule_data.day_of_week,
        specific_date=schedule_data.specific_date,
        start_time=schedule_data.start_time,
        end_time=schedule_data.end_time,
        preferred_starting_hub_id=schedule_data.preferred_starting_hub_id,
        preferred_area=schedule_data.preferred_area,
        is_active=schedule_data.is_active
    )

    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)

    return new_schedule

@router.get("/{driver_id}/schedules", response_model=List[DriverScheduleResponse])
async def get_driver_schedules(
    driver_id: int,
    active_only: bool = Query(False, description="Only return active schedules"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all schedules associated with a driver.
    Admin users can access any driver's schedules, while drivers can only access their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    query = db.query(DriverSchedule).filter(DriverSchedule.driver_id == driver_id)

    # Apply active filter if requested
    if active_only:
        query = query.filter(DriverSchedule.is_active == True)

    schedules = query.all()

    return schedules

@router.get("/{driver_id}/statistics")
async def get_driver_statistics(
    driver_id: int,
    period_days: int = Query(30, description="Statistics period in days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for a driver.
    Admin users can access any driver's statistics, while drivers can only access their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Check if driver exists
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    # TODO: Implement statistics calculation
    # For now, return basic statistics from the driver profile

    return {
        "driver_id": driver_id,
        "period_days": period_days,
        "total_rides": driver.total_rides,
        "completed_rides": driver.completed_rides,
        "cancelled_rides": driver.cancelled_rides,
        "average_rating": driver.average_rating,
        "status": driver.status
    }

@router.put("/{driver_id}/status")
async def update_driver_status(
    driver_id: int,
    status: DriverStatus,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)  # Admin only
):
    """
    Update a driver's status (PENDING, ACTIVE, INACTIVE, SUSPENDED, REJECTED).
    Admin only endpoint.
    """
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    driver.status = status
    db.commit()

    return {"driver_id": driver_id, "status": status}

@router.put("/{driver_id}/location")
async def update_driver_location(
    driver_id: int,
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a driver's current location.
    Admin users can update any driver's location, while drivers can only update their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    # Check if driver exists
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver not found"
        )

    # TODO: Implement location update
    # This would typically update a location field in the driver profile
    # or a separate driver_locations table

    return {
        "driver_id": driver_id,
        "latitude": latitude,
        "longitude": longitude,
        "updated_at": "2023-06-15T14:30:45.123456"  # Placeholder
    }
