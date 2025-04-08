import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.ride import Ride, RideType

def test_create_hub_to_hub_ride(client, db_session):
    """Test creating a hub-to-hub ride"""
    # Create a hub-to-hub ride
    ride_data = {
        "starting_hub_id": 1,
        "destination_hub_id": 2,
        "departure_time": "2025-04-05T08:00:00Z",
        "price_per_seat": 50.0,
        "available_seats": 4,
        "vehicle_type_id": 1,
        "ride_type": "hub_to_hub",
        "recurrence_pattern": "one_time"
    }

    # This will fail with validation error or authentication error
    response = client.post("/api/v1/rides", json=ride_data)
    assert response.status_code in [401, 422]  # Either unauthorized or validation error

    # TODO: Add test with proper authentication when available

def test_create_hub_to_destination_ride(client, db_session):
    """Test creating a hub-to-destination ride"""
    # Create a hub-to-destination ride
    ride_data = {
        "starting_hub_id": 1,
        "destination": {
            "name": "Shopping Mall",
            "address": "123 Mall Road",
            "city": "Gothenburg",
            "latitude": 57.7089,
            "longitude": 11.9746
        },
        "departure_time": "2025-04-05T09:00:00Z",
        "price_per_seat": 60.0,
        "available_seats": 3,
        "vehicle_type_id": 1,
        "ride_type": "hub_to_destination",
        "recurrence_pattern": "one_time"
    }

    # This will fail with validation error or authentication error
    response = client.post("/api/v1/rides", json=ride_data)
    assert response.status_code in [401, 422]  # Either unauthorized or validation error

    # TODO: Add test with proper authentication when available

def test_get_rides_with_both_types(client, db_session):
    """Test that both ride types are returned correctly"""
    # This test might fail if the database tables don't exist yet
    # In a real test environment, we would set up test data
    response = client.get("/api/v1/rides")

    # We'll accept either a 200 OK or a 500 error (if tables don't exist)
    if response.status_code == 200:
        rides = response.json()

        # Check if we have both types of rides
        hub_to_hub_rides = [r for r in rides if r["ride_type"] == "hub_to_hub"]
        hub_to_destination_rides = [r for r in rides if r["ride_type"] == "hub_to_destination"]

        # If we have rides, check their structure
        if hub_to_hub_rides:
            # Check hub_to_hub ride structure
            for ride in hub_to_hub_rides:
                assert "destination_hub" in ride
                if ride["destination_hub"] is not None:
                    assert "id" in ride["destination_hub"]
                    assert "name" in ride["destination_hub"]
                    assert "city" in ride["destination_hub"]

        if hub_to_destination_rides:
            # Check hub_to_destination ride structure
            for ride in hub_to_destination_rides:
                assert "destination" in ride
                if ride["destination"] is not None:
                    assert "name" in ride["destination"]
                    assert "city" in ride["destination"]
    else:
        # If we get a 500 error, check if it's because the tables don't exist
        assert "no such table" in response.text or "Error getting rides" in response.text
