from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class IssueType(str, Enum):
    VEHICLE = "vehicle"
    PASSENGER = "passenger"
    ROUTE = "route"
    OTHER = "other"


class IssuePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class IssueStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


# Base schemas
class IssuePhotoBase(BaseModel):
    photo_url: str
    filename: str


class IssueReportBase(BaseModel):
    issue_type: IssueType
    ride_id: Optional[int] = None
    priority: IssuePriority
    description: str


# Create schemas
class IssuePhotoCreate(IssuePhotoBase):
    pass


class IssueReportCreate(IssueReportBase):
    driver_id: int
    photos: Optional[List[IssuePhotoCreate]] = None


# Update schemas
class IssueReportUpdate(BaseModel):
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    response: Optional[str] = None
    assigned_to: Optional[int] = None


# Response schemas
class IssuePhotoResponse(IssuePhotoBase):
    id: int
    issue_id: int
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True


class IssueReportResponse(IssueReportBase):
    id: int
    driver_id: int
    status: IssueStatus
    response: Optional[str] = None
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    photos: List[IssuePhotoResponse] = []

    class Config:
        orm_mode = True
        from_attributes = True
