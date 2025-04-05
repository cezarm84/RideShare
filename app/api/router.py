from fastapi import APIRouter
from app.api.endpoints import auth, users, rides, bookings, matching, analytics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(rides.router, prefix="/rides", tags=["rides"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(matching.router, prefix="/matching", tags=["matching"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])