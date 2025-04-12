import datetime
from datetime import timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Destination(Base):
    """Model for custom destinations that are not hubs"""

    __tablename__ = "destinations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    postal_code = Column(String, nullable=True)
    country = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True)

    # Optional enterprise association
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"), nullable=True)

    # Relationships
    enterprise = relationship("Enterprise", backref="destinations")

    def __repr__(self):
        return f"<Destination(id={self.id}, name={self.name}, city={self.city})>"
