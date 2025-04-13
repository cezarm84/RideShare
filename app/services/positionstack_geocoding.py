"""
Geocoding service using the Positionstack API.
This service provides both synchronous and asynchronous methods for geocoding addresses
and reverse geocoding coordinates.

To use this service, you need to get a free API key from https://positionstack.com/
and set it in the POSITIONSTACK_API_KEY environment variable.
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple

import httpx
import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.address import Address

# Import GeocodingCache model dynamically to avoid circular imports
# from app.models.geocoding_cache import GeocodingCache

logger = logging.getLogger(__name__)

# Default coordinates for Stockholm, Sweden (used when geocoding fails)
DEFAULT_LAT = 59.3293
DEFAULT_LON = 18.0686

# Rate limiting for API calls (1 request per second)
RATE_LIMIT_SECONDS = 1.0
last_request_time = 0.0


class PositionstackGeocodingService:
    """
    Service for geocoding addresses and reverse geocoding coordinates using the Positionstack API.
    Includes caching support to reduce API calls.
    """

    def __init__(self, db: Optional[Session] = None, api_key: Optional[str] = None):
        """
        Initialize the geocoding service.

        Args:
            db: SQLAlchemy database session for caching
            api_key: Positionstack API key (defaults to settings.POSITIONSTACK_API_KEY)
        """
        self.db = db
        self.api_key = api_key or settings.POSITIONSTACK_API_KEY
        self.cache_ttl = timedelta(days=30)  # Cache coordinates for 30 days
        self.base_url = "http://api.positionstack.com/v1"

    def _get_from_cache(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Get coordinates from cache if available and not expired.

        Args:
            address: Address string to look up

        Returns:
            Tuple of (latitude, longitude) or None if not in cache
        """
        if not self.db:
            return None

        try:
            # Import GeocodingCache dynamically to avoid circular imports
            from app.models.geocoding_cache import GeocodingCache

            # Look up in cache
            cache_entry = (
                self.db.query(GeocodingCache)
                .filter(GeocodingCache.address == address)
                .first()
            )

            if not cache_entry:
                return None

            # Update last_used timestamp
            cache_entry.last_used = datetime.now(datetime.timezone.utc)
            self.db.commit()

            return (cache_entry.latitude, cache_entry.longitude)

        except Exception as e:
            logger.error(f"Error retrieving from geocoding cache: {str(e)}")
            return None

    def _save_to_cache(self, address: str, coordinates: Tuple[float, float]) -> bool:
        """
        Save coordinates to cache.

        Args:
            address: Address string
            coordinates: Tuple of (latitude, longitude)

        Returns:
            True if saved successfully, False otherwise
        """
        if not self.db:
            return False

        try:
            # Import GeocodingCache dynamically to avoid circular imports
            from app.models.geocoding_cache import GeocodingCache

            # Check if entry already exists
            existing = (
                self.db.query(GeocodingCache)
                .filter(GeocodingCache.address == address)
                .first()
            )

            if existing:
                # Update existing entry
                existing.latitude = coordinates[0]
                existing.longitude = coordinates[1]
                existing.coordinates = f"{coordinates[0]},{coordinates[1]}"
                existing.last_used = datetime.now(datetime.timezone.utc)
            else:
                # Create new entry
                cache_entry = GeocodingCache(
                    address=address,
                    latitude=coordinates[0],
                    longitude=coordinates[1],
                    coordinates=f"{coordinates[0]},{coordinates[1]}",
                )
                self.db.add(cache_entry)

            self.db.commit()
            return True

        except Exception as e:
            logger.error(f"Error saving to geocoding cache: {str(e)}")
            self.db.rollback()
            return False

    def geocode_address(self, address: Address) -> bool:
        """
        Geocode an address object and update its coordinates.

        Args:
            address: Address model object to geocode

        Returns:
            True if geocoding was successful, False otherwise
        """
        if not address:
            return False

        # Get address string for geocoding
        address_string = address.get_geocoding_string()

        # Check cache first
        if self.db:
            cached_coords = self._get_from_cache(address_string)
            if cached_coords:
                logger.info(f"Retrieved coordinates for '{address_string}' from cache")
                latitude, longitude = cached_coords
                address.latitude = latitude
                address.longitude = longitude
                return True

        # If not in cache, get from API
        coordinates = self.get_coordinates(address_string)

        if coordinates:
            # Update the address object with coordinates
            latitude, longitude = coordinates
            address.latitude = latitude
            address.longitude = longitude

            # Save to cache
            if self.db:
                self._save_to_cache(address_string, coordinates)

            return True
        else:
            logger.warning(f"Geocoding failed for address: {address_string}")
            return False

    def get_coordinates(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Get coordinates for an address string (synchronous version).

        Args:
            address: String address to geocode

        Returns:
            Tuple of (latitude, longitude) or None if geocoding fails
        """
        global last_request_time

        if not address or address.strip() == "":
            logger.warning("Empty address provided for geocoding")
            return None

        if not self.api_key:
            logger.error("Positionstack API key is not set")
            return None

        logger.info(f"Attempting to geocode address: {address}")

        try:
            # Respect rate limits
            current_time = time.time()
            time_since_last_request = current_time - last_request_time
            if time_since_last_request < RATE_LIMIT_SECONDS:
                time.sleep(RATE_LIMIT_SECONDS - time_since_last_request)

            # Prepare request parameters
            params = {
                "access_key": self.api_key,
                "query": address,
                "limit": 1,
                "output": "json",
            }

            # Make the API request
            response = requests.get(
                f"{self.base_url}/forward", params=params, timeout=10.0
            )
            last_request_time = time.time()

            response.raise_for_status()

            # Parse the response
            data = response.json()

            # Check if we got any results
            if not data.get("data") or len(data["data"]) == 0:
                logger.warning(f"No geocoding results for: {address}")
                return None

            # Extract coordinates from the first result
            result = data["data"][0]
            latitude = result.get("latitude")
            longitude = result.get("longitude")

            if latitude is None or longitude is None:
                logger.warning(
                    f"Invalid coordinates in response for address: {address}"
                )
                return None

            logger.info(f"Successfully geocoded {address} to: {latitude}, {longitude}")
            return (latitude, longitude)

        except Exception as e:
            logger.error(f"Error geocoding address '{address}': {str(e)}")
            return None

    async def get_coordinates_async(
        self, address: str
    ) -> Optional[Tuple[float, float]]:
        """
        Get coordinates for an address string (asynchronous version).

        Args:
            address: String address to geocode

        Returns:
            Tuple of (latitude, longitude) or None if geocoding fails
        """
        global last_request_time

        if not address or address.strip() == "":
            logger.warning("Empty address provided for geocoding")
            return None

        if not self.api_key:
            logger.error("Positionstack API key is not set")
            return None

        logger.info(f"Attempting to geocode address: {address}")

        try:
            # Respect rate limits
            current_time = time.time()
            time_since_last_request = current_time - last_request_time
            if time_since_last_request < RATE_LIMIT_SECONDS:
                await asyncio.sleep(RATE_LIMIT_SECONDS - time_since_last_request)

            # Prepare request parameters
            params = {
                "access_key": self.api_key,
                "query": address,
                "limit": 1,
                "output": "json",
            }

            # Make the API request
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/forward", params=params)
                last_request_time = time.time()

                if response.status_code != 200:
                    logger.error(
                        f"Geocoding API returned status code {response.status_code}"
                    )
                    return None

                # Parse the response
                data = response.json()

                # Check if we got any results
                if not data.get("data") or len(data["data"]) == 0:
                    logger.warning(f"No geocoding results for: {address}")
                    return None

                # Extract coordinates from the first result
                result = data["data"][0]
                latitude = result.get("latitude")
                longitude = result.get("longitude")

                if latitude is None or longitude is None:
                    logger.warning(
                        f"Invalid coordinates in response for address: {address}"
                    )
                    return None

                logger.info(
                    f"Successfully geocoded {address} to: {latitude}, {longitude}"
                )
                return (latitude, longitude)

        except Exception as e:
            logger.error(f"Error geocoding address '{address}': {str(e)}")
            return None

    def reverse_geocode(
        self, latitude: float, longitude: float
    ) -> Optional[Dict[str, Any]]:
        """
        Convert coordinates to address (synchronous version).

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate

        Returns:
            Dictionary with address components or None if reverse geocoding fails
        """
        global last_request_time

        if latitude is None or longitude is None:
            logger.warning("Null coordinates provided for reverse geocoding")
            return None

        if not self.api_key:
            logger.error("Positionstack API key is not set")
            return None

        logger.info(
            f"Attempting to reverse geocode coordinates: {latitude}, {longitude}"
        )

        try:
            # Respect rate limits
            current_time = time.time()
            time_since_last_request = current_time - last_request_time
            if time_since_last_request < RATE_LIMIT_SECONDS:
                time.sleep(RATE_LIMIT_SECONDS - time_since_last_request)

            # Prepare request parameters
            params = {
                "access_key": self.api_key,
                "query": f"{latitude},{longitude}",
                "limit": 1,
                "output": "json",
            }

            # Make the API request
            response = requests.get(
                f"{self.base_url}/reverse", params=params, timeout=10.0
            )
            last_request_time = time.time()

            response.raise_for_status()

            # Parse the response
            data = response.json()

            # Check if we got any results
            if not data.get("data") or len(data["data"]) == 0:
                logger.warning(
                    f"No reverse geocoding results for: {latitude}, {longitude}"
                )
                return None

            # Extract address from the first result
            result = data["data"][0]

            # Format the address components
            address_components = {
                "name": result.get("name"),
                "street": result.get("street"),
                "number": result.get("number"),
                "postal_code": result.get("postal_code"),
                "locality": result.get("locality"),
                "region": result.get("region"),
                "country": result.get("country"),
                "formatted_address": result.get("label"),
            }

            logger.info(
                f"Successfully reverse geocoded to: {address_components['formatted_address']}"
            )
            return address_components

        except Exception as e:
            logger.error(
                f"Error reverse geocoding coordinates '{latitude}, {longitude}': {str(e)}"
            )
            return None

    async def reverse_geocode_async(
        self, latitude: float, longitude: float
    ) -> Optional[Dict[str, Any]]:
        """
        Convert coordinates to address (asynchronous version).

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate

        Returns:
            Dictionary with address components or None if reverse geocoding fails
        """
        global last_request_time

        if latitude is None or longitude is None:
            logger.warning("Null coordinates provided for reverse geocoding")
            return None

        if not self.api_key:
            logger.error("Positionstack API key is not set")
            return None

        logger.info(
            f"Attempting to reverse geocode coordinates: {latitude}, {longitude}"
        )

        try:
            # Respect rate limits
            current_time = time.time()
            time_since_last_request = current_time - last_request_time
            if time_since_last_request < RATE_LIMIT_SECONDS:
                await asyncio.sleep(RATE_LIMIT_SECONDS - time_since_last_request)

            # Prepare request parameters
            params = {
                "access_key": self.api_key,
                "query": f"{latitude},{longitude}",
                "limit": 1,
                "output": "json",
            }

            # Make the API request
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/reverse", params=params)
                last_request_time = time.time()

                if response.status_code != 200:
                    logger.error(
                        f"Reverse geocoding API returned status code {response.status_code}"
                    )
                    return None

                # Parse the response
                data = response.json()

                # Check if we got any results
                if not data.get("data") or len(data["data"]) == 0:
                    logger.warning(
                        f"No reverse geocoding results for: {latitude}, {longitude}"
                    )
                    return None

                # Extract address from the first result
                result = data["data"][0]

                # Format the address components
                address_components = {
                    "name": result.get("name"),
                    "street": result.get("street"),
                    "number": result.get("number"),
                    "postal_code": result.get("postal_code"),
                    "locality": result.get("locality"),
                    "region": result.get("region"),
                    "country": result.get("country"),
                    "formatted_address": result.get("label"),
                }

                logger.info(
                    f"Successfully reverse geocoded to: {address_components['formatted_address']}"
                )
                return address_components

        except Exception as e:
            logger.error(
                f"Error reverse geocoding coordinates '{latitude}, {longitude}': {str(e)}"
            )
            return None

    def get_default_coordinates(self) -> Tuple[float, float]:
        """
        Return default coordinates when geocoding fails.

        Returns:
            Tuple of (latitude, longitude) for Stockholm, Sweden
        """
        return (DEFAULT_LAT, DEFAULT_LON)


# Create a singleton instance
geocoding_service = PositionstackGeocodingService()


def get_coordinates_sync(address: str) -> Optional[Tuple[float, float]]:
    """
    Synchronous wrapper for get_coordinates.

    Args:
        address: String address to geocode

    Returns:
        Tuple of (latitude, longitude) or None if geocoding fails
    """
    return geocoding_service.get_coordinates(address)


async def get_coordinates_async(address: str) -> Optional[Tuple[float, float]]:
    """
    Asynchronous wrapper for get_coordinates_async.

    Args:
        address: String address to geocode

    Returns:
        Tuple of (latitude, longitude) or None if geocoding fails
    """
    return await geocoding_service.get_coordinates_async(address)
