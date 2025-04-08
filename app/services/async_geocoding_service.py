import logging
import json
import asyncio
from typing import Optional, Tuple, List, Dict, Union
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import aiohttp

from app.models.address import Address
from app.models.geocoding_cache import GeocodingCache

logger = logging.getLogger(__name__)

class AsyncGeocodingService:
    """Async service for address geocoding operations"""
    
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
    
    async def geocode_address(self, address: Address) -> bool:
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
        coordinates = await self.get_coordinates(address_string)
        
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
            logger.warning(f"Geocoding failed for address: {address_string}, but continuing with null coordinates")
            address.coordinates = None
            return False
    
    async def get_coordinates(self, address: str) -> Optional[Tuple[float, float]]:
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
            url = 'https://nominatim.openstreetmap.org/search'
            params = {
                'q': address,
                'format': 'json',
                'limit': 1
            }
            
            headers = {
                'User-Agent': 'RideShareApp/1.0'  # Required by Nominatim
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, headers=headers, timeout=10.0) as response:
                    response.raise_for_status()
                    data = await response.json()
                    
                    if data and len(data) > 0:
                        try:
                            latitude = float(data[0]['lat'])
                            longitude = float(data[0]['lon'])
                            logger.info(f"Geocoding successful: {latitude}, {longitude}")
                            return (latitude, longitude)
                        except (KeyError, ValueError) as e:
                            logger.error(f"Invalid geocoding response format: {str(e)}")
                            return None
                    else:
                        logger.warning(f"No geocoding results for address: {address}")
                        return None
                
        except asyncio.TimeoutError:
            logger.error(f"Geocoding timeout for address: {address}")
            return None
        except aiohttp.ClientError as e:
            logger.error(f"Geocoding request error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Geocoding error: {str(e)}")
            return None

# Only create the async service if needed
# async_geocoding_service = AsyncGeocodingService()