from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.api.dependencies import get_current_admin_user, get_current_superadmin_user
from app.schemas.hub import HubCreate, HubUpdate, HubResponse, HubPairCreate, HubPairResponse
from app.models.user import User
from app.models.hub import Hub, HubPair
from app.core.geocoding import get_coordinates_for_address
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("", response_model=List[HubResponse])
async def list_hubs(
    skip: int = 0,
    limit: int = Query(50, gt=0, le=100),
    is_active: Optional[bool] = True,  # Default to showing only active hubs
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all hubs with optional filtering.
    Available to all admin users.
    """
    query = db.query(Hub)

    # Apply filters
    if is_active is not None:
        query = query.filter(Hub.is_active == is_active)

    # Apply pagination
    query = query.offset(skip).limit(limit)

    hubs = query.all()

    # Convert Hub objects to dictionaries for Pydantic validation
    hub_dicts = [{
        "id": hub.id,
        "name": hub.name,
        "description": getattr(hub, 'description', None),
        "address": hub.address,
        "city": hub.city,
        "postal_code": getattr(hub, 'postal_code', None),
        "latitude": getattr(hub, 'latitude', None),
        "longitude": getattr(hub, 'longitude', None),
        "is_active": getattr(hub, 'is_active', True),
        "created_at": getattr(hub, 'created_at', None),
        "updated_at": getattr(hub, 'updated_at', None)
    } for hub in hubs]

    return hub_dicts

@router.post("", response_model=HubResponse, status_code=status.HTTP_201_CREATED)
async def create_hub(
    hub: HubCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin_user)
):
    """
    Create a new hub.
    Only available to super admin users.
    """
    try:
        # Try to get coordinates if not provided
        if not hub.latitude or not hub.longitude:
            address_str = f"{hub.address}, {hub.postal_code}, {hub.city}"
            try:
                coords = await get_coordinates_for_address(address_str)
                if coords:
                    hub.latitude, hub.longitude = coords
            except Exception as e:
                logger.warning(f"Could not get coordinates for {address_str}: {str(e)}")

        # Create new hub object
        new_hub = Hub(
            name=hub.name,
            address=hub.address,
            postal_code=hub.postal_code,
            city=hub.city,
            latitude=hub.latitude,
            longitude=hub.longitude,
            is_active=hub.is_active
        )

        db.add(new_hub)
        db.commit()
        db.refresh(new_hub)

        # Convert Hub object to dictionary for Pydantic validation
        hub_dict = {
            "id": new_hub.id,
            "name": new_hub.name,
            "description": getattr(new_hub, 'description', None),
            "address": new_hub.address,
            "city": new_hub.city,
            "postal_code": getattr(new_hub, 'postal_code', None),
            "latitude": getattr(new_hub, 'latitude', None),
            "longitude": getattr(new_hub, 'longitude', None),
            "is_active": getattr(new_hub, 'is_active', True),
            "created_at": getattr(new_hub, 'created_at', None),
            "updated_at": getattr(new_hub, 'updated_at', None)
        }

        return hub_dict
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating hub: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating hub: {str(e)}"
        )

@router.get("/{hub_id}", response_model=HubResponse)
async def get_hub(
    hub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Get a single hub by ID.
    Available to all admin users.
    """
    hub = db.query(Hub).filter(Hub.id == hub_id).first()
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hub with ID {hub_id} not found"
        )

    # Convert Hub object to dictionary for Pydantic validation
    hub_dict = {
        "id": hub.id,
        "name": hub.name,
        "description": getattr(hub, 'description', None),
        "address": hub.address,
        "city": hub.city,
        "postal_code": getattr(hub, 'postal_code', None),
        "latitude": getattr(hub, 'latitude', None),
        "longitude": getattr(hub, 'longitude', None),
        "is_active": getattr(hub, 'is_active', True),
        "created_at": getattr(hub, 'created_at', None),
        "updated_at": getattr(hub, 'updated_at', None)
    }

    return hub_dict

@router.put("/{hub_id}", response_model=HubResponse)
async def update_hub(
    hub_id: int,
    hub_update: HubUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin_user)
):
    """
    Update an existing hub.
    Only available to super admin users.
    """
    existing_hub = db.query(Hub).filter(Hub.id == hub_id).first()
    if not existing_hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hub with ID {hub_id} not found"
        )

    try:
        # Update hub attributes if provided
        update_data = hub_update.dict(exclude_unset=True)

        # If address is updated but no coordinates, try to get new coordinates
        if ("address" in update_data or "postal_code" in update_data or "city" in update_data) and \
           not ("latitude" in update_data and "longitude" in update_data):
            # Get the latest address values (mix of existing and updates)
            address = update_data.get("address", existing_hub.address)
            postal_code = update_data.get("postal_code", existing_hub.postal_code)
            city = update_data.get("city", existing_hub.city)

            if address and postal_code and city:
                address_str = f"{address}, {postal_code}, {city}"
                try:
                    coords = await get_coordinates_for_address(address_str)
                    if coords:
                        update_data["latitude"], update_data["longitude"] = coords
                except Exception as e:
                    logger.warning(f"Could not get coordinates for {address_str}: {str(e)}")

        # Update hub
        for key, value in update_data.items():
            setattr(existing_hub, key, value)

        db.add(existing_hub)
        db.commit()
        db.refresh(existing_hub)

        # Convert Hub object to dictionary for Pydantic validation
        hub_dict = {
            "id": existing_hub.id,
            "name": existing_hub.name,
            "description": getattr(existing_hub, 'description', None),
            "address": existing_hub.address,
            "city": existing_hub.city,
            "postal_code": getattr(existing_hub, 'postal_code', None),
            "latitude": getattr(existing_hub, 'latitude', None),
            "longitude": getattr(existing_hub, 'longitude', None),
            "is_active": getattr(existing_hub, 'is_active', True),
            "created_at": getattr(existing_hub, 'created_at', None),
            "updated_at": getattr(existing_hub, 'updated_at', None)
        }

        return hub_dict
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating hub: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating hub: {str(e)}"
        )

@router.delete("/{hub_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hub(
    hub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin_user)
):
    """
    Delete a hub.
    Only available to super admin users.

    This endpoint performs a smart deletion:
    - If the hub is being used in any scheduled or in-progress rides, it will be soft-deleted (marked as inactive)
    - If the hub is not being used in any active rides, it will be hard-deleted (completely removed from the database)

    To view inactive hubs, use the GET /api/v1/admin/hubs endpoint with is_active=false parameter.
    """
    hub = db.query(Hub).filter(Hub.id == hub_id).first()
    if not hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hub with ID {hub_id} not found"
        )

    try:
        # Check if the hub is being used in any rides
        from app.models.ride import Ride
        rides_using_hub = db.query(Ride).filter(
            ((Ride.starting_hub_id == hub_id) | (Ride.destination_hub_id == hub_id)) &
            (Ride.status.in_(["scheduled", "in_progress"]))
        ).count()

        if rides_using_hub > 0:
            # If hub is being used, perform soft delete
            hub.is_active = False
            db.add(hub)
            db.commit()
            return None
        else:
            # If hub is not being used, perform hard delete
            db.delete(hub)
            db.commit()
            return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting hub: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting hub: {str(e)}"
        )

@router.post("/pairs", response_model=HubPairResponse, status_code=status.HTTP_201_CREATED)
async def create_hub_pair(
    hub_pair: HubPairCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin_user)
):
    """
    Create a hub-to-hub connection pair.
    Only available to super admin users.
    """
    # Verify both hubs exist
    source_hub = db.query(Hub).filter(Hub.id == hub_pair.source_hub_id).first()
    if not source_hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source hub with ID {hub_pair.source_hub_id} not found"
        )

    destination_hub = db.query(Hub).filter(Hub.id == hub_pair.destination_hub_id).first()
    if not destination_hub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination hub with ID {hub_pair.destination_hub_id} not found"
        )

    # Check if this pair already exists
    existing_pair = db.query(HubPair).filter(
        HubPair.source_hub_id == hub_pair.source_hub_id,
        HubPair.destination_hub_id == hub_pair.destination_hub_id
    ).first()

    if existing_pair:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This hub pair already exists"
        )

    try:
        # Create hub pair
        new_hub_pair = HubPair(
            source_hub_id=hub_pair.source_hub_id,
            destination_hub_id=hub_pair.destination_hub_id,
            expected_travel_time=hub_pair.expected_travel_time,
            distance=hub_pair.distance,
            is_active=hub_pair.is_active
        )

        db.add(new_hub_pair)
        db.commit()
        db.refresh(new_hub_pair)

        # Attach the hub objects for the response
        result = new_hub_pair
        result.source_hub = source_hub
        result.destination_hub = destination_hub

        return result
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating hub pair: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating hub pair: {str(e)}"
        )

@router.get("/pairs", response_model=List[HubPairResponse])
async def list_hub_pairs(
    source_hub_id: Optional[int] = None,
    destination_hub_id: Optional[int] = None,
    skip: int = 0,
    limit: int = Query(50, gt=0, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List all hub pairs with optional filtering.
    Available to all admin users.
    """
    query = db.query(HubPair)

    # Apply filters
    if source_hub_id:
        query = query.filter(HubPair.source_hub_id == source_hub_id)
    if destination_hub_id:
        query = query.filter(HubPair.destination_hub_id == destination_hub_id)

    # Apply pagination
    query = query.offset(skip).limit(limit)

    # Get results with eager loading of hubs
    pairs = query.all()

    # Manually load hub information for each pair
    for pair in pairs:
        pair.source_hub = db.query(Hub).get(pair.source_hub_id)
        pair.destination_hub = db.query(Hub).get(pair.destination_hub_id)

    return pairs

@router.delete("/pairs/{pair_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hub_pair(
    pair_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superadmin_user)
):
    """
    Delete a hub pair.
    Only available to super admin users.
    """
    hub_pair = db.query(HubPair).filter(HubPair.id == pair_id).first()
    if not hub_pair:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hub pair with ID {pair_id} not found"
        )

    try:
        db.delete(hub_pair)
        db.commit()

        return None
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting hub pair: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting hub pair: {str(e)}"
        )
