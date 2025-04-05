import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.ride import Ride

def test_create_ride(client, db_session):
    # Simulate admin user (bypass auth for simplicity in this test)
    ride_data = {
        "starting_hub_id": 1,
        "destination_id": 1,
        "departure_time": "2025-04-05T08:00:00Z",
        "vehicle_type": "minivan",
        "capacity": 8,
        "available_seats": 8,
        "status": "scheduled"
    }
    response = client.post("/api/rides", json=ride_data)
    assert response.status_code == 401  # Expect unauthorized without token
    
    # Add a real test with auth later when admin token is available

def test_get_rides(client, db_session):
    response = client.get("/api/rides")
    assert response.status_code == 200
    rides = response.json()
    assert len(rides) > 0  # Fake DB should have rides
    assert "id" in rides[0]