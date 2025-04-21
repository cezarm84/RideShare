from datetime import datetime

try:
    from db.session import SessionLocal
    from models.ride import Ride

    db = SessionLocal()

    # Get current time
    now = datetime.now()
    print(f"Current time: {now}")

    # Count future rides
    future_rides = db.query(Ride).filter(Ride.departure_time >= now).count()
    print(f"Number of future rides in database: {future_rides}")

    # Count past rides
    past_rides = db.query(Ride).filter(Ride.departure_time < now).count()
    print(f"Number of past rides in database: {past_rides}")

    # Get total rides
    total_rides = db.query(Ride).count()
    print(f"Total number of rides in database: {total_rides}")

    # Show the first 5 rides with their departure times
    print("\nFirst 5 rides:")
    for ride in db.query(Ride).limit(5).all():
        print(
            f"Ride ID: {ride.id}, Departure: {ride.departure_time}, Status: {ride.status}"
        )

    db.close()
except Exception as e:
    print(f"Error: {e}")
