from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"
    # Add this to make the model respond to both "user" and "users" table names
    __table_args__ = {'extend_existing': True}
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    first_name = Column(String)
    last_name = Column(String)
    phone_number = Column(String)
    user_type = Column(String, default="private")  # "private", "enterprise", or "admin"
    
    # Simple address strings
    home_address = Column(String, nullable=True)
    home_location = Column(String, nullable=True)  # Serialized location data
    work_address = Column(String, nullable=True)
    work_location = Column(String, nullable=True)  # Serialized location data
    
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Add back_populates to match the relationship in RideBooking
    bookings = relationship("RideBooking", back_populates="user")

class Enterprise(Base):
    __tablename__ = "enterprises"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    users = relationship("EnterpriseUser", back_populates="enterprise")

class EnterpriseUser(Base):
    __tablename__ = "enterprise_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    enterprise_id = Column(Integer, ForeignKey("enterprises.id"))
    employee_id = Column(String)
    department = Column(String, nullable=True)
    position = Column(String, nullable=True)
    
    enterprise = relationship("Enterprise", back_populates="users")
