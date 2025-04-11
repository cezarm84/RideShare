from fastapi import APIRouter
from app.api.endpoints import (
    auth, users, rides, bookings, matching, analytics, messaging, drivers,
    admin_hubs, admin_vehicle_types, admin_enterprises, admin_destinations,
    payment_methods, user_preferences, matching_preferences, user_travel_patterns
)

api_router = APIRouter()

# User and Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(drivers.router, prefix="/drivers", tags=["drivers"])

# Ride Management
api_router.include_router(rides.router, prefix="/rides", tags=["rides"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(matching.router, prefix="/matching", tags=["matching"])

# Vehicle Management is handled through admin/vehicle-types endpoints

# Analytics and Messaging
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(messaging.router, prefix="/messaging", tags=["messaging"])

# Payment and Preferences
api_router.include_router(payment_methods.router, prefix="/payment-methods", tags=["payments"])
api_router.include_router(user_preferences.router, prefix="/user-preferences", tags=["users"])
api_router.include_router(matching_preferences.router, prefix="/matching-preferences", tags=["matching", "users"])
api_router.include_router(user_travel_patterns.router, prefix="/user-travel-patterns", tags=["matching", "users"])

# Admin Endpoints (restricted to admin users)
api_router.include_router(admin_hubs.router, prefix="/admin/hubs", tags=["admin", "hubs"])
api_router.include_router(admin_vehicle_types.router, prefix="/admin/vehicle-types", tags=["admin", "vehicle-types"])
api_router.include_router(admin_enterprises.router, prefix="/admin/enterprises", tags=["admin", "enterprises"])
api_router.include_router(admin_destinations.router, prefix="/admin/destinations", tags=["admin", "destinations"])
