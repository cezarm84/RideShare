# User Preferences

This document explains the user preferences system in the RideShare application, including its purpose, implementation, and usage.

## Purpose

The user preferences system allows users to customize their experience within the RideShare application. It provides a centralized way to store and manage user-specific settings such as:

- **UI Theme**: Light, dark, or system default
- **Language**: Preferred language for the application interface
- **Notification Settings**: Control which notifications the user receives
- **Email Frequency**: How often the user receives email updates
- **Push Notification Settings**: Enable or disable push notifications

These preferences enhance the user experience by:

1. **Personalization**: Allowing users to tailor the application to their needs and preferences
2. **Accessibility**: Supporting different languages and visual themes for better accessibility
3. **Communication Control**: Giving users control over how and when they receive communications
4. **Consistency**: Maintaining consistent settings across different devices and sessions

## Implementation

### Database Structure

The user preferences are stored in a dedicated `user_preferences` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users table |
| theme | TEXT | UI theme preference (e.g., "light", "dark") |
| language | TEXT | Preferred language (e.g., "en", "sv") |
| notifications | BOOLEAN | Whether notifications are enabled |
| email_frequency | TEXT | Email frequency preference (e.g., "daily", "weekly") |
| push_enabled | BOOLEAN | Whether push notifications are enabled |
| created_at | TIMESTAMP | When the preferences were created |
| updated_at | TIMESTAMP | When the preferences were last updated |

### Model and Relationships

The `UserPreference` model represents user preferences in the application:

```python
class UserPreference(Base):
    """Model for user preferences"""
    
    __tablename__ = "user_preferences"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    theme = Column(String, nullable=True)
    language = Column(String, nullable=True)
    notifications = Column(Boolean, default=True)
    email_frequency = Column(String, default="daily")
    push_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.datetime.now(timezone.utc))
    
    # Relationship with user
    user = relationship("User")
```

### API Endpoints

The following endpoints are available for managing user preferences:

#### Get User Preferences

```
GET /api/v1/user-preferences
```

Returns the current user's preferences. If no preferences exist, default preferences are created and returned.

**Response:**

```json
{
  "id": 1,
  "user_id": 123,
  "theme": "dark",
  "language": "en",
  "notifications": true,
  "email_frequency": "daily",
  "push_enabled": true,
  "created_at": "2025-04-15T14:30:00",
  "updated_at": "2025-04-15T14:30:00"
}
```

#### Create User Preferences

```
POST /api/v1/user-preferences
```

Creates preferences for the current user. This endpoint will return an error if preferences already exist.

**Request Body:**

```json
{
  "theme": "dark",
  "language": "en",
  "notifications": true,
  "email_frequency": "daily",
  "push_enabled": true
}
```

**Response:**

```json
{
  "id": 1,
  "user_id": 123,
  "theme": "dark",
  "language": "en",
  "notifications": true,
  "email_frequency": "daily",
  "push_enabled": true,
  "created_at": "2025-04-15T14:30:00",
  "updated_at": "2025-04-15T14:30:00"
}
```

#### Update User Preferences

```
PUT /api/v1/user-preferences
```

Updates the current user's preferences. If no preferences exist, they will be created.

**Request Body:**

```json
{
  "theme": "light",
  "notifications": false
}
```

**Response:**

```json
{
  "id": 1,
  "user_id": 123,
  "theme": "light",
  "language": "en",
  "notifications": false,
  "email_frequency": "daily",
  "push_enabled": true,
  "created_at": "2025-04-15T14:30:00",
  "updated_at": "2025-04-15T14:35:00"
}
```

## How It Works

### Default Preferences

When a user first accesses their preferences, the system checks if they already have preferences stored. If not, default preferences are automatically created:

- **Theme**: System default
- **Language**: English ("en")
- **Notifications**: Enabled
- **Email Frequency**: Daily
- **Push Notifications**: Enabled

### Preference Retrieval

When the application needs to apply user preferences (e.g., when rendering the UI or sending notifications), it retrieves the preferences from the database using the `UserPreferenceService`:

```python
preference_service = UserPreferenceService(db)
preferences = preference_service.get_user_preferences(user_id)
```

### Preference Updates

Users can update their preferences at any time through the API. Only the fields that are included in the request will be updated; other fields will retain their current values.

### Cascading Deletion

If a user account is deleted, their preferences are automatically deleted due to the `ondelete="CASCADE"` constraint on the `user_id` foreign key.

## Why User Preferences Matter

### 1. Enhanced User Experience

User preferences significantly improve the user experience by allowing personalization. Users can configure the application to match their visual preferences, language needs, and communication preferences.

### 2. Accessibility and Inclusion

Supporting different themes (including dark mode) and languages makes the application more accessible to a wider audience, including users with visual impairments or those who speak different languages.

### 3. User Retention

Personalization features have been shown to increase user retention. When users can customize their experience, they're more likely to continue using the application.

### 4. Reduced Support Burden

By giving users control over notifications and communication preferences, you can reduce the support burden related to communication issues. Users can self-manage their preferences rather than contacting support to change how they receive updates.

### 5. Compliance with Regulations

Allowing users to control their communication preferences helps comply with regulations like GDPR, which require explicit consent for communications.

## Implementation Benefits

### 1. Centralized Storage

By storing all user preferences in a dedicated table, the application has a single source of truth for user settings, making it easier to maintain consistency.

### 2. Efficient Retrieval

The preferences are stored in a structured format that allows for efficient retrieval and application, minimizing the performance impact of personalization.

### 3. Extensibility

The current implementation can be easily extended to include additional preferences without requiring significant changes to the database schema or application code.

### 4. Separation of Concerns

By separating user preferences from the core user data, the application maintains a clean separation of concerns, making the codebase more maintainable.

## Usage Examples

### Applying Theme Preferences in the Frontend

```javascript
// Fetch user preferences
const preferences = await api.getUserPreferences();

// Apply theme
if (preferences.theme === 'dark') {
  document.body.classList.add('dark-theme');
} else {
  document.body.classList.remove('dark-theme');
}
```

### Filtering Notifications Based on Preferences

```python
def send_notification(user_id, notification_type, message):
    # Get user preferences
    preferences = preference_service.get_user_preferences(user_id)
    
    # Check if notifications are enabled
    if not preferences.notifications:
        return
    
    # Check if push notifications are enabled for push type
    if notification_type == 'push' and not preferences.push_enabled:
        return
    
    # Send the notification
    notification_service.send(user_id, notification_type, message)
```

### Setting Language Based on Preferences

```python
def get_localized_message(user_id, message_key):
    # Get user preferences
    preferences = preference_service.get_user_preferences(user_id)
    
    # Get message in user's preferred language
    language = preferences.language or 'en'  # Default to English
    return translation_service.get_message(message_key, language)
```

## Conclusion

The user preferences system provides a powerful way to enhance the RideShare application with personalization features. By storing and managing user preferences in a structured way, the application can deliver a more tailored, accessible, and user-friendly experience.

This implementation demonstrates how the Database Migration Utilities can be used to easily add new features to the application, allowing for rapid development and iteration without complex migration issues.
