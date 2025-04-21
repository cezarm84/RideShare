import datetime
import enum

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class TimeOffRequestType(str, enum.Enum):
    """Type of time off request"""

    SICK_LEAVE = "sick_leave"
    VACATION = "vacation"
    PARENTAL_LEAVE = "parental_leave"
    OTHER = "other"


class TimeOffRequestStatus(str, enum.Enum):
    """Status of time off request"""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DriverTimeOffRequest(Base):
    """Time off requests from drivers"""

    __tablename__ = "driver_time_off_requests"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("driver_profiles.id"), nullable=False)
    request_type = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String, default=TimeOffRequestStatus.PENDING)

    # Admin response
    response_notes = Column(Text, nullable=True)
    responded_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(
        DateTime,
        default=datetime.datetime.now(datetime.timezone.utc),
        onupdate=datetime.datetime.now(datetime.timezone.utc),
    )

    # Relationships
    driver = relationship("DriverProfile", back_populates="time_off_requests")
    responder = relationship("User", foreign_keys=[responded_by])
