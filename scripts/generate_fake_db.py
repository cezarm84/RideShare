import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Add the parent directory to sys.path to find the 'app' module
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.core.security import get_password_hash
from app.db import configure_relationships

# Import necessary modules
from app.db.base import Base
from app.models.address import Address
from app.models.destination import Destination
from app.models.hub import Hub
from app.models.payment import Payment
from app.models.ride import Ride, RideBooking, RideStatus

# Import models
from app.models.user import Enterprise, EnterpriseUser, User, UserRole, UserType
from app.models.vehicle import VehicleType

# Database setup
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})


def utc_now():
    """Return current UTC time as a datetime object."""
    return datetime.now()


def generate_uuid():
    """Generate a UUID string for user identification."""
    return str(uuid.uuid4())


def generate_fake_database():
    """Generate a fake database with test data."""
    print("Starting database generation...")

    # Configure relationships
    configure_relationships()

    # Create tables
    Base.metadata.create_all(bind=engine)

    with Session(engine) as db:
        # Clear existing data
        print("Cleaning existing data...")
        tables = [
            "payments",
            "ride_bookings",
            "rides",
            "enterprise_users",
            "users",
            "hubs",
            "locations",
            "addresses",
            "enterprises",
            "vehicle_types",
            "destinations",
        ]

        for table in tables:
            try:
                db.execute(text(f"DELETE FROM {table}"))
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"Warning: Could not clear table {table}: {e}")

        # 1. Create vehicle types
        print("Creating vehicle types...")
        vehicle_types = []
        for data in [
            {
                "name": "Sedan",
                "description": "Standard 4-door car",
                "max_passengers": 4,
            },
            {
                "name": "SUV",
                "description": "Sport utility vehicle with extra space",
                "max_passengers": 6,
            },
            {
                "name": "Van",
                "description": "Larger vehicle for groups",
                "max_passengers": 8,
            },
        ]:
            # Use direct SQL to insert vehicle types with max_passengers
            db.execute(
                text(
                    "INSERT INTO vehicle_types (name, description, max_passengers, created_at) VALUES (:name, :description, :max_passengers, :created_at)"
                ),
                {
                    "name": data["name"],
                    "description": data["description"],
                    "max_passengers": data["max_passengers"],
                    "created_at": utc_now(),
                },
            )
            db.commit()

            # Get the created vehicle type ID
            result = db.execute(
                text("SELECT id FROM vehicle_types WHERE name = :name"),
                {"name": data["name"]},
            ).fetchone()
            if result:
                # Create a simple object to hold the ID
                vehicle_type = type(
                    "VehicleType", (), {"id": result[0], "name": data["name"]}
                )
                vehicle_types.append(vehicle_type)
        print(f"Created {len(vehicle_types)} vehicle types")

        # 2. Create enterprises
        print("Creating enterprises...")
        volvo = Enterprise(name="Volvo Torslanda", is_active=True)
        molnlycke = Enterprise(name="Mölnlycke Industrial Park", is_active=True)
        db.add_all([volvo, molnlycke])
        db.commit()

        # 3. Create addresses
        print("Creating addresses...")
        volvo_address = Address(
            street="Volvo Torslanda",
            city="Göteborg",
            state="Västra Götaland",
            postal_code="405 31",
            country="Sweden",
            latitude=57.7181,
            longitude=11.8583,
        )
        molnlycke_address = Address(
            street="Industrivägen",
            city="Mölnlycke",
            state="Västra Götaland",
            postal_code="435 33",
            country="Sweden",
            latitude=57.6589,
            longitude=12.1167,
        )
        gothenburg_address = Address(
            street="Drottningtorget",
            city="Göteborg",
            state="Västra Götaland",
            postal_code="411 03",
            country="Sweden",
            latitude=57.7089,
            longitude=11.9750,
        )
        db.add_all([volvo_address, molnlycke_address, gothenburg_address])
        db.commit()

        # 4. Create hubs
        print("Creating hubs...")
        hubs = []
        hub_data = [
            {
                "name": "Hub North",
                "description": "Northern Göteborg transport hub",
                "address": "North Göteborg, Göteborg",
                "city": "Göteborg",
                "postal_code": "41756",
                "latitude": 57.7500,
                "longitude": 11.8500,
            },
            {
                "name": "Hub South",
                "description": "Southern Göteborg transport hub",
                "address": "South Göteborg, Göteborg",
                "city": "Göteborg",
                "postal_code": "41468",
                "latitude": 57.6900,
                "longitude": 11.8700,
            },
            {
                "name": "Mölnlycke Hub",
                "description": "Mölnlycke central transport hub",
                "address": "Mölnlycke Center, Mölnlycke",
                "city": "Mölnlycke",
                "postal_code": "43533",
                "latitude": 57.6600,
                "longitude": 12.1000,
            },
        ]

        for data in hub_data:
            hub = Hub(
                name=data["name"],
                description=data["description"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                address=data["address"],
                city=data["city"],
                postal_code=data["postal_code"],
                is_active=True,
                created_at=utc_now(),
            )
            hubs.append(hub)
            db.add(hub)
        db.commit()
        print(f"Created {len(hubs)} hubs")

        # 5. Create destinations
        print("Creating destinations...")
        destinations = []

        # Create a destination for Gothenburg Central
        gothenburg_central = Destination(
            name="Gothenburg Central Station",
            address="Drottningtorget 5",
            city="Göteborg",
            postal_code="411 03",
            country="Sweden",
            latitude=57.7089,
            longitude=11.9750,
            is_active=True,
        )

        # Create a destination for Volvo
        volvo_destination = Destination(
            name="Volvo Torslanda",
            address="Volvo Torslanda",
            city="Göteborg",
            postal_code="405 31",
            country="Sweden",
            latitude=57.7181,
            longitude=11.8583,
            enterprise_id=volvo.id,
            is_active=True,
        )

        destinations.append(gothenburg_central)
        destinations.append(volvo_destination)
        db.add_all(destinations)
        db.commit()
        print(f"Created {len(destinations)} destinations")

        # 6. Create locations
        print("Creating locations...")

        # Use direct SQL to create locations
        db.execute(
            text(
                "INSERT INTO locations (name, address, latitude, longitude, location_type, created_at) VALUES (:name, :address, :latitude, :longitude, :location_type, CURRENT_TIMESTAMP)"
            ),
            {
                "name": "Volvo Torslanda",
                "address": f"{volvo_address.street}, {volvo_address.city}",
                "latitude": volvo_address.latitude,
                "longitude": volvo_address.longitude,
                "location_type": "enterprise",
            },
        )
        db.commit()

        db.execute(
            text(
                "INSERT INTO locations (name, address, latitude, longitude, location_type, created_at) VALUES (:name, :address, :latitude, :longitude, :location_type, CURRENT_TIMESTAMP)"
            ),
            {
                "name": "Mölnlycke Industrial Park",
                "address": f"{molnlycke_address.street}, {molnlycke_address.city}",
                "latitude": molnlycke_address.latitude,
                "longitude": molnlycke_address.longitude,
                "location_type": "enterprise",
            },
        )
        db.commit()

        db.execute(
            text(
                "INSERT INTO locations (name, address, latitude, longitude, location_type, created_at) VALUES (:name, :address, :latitude, :longitude, :location_type, CURRENT_TIMESTAMP)"
            ),
            {
                "name": "Gothenburg Central",
                "address": f"{gothenburg_address.street}, {gothenburg_address.city}",
                "latitude": gothenburg_address.latitude,
                "longitude": gothenburg_address.longitude,
                "location_type": "public",
            },
        )
        db.commit()

        # Locations created successfully

        # 7. Create users
        print("Creating users...")

        # Admin users
        admin = User(
            user_id=generate_uuid(),
            email="admin@rideshare.com",
            password_hash=get_password_hash("admin123"),
            first_name="Super",
            last_name="Admin",
            phone_number="0123456789",
            user_type=UserType.ADMIN,
            role=UserRole.SUPERADMIN,
            is_superadmin=True,
            is_active=True,
            is_verified=True,
            created_at=utc_now(),
        )

        manager = User(
            user_id=generate_uuid(),
            email="manager@rideshare.com",
            password_hash=get_password_hash("manager123"),
            first_name="Regular",
            last_name="Admin",
            phone_number="9876543210",
            user_type=UserType.ADMIN,
            role=UserRole.MANAGER,
            is_superadmin=False,
            is_active=True,
            is_verified=True,
            created_at=utc_now(),
        )

        # Test user
        test_user = User(
            user_id=generate_uuid(),
            email="test@example.com",
            password_hash=get_password_hash("test123"),
            first_name="Test",
            last_name="User",
            phone_number="1234567890",
            user_type=UserType.PRIVATE,
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
            created_at=utc_now(),
        )

        # Enterprise users
        volvo_user1 = User(
            user_id=generate_uuid(),
            email="employee1@volvo.com",
            password_hash=get_password_hash("password123"),
            first_name="Volvo",
            last_name="Employee1",
            phone_number="1111111111",
            user_type=UserType.ENTERPRISE,
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
            created_at=utc_now(),
        )

        volvo_user2 = User(
            user_id=generate_uuid(),
            email="employee2@volvo.com",
            password_hash=get_password_hash("password123"),
            first_name="Volvo",
            last_name="Employee2",
            phone_number="2222222222",
            user_type=UserType.ENTERPRISE,
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
            created_at=utc_now(),
        )

        molnlycke_user = User(
            user_id=generate_uuid(),
            email="employee@molnlycke.com",
            password_hash=get_password_hash("password123"),
            first_name="Molnlycke",
            last_name="Employee",
            phone_number="3333333333",
            user_type=UserType.ENTERPRISE,
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
            created_at=utc_now(),
        )

        # Driver user
        driver = User(
            user_id=generate_uuid(),
            email="driver@rideshare.com",
            password_hash=get_password_hash("driver123"),
            first_name="Test",
            last_name="Driver",
            phone_number="4444444444",
            user_type=UserType.DRIVER,
            role=UserRole.DRIVER,
            is_active=True,
            is_verified=True,
            created_at=utc_now(),
        )

        db.add_all(
            [
                admin,
                manager,
                test_user,
                volvo_user1,
                volvo_user2,
                molnlycke_user,
                driver,
            ]
        )
        db.commit()

        # 8. Link enterprise users
        print("Linking enterprise users...")
        volvo_eu1 = EnterpriseUser(
            user_id=volvo_user1.id,
            enterprise_id=volvo.id,
            employee_id="V001",
            department="Engineering",
            position="Engineer",
        )

        volvo_eu2 = EnterpriseUser(
            user_id=volvo_user2.id,
            enterprise_id=volvo.id,
            employee_id="V002",
            department="Production",
            position="Manager",
        )

        molnlycke_eu = EnterpriseUser(
            user_id=molnlycke_user.id,
            enterprise_id=molnlycke.id,
            employee_id="M001",
            department="Sales",
            position="Representative",
        )

        db.add_all([volvo_eu1, volvo_eu2, molnlycke_eu])
        db.commit()

        # 9. Create rides
        print("Creating rides...")
        tomorrow = utc_now() + timedelta(days=1)

        # Hub to hub ride
        hub_to_hub_ride = Ride(
            driver_id=driver.id,
            origin_lat=hubs[0].latitude,
            origin_lng=hubs[0].longitude,
            destination_lat=hubs[1].latitude,
            destination_lng=hubs[1].longitude,
            starting_hub_id=hubs[0].id,
            destination_hub_id=hubs[1].id,
            departure_time=tomorrow.replace(hour=8, minute=0),
            status=RideStatus.SCHEDULED,
            available_seats=4,
            price_per_seat=50.0,
            vehicle_type_id=vehicle_types[0].id,
        )

        # Hub to destination ride
        hub_to_dest_ride = Ride(
            driver_id=driver.id,
            origin_lat=hubs[0].latitude,
            origin_lng=hubs[0].longitude,
            destination_lat=gothenburg_central.latitude,
            destination_lng=gothenburg_central.longitude,
            starting_hub_id=hubs[0].id,
            destination_hub_id=None,
            destination_id=gothenburg_central.id,  # Set the destination_id
            departure_time=tomorrow.replace(hour=9, minute=0),
            status=RideStatus.SCHEDULED,
            available_seats=6,
            price_per_seat=60.0,
            vehicle_type_id=vehicle_types[1].id,
        )

        # Enterprise ride
        enterprise_ride = Ride(
            driver_id=driver.id,
            origin_lat=hubs[2].latitude,
            origin_lng=hubs[2].longitude,
            destination_lat=volvo_destination.latitude,
            destination_lng=volvo_destination.longitude,
            starting_hub_id=hubs[2].id,
            destination_hub_id=None,
            destination_id=volvo_destination.id,  # Set the destination_id
            departure_time=tomorrow.replace(hour=7, minute=30),
            status=RideStatus.SCHEDULED,
            available_seats=8,
            price_per_seat=45.0,
            vehicle_type_id=vehicle_types[2].id,
        )

        db.add_all([hub_to_hub_ride, hub_to_dest_ride, enterprise_ride])
        db.commit()

        # 10. Create bookings
        print("Creating bookings...")

        # Booking for hub to hub ride
        booking1 = RideBooking(
            passenger_id=test_user.id,
            ride_id=hub_to_hub_ride.id,
            seats_booked=1,
            booking_status="confirmed",
        )

        # Booking for enterprise ride
        booking2 = RideBooking(
            passenger_id=volvo_user1.id,
            ride_id=enterprise_ride.id,
            seats_booked=1,
            booking_status="confirmed",
        )

        booking3 = RideBooking(
            passenger_id=volvo_user2.id,
            ride_id=enterprise_ride.id,
            seats_booked=1,
            booking_status="confirmed",
        )

        db.add_all([booking1, booking2, booking3])
        db.commit()

        # Update available seats
        hub_to_hub_ride.available_seats -= 1
        enterprise_ride.available_seats -= 2
        db.commit()

        # 11. Create payments
        print("Creating payments...")

        payment1 = Payment(
            booking_id=booking1.id,
            user_id=test_user.id,
            amount=50.0,
            payment_method="credit_card",
            transaction_id=f"txn_{booking1.id}",
            created_at=utc_now(),
        )

        payment2 = Payment(
            booking_id=booking2.id,
            user_id=volvo_user1.id,
            amount=45.0,
            payment_method="swish",
            transaction_id=f"txn_{booking2.id}",
            created_at=utc_now(),
        )

        db.add_all([payment1, payment2])
        db.commit()

        # Print summary
        print("\n===== Database Generation Complete =====")
        print(f"Created {db.query(User).count()} users")
        print(f"Created {db.query(Hub).count()} hubs")
        print(f"Created {db.query(Destination).count()} destinations")
        print(f"Created {db.query(Ride).count()} rides")
        print(f"Created {db.query(RideBooking).count()} bookings")
        print(f"Created {db.query(Payment).count()} payments")
        print(f"Created {db.query(VehicleType).count()} vehicle types")

        print("\n===== Authentication Credentials =====")
        print("Admin: email=admin@rideshare.com, password=admin123")
        print("Manager: email=manager@rideshare.com, password=manager123")
        print("Test User: email=test@example.com, password=test123")
        print("Driver: email=driver@rideshare.com, password=driver123")

        print("\n===== API Routes Guide =====")
        print("Authentication: POST /api/v1/auth/token")
        print("User Profile: GET /api/v1/users/me")
        print("Available Rides: GET /api/v1/rides")
        print("Create Booking: POST /api/v1/bookings")


if __name__ == "__main__":
    try:
        generate_fake_database()
    except Exception as e:
        print(f"Error generating database: {str(e)}")
        import traceback

        traceback.print_exc()
