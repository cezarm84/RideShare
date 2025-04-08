from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base_class import Base

class Route(Base):
    """
    Model for routes between hubs (hub-to-hub or hub-to-destination)
    """
    __tablename__ = "routes"
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    
    # Hub relationships
    starting_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=False)
    destination_hub_id = Column(Integer, ForeignKey("hubs.id"), nullable=False)
    
    # Route details
    distance = Column(Float, nullable=True)  # in kilometers
    duration = Column(Integer, nullable=True)  # in minutes
    
    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    starting_hub = relationship("Hub", foreign_keys=[starting_hub_id], backref="outgoing_routes")
    destination_hub = relationship("Hub", foreign_keys=[destination_hub_id], backref="incoming_routes")
    
    def __repr__(self):
        return f"<Route(id={self.id}, name='{self.name}', from={self.starting_hub_id} to={self.destination_hub_id})>"