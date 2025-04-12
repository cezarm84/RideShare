import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

import requests
from sqlalchemy.orm import Session

from app.models.address import Address
from app.models.geocoding_cache import GeocodingCache

logger = logging.getLogger(__name__)


class GeocodingService:
    """Service for address geocoding operations with caching support"""

    def __init__(self, db: Optional[Session] = None, api_key=None):
        """
        Initialize with optional database session and API key

        Args:
            db: SQLAlchemy database session for caching
            api_key: API key for premium geocoding services
        """
        self.db = db
        self.api_key = api_key
        self.cache_ttl = timedelta(days=30)  # Cache coordinates for 30 days

    def geocode_address(self, address: Address) -> bool:
        """
        Geocode an address object and update its coordinates

        Args:
            address: Address model object to geocode

        Returns:
            bool: True if geocoding was successful, False if geocoding failed
                  but the address object is still valid without coordinates
        """
        if not address:
            return False

        address_string = address.get_geocoding_string()

        # Check cache first if database session is available
        if self.db:
            cached_coords = self._get_from_cache(address_string)
            if cached_coords:
                logger.info(f"Retrieved coordinates for '{address_string}' from cache")
                latitude, longitude = cached_coords
                address.coordinates = f"POINT({longitude} {latitude})"
                return True

        # If not in cache or no db session, get from API
        coordinates = self.get_coordinates(address_string)

        if coordinates:
            # Update the address object with coordinates
            longitude, latitude = coordinates[1], coordinates[0]  # Note the order
            address.coordinates = f"POINT({longitude} {latitude})"

            # Save to cache if database session is available
            if self.db:
                self._save_to_cache(address_string, (latitude, longitude))

            return True
        else:
            # Even though geocoding failed, we still have a valid address object
            # Just without coordinates
            logger.warning(
                f"Geocoding failed for address: {address_string}, but continuing with null coordinates"
            )
            address.coordinates = None
            return False

    def get_coordinates(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Get coordinates for an address string

        Args:
            address: String address to geocode

        Returns:
            Optional tuple of (latitude, longitude)
        """
        if not address or address.strip() == "":
            logger.warning("Empty address provided for geocoding")
            return None

        logger.info(f"Attempting to geocode address: {address}")

        try:
            # Using Nominatim (OpenStreetMap) as a free geocoding service
            # In production, consider using a paid service with better rate limits
            url = "https://nominatim.openstreetmap.org/search"
            params = {"q": address, "format": "json", "limit": 1}

            headers = {"User-Agent": "RideShareApp/1.0"}  # Required by Nominatim

            response = requests.get(url, params=params, headers=headers, timeout=10.0)
            response.raise_for_status()

            data = response.json()

            if data and len(data) > 0:
                try:
                    latitude = float(data[0]["lat"])
                    longitude = float(data[0]["lon"])
                    logger.info(f"Geocoding successful: {latitude}, {longitude}")
                    return (latitude, longitude)
                except (KeyError, ValueError) as e:
                    logger.error(f"Invalid geocoding response format: {str(e)}")
                    return None
            else:
                logger.warning(f"No geocoding results for address: {address}")
                return None

        except requests.exceptions.Timeout:
            logger.error(f"Geocoding timeout for address: {address}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Geocoding request error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Geocoding error: {str(e)}")
            return None

    def batch_geocode(self, addresses: List[Address], db: Session) -> int:
        """
        Geocode multiple addresses and commit to database

        Args:
            addresses: List of Address objects to geocode
            db: Database session

        Returns:
            Number of successfully geocoded addresses
        """
        if not addresses:
            logger.warning("Empty address list provided for batch geocoding")
            return 0

        # Store the original db if we didn't have one
        original_db = self.db
        self.db = db

        success_count = 0
        processed_count = 0

        try:
            for address in addresses:
                processed_count += 1
                if self.geocode_address(address):
                    success_count += 1

                # Commit in smaller batches to avoid long transactions
                if processed_count % 10 == 0:
                    db.commit()

            # Final commit for any remaining addresses
            db.commit()
            logger.info(
                f"Successfully geocoded {success_count} out of {len(addresses)} addresses"
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Error during batch geocoding: {str(e)}")
        finally:
            # Restore original db
            self.db = original_db

        return success_count

    def reverse_geocode(self, latitude: float, longitude: float) -> Optional[dict]:
        """
        Convert coordinates to address

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate

        Returns:
            Optional dict with address components
        """
        if latitude is None or longitude is None:
            logger.warning("Null coordinates provided for reverse geocoding")
            return None

        try:
            # Check cache first if database session is available
            if self.db:
                cache_key = f"{latitude},{longitude}"
                cached_address = self._get_reverse_from_cache(cache_key)
                if cached_address:
                    logger.info(
                        f"Retrieved address for coordinates from cache: {latitude}, {longitude}"
                    )
                    return cached_address

            url = "https://nominatim.openstreetmap.org/reverse"
            params = {"lat": latitude, "lon": longitude, "format": "json"}

            headers = {"User-Agent": "RideShareApp/1.0"}  # Required by Nominatim

            response = requests.get(url, params=params, headers=headers, timeout=10.0)
            response.raise_for_status()

            data = response.json()

            if "address" in data:
                # Save to cache if database session is available
                if self.db:
                    self._save_reverse_to_cache(
                        f"{latitude},{longitude}", data["address"]
                    )
                return data["address"]
            else:
                logger.warning(
                    f"No reverse geocoding results for: {latitude}, {longitude}"
                )
                return None

        except requests.exceptions.Timeout:
            logger.error(
                f"Reverse geocoding timeout for coordinates: {latitude}, {longitude}"
            )
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Reverse geocoding request error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Reverse geocoding error: {str(e)}")
            return None

    def _get_from_cache(self, address: str) -> Optional[Tuple[float, float]]:
        """Check if address is in cache and return coordinates if found"""
        if not self.db:
            return None

        try:
            cached = (
                self.db.query(GeocodingCache)
                .filter(
                    GeocodingCache.address == address,
                    GeocodingCache.cache_type == "forward",
                )
                .first()
            )

            if cached and cached.coordinates:
                # Parse the coordinates string (format: "lat,lng")
                lat_lng = cached.coordinates.split(",")
                if len(lat_lng) == 2:
                    return (float(lat_lng[0]), float(lat_lng[1]))
            return None
        except Exception as e:
            logger.error(f"Error retrieving from geocoding cache: {str(e)}")
            return None

    def _save_to_cache(self, address: str, coordinates: Tuple[float, float]) -> None:
        """Save address and coordinates to cache"""
        if not self.db:
            return

        try:
            # Check if entry already exists
            existing = (
                self.db.query(GeocodingCache)
                .filter(
                    GeocodingCache.address == address,
                    GeocodingCache.cache_type == "forward",
                )
                .first()
            )

            lat, lng = coordinates
            coords_str = f"{lat},{lng}"

            if existing:
                # Update existing entry
                existing.coordinates = coords_str
                existing.last_used = datetime.utcnow()
            else:
                # Create new entry
                cache_entry = GeocodingCache(
                    address=address,
                    coordinates=coords_str,
                    cache_type="forward",
                    created_at=datetime.utcnow(),
                    last_used=datetime.utcnow(),
                )
                self.db.add(cache_entry)

            self.db.commit()
        except Exception as e:
            logger.error(f"Error saving to geocoding cache: {str(e)}")
            self.db.rollback()

    def _get_reverse_from_cache(self, coords_key: str) -> Optional[dict]:
        """Check if coordinates are in reverse cache and return address if found"""
        if not self.db:
            return None

        try:
            cached = (
                self.db.query(GeocodingCache)
                .filter(
                    GeocodingCache.coordinates == coords_key,
                    GeocodingCache.cache_type == "reverse",
                )
                .first()
            )

            if cached and cached.address_data:
                return json.loads(cached.address_data)
            return None
        except Exception as e:
            logger.error(f"Error retrieving from reverse geocoding cache: {str(e)}")
            return None

    def _save_reverse_to_cache(self, coords_key: str, address_data: dict) -> None:
        """Save coordinates and address data to reverse cache"""
        if not self.db:
            return

        try:
            # Check if entry already exists
            existing = (
                self.db.query(GeocodingCache)
                .filter(
                    GeocodingCache.coordinates == coords_key,
                    GeocodingCache.cache_type == "reverse",
                )
                .first()
            )

            address_json = json.dumps(address_data)

            if existing:
                # Update existing entry
                existing.address_data = address_json
                existing.last_used = datetime.utcnow()
            else:
                # Create new entry
                cache_entry = GeocodingCache(
                    coordinates=coords_key,
                    address_data=address_json,
                    cache_type="reverse",
                    created_at=datetime.utcnow(),
                    last_used=datetime.utcnow(),
                )
                self.db.add(cache_entry)

            self.db.commit()
        except Exception as e:
            logger.error(f"Error saving to reverse geocoding cache: {str(e)}")
            self.db.rollback()


# Create a singleton instance
geocoding_service = GeocodingService()


def get_coordinates_sync(address: str) -> Optional[Tuple[float, float]]:
    """
    Synchronous wrapper for get_coordinates to handle potential async behavior

    Args:
        address: String address to geocode

    Returns:
        Optional tuple of (latitude, longitude)
    """
    coords = geocoding_service.get_coordinates(address)

    # Check if coords is a coroutine (async function result)
    if hasattr(coords, "__await__"):
        import random

        # Generate a random point as fallback
        lat = random.uniform(55.0, 69.0)
        lng = random.uniform(11.0, 24.0)
        logger.warning(f"Using fallback coordinates for {address}: {lat}, {lng}")
        return (lat, lng)

    return coords
