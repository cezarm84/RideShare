from app.db.session import SessionLocal
from app.models.user import User
from app.models.user_travel_pattern import UserTravelPattern
from app.models.user_matching_preference import UserMatchingPreference
from app.models.ride_match_history import RideMatchHistory
from app.models.ride import Ride
from datetime import datetime, time, date

# Create a database session
db = SessionLocal()

try:
    # Test 1: Check if we can query the User model
    print("Testing User model...")
    users = db.query(User).limit(1).all()
    print(f"Found {len(users)} users")

    if users:
        user = users[0]
        print(f"User: {user.id}, {user.email}")

        # Test 2: Create a user matching preference
        print("\nTesting UserMatchingPreference model...")
        preference = db.query(UserMatchingPreference).filter(UserMatchingPreference.user_id == user.id).first()

        if not preference:
            print("Creating new preference...")
            preference = UserMatchingPreference(
                user_id=user.id,
                max_detour_minutes=15,
                max_wait_minutes=10,
                max_walking_distance_meters=1000,
                preferred_gender=None,
                preferred_language="en",
                minimum_driver_rating=4.0,
                prefer_same_enterprise=True,
                prefer_same_destination=True,
                prefer_recurring_rides=True
            )
            db.add(preference)
            db.commit()
            print("Preference created successfully")
        else:
            print(f"Existing preference found: {preference.user_id}")

        # Test 3: Create a user travel pattern
        print("\nTesting UserTravelPattern model...")
        pattern = db.query(UserTravelPattern).filter(UserTravelPattern.user_id == user.id).first()

        if not pattern:
            print("Creating new travel pattern...")
            pattern = UserTravelPattern(
                user_id=user.id,
                origin_type="hub",
                origin_id=1,
                origin_latitude=57.7089,
                origin_longitude=11.9746,
                destination_type="custom",
                destination_id=None,
                destination_latitude=57.7189,
                destination_longitude=11.9846,
                day_of_week=1,  # Tuesday
                departure_time=time(8, 0, 0),
                frequency=5,
                last_traveled=date.today()
            )
            db.add(pattern)
            db.commit()
            print("Travel pattern created successfully")
        else:
            print(f"Existing travel pattern found: {pattern.id}")

        # Test 4: Create a ride match history
        print("\nTesting RideMatchHistory model...")
        match_history = db.query(RideMatchHistory).filter(RideMatchHistory.user_id == user.id).first()

        if not match_history:
            print("Creating new match history...")
            # Find another user to match with
            other_user = db.query(User).filter(User.id != user.id).first()
            if other_user:
                # Find a ride
                ride = db.query(Ride).first()
                if ride:
                    match_history = RideMatchHistory(
                        user_id=user.id,
                        matched_user_id=other_user.id,
                        ride_id=ride.id,
                        match_score=85.5,
                        match_reason="Same enterprise",
                        was_accepted=True,
                        feedback_rating=4
                    )
                    db.add(match_history)
                    db.commit()
                    print("Match history created successfully")
                else:
                    print("No rides found to create match history")
            else:
                print("No other users found to create match history")
        else:
            print(f"Existing match history found: {match_history.id}")

    print("\nAll tests completed successfully!")

except Exception as e:
    print(f"Error: {str(e)}")

finally:
    db.close()
