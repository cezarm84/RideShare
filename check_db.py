from sqlalchemy import text

from app.db.session import engine

with engine.connect() as conn:
    result = conn.execute(text("SELECT COUNT(*) FROM users"))
    print(f"Total users: {result.scalar()}")

    result = conn.execute(text("SELECT COUNT(*) FROM hubs"))
    print(f"Total hubs: {result.scalar()}")

    result = conn.execute(text("SELECT COUNT(*) FROM vehicle_types"))
    print(f"Total vehicle types: {result.scalar()}")

    result = conn.execute(text("SELECT COUNT(*) FROM enterprises"))
    print(f"Total enterprises: {result.scalar()}")

    result = conn.execute(text("SELECT COUNT(*) FROM destinations"))
    print(f"Total destinations: {result.scalar()}")

    result = conn.execute(text("SELECT COUNT(*) FROM rides"))
    print(f"Total rides: {result.scalar()}")
