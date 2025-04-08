# Import all models here that should be registered with SQLAlchemy
# This file is imported by alembic
# Import base first to ensure proper initialization
from app.db.base_class import Base

# Import all models to register them with SQLAlchemy
from app.models.user import User
from app.models.address import Address
from app.models.ride import Ride, RideBooking
from app.models.location import Location
from app.models.hub import Hub, HubPair
from app.models.payment import Payment
# Do not import Message here to avoid circular import
# from app.models.message import Message
from app.models.attachment import MessageAttachment
from app.models.vehicle import VehicleType

# Note: This import approach allows Alembic to detect models
# without causing circular import issues
