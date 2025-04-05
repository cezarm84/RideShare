from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.models.ride import Ride, RideBooking
from app.models.location import Hub, Location
from app.models.user import User
from app.schemas.ride import RideCreate
import logging

logger = logging.getLogger(__name__)

class RideService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_detailed_rides(
        self, 
        destination_id: Optional[int] = None, 
        hub_id: Optional[int] = None,
        include_passengers: bool = False,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Ride]:
        """
        Get detailed rides with hub and destination information.
        Optionally include passenger information.
        """
        # Start with a base query
        query = self.db.query(Ride)
        
        # Join with Hub and Location to get their details
        query = query.options(joinedload(Ride.starting_hub).joinedload(Hub.address))
        query = query.options(joinedload(Ride.destination).joinedload(Location.address))
        
        # Include bookings and passenger details if requested
        if include_passengers:
            query = query.options(
                joinedload(Ride.bookings).joinedload(RideBooking.user)  # Use the correct relationship
            )
            
        # Apply filters if provided
        if destination_id:
            query = query.filter(Ride.destination_id == destination_id)
        if hub_id:
            query = query.filter(Ride.starting_hub_id == hub_id)
        if status:
            query = query.filter(Ride.status == status)
            
        # Order by departure time
        query = query.order_by(Ride.departure_time)
        
        # Apply limit
        query = query.limit(limit)
        
        # Execute query and get results
        rides = query.all()
        
        # Post-process the results
        for ride in rides:
            # Calculate total passengers
            ride.total_passengers = sum(booking.passenger_count for booking in ride.bookings) if ride.bookings else 0
                
        return rides
    
    def get_ride_by_id(self, ride_id: int, include_passengers: bool = False) -> Optional[Ride]:
        """
        Get detailed information about a specific ride including hub and destination.
        Optionally include passenger information.
        """
        try:
            # Start with a base query for the specific ride
            query = self.db.query(Ride).filter(Ride.id == ride_id)
            
            # Join with Hub and Location to get their details
            query = query.options(joinedload(Ride.starting_hub).joinedload(Hub.address))
            query = query.options(joinedload(Ride.destination).joinedload(Location.address))
            
            # Include bookings and passenger details if requested
            if include_passengers:
                query = query.options(
                    joinedload(Ride.bookings).joinedload(RideBooking.user)  # Use the correct relationship
                )
                
            # Execute query and get the ride
            ride = query.first()
            
            if ride:
                # Calculate total passengers
                ride.total_passengers = sum(booking.passenger_count for booking in ride.bookings) if ride.bookings else 0
                
            return ride
        except Exception as e:
            logger.error(f"Error fetching ride by ID {ride_id}: {str(e)}")
            # Return None on error
            return None
    
    def get_available_locations(self) -> List[Dict[str, Any]]:
        """Get all available locations with their IDs."""
        locations = self.db.query(Location).all()
        return [{"id": loc.id, "name": loc.name} for loc in locations]
    
    def get_available_hubs(self) -> List[Dict[str, Any]]:
        """Get all available hubs with their IDs."""
        hubs = self.db.query(Hub).all()
        return [{"id": hub.id, "name": hub.name} for hub in hubs]
    
    def create_ride(self, ride_data: RideCreate) -> Ride:
        """Create a new ride."""
        # Check if hub exists
        hub = self.db.query(Hub).filter(Hub.id == ride_data.starting_hub_id).first()
        if not hub:
            # Get list of available hubs
            available_hubs = self.get_available_hubs()
            hub_ids = [h["id"] for h in available_hubs]
            hub_names = [f"{h['id']}: {h['name']}" for h in available_hubs]
            
            error_msg = f"Hub with ID {ride_data.starting_hub_id} not found. Available hub IDs: {hub_ids}. Available hubs: {hub_names}"
            logger.warning(error_msg)
            raise ValueError(error_msg)
            
        # Check if destination exists
        destination = self.db.query(Location).filter(Location.id == ride_data.destination_id).first()
        if not destination:
            # Get list of available destinations
            available_locations = self.get_available_locations()
            location_ids = [loc["id"] for loc in available_locations]
            location_names = [f"{loc['id']}: {loc['name']}" for loc in available_locations]
            
            error_msg = f"Destination with ID {ride_data.destination_id} not found. Available destination IDs: {location_ids}. Available destinations: {location_names}"
            logger.warning(error_msg)
            raise ValueError(error_msg)
        
        # Create the new ride
        ride = Ride(
            starting_hub_id=ride_data.starting_hub_id,
            destination_id=ride_data.destination_id,
            departure_time=ride_data.departure_time,
            vehicle_type=ride_data.vehicle_type,
            capacity=ride_data.capacity,
            available_seats=ride_data.capacity,  # Initially all seats are available
            status=ride_data.status
        )
        
        # Add to database and commit
        try:
            self.db.add(ride)
            self.db.commit()
            self.db.refresh(ride)
            
            # Load the hub and destination directly instead of using get_ride_by_id
            # to avoid any potential database schema issues
            ride.starting_hub = hub
            ride.destination = destination
            ride.total_passengers = 0
            
            return ride
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating ride: {str(e)}")
            raise
    
    def get_ride_bookings(self, ride_id: int) -> List[RideBooking]:
        """Get all bookings for a specific ride."""
        return self.db.query(RideBooking).filter(RideBooking.ride_id == ride_id).all()