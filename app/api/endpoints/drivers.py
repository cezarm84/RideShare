import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_admin_user,
    get_current_driver_user,
    get_current_user,
    get_current_user_optional,
)
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.driver import (
    DriverDocument,
    DriverProfile,
    DriverSchedule,
    DriverStatus,
    DriverVehicle,
    DriverVerificationStatus,
    driver_ride_type_permissions,
)
from app.models.user import User, UserRole, UserType
from app.schemas.driver import (
    DocumentType,
    DriverDocumentResponse,
    DriverProfileCreate,
    DriverProfileResponse,
    DriverProfileUpdate,
    DriverScheduleCreate,
    DriverScheduleResponse,
    DriverStatus,
    DriverVehicleCreate,
    DriverVehicleResponse,
    DriverWithUserCreate,
)
from app.services.email_service import email_service

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
    driver_profile = (
        db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    )

    if not driver_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    if driver_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this driver's data",
        )

    return True


@router.get("/me", response_model=DriverProfileResponse)
async def get_current_driver_profile(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_driver_user)
):
    """
    Get the current driver's profile.
    Only accessible to users with driver role.
    """
    driver = (
        db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    )
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found for current user",
        )

    return driver


@router.put("/me", response_model=DriverProfileResponse)
async def update_current_driver_profile(
    driver_data: DriverProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver_user),
):
    """
    Update the current driver's profile.
    Only accessible to users with driver role.
    """
    driver = (
        db.query(DriverProfile).filter(DriverProfile.user_id == current_user.id).first()
    )
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found for current user",
        )

    # Admin-only fields
    admin_only_fields = [
        "status",
        "verification_status",
        "background_check_date",
        "background_check_status",
    ]

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
    _: User = Depends(get_current_admin_user),  # Admin only
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
    current_user: User = Depends(get_current_user),
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
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    return driver


@router.post(
    "/with-user",
    response_model=DriverProfileResponse,
    status_code=status.HTTP_201_CREATED,
    deprecated=True,
)
async def create_driver_with_user(
    driver_data: DriverWithUserCreate, db: Session = Depends(get_db)
):
    """
    [DEPRECATED] Create a new user account and driver profile in one step.

    This endpoint is deprecated. Please use POST /api/v1/drivers instead, which now supports
    both creating a driver profile for an existing user and creating a new user with driver profile.
    """
    # Check if user with this email already exists
    existing_user = db.query(User).filter(User.email == driver_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
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
        is_active=True,
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
        verification_status=DriverVerificationStatus.PENDING,
    )

    db.add(new_driver)
    db.commit()  # Commit to get the driver ID
    db.refresh(new_driver)

    # Add ride type permissions if provided
    if driver_data.ride_type_permissions:
        for permission in driver_data.ride_type_permissions:
            db.execute(
                driver_ride_type_permissions.insert().values(
                    driver_profile_id=new_driver.id, ride_type=permission
                )
            )
        db.commit()  # Commit the permissions

    return new_driver


@router.post(
    "", response_model=DriverProfileResponse, status_code=status.HTTP_201_CREATED
)
async def create_driver(
    driver_data: DriverProfileCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Create a new driver profile with or without a user account.

    This endpoint supports two scenarios:
    1. Creating a driver profile for an existing user (admin only)
    2. Creating both a user account and driver profile in one step (self-registration)

    For scenario 1, provide user_id.
    For scenario 2, provide email, password, first_name, last_name, and phone_number.
    """
    # Determine if this is admin-only operation (existing user) or self-registration
    is_admin_operation = driver_data.user_id is not None

    # For admin operations, ensure the current user has admin privileges
    if is_admin_operation and (
        current_user is None or not current_user.has_admin_privileges()
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create driver profiles for existing users",
        )

    # Handle user creation if needed (self-registration)
    user_id = None
    if not is_admin_operation:
        # Check if user with this email already exists
        existing_user = db.query(User).filter(User.email == driver_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
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
            is_active=True,
        )

        db.add(new_user)
        db.flush()  # Flush to get the user ID
        user_id = new_user.id

        # Handle email verification
        if settings.EMAIL_VERIFICATION_REQUIRED:
            # Generate verification token
            token = email_service.generate_verification_token()

            # Set token expiration
            expires = datetime.now(timezone.utc) + timedelta(
                hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
            )

            # Update user with verification token
            new_user.verification_token = token
            new_user.verification_token_expires = expires

            # Send verification email in background
            background_tasks.add_task(
                email_service.send_verification_email, new_user, token
            )
        else:
            # If verification is not required, mark user as verified
            new_user.is_verified = True
    else:
        # Check if driver profile already exists for this user
        existing_profile = (
            db.query(DriverProfile)
            .filter(DriverProfile.user_id == driver_data.user_id)
            .first()
        )

        if existing_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Driver profile already exists for this user",
            )
        user_id = driver_data.user_id

    # Create new driver profile
    new_driver = DriverProfile(
        user_id=user_id,
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
        verification_status=DriverVerificationStatus.PENDING,
    )

    db.add(new_driver)
    db.commit()  # Commit to get the driver ID
    db.refresh(new_driver)

    # Add ride type permissions if provided
    if driver_data.ride_type_permissions:
        for permission in driver_data.ride_type_permissions:
            db.execute(
                driver_ride_type_permissions.insert().values(
                    driver_profile_id=new_driver.id, ride_type=permission
                )
            )
        db.commit()  # Commit the permissions

    return new_driver


@router.put("/{driver_id}", response_model=DriverProfileResponse)
async def update_driver(
    driver_id: int,
    driver_data: DriverProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    # Admin-only fields
    admin_only_fields = [
        "status",
        "verification_status",
        "background_check_date",
        "background_check_status",
    ]

    # Check if non-admin user is trying to update admin-only fields
    if not current_user.has_admin_privileges():
        for field in admin_only_fields:
            if getattr(driver_data, field, None) is not None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Field '{field}' can only be updated by admins",
                )

    # Update driver profile with provided data
    update_data = driver_data.dict(exclude_unset=True)

    # Handle ride_type_permissions separately
    ride_type_permissions = None
    if "ride_type_permissions" in update_data:
        ride_type_permissions = update_data.pop("ride_type_permissions")

    # Update other fields
    for key, value in update_data.items():
        setattr(driver, key, value)

    # Update ride type permissions if provided
    if ride_type_permissions is not None:
        # Delete existing permissions
        db.execute(
            driver_ride_type_permissions.delete().where(
                driver_ride_type_permissions.c.driver_profile_id == driver_id
            )
        )

        # Add new permissions
        for permission in ride_type_permissions:
            db.execute(
                driver_ride_type_permissions.insert().values(
                    driver_profile_id=driver_id, ride_type=permission
                )
            )

    db.commit()
    db.refresh(driver)

    return driver


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),  # Admin only
):
    """
    Delete a driver profile.
    Admin only endpoint.
    """
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    db.delete(driver)
    db.commit()

    return None


@router.post("/{driver_id}/vehicles", response_model=DriverVehicleResponse)
async def add_vehicle_to_driver(
    driver_id: int,
    vehicle_data: DriverVehicleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    # Validate inspection status
    if vehicle_data.inspection_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add a vehicle with pending inspection status to a driver. Vehicle must pass inspection first.",
        )

    # Check if the inspection date has passed
    from datetime import datetime

    today = datetime.now().date()

    if vehicle_data.next_inspection_date and vehicle_data.next_inspection_date < today:
        # If inspection date has passed, automatically set status to pending
        vehicle_data.inspection_status = "pending"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The vehicle's inspection date has expired. Please get a new inspection before adding this vehicle.",
        )

    # Create new vehicle
    new_vehicle = DriverVehicle(
        driver_id=driver_id,
        vehicle_id=vehicle_data.vehicle_id,
        inspection_status=vehicle_data.inspection_status,
        last_inspection_date=vehicle_data.last_inspection_date,
        next_inspection_date=vehicle_data.next_inspection_date,
        is_primary=vehicle_data.is_primary,
    )

    # If this is set as primary, unset any existing primary vehicles
    if new_vehicle.is_primary:
        existing_primary = (
            db.query(DriverVehicle)
            .filter(
                DriverVehicle.driver_id == driver_id, DriverVehicle.is_primary
            )
            .all()
        )

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
    current_user: User = Depends(get_current_user),
):
    """
    Get all vehicles associated with a driver.
    Admin users can access any driver's vehicles, while drivers can only access their own.
    """
    # Check access permissions
    check_driver_access(driver_id, current_user, db)

    vehicles = (
        db.query(DriverVehicle).filter(DriverVehicle.driver_id == driver_id).all()
    )

    return vehicles


@router.put(
    "/{driver_id}/vehicles/{vehicle_id}/inspection",
    response_model=DriverVehicleResponse,
)
async def update_driver_vehicle_inspection(
    driver_id: int,
    vehicle_id: int,
    inspection_status: str = Query(
        ..., description="New inspection status (passed, failed, expired)"
    ),
    last_inspection_date: Optional[date] = Query(
        None, description="Date of last inspection"
    ),
    next_inspection_date: Optional[date] = Query(
        None, description="Date of next inspection"
    ),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),  # Admin only
):
    """
    Update the inspection status of a vehicle associated with a driver.
    Admin only endpoint.
    """
    # Check if driver-vehicle association exists
    driver_vehicle = (
        db.query(DriverVehicle)
        .filter(DriverVehicle.driver_id == driver_id, DriverVehicle.id == vehicle_id)
        .first()
    )

    if not driver_vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found for this driver",
        )

    # Validate inspection status
    valid_statuses = ["passed", "failed", "expired"]
    if inspection_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid inspection status. Must be one of: {', '.join(valid_statuses)}",
        )

    # Update inspection status
    driver_vehicle.inspection_status = inspection_status

    if last_inspection_date:
        driver_vehicle.last_inspection_date = last_inspection_date

    if next_inspection_date:
        driver_vehicle.next_inspection_date = next_inspection_date

    db.commit()
    db.refresh(driver_vehicle)

    return driver_vehicle


@router.post("/{driver_id}/documents", response_model=DriverDocumentResponse)
async def upload_driver_document(
    driver_id: int,
    document_type: DocumentType = Form(...),
    file: UploadFile = File(...),
    expiry_date: Optional[date] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
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
        expiry_date=expiry_date,
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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
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
        is_active=schedule_data.is_active,
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
    current_user: User = Depends(get_current_user),
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
        query = query.filter(DriverSchedule.is_active)

    schedules = query.all()

    return schedules


@router.get("/{driver_id}/statistics")
async def get_driver_statistics(
    driver_id: int,
    period_days: int = Query(30, description="Statistics period in days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
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
        "status": driver.status,
    }


@router.put("/{driver_id}/status")
async def update_driver_status(
    driver_id: int,
    status: DriverStatus,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),  # Admin only
):
    """
    Update a driver's status (PENDING, ACTIVE, INACTIVE, SUSPENDED, REJECTED).
    Admin only endpoint.
    """
    driver = db.query(DriverProfile).filter(DriverProfile.id == driver_id).first()
    if not driver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
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
    current_user: User = Depends(get_current_user),
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
            status_code=status.HTTP_404_NOT_FOUND, detail="Driver not found"
        )

    # TODO: Implement location update
    # This would typically update a location field in the driver profile
    # or a separate driver_locations table

    return {
        "driver_id": driver_id,
        "latitude": latitude,
        "longitude": longitude,
        "updated_at": "2023-06-15T14:30:45.123456",  # Placeholder
    }
