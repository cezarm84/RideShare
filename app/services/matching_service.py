import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func, or_, and_
from geoalchemy2.functions import ST_DWithin, ST_Distance
from math import radians, cos, sin, asin, sqrt
from app.models.user import User
from app.models.ride import Ride, RideBooking
from app.models.hub import Hub
from app.models.location import Location
from app.models.user_travel_pattern import UserTravelPattern
from app.models.user_matching_preference import UserMatchingPreference
from app.models.ride_match_history import RideMatchHistory
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
            # Get match reasons
            match_reasons = self._get_match_reasons(ride, user, match_request, score)

            # Get driver information if available
            driver_name = None
            driver_rating = None
            if hasattr(ride, 'driver_id') and ride.driver_id:
                driver = self.db.query(User).filter(User.id == ride.driver_id).first()
                if driver:
                    driver_name = f"{driver.first_name} {driver.last_name}"
                    # In a real system, you would get the driver's rating
                    driver_rating = 4.5  # Placeholder

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
                "overall_score": round(score, 1),
                "match_reasons": match_reasons[:3],  # Limit to top 3 reasons
                "driver_name": driver_name,
                "driver_rating": driver_rating,
                "estimated_price": ride.price_per_seat if hasattr(ride, 'price_per_seat') else None
            })

        logger.info(f"Found {len(matches)} matches for user {user_id}")
        return matches

    def _calculate_ride_score(self, ride: Ride, user: User, match_request: MatchRequest, nearby_hubs: list) -> float:
        """
        Calculate a ride's suitability score based on multiple factors

        Higher score = better match (0-100 scale)
        """
        scores = {}
        match_reasons = []

        # Get user matching preferences if they exist
        user_prefs = self.db.query(UserMatchingPreference).filter(UserMatchingPreference.user_id == user.id).first()

        # Factor 1: Time match (how close to requested departure time)
        time_diff = abs((ride.departure_time - match_request.departure_time).total_seconds() / 60)
        time_flexibility = max(match_request.time_flexibility, 1)  # Avoid division by zero
        time_score = max(0, 100 - (time_diff / time_flexibility) * 50)
        scores["time"] = time_score

        if time_diff <= 5:
            match_reasons.append("Exact time match")
        elif time_diff <= 15:
            match_reasons.append(f"Close departure time ({int(time_diff)} min difference)")

        # Factor 2: Hub proximity (how close is the starting hub to user)
        hub_distance = next((hub.distance for hub in nearby_hubs if hub.Hub.id == ride.starting_hub_id), 5000)

        # If user has a preferred hub and it matches, give a bonus
        if user.preferred_starting_hub_id and user.preferred_starting_hub_id == ride.starting_hub_id:
            proximity_score = 100
            match_reasons.append("Preferred starting hub")
        else:
            # Score decreases as distance increases
            max_walking_distance = user_prefs.max_walking_distance_meters if user_prefs else 1000
            proximity_score = max(0, 100 - (hub_distance / max_walking_distance) * 100)

            if hub_distance <= 200:
                match_reasons.append("Very close to starting hub")
            elif hub_distance <= 500:
                match_reasons.append("Walking distance to starting hub")

        scores["proximity"] = proximity_score

        # Factor 3: Ride occupancy (not too empty, not too full)
        occupancy = (ride.capacity - ride.available_seats) / ride.capacity
        # Prefer rides that already have some passengers but still have space
        occupancy_score = 100 - abs(0.5 - occupancy) * 100
        scores["occupancy"] = occupancy_score

        # Factor 4: User preferences (if applicable)
        pref_score, pref_reasons = self._calculate_preference_score(ride, user, user_prefs)
        scores["preferences"] = pref_score
        match_reasons.extend(pref_reasons)

        # Factor 5: Past ride history with these companions
        history_score, history_reasons = self._calculate_history_score(ride, user)
        scores["history"] = history_score
        match_reasons.extend(history_reasons)

        # Factor 6: Travel pattern match
        pattern_score, pattern_reasons = self._calculate_pattern_score(ride, user, match_request)
        scores["pattern"] = pattern_score
        match_reasons.extend(pattern_reasons)

        # Apply weightings to each factor
        weights = {
            "time": 0.25,
            "proximity": 0.25,
            "occupancy": 0.05,
            "preferences": 0.15,
            "history": 0.15,
            "pattern": 0.15
        }

        # Calculate weighted average
        final_score = sum(scores[factor] * weight for factor, weight in weights.items())

        # Record this match in history for future reference
        if ride.driver_id:
            self._record_match_history(user.id, ride.driver_id, ride.id, final_score, match_reasons)

        return final_score

    def _calculate_preference_score(self, ride: Ride, user: User, user_prefs: UserMatchingPreference = None) -> tuple:
        """Calculate how well the ride matches user preferences"""
        score = 50  # Default neutral score
        reasons = []

        # Check if user has vehicle type preference and if it matches
        if user.preferred_vehicle_type_id and ride.vehicle_type_id:
            if user.preferred_vehicle_type_id == ride.vehicle_type_id:
                score += 30
                reasons.append("Preferred vehicle type")
            else:
                score -= 10

        # Check enterprise preference
        if user_prefs and user_prefs.prefer_same_enterprise and user.enterprise_id:
            # Get the driver's enterprise ID if available
            if ride.driver_id:
                driver = self.db.query(User).filter(User.id == ride.driver_id).first()
                if driver and driver.enterprise_id == user.enterprise_id:
                    score += 20
                    reasons.append("Same enterprise")

        # Check driver rating if applicable
        if ride.driver_id and user_prefs and user_prefs.minimum_driver_rating:
            # This would require a driver rating system
            # For now, we'll assume all drivers meet the minimum rating
            pass

        # Check language preference if applicable
        if user_prefs and user_prefs.preferred_language:
            # This would require storing driver languages
            # For now, we'll skip this check
            pass

        return max(0, min(100, score)), reasons  # Clamp to 0-100 range

    def _calculate_history_score(self, ride: Ride, user: User) -> tuple:
        """Calculate score based on user's ride history"""
        score = 0
        reasons = []

        # Check ride match history
        if ride.driver_id:
            # Count successful matches with this driver
            match_history = self.db.query(RideMatchHistory).filter(
                RideMatchHistory.user_id == user.id,
                RideMatchHistory.matched_user_id == ride.driver_id,
                RideMatchHistory.was_accepted == True
            ).all()

            # Count rides with this driver
            rides_with_driver = self.db.query(Ride).filter(
                Ride.driver_id == ride.driver_id,
                Ride.id.in_(
                    self.db.query(RideBooking.ride_id).filter(
                        RideBooking.user_id == user.id
                    )
                )
            ).count()

            # Calculate score based on history
            if rides_with_driver > 0:
                score += min(60, rides_with_driver * 15)
                if rides_with_driver == 1:
                    reasons.append("Rode together once before")
                else:
                    reasons.append(f"Rode together {rides_with_driver} times before")

            # Add bonus for positive feedback
            positive_feedback = [m for m in match_history if m.feedback_rating and m.feedback_rating >= 4]
            if positive_feedback:
                score += min(40, len(positive_feedback) * 10)
                reasons.append("Positive past experience")

        return min(100, score), reasons

    def _calculate_pattern_score(self, ride: Ride, user: User, match_request: MatchRequest) -> tuple:
        """Calculate score based on user's travel patterns"""
        score = 0
        reasons = []

        # Get user's travel patterns
        travel_patterns = self.db.query(UserTravelPattern).filter(
            UserTravelPattern.user_id == user.id,
            UserTravelPattern.day_of_week == match_request.departure_time.weekday()
        ).all()

        if not travel_patterns:
            return 0, []  # No patterns to match against

        # Find patterns that match this ride's route
        matching_patterns = []
        for pattern in travel_patterns:
            # Check if origin matches
            origin_matches = False
            if pattern.origin_type == 'hub' and pattern.origin_id == ride.starting_hub_id:
                origin_matches = True

            # Check if destination matches
            dest_matches = False
            if ride.destination_hub_id and pattern.destination_type == 'hub' and pattern.destination_id == ride.destination_hub_id:
                dest_matches = True
            elif ride.destination_latitude and ride.destination_longitude:
                # Calculate distance between ride destination and pattern destination
                dest_distance = self._haversine(
                    ride.destination_latitude, ride.destination_longitude,
                    pattern.destination_latitude, pattern.destination_longitude
                )
                if dest_distance < 1.0:  # Within 1km
                    dest_matches = True

            if origin_matches and dest_matches:
                matching_patterns.append(pattern)

        # Score based on matching patterns
        if matching_patterns:
            # Base score for having a matching pattern
            score += 50
            reasons.append("Matches your regular travel pattern")

            # Bonus for frequently traveled patterns
            frequent_patterns = [p for p in matching_patterns if p.frequency > 5]
            if frequent_patterns:
                score += 30
                reasons.append("Matches your frequent travel route")

            # Bonus for recently traveled patterns
            recent_patterns = [p for p in matching_patterns if p.last_traveled and (match_request.departure_time.date() - p.last_traveled).days < 14]
            if recent_patterns:
                score += 20
                reasons.append("Matches your recent travel route")

        return min(100, score), reasons

    def _record_match_history(self, user_id: int, matched_user_id: int, ride_id: int, match_score: float, match_reasons: list) -> None:
        """Record a match in the history for future reference"""
        # Check if this match already exists
        existing_match = self.db.query(RideMatchHistory).filter(
            RideMatchHistory.user_id == user_id,
            RideMatchHistory.matched_user_id == matched_user_id,
            RideMatchHistory.ride_id == ride_id
        ).first()

        if existing_match:
            # Update existing match
            existing_match.match_score = match_score
            if match_reasons:
                existing_match.match_reason = match_reasons[0] if len(match_reasons) > 0 else None
            self.db.commit()
        else:
            # Create new match history entry
            new_match = RideMatchHistory(
                user_id=user_id,
                matched_user_id=matched_user_id,
                ride_id=ride_id,
                match_score=match_score,
                match_reason=match_reasons[0] if len(match_reasons) > 0 else None
            )
            self.db.add(new_match)
            self.db.commit()

    def _get_match_reasons(self, ride: Ride, user: User, match_request: MatchRequest, score: float) -> list:
        """Generate human-readable reasons for why this ride is a good match"""
        reasons = []

        # Time match
        time_diff = abs((ride.departure_time - match_request.departure_time).total_seconds() / 60)
        if time_diff <= 5:
            reasons.append("Exact time match")
        elif time_diff <= 15:
            reasons.append(f"Close departure time ({int(time_diff)} min difference)")

        # Hub match
        if user.preferred_starting_hub_id and user.preferred_starting_hub_id == ride.starting_hub_id:
            reasons.append("Preferred starting hub")

        # Enterprise match
        if hasattr(ride, 'driver_id') and ride.driver_id and user.enterprise_id:
            driver = self.db.query(User).filter(User.id == ride.driver_id).first()
            if driver and driver.enterprise_id == user.enterprise_id:
                reasons.append("Same enterprise")

        # Vehicle type match
        if user.preferred_vehicle_type_id and hasattr(ride, 'vehicle_type_id') and ride.vehicle_type_id == user.preferred_vehicle_type_id:
            reasons.append("Preferred vehicle type")

        # Ride history
        if hasattr(ride, 'driver_id') and ride.driver_id:
            rides_with_driver = self.db.query(Ride).filter(
                Ride.driver_id == ride.driver_id,
                Ride.id.in_(
                    self.db.query(RideBooking.ride_id).filter(
                        RideBooking.user_id == user.id
                    )
                )
            ).count()

            if rides_with_driver == 1:
                reasons.append("Rode together once before")
            elif rides_with_driver > 1:
                reasons.append(f"Rode together {rides_with_driver} times before")

        # Travel pattern match
        travel_patterns = self.db.query(UserTravelPattern).filter(
            UserTravelPattern.user_id == user.id,
            UserTravelPattern.day_of_week == match_request.departure_time.weekday()
        ).all()

        for pattern in travel_patterns:
            if pattern.origin_type == 'hub' and pattern.origin_id == ride.starting_hub_id:
                if ride.destination_hub_id and pattern.destination_type == 'hub' and pattern.destination_id == ride.destination_hub_id:
                    reasons.append("Matches your regular travel pattern")
                    break

        # If we don't have enough reasons, add generic ones based on score
        if len(reasons) < 2:
            if score > 80:
                reasons.append("Excellent overall match")
            elif score > 60:
                reasons.append("Good overall match")

        return reasons

    def _haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate the great circle distance between two points on earth"""
        # Convert decimal degrees to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        # Haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r
