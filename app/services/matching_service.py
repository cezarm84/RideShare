import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func
from geoalchemy2.functions import ST_DWithin, ST_Distance
from math import radians, cos, sin, asin, sqrt
from app.models.user import User
from app.models.ride import Ride, RideBooking
from app.models.hub import Hub
from app.models.location import Location
from app.schemas.matching import MatchRequest

logger = logging.getLogger(__name__)

class MatchingService:
    """Service for matching users to suitable rides"""
    
    def __init__(self, db: Session):
        self.db = db

    def find_matches_for_user(self, user_id: int, match_request: MatchRequest) -> list[dict]:
        """
        Find matching rides based on location, time, and preferences
        
        Args:
            user_id: ID of the user seeking a ride
            match_request: Ride matching request parameters
            
        Returns:
            List of matching rides ranked by suitability
        """
        logger.info(f"Finding matches for user {user_id}")
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.home_location:
            logger.warning(f"User {user_id} not found or missing home location")
            return []

        # Calculate time window based on flexibility
        time_min = match_request.departure_time - timedelta(minutes=match_request.time_flexibility)
        time_max = match_request.departure_time + timedelta(minutes=match_request.time_flexibility)

        # Find nearby hubs
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

        # Find rides within time window with available seats
        rides = self.db.query(Ride).filter(
            Ride.destination_id == match_request.destination_id,
            Ride.starting_hub_id.in_(hub_ids),
            Ride.departure_time.between(time_min, time_max),
            Ride.status == "scheduled",
            Ride.available_seats > 0
        ).all()
        
        if not rides:
            logger.info(f"No rides found for user {user_id} in the requested time window")
            return []
        
        # Score and sort rides by suitability
        scored_rides = []
        for ride in rides:
            score = self._calculate_ride_score(ride, user, match_request, nearby_hubs)
            
            # Only include rides above a minimum score threshold
            if score > 20:  # Score is on a 0-100 scale
                scored_rides.append((ride, score))
        
        # Sort by score and convert to response model
        scored_rides.sort(key=lambda x: x[1], reverse=True)
        
        # Limit to requested max_results
        max_results = min(match_request.max_results, len(scored_rides))
        top_matches = scored_rides[:max_results]
        
        # Convert to response models
        matches = []
        for ride, score in top_matches:
            hub_name = next(hub.Hub.name for hub in nearby_hubs if hub.Hub.id == ride.starting_hub_id)
            matches.append({
                "ride_id": ride.id,
                "departure_time": ride.departure_time,
                "arrival_time": ride.arrival_time,
                "hub_id": ride.starting_hub_id,
                "hub_name": hub_name,
                "vehicle_type": ride.vehicle_type,
                "available_seats": ride.available_seats,
                "total_capacity": ride.capacity,
                "overall_score": round(score, 1)
            })
        
        logger.info(f"Found {len(matches)} matches for user {user_id}")
        return matches
    
    def _calculate_ride_score(self, ride: Ride, user: User, match_request: MatchRequest, nearby_hubs: list) -> float:
        """
        Calculate a ride's suitability score based on multiple factors
        
        Higher score = better match (0-100 scale)
        """
        scores = {}
        
        # Factor 1: Time match (how close to requested departure time)
        time_diff = abs((ride.departure_time - match_request.departure_time).total_seconds() / 60)
        time_flexibility = max(match_request.time_flexibility, 1)  # Avoid division by zero
        time_score = max(0, 100 - (time_diff / time_flexibility) * 50)
        scores["time"] = time_score
        
        # Factor 2: Hub proximity (how close is the starting hub to user)
        hub_distance = next((hub.distance for hub in nearby_hubs if hub.Hub.id == ride.starting_hub_id), 5000)
        # Score decreases as distance increases
        proximity_score = max(0, 100 - (hub_distance / 50))  # 5000m = 5km max distance
        scores["proximity"] = proximity_score
        
        # Factor 3: Ride occupancy (not too empty, not too full)
        occupancy = (ride.capacity - ride.available_seats) / ride.capacity
        # Prefer rides that already have some passengers but still have space
        occupancy_score = 100 - abs(0.5 - occupancy) * 100
        scores["occupancy"] = occupancy_score
        
        # Factor 4: User preferences (if applicable)
        pref_score = self._calculate_preference_score(ride, user)
        scores["preferences"] = pref_score
        
        # Factor 5: Past ride history with these companions
        history_score = self._calculate_history_score(ride, user)
        scores["history"] = history_score
        
        # Apply weightings to each factor
        weights = {
            "time": 0.3,
            "proximity": 0.3,
            "occupancy": 0.1,
            "preferences": 0.15,
            "history": 0.15
        }
        
        # Calculate weighted average
        final_score = sum(scores[factor] * weight for factor, weight in weights.items())
        
        return final_score
    
    def _calculate_preference_score(self, ride: Ride, user: User) -> float:
        """Calculate how well the ride matches user preferences"""
        score = 50  # Default neutral score
        
        # Check if user has vehicle type preference and if it matches
        if hasattr(user, 'preferred_vehicle_type') and user.preferred_vehicle_type:
            if user.preferred_vehicle_type == ride.vehicle_type:
                score += 30
            else:
                score -= 10
        
        # Add more preference checks here as they become available
        
        return max(0, min(100, score))  # Clamp to 0-100 range
    
    def _calculate_history_score(self, ride: Ride, user: User) -> float:
        """Calculate score based on user's ride history"""
        # In a real system, this would analyze past rides
        # For now, use a placeholder implementation
        
        # Count how many times the user has ridden with the driver
        rides_with_driver = 0
        if ride.driver_id:
            rides_with_driver = self.db.query(Ride).filter(
                Ride.driver_id == ride.driver_id,
                Ride.id.in_(
                    self.db.query(RideBooking.ride_id).filter(
                        RideBooking.user_id == user.id
                    )
                )
            ).count()
        
        # Score increases with familiarity
        history_score = min(80, rides_with_driver * 20)
        
        return history_score
