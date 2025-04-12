def test_create_user(client, db_session):
    user_data = {
        "email": "test@example.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "phone_number": "0701234567",
        "latitude": 57.7089,
        "longitude": 11.9750,
    }
    response = client.post("/api/users", json=user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["first_name"] == "Test"
    assert "password" not in data
