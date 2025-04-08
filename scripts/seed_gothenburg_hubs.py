import sys
import os
from pathlib import Path

# Add the parent directory to sys.path
script_dir = Path(__file__).resolve().parent
project_root = script_dir.parent
sys.path.append(str(project_root))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.hub import Hub

# Gothenburg city hubs and major company destinations
GOTHENBURG_HUBS = [
    {
        "name": "Hub North",
        "description": "Transportation hub in northern Gothenburg",
        "address": "Backavägen 1",
        "city": "Gothenburg",
        "postal_code": "417 05",
        "latitude": 57.7322,
        "longitude": 11.9513
    },
    {
        "name": "Hub East",
        "description": "Transportation hub in eastern Gothenburg",
        "address": "Partillevägen 10",
        "city": "Gothenburg",
        "postal_code": "433 38",
        "latitude": 57.7405,
        "longitude": 12.1073
    },
    {
        "name": "Hub South",
        "description": "Transportation hub in southern Gothenburg",
        "address": "Mölndalsvägen 95",
        "city": "Gothenburg",
        "postal_code": "412 85",
        "latitude": 57.6561,
        "longitude": 12.0128
    },
    {
        "name": "Hub West",
        "description": "Transportation hub in western Gothenburg",
        "address": "Eriksbergstorget 1",
        "city": "Gothenburg",
        "postal_code": "417 56",
        "latitude": 57.7068,
        "longitude": 11.9174
    }
]

# Major company destinations around Gothenburg
COMPANY_DESTINATIONS = [
    {
        "name": "Volvo Torslanda",
        "description": "Volvo Cars manufacturing plant",
        "address": "Torslandavägen 16",
        "city": "Gothenburg",
        "postal_code": "405 31",
        "latitude": 57.7241,
        "longitude": 11.8214
    },
    {
        "name": "IKEA Bäckebol",
        "description": "IKEA store in Bäckebol",
        "address": "Bäckebol Köpcentrum",
        "city": "Gothenburg",
        "postal_code": "422 46",
        "latitude": 57.7685,
        "longitude": 11.9935
    },
    {
        "name": "IKEA Kållered",
        "description": "IKEA store in Kållered",
        "address": "Ekenleden 77",
        "city": "Kållered",
        "postal_code": "428 36",
        "latitude": 57.6090,
        "longitude": 12.0577
    },
    {
        "name": "Mölnlycke Företagspark",
        "description": "Business park in Mölnlycke",
        "address": "Långenvägen 2",
        "city": "Mölnlycke",
        "postal_code": "435 31",
        "latitude": 57.6611,
        "longitude": 12.1210
    },
    {
        "name": "AstraZeneca Mölndal",
        "description": "AstraZeneca research facility",
        "address": "Pepparedsleden 1",
        "city": "Mölndal",
        "postal_code": "431 83",
        "latitude": 57.6609,
        "longitude": 12.0122
    },
    {
        "name": "Lindholmen Science Park",
        "description": "Technology and innovation center",
        "address": "Lindholmspiren 5",
        "city": "Gothenburg",
        "postal_code": "417 56",
        "latitude": 57.7068,
        "longitude": 11.9411
    },
    {
        "name": "SKF Sverige AB",
        "description": "SKF headquarters and manufacturing",
        "address": "Hornsgatan 1",
        "city": "Gothenburg",
        "postal_code": "415 50",
        "latitude": 57.7219,
        "longitude": 12.0230
    },
    {
        "name": "Ericsson Lindholmen",
        "description": "Ericsson office at Lindholmen",
        "address": "Lindholmspiren 11",
        "city": "Gothenburg",
        "postal_code": "417 56",
        "latitude": 57.7071,
        "longitude": 11.9394
    }
]

def seed_hubs(db: Session):
    # First, clear existing hubs if needed
    existing_count = db.query(Hub).count()
    if existing_count > 0:
        print(f"Found {existing_count} existing hubs. Keeping them.")
    
    # Add city hubs
    for hub_data in GOTHENBURG_HUBS:
        # Check if hub with same name already exists
        existing_hub = db.query(Hub).filter(Hub.name == hub_data["name"]).first()
        if existing_hub:
            print(f"Hub '{hub_data['name']}' already exists. Skipping.")
            continue
            
        hub = Hub(**hub_data)
        db.add(hub)
        print(f"Added hub: {hub_data['name']}")
    
    # Add company destinations
    for company_data in COMPANY_DESTINATIONS:
        # Check if company destination already exists
        existing_dest = db.query(Hub).filter(Hub.name == company_data["name"]).first()
        if existing_dest:
            print(f"Destination '{company_data['name']}' already exists. Skipping.")
            continue
            
        destination = Hub(**company_data)
        db.add(destination)
        print(f"Added destination: {company_data['name']}")
    
    db.commit()
    print("Gothenburg hubs and destinations seeded successfully!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_hubs(db)
    finally:
        db.close()