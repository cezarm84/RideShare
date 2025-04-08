from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.api.dependencies import get_db, get_current_admin_user
from app.models.user import User
from app.models.destination import Destination
from app.schemas.destination import DestinationCreate, DestinationUpdate, DestinationResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[DestinationResponse])
async def list_destinations(
    skip: int = 0,
    limit: int = Query(50, gt=0, le=100),
    is_active: Optional[bool] = True,
    enterprise_id: Optional[int] = None,
    city: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    List all destinations with optional filtering.
    """
    query = db.query(Destination)

    # Apply filters
    if is_active is not None:
        query = query.filter(Destination.is_active == is_active)

    if enterprise_id is not None:
        query = query.filter(Destination.enterprise_id == enterprise_id)

    if city is not None:
        query = query.filter(Destination.city.ilike(f"%{city}%"))

    # Apply pagination
    query = query.offset(skip).limit(limit)

    destinations = query.all()

    # Convert Destination objects to dictionaries for Pydantic validation
    destination_dicts = [{
        "id": dest.id,
        "name": dest.name,
        "address": dest.address,
        "city": dest.city,
        "postal_code": getattr(dest, 'postal_code', None),
        "country": getattr(dest, 'country', None),
        "latitude": dest.latitude,
        "longitude": dest.longitude,
        "enterprise_id": getattr(dest, 'enterprise_id', None),
        "is_active": getattr(dest, 'is_active', True),
        "created_at": getattr(dest, 'created_at', None),
        "updated_at": getattr(dest, 'updated_at', None)
    } for dest in destinations]

    return destination_dicts

@router.post("", response_model=DestinationResponse, status_code=status.HTTP_201_CREATED)
async def create_destination(
    destination: DestinationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Create a new destination.
    Available to admin users.
    """
    try:
        # Create new destination
        new_destination = Destination(
            name=destination.name,
            address=destination.address,
            city=destination.city,
            postal_code=destination.postal_code,
            country=destination.country,
            latitude=destination.latitude,
            longitude=destination.longitude,
            enterprise_id=destination.enterprise_id,
            is_active=destination.is_active
        )

        db.add(new_destination)
        db.commit()
        db.refresh(new_destination)

        # Convert Destination object to dictionary for Pydantic validation
        destination_dict = {
            "id": new_destination.id,
            "name": new_destination.name,
            "address": new_destination.address,
            "city": new_destination.city,
            "postal_code": getattr(new_destination, 'postal_code', None),
            "country": getattr(new_destination, 'country', None),
            "latitude": new_destination.latitude,
            "longitude": new_destination.longitude,
            "enterprise_id": getattr(new_destination, 'enterprise_id', None),
            "is_active": getattr(new_destination, 'is_active', True),
            "created_at": getattr(new_destination, 'created_at', None),
            "updated_at": getattr(new_destination, 'updated_at', None)
        }

        return destination_dict
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating destination: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating destination: {str(e)}"
        )

@router.get("/{destination_id}", response_model=DestinationResponse)
async def get_destination(
    destination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Get a single destination by ID.
    """
    destination = db.query(Destination).filter(Destination.id == destination_id).first()
    if not destination:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination with ID {destination_id} not found"
        )

    # Convert Destination object to dictionary for Pydantic validation
    destination_dict = {
        "id": destination.id,
        "name": destination.name,
        "address": destination.address,
        "city": destination.city,
        "postal_code": getattr(destination, 'postal_code', None),
        "country": getattr(destination, 'country', None),
        "latitude": destination.latitude,
        "longitude": destination.longitude,
        "enterprise_id": getattr(destination, 'enterprise_id', None),
        "is_active": getattr(destination, 'is_active', True),
        "created_at": getattr(destination, 'created_at', None),
        "updated_at": getattr(destination, 'updated_at', None)
    }

    return destination_dict

@router.put("/{destination_id}", response_model=DestinationResponse)
async def update_destination(
    destination_id: int,
    destination_update: DestinationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Update an existing destination.
    Available to admin users.
    """
    try:
        # Check if destination exists
        existing_destination = db.query(Destination).filter(Destination.id == destination_id).first()
        if not existing_destination:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Destination with ID {destination_id} not found"
            )

        # Update destination fields
        update_data = destination_update.dict(exclude_unset=True)

        for key, value in update_data.items():
            setattr(existing_destination, key, value)

        # Update the updated_at timestamp
        from datetime import datetime
        existing_destination.updated_at = datetime.now()

        db.add(existing_destination)
        db.commit()
        db.refresh(existing_destination)

        # Convert Destination object to dictionary for Pydantic validation
        destination_dict = {
            "id": existing_destination.id,
            "name": existing_destination.name,
            "address": existing_destination.address,
            "city": existing_destination.city,
            "postal_code": getattr(existing_destination, 'postal_code', None),
            "country": getattr(existing_destination, 'country', None),
            "latitude": existing_destination.latitude,
            "longitude": existing_destination.longitude,
            "enterprise_id": getattr(existing_destination, 'enterprise_id', None),
            "is_active": getattr(existing_destination, 'is_active', True),
            "created_at": getattr(existing_destination, 'created_at', None),
            "updated_at": getattr(existing_destination, 'updated_at', None)
        }

        return destination_dict
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating destination: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating destination: {str(e)}"
        )

@router.delete("/{destination_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_destination(
    destination_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    """
    Delete a destination.
    Available to admin users.

    This endpoint performs a smart deletion:
    - If the destination is being used in any rides, it will be soft-deleted (marked as inactive)
    - If the destination is not being used, it will be hard-deleted (completely removed from the database)
    """
    # Check if destination exists
    destination = db.query(Destination).filter(Destination.id == destination_id).first()
    if not destination:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination with ID {destination_id} not found"
        )

    try:
        # Check if the destination is being used in any rides
        # Since we don't have a direct relationship in the database yet, we'll just do a soft delete for now
        destination.is_active = False
        db.add(destination)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting destination: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting destination: {str(e)}"
        )
