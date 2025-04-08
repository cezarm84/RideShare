from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class Address(Base):
    """Model for addresses"""
    
    __tablename__ = "addresses"
    
    id = Column(Integer, primary_key=True, index=True)
    street = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)
    country = Column(String, nullable=False)
    
    # Optional additional details
    additional_info = Column(String, nullable=True)
    
    # Coordinates
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Relationships - we'll use back_populates instead of declaring hubs here
    # The Hub model will define the relationship with its foreign key
    
    def __repr__(self):
        return f"<Address(id={self.id}, {self.street}, {self.city}, {self.state})>"