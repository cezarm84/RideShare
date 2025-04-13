# Geocoding Service Documentation

This document explains how to set up and use the geocoding service in the RideShare application.

## Overview

The RideShare application uses the Positionstack API for geocoding addresses and reverse geocoding coordinates. Geocoding is the process of converting addresses (like "Kungsgatan 1, Stockholm, Sweden") into geographic coordinates (latitude and longitude), while reverse geocoding is the process of converting coordinates into human-readable addresses.

## Setting Up the Geocoding Service

### 1. Get a Positionstack API Key

1. Go to [Positionstack](https://positionstack.com/) and sign up for a free account
2. After signing up, you'll receive an API key
3. The free plan includes:
   - 25,000 requests per month
   - Batch geocoding
   - Global coverage
   - Forward & reverse geocoding

### 2. Configure the API Key

Add your Positionstack API key to the `.env` file:

```
POSITIONSTACK_API_KEY=your_api_key_here
```

## Using the Geocoding Service

### Forward Geocoding (Address to Coordinates)

#### Asynchronous Usage

```python
from app.core.geocoding import geocode_address

# Get coordinates for an address
async def get_coordinates_for_address(address: str):
    lat, lon = await geocode_address(address)
    if lat and lon:
        print(f"Coordinates: {lat}, {lon}")
    else:
        print("Geocoding failed")
```

#### Synchronous Usage

```python
from app.services.positionstack_geocoding import get_coordinates_sync

# Get coordinates for an address
def get_coordinates_for_address(address: str):
    coords = get_coordinates_sync(address)
    if coords:
        lat, lon = coords
        print(f"Coordinates: {lat}, {lon}")
    else:
        print("Geocoding failed")
```

### Reverse Geocoding (Coordinates to Address)

#### Asynchronous Usage

```python
from app.core.geocoding import reverse_geocode

# Get address for coordinates
async def get_address_for_coordinates(lat: float, lon: float):
    address = await reverse_geocode(lat, lon)
    if address:
        print(f"Address: {address}")
    else:
        print("Reverse geocoding failed")
```

#### Synchronous Usage

```python
from app.services.positionstack_geocoding import geocoding_service

# Get address for coordinates
def get_address_for_coordinates(lat: float, lon: float):
    address_data = geocoding_service.reverse_geocode(lat, lon)
    if address_data:
        formatted_address = address_data.get("formatted_address")
        print(f"Address: {formatted_address}")
    else:
        print("Reverse geocoding failed")
```

## Geocoding with Database Caching

The geocoding service includes caching to reduce API calls and improve performance. When using the service with a database session, geocoding results are cached for 30 days.

```python
from app.db.session import get_db
from app.services.positionstack_geocoding import PositionstackGeocodingService

# Get database session
db = next(get_db())

# Create geocoding service with database session
geocoding_service = PositionstackGeocodingService(db=db)

# Geocode address (will check cache first)
coordinates = geocoding_service.get_coordinates("Kungsgatan 1, Stockholm, Sweden")
```

## Testing the Geocoding Service

You can test the geocoding service using the provided test script:

```bash
# Set your API key as an environment variable
export POSITIONSTACK_API_KEY=your_api_key_here

# Run the test script
python scripts/test_positionstack_geocoding.py
```

## Error Handling

The geocoding service includes robust error handling:

1. If geocoding fails, the service returns `None` or default coordinates (Stockholm city center)
2. All errors are logged with appropriate error messages
3. The service includes rate limiting to comply with API usage policies

## Limitations

1. The free Positionstack plan has a limit of 25,000 requests per month
2. Some advanced features like autocomplete are only available in paid plans
3. The service requires an internet connection to function

## Troubleshooting

If you encounter issues with the geocoding service:

1. Check that your API key is correctly set in the `.env` file
2. Verify that you have an active internet connection
3. Check the application logs for error messages
4. Ensure you're not exceeding the API rate limits
5. Try using the test script to isolate issues
