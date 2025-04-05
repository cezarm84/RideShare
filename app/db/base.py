# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa

# Import all models here for Alembic to detect
from app.models.user import User  # noqa
from app.models.user import Enterprise  # noqa
from app.models.user import EnterpriseUser  # noqa
from app.models.address import Address  # noqa
from app.models.location import Location  # noqa
try:
    from app.models.ride import Ride  # noqa
except ImportError:
    pass
try:
    from app.models.payment import Payment  # noqa
except ImportError:
    pass