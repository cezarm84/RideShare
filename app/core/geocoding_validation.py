"""
Validation functions for geocoded coordinates.
"""

import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Define the bounding box for Gothenburg, Sweden
# These coordinates define a rectangle that encompasses the Gothenburg area
GOTHENBURG_BOUNDS = {
    "min_lat": 57.5,  # Southern boundary
    "max_lat": 58.0,  # Northern boundary
    "min_lon": 11.5,  # Western boundary
    "max_lon": 12.5,  # Eastern boundary
}


def is_in_gothenburg(latitude: float, longitude: float) -> bool:
    """
    Check if coordinates are within the Gothenburg area.

    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate

    Returns:
        True if coordinates are within Gothenburg bounds, False otherwise
    """
    if not latitude or not longitude:
        return False

    return (
        GOTHENBURG_BOUNDS["min_lat"] <= latitude <= GOTHENBURG_BOUNDS["max_lat"]
        and GOTHENBURG_BOUNDS["min_lon"] <= longitude <= GOTHENBURG_BOUNDS["max_lon"]
    )


def validate_coordinates(
    latitude: float, longitude: float
) -> Tuple[bool, Optional[str]]:
    """
    Validate coordinates to ensure they are within expected ranges.

    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check if coordinates are None
    if latitude is None or longitude is None:
        return False, "Coordinates cannot be None"

    # Check if coordinates are within valid global ranges
    if not (-90 <= latitude <= 90):
        return False, f"Latitude {latitude} is outside valid range (-90 to 90)"

    if not (-180 <= longitude <= 180):
        return False, f"Longitude {longitude} is outside valid range (-180 to 180)"

    # Check if coordinates are within Gothenburg area
    if not is_in_gothenburg(latitude, longitude):
        logger.warning(
            f"Coordinates ({latitude}, {longitude}) are outside Gothenburg area"
        )
        # This is a warning, not an error, so we still return True
        return True, "Coordinates are outside Gothenburg area (warning only)"

    return True, None


def get_distance_from_gothenburg_center(latitude: float, longitude: float) -> float:
    """
    Calculate the approximate distance from Gothenburg city center.
    Uses a simplified calculation based on the Haversine formula.

    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate

    Returns:
        Approximate distance in kilometers
    """
    import math

    # Gothenburg city center coordinates
    center_lat = 57.7089
    center_lon = 11.9746

    # Earth radius in kilometers
    earth_radius = 6371.0

    # Convert latitude and longitude from degrees to radians
    lat1 = math.radians(latitude)
    lon1 = math.radians(longitude)
    lat2 = math.radians(center_lat)
    lon2 = math.radians(center_lon)

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = earth_radius * c

    return distance
