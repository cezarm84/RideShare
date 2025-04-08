from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date, time
from pydantic import BaseModel, Field, validator, EmailStr
from enum import Enum

# Enums for driver status
class DriverStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    REJECTED = "rejected"

class DriverVerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"

class VehicleInspectionStatus(str, Enum):
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    EXPIRED = "expired"

class RideTypePermission(str, Enum):
    HUB_TO_HUB = "hub_to_hub"
    HUB_TO_DESTINATION = "hub_to_destination"
    ENTERPRISE = "enterprise"
    ALL = "all"

class DocumentType(str, Enum):
    LICENSE = "license"
    INSURANCE = "insurance"
    REGISTRATION = "registration"
    VEHICLE_PHOTO = "vehicle_photo"
    PROFILE_PHOTO = "profile_photo"
    BACKGROUND_CHECK = "background_check"
    OTHER = "other"

# Base schemas
class DriverVehicleBase(BaseModel):
    vehicle_id: int
    inspection_status: Optional[VehicleInspectionStatus] = VehicleInspectionStatus.PENDING
    last_inspection_date: Optional[date] = None
    next_inspection_date: Optional[date] = None
    is_primary: bool = False

class DriverScheduleBase(BaseModel):
    is_recurring: bool = True
    day_of_week: Optional[int] = None
    specific_date: Optional[date] = None
    start_time: time
    end_time: time
    preferred_starting_hub_id: Optional[int] = None
    preferred_area: Optional[str] = None
    is_active: bool = True

    @validator('day_of_week')
    def validate_day_of_week(cls, v, values):
        if values.get('is_recurring') and v is None:
            raise ValueError("day_of_week is required for recurring schedules")
        if v is not None and (v < 0 or v > 6):
            raise ValueError("day_of_week must be between 0 (Monday) and 6 (Sunday)")
        return v

    @validator('specific_date')
    def validate_specific_date(cls, v, values):
        if not values.get('is_recurring') and v is None:
            raise ValueError("specific_date is required for non-recurring schedules")
        return v

    @validator('end_time')
    def validate_end_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError("end_time must be after start_time")
        return v

class DriverTimeOffBase(BaseModel):
    start_date: date
    end_date: date
    reason: Optional[str] = None
    status: str = "approved"

    @validator('end_date')
    def validate_end_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError("end_date must be on or after start_date")
        return v

class DriverReviewBase(BaseModel):
    passenger_id: int
    ride_id: int
    rating: float
    comment: Optional[str] = None
    driving_rating: Optional[float] = None
    cleanliness_rating: Optional[float] = None
    punctuality_rating: Optional[float] = None
    is_public: bool = True

    @validator('rating', 'driving_rating', 'cleanliness_rating', 'punctuality_rating')
    def validate_rating(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Rating must be between 1 and 5")
        return v

class DriverDocumentBase(BaseModel):
    document_type: DocumentType
    document_url: str
    filename: str
    verification_status: DriverVerificationStatus = DriverVerificationStatus.PENDING
    verification_notes: Optional[str] = None
    expiry_date: Optional[date] = None

# Create schemas
class DriverProfileCreate(BaseModel):
    user_id: int
    license_number: str
    license_expiry: date
    license_state: str
    license_country: str
    license_class: Optional[str] = None
    profile_photo_url: Optional[str] = None
    preferred_radius_km: Optional[float] = 10.0
    max_passengers: Optional[int] = 4
    bio: Optional[str] = None
    languages: Optional[str] = None
    ride_type_permissions: Optional[List[RideTypePermission]] = None

# Combined schema for creating a user and driver profile in one step
class DriverWithUserCreate(BaseModel):
    # User information
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone_number: str

    # Driver information
    license_number: str
    license_expiry: date
    license_state: str
    license_country: str
    license_class: Optional[str] = None
    profile_photo_url: Optional[str] = None
    preferred_radius_km: Optional[float] = 10.0
    max_passengers: Optional[int] = 4
    bio: Optional[str] = None
    languages: Optional[str] = None
    ride_type_permissions: Optional[List[RideTypePermission]] = None

class DriverVehicleCreate(DriverVehicleBase):
    driver_id: int

class DriverScheduleCreate(DriverScheduleBase):
    driver_id: int

class DriverTimeOffCreate(DriverTimeOffBase):
    driver_id: int

class DriverReviewCreate(DriverReviewBase):
    driver_id: int

class DriverDocumentCreate(DriverDocumentBase):
    driver_id: int

# Update schemas
class DriverProfileUpdate(BaseModel):
    status: Optional[DriverStatus] = None
    verification_status: Optional[DriverVerificationStatus] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    license_state: Optional[str] = None
    license_country: Optional[str] = None
    license_class: Optional[str] = None
    profile_photo_url: Optional[str] = None
    preferred_radius_km: Optional[float] = None
    max_passengers: Optional[int] = None
    background_check_date: Optional[date] = None
    background_check_status: Optional[str] = None
    bio: Optional[str] = None
    languages: Optional[str] = None
    ride_type_permissions: Optional[List[RideTypePermission]] = None

class DriverVehicleUpdate(BaseModel):
    vehicle_id: Optional[int] = None
    inspection_status: Optional[VehicleInspectionStatus] = None
    last_inspection_date: Optional[date] = None
    next_inspection_date: Optional[date] = None
    is_primary: Optional[bool] = None

class DriverScheduleUpdate(BaseModel):
    is_recurring: Optional[bool] = None
    day_of_week: Optional[int] = None
    specific_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    preferred_starting_hub_id: Optional[int] = None
    preferred_area: Optional[str] = None
    is_active: Optional[bool] = None

class DriverTimeOffUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None
    status: Optional[str] = None

class DriverReviewUpdate(BaseModel):
    rating: Optional[float] = None
    comment: Optional[str] = None
    driving_rating: Optional[float] = None
    cleanliness_rating: Optional[float] = None
    punctuality_rating: Optional[float] = None
    is_public: Optional[bool] = None
    is_flagged: Optional[bool] = None

class DriverDocumentUpdate(BaseModel):
    document_type: Optional[DocumentType] = None
    document_url: Optional[str] = None
    filename: Optional[str] = None
    verification_status: Optional[DriverVerificationStatus] = None
    verification_notes: Optional[str] = None
    expiry_date: Optional[date] = None

# Response schemas
class DriverVehicleResponse(DriverVehicleBase):
    id: int
    driver_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class DriverScheduleResponse(DriverScheduleBase):
    id: int
    driver_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class DriverTimeOffResponse(DriverTimeOffBase):
    id: int
    driver_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class DriverReviewResponse(DriverReviewBase):
    id: int
    driver_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class DriverDocumentResponse(DriverDocumentBase):
    id: int
    driver_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class DriverProfileResponse(BaseModel):
    id: int
    user_id: int
    status: DriverStatus
    verification_status: DriverVerificationStatus
    license_number: str
    license_expiry: date
    license_state: str
    license_country: str
    license_class: Optional[str] = None
    profile_photo_url: Optional[str] = None
    average_rating: float
    total_rides: int
    completed_rides: int
    cancelled_rides: int
    preferred_radius_km: float
    max_passengers: int
    background_check_date: Optional[date] = None
    background_check_status: Optional[str] = None
    bio: Optional[str] = None
    languages: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    ride_type_permissions: List[str] = []

    class Config:
        orm_mode = True
        from_attributes = True

class DriverProfileDetailedResponse(DriverProfileResponse):
    vehicles: List[DriverVehicleResponse] = []
    schedules: List[DriverScheduleResponse] = []
    reviews: List[DriverReviewResponse] = []
    documents: List[DriverDocumentResponse] = []
    time_off_periods: List[DriverTimeOffResponse] = []

    class Config:
        orm_mode = True
        from_attributes = True
