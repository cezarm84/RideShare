import asyncio
import datetime
import random
import sys
import uuid
from datetime import timedelta
from pathlib import Path
from typing import Optional, Tuple

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Add the parent directory to sys.path to find the 'app' module
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.core.geocoding import geocode_address
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
    return datetime.datetime.utcnow()


def generate_uuid():
    """Generate a UUID string for user identification."""
    return str(uuid.uuid4())


# Swedish first names
SWEDISH_FIRST_NAMES = [
    "Erik",
    "Anders",
    "Johan",
    "Lars",
    "Karl",
    "Per",
    "Nils",
    "Olof",
    "Jan",
    "Gustav",
    "Sven",
    "Björn",
    "Fredrik",
    "Magnus",
    "Bengt",
    "Hans",
    "Göran",
    "Mikael",
    "Mats",
    "Åke",
    "Maria",
    "Anna",
    "Margareta",
    "Elisabeth",
    "Eva",
    "Kristina",
    "Birgitta",
    "Karin",
    "Elisabet",
    "Marie",
    "Ingrid",
    "Christina",
    "Sofia",
    "Linnéa",
    "Kerstin",
    "Sara",
    "Johanna",
    "Emma",
    "Lena",
    "Inger",
]

# Swedish last names
SWEDISH_LAST_NAMES = [
    "Andersson",
    "Johansson",
    "Karlsson",
    "Nilsson",
    "Eriksson",
    "Larsson",
    "Olsson",
    "Persson",
    "Svensson",
    "Gustafsson",
    "Pettersson",
    "Jonsson",
    "Jansson",
    "Hansson",
    "Bengtsson",
    "Jönsson",
    "Lindberg",
    "Jakobsson",
    "Magnusson",
    "Olofsson",
    "Lindström",
    "Lindgren",
    "Axelsson",
    "Bergström",
    "Lundberg",
    "Lundgren",
    "Mattsson",
    "Berglund",
    "Fredriksson",
    "Sandberg",
]

# Gothenburg neighborhoods
GOTHENBURG_NEIGHBORHOODS = [
    {
        "name": "Centrum",
        "postal_codes": ["411", "413"],
        "lat_range": (57.695, 57.715),
        "lon_range": (11.945, 11.985),
    },
    {
        "name": "Majorna-Linné",
        "postal_codes": ["414", "415"],
        "lat_range": (57.685, 57.705),
        "lon_range": (11.91, 11.95),
    },
    {
        "name": "Örgryte-Härlanda",
        "postal_codes": ["416", "417"],
        "lat_range": (57.705, 57.725),
        "lon_range": (11.98, 12.02),
    },
    {
        "name": "Västra Göteborg",
        "postal_codes": ["421", "423"],
        "lat_range": (57.65, 57.67),
        "lon_range": (11.85, 11.9),
    },
    {
        "name": "Askim-Frölunda-Högsbo",
        "postal_codes": ["426", "427"],
        "lat_range": (57.63, 57.65),
        "lon_range": (11.9, 11.95),
    },
    {
        "name": "Angered",
        "postal_codes": ["424", "425"],
        "lat_range": (57.75, 57.8),
        "lon_range": (12.0, 12.1),
    },
    {
        "name": "Norra Hisingen",
        "postal_codes": ["422", "423"],
        "lat_range": (57.75, 57.8),
        "lon_range": (11.9, 12.0),
    },
    {
        "name": "Västra Hisingen",
        "postal_codes": ["418", "419"],
        "lat_range": (57.7, 57.75),
        "lon_range": (11.85, 11.95),
    },
    {
        "name": "Lundby",
        "postal_codes": ["417", "418"],
        "lat_range": (57.71, 57.73),
        "lon_range": (11.9, 11.95),
    },
    {
        "name": "Östra Göteborg",
        "postal_codes": ["415", "416"],
        "lat_range": (57.72, 57.75),
        "lon_range": (12.0, 12.05),
    },
]

# Gothenburg streets by neighborhood
GOTHENBURG_STREETS = {
    "Centrum": [
        "Avenyn",
        "Kungsportsavenyn",
        "Vasagatan",
        "Södra Vägen",
        "Östra Hamngatan",
        "Kungsgatan",
        "Drottninggatan",
    ],
    "Majorna-Linné": [
        "Linnégatan",
        "Första Långgatan",
        "Andra Långgatan",
        "Tredje Långgatan",
        "Mariaplan",
        "Karl Johansgatan",
    ],
    "Örgryte-Härlanda": [
        "Danska Vägen",
        "Redbergsvägen",
        "Sankt Sigfridsgatan",
        "Kärralundsgatan",
        "Olbergsgatan",
    ],
    "Västra Göteborg": [
        "Opaltorget",
        "Smaragdgatan",
        "Rubingatan",
        "Briljantgatan",
        "Skattegårdsvägen",
    ],
    "Askim-Frölunda-Högsbo": [
        "Frölunda Torg",
        "Marconigatan",
        "Lergöksgatan",
        "Mandolingatan",
        "Gitarrgatan",
    ],
    "Angered": [
        "Angered Centrum",
        "Hammarkulletorget",
        "Hjällbogatan",
        "Gårdstensvägen",
        "Rannebergen",
    ],
    "Norra Hisingen": [
        "Backavägen",
        "Litteraturgatan",
        "Selma Lagerlöfs Torg",
        "Tuve Torg",
        "Bäckebolsvägen",
    ],
    "Västra Hisingen": [
        "Kongahällavägen",
        "Björlandavägen",
        "Trädgårdsvägen",
        "Hisingsparken",
        "Säterigatan",
    ],
    "Lundby": [
        "Hjalmar Brantingsgatan",
        "Wieselgrensplatsen",
        "Lindholmsallén",
        "Eriksbergstorget",
        "Backaplan",
    ],
    "Östra Göteborg": [
        "Kortedalavägen",
        "Gamlestadsvägen",
        "Artillerigatan",
        "Beväringsgatan",
        "Brahegatan",
    ],
}


async def geocode_address_safely(
    address: str, fallback_lat=None, fallback_lon=None
) -> Tuple[Optional[float], Optional[float]]:
    """Geocode an address and handle exceptions.

    Args:
        address: The address to geocode
        fallback_lat: Fallback latitude to use if geocoding fails
        fallback_lon: Fallback longitude to use if geocoding fails

    Returns:
        Tuple of (latitude, longitude)
    """
    try:
        lat, lon = await geocode_address(address)
        print(f"Successfully geocoded address: {address} to {lat}, {lon}")
        return lat, lon
    except Exception as e:
        print(f"Error geocoding address '{address}': {e}")

        # Use provided fallbacks if available
        if fallback_lat is not None and fallback_lon is not None:
            print(
                f"Using fallback coordinates for {address}: {fallback_lat}, {fallback_lon}"
            )
            return fallback_lat, fallback_lon

        # Otherwise, return random coordinates in Gothenburg area as fallback
        random_lat = random.uniform(57.63, 57.8)
        random_lon = random.uniform(11.85, 12.1)
        print(
            f"Using random fallback coordinates for {address}: {random_lat}, {random_lon}"
        )
        return random_lat, random_lon


def generate_random_address(neighborhood=None):
    """Generate a random address in Gothenburg."""
    if neighborhood is None:
        neighborhood = random.choice(GOTHENBURG_NEIGHBORHOODS)
    else:
        neighborhood = next(
            (n for n in GOTHENBURG_NEIGHBORHOODS if n["name"] == neighborhood),
            random.choice(GOTHENBURG_NEIGHBORHOODS),
        )

    street = random.choice(GOTHENBURG_STREETS[neighborhood["name"]])
    house_number = random.randint(1, 100)
    postal_code = (
        f"{random.choice(neighborhood['postal_codes'])}{random.randint(10, 99)}"
    )

    # Generate random coordinates within the neighborhood's range
    lat = random.uniform(neighborhood["lat_range"][0], neighborhood["lat_range"][1])
    lon = random.uniform(neighborhood["lon_range"][0], neighborhood["lon_range"][1])

    return {
        "street": street,
        "house_number": house_number,
        "postal_code": postal_code,
        "city": "Göteborg",
        "full_address": f"{street} {house_number}, {postal_code} Göteborg",
        "latitude": lat,
        "longitude": lon,
    }


def generate_random_person():
    """Generate random person data."""
    first_name = random.choice(SWEDISH_FIRST_NAMES)
    last_name = random.choice(SWEDISH_LAST_NAMES)
    email = f"{first_name.lower()}.{last_name.lower()}@example.com"
    phone = f"+46{random.randint(700000000, 799999999)}"

    return {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
    }


async def generate_fake_database():
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
            },
            {
                "name": "SUV",
                "description": "Sport utility vehicle with extra space",
            },
            {
                "name": "Van",
                "description": "Larger vehicle for groups",
            },
            {
                "name": "Bus",
                "description": "Large vehicle for enterprise rides",
            },
        ]:
            # Use direct SQL to insert vehicle types
            db.execute(
                text(
                    "INSERT INTO vehicle_types (name, description, created_at) VALUES (:name, :description, :created_at)"
                ),
                {
                    "name": data["name"],
                    "description": data["description"],
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

        # Define enterprise data with real addresses
        enterprise_data = [
            {
                "name": "Volvo Torslanda",
                "address": "Torslandavägen 4, 405 31 Göteborg",
                "city": "Göteborg",
                "postal_code": "40531",
                "country": "Sweden",
                "latitude": 57.7181,
                "longitude": 11.8583,
            },
            {
                "name": "Mölnlycke Industrial Park",
                "address": "Industrivägen 10, 435 33 Mölnlycke",
                "city": "Mölnlycke",
                "postal_code": "43533",
                "country": "Sweden",
                "latitude": 57.6589,
                "longitude": 12.1167,
            },
            {
                "name": "AstraZeneca Mölndal",
                "address": "Pepparedsleden 1, 431 83 Mölndal",
                "city": "Mölndal",
                "postal_code": "43183",
                "country": "Sweden",
                "latitude": 57.6601,
                "longitude": 12.0118,
            },
        ]

        # Geocode enterprise addresses
        print("Geocoding enterprise addresses...")
        for data in enterprise_data:
            # Use the address for geocoding, with hardcoded coordinates as fallbacks
            full_address = data["address"]
            fallback_lat = data["latitude"]
            fallback_lon = data["longitude"]

            # Try geocoding with fallbacks
            lat, lon = await geocode_address_safely(
                full_address, fallback_lat, fallback_lon
            )

            # Update the coordinates (will be either geocoded or fallback values)
            data["latitude"] = lat
            data["longitude"] = lon

        # Create enterprise objects
        enterprises = []
        for data in enterprise_data:
            enterprise = Enterprise(
                name=data["name"],
                address=data["address"],
                city=data["city"],
                postal_code=data["postal_code"],
                country=data["country"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                is_active=True,
            )
            enterprises.append(enterprise)
            db.add(enterprise)

        db.commit()
        print(f"Created {len(enterprises)} enterprises")

        # Store references to specific enterprises for later use
        volvo = enterprises[0]
        # molnlycke = enterprises[1]  # Not used in this script
        astrazeneca = enterprises[2]

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
                "name": "Brunnsparken Hub",
                "description": "Central Göteborg transport hub",
                "address": "Brunnsparken, 411 03 Göteborg",
                "city": "Göteborg",
                "postal_code": "41103",
                "latitude": 57.7066,
                "longitude": 11.9686,
            },
            {
                "name": "Lindholmen Hub",
                "description": "Lindholmen Science Park transport hub",
                "address": "Lindholmspiren 5, 417 56 Göteborg",
                "city": "Göteborg",
                "postal_code": "41756",
                "latitude": 57.7075,
                "longitude": 11.9387,
            },
            {
                "name": "Frölunda Torg Hub",
                "description": "Frölunda shopping center transport hub",
                "address": "Frölunda Torg, 421 42 Göteborg",
                "city": "Göteborg",
                "postal_code": "42142",
                "latitude": 57.6546,
                "longitude": 11.9125,
            },
            {
                "name": "Angered Centrum Hub",
                "description": "Angered Centrum transport hub",
                "address": "Angered Centrum, 424 22 Göteborg",
                "city": "Göteborg",
                "postal_code": "42422",
                "latitude": 57.7687,
                "longitude": 12.0168,
            },
            {
                "name": "Korsvägen Hub",
                "description": "Korsvägen transport hub near Liseberg",
                "address": "Korsvägen, 412 54 Göteborg",
                "city": "Göteborg",
                "postal_code": "41254",
                "latitude": 57.6969,
                "longitude": 11.9865,
            },
            {
                "name": "Backaplan Hub",
                "description": "Backaplan shopping area transport hub",
                "address": "Backaplan, 417 05 Göteborg",
                "city": "Göteborg",
                "postal_code": "41705",
                "latitude": 57.7219,
                "longitude": 11.9519,
            },
            {
                "name": "Mölndal Centrum Hub",
                "description": "Mölndal city center transport hub",
                "address": "Mölndals Centrum, 431 30 Mölndal",
                "city": "Mölndal",
                "postal_code": "43130",
                "latitude": 57.6559,
                "longitude": 12.0154,
            },
            {
                "name": "Partille Centrum Hub",
                "description": "Partille city center transport hub",
                "address": "Partille Centrum, 433 38 Partille",
                "city": "Partille",
                "postal_code": "43338",
                "latitude": 57.7396,
                "longitude": 12.1068,
            },
        ]

        # Geocode hub addresses to get accurate coordinates
        print("Geocoding hub addresses...")
        for data in hub_data:
            # Use the address for geocoding, with hardcoded coordinates as fallbacks
            full_address = data["address"]
            fallback_lat = data["latitude"]
            fallback_lon = data["longitude"]

            # Try geocoding with fallbacks
            lat, lon = await geocode_address_safely(
                full_address, fallback_lat, fallback_lon
            )

            # Update the coordinates (will be either geocoded or fallback values)
            data["latitude"] = lat
            data["longitude"] = lon

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

        # Define destination data with real addresses
        destination_data = [
            {
                "name": "Gothenburg Central Station",
                "address": "Drottningtorget 5, 411 03 Göteborg",
                "city": "Göteborg",
                "postal_code": "41103",
                "country": "Sweden",
                "latitude": 57.7089,
                "longitude": 11.9750,
                "enterprise_id": None,
            },
            {
                "name": "Volvo Torslanda",
                "address": "Torslandavägen 4, 405 31 Göteborg",
                "city": "Göteborg",
                "postal_code": "40531",
                "country": "Sweden",
                "latitude": 57.7181,
                "longitude": 11.8583,
                "enterprise_id": volvo.id,
            },
            {
                "name": "Liseberg Amusement Park",
                "address": "Örgrytevägen 5, 402 22 Göteborg",
                "city": "Göteborg",
                "postal_code": "40222",
                "country": "Sweden",
                "latitude": 57.6947,
                "longitude": 11.9921,
                "enterprise_id": None,
            },
            {
                "name": "Landvetter Airport",
                "address": "Landvetter flygplats, 438 80 Landvetter",
                "city": "Landvetter",
                "postal_code": "43880",
                "country": "Sweden",
                "latitude": 57.6685,
                "longitude": 12.2967,
                "enterprise_id": None,
            },
            {
                "name": "AstraZeneca Mölndal",
                "address": "Pepparedsleden 1, 431 83 Mölndal",
                "city": "Mölndal",
                "postal_code": "43183",
                "country": "Sweden",
                "latitude": 57.6601,
                "longitude": 12.0118,
                "enterprise_id": astrazeneca.id,
            },
        ]

        # Geocode destination addresses
        print("Geocoding destination addresses...")
        for data in destination_data:
            # Use the address for geocoding, with hardcoded coordinates as fallbacks
            full_address = data["address"]
            fallback_lat = data["latitude"]
            fallback_lon = data["longitude"]

            # Try geocoding with fallbacks
            lat, lon = await geocode_address_safely(
                full_address, fallback_lat, fallback_lon
            )

            # Update the coordinates (will be either geocoded or fallback values)
            data["latitude"] = lat
            data["longitude"] = lon

        # Create destination objects
        destinations = []
        for data in destination_data:
            destination = Destination(
                name=data["name"],
                address=data["address"],
                city=data["city"],
                postal_code=data["postal_code"],
                country=data["country"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                enterprise_id=data["enterprise_id"],
                is_active=True,
            )
            destinations.append(destination)
            db.add(destination)

        db.commit()
        print(f"Created {len(destinations)} destinations")

        # Store references to specific destinations for later use
        gothenburg_central = destinations[0]
        volvo_destination = destinations[1]

        # 6. Create locations
        print("Creating locations...")

        # Use direct SQL to create locations
        db.execute(
            text(
                "INSERT INTO locations (name, address, latitude, longitude, created_at) VALUES (:name, :address, :latitude, :longitude, CURRENT_TIMESTAMP)"
            ),
            {
                "name": "Volvo Torslanda",
                "address": f"{volvo_address.street}, {volvo_address.city}",
                "latitude": volvo_address.latitude,
                "longitude": volvo_address.longitude,
            },
        )
        db.commit()

        db.execute(
            text(
                "INSERT INTO locations (name, address, latitude, longitude, created_at) VALUES (:name, :address, :latitude, :longitude, CURRENT_TIMESTAMP)"
            ),
            {
                "name": "Mölnlycke Industrial Park",
                "address": f"{molnlycke_address.street}, {molnlycke_address.city}",
                "latitude": molnlycke_address.latitude,
                "longitude": molnlycke_address.longitude,
            },
        )
        db.commit()

        db.execute(
            text(
                "INSERT INTO locations (name, address, latitude, longitude, created_at) VALUES (:name, :address, :latitude, :longitude, CURRENT_TIMESTAMP)"
            ),
            {
                "name": "Gothenburg Central",
                "address": f"{gothenburg_address.street}, {gothenburg_address.city}",
                "latitude": gothenburg_address.latitude,
                "longitude": gothenburg_address.longitude,
            },
        )
        db.commit()

        # Locations created successfully

        # 7. Create users
        print("Creating users...")
        all_users = []

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
        all_users.append(admin)

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
        all_users.append(manager)

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
        all_users.append(driver)

        # Create 120 Volvo workers (40 per shift, 10 per hub)
        print("Creating 120 Volvo enterprise users...")
        volvo_users = []
        shifts = ["morning", "day", "evening"]

        # Assign 10 users to each hub for each shift
        for shift in shifts:
            print(f"Creating {shift} shift users...")

            # For each hub, create 10 users
            for hub_idx, hub in enumerate(hubs[:4]):  # Use first 4 hubs
                for i in range(10):
                    # Generate random person data
                    person = generate_random_person()

                    # Generate random home address
                    home = generate_random_address()

                    # Create the user
                    user = User(
                        user_id=generate_uuid(),
                        email=f"{person['first_name'].lower()}.{person['last_name'].lower()}.{shift[0]}{hub_idx}{i}@volvo.com",
                        password_hash=get_password_hash("password123"),
                        first_name=person["first_name"],
                        last_name=person["last_name"],
                        phone_number=person["phone"],
                        user_type=UserType.ENTERPRISE,
                        role=UserRole.USER,
                        is_active=True,
                        is_verified=True,
                        created_at=utc_now(),
                        # Home address details
                        home_address=home["full_address"],
                        home_street=home["street"],
                        home_house_number=str(home["house_number"]),
                        home_post_code=home["postal_code"],
                        home_city=home["city"],
                        latitude=home["latitude"],
                        longitude=home["longitude"],
                        home_location=f"POINT({home['longitude']} {home['latitude']})",
                        # Work address (Volvo)
                        work_address=volvo.address,
                        work_street="Torslandavägen",
                        work_house_number="4",
                        work_post_code="40531",
                        work_city="Göteborg",
                        work_latitude=volvo.latitude,
                        work_longitude=volvo.longitude,
                        work_location=f"POINT({volvo.longitude} {volvo.latitude})",
                        # Preferred hub (closest to home)
                        preferred_starting_hub_id=hub.id,
                    )
                    volvo_users.append(user)
                    all_users.append(user)

        # Create 30 private users
        print("Creating 30 private users...")
        private_users = []

        # Create clusters of users around each hub
        for hub_idx, hub in enumerate(hubs):
            # Create a few users near each hub
            for i in range(4):  # 4 users per hub (8 hubs * 4 = 32 users)
                # Generate random person data
                person = generate_random_person()

                # Generate random home address near the hub
                # Find the neighborhood closest to this hub
                closest_neighborhood = None
                min_distance = float("inf")
                for neighborhood in GOTHENBURG_NEIGHBORHOODS:
                    neighborhood_lat = (
                        neighborhood["lat_range"][0] + neighborhood["lat_range"][1]
                    ) / 2
                    neighborhood_lon = (
                        neighborhood["lon_range"][0] + neighborhood["lon_range"][1]
                    ) / 2
                    distance = (
                        (hub.latitude - neighborhood_lat) ** 2
                        + (hub.longitude - neighborhood_lon) ** 2
                    ) ** 0.5
                    if distance < min_distance:
                        min_distance = distance
                        closest_neighborhood = neighborhood

                home = generate_random_address(closest_neighborhood["name"])

                # Generate random work address (could be any destination)
                work_destination = random.choice(destinations)

                # Create the user
                user = User(
                    user_id=generate_uuid(),
                    email=f"{person['first_name'].lower()}.{person['last_name'].lower()}.p{hub_idx}{i}@example.com",
                    password_hash=get_password_hash("password123"),
                    first_name=person["first_name"],
                    last_name=person["last_name"],
                    phone_number=person["phone"],
                    user_type=UserType.PRIVATE,
                    role=UserRole.USER,
                    is_active=True,
                    is_verified=True,
                    created_at=utc_now(),
                    # Home address details
                    home_address=home["full_address"],
                    home_street=home["street"],
                    home_house_number=str(home["house_number"]),
                    home_post_code=home["postal_code"],
                    home_city=home["city"],
                    latitude=home["latitude"],
                    longitude=home["longitude"],
                    home_location=f"POINT({home['longitude']} {home['latitude']})",
                    # Work address (random destination)
                    work_address=work_destination.address,
                    work_city=work_destination.city,
                    work_post_code=work_destination.postal_code,
                    work_latitude=work_destination.latitude,
                    work_longitude=work_destination.longitude,
                    work_location=f"POINT({work_destination.longitude} {work_destination.latitude})",
                    # Preferred hub (closest to home)
                    preferred_starting_hub_id=hub.id,
                )
                private_users.append(user)
                all_users.append(user)

        # Add a test user for easy login
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
            # Home address (Gothenburg Central)
            home_address="Drottningtorget 5, 411 03 Göteborg",
            home_street="Drottningtorget",
            home_house_number="5",
            home_post_code="41103",
            home_city="Göteborg",
            latitude=gothenburg_central.latitude,
            longitude=gothenburg_central.longitude,
            home_location=f"POINT({gothenburg_central.longitude} {gothenburg_central.latitude})",
        )
        all_users.append(test_user)

        # Add all users to the database
        db.add_all(all_users)
        db.commit()
        print(f"Created {len(all_users)} users")

        # Store references to specific users for later use
        volvo_user1 = volvo_users[0]
        volvo_user2 = volvo_users[1]

        # 8. Link enterprise users
        print("Linking enterprise users...")
        enterprise_users = []

        # Link all Volvo users to the Volvo enterprise
        departments = [
            "Engineering",
            "Production",
            "Sales",
            "HR",
            "IT",
            "Finance",
            "Marketing",
            "R&D",
        ]
        positions = [
            "Engineer",
            "Manager",
            "Specialist",
            "Coordinator",
            "Analyst",
            "Director",
            "Assistant",
            "Technician",
        ]

        for i, user in enumerate(volvo_users):
            department = departments[i % len(departments)]
            position = positions[i % len(positions)]
            employee_id = f"V{i+1:03d}"

            enterprise_user = EnterpriseUser(
                user_id=user.id,
                enterprise_id=volvo.id,
                employee_id=employee_id,
                department=department,
                position=position,
            )
            enterprise_users.append(enterprise_user)

        db.add_all(enterprise_users)
        db.commit()
        print(f"Linked {len(enterprise_users)} enterprise users")

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
        # Run the async function using asyncio
        asyncio.run(generate_fake_database())
    except Exception as e:
        print(f"Error generating database: {str(e)}")
        import traceback

        traceback.print_exc()
