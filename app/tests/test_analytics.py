def test_ride_usage_summary(client, db_session):
    # Create an admin user manually for this test
    from app.core.security import get_password_hash
    from app.models.user import User

    admin = User(
        email="admin@example.com",
        password_hash=get_password_hash("admin123"),
        first_name="Admin",
        last_name="User",
        phone_number="0700000000",
        user_type="admin",
    )
    db_session.add(admin)
    db_session.commit()

    login_data = {"username": "admin@example.com", "password": "admin123"}
    token_response = client.post("/api/auth/token", data=login_data)
    token = token_response.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/analytics/ride-usage", headers=headers)
    assert response.status_code == 200
    summary = response.json()
    assert "total_rides_scheduled" in summary
    assert summary["total_rides_scheduled"] > 0
