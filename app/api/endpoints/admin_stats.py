from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, select

from app.api.dependencies import get_current_admin_user, get_db
from app.models.hub import Hub
from app.models.destination import Destination
from app.models.ride import Ride
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.enterprise import Enterprise

router = APIRouter()


@router.get("/")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin_user),
):
    """
    Get admin dashboard statistics.
    Only accessible to admin users.
    """
    try:
        # Count total hubs
        total_hubs = db.query(func.count(Hub.id)).scalar() or 0

        # Count total destinations
        total_destinations = db.query(func.count(Destination.id)).scalar() or 0

        # Count active rides
        active_rides = db.query(func.count(Ride.id)).filter(
            Ride.status.in_(["scheduled", "active"])
        ).scalar() or 0

        # Count total users
        total_users = db.query(func.count(User.id)).scalar() or 0

        # Count total vehicles
        total_vehicles = db.query(func.count(Vehicle.id)).scalar() or 0

        # Count total enterprises
        total_enterprises = db.query(func.count(Enterprise.id)).scalar() or 0

        # Get recent activity (last 5 actions)
        # This would typically come from an activity log table
        # For now, we'll return placeholder data
        recent_activity = [
            "System initialized",
            "Database connected",
            "API services started",
            "Admin user logged in",
            "Stats endpoint accessed"
        ]

        # System status
        system_status = {
            "api": "Online",
            "database": "Connected",
            "lastBackup": "Never"
        }

        return {
            "totalHubs": total_hubs,
            "totalDestinations": total_destinations,
            "activeRides": active_rides,
            "totalUsers": total_users,
            "totalVehicles": total_vehicles,
            "totalEnterprises": total_enterprises,
            "recentActivity": recent_activity,
            "systemStatus": system_status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching admin stats: {str(e)}"
        )
