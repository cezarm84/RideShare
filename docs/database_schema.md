erDiagram
User {
int id PK
string user_id
string email
string password_hash
string first_name
string last_name
string phone_number
string user_type
boolean is_active
datetime created_at
}

    Address {
        int id PK
        string street
        string house_number
        string post_code
        string city
        string country
        string coordinates
    }

    Enterprise {
        int id PK
        string name
        boolean is_active
        int address_id FK
    }

    EnterpriseUser {
        int id PK
        int user_id FK
        int enterprise_id FK
        string employee_id
        string department
        string position
    }

    Ride {
        int id PK
        int driver_id FK
        string status
        datetime start_time
        datetime end_time
        int start_location_id FK
        int end_location_id FK
        decimal base_fare
        int max_passengers
        int available_seats
    }

    Booking {
        int id PK
        int user_id FK
        int ride_id FK
        int pickup_location_id FK
        int dropoff_location_id FK
        string status
        datetime booking_time
        decimal fare
        int passenger_count
    }

    Payment {
        int id PK
        int booking_id FK
        decimal amount
        string payment_method
        string status
        datetime timestamp
        string transaction_id
    }

    User ||--o{ Ride : "drives"
    User ||--o{ Booking : "books"
    User ||--o{ EnterpriseUser : "has"
    Enterprise ||--o{ EnterpriseUser : "has"
    Enterprise ||--o| Address : "located at"
    User ||--o| Address : "home address"
    User ||--o| Address : "work address"
    Ride ||--o{ Booking : "has"
    Booking ||--|| Payment : "has"
    Ride ||--|| Address : "start location"
    Ride ||--|| Address : "end location"
    Booking ||--|| Address : "pickup location"
    Booking ||--|| Address : "dropoff location"
