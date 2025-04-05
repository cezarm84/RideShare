from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging

from app.db.session import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.models.user import User, EnterpriseUser
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.user_service import (
    create_user,
    get_user_by_id,
    get_user_by_email,
    update_user,
    get_all_users
)
from app.core.geocoding import geocoding_service
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

def generate_unique_user_id():
    """Generate a unique user ID in the format UID-XXXXXXXX"""
    return f"UID-{uuid.uuid4().hex[:8].upper()}"

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_new_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user with automatic geocoding for addresses.
    """
    try:
        # Check if user already exists
        existing_user = get_user_by_email(db, user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Generate a user_id in the format UID-XXXXXXXX
        user_id = generate_unique_user_id()
        
        # Update the user_data or create a new object with the user_id
        user_data_dict = user_data.dict(exclude_unset=True)
        user_data_dict["user_id"] = user_id
        
        # Handle home address coordinates
        home_location = None
        
        # If explicit coordinates are provided, use them
        if hasattr(user_data, 'latitude') and hasattr(user_data, 'longitude') and user_data.latitude is not None and user_data.longitude is not None:
            home_location = f"POINT({user_data.longitude} {user_data.latitude})"
        # Otherwise try to geocode the address
        elif hasattr(user_data, 'home_address') and user_data.home_address:
            coords = geocoding_service.get_coordinates(user_data.home_address)
            if coords:
                # Coordinates come back as (lat, lng)
                home_location = f"POINT({coords[1]} {coords[0]})"
        # If neither, try to build an address from components and geocode it
        elif hasattr(user_data, 'home_street') and hasattr(user_data, 'home_city') and all([user_data.home_street, user_data.home_city]):
            address = f"{user_data.home_street} {user_data.home_house_number or ''}, {user_data.home_post_code or ''} {user_data.home_city}"
            coords = geocoding_service.get_coordinates(address)
            if coords:
                home_location = f"POINT({coords[1]} {coords[0]})"
                # Also store the full address
                user_data_dict["home_address"] = address
        
        if home_location:
            user_data_dict["home_location"] = home_location
        
        # Repeat for work address
        work_location = None
        
        # If explicit coordinates are provided, use them
        if hasattr(user_data, 'work_latitude') and hasattr(user_data, 'work_longitude') and user_data.work_latitude is not None and user_data.work_longitude is not None:
            work_location = f"POINT({user_data.work_longitude} {user_data.work_latitude})"
        # Otherwise try to geocode the address
        elif hasattr(user_data, 'work_address') and user_data.work_address:
            coords = geocoding_service.get_coordinates(user_data.work_address)
            if coords:
                work_location = f"POINT({coords[1]} {coords[0]})"
        # If neither, try to build an address from components and geocode it
        elif hasattr(user_data, 'work_street') and hasattr(user_data, 'work_city') and all([user_data.work_street, user_data.work_city]):
            address = f"{user_data.work_street} {user_data.work_house_number or ''}, {user_data.work_post_code or ''} {user_data.work_city}"
            coords = geocoding_service.get_coordinates(address)
            if coords:
                work_location = f"POINT({coords[1]} {coords[0]})"
                # Also store the full address
                user_data_dict["work_address"] = address
        
        if work_location:
            user_data_dict["work_location"] = work_location
        
        # Clean up fields that don't belong in the User model
        # but might be in user_data_dict from the request
        fields_to_remove = [
            "latitude", "longitude", "work_latitude", "work_longitude",
            "home_street", "home_house_number", "home_post_code", "home_city",
            "work_street", "work_house_number", "work_post_code", "work_city",
            "enterprise_id", "employee_id"
        ]
        
        for field in fields_to_remove:
            if field in user_data_dict:
                user_data_dict.pop(field)
        
        # Create the user with the updated data
        user = create_user(db, user_data_dict)
        
        # If this is an enterprise user, create the enterprise association
        if hasattr(user_data, 'user_type') and hasattr(user_data, 'enterprise_id') and hasattr(user_data, 'employee_id') and \
           user_data.user_type == "enterprise" and user_data.enterprise_id and user_data.employee_id:
            enterprise_user = EnterpriseUser(
                user_id=user.id,
                enterprise_id=user_data.enterprise_id,
                employee_id=user_data.employee_id
            )
            db.add(enterprise_user)
            db.commit()
        
        return user
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get information about the current authenticated user.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update information for the current user.
    """
    return update_user(db, current_user.id, user_data)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID.
    Regular users can only retrieve their own information.
    Admin users can retrieve any user.
    """
    # If not admin and not the requested user
    if current_user.user_type != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all users. Admin only.
    """
    return get_all_users(db, skip, limit)

@router.get("/by-user-id/{user_id_string}", response_model=UserResponse)
def get_user_by_string_id(
    user_id_string: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a user by their string user_id (e.g., UID-XXXXXXXX).
    Regular users can only retrieve their own information.
    Admin users can retrieve any user.
    """
    # Find the user by string user_id
    user = db.query(User).filter(User.user_id == user_id_string).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # If not admin and not the requested user
    if current_user.user_type != "admin" and current_user.id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return user
