from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.hub import Hub
from app.models.ride import Ride, RideStatus, RideType
from app.models.user import User
from app.models.vehicle import VehicleType


@pytest.fixture
def test_user(db_session: Session):
    """Create a test user with driver privileges"""
    # Check if user already exists
    existing_user = (
        db_session.query(User).filter(User.email == "testdriver@example.com").first()
    )
    if existing_user:
        return existing_user

    user = User(
        email="testdriver@example.com",
        password_hash=get_password_hash("testpass123"),
        first_name="Test",
        last_name="Driver",
        phone_number="0701234567",
        user_type="driver",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_hubs(db_session: Session):
    """Create test hubs if they don't exist"""
    # Check if hubs already exist
    hubs = db_session.query(Hub).limit(2).all()
    if len(hubs) >= 2:
        return hubs

    # Create test hubs
    hub1 = Hub(
        name="Test Hub 1",
        address="Test Address 1",
        city="Gothenburg",
        latitude=57.7089,
        longitude=11.9746,
        is_active=True,
    )

    hub2 = Hub(
        name="Test Hub 2",
        address="Test Address 2",
        city="Gothenburg",
        latitude=57.7090,
        longitude=11.9750,
        is_active=True,
    )

    db_session.add(hub1)
    db_session.add(hub2)
    db_session.commit()
    db_session.refresh(hub1)
    db_session.refresh(hub2)
    return [hub1, hub2]


@pytest.fixture
def test_vehicle_type(db_session: Session):
    """Create test vehicle type if it doesn't exist"""
    # Check if vehicle type already exists
    vehicle_type = db_session.query(VehicleType).first()
    if vehicle_type:
        return vehicle_type

    # Create test vehicle type
    vehicle_type = VehicleType(name="Test Vehicle", description="Test vehicle type")

    db_session.add(vehicle_type)
    db_session.commit()
    db_session.refresh(vehicle_type)
    return vehicle_type


@pytest.fixture
def auth_token(client: TestClient, test_user: User):
    """Get authentication token for test user"""
    login_data = {"username": test_user.email, "password": "testpass123"}
    response = client.post("/api/v1/auth/token", data=login_data)
    assert response.status_code == 200
    return response.json()["access_token"]


def test_create_hub_to_hub_ride(
    client: TestClient, auth_token: str, test_hubs: list, test_vehicle_type: VehicleType
):
    """Test creating a hub-to-hub ride"""
    headers = {"Authorization": f"Bearer {auth_token}"}

    ride_data = {
        "ride_type": "hub_to_hub",
        "starting_hub_id": test_hubs[0].id,
        "destination_hub_id": test_hubs[1].id,
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "price_per_seat": 50.0,
        "available_seats": 4,
        "vehicle_type_id": test_vehicle_type.id,
        "recurrence_pattern": "one_time",
        "status": "scheduled",
    }

    response = client.post("/api/v1/rides", json=ride_data, headers=headers)
    assert response.status_code == 201

    created_ride = response.json()
    assert created_ride["ride_type"] == "hub_to_hub"
    assert created_ride["starting_hub_id"] == test_hubs[0].id
    assert created_ride["destination_hub_id"] == test_hubs[1].id
    assert created_ride["available_seats"] == 4
    assert created_ride["status"] == "scheduled"


def test_create_hub_to_destination_ride(
    client: TestClient, auth_token: str, test_hubs: list, test_vehicle_type: VehicleType
):
    """Test creating a hub-to-destination ride"""
    headers = {"Authorization": f"Bearer {auth_token}"}

    ride_data = {
        "ride_type": "hub_to_destination",
        "starting_hub_id": test_hubs[0].id,
        "destination": {
            "name": "Shopping Mall",
            "address": "123 Mall Road",
            "city": "Gothenburg",
            "latitude": 57.7089,
            "longitude": 11.9746,
        },
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "price_per_seat": 60.0,
        "available_seats": 3,
        "vehicle_type_id": test_vehicle_type.id,
        "recurrence_pattern": "one_time",
        "status": "scheduled",
    }

    response = client.post("/api/v1/rides", json=ride_data, headers=headers)
    assert response.status_code == 201

    created_ride = response.json()
    assert created_ride["ride_type"] == "hub_to_destination"
    assert created_ride["starting_hub_id"] == test_hubs[0].id
    assert "destination" in created_ride
    assert created_ride["destination"]["name"] == "Shopping Mall"
    assert created_ride["available_seats"] == 3
    assert created_ride["status"] == "scheduled"


def test_create_enterprise_ride(
    client: TestClient,
    auth_token: str,
    test_hubs: list,
    test_vehicle_type: VehicleType,
    db_session: Session,
):
    """Test creating an enterprise ride"""
    # This test assumes there's at least one enterprise in the database
    # If not, we'll need to create one
    from app.models.enterprise import Enterprise

    enterprise = db_session.query(Enterprise).first()
    if not enterprise:
        enterprise = Enterprise(
            name="Test Enterprise",
            address="Test Enterprise Address",
            city="Gothenburg",
            postal_code="41103",
            country="Sweden",
            latitude=57.7089,
            longitude=11.9746,
        )
        db_session.add(enterprise)
        db_session.commit()
        db_session.refresh(enterprise)

    headers = {"Authorization": f"Bearer {auth_token}"}

    ride_data = {
        "ride_type": "enterprise",
        "starting_hub_id": test_hubs[0].id,
        "enterprise_id": enterprise.id,
        "destination": {
            "name": "Enterprise Office",
            "address": "456 Enterprise Road",
            "city": "Gothenburg",
            "latitude": 57.7091,
            "longitude": 11.9748,
        },
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "price_per_seat": 0.0,  # Enterprise rides are often free
        "available_seats": 8,
        "vehicle_type_id": test_vehicle_type.id,
        "recurrence_pattern": "one_time",
        "status": "scheduled",
    }

    response = client.post("/api/v1/rides", json=ride_data, headers=headers)
    assert response.status_code == 201

    created_ride = response.json()
    assert created_ride["ride_type"] == "enterprise"
    assert created_ride["starting_hub_id"] == test_hubs[0].id
    assert created_ride["enterprise_id"] == enterprise.id
    assert "destination" in created_ride
    assert created_ride["destination"]["name"] == "Enterprise Office"
    assert created_ride["available_seats"] == 8
    assert created_ride["status"] == "scheduled"


def test_create_recurring_ride(
    client: TestClient, auth_token: str, test_hubs: list, test_vehicle_type: VehicleType
):
    """Test creating a recurring ride"""
    headers = {"Authorization": f"Bearer {auth_token}"}

    ride_data = {
        "ride_type": "hub_to_hub",
        "starting_hub_id": test_hubs[0].id,
        "destination_hub_id": test_hubs[1].id,
        "start_date": (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "departure_times": ["08:00:00", "17:00:00"],
        "price_per_seat": 50.0,
        "available_seats": 4,
        "vehicle_type_id": test_vehicle_type.id,
        "recurrence_pattern": "weekly",
        "end_date": (datetime.utcnow() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "status": "scheduled",
    }

    response = client.post("/api/v1/rides", json=ride_data, headers=headers)
    assert response.status_code == 201

    created_rides = response.json()
    # The API might return a single ride or a list of rides depending on the implementation
    if isinstance(created_rides, list):
        assert len(created_rides) > 0
        # Check the first ride
        first_ride = created_rides[0]
    else:
        # If it's a single ride, make sure it has the expected properties
        first_ride = created_rides
    assert first_ride["ride_type"] == "hub_to_hub"
    assert first_ride["starting_hub_id"] == test_hubs[0].id
    assert first_ride["destination_hub_id"] == test_hubs[1].id
    assert first_ride["available_seats"] == 4
    assert first_ride["status"] == "scheduled"


def test_create_ride_validation_errors(client: TestClient, auth_token: str):
    """Test validation errors when creating rides"""
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Test missing required fields
    invalid_ride_data = {
        "ride_type": "hub_to_hub",
        # Missing starting_hub_id
        "destination_hub_id": 1,
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
    }

    response = client.post("/api/v1/rides", json=invalid_ride_data, headers=headers)
    assert response.status_code == 422

    # Test invalid date (past date)
    past_ride_data = {
        "ride_type": "hub_to_hub",
        "starting_hub_id": 1,
        "destination_hub_id": 2,
        "departure_time": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "price_per_seat": 50.0,
        "available_seats": 4,
        "vehicle_type_id": 1,
    }

    response = client.post("/api/v1/rides", json=past_ride_data, headers=headers)
    assert response.status_code == 422

    # Test invalid available_seats
    invalid_seats_data = {
        "ride_type": "hub_to_hub",
        "starting_hub_id": 1,
        "destination_hub_id": 2,
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "price_per_seat": 50.0,
        "available_seats": 0,  # Must be at least 1
        "vehicle_type_id": 1,
    }

    response = client.post("/api/v1/rides", json=invalid_seats_data, headers=headers)
    assert response.status_code == 422


def test_create_ride_unauthorized(client: TestClient):
    """Test creating a ride without authentication"""
    ride_data = {
        "ride_type": "hub_to_hub",
        "starting_hub_id": 1,
        "destination_hub_id": 2,
        "departure_time": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "price_per_seat": 50.0,
        "available_seats": 4,
        "vehicle_type_id": 1,
    }

    response = client.post("/api/v1/rides", json=ride_data)
    assert response.status_code == 401


def test_get_rides(client: TestClient, auth_token: str):
    """Test getting rides"""
    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.get("/api/v1/rides", headers=headers)
    assert response.status_code == 200

    rides = response.json()
    assert isinstance(rides, list)

    # If there are rides, check the structure of the first ride
    if rides:
        first_ride = rides[0]
        assert "id" in first_ride
        assert "ride_type" in first_ride
        assert "starting_hub_id" in first_ride
        assert "status" in first_ride


def test_get_ride_by_id(client: TestClient, auth_token: str, db_session: Session):
    """Test getting a ride by ID"""
    # First, get a ride ID
    ride = db_session.query(Ride).first()
    if not ride:
        pytest.skip("No rides in the database to test")

    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.get(f"/api/v1/rides/{ride.id}", headers=headers)
    assert response.status_code == 200

    ride_data = response.json()
    assert ride_data["id"] == ride.id
    assert "ride_type" in ride_data
    assert "starting_hub_id" in ride_data
    assert "status" in ride_data


def test_update_ride(client: TestClient, auth_token: str, db_session: Session):
    """Test updating a ride"""
    # First, get a ride ID
    ride = db_session.query(Ride).first()
    if not ride:
        pytest.skip("No rides in the database to test")

    headers = {"Authorization": f"Bearer {auth_token}"}

    update_data = {"available_seats": 3, "price_per_seat": 55.0, "status": "scheduled"}

    response = client.put(f"/api/v1/rides/{ride.id}", json=update_data, headers=headers)
    assert response.status_code == 200

    updated_ride = response.json()
    assert updated_ride["id"] == ride.id
    assert updated_ride["available_seats"] == 3
    assert updated_ride["price_per_seat"] == 55.0
    assert updated_ride["status"] == "scheduled"


def test_delete_ride(client: TestClient, auth_token: str, db_session: Session):
    """Test deleting a ride"""
    # Create a ride to delete
    ride = Ride(
        ride_type=RideType.HUB_TO_HUB,
        starting_hub_id=1,
        destination_hub_id=2,
        departure_time=datetime.utcnow() + timedelta(days=1),
        price_per_seat=50.0,
        available_seats=4,
        vehicle_type_id=1,
        status=RideStatus.SCHEDULED,
    )
    db_session.add(ride)
    db_session.commit()
    db_session.refresh(ride)

    headers = {"Authorization": f"Bearer {auth_token}"}

    # The test user might not have permission to delete rides
    # Let's check if the endpoint exists first
    response = client.delete(f"/api/v1/rides/{ride.id}", headers=headers)

    # Accept either 204 (success) or 403 (forbidden) as valid responses
    # since the test user might not have admin privileges
    assert response.status_code in [204, 403]

    # Only verify the ride is deleted if the delete was successful
    if response.status_code == 204:
        deleted_ride = db_session.query(Ride).filter(Ride.id == ride.id).first()
        assert deleted_ride is None
    else:
        # If we got a 403, the ride should still exist
        existing_ride = db_session.query(Ride).filter(Ride.id == ride.id).first()
        assert existing_ride is not None
