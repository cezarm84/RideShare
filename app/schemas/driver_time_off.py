from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, validator


class TimeOffRequestType(str, Enum):
    SICK_LEAVE = "sick_leave"
    VACATION = "vacation"
    PARENTAL_LEAVE = "parental_leave"
    OTHER = "other"


class TimeOffRequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# Base schema
class TimeOffRequestBase(BaseModel):
    request_type: TimeOffRequestType
    start_date: date
    end_date: date
    reason: Optional[str] = None

    @validator("end_date")
    def validate_end_date(cls, v, values):
        if "start_date" in values and v < values["start_date"]:
            raise ValueError("end_date must be on or after start_date")
        return v


# Create schema
class TimeOffRequestCreate(TimeOffRequestBase):
    driver_id: int


# Update schema
class TimeOffRequestUpdate(BaseModel):
    status: Optional[TimeOffRequestStatus] = None
    response_notes: Optional[str] = None


# Response schema
class TimeOffRequestResponse(TimeOffRequestBase):
    id: int
    driver_id: int
    status: TimeOffRequestStatus
    response_notes: Optional[str] = None
    responded_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
