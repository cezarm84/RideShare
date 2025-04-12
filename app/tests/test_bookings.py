


def test_create_booking_legacy(client, db_session):
    """Test creating a booking with the legacy API"""
    booking_data = {"ride_id": 1, "passenger_count": 1}

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
    assert booking["seats_booked"] == 1


def test_create_booking_with_passengers(client, db_session):
    """Test creating a booking with passenger information"""
    booking_data = {
        "ride_id": 1,
        "passengers": [
            {
                "user_id": None,
                "email": "guest@example.com",
                "name": "Guest User",
                "phone": "+46701234567",
            }
        ],
        "matching_preferences": {
            "prefer_same_enterprise": True,
            "prefer_same_starting_hub": True,
        },
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
    assert booking["seats_booked"] == 1
    assert "passengers" in booking
    assert len(booking["passengers"]) == 1
    assert booking["passengers"][0]["email"] == "guest@example.com"
    assert booking["passengers"][0]["name"] == "Guest User"
    assert booking["passengers"][0]["phone"] == "+46701234567"


def test_get_user_bookings(client, db_session):
    """Test getting all bookings for the current user"""
    # Login as a fake user
    login_data = {"username": "employee1@volvo.com", "password": "password123"}
    token_response = client.post("/api/auth/token", data=login_data)
    assert token_response.status_code == 200
    token = token_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/bookings", headers=headers)
    assert response.status_code == 200
    bookings = response.json()
    assert isinstance(bookings, list)
