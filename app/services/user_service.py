import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.geocoding import geocode_address
from app.core.security import get_password_hash, verify_password
from app.models.user import EnterpriseUser, User
from app.schemas.user import UserCreate, UserUpdate

logger = logging.getLogger(__name__)


# Helper function to safely get coordinates from an address
async def get_coordinates_safely(address: str) -> tuple:
    """
    Safely get coordinates for an address using the async geocode_address function.
    This function is designed to be used within a FastAPI async endpoint.
    """
    try:
        # Directly await the coroutine since we're already in an async context
        lat, lon = await geocode_address(address)
        if lat and lon:
            logger.info(
                f"Successfully geocoded address: {address} to coordinates: {lat}, {lon}"
            )
            return lat, lon
        else:
            logger.warning(f"Geocoding returned null coordinates for: {address}")
            # Return default coordinates
            return 59.3293, 18.0686  # Default coordinates
    except Exception as e:
        logger.error(f"Error during geocoding: {str(e)}")
        # Return default coordinates
        return 59.3293, 18.0686  # Default coordinates


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
                user.created_at = datetime.now(timezone.utc)
                self.db.commit()

            # Load any related enterprise data if applicable
            enterprise_user = (
                self.db.query(EnterpriseUser)
                .filter(EnterpriseUser.user_id == user.id)
                .first()
            )
            if enterprise_user:
                user.enterprise_data = enterprise_user
        return user

    def get_by_user_id(self, user_id: str) -> Optional[User]:
        """Get user by user_id string."""
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if user:
            # Ensure created_at is set
            if not user.created_at:
                user.created_at = datetime.now(timezone.utc)
                self.db.commit()

            # Load any related enterprise data if applicable
            enterprise_user = (
                self.db.query(EnterpriseUser)
                .filter(EnterpriseUser.user_id == user.id)
                .first()
            )
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
                user.created_at = datetime.now(timezone.utc)
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
                user.created_at = datetime.now(timezone.utc)

        # If any changes were made, commit them
        self.db.commit()

        return users

    def create_user(self, user_in: UserCreate, user_id=None) -> User:
        """
        Create a new user with automatic geocoding for addresses.

        Args:
            user_in: User creation data from schema (UserCreate or dict)
            user_id: Optional pre-generated user ID string
            home_location: Optional POINT string for home coordinates (deprecated)
            work_location: Optional POINT string for work coordinates (deprecated)
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
            current_time = datetime.now(timezone.utc)

            # Extract latitude and longitude from addresses if needed
            latitude = getattr(user_in, "latitude", None)
            longitude = getattr(user_in, "longitude", None)

            # Use geocoding service to get coordinates for home address
            if user_in.home_address and not latitude and not longitude:
                from app.services.opencage_geocoding import get_coordinates_sync

                coords = get_coordinates_sync(user_in.home_address)
                if coords:
                    latitude, longitude = coords
                    logger.info(
                        f"Successfully geocoded home address: {user_in.home_address} to coordinates: {latitude}, {longitude}"
                    )
                else:
                    # Set default coordinates if geocoding fails
                    latitude = 59.3293
                    longitude = 18.0686
                    logger.info(
                        f"Using default coordinates for home address: {latitude}, {longitude}"
                    )

            # Extract work latitude and longitude if needed
            work_latitude = getattr(user_in, "work_latitude", None)
            work_longitude = getattr(user_in, "work_longitude", None)

            # Use geocoding service to get coordinates for work address
            if user_in.work_address and not work_latitude and not work_longitude:
                from app.services.opencage_geocoding import get_coordinates_sync

                coords = get_coordinates_sync(user_in.work_address)
                if coords:
                    work_latitude, work_longitude = coords
                    logger.info(
                        f"Successfully geocoded work address: {user_in.work_address} to coordinates: {work_latitude}, {work_longitude}"
                    )
                else:
                    # Set default coordinates if geocoding fails
                    work_latitude = 59.3293
                    work_longitude = 18.0686
                    logger.info(
                        f"Using default coordinates for work address: {work_latitude}, {work_longitude}"
                    )

            # Parse address components if needed in the future
            # Currently not used, but keeping the method for future use

            # Create user data dictionary
            user_data = {
                "user_id": unique_user_id,
                "email": user_in.email,
                "password_hash": get_password_hash(user_in.password),
                "first_name": user_in.first_name,
                "last_name": user_in.last_name,
                "phone_number": user_in.phone_number,
                "user_type": user_in.user_type,
                "home_address": user_in.home_address,
                "work_address": user_in.work_address,
                "created_at": current_time,
            }

            # Always add coordinates - either real or default
            user_data["latitude"] = latitude
            user_data["longitude"] = longitude

            if work_latitude and work_longitude:
                user_data["work_latitude"] = work_latitude
                user_data["work_longitude"] = work_longitude

            # Create the user first
            db_user = User(**user_data)
            self.db.add(db_user)
            self.db.flush()  # Get ID without committing transaction

            # Add enterprise user if needed
            if user_in.user_type == "enterprise" and user_in.enterprise_id:
                enterprise_user = EnterpriseUser(
                    user_id=db_user.id,
                    enterprise_id=user_in.enterprise_id,
                    employee_id=user_in.employee_id,
                )
                self.db.add(enterprise_user)

            # Commit everything at once
            self.db.commit()
            self.db.refresh(db_user)
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
                components["house_number"] = parts[-1]
                components["street"] = " ".join(parts[:-1])
            else:
                components["street"] = address_string
                components["house_number"] = ""

        return components

    def update_user(self, user_id: int, user_update: UserUpdate) -> User:
        """Update an existing user"""
        user = self.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = user_update.dict(exclude_unset=True)

        # Handle password update
        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(
                update_data.pop("password")
            )

        # Use geocoding service to get coordinates for home address
        if "home_address" in update_data and update_data["home_address"]:
            from app.services.opencage_geocoding import get_coordinates_sync

            coords = get_coordinates_sync(update_data["home_address"])
            if coords:
                update_data["latitude"], update_data["longitude"] = coords
                logger.info(
                    f"Successfully geocoded updated home address: {update_data['home_address']} to coordinates: {update_data['latitude']}, {update_data['longitude']}"
                )
            else:
                # Set default coordinates if geocoding fails
                update_data["latitude"] = 59.3293
                update_data["longitude"] = 18.0686
                logger.info(
                    f"Using default coordinates for updated home address: {update_data['latitude']}, {update_data['longitude']}"
                )

        # Update work coordinates if work address provided
        if "work_address" in update_data and update_data["work_address"]:
            from app.services.opencage_geocoding import get_coordinates_sync

            coords = get_coordinates_sync(update_data["work_address"])
            if coords:
                update_data["work_latitude"], update_data["work_longitude"] = coords
                logger.info(
                    f"Successfully geocoded updated work address: {update_data['work_address']} to coordinates: {update_data['work_latitude']}, {update_data['work_longitude']}"
                )
            else:
                # Set default coordinates if geocoding fails
                update_data["work_latitude"] = 59.3293
                update_data["work_longitude"] = 18.0686
                logger.info(
                    f"Using default coordinates for updated work address: {update_data['work_latitude']}, {update_data['work_longitude']}"
                )

        # Remove any attempt to update full_name as it's not in the model

        # Update remaining fields
        for key, value in update_data.items():
            if key not in ["work_latitude", "work_longitude", "latitude", "longitude"]:
                setattr(user, key, value)

        try:
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating user: {str(e)}")
            raise

    async def update_user_async(self, user_id: int, user_update: UserUpdate) -> User:
        """Async version of update_user that properly handles geocoding"""
        user = self.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = user_update.dict(exclude_unset=True)

        # Handle password update
        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(
                update_data.pop("password")
            )

        # Update latitude/longitude if home address provided
        if "home_address" in update_data and update_data["home_address"]:
            try:
                # Properly await the geocoding function
                latitude, longitude = await get_coordinates_safely(
                    update_data["home_address"]
                )
                update_data["latitude"] = latitude
                update_data["longitude"] = longitude
                logger.info(
                    f"Successfully geocoded updated home address to: {latitude}, {longitude}"
                )
            except Exception as e:
                logger.error(f"Error during home address update geocoding: {str(e)}")
                # Use default coordinates if geocoding fails
                update_data["latitude"] = 59.3293
                update_data["longitude"] = 18.0686

        # Update work coordinates if work address provided
        if "work_address" in update_data and update_data["work_address"]:
            try:
                # Properly await the geocoding function
                work_latitude, work_longitude = await get_coordinates_safely(
                    update_data["work_address"]
                )
                update_data["work_latitude"] = work_latitude
                update_data["work_longitude"] = work_longitude
                logger.info(
                    f"Successfully geocoded updated work address to: {work_latitude}, {work_longitude}"
                )
            except Exception as e:
                logger.error(f"Error during work address update geocoding: {str(e)}")
                # Use default coordinates if geocoding fails
                update_data["work_latitude"] = 59.3293
                update_data["work_longitude"] = 18.0686

        # Remove any attempt to update full_name as it's not in the model

        # Update remaining fields
        for key, value in update_data.items():
            if key not in ["work_latitude", "work_longitude", "latitude", "longitude"]:
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
            enterprise_user = (
                self.db.query(EnterpriseUser)
                .filter(EnterpriseUser.user_id == user_id)
                .first()
            )
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

    async def create_user_async(self, user_in: UserCreate, user_id=None) -> User:
        """
        Async version of create_user that properly handles geocoding.
        Use this from async FastAPI endpoints.

        Args:
            user_in: User creation data from schema (UserCreate or dict)
            user_id: Optional pre-generated user ID string
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
            current_time = datetime.now(timezone.utc)

            # Extract latitude and longitude from addresses if needed
            latitude = getattr(user_in, "latitude", None)
            longitude = getattr(user_in, "longitude", None)

            # If home address is provided but no coordinates, geocode it
            if user_in.home_address and not latitude and not longitude:
                try:
                    # Properly await the geocoding function
                    latitude, longitude = await get_coordinates_safely(
                        user_in.home_address
                    )
                    # Create POINT string for home_location
                    home_location = f"POINT({longitude} {latitude})"
                    logger.info(
                        f"Successfully geocoded home address to: {latitude}, {longitude}"
                    )
                except Exception as e:
                    logger.error(f"Error during home address geocoding: {str(e)}")
                    # Use default coordinates if geocoding fails
                    latitude = 59.3293
                    longitude = 18.0686
                    home_location = None

            # Extract work latitude and longitude if needed
            work_latitude = getattr(user_in, "work_latitude", None)
            work_longitude = getattr(user_in, "work_longitude", None)

            if user_in.work_address and not work_latitude and not work_longitude:
                try:
                    # Properly await the geocoding function
                    work_latitude, work_longitude = await get_coordinates_safely(
                        user_in.work_address
                    )
                    # Create POINT string for work_location
                    work_location = f"POINT({work_longitude} {work_latitude})"
                    logger.info(
                        f"Successfully geocoded work address to: {work_latitude}, {work_longitude}"
                    )
                except Exception as e:
                    logger.error(f"Error during work address geocoding: {str(e)}")
                    # Use default coordinates if geocoding fails
                    work_latitude = 59.3293
                    work_longitude = 18.0686
                    work_location = None

            # Parse address components if needed in the future
            # Currently not used, but keeping the method for future use

            # Create user data dictionary
            user_data = {
                "user_id": unique_user_id,
                "email": user_in.email,
                "password_hash": get_password_hash(user_in.password),
                "first_name": user_in.first_name,
                "last_name": user_in.last_name,
                "phone_number": user_in.phone_number,
                "user_type": user_in.user_type,
                "home_address": user_in.home_address,
                "work_address": user_in.work_address,
                "created_at": current_time,
            }

            # Always add coordinates - either real or default
            user_data["latitude"] = latitude
            user_data["longitude"] = longitude

            # Add home_location if available
            if "home_location" in locals() and home_location:
                user_data["home_location"] = home_location

            if work_latitude and work_longitude:
                user_data["work_latitude"] = work_latitude
                user_data["work_longitude"] = work_longitude

            # Add work_location if available
            if "work_location" in locals() and work_location:
                user_data["work_location"] = work_location

            # Create the user first
            db_user = User(**user_data)
            self.db.add(db_user)
            self.db.flush()  # Get ID without committing transaction

            # Add enterprise user if needed
            if user_in.user_type == "enterprise" and user_in.enterprise_id:
                enterprise_user = EnterpriseUser(
                    user_id=db_user.id,
                    enterprise_id=user_in.enterprise_id,
                    employee_id=user_in.employee_id,
                )
                self.db.add(enterprise_user)

            # Commit everything at once
            self.db.commit()
            self.db.refresh(db_user)
            return db_user

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating user: {str(e)}")
            raise


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
            user.created_at = datetime.now(timezone.utc)
            db.commit()

        # If needed, you can add any additional data relations here
        # For example, if you want to eager load enterprise information:
        enterprise_user = (
            db.query(EnterpriseUser).filter(EnterpriseUser.user_id == user.id).first()
        )
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
            user.created_at = datetime.now(timezone.utc)
            db.commit()

        # If needed, you can add any additional data relations here
        enterprise_user = (
            db.query(EnterpriseUser).filter(EnterpriseUser.user_id == user.id).first()
        )
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
                user.created_at = datetime.now(timezone.utc)

        # If any changes were made, commit them
        db.commit()

        return users
    except Exception as e:
        logger.error(f"Error getting all users: {str(e)}")
        return []


def create_user(
    db: Session,
    user: UserCreate | dict,
    user_id=None,
    home_location=None,
    work_location=None,
) -> User:
    """
    Create a new user with optional predefined user_id and location data.

    Args:
        db: Database session
        user: User creation data from schema (UserCreate model or dictionary)
        user_id: Optional pre-generated user ID string
        home_location: Optional POINT string for home coordinates (deprecated)
        work_location: Optional POINT string for work coordinates (deprecated)

    Returns:
        User object with all fields populated
    """
    try:
        # If user_id is not provided, generate one
        if not user_id:
            user_id = f"UID-{uuid.uuid4().hex[:8].upper()}"

        # Log the user data being processed
        logger.debug(f"Processing user data for creation: {user}")

        service = UserService(db)
        db_user = service.create_user(user, user_id, home_location, work_location)

        # Ensure we have a valid user object to return
        if db_user is None:
            logger.error("User creation returned None")
            raise ValueError("Failed to create user")

        # Log successful user creation
        logger.info(
            f"User created successfully: ID={db_user.id}, user_id={db_user.user_id}, name={db_user.first_name} {db_user.last_name}"
        )

        return db_user
    except Exception as e:
        logger.error(f"Error in create_user function: {str(e)}")
        # Re-raise the exception to be handled by the API layer
        raise


async def create_user_async(db: Session, user: UserCreate | dict, user_id=None) -> User:
    """
    Async version of create_user that properly handles geocoding.

    Args:
        db: Database session
        user: User creation data from schema (UserCreate model or dictionary)
        user_id: Optional pre-generated user ID string

    Returns:
        User object with all fields populated
    """
    try:
        # If user_id is not provided, generate one
        if not user_id:
            user_id = f"UID-{uuid.uuid4().hex[:8].upper()}"

        # Log the user data being processed
        logger.debug(f"Processing user data for async creation: {user}")

        service = UserService(db)
        db_user = await service.create_user_async(user, user_id)

        # Ensure we have a valid user object to return
        if db_user is None:
            logger.error("User creation returned None")
            raise ValueError("Failed to create user")

        # Log successful user creation
        logger.info(
            f"User created successfully (async): ID={db_user.id}, user_id={db_user.user_id}, name={db_user.first_name} {db_user.last_name}"
        )

        return db_user
    except Exception as e:
        logger.error(f"Error in create_user_async function: {str(e)}")
        # Re-raise the exception to be handled by the API layer
        raise


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> User:
    """Update an existing user"""
    try:
        logger.debug(f"Updating user {user_id} with data: {user_update}")

        service = UserService(db)
        updated_user = service.update_user(user_id, user_update)

        # Log successful update
        logger.info(
            f"User updated successfully: ID={updated_user.id}, name={updated_user.first_name} {updated_user.last_name}"
        )

        return updated_user
    except Exception as e:
        logger.error(f"Error in update_user function: {str(e)}")
        raise


async def update_user_async(db: Session, user_id: int, user_update: UserUpdate) -> User:
    """Async version of update_user that properly handles geocoding"""
    try:
        logger.debug(f"Updating user {user_id} with data (async): {user_update}")

        service = UserService(db)
        updated_user = await service.update_user_async(user_id, user_update)

        # Log successful update
        logger.info(
            f"User updated successfully (async): ID={updated_user.id}, name={updated_user.first_name} {updated_user.last_name}"
        )

        return updated_user
    except Exception as e:
        logger.error(f"Error in update_user_async function: {str(e)}")
        raise


def deactivate_user(db: Session, user_id: int) -> bool:
    """Deactivate a user (soft delete)"""
    service = UserService(db)
    return service.deactivate_user(user_id)
