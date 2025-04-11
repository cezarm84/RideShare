from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.api.dependencies import get_current_admin_user, get_current_superadmin_user
from app.schemas.vehicle import VehicleTypeCreate, VehicleTypeUpdate, VehicleTypeResponse
from app.models.user import User
from app.models.vehicle import VehicleType
from app.models.driver import DriverVehicle, DriverProfile
from app.tasks.scheduler_new import scheduler
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[VehicleTypeResponse])
async def list_vehicle_types(
    skip: int = 0,
    limit: int = Query(50, gt=0, le=100),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all vehicle types with optional filtering.
    Available to all admin users.
    """
    query = db.query(VehicleType)

    # Apply filters
    if is_active is not None:
        query = query.filter(VehicleType.is_active == is_active)

    # Apply pagination
    query = query.offset(skip).limit(limit)

    vehicle_types = query.all()
    return vehicle_types

@router.post("", response_model=VehicleTypeResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle_type(
    vehicle_type: VehicleTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin_user)
):
    """
    Create a new vehicle type.
    Only available to super admin users.
    """
    try:
        # Check if a vehicle type with this name already exists
        existing = db.query(VehicleType).filter(VehicleType.name == vehicle_type.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Vehicle type with name '{vehicle_type.name}' already exists"
            )

        # Create new vehicle type
        new_vehicle_type = VehicleType(
            name=vehicle_type.name,
            description=vehicle_type.description,
            capacity=vehicle_type.capacity,
            is_active=vehicle_type.is_active,
            price_factor=vehicle_type.price_factor
        )

        db.add(new_vehicle_type)
        db.commit()
        db.refresh(new_vehicle_type)

        return new_vehicle_type
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating vehicle type: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating vehicle type: {str(e)}"
        )

@router.get("/{vehicle_type_id}", response_model=VehicleTypeResponse)
async def get_vehicle_type(
    vehicle_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get a single vehicle type by ID.
    Available to all admin users.
    """
    vehicle_type = db.query(VehicleType).filter(VehicleType.id == vehicle_type_id).first()
    if not vehicle_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle type with ID {vehicle_type_id} not found"
        )
    return vehicle_type

@router.put("/{vehicle_type_id}", response_model=VehicleTypeResponse)
async def update_vehicle_type(
    vehicle_type_id: int,
    vehicle_type_update: VehicleTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin_user)
):
    """
    Update an existing vehicle type.
    Only available to super admin users.
    """
    existing_vehicle_type = db.query(VehicleType).filter(VehicleType.id == vehicle_type_id).first()
    if not existing_vehicle_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle type with ID {vehicle_type_id} not found"
        )

    try:
        # Check if we're updating to a name that already exists
        if vehicle_type_update.name and vehicle_type_update.name != existing_vehicle_type.name:
            name_exists = db.query(VehicleType).filter(
                VehicleType.name == vehicle_type_update.name,
                VehicleType.id != vehicle_type_id
            ).first()
            if name_exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Vehicle type with name '{vehicle_type_update.name}' already exists"
                )

        # Update vehicle type attributes if provided
        update_data = vehicle_type_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing_vehicle_type, key, value)

        db.add(existing_vehicle_type)
        db.commit()
        db.refresh(existing_vehicle_type)

        return existing_vehicle_type
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating vehicle type: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating vehicle type: {str(e)}"
        )

@router.delete("/{vehicle_type_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle_type(
    vehicle_type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin_user)
):
    """
    Delete a vehicle type (or set as inactive).
    Only available to super admin users.

    Note: This function actually sets the vehicle type to inactive rather than deleting it
    to preserve existing relationships and historical data.
    """
    vehicle_type = db.query(VehicleType).filter(VehicleType.id == vehicle_type_id).first()
    if not vehicle_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle type with ID {vehicle_type_id} not found"
        )

    try:
        # Set vehicle type as inactive rather than deleting
        vehicle_type.is_active = False
        db.add(vehicle_type)
        db.commit()

        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting vehicle type: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting vehicle type: {str(e)}"
        )

@router.put("/{vehicle_type_id}/inspection-status", status_code=status.HTTP_200_OK)
async def update_vehicle_type_inspection_status(
    vehicle_type_id: int,
    inspection_status: str = Query(..., description="New inspection status (passed, failed, pending, expired)"),
    last_inspection_date: Optional[str] = Query(None, description="Date of last inspection (YYYY-MM-DD)"),
    next_inspection_date: Optional[str] = Query(None, description="Date of next inspection (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)  # Admin only
):
    """
    Update the inspection status of all vehicles of a specific type.
    Admin only endpoint.

    - inspection_status: The new status (passed, failed, pending, expired)
    - last_inspection_date: Date of the last inspection (format: YYYY-MM-DD)
    - next_inspection_date: Date of the next inspection (format: YYYY-MM-DD)
    """
    try:
        # Find the vehicle type
        vehicle_type = db.query(VehicleType).filter(VehicleType.id == vehicle_type_id).first()
        if not vehicle_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle type with ID {vehicle_type_id} not found"
            )

        # Validate inspection status
        valid_statuses = ["passed", "failed", "pending", "expired"]
        if inspection_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid inspection status. Must be one of: {', '.join(valid_statuses)}"
            )

        # Convert date strings to date objects if provided
        last_date = None
        next_date = None

        if last_inspection_date:
            try:
                last_date = datetime.strptime(last_inspection_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid last_inspection_date format. Use YYYY-MM-DD."
                )

        if next_inspection_date:
            try:
                next_date = datetime.strptime(next_inspection_date, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid next_inspection_date format. Use YYYY-MM-DD."
                )

        # Find all driver vehicles with this vehicle type
        driver_vehicles = db.query(DriverVehicle)\
            .join(VehicleType, DriverVehicle.vehicle_id == VehicleType.id)\
            .filter(VehicleType.id == vehicle_type_id)\
            .all()

        if not driver_vehicles:
            return {"message": "No driver vehicles found for this vehicle type. No updates made."}

        # Update each driver vehicle
        for driver_vehicle in driver_vehicles:
            driver_vehicle.inspection_status = inspection_status

            if last_date:
                driver_vehicle.last_inspection_date = last_date

            if next_date:
                driver_vehicle.next_inspection_date = next_date

        db.commit()

        # Run the inspection check to send notifications
        scheduler.run_inspection_check_now()

        return {
            "message": f"Successfully updated inspection status to '{inspection_status}' for {len(driver_vehicles)} driver vehicles",
            "vehicle_type_id": vehicle_type_id,
            "inspection_status": inspection_status,
            "last_inspection_date": last_inspection_date,
            "next_inspection_date": next_inspection_date,
            "vehicles_updated": len(driver_vehicles)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating vehicle type inspection status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating vehicle type inspection status: {str(e)}"
        )

@router.post("/check-inspections", status_code=status.HTTP_200_OK)
async def run_inspection_check(
    _: User = Depends(get_current_admin_user)  # Admin only
):
    """
    Manually trigger the inspection date check process.
    This will update vehicle inspection statuses based on dates and send notifications.
    Admin only endpoint.
    """
    try:
        # Run the inspection check using the scheduler
        success = scheduler.run_inspection_check_now()
        if success:
            return {"message": "Inspection check completed successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error running inspection check"
            )
    except Exception as e:
        logger.error(f"Error running inspection check: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running inspection check: {str(e)}"
        )
