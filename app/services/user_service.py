import logging
import uuid
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.models.user import User, EnterpriseUser
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.core.geocoding import geocoding_service

logger = logging.getLogger(__name__)

def generate_unique_user_id():
    """Generate a unique user ID"""
    # Generate a UUID and take first 8 characters to keep it shorter
    return f"UID-{uuid.uuid4().hex[:8].upper()}"

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if user:
            # Ensure user_id is set
            if not user.user_id:
                user.user_id = f"UID-{uuid.uuid4().hex[:8].upper()}"
                self.db.commit()
                
            # Ensure created_at is set
            if not user.created_at:
                user.created_at = datetime.utcnow()
                self.db.commit()
                
            # Load any related enterprise data if applicable
            enterprise_user = self.db.query(EnterpriseUser).filter(EnterpriseUser.user_id == user.id).first()
            if enterprise_user:
                user.enterprise_data = enterprise_user
        return user
    
    def get_by_user_id(self, user_id: str) -> Optional[User]:
        """Get user by user_id string."""
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if user:
            # Ensure created_at is set
            if not user.created_at:
                user.created_at = datetime.utcnow()
                self.db.commit()
                
            # Load any related enterprise data if applicable
            enterprise_user = self.db.query(EnterpriseUser).filter(EnterpriseUser.user_id == user.id).first()
            if enterprise_user:
                user.enterprise_data = enterprise_user
        return user
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        user = self.db.query(User).filter(User.email == email).first()
        if user:
            # Ensure user_id is set
            if not user.user_id:
                user.user_id = f"UID-{uuid.uuid4().hex[:8].upper()}"
                self.db.commit()
                
            # Ensure created_at is set
            if not user.created_at:
                user.created_at = datetime.utcnow()
                self.db.commit()
        return user
    
    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination."""
        users = self.db.query(User).offset(skip).limit(limit).all()
        
        # Ensure all users have user_id and created_at set
        for user in users:
            if not user.user_id:
                user.user_id = f"UID-{uuid.uuid4().hex[:8].upper()}"
                
            if not user.created_at:
                user.created_at = datetime.utcnow()
        
        # If any changes were made, commit them
        self.db.commit()
        
        return users
    
    def create_user(self, user_in: UserCreate, user_id=None, home_location=None, work_location=None) -> User:
        """
        Create a new user with automatic geocoding for addresses.
        
        Args:
            user_in: User creation data from schema (UserCreate or dict)
            user_id: Optional pre-generated user ID string
            home_location: Optional POINT string for home coordinates
            work_location: Optional POINT string for work coordinates
        """
        try:
            # Convert dictionary to UserCreate if needed
            if isinstance(user_in, dict):
                # Create a UserCreate model from dictionary
                from app.schemas.user import UserCreate
                user_dict = user_in.copy()
                user_create = UserCreate(**user_dict)
                user_in = user_create
                
            # Generate unique user_id if not provided
            unique_user_id = user_id if user_id else generate_unique_user_id()
            
            # Set created_at to current time if not provided
            current_time = datetime.utcnow()
            
            # Determine home coordinates if not provided
            if not home_location:
                if user_in.home_address:
                    coords = geocoding_service.get_coordinates(user_in.home_address)
                    if coords:
                        # coords[0] is latitude, coords[1] is longitude
                        home_location = f"POINT({coords[1]} {coords[0]})"
                elif user_in.latitude and user_in.longitude:
                    home_location = f"POINT({user_in.longitude} {user_in.latitude})"

            # Determine work coordinates if not provided
            if not work_location:
                if user_in.work_address:
                    coords = geocoding_service.get_coordinates(user_in.work_address)
                    if coords:
                        work_location = f"POINT({coords[1]} {coords[0]})"
                elif hasattr(user_in, 'work_latitude') and hasattr(user_in, 'work_longitude') and user_in.work_latitude and user_in.work_longitude:
                    work_location = f"POINT({user_in.work_longitude} {user_in.work_latitude})"

            # Parse address components
            home_address_components = self._parse_address(user_in.home_address) if user_in.home_address else {}
            work_address_components = self._parse_address(user_in.work_address) if user_in.work_address else {}

            db_user = User(
                user_id=unique_user_id,
                email=user_in.email,
                password_hash=get_password_hash(user_in.password),
                first_name=user_in.first_name,
                last_name=user_in.last_name,
                phone_number=user_in.phone_number,
                user_type=user_in.user_type,
                home_address=user_in.home_address,
                home_location=home_location,
                work_address=user_in.work_address,
                work_location=work_location,
                created_at=current_time
            )
            
            self.db.add(db_user)
            self.db.commit()
            self.db.refresh(db_user)

            if user_in.user_type == "enterprise" and user_in.enterprise_id:
                enterprise_user = EnterpriseUser(
                    user_id=db_user.id,
                    enterprise_id=user_in.enterprise_id,
                    employee_id=user_in.employee_id
                )
                self.db.add(enterprise_user)
                self.db.commit()

            return db_user
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    def _parse_address(self, address_string: str):
        """
        Parse address string into components
        
        Simple implementation - in production, use a more robust address parser
        """
        components = {}
        
        # Try to extract street and house number
        parts = address_string.split()
        if len(parts) > 0:
            # Assume last part might be house number if it contains digits
            if any(c.isdigit() for c in parts[-1]):
                components['house_number'] = parts[-1]
                components['street'] = ' '.join(parts[:-1])
            else:
                components['street'] = address_string
                components['house_number'] = ""
        
        return components
    
    def update_user(self, user_id: int, user_update: UserUpdate) -> User:
        """Update an existing user"""
        user = self.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = user_update.dict(exclude_unset=True)
        
        # Handle password update
        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(update_data.pop("password"))

        # Update home location if address provided (prioritize address over coordinates)
        if "home_address" in update_data and update_data["home_address"]:
            coords = geocoding_service.get_coordinates(update_data["home_address"])
            if coords:
                user.home_location = f"POINT({coords[1]} {coords[0]})"
        elif "latitude" in update_data and "longitude" in update_data and update_data["latitude"] and update_data["longitude"]:
            user.home_location = f"POINT({update_data.pop('longitude')} {update_data.pop('latitude')})"

        # Update work location if address provided (prioritize address over coordinates)
        if "work_address" in update_data and update_data["work_address"]:
            coords = geocoding_service.get_coordinates(update_data["work_address"])
            if coords:
                user.work_location = f"POINT({coords[1]} {coords[0]})"
        elif "work_latitude" in update_data and "work_longitude" in update_data and update_data["work_latitude"] and update_data["work_longitude"]:
            user.work_location = f"POINT({update_data.pop('work_longitude')} {update_data.pop('work_latitude')})"

        # Update remaining fields
        for key, value in update_data.items():
            if key not in ['work_latitude', 'work_longitude', 'latitude', 'longitude']:
                setattr(user, key, value)
                
        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating user: {str(e)}")
            raise
    
    def deactivate_user(self, user_id: int) -> bool:
        """Deactivate a user (soft delete)"""
        user = self.get_user(user_id)
        if not user:
            return False
        
        try:
            user.is_active = False
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deactivating user: {str(e)}")
            return False
    
    def delete_user(self, user_id: int) -> None:
        """Delete a user permanently"""
        user = self.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        try:
            # First delete any EnterpriseUser records
            enterprise_user = self.db.query(EnterpriseUser).filter(EnterpriseUser.user_id == user_id).first()
            if enterprise_user:
                self.db.delete(enterprise_user)
                self.db.commit()
            
            # Then delete the user
            self.db.delete(user)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting user: {str(e)}")
            raise
    
    def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user by email and password."""
        user = self.get_by_email(email=email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

# For backwards compatibility with existing code
def get_user_by_id(db: Session, user_id: int) -> User | None:
    """
    Get a complete user record by ID.
    
    Args:
        db: Database session
        user_id: The numeric user ID
        
    Returns:
        Complete User object or None if not found
    """
    # Explicitly select all fields to ensure nothing is missing
    user = db.query(User).filter(User.id == user_id).first()
    
    if user:
        # Ensure user_id is set
        if not user.user_id:
            user.user_id = f"UID-{uuid.uuid4().hex[:8].upper()}"
            db.commit()
            
        # Ensure created_at is set
        if not user.created_at:
            user.created_at = datetime.utcnow()
            db.commit()
            
        # If needed, you can add any additional data relations here
        # For example, if you want to eager load enterprise information:
        enterprise_user = db.query(EnterpriseUser).filter(EnterpriseUser.user_id == user.id).first()
        if enterprise_user:
            user.enterprise_data = enterprise_user
        return user
    return None

def get_user_by_user_id(db: Session, user_id: str) -> User | None:
    """
    Get a complete user record by string user_id.
    
    Args:
        db: Database session
        user_id: The string user ID (UID-XXXXXXXX format)
        
    Returns:
        Complete User object or None if not found
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if user:
        # Ensure created_at is set
        if not user.created_at:
            user.created_at = datetime.utcnow()
            db.commit()
            
        # If needed, you can add any additional data relations here
        enterprise_user = db.query(EnterpriseUser).filter(EnterpriseUser.user_id == user.id).first()
        if enterprise_user:
            user.enterprise_data = enterprise_user
        return user
    return None

def get_user_by_email(db: Session, email: str) -> User | None:
    """Get a user by email"""
    service = UserService(db)
    return service.get_by_email(email)

def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Get all users with pagination"""
    try:
        users = db.query(User).offset(skip).limit(limit).all()
        
        # Ensure all users have user_id and created_at set
        for user in users:
            if not user.user_id:
                user.user_id = f"UID-{uuid.uuid4().hex[:8].upper()}"
                
            if not user.created_at:
                user.created_at = datetime.utcnow()
        
        # If any changes were made, commit them
        db.commit()
        
        return users
    except Exception as e:
        logger.error(f"Error getting all users: {str(e)}")
        return []

def create_user(db: Session, user: UserCreate | dict, user_id=None, home_location=None, work_location=None) -> User:
    """
    Create a new user with optional predefined user_id and location data.
    
    Args:
        db: Database session
        user: User creation data from schema (UserCreate model or dictionary)
        user_id: Optional pre-generated user ID string
        home_location: Optional POINT string for home coordinates
        work_location: Optional POINT string for work coordinates
    """
    try:
        # If user_id is not provided, generate one
        if not user_id:
            user_id = f"UID-{uuid.uuid4().hex[:8].upper()}"
            
        service = UserService(db)
        return service.create_user(user, user_id, home_location, work_location)
    except Exception as e:
        logger.error(f"Error in create_user function: {str(e)}")
        raise

def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
    """Update an existing user"""
    service = UserService(db)
    return service.update_user(user_id, user_update)

def deactivate_user(db: Session, user_id: int) -> bool:
    """Deactivate a user (soft delete)"""
    service = UserService(db)
    return service.deactivate_user(user_id)
