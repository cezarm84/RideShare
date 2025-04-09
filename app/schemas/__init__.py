# Import all schema models here for easy access with consistent naming

# User schemas
from .user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    TokenData,
    TokenResponse,
    EnterpriseResponse,
    EnterpriseCreate,
    EnterpriseUpdate
)

# Ride schemas
from .ride import (
    RideCreate,
    RideResponse,
    RideDetailedResponse,
    RideDetailResponse,  # Now exists as subclass in ride.py
    RideBookingResponse,
    RideUpdate
)

# Booking schemas
from .booking import (
    BookingCreate,
    BookingResponse,
    BookingPassengerResponse,
    PassengerInfo,
    PaymentCreate,
    PaymentResponse
)

# Payment method schemas
from .payment_method import (
    PaymentMethodBase,
    PaymentMethodCreate,
    PaymentMethodResponse,
    PaymentMethodUpdate
)

# User preference schemas
from .user_preference import (
    UserPreferenceBase,
    UserPreferenceCreate,
    UserPreferenceUpdate,
    UserPreferenceResponse
)

# Matching schemas
from .matching import (
    RideMatchRequest,  # Renamed from MatchRequest
    RideMatchResponse  # Renamed from MatchResponse
)

# Location schemas
from .location import (
    LocationCreate,
    LocationResponse,
    LocationUpdate,
    HubCreate,
    HubResponse,
    HubUpdate,
    CoordinatesModel
)