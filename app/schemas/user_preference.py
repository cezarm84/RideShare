from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserPreferenceBase(BaseModel):
    """Base schema for user preferences"""

    theme: Optional[str] = Field(None, description="UI theme preference")
    language: Optional[str] = Field(None, description="Language preference")
    notifications: Optional[bool] = Field(
        True, description="Whether to enable notifications"
    )
    email_frequency: Optional[str] = Field(
        "daily", description="Email frequency preference"
    )
    push_enabled: Optional[bool] = Field(
        True, description="Whether to enable push notifications"
    )


class UserPreferenceCreate(UserPreferenceBase):
    """Schema for creating user preferences"""

    pass


class UserPreferenceUpdate(UserPreferenceBase):
    """Schema for updating user preferences"""

    pass


class UserPreferenceResponse(UserPreferenceBase):
    """Schema for user preference response"""

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
