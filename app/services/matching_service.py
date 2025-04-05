import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func
from geoalchemy2.functions import ST_DWithin, ST_Distance
from app.models.user import User
from app.models.ride import Ride
from app.models.location import Hub
from app.schemas.matching import MatchRequest

logger = logging.getLogger(__name__)

class MatchingService:
    def __init__(self, db: Session):
        self.db = db

    def find_matches_for_user(self, user_id: int, match_request: MatchRequest) -> list[dict]:
        logger.info(f"Finding matches for user {user_id}")
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.home_location:
            logger.warning(f"User {user_id} not found or missing home location")
            return []

        time_min = match_request.departure_time - timedelta(minutes=match_request.time_flexibility)
        time_max = match_request.departure_time + timedelta(minutes=match_request.time_flexibility)

        nearby_hubs = self.db.query(
            Hub,
            ST_Distance(Hub.coordinates, user.home_location).label("distance")
        ).filter(
            ST_DWithin(Hub.coordinates, user.home_location, 5000)  # 5km radius
        ).order_by("distance").all()

        hub_ids = [hub.Hub.id for hub in nearby_hubs]
        if not hub_ids:
            logger.info(f"No hubs within 5km for user {user_id}")
            return []

        rides = self.db.query(Ride).filter(
            Ride.destination_id == match_request.destination_id,
            Ride.starting_hub_id.in_(hub_ids),
            Ride.departure_time.between(time_min, time_max),
            Ride.status == "scheduled",
            Ride.available_seats > 0
        ).limit(match_request.max_results).all()

        # Simplified scoring for testing
        matches = [
            {
                "ride_id": ride.id,
                "departure_time": ride.departure_time,
                "arrival_time": ride.arrival_time,
                "hub_id": ride.starting_hub_id,
                "hub_name": next(hub.Hub.name for hub in nearby_hubs if hub.Hub.id == ride.starting_hub_id),
                "vehicle_type": ride.vehicle_type,
                "available_seats": ride.available_seats,
                "total_capacity": ride.capacity,
                "overall_score": 100 - (i * 10)  # Dummy score
            }
            for i, ride in enumerate(rides)
        ]
        logger.info(f"Found {len(matches)} matches for user {user_id}")
        return matches