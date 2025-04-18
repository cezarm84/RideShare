import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.driver import DriverVehicle
from app.models.hub import Hub
from app.models.ride import (
    RecurrencePattern,
    RecurringRidePattern,
    Ride,
    RideBooking,
    RideDepartureTime,
    RideStatus,
    RideType,
)
from app.models.user import Enterprise
from app.models.vehicle import VehicleType

logger = logging.getLogger(__name__)


class RideService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def create_ride(
        db: Session, ride_data: dict, driver_id: Optional[int] = None
    ) -> Union[Ride, List[Ride]]:
        """
        Create rides based on the specified pattern

        For one-time rides, returns a single Ride.
        For recurring rides, creates the pattern and returns a list of generated Rides.
        """
        # Only check vehicle inspection status if a driver is specified
        if driver_id is not None:
            # Check if driver has a vehicle with passed inspection status
            driver_vehicles = (
                db.query(DriverVehicle)
                .filter(
                    DriverVehicle.driver_id == driver_id, DriverVehicle.is_primary == True
                )
                .all()
            )

            # Check if any of the driver's primary vehicles have passed inspection
            has_passed_vehicle = False
            for vehicle in driver_vehicles:
                if vehicle.inspection_status == "passed":
                    has_passed_vehicle = True
                    break

            if not has_passed_vehicle:
                raise ValueError(
                    "Driver does not have any vehicles with passed inspection status. Cannot create rides."
                )

        # Validate that starting hub exists
        starting_hub = (
            db.query(Hub).filter(Hub.id == ride_data.get("starting_hub_id")).first()
        )
        if not starting_hub:
            raise ValueError(
                f"Starting hub with ID {ride_data.get('starting_hub_id')} not found"
            )

        # Initialize destination variables
        destination_hub = None
        destination_lat = None
        destination_lng = None
        destination_json = None

        # Handle destination based on ride type
        ride_type = ride_data.get("ride_type", RideType.HUB_TO_HUB)

        if ride_type == RideType.HUB_TO_HUB:
            # Using a hub as destination (required for hub_to_hub)
            if not ride_data.get("destination_hub_id"):
                raise ValueError("Hub-to-hub rides require a destination hub ID")

            destination_hub = (
                db.query(Hub)
                .filter(Hub.id == ride_data.get("destination_hub_id"))
                .first()
            )
            if not destination_hub:
                raise ValueError(
                    f"Destination hub with ID {ride_data.get('destination_hub_id')} not found"
                )

            destination_lat = destination_hub.latitude
            destination_lng = destination_hub.longitude

        elif ride_type == RideType.HUB_TO_DESTINATION:
            # Using a custom destination
            if not ride_data.get("destination"):
                raise ValueError("Hub-to-destination rides require destination details")

            destination_json = ride_data.get("destination")

            # If destination has coordinates, extract them
            if isinstance(destination_json, dict):
                destination_lat = destination_json.get(
                    "latitude"
                ) or destination_json.get("lat")
                destination_lng = destination_json.get(
                    "longitude"
                ) or destination_json.get("lng")

        elif ride_type == RideType.ENTERPRISE:
            # Validate enterprise ID
            if not ride_data.get("enterprise_id"):
                raise ValueError("Enterprise rides require an enterprise_id")

            enterprise = (
                db.query(Enterprise)
                .filter(Enterprise.id == ride_data.get("enterprise_id"))
                .first()
            )
            if not enterprise:
                raise ValueError(
                    f"Enterprise with ID {ride_data.get('enterprise_id')} not found"
                )

            # For enterprise rides, check if it's hub-to-hub or hub-to-destination
            if ride_data.get("destination_hub_id"):
                # Using a hub as destination
                destination_hub = (
                    db.query(Hub)
                    .filter(Hub.id == ride_data.get("destination_hub_id"))
                    .first()
                )
                if not destination_hub:
                    raise ValueError(
                        f"Destination hub with ID {ride_data.get('destination_hub_id')} not found"
                    )

                destination_lat = destination_hub.latitude
                destination_lng = destination_hub.longitude
            elif ride_data.get("destination"):
                # Using a custom destination
                destination_json = ride_data.get("destination")

                # If destination has coordinates, extract them
                if isinstance(destination_json, dict):
                    destination_lat = destination_json.get(
                        "latitude"
                    ) or destination_json.get("lat")
                    destination_lng = destination_json.get(
                        "longitude"
                    ) or destination_json.get("lng")
            else:
                # Use the enterprise's address as the destination
                if enterprise.latitude is not None and enterprise.longitude is not None:
                    destination_lat = enterprise.latitude
                    destination_lng = enterprise.longitude

                    # Create a destination object from the enterprise data
                    destination_json = {
                        "name": enterprise.name,
                        "address": enterprise.address,
                        "city": enterprise.city,
                        "postal_code": enterprise.postal_code,
                        "country": enterprise.country,
                        "latitude": enterprise.latitude,
                        "longitude": enterprise.longitude,
                    }

                    # Add the destination to the ride data
                    ride_data["destination"] = destination_json
                else:
                    raise ValueError(
                        "Enterprise does not have location coordinates. Please specify a destination or update the enterprise with latitude/longitude."
                    )

        # Validate vehicle type
        vehicle_type = (
            db.query(VehicleType)
            .filter(VehicleType.id == ride_data.get("vehicle_type_id"))
            .first()
        )
        if not vehicle_type:
            raise ValueError(
                f"Vehicle type with ID {ride_data.get('vehicle_type_id')} not found"
            )

        # Handle recurrence pattern
        recurrence_pattern = ride_data.get("recurrence_pattern")

        if recurrence_pattern == RecurrencePattern.ONE_TIME or not recurrence_pattern:
            # Create a single ride
            departure_time = ride_data.get("departure_time")
            if not departure_time:
                raise ValueError("One-time rides require a departure_time")

            # Convert string departure_time to datetime object if needed
            logger.info(
                f"Original departure_time: {departure_time}, type: {type(departure_time)}"
            )
            if isinstance(departure_time, str):
                try:
                    # Try common formats
                    formats_to_try = [
                        "%Y-%m-%dT%H:%M:%S.%fZ",
                        "%Y-%m-%dT%H:%M:%SZ",
                        "%Y-%m-%dT%H:%M:%S",
                        "%Y-%m-%dT%H:%M",
                        "%Y-%m-%d %H:%M:%S",
                        "%Y-%m-%d %H:%M",
                    ]

                    parsed = False
                    for fmt in formats_to_try:
                        try:
                            departure_time = datetime.strptime(departure_time, fmt)
                            parsed = True
                            logger.info(
                                f"Parsed departure_time with format {fmt}: {departure_time}"
                            )
                            break
                        except ValueError:
                            continue

                    # If none of the formats worked, try ISO format
                    if not parsed:
                        try:
                            departure_time = datetime.fromisoformat(
                                departure_time.replace("Z", "+00:00")
                            )
                            logger.info(
                                f"Parsed departure_time with ISO format: {departure_time}"
                            )
                        except ValueError as e:
                            logger.error(f"Failed to parse departure_time: {e}")
                            raise ValueError(
                                f"Invalid departure_time format: {departure_time}"
                            )
                except Exception as e:
                    logger.error(f"Error parsing departure_time: {e}")
                    raise ValueError(f"Invalid departure_time format: {e}")

            logger.info(
                f"Final departure_time: {departure_time}, type: {type(departure_time)}"
            )

            # Create ride data dictionary
            ride_attrs = {
                "ride_type": ride_type,
                # Set enterprise_id property but don't include it in the SQL INSERT
                "starting_hub_id": ride_data.get("starting_hub_id"),
                "destination_hub_id": ride_data.get("destination_hub_id"),
                "destination": destination_json,
                "origin_lat": starting_hub.latitude,
                "origin_lng": starting_hub.longitude,
                "destination_lat": destination_lat,
                "destination_lng": destination_lng,
                "departure_time": departure_time,
                "status": ride_data.get("status", RideStatus.SCHEDULED),
                "available_seats": ride_data.get("available_seats", 4),
                "price_per_seat": ride_data.get("price_per_seat"),
                "vehicle_type_id": ride_data.get("vehicle_type_id"),
                # is_recurring is handled through a property
            }

            # Only add driver_id if it's provided
            if driver_id is not None:
                ride_attrs["driver_id"] = driver_id

            new_ride = Ride(**ride_attrs)

            db.add(new_ride)
            db.commit()
            db.refresh(new_ride)

            # Set properties after committing to the database
            if ride_data.get("enterprise_id"):
                new_ride._enterprise_id = ride_data.get("enterprise_id")

            # Set destination property if it exists
            if ride_data.get("destination"):
                new_ride._destination = ride_data.get("destination")

            return new_ride
        else:
            # Create a recurring ride pattern
            if not ride_data.get("start_date"):
                raise ValueError(f"{recurrence_pattern} rides require a start_date")

            if not ride_data.get("departure_times"):
                raise ValueError(f"{recurrence_pattern} rides require departure_times")

            # Create the parent ride
            # Use the first occurrence as the departure time for the parent ride
            start_date = ride_data.get("start_date")
            first_departure_time = ride_data.get("departure_times")[0]

            if isinstance(first_departure_time, str):
                # Parse time string to time object
                try:
                    first_departure_time = datetime.strptime(
                        first_departure_time, "%H:%M"
                    ).time()
                except ValueError:
                    try:
                        first_departure_time = datetime.strptime(
                            first_departure_time, "%H:%M:%S"
                        ).time()
                    except ValueError:
                        raise ValueError(f"Invalid time format: {first_departure_time}")

            # Combine date and time for parent ride
            if isinstance(start_date, str):
                # Parse date string to date object
                try:
                    start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
                except ValueError:
                    raise ValueError(f"Invalid date format: {start_date}")

            first_departure = datetime.combine(start_date, first_departure_time)

            # Create ride data dictionary for parent ride
            parent_ride_attrs = {
                "ride_type": ride_type,
                # Set enterprise_id property but don't include it in the SQL INSERT
                "starting_hub_id": ride_data.get("starting_hub_id"),
                "destination_hub_id": ride_data.get("destination_hub_id"),
                "destination": destination_json,
                "origin_lat": starting_hub.latitude,
                "origin_lng": starting_hub.longitude,
                "destination_lat": destination_lat,
                "destination_lng": destination_lng,
                "departure_time": first_departure,
                "status": ride_data.get("status", RideStatus.SCHEDULED),
                "available_seats": ride_data.get("available_seats", 4),
                "price_per_seat": ride_data.get("price_per_seat"),
                "vehicle_type_id": ride_data.get("vehicle_type_id"),
                # is_recurring is handled through a property
            }

            # Only add driver_id if it's provided
            if driver_id is not None:
                parent_ride_attrs["driver_id"] = driver_id

            parent_ride = Ride(**parent_ride_attrs)

            db.add(parent_ride)
            db.flush()  # Get ID without committing

            # Set properties after flushing to the database
            if ride_data.get("enterprise_id"):
                parent_ride._enterprise_id = ride_data.get("enterprise_id")

            # Set destination property if it exists
            if ride_data.get("destination"):
                parent_ride._destination = ride_data.get("destination")

            # Create the recurrence pattern
            # Convert start_date to date object if it's a string
            if isinstance(start_date, str):
                try:
                    start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
                except ValueError:
                    raise ValueError(
                        f"Invalid start_date format: {start_date}. Expected format: YYYY-MM-DD"
                    )

            # Convert end_date to date object if it's a string
            end_date = None
            if ride_data.get("end_date"):
                if isinstance(ride_data.get("end_date"), str):
                    try:
                        end_date = datetime.strptime(
                            ride_data.get("end_date"), "%Y-%m-%d"
                        ).date()
                    except ValueError:
                        raise ValueError(
                            f"Invalid end_date format: {ride_data.get('end_date')}. Expected format: YYYY-MM-DD"
                        )
                else:
                    end_date = ride_data.get("end_date")

            pattern = RecurringRidePattern(
                ride_id=parent_ride.id,
                recurrence_pattern=recurrence_pattern,
                start_date=start_date,
                end_date=end_date,
            )

            # Set days of week based on pattern
            if recurrence_pattern == RecurrencePattern.WEEKDAYS:
                pattern.days_of_week = "[0,1,2,3,4]"  # Monday to Friday
            elif recurrence_pattern == RecurrencePattern.WEEKLY:
                # Use the day of the start date
                pattern.days_of_week = f"[{start_date.weekday()}]"
            elif recurrence_pattern == RecurrencePattern.DAILY:
                pattern.days_of_week = "[0,1,2,3,4,5,6]"  # All days

            db.add(pattern)
            db.flush()

            # Add departure times
            for departure_time_str in ride_data.get("departure_times"):
                if isinstance(departure_time_str, str):
                    try:
                        time_obj = datetime.strptime(departure_time_str, "%H:%M").time()
                    except ValueError:
                        try:
                            time_obj = datetime.strptime(
                                departure_time_str, "%H:%M:%S"
                            ).time()
                        except ValueError:
                            raise ValueError(
                                f"Invalid time format: {departure_time_str}"
                            )
                else:
                    time_obj = departure_time_str

                departure_time = RideDepartureTime(
                    pattern_id=pattern.id, departure_time=time_obj
                )
                db.add(departure_time)

            db.commit()
            db.refresh(parent_ride)

            # Generate the initial set of rides based on the pattern
            # (for the next 30 days or until end_date, whichever comes first)
            generated_rides = RideService.generate_recurring_rides(
                db, parent_ride.id, days=30
            )

            return [parent_ride] + generated_rides

    @staticmethod
    def generate_recurring_rides(
        db: Session, parent_ride_id: int, days: int = 30
    ) -> List[Ride]:
        """
        Generate individual rides from a recurring pattern

        Args:
            parent_ride_id: ID of the parent ride with the recurrence pattern
            days: Number of days to generate rides for

        Returns:
            List of generated Ride objects
        """
        # Get the parent ride and its pattern
        parent_ride = db.query(Ride).filter(Ride.id == parent_ride_id).first()
        if not parent_ride or not parent_ride.is_recurring:
            raise ValueError(f"Ride with ID {parent_ride_id} is not a recurring ride")

        pattern = (
            db.query(RecurringRidePattern)
            .filter(RecurringRidePattern.ride_id == parent_ride_id)
            .first()
        )

        if not pattern:
            raise ValueError(
                f"No recurrence pattern found for ride ID {parent_ride_id}"
            )

        # Get departure times
        departure_times = (
            db.query(RideDepartureTime)
            .filter(RideDepartureTime.pattern_id == pattern.id)
            .all()
        )

        if not departure_times:
            raise ValueError(f"No departure times found for pattern ID {pattern.id}")

        # Calculate date range
        start_date = pattern.start_date
        if pattern.end_date:
            end_date = min(pattern.end_date, start_date + timedelta(days=days))
        else:
            end_date = start_date + timedelta(days=days)

        # Get the days of week for this pattern
        try:
            import json

            days_of_week = (
                json.loads(pattern.days_of_week) if pattern.days_of_week else []
            )
        except (json.JSONDecodeError, TypeError):
            days_of_week = []

        # Generate dates based on recurrence pattern
        dates_to_generate = []
        current_date = start_date

        while current_date <= end_date:
            # Skip the start date itself since it's the parent ride
            if current_date != start_date:
                if pattern.recurrence_pattern == RecurrencePattern.DAILY:
                    dates_to_generate.append(current_date)
                elif (
                    pattern.recurrence_pattern == RecurrencePattern.WEEKDAYS
                    and current_date.weekday() < 5
                ):
                    dates_to_generate.append(current_date)
                elif (
                    pattern.recurrence_pattern == RecurrencePattern.WEEKLY
                    and current_date.weekday() in days_of_week
                ):
                    dates_to_generate.append(current_date)
                elif (
                    pattern.recurrence_pattern == RecurrencePattern.MONTHLY
                    and current_date.day == start_date.day
                ):
                    dates_to_generate.append(current_date)

            current_date += timedelta(days=1)

        # Create rides for each date and time combination
        generated_rides = []

        for ride_date in dates_to_generate:
            for departure_time_obj in departure_times:
                departure_time = datetime.combine(
                    ride_date, departure_time_obj.departure_time
                )

                # Create a new ride based on the parent ride
                new_ride = Ride(
                    ride_type=parent_ride.ride_type,
                    driver_id=parent_ride.driver_id,
                    enterprise_id=parent_ride.enterprise_id,
                    starting_hub_id=parent_ride.starting_hub_id,
                    destination_hub_id=parent_ride.destination_hub_id,
                    destination=parent_ride.destination,
                    origin_lat=parent_ride.origin_lat,
                    origin_lng=parent_ride.origin_lng,
                    destination_lat=parent_ride.destination_lat,
                    destination_lng=parent_ride.destination_lng,
                    departure_time=departure_time,
                    status=parent_ride.status,
                    available_seats=parent_ride.available_seats,
                    price_per_seat=parent_ride.price_per_seat,
                    vehicle_type_id=parent_ride.vehicle_type_id,
                    parent_ride_id=parent_ride.id,  # Set the parent ride ID
                    is_recurring=False,  # Child rides are not themselves recurring
                )

                db.add(new_ride)
                generated_rides.append(new_ride)

        db.commit()

        # Refresh all generated rides to get their IDs
        for ride in generated_rides:
            db.refresh(ride)

        return generated_rides

    @staticmethod
    def get_ride(db: Session, ride_id: int) -> Optional[Ride]:
        """Get a ride by ID"""
        return db.query(Ride).filter(Ride.id == ride_id).first()

    def get_ride_by_id(
        self, ride_id: int, include_passengers: bool = False
    ) -> Optional[Ride]:
        """Get a ride by ID with optional passenger details"""
        ride = self.db.query(Ride).filter(Ride.id == ride_id).first()

        if ride and include_passengers:
            # Force loading of passengers
            _ = [booking.passenger for booking in ride.bookings]

            # Load detailed passenger information for each booking
            from app.models.booking_passenger import BookingPassenger

            for booking in ride.bookings:
                booking.passengers = (
                    self.db.query(BookingPassenger)
                    .filter(BookingPassenger.booking_id == booking.id)
                    .all()
                )

        return ride

    @staticmethod
    def get_rides_by_hub(
        db: Session, hub_id: int, is_destination: bool = False
    ) -> List[Ride]:
        """Get rides starting or ending at a specific hub"""
        if is_destination:
            return db.query(Ride).filter(Ride.destination_hub_id == hub_id).all()
        else:
            return db.query(Ride).filter(Ride.starting_hub_id == hub_id).all()

    @staticmethod
    def get_enterprise_rides(db: Session, enterprise_id: int) -> List[Ride]:
        """Get all rides for a specific enterprise"""
        return (
            db.query(Ride)
            .filter(
                Ride.enterprise_id == enterprise_id, Ride.status != RideStatus.CANCELLED
            )
            .order_by(Ride.departure_time)
            .all()
        )

    def get_detailed_rides(
        self,
        skip: int = 0,
        limit: int = 50,
        include_passengers: bool = False,
        status: Optional[str] = None,
        future_only: bool = True,
        destination_id: Optional[int] = None,
        hub_id: Optional[int] = None,
        user_id: Optional[int] = None,
    ) -> List[Ride]:
        """Get rides with detailed information including hub and destination details."""
        query = self.db.query(Ride)

        # Apply filters
        if status:
            query = query.filter(Ride.status == status)

        if future_only:
            query = query.filter(Ride.departure_time >= datetime.now())

        if destination_id:
            query = query.filter(Ride.destination_hub_id == destination_id)

        if hub_id:
            query = query.filter(
                (Ride.starting_hub_id == hub_id) | (Ride.destination_hub_id == hub_id)
            )

        if user_id:
            # Filter rides where the user is either the driver or a passenger
            query = (
                query.outerjoin(RideBooking)
                .filter(
                    (Ride.driver_id == user_id) | (RideBooking.passenger_id == user_id)
                )
                .distinct()
            )

        # Apply pagination
        query = query.order_by(Ride.departure_time).offset(skip).limit(limit)

        # Execute query
        rides = query.all()

        # Eager load relationships if needed
        if include_passengers:
            from app.models.booking_passenger import BookingPassenger

            for ride in rides:
                # Force loading of passengers
                _ = [booking.passenger for booking in ride.bookings]

                # Load detailed passenger information for each booking
                for booking in ride.bookings:
                    booking.passengers = (
                        self.db.query(BookingPassenger)
                        .filter(BookingPassenger.booking_id == booking.id)
                        .all()
                    )

        return rides

    @staticmethod
    def get_available_rides(
        db: Session,
        departure_after: Optional[datetime] = None,
        starting_hub_id: Optional[int] = None,
        destination_hub_id: Optional[int] = None,
        enterprise_id: Optional[int] = None,
        ride_type: Optional[str] = None,
    ) -> List[Ride]:
        """Get available rides with optional filtering"""
        query = db.query(Ride).filter(
            Ride.status == RideStatus.SCHEDULED, Ride.available_seats > 0
        )

        if departure_after:
            query = query.filter(Ride.departure_time >= departure_after)

        if starting_hub_id:
            query = query.filter(Ride.starting_hub_id == starting_hub_id)

        if destination_hub_id:
            query = query.filter(Ride.destination_hub_id == destination_hub_id)

        if enterprise_id:
            query = query.filter(Ride.enterprise_id == enterprise_id)

        if ride_type:
            query = query.filter(Ride.ride_type == ride_type)

        return query.order_by(Ride.departure_time).all()

    @staticmethod
    def book_ride(
        db: Session, ride_id: int, passenger_id: int, seats: int = 1
    ) -> RideBooking:
        """Book a ride for a passenger"""
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise ValueError(f"Ride with ID {ride_id} not found")

        if ride.available_seats < seats:
            raise ValueError(
                f"Not enough available seats. Requested: {seats}, Available: {ride.available_seats}"
            )

        # Create booking
        booking = RideBooking(
            ride_id=ride_id,
            passenger_id=passenger_id,
            seats_booked=seats,
            booking_status="confirmed",
        )

        # Update available seats
        ride.available_seats -= seats

        db.add(booking)
        db.commit()
        db.refresh(booking)
        return booking

    @staticmethod
    def update_ride(db: Session, ride_id: int, update_data: dict) -> Ride:
        """Update a ride's details"""
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise ValueError(f"Ride with ID {ride_id} not found")

        # Update ride fields
        for key, value in update_data.items():
            if hasattr(ride, key) and value is not None:
                setattr(ride, key, value)

        # If updating hub IDs, update coordinates too
        if "starting_hub_id" in update_data and update_data["starting_hub_id"]:
            starting_hub = (
                db.query(Hub).filter(Hub.id == update_data["starting_hub_id"]).first()
            )
            if starting_hub:
                ride.origin_lat = starting_hub.latitude
                ride.origin_lng = starting_hub.longitude

        if "destination_hub_id" in update_data and update_data["destination_hub_id"]:
            destination_hub = (
                db.query(Hub)
                .filter(Hub.id == update_data["destination_hub_id"])
                .first()
            )
            if destination_hub:
                ride.destination_lat = destination_hub.latitude
                ride.destination_lng = destination_hub.longitude

        db.commit()
        db.refresh(ride)
        return ride

    @staticmethod
    def cancel_ride(db: Session, ride_id: int) -> Ride:
        """Cancel a ride"""
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise ValueError(f"Ride with ID {ride_id} not found")

        # Can only cancel scheduled rides
        if ride.status != RideStatus.SCHEDULED:
            raise ValueError(f"Cannot cancel a ride with status {ride.status}")

        ride.status = RideStatus.CANCELLED

        # Notify booked passengers if we had a notification system
        # This would be implemented in a real application

        db.commit()
        db.refresh(ride)
        return ride

    @staticmethod
    def delete_ride(db: Session, ride_id: int) -> None:
        """Delete a ride and all associated bookings"""
        # First check if the ride exists
        ride = db.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise ValueError(f"Ride with ID {ride_id} not found")

        try:
            # Check if this is a recurring ride pattern
            recurring_pattern = (
                db.query(RecurringRidePattern)
                .filter(RecurringRidePattern.ride_id == ride_id)
                .first()
            )

            if recurring_pattern:
                # Delete all departure times associated with this pattern
                db.query(RideDepartureTime).filter(
                    RideDepartureTime.pattern_id == recurring_pattern.id
                ).delete()

                # Delete the pattern
                db.query(RecurringRidePattern).filter(
                    RecurringRidePattern.ride_id == ride_id
                ).delete()

                # Find and delete all child rides
                child_rides = (
                    db.query(Ride).filter(Ride.parent_ride_id == ride_id).all()
                )

                # Delete bookings for all child rides
                for child_ride in child_rides:
                    db.query(RideBooking).filter(
                        RideBooking.ride_id == child_ride.id
                    ).delete()

                # Delete all child rides
                child_rides_deleted = (
                    db.query(Ride).filter(Ride.parent_ride_id == ride_id).delete()
                )

                logger.info(
                    f"Deleted recurring ride pattern and {child_rides_deleted} child rides for ride ID {ride_id}"
                )

            # Delete all bookings associated with this ride
            bookings_deleted = (
                db.query(RideBooking).filter(RideBooking.ride_id == ride_id).delete()
            )

            # Delete the ride
            db.query(Ride).filter(Ride.id == ride_id).delete()

            # Commit the changes
            db.commit()

            logger.info(
                f"Ride with ID {ride_id} and {bookings_deleted} bookings have been deleted"
            )
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Error deleting ride: {str(e)}")
            raise ValueError(f"Error deleting ride: {str(e)}")

    @staticmethod
    def get_enterprise_ride_statistics(
        db: Session, enterprise_id: int
    ) -> Dict[str, Any]:
        """Get statistics about rides for an enterprise"""
        # Total rides
        total_rides = (
            db.query(func.count(Ride.id))
            .filter(Ride.enterprise_id == enterprise_id)
            .scalar()
            or 0
        )

        # Completed rides
        completed_rides = (
            db.query(func.count(Ride.id))
            .filter(
                Ride.enterprise_id == enterprise_id, Ride.status == RideStatus.COMPLETED
            )
            .scalar()
            or 0
        )

        # Total passengers
        total_passengers = (
            db.query(func.sum(RideBooking.seats_booked))
            .join(Ride, Ride.id == RideBooking.ride_id)
            .filter(Ride.enterprise_id == enterprise_id)
            .scalar()
            or 0
        )

        # Average occupancy
        avg_occupancy = (
            db.query(
                func.avg(
                    func.coalesce(func.sum(RideBooking.seats_booked), 0)
                    / func.nullif(
                        Ride.available_seats
                        + func.coalesce(func.sum(RideBooking.seats_booked), 0),
                        0,
                    )
                )
            )
            .outerjoin(RideBooking, Ride.id == RideBooking.ride_id)
            .filter(
                Ride.enterprise_id == enterprise_id,
                Ride.status.in_([RideStatus.COMPLETED, RideStatus.IN_PROGRESS]),
            )
            .group_by(Ride.id)
            .scalar()
            or 0
        )

        # Most popular routes
        popular_routes = (
            db.query(
                Ride.starting_hub_id,
                Ride.destination_hub_id,
                func.count(Ride.id).label("ride_count"),
                func.sum(RideBooking.seats_booked).label("passenger_count"),
            )
            .outerjoin(RideBooking, Ride.id == RideBooking.ride_id)
            .filter(
                Ride.enterprise_id == enterprise_id, Ride.destination_hub_id != None
            )
            .group_by(Ride.starting_hub_id, Ride.destination_hub_id)
            .order_by(func.sum(RideBooking.seats_booked).desc())
            .limit(5)
            .all()
        )

        # Format the popular routes with hub names
        formatted_routes = []
        for route in popular_routes:
            starting_hub = db.query(Hub).filter(Hub.id == route.starting_hub_id).first()
            destination_hub = (
                db.query(Hub).filter(Hub.id == route.destination_hub_id).first()
            )

            formatted_routes.append(
                {
                    "starting_hub_id": route.starting_hub_id,
                    "destination_hub_id": route.destination_hub_id,
                    "starting_hub_name": (
                        starting_hub.name if starting_hub else "Unknown"
                    ),
                    "destination_hub_name": (
                        destination_hub.name if destination_hub else "Unknown"
                    ),
                    "ride_count": route.ride_count,
                    "passenger_count": route.passenger_count or 0,
                }
            )

        return {
            "total_rides": total_rides,
            "completed_rides": completed_rides,
            "total_passengers": total_passengers,
            "avg_occupancy": float(avg_occupancy),
            "popular_routes": formatted_routes,
        }

    @staticmethod
    def format_ride_response(ride: Ride) -> Dict[str, Any]:
        """Format a ride object for response"""
        # Count total passengers from bookings
        total_passengers = sum(booking.seats_booked for booking in ride.bookings)

        # Create response with detailed hub information
        response_data = {
            "id": ride.id,
            "ride_type": ride.ride_type,
            "starting_hub_id": ride.starting_hub_id,
            "destination_hub_id": ride.destination_hub_id,
            "enterprise_id": ride.enterprise_id,
            "destination": ride.destination,
            "departure_time": ride.departure_time,
            "arrival_time": ride.arrival_time,
            "status": ride.status,
            "available_seats": ride.available_seats,
            "driver_id": ride.driver_id,
            "price_per_seat": ride.price_per_seat,
            "vehicle_type_id": ride.vehicle_type_id,
            "starting_hub": ride.starting_hub,
            "destination_hub": ride.destination_hub,
            "total_passengers": total_passengers,
            "is_recurring": ride.is_recurring,
        }

        # Add recurrence pattern info if available
        if ride.is_recurring and ride.recurrence_pattern:
            response_data["recurrence_pattern"] = {
                "pattern": ride.recurrence_pattern.recurrence_pattern,
                "start_date": ride.recurrence_pattern.start_date,
                "end_date": ride.recurrence_pattern.end_date,
                "days_of_week": ride.recurrence_pattern.days_of_week,
                "departure_times": (
                    [
                        dt.departure_time.strftime("%H:%M")
                        for dt in ride.recurrence_pattern.departure_times
                    ]
                    if ride.recurrence_pattern.departure_times
                    else []
                ),
            }

        return response_data

    def book_ride(
        self,
        ride_id: int,
        passenger_id: int,
        seats: int = 1,
        db: Optional[Session] = None,
    ) -> RideBooking:
        """
        Book a ride for a passenger.

        Args:
            ride_id: ID of the ride to book
            passenger_id: ID of the passenger making the booking
            seats: Number of seats to book (default: 1)
            db: Database session (overrides the one provided at init)

        Returns:
            The created RideBooking object

        Raises:
            ValueError: If ride not found or not enough seats available
        """
        # Use db provided to method or fall back to the one from init
        db_session = db or self.db
        if db_session is None:
            raise ValueError("Database session is required")

        # Get the ride
        ride = db_session.query(Ride).filter(Ride.id == ride_id).first()
        if not ride:
            raise ValueError(f"Ride with ID {ride_id} not found")

        # Check if enough seats are available
        if ride.available_seats < seats:
            raise ValueError(
                f"Not enough available seats. Requested: {seats}, Available: {ride.available_seats}"
            )

        # Create booking
        booking = RideBooking(
            ride_id=ride_id,
            passenger_id=passenger_id,
            seats_booked=seats,
            booking_status="confirmed",
        )

        # Update available seats
        ride.available_seats -= seats

        # Add to database and commit
        try:
            db_session.add(booking)
            db_session.commit()
            db_session.refresh(booking)
            return booking
        except SQLAlchemyError as e:
            db_session.rollback()
            logger.error(f"Error booking ride: {e}")
            raise


# No longer using a singleton instance
# Each endpoint should create its own instance with a database session
