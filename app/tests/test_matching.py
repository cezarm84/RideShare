def test_find_rides(client, db_session):
    match_data = {
        "destination_id": 1,
        "departure_time": "2025-04-05T08:00:00Z",
        "time_flexibility": 30,
        "max_results": 5,
    }
    login_data = {"username": "employee1@volvo.com", "password": "password123"}
    token_response = client.post("/api/auth/token", data=login_data)
    token = token_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = client.post("/api/matching/find-rides", json=match_data, headers=headers)
    assert response.status_code == 200
    matches = response.json()
    assert isinstance(matches, list)
    assert len(matches) > 0  # Should find Volvo rides
