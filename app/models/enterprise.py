from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
import datetime

from app.db.base_class import Base

class Enterprise(Base):
    """Model for enterprises (companies) that use the ride-sharing service"""

    __tablename__ = "enterprises"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    country = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    # We don't define a relationship to Ride here since Ride uses a property for enterprise_id

    def __repr__(self):
        return f"<Enterprise(id={self.id}, name={self.name})>"
