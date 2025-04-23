from fastapi import APIRouter

from app.api.endpoints import (
    admin_destinations,
    admin_email,
    admin_email_domains,
    admin_enhanced_messaging,
    admin_enterprises,
    admin_hubs,
    admin_stats,
    admin_test_emails,
    admin_vehicle_types,
    analytics,
    auth,
    bookings,
    contact,
    driver_issue,
    driver_schedule,
    driver_time_off,
    drivers,
    email_inbox,
    email_verification,
    enhanced_messaging,
    faqs,
    matching,
    matching_preferences,
    messaging,
    notifications,
    payment_methods,
    reference_data,
    rides,
    user_preferences,
    user_travel_patterns,
    users,
)

api_router = APIRouter()

# User and Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(drivers.router, prefix="/drivers", tags=["drivers"])
api_router.include_router(
    email_verification.router, prefix="/email", tags=["auth", "email"]
)

# Driver Management
api_router.include_router(
    driver_schedule.router, prefix="/drivers", tags=["drivers", "schedule"]
)
api_router.include_router(
    driver_time_off.router, prefix="/drivers", tags=["drivers", "time-off"]
)
api_router.include_router(
    driver_issue.router, prefix="/drivers", tags=["drivers", "issues"]
)

# Ride Management
api_router.include_router(rides.router, prefix="/rides", tags=["rides"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(matching.router, prefix="/matching", tags=["matching"])

# Reference Data
api_router.include_router(
    reference_data.router, prefix="/reference-data", tags=["reference-data"]
)

# Vehicle Management is handled through admin/vehicle-types endpoints

# Analytics, Messaging, FAQs, and Contact
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(messaging.router, prefix="/messaging", tags=["messaging"])
api_router.include_router(enhanced_messaging.router, prefix="/chat", tags=["chat"])
api_router.include_router(admin_enhanced_messaging.router, prefix="/admin/chat", tags=["admin", "chat"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(faqs.router, prefix="/faqs", tags=["faqs"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])

# Payment and Preferences
api_router.include_router(
    payment_methods.router, prefix="/payment-methods", tags=["payments"]
)
api_router.include_router(
    user_preferences.router, prefix="/user-preferences", tags=["users"]
)
api_router.include_router(
    matching_preferences.router,
    prefix="/matching-preferences",
    tags=["matching", "users"],
)
api_router.include_router(
    user_travel_patterns.router,
    prefix="/user-travel-patterns",
    tags=["matching", "users"],
)

# Admin Endpoints (restricted to admin users)
api_router.include_router(
    admin_stats.router, prefix="/admin/stats", tags=["admin", "dashboard"]
)
api_router.include_router(
    admin_hubs.router, prefix="/admin/hubs", tags=["admin", "hubs"]
)
api_router.include_router(
    admin_vehicle_types.router,
    prefix="/admin/vehicle-types",
    tags=["admin", "vehicle-types"],
)
api_router.include_router(
    admin_enterprises.router, prefix="/admin/enterprises", tags=["admin", "enterprises"]
)
api_router.include_router(
    admin_destinations.router,
    prefix="/admin/destinations",
    tags=["admin", "destinations"],
)
api_router.include_router(
    admin_email.router,
    prefix="/admin/email",
    tags=["admin", "email"],
)
api_router.include_router(
    admin_test_emails.router,
    prefix="/admin/test-emails",
    tags=["admin", "email", "testing"],
)
api_router.include_router(
    admin_email_domains.router,
    prefix="/admin/email-domains",
    tags=["admin", "email", "testing"],
)
api_router.include_router(
    email_inbox.router,
    prefix="/email",
    tags=["email", "testing"],
)
