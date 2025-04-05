import logging
import requests
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from app.models.address import Address

logger = logging.getLogger(__name__)

class GeocodingService:
    """Service for address geocoding operations"""
    
    def __init__(self, api_key=None):
        """Initialize with optional API key for premium geocoding services"""
        self.api_key = api_key
    
    def geocode_address(self, address: Address) -> bool:
        """
        Geocode an address object and update its coordinates
        
        Args:
            address: Address model object to geocode
            
        Returns:
            bool: True if geocoding was successful
        """
        if not address:
            return False
            
        address_string = address.get_geocoding_string()
        coordinates = self.get_coordinates(address_string)
        
        if coordinates:
            # Update the address object with coordinates
            longitude, latitude = coordinates[1], coordinates[0]  # Note the order
            address.coordinates = f"POINT({longitude} {latitude})"
            return True
        
        return False
    
    def get_coordinates(self, address: str) -> Optional[Tuple[float, float]]:
        """
        Get coordinates for an address string
        
        Args:
            address: String address to geocode
            
        Returns:
            Optional tuple of (latitude, longitude)
        """
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
            
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if data and len(data) > 0:
                latitude = float(data[0]['lat'])
                longitude = float(data[0]['lon'])
                logger.info(f"Geocoding successful: {latitude}, {longitude}")
                return (latitude, longitude)
            else:
                logger.warning(f"No geocoding results for address: {address}")
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
        success_count = 0
        
        for address in addresses:
            if self.geocode_address(address):
                success_count += 1
        
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error committing batch geocode changes: {str(e)}")
        
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
        try:
            url = 'https://nominatim.openstreetmap.org/reverse'
            params = {
                'lat': latitude,
                'lon': longitude,
                'format': 'json'
            }
            
            headers = {
                'User-Agent': 'RideShareApp/1.0'  # Required by Nominatim
            }
            
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if 'address' in data:
                return data['address']
            else:
                logger.warning(f"No reverse geocoding results for: {latitude}, {longitude}")
                return None
                
        except Exception as e:
            logger.error(f"Reverse geocoding error: {str(e)}")
            return None

# Create a singleton instance
geocoding_service = GeocodingService()