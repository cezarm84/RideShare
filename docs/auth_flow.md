sequenceDiagram
participant Client
participant API
participant AuthService
participant DB

    Client->>API: POST /api/auth/token (username, password)
    API->>AuthService: authenticate_user(username, password)
    AuthService->>DB: Query user by email
    DB-->>AuthService: Return user data
    AuthService->>AuthService: Verify password hash
    AuthService-->>API: Return user if valid
    API->>API: Generate JWT token
    API-->>Client: Return token + user info

    Note over Client,API: Subsequent authenticated requests

    Client->>API: Request with Bearer token
    API->>AuthService: Validate token
    AuthService->>DB: Fetch current user
    DB-->>AuthService: Return user data
    AuthService-->>API: Return current user
    API-->>Client: Return requested data
