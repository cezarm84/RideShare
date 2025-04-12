from fastapi import APIRouter

from app.api.endpoints import bookings, payment_methods, test_rides, user_preferences
from app.api.routes import (
    admin_hubs,
    admin_routes,
    admin_vehicle_types,
    auth,
    messages,
    rides,
    users,
)

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
    admin_hubs.router, prefix="/admin/hubs", tags=["admin", "hubs"]
)

api_router.include_router(
    admin_routes.router, prefix="/admin/routes", tags=["admin", "routes"]
)

api_router.include_router(
    admin_vehicle_types.router,
    prefix="/admin/vehicle-types",
    tags=["admin", "vehicles"],
)

# Payment methods routes
api_router.include_router(
    payment_methods.router, prefix="/payment-methods", tags=["payments"]
)

# User preferences routes
api_router.include_router(
    user_preferences.router, prefix="/user-preferences", tags=["users"]
)

# Booking routes
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])

# Test routes
api_router.include_router(test_rides.router, prefix="/test", tags=["test"])
