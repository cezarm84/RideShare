from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
import enum
from app.db.base import Base  # Import Base directly from base.py, not base_class.py

class AddressType(enum.Enum):
    PERSONAL = "personal"
    BUSINESS = "business"
    HOME = "home"
    WORK = "work"
    OTHER = "other"

class Address(Base):
    __tablename__ = "addresses"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Address components
    recipient_name = Column(String)  # Person name or company name
    street = Column(String, nullable=False)
    house_number = Column(String, nullable=False)
    post_code = Column(String, nullable=False)
    city = Column(String, nullable=False)
    country = Column(String, default="Sweden")
    
    # Geocoding information
    coordinates = Column(String)  # Store as "POINT(longitude latitude)"
    
    # Type of address
    address_type = Column(String)  # Using String instead of Enum for compatibility
    
    # Tracking
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # Helper methods for coordinates
    def get_coordinates_tuple(self):
        """Returns (longitude, latitude) tuple"""
        if not self.coordinates:
            return None
            
        # Parse from format "POINT(long lat)"
        point_str = self.coordinates.replace("POINT(", "").replace(")", "")
        long, lat = map(float, point_str.split())
        return (long, lat)
    
    @property
    def longitude(self):
        coords = self.get_coordinates_tuple()
        return coords[0] if coords else None
        
    @property
    def latitude(self):
        coords = self.get_coordinates_tuple()
        return coords[1] if coords else None
    
    # Method to get formatted address
    def get_formatted_address(self):
        """Returns full formatted address as a string"""
        parts = []
        if self.recipient_name:
            parts.append(self.recipient_name)
        parts.append(f"{self.street} {self.house_number}")
        parts.append(f"{self.post_code} {self.city}")
        if self.country:
            parts.append(self.country)
        return "\n".join(parts)
    
    # Method for geocoding integration
    def get_geocoding_string(self):
        """Returns address formatted for geocoding services"""
        return f"{self.street} {self.house_number}, {self.post_code} {self.city}, {self.country}"