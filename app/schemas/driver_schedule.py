from datetime import date, datetime, time
from enum import Enum
from typing import Optional

from pydantic import BaseModel, validator


class RecurrenceType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ONE_TIME = "one_time"


# Base schema
class DriverScheduleBase(BaseModel):
    is_recurring: bool = False
    day_of_week: Optional[int] = None
    specific_date: Optional[date] = None
    start_time: time
    end_time: time
    preferred_starting_hub_id: Optional[int] = None
    preferred_area: Optional[str] = None
    is_active: bool = True

    @validator("day_of_week")
    def validate_day_of_week(cls, v, values):
        if values.get("is_recurring") and v is None:
            raise ValueError("day_of_week is required for recurring schedules")
        if v is not None and (v < 0 or v > 6):
            raise ValueError("day_of_week must be between 0 (Monday) and 6 (Sunday)")
        return v

    @validator("specific_date")
    def validate_specific_date(cls, v, values):
        if not values.get("is_recurring") and v is None:
            raise ValueError("specific_date is required for non-recurring schedules")
        return v

    @validator("end_time")
    def validate_end_time(cls, v, values):
        if "start_time" in values and v <= values["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v


# Create schema
class DriverScheduleCreate(DriverScheduleBase):
    driver_id: int


# Update schema
class DriverScheduleUpdate(BaseModel):
    recurrence_type: Optional[RecurrenceType] = None
    day_of_week: Optional[int] = None
    specific_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    preferred_starting_hub_id: Optional[int] = None
    preferred_area: Optional[str] = None
    is_active: Optional[bool] = None


# Response schema
class DriverScheduleResponse(DriverScheduleBase):
    id: int
    driver_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
