sequenceDiagram
participant Rider
participant API
participant MatchingService
participant RideService
participant BookingService
participant NotificationService
participant Driver

    Rider->>API: Request ride (locations, time, passengers)
    API->>MatchingService: Find matching rides
    MatchingService->>RideService: Get available rides
    RideService-->>MatchingService: Return eligible rides
    MatchingService-->>API: Return matches with fares
    API-->>Rider: Display available options

    Rider->>API: Select and book ride
    API->>BookingService: Create booking
    BookingService->>RideService: Update ride availability
    BookingService-->>API: Return booking confirmation
    API->>NotificationService: Notify driver
    NotificationService->>Driver: Send booking notification
    API-->>Rider: Booking confirmed

    Note over Driver,NotificationService: Driver accepts booking

    Driver->>API: Accept booking
    API->>BookingService: Update booking status
    API->>NotificationService: Notify rider
    NotificationService->>Rider: Booking accepted
