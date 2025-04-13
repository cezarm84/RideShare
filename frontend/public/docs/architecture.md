graph TD
A[API Layer] --> B[Service Layer]
B --> C[Repository Layer]
C --> D[Database]

    subgraph "API Layer"
        A1[Auth API]
        A2[User API]
        A3[Ride API]
        A4[Booking API]
        A5[Matching API]
        A6[Analytics API]
    end

    subgraph "Service Layer"
        B1[Auth Service]
        B2[User Service]
        B3[Ride Service]
        B4[Booking Service]
        B5[Matching Service]
        B6[Analytics Service]
        B7[Notification Service]
        B8[Geocoding Service]
    end

    subgraph "Data Layer"
        C1[User Repository]
        C2[Ride Repository]
        C3[Booking Repository]
        C4[Location Repository]
    end
