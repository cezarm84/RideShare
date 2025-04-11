import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from app.models.user import User
from app.models.ride import Ride, RideBooking
from app.models.hub import Hub
from app.models.user_travel_pattern import UserTravelPattern

logger = logging.getLogger(__name__)

class TravelPatternService:
    """Service for managing user travel patterns"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def extract_patterns_from_bookings(self, user_id: int) -> list:
        """
        Analyze a user's ride bookings to extract travel patterns
        
        Args:
            user_id: The ID of the user
            
        Returns:
            List of extracted travel patterns
        """
        logger.info(f"Extracting travel patterns for user {user_id}")
        
        # Get user's completed ride bookings
        bookings = self.db.query(RideBooking).filter(
            RideBooking.user_id == user_id,
            RideBooking.status == "completed"
        ).all()
        
        if not bookings:
            logger.info(f"No completed bookings found for user {user_id}")
            return []
        
        # Group bookings by route (starting hub + destination)
        route_patterns = {}
        for booking in bookings:
            ride = self.db.query(Ride).filter(Ride.id == booking.ride_id).first()
            if not ride:
                continue
                
            # Create a route key
            if ride.destination_hub_id:
                # Hub-to-hub ride
                route_key = f"hub:{ride.starting_hub_id}|hub:{ride.destination_hub_id}"
                origin_type = "hub"
                origin_id = ride.starting_hub_id
                destination_type = "hub"
                destination_id = ride.destination_hub_id
                origin_lat, origin_lon = self._get_hub_coordinates(ride.starting_hub_id)
                dest_lat, dest_lon = self._get_hub_coordinates(ride.destination_hub_id)
            elif hasattr(ride, 'destination_latitude') and ride.destination_latitude:
                # Hub-to-destination ride
                route_key = f"hub:{ride.starting_hub_id}|dest:{ride.destination_latitude:.4f},{ride.destination_longitude:.4f}"
                origin_type = "hub"
                origin_id = ride.starting_hub_id
                destination_type = "custom"
                destination_id = None
                origin_lat, origin_lon = self._get_hub_coordinates(ride.starting_hub_id)
                dest_lat, dest_lon = ride.destination_latitude, ride.destination_longitude
            else:
                # Skip rides with incomplete data
                continue
            
            # Get day of week and time
            day_of_week = ride.departure_time.weekday()
            departure_hour = ride.departure_time.hour
            
            # Create a time slot key (day + hour)
            time_key = f"{day_of_week}:{departure_hour}"
            
            # Initialize route pattern if not exists
            if route_key not in route_patterns:
                route_patterns[route_key] = {
                    "origin_type": origin_type,
                    "origin_id": origin_id,
                    "origin_latitude": origin_lat,
                    "origin_longitude": origin_lon,
                    "destination_type": destination_type,
                    "destination_id": destination_id,
                    "destination_latitude": dest_lat,
                    "destination_longitude": dest_lon,
                    "time_slots": {}
                }
            
            # Increment frequency for this time slot
            if time_key not in route_patterns[route_key]["time_slots"]:
                route_patterns[route_key]["time_slots"][time_key] = {
                    "day_of_week": day_of_week,
                    "departure_time": f"{departure_hour:02d}:00:00",
                    "frequency": 0,
                    "last_traveled": None
                }
            
            route_patterns[route_key]["time_slots"][time_key]["frequency"] += 1
            
            # Update last traveled date if more recent
            ride_date = ride.departure_time.date()
            if (route_patterns[route_key]["time_slots"][time_key]["last_traveled"] is None or
                ride_date > route_patterns[route_key]["time_slots"][time_key]["last_traveled"]):
                route_patterns[route_key]["time_slots"][time_key]["last_traveled"] = ride_date
        
        # Convert to list of patterns
        patterns = []
        for route_key, route_data in route_patterns.items():
            for time_key, time_data in route_data["time_slots"].items():
                patterns.append({
                    "user_id": user_id,
                    "origin_type": route_data["origin_type"],
                    "origin_id": route_data["origin_id"],
                    "origin_latitude": route_data["origin_latitude"],
                    "origin_longitude": route_data["origin_longitude"],
                    "destination_type": route_data["destination_type"],
                    "destination_id": route_data["destination_id"],
                    "destination_latitude": route_data["destination_latitude"],
                    "destination_longitude": route_data["destination_longitude"],
                    "day_of_week": time_data["day_of_week"],
                    "departure_time": datetime.strptime(time_data["departure_time"], "%H:%M:%S").time(),
                    "frequency": time_data["frequency"],
                    "last_traveled": time_data["last_traveled"]
                })
        
        return patterns
    
    def update_user_travel_patterns(self, user_id: int) -> int:
        """
        Update travel patterns for a user based on their ride history
        
        Args:
            user_id: The ID of the user
            
        Returns:
            Number of patterns created or updated
        """
        # Extract patterns from bookings
        extracted_patterns = self.extract_patterns_from_bookings(user_id)
        if not extracted_patterns:
            return 0
        
        # Get existing patterns
        existing_patterns = self.db.query(UserTravelPattern).filter(
            UserTravelPattern.user_id == user_id
        ).all()
        
        # Create a dictionary of existing patterns for easy lookup
        existing_dict = {}
        for pattern in existing_patterns:
            key = self._get_pattern_key(pattern)
            existing_dict[key] = pattern
        
        # Update or create patterns
        patterns_updated = 0
        for pattern_data in extracted_patterns:
            # Create a key for this pattern
            temp_pattern = UserTravelPattern(**pattern_data)
            key = self._get_pattern_key(temp_pattern)
            
            if key in existing_dict:
                # Update existing pattern
                existing = existing_dict[key]
                existing.frequency = pattern_data["frequency"]
                existing.last_traveled = pattern_data["last_traveled"]
                patterns_updated += 1
            else:
                # Create new pattern
                new_pattern = UserTravelPattern(**pattern_data)
                self.db.add(new_pattern)
                patterns_updated += 1
        
        # Commit changes
        self.db.commit()
        logger.info(f"Updated {patterns_updated} travel patterns for user {user_id}")
        
        return patterns_updated
    
    def update_all_user_travel_patterns(self) -> int:
        """
        Update travel patterns for all users
        
        Returns:
            Total number of patterns updated
        """
        users = self.db.query(User).all()
        total_updated = 0
        
        for user in users:
            total_updated += self.update_user_travel_patterns(user.id)
        
        return total_updated
    
    def update_pattern_after_ride(self, user_id: int, ride_id: int) -> bool:
        """
        Update travel patterns after a ride is completed
        
        Args:
            user_id: The ID of the user
            ride_id: The ID of the completed ride
            
        Returns:
            True if pattern was updated, False otherwise
        """
        # Get the ride
        ride = self.db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            logger.warning(f"Ride {ride_id} not found")
            return False
        
        # Check if this is a completed ride
        booking = self.db.query(RideBooking).filter(
            RideBooking.ride_id == ride_id,
            RideBooking.user_id == user_id,
            RideBooking.status == "completed"
        ).first()
        
        if not booking:
            logger.warning(f"No completed booking found for user {user_id} and ride {ride_id}")
            return False
        
        # Extract pattern data from ride
        if ride.destination_hub_id:
            # Hub-to-hub ride
            origin_type = "hub"
            origin_id = ride.starting_hub_id
            destination_type = "hub"
            destination_id = ride.destination_hub_id
            origin_lat, origin_lon = self._get_hub_coordinates(ride.starting_hub_id)
            dest_lat, dest_lon = self._get_hub_coordinates(ride.destination_hub_id)
        elif hasattr(ride, 'destination_latitude') and ride.destination_latitude:
            # Hub-to-destination ride
            origin_type = "hub"
            origin_id = ride.starting_hub_id
            destination_type = "custom"
            destination_id = None
            origin_lat, origin_lon = self._get_hub_coordinates(ride.starting_hub_id)
            dest_lat, dest_lon = ride.destination_latitude, ride.destination_longitude
        else:
            # Skip rides with incomplete data
            return False
        
        # Get day of week and time
        day_of_week = ride.departure_time.weekday()
        departure_time = ride.departure_time.time()
        
        # Look for existing pattern
        existing_pattern = self.db.query(UserTravelPattern).filter(
            UserTravelPattern.user_id == user_id,
            UserTravelPattern.origin_type == origin_type,
            UserTravelPattern.origin_id == origin_id,
            UserTravelPattern.destination_type == destination_type,
            UserTravelPattern.destination_id == destination_id,
            UserTravelPattern.day_of_week == day_of_week,
            func.abs(func.extract('hour', UserTravelPattern.departure_time) - 
                    func.extract('hour', departure_time)) < 1
        ).first()
        
        if existing_pattern:
            # Update existing pattern
            existing_pattern.frequency += 1
            existing_pattern.last_traveled = ride.departure_time.date()
            self.db.commit()
            logger.info(f"Updated existing travel pattern for user {user_id}")
            return True
        else:
            # Create new pattern
            new_pattern = UserTravelPattern(
                user_id=user_id,
                origin_type=origin_type,
                origin_id=origin_id,
                origin_latitude=origin_lat,
                origin_longitude=origin_lon,
                destination_type=destination_type,
                destination_id=destination_id,
                destination_latitude=dest_lat,
                destination_longitude=dest_lon,
                day_of_week=day_of_week,
                departure_time=departure_time,
                frequency=1,
                last_traveled=ride.departure_time.date()
            )
            self.db.add(new_pattern)
            self.db.commit()
            logger.info(f"Created new travel pattern for user {user_id}")
            return True
    
    def _get_hub_coordinates(self, hub_id: int) -> tuple:
        """Get coordinates for a hub"""
        hub = self.db.query(Hub).filter(Hub.id == hub_id).first()
        if hub and hasattr(hub, 'latitude') and hasattr(hub, 'longitude'):
            return hub.latitude, hub.longitude
        return 0.0, 0.0
    
    def _get_pattern_key(self, pattern: UserTravelPattern) -> str:
        """Generate a unique key for a travel pattern"""
        return (
            f"{pattern.origin_type}:{pattern.origin_id}|"
            f"{pattern.destination_type}:{pattern.destination_id}|"
            f"{pattern.day_of_week}:{pattern.departure_time.hour}"
        )
