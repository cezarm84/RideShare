"""
Geocoding service using the OpenCage API.
This service provides both synchronous and asynchronous methods for geocoding addresses
and reverse geocoding coordinates.

To use this service, you need to get a free API key from https://opencagedata.com/
and set it in the OPENCAGE_API_KEY environment variable.
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import httpx
import requests
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.address import Address

logger = logging.getLogger(__name__)

# Default coordinates for Stockholm, Sweden (used when geocoding fails)
DEFAULT_LAT = 59.3293
DEFAULT_LON = 18.0686

# Rate limiting for API calls (1 request per second)
RATE_LIMIT_SECONDS = 1.0
last_request_time = 0.0


class OpenCageGeocodingService:
    """
    Service for geocoding addresses and reverse geocoding coordinates using the OpenCage API.
    Includes caching support to reduce API calls.
    """

    def __init__(self, db: Optional[Session] = None, api_key: Optional[str] = None):
        """
        Initialize the geocoding service.

        Args:
            db: SQLAlchemy database session for caching
            api_key: OpenCage API key (defaults to settings.OPENCAGE_API_KEY)
        """
        self.db = db
        self.api_key = api_key or settings.OPENCAGE_API_KEY
        self.cache_ttl = timedelta(days=30)  # Cache coordinates for 30 days
        self.base_url = "https://api.opencagedata.com/geocode/v1/json"

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
            logger.error("OpenCage API key is not set")
            return None

        logger.info(f"Attempting to geocode address: {address}")

        try:
            # Check cache first
            if self.db:
                cached_coords = self._get_from_cache(address)
                if cached_coords:
                    logger.info(f"Retrieved coordinates for '{address}' from cache")
                    return cached_coords

            # Respect rate limits
            current_time = time.time()
            time_since_last_request = current_time - last_request_time
            if time_since_last_request < RATE_LIMIT_SECONDS:
                time.sleep(RATE_LIMIT_SECONDS - time_since_last_request)

            # Prepare request parameters
            params = {
                "key": self.api_key,
                "q": address,
                "limit": 1,
                "no_annotations": 1,
            }

            # Make the API request
            try:
                response = requests.get(self.base_url, params=params, timeout=10.0)
                last_request_time = time.time()

                # Check for HTTP errors
                if response.status_code != 200:
                    logger.error(
                        f"Geocoding API returned status code {response.status_code}: {response.text}"
                    )
                    return None

                # Parse the response
                try:
                    data = response.json()
                except ValueError as e:
                    logger.error(f"Error parsing JSON response: {str(e)}")
                    return None
            except requests.RequestException as e:
                logger.error(f"Request error during geocoding: {str(e)}")
                return None

            # Check if we got any results
            if data.get("total_results", 0) == 0 or not data.get("results"):
                logger.warning(f"No geocoding results for: {address}")
                return None

            # Extract coordinates from the first result
            result = data["results"][0]
            geometry = result.get("geometry")

            if not geometry:
                logger.warning(f"No geometry in response for address: {address}")
                return None

            latitude = geometry.get("lat")
            longitude = geometry.get("lng")

            if latitude is None or longitude is None:
                logger.warning(
                    f"Invalid coordinates in response for address: {address}"
                )
                return None

            logger.info(f"Successfully geocoded {address} to: {latitude}, {longitude}")

            # Save to cache
            if self.db:
                self._save_to_cache(address, (latitude, longitude))

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
            logger.error("OpenCage API key is not set")
            return None

        logger.info(f"Attempting to geocode address: {address}")

        try:
            # Check cache first
            if self.db:
                cached_coords = self._get_from_cache(address)
                if cached_coords:
                    logger.info(f"Retrieved coordinates for '{address}' from cache")
                    return cached_coords

            # Respect rate limits
            current_time = time.time()
            time_since_last_request = current_time - last_request_time
            if time_since_last_request < RATE_LIMIT_SECONDS:
                await asyncio.sleep(RATE_LIMIT_SECONDS - time_since_last_request)

            # Prepare request parameters
            params = {
                "key": self.api_key,
                "q": address,
                "limit": 1,
                "no_annotations": 1,
            }

            # Make the API request
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(self.base_url, params=params)
                    last_request_time = time.time()

                    # Check for HTTP errors
                    if response.status_code != 200:
                        logger.error(
                            f"Geocoding API returned status code {response.status_code}: {response.text}"
                        )
                        return None

                    # Parse the response
                    try:
                        data = response.json()
                    except ValueError as e:
                        logger.error(f"Error parsing JSON response: {str(e)}")
                        return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP error during geocoding: {str(e)}")
                return None
            except Exception as e:
                logger.error(f"Request error during geocoding: {str(e)}")
                return None

            # Check if we got any results
            if data.get("total_results", 0) == 0 or not data.get("results"):
                logger.warning(f"No geocoding results for: {address}")
                return None

            # Extract coordinates from the first result
            result = data["results"][0]
            geometry = result.get("geometry")

            if not geometry:
                logger.warning(f"No geometry in response for address: {address}")
                return None

            latitude = geometry.get("lat")
            longitude = geometry.get("lng")

            if latitude is None or longitude is None:
                logger.warning(
                    f"Invalid coordinates in response for address: {address}"
                )
                return None

            logger.info(f"Successfully geocoded {address} to: {latitude}, {longitude}")

            # Save to cache
            if self.db:
                self._save_to_cache(address, (latitude, longitude))

            return (latitude, longitude)

        except Exception as e:
            logger.error(f"Error geocoding address '{address}': {str(e)}")
            return None

    async def batch_geocode(
        self, addresses: List[str]
    ) -> Dict[str, Optional[Tuple[float, float]]]:
        """
        Geocode multiple addresses in a batch (asynchronous version).

        Args:
            addresses: List of address strings to geocode

        Returns:
            Dictionary mapping address strings to coordinate tuples (or None if geocoding failed)
        """
        if not addresses:
            return {}

        if not self.api_key:
            logger.error("OpenCage API key is not set")
            return {addr: None for addr in addresses}

        # Check cache first for all addresses
        results = {}
        addresses_to_geocode = []

        if self.db:
            for address in addresses:
                cached_coords = self._get_from_cache(address)
                if cached_coords:
                    results[address] = cached_coords
                else:
                    addresses_to_geocode.append(address)
        else:
            addresses_to_geocode = addresses

        # If all addresses were in cache, return early
        if not addresses_to_geocode:
            return results

        # Geocode remaining addresses with rate limiting
        tasks = []
        for address in addresses_to_geocode:
            # Add a small delay between requests to respect rate limits
            if tasks:  # Add delay after the first request
                await asyncio.sleep(RATE_LIMIT_SECONDS)
            tasks.append(self.get_coordinates_async(address))

        # Wait for all geocoding tasks to complete
        coords_list = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        for i, coords in enumerate(coords_list):
            address = addresses_to_geocode[i]
            if isinstance(coords, Exception):
                logger.error(f"Error geocoding address '{address}': {str(coords)}")
                results[address] = None
            else:
                results[address] = coords
                # Save to cache if available
                if self.db and coords:
                    self._save_to_cache(address, coords)

        return results

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
            logger.error("OpenCage API key is not set")
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
                "key": self.api_key,
                "q": f"{latitude},{longitude}",
                "limit": 1,
                "no_annotations": 1,
            }

            # Make the API request
            response = requests.get(self.base_url, params=params, timeout=10.0)
            last_request_time = time.time()

            response.raise_for_status()

            # Parse the response
            data = response.json()

            # Check if we got any results
            if data.get("total_results", 0) == 0 or not data.get("results"):
                logger.warning(
                    f"No reverse geocoding results for: {latitude}, {longitude}"
                )
                return None

            # Extract address from the first result
            result = data["results"][0]
            components = result.get("components", {})
            formatted = result.get("formatted", "")

            # Format the address components
            address_components = {
                "road": components.get("road"),
                "house_number": components.get("house_number"),
                "postcode": components.get("postcode"),
                "city": components.get("city")
                or components.get("town")
                or components.get("village"),
                "state": components.get("state"),
                "country": components.get("country"),
                "formatted_address": formatted,
            }

            logger.info(f"Successfully reverse geocoded to: {formatted}")
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
            logger.error("OpenCage API key is not set")
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
                "key": self.api_key,
                "q": f"{latitude},{longitude}",
                "limit": 1,
                "no_annotations": 1,
            }

            # Make the API request
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self.base_url, params=params)
                last_request_time = time.time()

                if response.status_code != 200:
                    logger.error(
                        f"Reverse geocoding API returned status code {response.status_code}"
                    )
                    return None

                # Parse the response
                data = response.json()

                # Check if we got any results
                if data.get("total_results", 0) == 0 or not data.get("results"):
                    logger.warning(
                        f"No reverse geocoding results for: {latitude}, {longitude}"
                    )
                    return None

                # Extract address from the first result
                result = data["results"][0]
                components = result.get("components", {})
                formatted = result.get("formatted", "")

                # Format the address components
                address_components = {
                    "road": components.get("road"),
                    "house_number": components.get("house_number"),
                    "postcode": components.get("postcode"),
                    "city": components.get("city")
                    or components.get("town")
                    or components.get("village"),
                    "state": components.get("state"),
                    "country": components.get("country"),
                    "formatted_address": formatted,
                }

                logger.info(f"Successfully reverse geocoded to: {formatted}")
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
geocoding_service = OpenCageGeocodingService()


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


async def batch_geocode_async(
    addresses: List[str],
) -> Dict[str, Optional[Tuple[float, float]]]:
    """
    Asynchronous wrapper for batch_geocode.

    Args:
        addresses: List of address strings to geocode

    Returns:
        Dictionary mapping address strings to coordinate tuples (or None if geocoding failed)
    """
    return await geocoding_service.batch_geocode(addresses)
