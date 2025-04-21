import datetime
import enum

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class IssueType(str, enum.Enum):
    """Type of issue reported by driver"""

    VEHICLE = "vehicle"
    PASSENGER = "passenger"
    ROUTE = "route"
    OTHER = "other"


class IssuePriority(str, enum.Enum):
    """Priority of issue reported by driver"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class IssueStatus(str, enum.Enum):
    """Status of issue reported by driver"""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class DriverIssueReport(Base):
    """Issue reports from drivers"""

    __tablename__ = "driver_issue_reports"

    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("driver_profiles.id"), nullable=False)
    issue_type = Column(String, nullable=False)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=True)
    priority = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, default=IssueStatus.OPEN)

    # Admin response
    response = Column(Text, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(
        DateTime,
        default=datetime.datetime.now(datetime.timezone.utc),
        onupdate=datetime.datetime.now(datetime.timezone.utc),
    )

    # Relationships
    driver = relationship("DriverProfile", back_populates="issue_reports")
    ride = relationship("Ride", backref="issue_reports")
    assignee = relationship("User", foreign_keys=[assigned_to])
    photos = relationship(
        "IssuePhoto", back_populates="issue", cascade="all, delete-orphan"
    )


class IssuePhoto(Base):
    """Photos attached to issue reports"""

    __tablename__ = "issue_photos"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("driver_issue_reports.id"), nullable=False)
    photo_url = Column(String, nullable=False)
    filename = Column(String, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    issue = relationship("DriverIssueReport", back_populates="photos")
