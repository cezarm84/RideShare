import httpx
import asyncio
import logging
from typing import Optional, Tuple, Dict, Any
import json
import time
from urllib.parse import quote

# Configure logging
logger = logging.getLogger(__name__)

# Default coordinates for Stockholm city center (fallback location)
DEFAULT_LAT = 59.3293
DEFAULT_LON = 18.0686

# Rate limiting parameters - Nominatim requires 1 second between requests
RATE_LIMIT_SECONDS = 1
last_request_time = 0

async def geocode_address(address: str) -> Tuple[Optional[float], Optional[float]]:
    """
    Geocode an address to coordinates using the free OpenStreetMap Nominatim API.
    Returns (latitude, longitude) tuple or default coordinates if geocoding fails.
    """
    global last_request_time
    
    if not address or address.strip() == "":
        logger.warning("Empty address provided for geocoding")
        return None, None
    
    try:
        logger.info(f"Attempting to geocode address: {address}")
        
        # Ensure we respect rate limits (1 request per second)
        current_time = time.time()
        time_since_last_request = current_time - last_request_time
        if time_since_last_request < RATE_LIMIT_SECONDS:
            await asyncio.sleep(RATE_LIMIT_SECONDS - time_since_last_request)
        
        # URL encode the address
        encoded_address = quote(address)
        
        # Nominatim API URL
        url = f"https://nominatim.openstreetmap.org/search?q={encoded_address}&format=json&limit=1"
        
        # Required headers per Nominatim usage policy
        headers = {
            "User-Agent": "RideShare-App/1.0 (contact@example.com)",
            "Accept-Language": "en-US,en;q=0.9,sv;q=0.8"  # Prioritize English but allow Swedish
        }
        
        # Make the API request
        async with httpx.AsyncClient(timeout=10.0) as client:
            last_request_time = time.time()  # Update last request time
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Geocoding API returned status code {response.status_code}")
                logger.info(f"Using default coordinates for: {address}")
                return DEFAULT_LAT, DEFAULT_LON
            
            # Parse the JSON response
            results = response.json()
            
            if not results or len(results) == 0:
                logger.warning(f"No coordinates found for address: {address}")
                logger.info(f"Using default coordinates for: {address}")
                return DEFAULT_LAT, DEFAULT_LON
            
            # Extract coordinates from first result
            lat = float(results[0].get("lat"))
            lon = float(results[0].get("lon"))
            
            logger.info(f"Successfully geocoded address: {address} to coordinates: {lat}, {lon}")
            return lat, lon
            
    except (httpx.RequestError, httpx.HTTPStatusError) as e:
        logger.error(f"HTTP error during geocoding for '{address}': {str(e)}")
        logger.info(f"Using default coordinates for: {address}")
        return DEFAULT_LAT, DEFAULT_LON
    except (KeyError, IndexError, ValueError, json.JSONDecodeError) as e:
        logger.error(f"Data parsing error during geocoding for '{address}': {str(e)}")
        logger.info(f"Using default coordinates for: {address}")
        return DEFAULT_LAT, DEFAULT_LON
    except Exception as e:
        logger.error(f"Unexpected error during geocoding for '{address}': {str(e)}")
        logger.info(f"Using default coordinates for: {address}")
        return DEFAULT_LAT, DEFAULT_LON

async def reverse_geocode(lat: float, lon: float) -> Optional[str]:
    """
    Reverse geocode coordinates to get an address.
    """
    global last_request_time
    
    try:
        logger.info(f"Attempting to reverse geocode coordinates: {lat}, {lon}")
        
        # Ensure we respect rate limits
        current_time = time.time()
        time_since_last_request = current_time - last_request_time
        if time_since_last_request < RATE_LIMIT_SECONDS:
            await asyncio.sleep(RATE_LIMIT_SECONDS - time_since_last_request)
            
        # Nominatim reverse geocoding API URL
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        
        # Required headers per Nominatim usage policy
        headers = {
            "User-Agent": "RideShare-App/1.0 (contact@example.com)",
            "Accept-Language": "en-US,en;q=0.9,sv;q=0.8"
        }
        
        # Make the API request
        async with httpx.AsyncClient(timeout=10.0) as client:
            last_request_time = time.time()
            response = await client.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Reverse geocoding API returned status code {response.status_code}")
                return None
            
            # Parse the JSON response
            result = response.json()
            
            if "display_name" not in result:
                logger.warning(f"No address found for coordinates: {lat}, {lon}")
                return None
            
            address = result.get("display_name")
            logger.info(f"Successfully reverse geocoded coordinates {lat}, {lon} to address: {address}")
            return address
            
    except Exception as e:
        logger.error(f"Error during reverse geocoding for coordinates {lat}, {lon}: {str(e)}")
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
        logger.warning(f"Geocoding failed for address: {address}, using default coordinates")
    return coords

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
            
        try:
            return asyncio.run(geocode_address(address))
        except Exception as e:
            logger.error(f"Error in synchronous geocoding: {str(e)}")
            return None
    
    def get_default_coordinates(self) -> Tuple[float, float]:
        """
        Return default coordinates when geocoding fails.
        """
        return (DEFAULT_LAT, DEFAULT_LON)

# Create a singleton instance for backward compatibility
geocoding_service = GeocodingService()
