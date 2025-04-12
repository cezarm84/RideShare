# Import all schema models here for easy access with consistent naming

# User schemas
# Booking schemas
from .booking import (
    BookingCreate,
    BookingPassengerResponse,
    BookingResponse,
    PassengerInfo,
    PaymentCreate,
    PaymentResponse,
)

# Location schemas
from .location import (
    CoordinatesModel,
    HubCreate,
    HubResponse,
    HubUpdate,
    LocationCreate,
    LocationResponse,
    LocationUpdate,
)

# Matching schemas
from .matching import RideMatchRequest  # Renamed from MatchRequest
from .matching import RideMatchResponse  # Renamed from MatchResponse

# Payment method schemas
from .payment_method import (
    PaymentMethodBase,
    PaymentMethodCreate,
    PaymentMethodResponse,
    PaymentMethodUpdate,
)

# Ride schemas
from .ride import RideDetailResponse  # Now exists as subclass in ride.py
from .ride import (
    RideBookingResponse,
    RideCreate,
    RideDetailedResponse,
    RideResponse,
    RideUpdate,
)
from .user import (
    EnterpriseCreate,
    EnterpriseResponse,
    EnterpriseUpdate,
    TokenData,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)

# User preference schemas
from .user_preference import (
    UserPreferenceBase,
    UserPreferenceCreate,
    UserPreferenceResponse,
    UserPreferenceUpdate,
)

# Vehicle schemas
from .vehicle import (
    VehicleCreate,
    VehicleResponse,
    VehicleTypeCreate,
    VehicleTypeResponse,
    VehicleTypeUpdate,
    VehicleUpdate,
)
