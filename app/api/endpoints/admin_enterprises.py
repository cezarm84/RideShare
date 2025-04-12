import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin_user, get_db
from app.models.enterprise import Enterprise
from app.models.user import User
from app.schemas.enterprise import (
    EnterpriseCreate,
    EnterpriseResponse,
    EnterpriseUpdate,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("", response_model=List[EnterpriseResponse])
async def list_enterprises(
    skip: int = 0,
    limit: int = Query(50, gt=0, le=100),
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """
    List all enterprises with optional filtering.
    """
    query = db.query(Enterprise)

    # Apply filters
    if is_active is not None:
        query = query.filter(Enterprise.is_active == is_active)

    # Apply pagination
    query = query.offset(skip).limit(limit)

    enterprises = query.all()

    # Convert Enterprise objects to dictionaries for Pydantic validation
    enterprise_dicts = [
        {
            "id": ent.id,
            "name": getattr(ent, "name", None),
            "address": getattr(ent, "address", None),
            "is_active": getattr(ent, "is_active", True),
        }
        for ent in enterprises
    ]

    return enterprise_dicts


@router.post("", response_model=EnterpriseResponse, status_code=status.HTTP_201_CREATED)
async def create_enterprise(
    enterprise: EnterpriseCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """
    Create a new enterprise.
    Only available to super admin users.
    """
    try:
        # Create new enterprise
        new_enterprise = Enterprise(
            name=enterprise.name,
            address=enterprise.address,
            is_active=enterprise.is_active,
        )

        db.add(new_enterprise)
        db.commit()
        db.refresh(new_enterprise)

        # Convert Enterprise object to dictionary for Pydantic validation
        enterprise_dict = {
            "id": new_enterprise.id,
            "name": getattr(new_enterprise, "name", None),
            "address": getattr(new_enterprise, "address", None),
            "is_active": getattr(new_enterprise, "is_active", True),
        }

        return enterprise_dict
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating enterprise: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating enterprise: {str(e)}",
        )


@router.get("/{enterprise_id}", response_model=EnterpriseResponse)
async def get_enterprise(
    enterprise_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """
    Get a single enterprise by ID.
    """
    enterprise = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enterprise with ID {enterprise_id} not found",
        )

    # Convert Enterprise object to dictionary for Pydantic validation
    enterprise_dict = {
        "id": enterprise.id,
        "name": getattr(enterprise, "name", None),
        "address": getattr(enterprise, "address", None),
        "is_active": getattr(enterprise, "is_active", True),
    }

    return enterprise_dict


@router.put("/{enterprise_id}", response_model=EnterpriseResponse)
async def update_enterprise(
    enterprise_id: int,
    enterprise_update: EnterpriseUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """
    Update an existing enterprise.
    Only available to super admin users.
    """
    try:
        # Check if enterprise exists
        existing_enterprise = (
            db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
        )
        if not existing_enterprise:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Enterprise with ID {enterprise_id} not found",
            )

        # Update enterprise fields
        update_data = enterprise_update.dict(exclude_unset=True)

        for key, value in update_data.items():
            setattr(existing_enterprise, key, value)

        # Update the updated_at timestamp
        from datetime import datetime

        existing_enterprise.updated_at = datetime.now()

        db.add(existing_enterprise)
        db.commit()
        db.refresh(existing_enterprise)

        # Convert Enterprise object to dictionary for Pydantic validation
        enterprise_dict = {
            "id": existing_enterprise.id,
            "name": getattr(existing_enterprise, "name", None),
            "address": getattr(existing_enterprise, "address", None),
            "is_active": getattr(existing_enterprise, "is_active", True),
        }

        return enterprise_dict
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating enterprise: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating enterprise: {str(e)}",
        )


@router.delete("/{enterprise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enterprise(
    enterprise_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user),
):
    """
    Delete an enterprise.
    Only available to super admin users.

    This endpoint performs a smart deletion:
    - If the enterprise is being used in any rides, it will be soft-deleted (marked as inactive)
    - If the enterprise is not being used, it will be hard-deleted (completely removed from the database)
    """
    # Check if enterprise exists
    enterprise = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not enterprise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enterprise with ID {enterprise_id} not found",
        )

    try:
        # Check if the enterprise is being used in any rides
        from app.models.ride import Ride

        rides_using_enterprise = (
            db.query(Ride)
            .filter(
                (Ride._enterprise_id == enterprise_id)
                & (Ride.status.in_(["scheduled", "in_progress"]))
            )
            .count()
        )

        if rides_using_enterprise > 0:
            # If enterprise is being used, perform soft delete
            enterprise.is_active = False
            db.add(enterprise)
            db.commit()
            return None
        else:
            # If enterprise is not being used, perform hard delete
            db.delete(enterprise)
            db.commit()
            return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting enterprise: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting enterprise: {str(e)}",
        )
