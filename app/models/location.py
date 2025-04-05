from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class Hub(Base):
    __tablename__ = "hubs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    # Address relationship
    address_id = Column(Integer, ForeignKey("addresses.id"))
    address = relationship("Address")
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    
    # Helper methods for coordinates
    def get_coordinates_tuple(self):
        """Returns (longitude, latitude) tuple"""
        if not self.address:
            return None
        return self.address.get_coordinates_tuple()
        
    # Helper properties for coordinates
    @property
    def longitude(self):
        coords = self.get_coordinates_tuple()
        return coords[0] if coords else None
        
    @property
    def latitude(self):
        coords = self.get_coordinates_tuple()
        return coords[1] if coords else None

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    
    # Address relationship
    address_id = Column(Integer, ForeignKey("addresses.id"))
    address = relationship("Address")
    
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"))
    created_at = Column(DateTime, default=func.now())
    
    # Helper methods for coordinates
    def get_coordinates_tuple(self):
        """Returns (longitude, latitude) tuple"""
        if not self.address:
            return None
        return self.address.get_coordinates_tuple()
