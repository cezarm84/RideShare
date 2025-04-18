import re
from datetime import date, datetime, time, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, root_validator, validator


class RideType(str, Enum):
    """
    Defines the type of ride to create
    """

    ENTERPRISE = "enterprise"  # Rides for company employees (requires enterprise_id)
    HUB_TO_HUB = "hub_to_hub"  # Fixed routes between transportation hubs
    HUB_TO_DESTINATION = "hub_to_destination"  # Routes from hub to custom destination


class RecurrencePattern(str, Enum):
    """
    Defines the recurrence pattern for scheduled rides
    """

    DAILY = "daily"
    WEEKDAYS = "weekdays"  # Monday to Friday
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ONE_TIME = "one_time"  # Single occurrence


# Schema for hub information in response
class HubBase(BaseModel):
    id: int
    name: str
    address: str
    city: str

    class Config:
        orm_mode = True
        from_attributes = True  # For Pydantic v2


# Add the missing HubResponse class that's being imported in rides.py
class HubResponse(HubBase):
    """
    Full hub response model with all fields from the database.
    """

    description: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_active: bool = True

    class Config:
        orm_mode = True
        from_attributes = True


# Schema for custom destination information
class DestinationInfo(BaseModel):
    name: str = Field(..., description="Name of the destination")
    address: str = Field(..., description="Address of the destination")
    city: str = Field(..., description="City of the destination")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    postal_code: Optional[str] = Field(None, description="Postal code")
    country: Optional[str] = Field(None, description="Country")


# Base schema for ride creation with distinct ride types
class RideCreate(BaseModel):
    # Basic ride information
    ride_type: RideType = Field(
        ..., description="Type of ride to create", example="hub_to_hub"
    )

    # Hub and destination information
    starting_hub_id: int = Field(..., description="ID of the starting hub", example=1)

    # One of the following destination types must be provided
    destination_hub_id: Optional[int] = Field(
        None, description="ID of the destination hub (for hub_to_hub)", example=2
    )
    destination_id: Optional[int] = Field(
        None,
        description="ID of an existing destination (for hub_to_destination)",
        example=1,
    )
    destination: Optional[DestinationInfo] = Field(
        None,
        description="Custom destination details (for hub_to_destination) - only needed if destination_id is not provided",
        example={
            "name": "Gothenburg Central Station",
            "address": "Drottningtorget 5",
            "city": "Gothenburg",
            "latitude": 57.7089,
            "longitude": 11.9746,
            "postal_code": "411 03",
            "country": "Sweden",
        },
    )

    # Enterprise information (required for enterprise rides)
    enterprise_id: Optional[int] = Field(
        None,
        description="ID of the enterprise (required for enterprise rides)",
        example=1,
    )

    # Schedule information
    recurrence_pattern: RecurrencePattern = Field(
        RecurrencePattern.ONE_TIME,
        description="How often the ride repeats",
        example="one_time",
    )
    start_date: Optional[str] = Field(
        None,
        description="Start date for the recurrence pattern (YYYY-MM-DD)",
        example="2025-05-15",
    )
    end_date: Optional[str] = Field(
        None,
        description="End date for the recurrence pattern (YYYY-MM-DD)",
        example="2025-05-15",
    )

    # For one-time rides or the first instance of recurring rides
    departure_time: Optional[str] = Field(
        None,
        description="Exact date and time for one-time rides or first instance of recurring rides (REQUIRED FORMAT: YYYY-MM-DDThh:mm:ss)",
        example="2025-05-15T08:00:00",
    )

    # For recurring rides, specify times without dates
    departure_times: Optional[List[str]] = Field(
        None,
        description="Time(s) of day for all instances of recurring rides, can include multiple times per day (REQUIRED FORMAT: HH:MM:SS)",
        example=["08:00:00", "17:00:00"],
    )

    # Ride details
    vehicle_type_id: int = Field(..., description="ID of the vehicle type", example=1)
    price_per_seat: float = Field(
        ..., description="Price per seat in SEK", example=50.0
    )
    available_seats: int = Field(
        ..., description="Number of available seats (must be at least 1)", example=4
    )
    status: str = Field("scheduled", description="Ride status", example="scheduled")

    # Validate ride type specific fields
    @root_validator(pre=True)
    def validate_ride_type_fields(cls, values):
        ride_type = values.get("ride_type")

        # Enterprise rides need enterprise_id
        if ride_type == RideType.ENTERPRISE and not values.get("enterprise_id"):
            raise ValueError("Enterprise rides require an enterprise_id")

        # Hub to hub rides need both starting and destination hubs
        if ride_type == RideType.HUB_TO_HUB and not values.get("destination_hub_id"):
            raise ValueError("Hub-to-hub rides require a destination_hub_id")

        # Hub to destination rides need either destination_id or destination info
        if ride_type == RideType.HUB_TO_DESTINATION:
            if not values.get("destination_id") and not values.get("destination"):
                raise ValueError(
                    "Hub-to-destination rides require either destination_id or destination details"
                )

        # Validate recurrence pattern fields
        recurrence = values.get("recurrence_pattern")
        if recurrence != RecurrencePattern.ONE_TIME:
            # Recurring rides need start date and departure times
            if not values.get("start_date"):
                raise ValueError(f"{recurrence} rides require a start_date")

            if not values.get("departure_times"):
                raise ValueError(f"{recurrence} rides require departure_times")
        else:
            # One-time rides need departure_time
            if not values.get("departure_time"):
                raise ValueError("One-time rides require a departure_time")

        return values

    # Parse and validate dates
    @validator("start_date", "end_date")
    def validate_date(cls, v):
        if v is None:
            return v

        try:
            # Handle different input types
            if isinstance(v, str):
                # Just validate that it's a valid date format
                date_formats = [
                    "%Y-%m-%d",
                    "%d/%m/%Y",
                    "%m/%d/%Y",
                    "%d-%m-%Y",
                    "%m-%d-%Y",
                    "%d %b %Y",  # 07 Apr 2025
                    "%b %d %Y",  # Apr 07 2025
                ]

                valid_format = False
                for fmt in date_formats:
                    try:
                        datetime.strptime(v, fmt)
                        valid_format = True
                        break
                    except ValueError:
                        continue

                if not valid_format:
                    raise ValueError(f"Invalid date format: {v}")

                # Return the original string
                return v
            elif isinstance(v, (datetime, date)):
                # Convert to string in ISO format
                return v.strftime("%Y-%m-%d")
            else:
                raise ValueError(f"Date must be a string or date object: {v}")
        except Exception as e:
            raise ValueError(f"Date validation error: {str(e)}")

    # Parse and validate departure times
    @validator("departure_times")
    def validate_departure_times(cls, v):
        if v is None:
            return v

        validated_times = []
        for time_val in v:
            try:
                # Handle different input types
                if isinstance(time_val, str):
                    # Just validate that it's a valid time format
                    time_formats = ["%H:%M", "%H:%M:%S"]
                    valid_format = False

                    for fmt in time_formats:
                        try:
                            datetime.strptime(time_val, fmt)
                            valid_format = True
                            break
                        except ValueError:
                            continue

                    if not valid_format:
                        raise ValueError(f"Invalid time format: {time_val}")

                    # Add the original string to the list
                    validated_times.append(time_val)
                elif isinstance(time_val, time):
                    # Convert time object to string
                    validated_times.append(time_val.strftime("%H:%M:%S"))
                elif isinstance(time_val, datetime):
                    # Extract time from datetime and convert to string
                    validated_times.append(time_val.strftime("%H:%M:%S"))
                else:
                    raise ValueError(
                        f"Time must be a string, time, or datetime object: {time_val}"
                    )
            except Exception as e:
                raise ValueError(f"Time validation error for {time_val}: {str(e)}")

        return validated_times

    # Enhanced validator for departure_time to handle multiple formats
    @validator("departure_time")
    def validate_departure_time(cls, v, values):
        if v is None:
            return v

        # Handle different input types
        if isinstance(v, str):
            # Just validate that it's a valid datetime format
            formats_to_try = [
                # ISO formats
                "%Y-%m-%dT%H:%M:%S.%fZ",
                "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%dT%H:%M",
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d %H:%M",
                # Common HTTP formats
                "%a, %d %b %Y %H:%M:%S",  # Mon, 07 Apr 2025 22:12:17
                "%a,%d %b %Y %H:%M:%S",  # Mon,07 Apr 2025 22:12:17
                "%a, %d %b %Y %H:%M",
                # Other common formats
                "%d %b %Y %H:%M:%S",  # 07 Apr 2025 22:12:17
                "%d %b %Y %H:%M",
                "%d/%m/%Y %H:%M:%S",
                "%d/%m/%Y %H:%M",
                "%m/%d/%Y %H:%M:%S",
                "%m/%d/%Y %H:%M",
                "%d-%m-%Y %H:%M:%S",
                "%d-%m-%Y %H:%M",
                "%m-%d-%Y %H:%M:%S",
                "%m-%d-%Y %H:%M",
            ]

            # Try to parse the string with each format
            valid_format = False
            parsed_time = None
            for fmt in formats_to_try:
                try:
                    parsed_time = datetime.strptime(v, fmt)
                    valid_format = True
                    break
                except ValueError:
                    continue

            # If none of the formats worked, try more approaches
            if not valid_format:
                try:
                    # Try to handle ISO format with timezone
                    parsed_time = datetime.fromisoformat(v.replace("Z", "+00:00"))
                    valid_format = True
                except ValueError:
                    # Last resort: try to extract date and time components
                    try:
                        # Match yyyy-mm-dd or yyyy/mm/dd
                        date_match = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", v)
                        # Match hh:mm:ss or hh:mm
                        time_match = re.search(r"(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?", v)

                        if date_match and time_match:
                            year, month, day = map(int, date_match.groups())
                            hour, minute = map(int, time_match.groups()[:2])
                            second = (
                                int(time_match.group(3)) if time_match.group(3) else 0
                            )

                            parsed_time = datetime(
                                year, month, day, hour, minute, second
                            )
                            valid_format = True
                        else:
                            raise ValueError(
                                f"Could not parse datetime components from: {v}"
                            )
                    except Exception:
                        raise ValueError(f"Invalid datetime format: {v}")

            # Ensure we parsed a valid datetime
            if not valid_format or parsed_time is None:
                raise ValueError(f"Invalid datetime format: {v}")

            # Check if one-time ride departure is in the future
            if values.get("recurrence_pattern") == RecurrencePattern.ONE_TIME:
                now = datetime.now(timezone.utc)
                # Make timezone-aware for comparison if it's not already
                if parsed_time.tzinfo is None:
                    parsed_time = parsed_time.replace(tzinfo=timezone.utc)

                if parsed_time < now:
                    raise ValueError("Departure time must be in the future")

            # Return the original string
            return v
        elif isinstance(v, datetime):
            # Convert datetime to ISO format string
            return v.isoformat()
        else:
            raise ValueError(f"Departure time must be a string or datetime object: {v}")

    @validator("available_seats")
    def check_available_seats(cls, v):
        if v < 1:
            raise ValueError("Available seats must be at least 1")
        if v > 50:  # Increased for enterprise use cases
            raise ValueError("Available seats cannot exceed 50")
        return v

    @validator("price_per_seat")
    def check_price(cls, v):
        if v < 0:
            raise ValueError("Price per seat cannot be negative")
        return v


# Schema for recurring ride patterns
class RecurringRidePattern(BaseModel):
    ride_id: int  # Parent ride ID
    recurrence_pattern: str
    start_date: date
    end_date: Optional[date] = None
    departure_times: List[time]
    days_of_week: Optional[List[int]] = None  # 0=Monday, 6=Sunday

    class Config:
        orm_mode = True
        from_attributes = True


# Schema for expanded ride details in response
class RideResponse(BaseModel):
    id: int
    ride_type: str
    starting_hub_id: int
    destination_hub_id: Optional[int] = None
    destination: Optional[Dict[str, Any]] = None
    enterprise_id: Optional[int] = None
    departure_time: datetime
    recurrence_pattern: Optional[str] = None
    status: str
    available_seats: int
    driver_id: Optional[int] = None
    price_per_seat: float
    vehicle_type_id: int

    # Include related objects directly
    starting_hub: Optional[HubBase] = None
    destination_hub: Optional[HubBase] = None

    # Include convenience fields
    total_passengers: int = 0
    is_recurring: bool = False

    class Config:
        orm_mode = True
        from_attributes = True  # For Pydantic v2


# For backward compatibility
class RideDetailResponse(RideResponse):
    """
    Alias for RideResponse to maintain compatibility with imports
    """

    # Compatibility method for both Pydantic v1 and v2
    @classmethod
    def from_orm(cls, obj):
        """
        Creates a model from an ORM object or dict.
        Compatible with both Pydantic v1 and v2.
        """
        if hasattr(cls, "model_validate"):
            # Pydantic v2
            return cls.model_validate(obj)
        else:
            # Pydantic v1
            return cls.parse_obj(obj)


# Schema for passenger information in ride response
class RidePassengerInfo(BaseModel):
    id: int
    booking_id: int
    user_id: Optional[int] = None
    email: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    is_primary: bool = False
    created_at: datetime
    user_details: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True
        from_attributes = True  # For Pydantic v2


# Schema for booking information in ride response
class RideBookingInfo(BaseModel):
    id: int
    passenger_id: int
    ride_id: int
    seats_booked: int
    booking_status: str
    created_at: datetime
    passengers: Optional[List[RidePassengerInfo]] = None

    # For backward compatibility
    user_id: Optional[int] = None
    passenger_count: Optional[int] = None
    status: Optional[str] = None
    booking_time: Optional[datetime] = None
    price: Optional[float] = None

    class Config:
        orm_mode = True
        from_attributes = True  # For Pydantic v2


# Add the missing RideDetailedResponse class
class RideDetailedResponse(RideResponse):
    """
    Detailed response for rides, including additional information.
    This class is needed for backward compatibility with existing imports.
    """

    # Add bookings field for passenger information
    bookings: Optional[List[RideBookingInfo]] = None


# Schema for ride booking
class RideBookingCreate(BaseModel):
    ride_id: int
    seats_booked: int = Field(1, description="Number of seats to book")

    @validator("seats_booked")
    def check_seats_booked(cls, v):
        if v < 1:
            raise ValueError("Must book at least 1 seat")
        if v > 10:
            raise ValueError("Cannot book more than 10 seats")
        return v


# Schema for ride booking response
class RideBookingResponse(BaseModel):
    id: int
    ride_id: int
    passenger_id: int
    seats_booked: int
    booking_status: str
    created_at: datetime

    # For backward compatibility
    user_id: Optional[int] = None
    passenger_count: Optional[int] = None
    status: Optional[str] = None
    booking_time: Optional[datetime] = None

    @validator("user_id", pre=True, always=True)
    def set_user_id(cls, v, values):
        if v is None and "passenger_id" in values:
            return values["passenger_id"]
        return v

    @validator("passenger_count", pre=True, always=True)
    def set_passenger_count(cls, v, values):
        if v is None and "seats_booked" in values:
            return values["seats_booked"]
        return v

    @validator("status", pre=True, always=True)
    def set_status(cls, v, values):
        if v is None and "booking_status" in values:
            return values["booking_status"]
        return v

    @validator("booking_time", pre=True, always=True)
    def set_booking_time(cls, v, values):
        if v is None and "created_at" in values:
            return values["created_at"]
        return v

    class Config:
        orm_mode = True
        from_attributes = True  # For Pydantic v2


# Update ride schema
class RideUpdate(BaseModel):
    starting_hub_id: Optional[int] = None
    destination_hub_id: Optional[int] = None
    destination: Optional[Dict[str, Any]] = None
    enterprise_id: Optional[int] = None
    departure_time: Optional[str] = None
    status: Optional[str] = None
    vehicle_type_id: Optional[int] = None
    available_seats: Optional[int] = None
    driver_id: Optional[int] = None
    price_per_seat: Optional[float] = None

    @validator("available_seats")
    def check_available_seats(cls, v):
        if v is not None:
            if v < 0:
                raise ValueError("Available seats cannot be negative")
            if v > 50:
                raise ValueError("Available seats cannot exceed 50")
        return v

    @validator("price_per_seat")
    def check_price(cls, v):
        if v is not None and v < 0:
            raise ValueError("Price per seat cannot be negative")
        return v

    # Use the same enhanced datetime validator
    @validator("departure_time")
    def validate_departure_time(cls, v):
        if v is None:
            return v

        # Reuse the validation logic from RideCreate
        if isinstance(v, datetime):
            parsed_time = v
        else:
            # Try multiple datetime formats as above
            formats_to_try = [
                "%Y-%m-%dT%H:%M:%S.%fZ",
                "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%dT%H:%M:%S",
                "%Y-%m-%dT%H:%M",
                "%Y-%m-%d %H:%M:%S",
                "%Y-%m-%d %H:%M",
                "%a, %d %b %Y %H:%M:%S",
                "%a,%d %b %Y %H:%M:%S",
                "%a, %d %b %Y %H:%M",
                "%d %b %Y %H:%M:%S",
                "%d %b %Y %H:%M",
                "%d/%m/%Y %H:%M:%S",
                "%d/%m/%Y %H:%M",
                "%m/%d/%Y %H:%M:%S",
                "%m/%d/%Y %H:%M",
                "%d-%m-%Y %H:%M:%S",
                "%d-%m-%Y %H:%M",
                "%m-%d-%Y %H:%M:%S",
                "%m-%d-%Y %H:%M",
            ]

            parsed_time = None
            for fmt in formats_to_try:
                try:
                    parsed_time = datetime.strptime(v, fmt)
                    break
                except ValueError:
                    continue

            if parsed_time is None:
                try:
                    parsed_time = datetime.fromisoformat(v.replace("Z", "+00:00"))
                except ValueError:
                    try:
                        date_match = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", v)
                        time_match = re.search(r"(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?", v)

                        if date_match and time_match:
                            year, month, day = map(int, date_match.groups())
                            hour, minute = map(int, time_match.groups()[:2])
                            second = (
                                int(time_match.group(3)) if time_match.group(3) else 0
                            )

                            parsed_time = datetime(
                                year, month, day, hour, minute, second
                            )
                        else:
                            raise ValueError(
                                f"Could not parse datetime components from: {v}"
                            )
                    except Exception:
                        raise ValueError(f"Invalid datetime format: {v}")

        if parsed_time is None:
            raise ValueError(f"Invalid datetime format: {v}")

        if parsed_time.tzinfo is None:
            parsed_time = parsed_time.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)
        if parsed_time < now:
            raise ValueError("Departure time must be in the future")

        return parsed_time

    class Config:
        orm_mode = True
        from_attributes = True  # For Pydantic v2
