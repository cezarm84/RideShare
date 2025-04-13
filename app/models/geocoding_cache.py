"""
Model for caching geocoding results to reduce API calls.
"""

import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.db.base_class import Base


class GeocodingCache(Base):
    """
    Cache for geocoded addresses to reduce API calls.
    Stores the address, coordinates, and timestamps for when the entry was created and last used.
    """

    __tablename__ = "geocoding_cache"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    address = Column(String, unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    coordinates = Column(String, nullable=False)  # Formatted as "lat,lng"
    created_at = Column(DateTime, default=datetime.datetime.now(datetime.timezone.utc))
    last_used = Column(
        DateTime,
        default=datetime.datetime.now(datetime.timezone.utc),
        onupdate=datetime.datetime.now(datetime.timezone.utc),
    )

    def __repr__(self):
        return f"<GeocodingCache(address='{self.address}', coordinates='{self.coordinates}')>"
