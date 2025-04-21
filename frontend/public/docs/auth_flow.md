# Authentication Flow

This document describes the authentication flow in the RideShare application, including user registration, email verification, login, and password reset.

## Registration and Email Verification Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant EmailService
    participant DB

    Client->>API: POST /api/v1/users/ (registration data)
    API->>DB: Create new user (is_verified=false)
    DB-->>API: Return created user
    API->>EmailService: Generate verification token
    EmailService->>DB: Store token with expiration
    EmailService->>EmailService: Send verification email
    API-->>Client: Return user data (is_verified=false)

    Note over Client,EmailService: User receives email and clicks verification link

    Client->>API: POST /api/v1/email/verify (token)
    API->>DB: Verify token validity and expiration
    DB-->>API: Return token status
    API->>DB: Update user (is_verified=true)
    API-->>Client: Return success message
```

## Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant EmailService
    participant DB

    Client->>API: POST /api/v1/auth/token (username, password)
    API->>AuthService: authenticate_user(username, password)
    AuthService->>DB: Query user by email
    DB-->>AuthService: Return user data
    AuthService->>AuthService: Verify password hash

    alt Email not verified
        AuthService->>EmailService: Generate new verification token
        EmailService->>DB: Store token with expiration
        EmailService->>EmailService: Send verification email
        AuthService-->>API: Return verification error
        API-->>Client: Return 403 Forbidden (Email not verified)
    else Email verified
        AuthService-->>API: Return authenticated user
        API->>API: Generate JWT token
        API-->>Client: Return token + user info
    end

    Note over Client,API: Subsequent authenticated requests

    Client->>API: Request with Bearer token
    API->>AuthService: Validate token
    AuthService->>DB: Fetch current user
    DB-->>AuthService: Return user data
    AuthService-->>API: Return current user
    API-->>Client: Return requested data
```

## Password Reset Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant EmailService
    participant DB

    Client->>API: POST /api/v1/email/request-password-reset (email)
    API->>DB: Find user by email
    DB-->>API: Return user data
    API->>EmailService: Generate reset token
    EmailService->>DB: Store token with expiration
    EmailService->>EmailService: Send password reset email
    API-->>Client: Return success message

    Note over Client,EmailService: User receives email and clicks reset link

    Client->>API: POST /api/v1/email/reset-password (token, new_password)
    API->>DB: Verify token validity and expiration
    DB-->>API: Return token status
    API->>DB: Update user password
    API-->>Client: Return success message
```
