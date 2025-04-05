# Import all the models, so that Base has them before being
# imported by Alembic
from app.db.base_class import Base  # noqa

# Import all models here for Alembic to detect
from app.models.user import User  # noqa
from app.models.user import Enterprise  # noqa
from app.models.user import EnterpriseUser  # noqa
from app.models.address import Address  # noqa

# Avoid circular imports by moving Location import to the end
# and wrapping all imports in try-except blocks
try:
    from app.models.ride import Ride  # noqa
except ImportError:
    pass
try:
    from app.models.payment import Payment  # noqa
except ImportError:
    pass
# Add the Location import at the end to avoid the circular import problem
try:
    from app.models.location import Location  # noqa
    from app.models.location import Hub  # noqa
except ImportError:
    pass
