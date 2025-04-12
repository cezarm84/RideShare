from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserMatchingPreferenceBase(BaseModel):
    """Base model for user matching preferences"""

    max_detour_minutes: Optional[int] = Field(
        None, ge=0, le=60, description="Maximum acceptable detour time in minutes"
    )
    max_wait_minutes: Optional[int] = Field(
        None, ge=0, le=60, description="Maximum acceptable wait time in minutes"
    )
    max_walking_distance_meters: Optional[int] = Field(
        None, ge=0, le=5000, description="Maximum acceptable walking distance in meters"
    )
    preferred_gender: Optional[str] = Field(
        None, description="Preferred gender of co-passengers"
    )
    preferred_language: Optional[str] = Field(
        None, description="Preferred language of co-passengers"
    )
    minimum_driver_rating: Optional[float] = Field(
        None, ge=1.0, le=5.0, description="Minimum acceptable driver rating"
    )
    prefer_same_enterprise: Optional[bool] = Field(
        None, description="Prefer rides with people from the same enterprise"
    )
    prefer_same_destination: Optional[bool] = Field(
        None, description="Prefer rides with people going to the same destination"
    )
    prefer_recurring_rides: Optional[bool] = Field(
        None, description="Prefer recurring rides over one-time rides"
    )


class UserMatchingPreferenceCreate(UserMatchingPreferenceBase):
    """Model for creating user matching preferences"""

    pass


class UserMatchingPreferenceUpdate(UserMatchingPreferenceBase):
    """Model for updating user matching preferences"""

    pass


class UserMatchingPreferenceResponse(UserMatchingPreferenceBase):
    """Model for user matching preference response"""

    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
