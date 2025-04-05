import os
import sys
import random
import uuid
from pathlib import Path
from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

# Add the parent directory to sys.path to find the 'app' module
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.models.user import User, Enterprise, EnterpriseUser
from app.models.location import Hub, Location
from app.models.ride import Ride, RideBooking
from app.models.payment import Payment
from app.db.base import Base
from app.core.security import get_password_hash
from app.core.config import settings

# Try to import geocoding service, use a mock if not available
try:
    from app.core.geocoding import geocoding_service
except ImportError:
    # Create a simple mock if the geocoding service isn't available
    class MockGeocodingService:
        def get_coordinates(self, address):
            # Return None to simulate failed geocoding
            return None
    
    geocoding_service = MockGeocodingService()
    print("Warning: Using mock geocoding service - coordinates will be generated randomly")

fake = Faker("sv_SE")  # Swedish locale for realism

# Database setup
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)

# Helper function to create UTC timestamps
def utc_now():
    """Return current UTC time as a datetime object."""
    # Using the recommended modern approach if available
    try:
        return datetime.now(timezone.utc)
    except (AttributeError, TypeError):
        # Fallback for older Python versions
        return datetime.utcnow()

# Helper function to generate unique user ID
def generate_unique_user_id():
    """Generate a unique user ID"""
    return f"UID-{uuid.uuid4().hex[:8].upper()}"

def generate_fake_database():
    with Session(engine) as db:
        # Clear existing data
        db.query(RideBooking).delete()
        db.query(Payment).delete()
        db.query(Ride).delete()
        db.query(EnterpriseUser).delete()
        db.query(User).delete()
        db.query(Hub).delete()
        db.query(Location).delete()
        db.query(Enterprise).delete()
        db.commit()

        # Enterprises
        volvo = Enterprise(name="Volvo Torslanda", is_active=True)
        molnlycke_park = Enterprise(name="Mölnlycke Industrial Park", is_active=True)
        db.add_all([volvo, molnlycke_park])
        db.commit()

        # Locations (Destinations)
        volvo_location = Location(
            name="Volvo Torslanda Plant",
            address="Volvo Torslanda, 405 31 Göteborg",
            coordinates="POINT(11.8583 57.7181)",  # Approx Torslanda coords
            enterprise_id=volvo.id
        )
        molnlycke_location = Location(
            name="Mölnlycke Industrial Park",
            address="Industrivägen, 435 33 Mölnlycke",
            coordinates="POINT(12.1167 57.6589)",  # Approx Mölnlycke coords
            enterprise_id=molnlycke_park.id
        )
        private_destination = Location(
            name="Gothenburg Central",
            address="Drottningtorget, 411 03 Göteborg",
            coordinates="POINT(11.9750 57.7089)"  # Approx central Gothenburg
        )
        db.add_all([volvo_location, molnlycke_location, private_destination])
        db.commit()

        # Hubs (Starting Points)
        hubs = [
            Hub(name="Hub North", address="North Göteborg", coordinates="POINT(11.8500 57.7500)", is_active=True),  # North of Torslanda
            Hub(name="Hub South", address="South Göteborg", coordinates="POINT(11.8700 57.6900)", is_active=True),  # South of Torslanda
            Hub(name="Hub East", address="East Göteborg", coordinates="POINT(11.9000 57.7200)", is_active=True),   # East of Torslanda
            Hub(name="Hub West", address="West Göteborg", coordinates="POINT(11.8200 57.7300)", is_active=True),   # West of Torslanda
            Hub(name="Mölnlycke Hub", address="Mölnlycke Center", coordinates="POINT(12.1000 57.6600)", is_active=True),  # Near Mölnlycke
            Hub(name="Private Hub", address="Residential Area", coordinates="POINT(11.9300 57.6800)", is_active=True)  # Private users hub
        ]
        db.add_all(hubs)
        db.commit()

        # Helper function to extract coordinates from POINT format
        def extract_coords(point_str):
            point_str = point_str.replace("POINT(", "").replace(")", "")
            parts = point_str.split()
            return float(parts[0]), float(parts[1])

        # Volvo Torslanda Employees (100 users, 25 per hub)
        volvo_users = []
        for i in range(100):
            hub_idx = i // 25  # Divide into 4 groups
            hub_x, hub_y = extract_coords(hubs[hub_idx].coordinates)
            home_coords = f"POINT({hub_x + random.uniform(-0.01, 0.01)} {hub_y + random.uniform(-0.01, 0.01)})"
            home_address = fake.street_address() + ", Göteborg"
            
            # Try geocoding for some addresses
            if i % 5 == 0:  # Every 5th user, try to geocode
                coords = geocoding_service.get_coordinates(home_address)
                if coords:
                    home_coords = f"POINT({coords[1]} {coords[0]})"
            
            user = User(
                user_id=generate_unique_user_id(),
                email=f"employee{i+1}@volvo.com",
                password_hash=get_password_hash("password123"),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone_number=fake.phone_number(),
                user_type="enterprise",
                home_address=home_address,
                home_location=home_coords,
                work_address="Volvo Torslanda, 405 31 Göteborg",
                work_location=volvo_location.coordinates,
                created_at=utc_now()
            )
            volvo_users.append(user)
            db.add(user)
        db.commit()

        # Link Volvo users to enterprise
        for i, user in enumerate(volvo_users):
            eu = EnterpriseUser(
                user_id=user.id,
                enterprise_id=volvo.id,
                employee_id=f"V{i+1:03d}",
                department=random.choice(["Production", "Engineering", "Logistics", "HR"]),
                position=random.choice(["Worker", "Engineer", "Manager"])
            )
            db.add(eu)
        db.commit()

        # Private Users (50 users sharing a hub and destination)
        private_users = []
        for i in range(50):
            hub_x, hub_y = extract_coords(hubs[5].coordinates)
            home_coords = f"POINT({hub_x + random.uniform(-0.005, 0.005)} {hub_y + random.uniform(-0.005, 0.005)})"
            home_address = fake.street_address() + ", Göteborg"
            
            # Try geocoding for some addresses
            if i % 5 == 0:  # Every 5th user, try to geocode
                coords = geocoding_service.get_coordinates(home_address)
                if coords:
                    home_coords = f"POINT({coords[1]} {coords[0]})"
            
            user = User(
                user_id=generate_unique_user_id(),
                email=f"private{i+1}@example.com",
                password_hash=get_password_hash("password123"),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone_number=fake.phone_number(),
                user_type="private",
                home_address=home_address,
                home_location=home_coords,
                work_address="Drottningtorget, 411 03 Göteborg",
                work_location=private_destination.coordinates,
                created_at=utc_now()
            )
            private_users.append(user)
            db.add(user)
        db.commit()

        # Mölnlycke Industrial Park Users (20 users sharing a hub)
        molnlycke_users = []
        for i in range(20):
            hub_x, hub_y = extract_coords(hubs[4].coordinates)
            home_coords = f"POINT({hub_x + random.uniform(-0.008, 0.008)} {hub_y + random.uniform(-0.008, 0.008)})"
            home_address = fake.street_address() + ", Mölnlycke"
            
            # Try geocoding for some addresses
            if i % 5 == 0:  # Every 5th user, try to geocode
                coords = geocoding_service.get_coordinates(home_address)
                if coords:
                    home_coords = f"POINT({coords[1]} {coords[0]})"
            
            user = User(
                user_id=generate_unique_user_id(),
                email=f"molnlycke{i+1}@industrial.com",
                password_hash=get_password_hash("password123"),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone_number=fake.phone_number(),
                user_type="enterprise",
                home_address=home_address,
                home_location=home_coords,
                work_address="Industrivägen, 435 33 Mölnlycke",
                work_location=molnlycke_location.coordinates,
                created_at=utc_now()
            )
            molnlycke_users.append(user)
            db.add(user)
        db.commit()

        # Link Mölnlycke users to enterprise
        for i, user in enumerate(molnlycke_users):
            eu = EnterpriseUser(
                user_id=user.id,
                enterprise_id=molnlycke_park.id,
                employee_id=f"M{i+1:03d}",
                department=random.choice(["Manufacturing", "Sales", "Maintenance"]),
                position=random.choice(["Technician", "Supervisor"])
            )
            db.add(eu)
        db.commit()

        # Create an admin user
        admin_user = User(
            user_id=generate_unique_user_id(),
            email="admin@rideshare.com",
            password_hash=get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            phone_number="0123456789",
            user_type="admin",
            created_at=utc_now()
        )
        db.add(admin_user)
        db.commit()

        # Rides and Bookings
        tomorrow = utc_now() + timedelta(days=1)
        rides = []

        # Volvo Rides (4 rides, one per hub)
        for i in range(4):
            ride = Ride(
                starting_hub_id=hubs[i].id,
                destination_id=volvo_location.id,
                departure_time=tomorrow.replace(hour=8, minute=0),  # 8:00 AM
                vehicle_type="minivan",
                capacity=8,
                available_seats=8,
                status="scheduled"
            )
            rides.append(ride)
            db.add(ride)
        db.commit()

        # Assign Volvo users to rides (25 per ride)
        for i, ride in enumerate(rides[:4]):
            for j in range(25):
                user = volvo_users[i * 25 + j]
                booking = RideBooking(
                    user_id=user.id,
                    ride_id=ride.id,
                    passenger_count=1,
                    price=50.0,
                    booking_time=utc_now()
                )
                ride.available_seats -= 1
                db.add(booking)
        db.commit()

        # Private User Rides (2 rides, 25 users each)
        for i in range(2):
            ride = Ride(
                starting_hub_id=hubs[5].id,
                destination_id=private_destination.id,
                departure_time=tomorrow.replace(hour=9, minute=0),  # 9:00 AM
                vehicle_type="shuttle",
                capacity=30,
                available_seats=30,
                status="scheduled"
            )
            rides.append(ride)
            db.add(ride)
        db.commit()

        # Assign Private users to rides
        for i, ride in enumerate(rides[4:6]):
            for j in range(25):
                user = private_users[i * 25 + j]
                booking = RideBooking(
                    user_id=user.id,
                    ride_id=ride.id,
                    passenger_count=1,
                    price=40.0,
                    booking_time=utc_now()
                )
                ride.available_seats -= 1
                db.add(booking)
        db.commit()

        # Mölnlycke Ride (1 ride for 20 users)
        ride = Ride(
            starting_hub_id=hubs[4].id,
            destination_id=molnlycke_location.id,
            departure_time=tomorrow.replace(hour=7, minute=30),  # 7:30 AM
            vehicle_type="minivan",
            capacity=20,
            available_seats=20,
            status="scheduled"
        )
        rides.append(ride)
        db.add(ride)
        db.commit()

        # Assign Mölnlycke users to ride
        for user in molnlycke_users:
            booking = RideBooking(
                user_id=user.id,
                ride_id=rides[6].id,
                passenger_count=1,
                price=45.0,
                booking_time=utc_now()
            )
            rides[6].available_seats -= 1
            db.add(booking)
        db.commit()

        # Payments for some bookings (randomly)
        all_bookings = db.query(RideBooking).all()
        for booking in random.sample(all_bookings, 50):  # 50 random payments
            payment = Payment(
                booking_id=booking.id,
                user_id=booking.user_id,
                amount=booking.price,
                payment_method="credit_card",
                transaction_id=f"txn_{booking.id}",
                payment_time=utc_now()
            )
            db.add(payment)
        db.commit()

        print("Fake database generated successfully!")
        print(f"Created {db.query(User).count()} users")
        print(f"Created {db.query(Ride).count()} rides")
        print(f"Created {db.query(RideBooking).count()} bookings")
        print(f"Created {db.query(Payment).count()} payments")
        print(f"Admin user: email=admin@rideshare.com, password=admin123")

if __name__ == "__main__":
    generate_fake_database()
