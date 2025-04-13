import logging
from typing import Dict, List, Optional, Tuple

# Import geocoding validation
from app.core.geocoding_validation import is_in_gothenburg, validate_coordinates

# Import the OpenCage geocoding service
from app.services.opencage_geocoding import (
    batch_geocode_async,
)
from app.services.opencage_geocoding import geocoding_service as opencage_service

# Configure logging
logger = logging.getLogger(__name__)

# Default coordinates for Stockholm city center (fallback location)
DEFAULT_LAT = 59.3293
DEFAULT_LON = 18.0686

# Rate limiting parameters - API services require rate limiting
RATE_LIMIT_SECONDS = 1
last_request_time = 0


async def geocode_address(address: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Geocode an address to coordinates using the Positionstack API.
    Returns (latitude, longitude) tuple or default coordinates if geocoding fails.
    """
    if not address or address.strip() == "":
        logger.warning("Empty address provided for geocoding")
        return None, None

    try:
        logger.info(f"Attempting to geocode address: {address}")

        # Use the OpenCage service for geocoding
        coordinates = await opencage_service.get_coordinates_async(address)

        if coordinates:
            lat, lon = coordinates
            logger.info(
                f"Successfully geocoded address: {address} to coordinates: {lat}, {lon}"
            )

            # Validate the coordinates
            is_valid, error_message = validate_coordinates(lat, lon)
            if not is_valid:
                logger.warning(
                    f"Invalid coordinates for address {address}: {error_message}"
                )
                logger.info(f"Using default coordinates for: {address}")
                return DEFAULT_LAT, DEFAULT_LON

            # Check if coordinates are within Gothenburg area
            if not is_in_gothenburg(lat, lon):
                logger.warning(
                    f"Coordinates for address {address} are outside Gothenburg area"
                )
                # We still use the coordinates, but log a warning

            return lat, lon
        else:
            logger.warning(f"No coordinates found for address: {address}")
            logger.info(f"Using default coordinates for: {address}")
            return DEFAULT_LAT, DEFAULT_LON

    except Exception as e:
        logger.error(f"Error during geocoding for '{address}': {str(e)}")
        logger.info(f"Using default coordinates for: {address}")
        return DEFAULT_LAT, DEFAULT_LON


async def reverse_geocode(lat: float, lon: float) -> Optional[str]:
    """
    Reverse geocode coordinates to get an address using the Positionstack API.
    """
    try:
        logger.info(f"Attempting to reverse geocode coordinates: {lat}, {lon}")

        # Use the OpenCage service for reverse geocoding
        address_data = await opencage_service.reverse_geocode_async(lat, lon)

        if not address_data:
            logger.warning(f"No address found for coordinates: {lat}, {lon}")
            return None

        # Get the formatted address
        formatted_address = address_data.get("formatted_address")
        if not formatted_address:
            # Build a formatted address from components
            components = []
            if address_data.get("street"):
                street = address_data.get("street")
                number = address_data.get("number", "")
                components.append(f"{street} {number}".strip())
            if address_data.get("postal_code") or address_data.get("locality"):
                postal = address_data.get("postal_code", "")
                locality = address_data.get("locality", "")
                components.append(f"{postal} {locality}".strip())
            if address_data.get("region"):
                components.append(address_data.get("region"))
            if address_data.get("country"):
                components.append(address_data.get("country"))

            formatted_address = ", ".join(filter(None, components))

        logger.info(
            f"Successfully reverse geocoded coordinates {lat}, {lon} to address: {formatted_address}"
        )
        return formatted_address

    except Exception as e:
        logger.error(
            f"Error during reverse geocoding for coordinates {lat}, {lon}: {str(e)}"
        )
        return None


# Add the missing function that admin_hubs.py is trying to import
async def get_coordinates_for_address(address: str) -> Optional[Tuple[float, float]]:
    """
    Get coordinates for an address.
    This is a wrapper around geocode_address to maintain API compatibility.

    Args:
        address: The address to geocode

    Returns:
        A tuple of (latitude, longitude) or None if geocoding fails
    """
    coords = await geocode_address(address)
    if coords == (DEFAULT_LAT, DEFAULT_LON):
        # If we got default coordinates, it means geocoding failed
        logger.warning(
            f"Geocoding failed for address: {address}, using default coordinates"
        )
    return coords


async def batch_geocode_addresses(
    addresses: List[str],
) -> Dict[str, Tuple[float, float]]:
    """
    Geocode multiple addresses in a batch.

    Args:
        addresses: List of address strings to geocode

    Returns:
        Dictionary mapping address strings to coordinate tuples
    """
    try:
        logger.info(f"Batch geocoding {len(addresses)} addresses")

        # Use the OpenCage service for batch geocoding
        results = await batch_geocode_async(addresses)

        # Replace any None values with default coordinates
        processed_results = {}
        for address, coords in results.items():
            if coords:
                processed_results[address] = coords
            else:
                logger.warning(f"Failed to geocode address in batch: {address}")
                processed_results[address] = (
                    DEFAULT_LAT,
                    DEFAULT_LON,
                )  # Default coordinates

        logger.info(f"Successfully batch geocoded {len(addresses)} addresses")
        return processed_results
    except Exception as e:
        logger.error(f"Error batch geocoding addresses: {str(e)}")
        # Return default coordinates for all addresses
        return {addr: (DEFAULT_LAT, DEFAULT_LON) for addr in addresses}


# For backward compatibility
class GeocodingService:
    """
    Legacy service class for geocoding addresses.
    Maintained for backward compatibility.
    """

    async def get_coordinates(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Wrapper around geocode_address function.
        """
        return await geocode_address(address)

    def get_coordinates_sync(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Synchronous wrapper for get_coordinates.
        """
        if not address:
            return None

        # Use the synchronous method from OpenCage service
        return opencage_service.get_coordinates(address)

    def get_default_coordinates(self) -> Tuple[float, float]:
        """
        Return default coordinates when geocoding fails.
        """
        return (DEFAULT_LAT, DEFAULT_LON)


# Create a singleton instance for backward compatibility
geocoding_service = GeocodingService()
