
import os
import sys
import random
import uuid
from pathlib import Path
from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from sqlalchemy.sql import text

# Add the parent directory to sys.path to find the 'app' module
sys.path.append(str(Path(__file__).resolve().parent.parent))

# Import app.db and configure_relationships function
import app.db
from app.db import configure_relationships

try:
    # Import base models first to ensure proper initialization
    from app.db.base import Base
    from app.core.config import settings
    
    # Then import specific models with proper error handling
    from app.models.user import User, Enterprise, EnterpriseUser, UserType
    # Import Hub from hub.py, not location.py
    from app.models.hub import Hub  # Changed from location import Hub
    from app.models.location import Location, GeocodingCache
    from app.models.address import Address
    
    # Import potentially problematic models last
    try:
        from app.models.ride import Ride, RideBooking, RideStatus
    except ImportError as e:
        print(f"Warning: Error importing ride models: {e}")
        Ride, RideBooking, RideStatus = None, None, None
    
    try:
        from app.models.payment import Payment
    except ImportError as e:
        print(f"Warning: Error importing payment model: {e}")
        Payment = None
        
    # Try to import vehicle types
    try:
        from app.models.vehicle_type import VehicleType
    except ImportError as e:
        print(f"Warning: Error importing vehicle type model: {e}")
        # Create a simple class to use if import fails
        class VehicleType:
            id = None
            name = None
            description = None
            max_passengers = None
            
    from app.core.security import get_password_hash
except ImportError as e:
    print(f"Error importing required modules: {e}")
    sys.exit(1)

# Try to import geocoding service, use a mock if not available
# Helper function to safely get coordinates
def get_coords_for_address(address_string):
    """
    Safely get coordinates for an address string.
    Handles both sync and async versions of get_coordinates.
    """
    try:
        # Try to import from the correct location
        try:
            from app.services.geocoding_service import geocoding_service
        except ImportError:
            # Fall back to the original import path
            from app.core.geocoding import geocoding_service
        
        # Try to get real coordinates
        coords_result = geocoding_service.get_coordinates(address_string)
        
        # Check if it's a coroutine
        if hasattr(coords_result, '__await__'):
            print(f"Detected async get_coordinates method for {address_string}. Using fallback.")
            # Generate a random point in Gothenburg area
            lat = random.uniform(57.6, 57.8)  # Gothenburg latitude range 
            lng = random.uniform(11.8, 12.1)  # Gothenburg longitude range
            print(f"Warning: Using fallback coordinates for {address_string}: {lat}, {lng}")
            return (lat, lng)
        
        # If we got normal coordinates, return them
        if coords_result is not None:
            return coords_result
            
        # If geocoding failed, use fallback
        print(f"Geocoding failed for {address_string}. Using fallback.")
        lat = random.uniform(57.6, 57.8)
        lng = random.uniform(11.8, 12.1)
        print(f"Warning: Using fallback coordinates for {address_string}: {lat}, {lng}")
        return (lat, lng)
        
    except Exception as e:
        print(f"Error getting coordinates for {address_string}: {e}")
        # Return fallback coordinates in Gothenburg
        lat = random.uniform(57.6, 57.8)
        lng = random.uniform(11.8, 12.1)
        print(f"Warning: Using fallback coordinates for {address_string} after error: {lat}, {lng}")
        return (lat, lng)

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
    # Call configure_relationships explicitly here to ensure it's done
    # before any database operations
    print("Configuring relationships...")
    success = configure_relationships()
    if not success:
        print("Warning: Failed to configure relationships!")
    
    print("Starting database generation...")
    
    # Check if required models are available
    if None in (Ride, RideBooking, RideStatus, Payment):
        print("Error: Required models are missing. Cannot proceed.")
        return

    with Session(engine) as db:
        # Clear existing data with error handling
        try:
            print("Cleaning existing data...")
            
            # Use direct SQL to avoid relationship issues
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
                "geocoding_cache",
                "message_attachments", 
                "messages",
                "conversation_participants", 
                "conversations", 
                "user_message_settings",
                "vehicle_types"  # Add vehicle_types table to clean
            ]
            
            for table in tables:
                try:
                    db.execute(text(f"DELETE FROM {table}"))
                    db.commit()
                except Exception as e:
                    db.rollback()
                    print(f"Warning: Could not clear table {table}: {e}")
            
            print("Cleared existing data")
        except Exception as e:
            db.rollback()
            print(f"Error clearing data: {e}")
            print("Continuing with database generation...")

        # First, create vehicle types
        print("Creating vehicle types...")
        vehicle_types = []
        
        # Check if VehicleType has been imported as a class or needs to be created
        if 'VehicleType' in globals() and hasattr(VehicleType, '__table__'):
            # Create vehicle types
            vehicle_type_data = [
                {"name": "Sedan", "description": "Standard 4-door car", "max_passengers": 4},
                {"name": "SUV", "description": "Sport utility vehicle with extra space", "max_passengers": 6},
                {"name": "Van", "description": "Larger vehicle for groups", "max_passengers": 8}
            ]
            
            for data in vehicle_type_data:
                vehicle_type = VehicleType(
                    name=data["name"],
                    description=data["description"],
                    max_passengers=data["max_passengers"]
                )
                vehicle_types.append(vehicle_type)
                db.add(vehicle_type)
            db.commit()
            print(f"Created {len(vehicle_types)} vehicle types")
        else:
            # Create vehicle types as database entries directly
            for vehicle_data in [
                {"name": "Sedan", "description": "Standard 4-door car", "max_passengers": 4},
                {"name": "SUV", "description": "Sport utility vehicle with extra space", "max_passengers": 6},
                {"name": "Van", "description": "Larger vehicle for groups", "max_passengers": 8}
            ]:
                try:
                    db.execute(
                        text("INSERT INTO vehicle_types (name, description, max_passengers, created_at) VALUES (:name, :description, :max_passengers, :created_at)"),
                        {
                            "name": vehicle_data["name"],
                            "description": vehicle_data["description"],
                            "max_passengers": vehicle_data["max_passengers"],
                            "created_at": utc_now()
                        }
                    )
                    db.commit()
                    
                    # Get the created vehicle type ID
                    result = db.execute(
                        text("SELECT id FROM vehicle_types WHERE name = :name"),
                        {"name": vehicle_data["name"]}
                    ).fetchone()
                    if result:
                        # Create a simple object to hold the ID
                        vehicle_type = type('VehicleType', (), {'id': result[0], 'name': vehicle_data["name"]})
                        vehicle_types.append(vehicle_type)
                except Exception as e:
                    db.rollback()
                    print(f"Warning: Could not create vehicle type {vehicle_data['name']}: {e}")
            
            print(f"Created {len(vehicle_types)} vehicle types using direct SQL")

        # Enterprises
        volvo = Enterprise(name="Volvo Torslanda", is_active=True)
        molnlycke_park = Enterprise(name="Mölnlycke Industrial Park", is_active=True)
        db.add_all([volvo, molnlycke_park])
        db.commit()

        # Create Address objects first - updated to match Address model
        volvo_address = Address(
            street="Volvo Torslanda",
            city="Göteborg",
            state="Västra Götaland",
            postal_code="405 31",
            country="Sweden",
            latitude=57.7181,
            longitude=11.8583
        )
        molnlycke_address = Address(
            street="Industrivägen",
            city="Mölnlycke",
            state="Västra Götaland",
            postal_code="435 33",
            country="Sweden",
            latitude=57.6589,
            longitude=12.1167
        )
        gothenburg_address = Address(
            street="Drottningtorget",
            city="Göteborg",
            state="Västra Götaland",
            postal_code="411 03",
            country="Sweden",
            latitude=57.7089,
            longitude=11.9750
        )
        db.add_all([volvo_address, molnlycke_address, gothenburg_address])
        db.commit()

        # Hub data for Göteborg and surrounding areas
        hub_data = [
            {
                "name": "Hub North", 
                "description": "Northern Göteborg transport hub",
                "address": "North Göteborg, Göteborg",
                "city": "Göteborg",
                "postal_code": "41756",
                "latitude": 57.7500, 
                "longitude": 11.8500
            },
            {
                "name": "Hub South", 
                "description": "Southern Göteborg transport hub",
                "address": "South Göteborg, Göteborg",
                "city": "Göteborg",
                "postal_code": "41468",
                "latitude": 57.6900, 
                "longitude": 11.8700
            },
            {
                "name": "Hub East", 
                "description": "Eastern Göteborg transport hub",
                "address": "East Göteborg, Göteborg",
                "city": "Göteborg",
                "postal_code": "41612",
                "latitude": 57.7200, 
                "longitude": 11.9000
            },
            {
                "name": "Hub West", 
                "description": "Western Göteborg transport hub",
                "address": "West Göteborg, Göteborg",
                "city": "Göteborg",
                "postal_code": "41705",
                "latitude": 57.7300, 
                "longitude": 11.8200
            },
            {
                "name": "Mölnlycke Hub", 
                "description": "Mölnlycke central transport hub",
                "address": "Mölnlycke Center, Mölnlycke",
                "city": "Mölnlycke",
                "postal_code": "43533",
                "latitude": 57.6600, 
                "longitude": 12.1000
            },
            {
                "name": "Private Hub", 
                "description": "Residential area transport hub",
                "address": "Residential Area, Göteborg",
                "city": "Göteborg",
                "postal_code": "41253",
                "latitude": 57.6800, 
                "longitude": 11.9300
            }
        ]

        # Locations (Destinations)
        volvo_location = Location(
            latitude=volvo_address.latitude,
            longitude=volvo_address.longitude,
            location_type="enterprise",
            address=f"{volvo_address.street}, {volvo_address.city}",
            enterprise_id=volvo.id
        )
        molnlycke_location = Location(
            latitude=molnlycke_address.latitude,
            longitude=molnlycke_address.longitude,
            location_type="enterprise",
            address=f"{molnlycke_address.street}, {molnlycke_address.city}",
            enterprise_id=molnlycke_park.id
        )
        private_destination = Location(
            latitude=gothenburg_address.latitude,
            longitude=gothenburg_address.longitude,
            location_type="public",
            address=f"{gothenburg_address.street}, {gothenburg_address.city}"
        )
        db.add_all([volvo_location, molnlycke_location, private_destination])
        db.commit()

        # Create Hubs - matching exactly the Hub model in hub.py
        hubs = []
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
                created_at=utc_now()
            )
            hubs.append(hub)
            db.add(hub)
        db.commit()
        
        print(f"Created {len(hubs)} hubs: {[h.id for h in hubs]}")

        # Helper function to create an address with coordinates
        def create_address_with_coords(street_name, city_name, lat, lng):
            # Split street name into street and number
            parts = street_name.split()
            house_number = parts[-1] if len(parts) > 1 and parts[-1].isdigit() else "1"
            street = " ".join(parts[:-1]) if len(parts) > 1 and parts[-1].isdigit() else street_name
            
            # Generate a postal code for the area
            post_code = "".join([str(random.randint(0, 9)) for _ in range(3)]) + " " + "".join([str(random.randint(0, 9)) for _ in range(2)])
            
            address = Address(
                street=street,
                city=city_name,
                state="Västra Götaland",
                postal_code=post_code,
                country="Sweden",
                latitude=lat,
                longitude=lng
            )
            db.add(address)
            db.flush()  # Flush to get the ID but don't commit yet
            return address

        # Create admin users (one super admin and one regular admin) - MODIFIED FOR CORRECT EMAIL
        # Note: Using the email that failed in the error message
        super_admin = User(
            user_id=generate_unique_user_id(),
            email="admin@rideshare.com",  # Keep this exact email to match error message
            password_hash=get_password_hash("admin123"),
            first_name="Super",
            last_name="Admin",
            phone_number="0123456789",
            user_type=UserType.ADMIN,
            is_superadmin=True,
            is_active=True,
            is_verified=True,
            created_at=utc_now()
        )
        
        regular_admin = User(
            user_id=generate_unique_user_id(),
            email="manager@rideshare.com",
            password_hash=get_password_hash("manager123"),
            first_name="Regular",
            last_name="Admin",
            phone_number="9876543210",
            user_type=UserType.ADMIN,
            is_superadmin=False,
            is_active=True,
            is_verified=True,
            created_at=utc_now()
        )
        
        # Create a regular user that matches the logs (johndoen@example.com)
        test_user = User(
            user_id=generate_unique_user_id(),
            email="johndoen@example.com",
            password_hash=get_password_hash("testuser123"),
            first_name="John",
            last_name="Doen",
            phone_number="1234509876",
            user_type=UserType.PRIVATE,
            is_active=True,
            is_verified=True,
            created_at=utc_now()
        )
        
        db.add_all([super_admin, regular_admin, test_user])
        db.commit()
        print(f"Created admin users and test user (ID: {test_user.id})")

        # Volvo Torslanda Employees (100 users, 25 per hub)
        volvo_users = []
        for i in range(100):
            hub_idx = i // 25  # Divide into 4 groups
            hub = hubs[hub_idx]
            
            # Generate a slight deviation from the hub coordinates
            lat = hub.latitude + random.uniform(-0.01, 0.01)
            lng = hub.longitude + random.uniform(-0.01, 0.01)
            
            home_street = fake.street_name() + " " + str(random.randint(1, 100))
            
            # Try geocoding for some addresses
            if i % 5 == 0:  # Every 5th user, try to geocode
                coords = get_coords_for_address(f"{home_street}, Göteborg")
                if coords:
                    lat, lng = coords[0], coords[1]
            
            # Create home address
            home_address = create_address_with_coords(home_street, "Göteborg", lat, lng)
            
            user = User(
                user_id=generate_unique_user_id(),
                email=f"employee{i+1}@volvo.com",
                password_hash=get_password_hash("password123"),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone_number=fake.phone_number(),
                user_type=UserType.ENTERPRISE,
                # Address strings
                home_address=home_address.street,
                work_address=volvo_address.street,
                # Coordinates
                latitude=lat,
                longitude=lng,
                work_latitude=volvo_address.latitude,
                work_longitude=volvo_address.longitude,
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
            hub = hubs[5]  # Private Hub
            
            # Generate a slight deviation from the hub coordinates
            lat = hub.latitude + random.uniform(-0.005, 0.005)
            lng = hub.longitude + random.uniform(-0.005, 0.005)
            
            home_street = fake.street_name() + " " + str(random.randint(1, 100))
            
            # Try geocoding for some addresses
            if i % 5 == 0:  # Every 5th user, try to geocode
                coords = get_coords_for_address(f"{home_street}, Göteborg")
                if coords:
                    lat, lng = coords[0], coords[1]
            
            # Create home address
            home_address = create_address_with_coords(home_street, "Göteborg", lat, lng)
            
            user = User(
                user_id=generate_unique_user_id(),
                email=f"private{i+1}@example.com",
                password_hash=get_password_hash("password123"),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone_number=fake.phone_number(),
                user_type=UserType.PRIVATE,
                # Address strings
                home_address=home_address.street,
                work_address=gothenburg_address.street,
                # Coordinates
                latitude=lat,
                longitude=lng,
                work_latitude=gothenburg_address.latitude,
                work_longitude=gothenburg_address.longitude,
                created_at=utc_now()
            )
            private_users.append(user)
            db.add(user)
        db.commit()

        # Mölnlycke Industrial Park Users (20 users sharing a hub)
        molnlycke_users = []
        for i in range(20):
            hub = hubs[4]  # Mölnlycke Hub
            
            # Generate a slight deviation from the hub coordinates
            lat = hub.latitude + random.uniform(-0.008, 0.008)
            lng = hub.longitude + random.uniform(-0.008, 0.008)
            
            home_street = fake.street_name() + " " + str(random.randint(1, 100))
            
            # Try geocoding for some addresses
            if i % 5 == 0:  # Every 5th user, try to geocode
                coords = get_coords_for_address(f"{home_street}, Mölnlycke")
                if coords:
                    lat, lng = coords[0], coords[1]
                    
            # Create home address
            home_address = create_address_with_coords(home_street, "Mölnlycke", lat, lng)
            
            user = User(
                user_id=generate_unique_user_id(),
                email=f"molnlycke{i+1}@industrial.com",
                password_hash=get_password_hash("password123"),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                phone_number=fake.phone_number(),
                user_type=UserType.ENTERPRISE,
                # Address strings
                home_address=home_address.street,
                work_address=molnlycke_address.street,
                # Coordinates
                latitude=lat,
                longitude=lng,
                work_latitude=molnlycke_address.latitude,
                work_longitude=molnlycke_address.longitude,
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

        # Rides and Bookings - Updated to include vehicle_type_id
        tomorrow = utc_now() + timedelta(days=1)
        rides = []

        # Volvo Rides (4 rides, one per hub)
        for i in range(4):
            # Get hub information
            starting_hub = hubs[i]
            destination_coord = (volvo_location.latitude, volvo_location.longitude)
            
            # Assign a vehicle type
            vehicle_type_id = vehicle_types[random.randint(0, len(vehicle_types)-1)].id
            
            ride = Ride(
                driver_id=volvo_users[i].id,  # Assign a driver
                origin_lat=starting_hub.latitude,
                origin_lng=starting_hub.longitude,
                destination_lat=destination_coord[0],
                destination_lng=destination_coord[1],
                starting_hub_id=starting_hub.id,
                destination_hub_id=None,  # No destination hub for enterprise rides
                departure_time=tomorrow.replace(hour=8, minute=0),  # 8:00 AM
                status=RideStatus.SCHEDULED,
                available_seats=8,
                price_per_seat=50.0,
                vehicle_type_id=vehicle_type_id  # Include vehicle_type_id
            )
            rides.append(ride)
            db.add(ride)
        db.commit()

        # Assign Volvo users to rides (25 per ride)
        for i, ride in enumerate(rides[:4]):
            for j in range(25):
                user = volvo_users[i * 25 + j]
                booking = RideBooking(
                    passenger_id=user.id,
                    ride_id=ride.id,
                    seats_booked=1,
                    booking_status="confirmed",
                    pickup_lat=ride.origin_lat + random.uniform(-0.001, 0.001),
                    pickup_lng=ride.origin_lng + random.uniform(-0.001, 0.001),
                    dropoff_lat=ride.destination_lat + random.uniform(-0.001, 0.001),
                    dropoff_lng=ride.destination_lng + random.uniform(-0.001, 0.001),
                )
                ride.available_seats -= 1
                db.add(booking)
        db.commit()

        # Private User Rides (2 rides, 25 users each)
        for i in range(2):
            # Get hub information
            starting_hub = hubs[5]  # Private hub
            destination_hub = hubs[2]  # Use East hub as destination for variety
            
            # Assign a vehicle type
            vehicle_type_id = vehicle_types[random.randint(0, len(vehicle_types)-1)].id
            
            ride = Ride(
                driver_id=private_users[i].id,  # Assign a driver
                origin_lat=starting_hub.latitude,
                origin_lng=starting_hub.longitude,
                destination_lat=destination_hub.latitude,
                destination_lng=destination_hub.longitude,
                starting_hub_id=starting_hub.id,
                destination_hub_id=destination_hub.id,
                departure_time=tomorrow.replace(hour=9, minute=0),  # 9:00 AM
                status=RideStatus.SCHEDULED,
                available_seats=30,
                price_per_seat=40.0,
                vehicle_type_id=vehicle_type_id  # Include vehicle_type_id
            )
            rides.append(ride)
            db.add(ride)
        db.commit()

        # Assign Private users to rides
        for i, ride in enumerate(rides[4:6]):
            for j in range(25):
                if i * 25 + j < len(private_users):  # Check to avoid index errors
                    user = private_users[i * 25 + j]
                    booking = RideBooking(
                        passenger_id=user.id,
                        ride_id=ride.id,
                        seats_booked=1,
                        booking_status="confirmed",
                        pickup_lat=ride.origin_lat + random.uniform(-0.001, 0.001),
                        pickup_lng=ride.origin_lng + random.uniform(-0.001, 0.001),
                        dropoff_lat=ride.destination_lat + random.uniform(-0.001, 0.001),
                        dropoff_lng=ride.destination_lng + random.uniform(-0.001, 0.001),
                    )
                    ride.available_seats -= 1
                    db.add(booking)
        db.commit()

        # Mölnlycke Ride (1 ride for 20 users)
        starting_hub = hubs[4]  # Mölnlycke hub
        destination_coord = (molnlycke_location.latitude, molnlycke_location.longitude)
        
        # Assign a vehicle type
        vehicle_type_id = vehicle_types[random.randint(0, len(vehicle_types)-1)].id
        
        ride = Ride(
            driver_id=molnlycke_users[0].id,  # Assign a driver
            origin_lat=starting_hub.latitude,
            origin_lng=starting_hub.longitude,
            destination_lat=destination_coord[0],
            destination_lng=destination_coord[1],
            starting_hub_id=starting_hub.id,
            destination_hub_id=None,  # No destination hub for enterprise rides
            departure_time=tomorrow.replace(hour=7, minute=30),  # 7:30 AM
            status=RideStatus.SCHEDULED,
            available_seats=20,
            price_per_seat=45.0,
            vehicle_type_id=vehicle_type_id  # Include vehicle_type_id
        )
        rides.append(ride)
        db.add(ride)
        db.commit()

        # Assign Mölnlycke users to ride
        for user in molnlycke_users:
            booking = RideBooking(
                passenger_id=user.id,
                ride_id=rides[6].id,
                seats_booked=1,
                booking_status="confirmed",
                pickup_lat=ride.origin_lat + random.uniform(-0.001, 0.001),
                pickup_lng=ride.origin_lng + random.uniform(-0.001, 0.001),
                dropoff_lat=ride.destination_lat + random.uniform(-0.001, 0.001),
                dropoff_lng=ride.destination_lng + random.uniform(-0.001, 0.001),
            )
            rides[6].available_seats -= 1
            db.add(booking)
        db.commit()

        # Create a booking for the test user (johndoen@example.com)
        test_user_booking = RideBooking(
            passenger_id=test_user.id,
            ride_id=rides[5].id,
            seats_booked=1,
            booking_status="confirmed",
            pickup_lat=rides[5].origin_lat + random.uniform(-0.001, 0.001),
            pickup_lng=rides[5].origin_lng + random.uniform(-0.001, 0.001),
            dropoff_lat=rides[5].destination_lat + random.uniform(-0.001, 0.001),
            dropoff_lng=rides[5].destination_lng + random.uniform(-0.001, 0.001),
        )
        
        db.add(test_user_booking)
        db.commit()

        # Payments for some bookings (randomly)
        all_bookings = db.query(RideBooking).all()
        for booking in random.sample(all_bookings, 50):  # 50 random payments
            payment = Payment(
                booking_id=booking.id,
                user_id=booking.passenger_id,
                amount=40.0,  # Use a fixed amount or calculate based on ride.price_per_seat
                payment_method="credit_card",
                transaction_id=f"txn_{booking.id}",
                created_at=utc_now()
            )
            db.add(payment)
        db.commit()

        # Also make a payment for our test user
        test_payment = Payment(
            booking_id=test_user_booking.id,
            user_id=test_user.id,
            amount=40.0,
            payment_method="credit_card",
            transaction_id=f"txn_{test_user_booking.id}",
            created_at=utc_now()
        )
        db.add(test_payment)
        db.commit()

        print("\n===== Database Generation Complete =====")
        print(f"Created {db.query(User).count()} users")
        print(f"Created {db.query(Hub).count()} hubs")
        print(f"Created {db.query(Ride).count()} rides")
        print(f"Created {db.query(RideBooking).count()} bookings")
        print(f"Created {db.query(Payment).count()} payments")
        print("\n===== Authentication Credentials =====")
        print("Super Admin: email=admin@rideshare.com, password=admin123")
        print("Regular Admin: email=manager@rideshare.com, password=manager123")
        print("Test User: email=johndoen@example.com, password=testuser123")
        print("\n===== API Routes Guide =====")
        print("Authentication: POST /api/v1/auth/token")
        print("User Profile: GET /api/v1/users/me")
        print("All Users (admin only): GET /api/v1/users")
        print("Available Rides: GET /api/v1/rides")
        print("Create Booking: POST /api/v1/bookings")
        print("User Bookings: GET /api/v1/bookings")
        print("Admin-only routes include:")
        print("  - GET /api/v1/users (list all users)")
        print("  - POST /api/v1/users (create new user)")
        print("  - DELETE /api/v1/users/{user_id} (delete user)")
        print("  - GET /api/v1/analytics/* (access analytics endpoints)")
        print("  - POST /api/v1/enterprises (create enterprise)")
        print("  - POST /api/v1/locations (create location)")
        print("  - POST /api/v1/hubs (create hub)")

def run_with_error_handling():
    try:
        # Configure relationships first
        print("Configuring relationships...")
        success = configure_relationships()
        if not success:
            print("Warning: Failed to configure relationships!")
        
        # Try to create tables
        try:
            print("Creating database tables...")
            Base.metadata.create_all(bind=engine)
            print("Database tables created successfully")
        except Exception as e:
            print(f"Error creating database tables: {e}")
            import traceback
            traceback.print_exc()
            print("\nPlease check your model definitions and database connection.")
            sys.exit(1)
            
        # Then generate data
        generate_fake_database()
    except Exception as e:
        print(f"Error generating database: {str(e)}")
        import traceback
        traceback.print_exc()
        print("\nPlease check your model definitions and database connection.")
        sys.exit(1)

if __name__ == "__main__":
    run_with_error_handling()
