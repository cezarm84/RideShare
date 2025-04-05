import logging
from fastapi import WebSocket
from sqlalchemy.orm import Session
from typing import Dict
from app.models.ride import RideBooking

logger = logging.getLogger(__name__)

class RealTimeService:
    def __init__(self, db: Session):
        self.db = db
        self.connections: Dict[int, WebSocket] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.connections[user_id] = websocket
        logger.info(f"User {user_id} connected via WebSocket")

    async def disconnect(self, user_id: int):
        if user_id in self.connections:
            del self.connections[user_id]
            logger.info(f"User {user_id} disconnected")

    async def send_location_update(self, ride_id: int, latitude: float, longitude: float):
        bookings = self.db.query(RideBooking).filter(RideBooking.ride_id == ride_id).all()
        message = {
            "type": "location_update",
            "ride_id": ride_id,
            "latitude": latitude,
            "longitude": longitude,
            "timestamp": datetime.utcnow().isoformat()
        }
        for booking in bookings:
            if booking.user_id in self.connections:
                await self.connections[booking.user_id].send_json(message)
                logger.info(f"Sent location update to user {booking.user_id}")