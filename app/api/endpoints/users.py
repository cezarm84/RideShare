from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
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
from app.core.geocoding import geocode_address
import uuid

router = APIRouter()
logger = logging.getLogger(__name__)

# Helper function to get user name attribute
def get_user_name_field(user):
    """
    Determine which field in the User model contains the name.
    """
    # Try these fields in order
    for field in ["username", "full_name", "name", "fullname", "display_name"]:
        if hasattr(user, field):
            return field
    return None  # No matching field found

# Helper function to split a full name into first and last name
def split_full_name(full_name):
    """Split a full name into first and last name components."""
    if not full_name:
        return "", ""

    parts = full_name.split(maxsplit=1)
    if len(parts) == 1:
        return parts[0], ""  # Only first name
    return parts[0], parts[1]  # First name and last name

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

        try:
            # If explicit coordinates are provided, use them
            if hasattr(user_data, 'latitude') and hasattr(user_data, 'longitude') and user_data.latitude is not None and user_data.longitude is not None:
                home_location = f"POINT({user_data.longitude} {user_data.latitude})"
            # Otherwise try to geocode the address
            elif hasattr(user_data, 'home_address') and user_data.home_address:
                # Directly await the coroutine since we're already in an async context
                lat, lon = await geocode_address(user_data.home_address)
                if lat and lon:
                    home_location = f"POINT({lon} {lat})"
                else:
                    logger.warning(f"Using default coordinates for home address: {user_data.home_address}")
            # If neither, try to build an address from components and geocode it
            elif hasattr(user_data, 'home_street') and hasattr(user_data, 'home_city') and all([user_data.home_street, user_data.home_city]):
                address = f"{user_data.home_street} {user_data.home_house_number or ''}, {user_data.home_post_code or ''} {user_data.home_city}"
                # Directly await the coroutine since we're already in an async context
                lat, lon = await geocode_address(address)
                if lat and lon:
                    home_location = f"POINT({lon} {lat})"
                    # Also store the full address
                    user_data_dict["home_address"] = address
                else:
                    user_data_dict["home_address"] = address
                    logger.warning(f"Using default coordinates for constructed home address: {address}")
        except Exception as e:
            logger.warning(f"Error geocoding home address: {str(e)}")

        if home_location:
            user_data_dict["home_location"] = home_location

        # Repeat for work address
        work_location = None

        try:
            # If explicit coordinates are provided, use them
            if hasattr(user_data, 'work_latitude') and hasattr(user_data, 'work_longitude') and user_data.work_latitude is not None and user_data.work_longitude is not None:
                work_location = f"POINT({user_data.work_longitude} {user_data.work_latitude})"
            # Otherwise try to geocode the address
            elif hasattr(user_data, 'work_address') and user_data.work_address:
                # Directly await the coroutine since we're already in an async context
                lat, lon = await geocode_address(user_data.work_address)
                if lat and lon:
                    work_location = f"POINT({lon} {lat})"
                else:
                    logger.warning(f"Using default coordinates for work address: {user_data.work_address}")
            # If neither, try to build an address from components and geocode it
            elif hasattr(user_data, 'work_street') and hasattr(user_data, 'work_city') and all([user_data.work_street, user_data.work_city]):
                address = f"{user_data.work_street} {user_data.work_house_number or ''}, {user_data.work_post_code or ''} {user_data.work_city}"
                # Directly await the coroutine since we're already in an async context
                lat, lon = await geocode_address(address)
                if lat and lon:
                    work_location = f"POINT({lon} {lat})"
                    # Also store the full address
                    user_data_dict["work_address"] = address
                else:
                    user_data_dict["work_address"] = address
                    logger.warning(f"Using default coordinates for constructed work address: {address}")
        except Exception as e:
            logger.warning(f"Error geocoding work address: {str(e)}")

        if work_location:
            user_data_dict["work_location"] = work_location

        # Ensure first_name and last_name are properly set
        if hasattr(user_data, 'first_name') and user_data.first_name:
            user_data_dict["first_name"] = user_data.first_name
        if hasattr(user_data, 'last_name') and user_data.last_name:
            user_data_dict["last_name"] = user_data.last_name

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

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )

        # If this is an enterprise user, create the enterprise association
        try:
            if hasattr(user_data, 'user_type') and hasattr(user_data, 'enterprise_id') and hasattr(user_data, 'employee_id') and \
               user_data.user_type == "enterprise" and user_data.enterprise_id and user_data.employee_id:
                enterprise_user = EnterpriseUser(
                    user_id=user.id,
                    enterprise_id=user_data.enterprise_id,
                    employee_id=user_data.employee_id
                )
                db.add(enterprise_user)
                db.commit()
        except Exception as e:
            logger.warning(f"Error creating enterprise association: {str(e)}")
            # Continue without enterprise association

        # Log all user attributes for debugging
        logger.debug(f"User model attributes: {dir(user)}")

        # Get first and last name directly from the user model
        first_name = user.first_name if hasattr(user, "first_name") else "Unknown"
        last_name = user.last_name if hasattr(user, "last_name") else ""

        # Construct full name from first and last name
        if first_name and last_name:
            full_name = f"{first_name} {last_name}"
        elif first_name:
            full_name = first_name
        else:
            full_name = "Unknown"

        # Convert the user model to a dictionary that matches the UserResponse model
        # This prevents ResponseValidationError: value is not a valid dict
        response_data = {
            "id": user.id,
            "user_id": user.user_id,
            "email": user.email,
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "phone_number": user.phone_number,
            "user_type": user.user_type,
            "is_active": user.is_active,
            "created_at": user.created_at if hasattr(user, "created_at") else None,
            "updated_at": user.updated_at if hasattr(user, "updated_at") else None,
        }

        # Log the response data for debugging
        logger.debug(f"User response data: {response_data}")

        # Add optional fields if they exist
        optional_fields = [
            "home_address", "work_address", "home_location", "work_location",
            "profile_picture", "preferences", "last_login"
        ]

        for field in optional_fields:
            if hasattr(user, field):
                response_data[field] = getattr(user, field)

        return response_data

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except ValueError as e:
        # Handle validation errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while creating the user"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get complete profile information about the current authenticated user.

    This endpoint returns detailed profile information about the current user,
    including personal details, preferences, and profile settings. For basic
    authentication information, use the /api/v1/auth/me endpoint instead.

    Returns:
        UserResponse: Complete profile information about the current user
    """
    try:
        # Get first and last name directly from the user model
        first_name = current_user.first_name if hasattr(current_user, "first_name") else "Unknown"
        last_name = current_user.last_name if hasattr(current_user, "last_name") else ""

        # Construct full name from first and last name
        if first_name and last_name:
            full_name = f"{first_name} {last_name}"
        elif first_name:
            full_name = first_name
        else:
            full_name = "Unknown"

        # Log the user data for debugging (only in development)
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Current user data: first_name={first_name}, last_name={last_name}, full_name={full_name}")
            logger.debug(f"Current user type: {type(current_user).__name__}")

        # Import datetime for default created_at value
        from datetime import datetime, timezone
        from app.models.user import UserRole

        # Create a base response with required fields
        response_data = {
            "id": current_user.id,
            "user_id": getattr(current_user, "user_id", f"UID-{str(current_user.id)}"),
            "email": current_user.email,
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "phone_number": getattr(current_user, "phone_number", ""),  # Default to empty string
            "user_type": getattr(current_user, "user_type", "user"),  # Default user type
            "role": getattr(current_user, "role", UserRole.USER),  # Include role information
            "is_active": getattr(current_user, "is_active", True),
            "created_at": getattr(current_user, "created_at", datetime.now(timezone.utc)),  # Default to current time
            "updated_at": getattr(current_user, "updated_at", None),
        }

        # Add optional fields if they exist
        optional_fields = [
            "home_address", "work_address", "home_location", "work_location",
            "profile_picture", "preferences", "last_login", "bio", "company",
            "position", "department", "employee_id", "enterprise_id"
        ]

        for field in optional_fields:
            if hasattr(current_user, field) and getattr(current_user, field) is not None:
                response_data[field] = getattr(current_user, field)

        return response_data
    except Exception as e:
        logger.error(f"Error retrieving user profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the user profile"
        )

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update information for the current user.
    """
    updated_user = update_user(db, current_user.id, user_data)

    # Get first and last name directly from the user model
    first_name = updated_user.first_name if hasattr(updated_user, "first_name") else "Unknown"
    last_name = updated_user.last_name if hasattr(updated_user, "last_name") else ""

    # Construct full name from first and last name
    if first_name and last_name:
        full_name = f"{first_name} {last_name}"
    elif first_name:
        full_name = first_name
    else:
        full_name = "Unknown"

    # Log the updated user data for debugging
    logger.debug(f"Updated user data: first_name={first_name}, last_name={last_name}, full_name={full_name}")

    # Convert the user model to a response that handles the name/full_name difference
    response_data = {
        "id": updated_user.id,
        "user_id": updated_user.user_id,
        "email": updated_user.email,
        "full_name": full_name,
        "first_name": first_name,
        "last_name": last_name,
        "phone_number": updated_user.phone_number,
        "user_type": updated_user.user_type,
        "is_active": updated_user.is_active,
        "created_at": updated_user.created_at if hasattr(updated_user, "created_at") else None,
        "updated_at": updated_user.updated_at if hasattr(updated_user, "updated_at") else None,
    }

    # Add optional fields if they exist
    optional_fields = [
        "home_address", "work_address", "home_location", "work_location",
        "profile_picture", "preferences", "last_login"
    ]

    for field in optional_fields:
        if hasattr(updated_user, field):
            response_data[field] = getattr(updated_user, field)

    return response_data

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

    # Get first and last name directly from the user model
    first_name = user.first_name if hasattr(user, "first_name") else "Unknown"
    last_name = user.last_name if hasattr(user, "last_name") else ""

    # Construct full name from first and last name
    if first_name and last_name:
        full_name = f"{first_name} {last_name}"
    elif first_name:
        full_name = first_name
    else:
        full_name = "Unknown"

    # Log the user data for debugging
    logger.debug(f"User data: first_name={first_name}, last_name={last_name}, full_name={full_name}")

    # Convert the user model to a response that handles the name/full_name difference
    response_data = {
        "id": user.id,
        "user_id": user.user_id,
        "email": user.email,
        "full_name": full_name,
        "first_name": first_name,
        "last_name": last_name,
        "phone_number": user.phone_number,
        "user_type": user.user_type,
        "is_active": user.is_active,
        "created_at": user.created_at if hasattr(user, "created_at") else None,
        "updated_at": user.updated_at if hasattr(user, "updated_at") else None,
    }

    # Add optional fields if they exist
    optional_fields = [
        "home_address", "work_address", "home_location", "work_location",
        "profile_picture", "preferences", "last_login"
    ]

    for field in optional_fields:
        if hasattr(user, field):
            response_data[field] = getattr(user, field)

    return response_data

@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    _: User = Depends(get_current_admin_user),  # Ensure only admins can access this endpoint
    db: Session = Depends(get_db)
):
    """
    Get all users. Admin only.
    """
    users = get_all_users(db, skip, limit)

    # Convert the user models to responses that handle the name/full_name difference
    response_data = []
    for user in users:
        # Get first and last name directly from the user model
        first_name = user.first_name if hasattr(user, "first_name") else "Unknown"
        last_name = user.last_name if hasattr(user, "last_name") else ""

        # Construct full name from first and last name
        if first_name and last_name:
            full_name = f"{first_name} {last_name}"
        elif first_name:
            full_name = first_name
        else:
            full_name = "Unknown"

        user_dict = {
            "id": user.id,
            "user_id": user.user_id,
            "email": user.email,
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "phone_number": user.phone_number,
            "user_type": user.user_type,
            "is_active": user.is_active,
            "created_at": user.created_at if hasattr(user, "created_at") else None,
            "updated_at": user.updated_at if hasattr(user, "updated_at") else None,
        }

        # Add optional fields if they exist
        optional_fields = [
            "home_address", "work_address", "home_location", "work_location",
            "profile_picture", "preferences", "last_login"
        ]

        for field in optional_fields:
            if hasattr(user, field):
                user_dict[field] = getattr(user, field)

        response_data.append(user_dict)

    return response_data

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

    # Get first and last name directly from the user model
    first_name = user.first_name if hasattr(user, "first_name") else "Unknown"
    last_name = user.last_name if hasattr(user, "last_name") else ""

    # Construct full name from first and last name
    if first_name and last_name:
        full_name = f"{first_name} {last_name}"
    elif first_name:
        full_name = first_name
    else:
        full_name = "Unknown"

    # Log the user data for debugging
    logger.debug(f"User data by string ID: first_name={first_name}, last_name={last_name}, full_name={full_name}")

    # Convert the user model to a response that handles the name/full_name difference
    response_data = {
        "id": user.id,
        "user_id": user.user_id,
        "email": user.email,
        "full_name": full_name,
        "first_name": first_name,
        "last_name": last_name,
        "phone_number": user.phone_number,
        "user_type": user.user_type,
        "is_active": user.is_active,
        "created_at": user.created_at if hasattr(user, "created_at") else None,
        "updated_at": user.updated_at if hasattr(user, "updated_at") else None,
    }

    # Add optional fields if they exist
    optional_fields = [
        "home_address", "work_address", "home_location", "work_location",
        "profile_picture", "preferences", "last_login"
    ]

    for field in optional_fields:
        if hasattr(user, field):
            response_data[field] = getattr(user, field)

    return response_data
