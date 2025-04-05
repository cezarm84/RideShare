import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.ride import RideBooking

def test_create_booking(client, db_session):
    booking_data = {
        "ride_id": 1,
        "passenger_count": 1
    }
    # Login as a fake user
    login_data = {"username": "employee1@volvo.com", "password": "password123"}
    token_response = client.post("/api/auth/token", data=login_data)
    assert token_response.status_code == 200
    token = token_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/bookings", json=booking_data, headers=headers)
    assert response.status_code == 201
    booking = response.json()
    assert booking["ride_id"] == 1
    assert booking["passenger_count"] == 1