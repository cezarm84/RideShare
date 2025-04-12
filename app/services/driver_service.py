import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from sqlalchemy import and_, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.ride import Ride, RideBooking
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.driver import DriverCreate, DriverUpdate
from app.tasks.travel_pattern_updater import update_travel_pattern_after_ride

logger = logging.getLogger(__name__)


class DriverService:
    """Service for managing driver operations and status"""

    def __init__(self, db: Optional[Session] = None):
        """
        Initialize with optional database session

        Args:
            db: SQLAlchemy database session
        """
        self.db = db

    def create_driver(self, driver_data: DriverCreate, db: Session) -> Optional[Driver]:
        """
        Create a new driver

        Args:
            driver_data: Driver creation data
            db: Database session

        Returns:
            Newly created Driver object or None if creation failed
        """
        try:
            # Check if user exists
            user = db.query(User).filter(User.id == driver_data.user_id).first()
            if not user:
                logger.error(
                    f"Cannot create driver: User ID {driver_data.user_id} not found"
                )
                return None

            # Create new driver
            driver = Driver(
                user_id=driver_data.user_id,
                license_number=driver_data.license_number,
                license_expiry=driver_data.license_expiry,
                status=driver_data.status or "INACTIVE",
                rating=driver_data.rating or 0.0,
                is_verified=driver_data.is_verified or False,
                current_location=None,  # Will be updated when driver goes online
                created_at=datetime.utcnow(),
            )

            db.add(driver)
            db.commit()
            db.refresh(driver)
            logger.info(
                f"Created new driver with ID {driver.id} for user {driver.user_id}"
            )
            return driver

        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error creating driver: {str(e)}")
            return None
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error creating driver: {str(e)}")
            return None

    def get_driver(self, driver_id: int, db: Session) -> Optional[Driver]:
        """
        Get driver by ID

        Args:
            driver_id: Driver ID
            db: Database session

        Returns:
            Driver object or None if not found
        """
        try:
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            return driver
        except Exception as e:
            logger.error(f"Error retrieving driver {driver_id}: {str(e)}")
            return None

    def get_driver_by_user_id(self, user_id: int, db: Session) -> Optional[Driver]:
        """
        Get driver by user ID

        Args:
            user_id: User ID
            db: Database session

        Returns:
            Driver object or None if not found
        """
        try:
            driver = db.query(Driver).filter(Driver.user_id == user_id).first()
            return driver
        except Exception as e:
            logger.error(f"Error retrieving driver for user {user_id}: {str(e)}")
            return None

    def update_driver(
        self, driver_id: int, driver_data: DriverUpdate, db: Session
    ) -> Optional[Driver]:
        """
        Update driver information

        Args:
            driver_id: Driver ID to update
            driver_data: Updated driver data
            db: Database session

        Returns:
            Updated Driver object or None if update failed
        """
        try:
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if not driver:
                logger.warning(f"Cannot update driver: Driver ID {driver_id} not found")
                return None

            # Update driver attributes that are provided
            update_data = driver_data.dict(exclude_unset=True)
            for key, value in update_data.items():
                if hasattr(driver, key):
                    setattr(driver, key, value)

            # Update last_updated timestamp
            driver.last_updated = datetime.utcnow()

            db.commit()
            db.refresh(driver)
            logger.info(f"Updated driver ID {driver_id}")
            return driver

        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating driver {driver_id}: {str(e)}")
            return None
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error updating driver {driver_id}: {str(e)}")
            return None

    def delete_driver(self, driver_id: int, db: Session) -> bool:
        """
        Delete a driver

        Args:
            driver_id: Driver ID to delete
            db: Database session

        Returns:
            True if deletion successful, False otherwise
        """
        try:
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if not driver:
                logger.warning(f"Cannot delete driver: Driver ID {driver_id} not found")
                return False

            # Check if driver has any active rides
            active_rides = (
                db.query(Ride)
                .filter(
                    and_(
                        Ride.driver_id == driver_id,
                        Ride.status.in_(["ACCEPTED", "IN_PROGRESS"]),
                    )
                )
                .count()
            )

            if active_rides > 0:
                logger.warning(
                    f"Cannot delete driver {driver_id}: Driver has {active_rides} active rides"
                )
                return False

            # Delete the driver
            db.delete(driver)
            db.commit()
            logger.info(f"Deleted driver ID {driver_id}")
            return True

        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error deleting driver {driver_id}: {str(e)}")
            return False
        except Exception as e:
            db.rollback()
            logger.error(f"Unexpected error deleting driver {driver_id}: {str(e)}")
            return False

    def update_driver_location(
        self, driver_id: int, latitude: float, longitude: float, db: Session
    ) -> bool:
        """
        Update driver's current location

        Args:
            driver_id: Driver ID
            latitude: Current latitude
            longitude: Current longitude
            db: Database session

        Returns:
            True if update successful, False otherwise
        """
        try:
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if not driver:
                logger.warning(
                    f"Cannot update location: Driver ID {driver_id} not found"
                )
                return False

            # Update location using PostgreSQL/PostGIS POINT type
            driver.current_location = f"POINT({longitude} {latitude})"
            driver.last_location_update = datetime.utcnow()

            db.commit()
            logger.info(
                f"Updated location for driver {driver_id}: ({latitude}, {longitude})"
            )
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating driver location for {driver_id}: {str(e)}")
            return False

    def update_driver_status(self, driver_id: int, status: str, db: Session) -> bool:
        """
        Update driver's status

        Args:
            driver_id: Driver ID
            status: New status (ONLINE, OFFLINE, ON_TRIP, INACTIVE)
            db: Database session

        Returns:
            True if update successful, False otherwise
        """
        valid_statuses = ["ONLINE", "OFFLINE", "ON_TRIP", "INACTIVE"]
        if status not in valid_statuses:
            logger.error(f"Invalid status {status} for driver {driver_id}")
            return False

        try:
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if not driver:
                logger.warning(f"Cannot update status: Driver ID {driver_id} not found")
                return False

            # Check if status transition is valid
            if status == "ONLINE" and not driver.is_verified:
                logger.warning(f"Driver {driver_id} cannot go online: not verified")
                return False

            # Update status and timestamp
            driver.status = status
            driver.last_status_change = datetime.utcnow()

            db.commit()
            logger.info(f"Updated status for driver {driver_id} to {status}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Error updating driver status for {driver_id}: {str(e)}")
            return False

    def find_available_drivers(
        self,
        pickup_lat: float,
        pickup_lng: float,
        max_distance_km: float = 5.0,
        vehicle_type_id: Optional[int] = None,
        db: Session = None,
    ) -> List[Dict]:
        """
        Find available drivers near a pickup location

        Args:
            pickup_lat: Pickup latitude
            pickup_lng: Pickup longitude
            max_distance_km: Maximum distance in kilometers
            vehicle_type_id: Optional vehicle type filter
            db: Database session (uses self.db if not provided)

        Returns:
            List of available drivers with distances
        """
        db = db or self.db
        if not db:
            logger.error("Database session required to find available drivers")
            return []

        try:
            # Create PostGIS point for pickup location
            pickup_point = f"POINT({pickup_lng} {pickup_lat})"

            # Build the base query
            # PostGIS ST_Distance_Sphere calculates distance in meters
            query = (
                db.query(
                    Driver,
                    Vehicle,
                    func.ST_Distance_Sphere(
                        func.ST_GeomFromText(Driver.current_location),
                        func.ST_GeomFromText(pickup_point),
                    ).label("distance"),
                )
                .join(Vehicle, Vehicle.driver_id == Driver.id)
                .filter(
                    and_(
                        Driver.status == "ONLINE",
                        Driver.is_verified == True,
                        Driver.current_location.isnot(None),
                        Vehicle.is_active == True,
                    )
                )
            )

            # Add vehicle type filter if provided
            if vehicle_type_id:
                query = query.filter(Vehicle.vehicle_type_id == vehicle_type_id)

            # Add distance filter (max_distance_km in kilometers, convert to meters)
            query = query.filter(
                func.ST_Distance_Sphere(
                    func.ST_GeomFromText(Driver.current_location),
                    func.ST_GeomFromText(pickup_point),
                )
                <= max_distance_km * 1000
            )

            # Order by distance (closest first)
            query = query.order_by("distance")

            # Execute query
            results = query.all()

            # Format the response
            available_drivers = []
            for driver, vehicle, distance in results:
                available_drivers.append(
                    {
                        "driver_id": driver.id,
                        "user_id": driver.user_id,
                        "rating": driver.rating,
                        "vehicle_id": vehicle.id,
                        "vehicle_type_id": vehicle.vehicle_type_id,
                        "license_plate": vehicle.license_plate,
                        "distance_km": round(
                            distance / 1000, 2
                        ),  # Convert meters to kilometers
                        "estimated_arrival_minutes": round(
                            distance / 1000 * 2
                        ),  # Rough estimate: 2 min per km
                    }
                )

            logger.info(
                f"Found {len(available_drivers)} available drivers near ({pickup_lat}, {pickup_lng})"
            )
            return available_drivers

        except Exception as e:
            logger.error(f"Error finding available drivers: {str(e)}")
            return []

    def assign_ride(self, driver_id: int, ride_id: int, db: Session) -> bool:
        """
        Assign a ride to a driver

        Args:
            driver_id: Driver ID
            ride_id: Ride ID
            db: Database session

        Returns:
            True if assignment successful, False otherwise
        """
        try:
            # Check if driver exists and is available
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if not driver:
                logger.error(f"Cannot assign ride: Driver ID {driver_id} not found")
                return False

            if driver.status != "ONLINE":
                logger.error(
                    f"Cannot assign ride: Driver {driver_id} is not online (status: {driver.status})"
                )
                return False

            # Check if ride exists and is pending
            ride = db.query(Ride).filter(Ride.id == ride_id).first()
            if not ride:
                logger.error(f"Cannot assign ride: Ride ID {ride_id} not found")
                return False

            if ride.status != "PENDING":
                logger.error(
                    f"Cannot assign ride: Ride {ride_id} is not pending (status: {ride.status})"
                )
                return False

            # Update ride with driver assignment
            ride.driver_id = driver_id
            ride.status = "ACCEPTED"
            ride.accepted_at = datetime.utcnow()

            # Update driver status
            driver.status = "ON_TRIP"
            driver.last_status_change = datetime.utcnow()

            db.commit()
            logger.info(f"Assigned ride {ride_id} to driver {driver_id}")
            return True

        except SQLAlchemyError as e:
            db.rollback()
            logger.error(
                f"Database error assigning ride {ride_id} to driver {driver_id}: {str(e)}"
            )
            return False
        except Exception as e:
            db.rollback()
            logger.error(
                f"Unexpected error assigning ride {ride_id} to driver {driver_id}: {str(e)}"
            )
            return False

    def complete_ride(self, driver_id: int, ride_id: int, db: Session) -> bool:
        """
        Mark a ride as complete

        Args:
            driver_id: Driver ID
            ride_id: Ride ID
            db: Database session

        Returns:
            True if completion successful, False otherwise
        """
        try:
            # Check if ride exists and is assigned to this driver
            ride = (
                db.query(Ride)
                .filter(
                    and_(
                        Ride.id == ride_id,
                        Ride.driver_id == driver_id,
                        Ride.status == "IN_PROGRESS",
                    )
                )
                .first()
            )

            if not ride:
                logger.error(
                    f"Cannot complete ride: Ride {ride_id} not found, not assigned to driver {driver_id}, or not in progress"
                )
                return False

            # Get driver
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if not driver:
                logger.error(f"Cannot complete ride: Driver {driver_id} not found")
                return False

            # Update ride status
            ride.status = "COMPLETED"
            ride.completed_at = datetime.utcnow()

            # Calculate ride duration and distance if needed
            if ride.started_at:
                ride.duration_minutes = round(
                    (datetime.utcnow() - ride.started_at).total_seconds() / 60
                )

            # Update driver status back to ONLINE
            driver.status = "ONLINE"
            driver.last_status_change = datetime.utcnow()

            db.commit()
            logger.info(f"Completed ride {ride_id} by driver {driver_id}")

            # Update travel patterns for all passengers
            try:
                # Get all bookings for this ride
                bookings = (
                    db.query(RideBooking).filter(RideBooking.ride_id == ride_id).all()
                )
                for booking in bookings:
                    # Update travel pattern for each passenger
                    update_travel_pattern_after_ride(booking.passenger_id, ride_id)
                    logger.info(
                        f"Updated travel pattern for passenger {booking.passenger_id} after ride {ride_id}"
                    )
            except Exception as e:
                # Don't fail the ride completion if travel pattern update fails
                logger.error(
                    f"Error updating travel patterns for ride {ride_id}: {str(e)}"
                )

            return True

        except Exception as e:
            db.rollback()
            logger.error(
                f"Error completing ride {ride_id} by driver {driver_id}: {str(e)}"
            )
            return False

    def start_ride(self, driver_id: int, ride_id: int, db: Session) -> bool:
        """
        Mark a ride as started (in progress)

        Args:
            driver_id: Driver ID
            ride_id: Ride ID
            db: Database session

        Returns:
            True if start successful, False otherwise
        """
        try:
            # Check if ride exists and is assigned to this driver
            ride = (
                db.query(Ride)
                .filter(
                    and_(
                        Ride.id == ride_id,
                        Ride.driver_id == driver_id,
                        Ride.status == "ACCEPTED",
                    )
                )
                .first()
            )

            if not ride:
                logger.error(
                    f"Cannot start ride: Ride {ride_id} not found, not assigned to driver {driver_id}, or not accepted"
                )
                return False

            # Update ride status
            ride.status = "IN_PROGRESS"
            ride.started_at = datetime.utcnow()

            db.commit()
            logger.info(f"Started ride {ride_id} by driver {driver_id}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(
                f"Error starting ride {ride_id} by driver {driver_id}: {str(e)}"
            )
            return False

    def cancel_ride(
        self, driver_id: int, ride_id: int, reason: str, db: Session
    ) -> bool:
        """
        Cancel a ride assigned to a driver

        Args:
            driver_id: Driver ID
            ride_id: Ride ID
            reason: Cancellation reason
            db: Database session

        Returns:
            True if cancellation successful, False otherwise
        """
        try:
            # Check if ride exists and is assigned to this driver
            ride = (
                db.query(Ride)
                .filter(
                    and_(
                        Ride.id == ride_id,
                        Ride.driver_id == driver_id,
                        Ride.status.in_(["ACCEPTED", "IN_PROGRESS"]),
                    )
                )
                .first()
            )

            if not ride:
                logger.error(
                    f"Cannot cancel ride: Ride {ride_id} not found, not assigned to driver {driver_id}, or in wrong status"
                )
                return False

            # Get driver
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if not driver:
                logger.error(f"Cannot cancel ride: Driver {driver_id} not found")
                return False

            # Update ride status
            ride.status = "CANCELLED"
            ride.cancelled_at = datetime.utcnow()
            ride.cancellation_reason = reason
            ride.cancelled_by = "DRIVER"

            # Update driver status back to ONLINE
            driver.status = "ONLINE"
            driver.last_status_change = datetime.utcnow()

            db.commit()
            logger.info(f"Cancelled ride {ride_id} by driver {driver_id}: {reason}")
            return True

        except Exception as e:
            db.rollback()
            logger.error(
                f"Error cancelling ride {ride_id} by driver {driver_id}: {str(e)}"
            )
            return False

    def get_driver_statistics(
        self, driver_id: int, period_days: int = 30, db: Session = None
    ) -> Dict:
        """
        Get driver statistics for a given period

        Args:
            driver_id: Driver ID
            period_days: Period in days (default 30)
            db: Database session (uses self.db if not provided)

        Returns:
            Dictionary with driver statistics
        """
        db = db or self.db
        if not db:
            logger.error("Database session required to get driver statistics")
            return {}

        try:
            # Calculate start date for the period
            start_date = datetime.utcnow() - timedelta(days=period_days)

            # Get driver
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if not driver:
                logger.error(f"Cannot get statistics: Driver {driver_id} not found")
                return {}

            # Get completed rides count
            completed_rides_count = (
                db.query(func.count(Ride.id))
                .filter(
                    and_(
                        Ride.driver_id == driver_id,
                        Ride.status == "COMPLETED",
                        Ride.completed_at >= start_date,
                    )
                )
                .scalar()
                or 0
            )

            # Get cancelled rides count
            cancelled_rides_count = (
                db.query(func.count(Ride.id))
                .filter(
                    and_(
                        Ride.driver_id == driver_id,
                        Ride.status == "CANCELLED",
                        Ride.cancelled_at >= start_date,
                    )
                )
                .scalar()
                or 0
            )

            # Get total earnings
            total_earnings = (
                db.query(func.sum(Ride.fare_amount))
                .filter(
                    and_(
                        Ride.driver_id == driver_id,
                        Ride.status == "COMPLETED",
                        Ride.completed_at >= start_date,
                    )
                )
                .scalar()
                or 0
            )

            # Get total ride minutes
            total_minutes = (
                db.query(func.sum(Ride.duration_minutes))
                .filter(
                    and_(
                        Ride.driver_id == driver_id,
                        Ride.status == "COMPLETED",
                        Ride.completed_at >= start_date,
                    )
                )
                .scalar()
                or 0
            )

            # Get total distance
            total_distance = (
                db.query(func.sum(Ride.distance_km))
                .filter(
                    and_(
                        Ride.driver_id == driver_id,
                        Ride.status == "COMPLETED",
                        Ride.completed_at >= start_date,
                    )
                )
                .scalar()
                or 0
            )

            # Calculate acceptance rate
            total_offered = completed_rides_count + cancelled_rides_count
            acceptance_rate = (
                (completed_rides_count / total_offered * 100)
                if total_offered > 0
                else 0
            )

            return {
                "driver_id": driver_id,
                "period_days": period_days,
                "completed_rides": completed_rides_count,
                "cancelled_rides": cancelled_rides_count,
                "acceptance_rate": round(acceptance_rate, 1),
                "total_earnings": round(total_earnings, 2),
                "total_ride_minutes": total_minutes,
                "total_distance_km": round(total_distance, 2),
                "average_rating": driver.rating,
                "status": driver.status,
            }

        except Exception as e:
            logger.error(f"Error getting statistics for driver {driver_id}: {str(e)}")
            return {}


# Create a singleton instance
driver_service = DriverService()
