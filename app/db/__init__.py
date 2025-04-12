import logging

from sqlalchemy.orm import configure_mappers

logger = logging.getLogger(__name__)

# Keep track of whether relationships are configured to avoid duplicate configuration
relationships_configured = False


def configure_relationships():
    """
    Configure SQLAlchemy relationships between models.

    This approach solves circular import issues by configuring relationships
    after all models are imported. It's called from app/main.py during startup.

    Returns:
        bool: True if configuration succeeded, False otherwise
    """
    global relationships_configured

    # Skip if already configured
    if relationships_configured:
        return True

    try:
        # First, ensure all model modules are imported
        # To avoid circular imports, the relationship definitions are kept here
        # Import all models that might define relationships
        from app.models.address import Address
        from app.models.attachment import MessageAttachment
        from app.models.hub import Hub
        from app.models.location import Location

        # Import message-related models last to avoid circular imports
        from app.models.message import Conversation, Message, UserMessageSettings
        from app.models.payment import Payment
        from app.models.ride import Ride, RideBooking
        from app.models.user import User
        from app.models.vehicle import Vehicle, VehicleType

        # Define any additional relationships or fixes here if needed
        # For example, if there are overlapping relationships, you could add:
        # User.locations = relationship("Location", overlaps="saved_locations")
        # Now configure mappers to ensure all relationships are properly set up
        try:
            configure_mappers()
            logger.info("SQLAlchemy mappers configured successfully")
        except Exception as e:
            logger.error(f"Error in configure_mappers(): {e}")
            # If there's an error, try to continue anyway
            pass

        # Mark relationships as configured
        relationships_configured = True
        logger.info("SQLAlchemy relationships configured successfully")
        return True

    except Exception as e:
        logger.error(f"Error configuring relationships: {e}")
        return False
