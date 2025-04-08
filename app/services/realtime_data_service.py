import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import logging
from sqlalchemy.orm import Session
from app.core.config import settings
from app.schemas.location import CoordinatesModel

logger = logging.getLogger(__name__)

class RealtimeDataService:
    """Service for providing real-time data like weather, traffic, and ETAs"""
    
    def __init__(self, db: Session):
        self.db = db
        self.weather_api_key = settings.WEATHER_API_KEY
        self.map_api_key = settings.MAP_API_KEY
        self.cache = {}
        self.cache_ttl = {
            "weather": timedelta(hours=1),
            "traffic": timedelta(minutes=5),
            "eta": timedelta(minutes=1)
        }
    
    async def get_ride_data(self, ride_id: int) -> Dict[str, Any]:
        """
        Get comprehensive real-time data for a ride
        
        Args:
            ride_id: ID of the ride to get data for
            
        Returns:
            Dictionary containing weather, traffic, and ETA information
        """
        from app.services.ride_service import RideService
        ride_service = RideService(self.db)
        ride = ride_service.get_ride_by_id(ride_id)
        
        if not ride:
            logger.warning(f"Tried to get real-time data for non-existent ride: {ride_id}")
            return {}
        
        # Get coordinates for the ride's start and end points
        start_coords = CoordinatesModel(
            latitude=ride.starting_hub.latitude,
            longitude=ride.starting_hub.longitude
        )
        end_coords = CoordinatesModel(
            latitude=ride.destination.latitude,
            longitude=ride.destination.longitude
        )
        
        # Gather all real-time data concurrently
        weather_task = self.get_weather(start_coords)
        traffic_task = self.get_traffic_conditions(start_coords, end_coords)
        eta_task = self.calculate_eta(start_coords, end_coords)
        
        weather, traffic, eta = await asyncio.gather(weather_task, traffic_task, eta_task)
        
        return {
            "weather": weather,
            "traffic": traffic,
            "eta": eta,
            "ride_id": ride_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def get_weather(self, coordinates: CoordinatesModel) -> Dict[str, Any]:
        """Get current weather conditions for a location"""
        cache_key = f"weather_{coordinates.latitude}_{coordinates.longitude}"
        
        # Check cache first
        if cache_key in self.cache and self.cache[cache_key]["expires"] > datetime.utcnow():
            return self.cache[cache_key]["data"]
        
        # Fetch from API
        try:
            url = "https://api.openweathermap.org/data/2.5/weather"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    params={
                        "lat": coordinates.latitude,
                        "lon": coordinates.longitude,
                        "appid": self.weather_api_key,
                        "units": "metric"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    weather_data = {
                        "temperature": data["main"]["temp"],
                        "feels_like": data["main"]["feels_like"],
                        "description": data["weather"][0]["description"],
                        "icon": data["weather"][0]["icon"],
                        "humidity": data["main"]["humidity"],
                        "wind_speed": data["wind"]["speed"],
                        "precipitation": data.get("rain", {}).get("1h", 0)
                    }
                    
                    # Cache the result
                    self.cache[cache_key] = {
                        "data": weather_data,
                        "expires": datetime.utcnow() + self.cache_ttl["weather"]
                    }
                    
                    return weather_data
                else:
                    logger.error(f"Weather API error: {response.text}")
                    return {"error": "Unable to fetch weather data"}
        
        except Exception as e:
            logger.error(f"Error fetching weather data: {str(e)}")
            return {"error": "Weather service unavailable"}
    
    async def get_traffic_conditions(self, start: CoordinatesModel, end: CoordinatesModel) -> Dict[str, Any]:
        """Get current traffic conditions between two points"""
        cache_key = f"traffic_{start.latitude}_{start.longitude}_{end.latitude}_{end.longitude}"
        
        # Check cache first
        if cache_key in self.cache and self.cache[cache_key]["expires"] > datetime.utcnow():
            return self.cache[cache_key]["data"]
        
        # Fetch from API (using Mapbox or similar)
        try:
            url = "https://api.mapbox.com/directions/v5/mapbox/driving"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url,
                    params={
                        "coordinates": f"{start.longitude},{start.latitude};{end.longitude},{end.latitude}",
                        "access_token": self.map_api_key,
                        "annotations": "congestion,duration",
                        "geometries": "geojson"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    route = data["routes"][0]
                    legs = route["legs"]
                    
                    traffic_data = {
                        "duration": route["duration"],
                        "distance": route["distance"],
                        "congestion_level": self._calculate_congestion_level(legs),
                        "delay_factor": self._calculate_delay_factor(legs),
                        "geometry": route["geometry"]
                    }
                    
                    # Cache the result
                    self.cache[cache_key] = {
                        "data": traffic_data,
                        "expires": datetime.utcnow() + self.cache_ttl["traffic"]
                    }
                    
                    return traffic_data
                else:
                    logger.error(f"Traffic API error: {response.text}")
                    return {"error": "Unable to fetch traffic data"}
        
        except Exception as e:
            logger.error(f"Error fetching traffic data: {str(e)}")
            return {"error": "Traffic service unavailable"}
    
    async def calculate_eta(self, start: CoordinatesModel, end: CoordinatesModel) -> Dict[str, Any]:
        """Calculate estimated time of arrival based on current conditions"""
        # Often uses the same data as traffic conditions, but processed differently
        traffic = await self.get_traffic_conditions(start, end)
        
        if "error" in traffic:
            return {"error": "Unable to calculate ETA"}
        
        # Apply additional factors like weather
        weather = await self.get_weather(start)
        
        # Calculate ETA with weather considerations
        base_duration = traffic["duration"]
        weather_factor = 1.0
        
        # Adjust for weather conditions
        if "error" not in weather:
            # Rain slows things down
            if weather.get("precipitation", 0) > 0:
                weather_factor += min(weather["precipitation"] * 0.1, 0.3)
            
            # Snow slows things down more
            if "snow" in weather.get("description", "").lower():
                weather_factor += 0.4
        
        adjusted_duration = base_duration * weather_factor * traffic["delay_factor"]
        arrival_time = datetime.utcnow() + timedelta(seconds=adjusted_duration)
        
        return {
            "estimated_duration": adjusted_duration,
            "base_duration": base_duration,
            "weather_factor": weather_factor,
            "traffic_factor": traffic["delay_factor"],
            "arrival_time": arrival_time.isoformat()
        }
    
    def _calculate_congestion_level(self, legs: List[Dict[str, Any]]) -> str:
        """Calculate overall congestion level from route legs"""
        if not legs or "annotation" not in legs[0]:
            return "unknown"
        
        congestion = []
        for leg in legs:
            if "congestion" in leg.get("annotation", {}):
                congestion.extend(leg["annotation"]["congestion"])
        
        if not congestion:
            return "low"
        
        # Count congestion levels
        counts = {
            "low": 0,
            "moderate": 0,
            "heavy": 0,
            "severe": 0
        }
        
        for level in congestion:
            if level in counts:
                counts[level] += 1
            else:
                counts["low"] += 1
        
        # Determine overall level
        total = sum(counts.values())
        if counts["severe"] / total > 0.3:
            return "severe"
        elif counts["heavy"] / total > 0.3:
            return "heavy"
        elif counts["moderate"] / total > 0.3:
            return "moderate"
        else:
            return "low"
    
    def _calculate_delay_factor(self, legs: List[Dict[str, Any]]) -> float:
        """Calculate delay factor based on congestion"""
        # Default to slight delay
        if not legs:
            return 1.1
        
        congestion_level = self._calculate_congestion_level(legs)
        
        # Map congestion levels to delay factors
        factors = {
            "low": 1.0,
            "moderate": 1.2,
            "heavy": 1.5,
            "severe": 2.0,
            "unknown": 1.1
        }
        
        return factors.get(congestion_level, 1.1)