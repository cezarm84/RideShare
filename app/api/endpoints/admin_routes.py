from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_superadmin
from app.db.session import get_db
from app.models.hub import Hub
from app.schemas.route import RouteCreate, RouteResponse, RouteUpdate

router = APIRouter()


# We need to create a Route model, or use Ride as a template for routes
@router.post("/", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
def create_route(
    route_data: RouteCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_superadmin),
):
    """
    Create a new route between hubs or hub-to-destination.
    Only accessible to super admins.
    """
    # Validate that both starting_hub_id and destination_hub_id exist
    starting_hub = None
    if route_data.starting_hub_id:
        starting_hub = (
            db.query(Hub).filter(Hub.id == route_data.starting_hub_id).first()
        )
        if not starting_hub:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Starting hub with ID {route_data.starting_hub_id} not found",
            )

    destination_hub = None
    if route_data.destination_hub_id:
        destination_hub = (
            db.query(Hub).filter(Hub.id == route_data.destination_hub_id).first()
        )
        if not destination_hub:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Destination hub with ID {route_data.destination_hub_id} not found",
            )

    # Create a Route object (you may need to create this model or use Ride as a template)
    from app.models.route import Route

    new_route = Route(
        name=route_data.name,
        description=route_data.description,
        starting_hub_id=route_data.starting_hub_id,
        destination_hub_id=route_data.destination_hub_id,
        distance=route_data.distance,
        duration=route_data.duration,
        is_active=route_data.is_active,
    )

    db.add(new_route)
    db.commit()
    db.refresh(new_route)

    return new_route


@router.get("/", response_model=List[RouteResponse])
def list_routes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_superadmin),
):
    """
    List all routes.
    Only accessible to super admins.
    """
    from app.models.route import Route

    routes = db.query(Route).offset(skip).limit(limit).all()
    return routes


@router.get("/{route_id}", response_model=RouteResponse)
def get_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_superadmin),
):
    """
    Get details of a specific route.
    Only accessible to super admins.
    """
    from app.models.route import Route

    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
        )
    return route


@router.put("/{route_id}", response_model=RouteResponse)
def update_route(
    route_id: int,
    route_data: RouteUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_superadmin),
):
    """
    Update a route.
    Only accessible to super admins.
    """
    from app.models.route import Route

    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
        )

    # Update route data
    update_data = route_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(route, key, value)

    db.commit()
    db.refresh(route)

    return route


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_route(
    route_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_superadmin),
):
    """
    Delete a route.
    Only accessible to super admins.
    """
    from app.models.route import Route

    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
        )

    db.delete(route)
    db.commit()

    return None
