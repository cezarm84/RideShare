import logging


from app.db.session import SessionLocal
from app.services.travel_pattern_service import TravelPatternService

logger = logging.getLogger(__name__)


def update_all_travel_patterns():
    """Update travel patterns for all users"""
    logger.info("Starting travel pattern update job")
    db = SessionLocal()
    try:
        service = TravelPatternService(db)
        patterns_updated = service.update_all_user_travel_patterns()
        logger.info(f"Updated {patterns_updated} travel patterns")
        return patterns_updated
    except Exception as e:
        logger.error(f"Error updating travel patterns: {str(e)}")
        return 0
    finally:
        db.close()


def update_travel_pattern_after_ride(user_id: int, ride_id: int):
    """Update travel pattern for a user after a ride is completed"""
    logger.info(f"Updating travel pattern for user {user_id} after ride {ride_id}")
    db = SessionLocal()
    try:
        service = TravelPatternService(db)
        success = service.update_pattern_after_ride(user_id, ride_id)
        return success
    except Exception as e:
        logger.error(f"Error updating travel pattern: {str(e)}")
        return False
    finally:
        db.close()
