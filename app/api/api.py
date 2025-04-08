from fastapi import APIRouter

from app.api.routes import (
    users,
    auth,
    rides,
    messages,
    admin_hubs,
    admin_routes,
    admin_vehicle_types
)
from app.api.endpoints import test_rides

api_router = APIRouter()

# Auth routes
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# User routes
api_router.include_router(users.router, prefix="/users", tags=["users"])

# Ride routes
api_router.include_router(rides.router, prefix="/rides", tags=["rides"])

# Message routes
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])

# Admin routes
api_router.include_router(
    admin_hubs.router,
    prefix="/admin/hubs",
    tags=["admin", "hubs"]
)

api_router.include_router(
    admin_routes.router,
    prefix="/admin/routes",
    tags=["admin", "routes"]
)

api_router.include_router(
    admin_vehicle_types.router,
    prefix="/admin/vehicle-types",
    tags=["admin", "vehicles"]
)

# Test routes
api_router.include_router(
    test_rides.router,
    prefix="/test",
    tags=["test"]
)
