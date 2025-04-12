from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user_preference import UserPreference
from app.schemas.user_preference import UserPreferenceCreate, UserPreferenceUpdate


class UserPreferenceService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_preferences(self, user_id: int) -> UserPreference:
        """Get user preferences for a user"""
        preferences = (
            self.db.query(UserPreference)
            .filter(UserPreference.user_id == user_id)
            .first()
        )

        # If preferences don't exist, create default preferences
        if not preferences:
            # Create a default UserPreferenceCreate object
            default_prefs = UserPreferenceCreate(
                theme=None,
                language="en",
                notifications=True,
                email_frequency="daily",
                push_enabled=True,
            )
            preferences = self.create_user_preferences(user_id, default_prefs)

        # Make sure we return a dictionary that matches the UserPreferenceResponse schema
        return preferences

    def create_user_preferences(
        self, user_id: int, preferences: UserPreferenceCreate
    ) -> UserPreference:
        """Create user preferences for a user"""
        # Check if preferences already exist
        existing = (
            self.db.query(UserPreference)
            .filter(UserPreference.user_id == user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=400, detail="User preferences already exist"
            )

        # Create preferences
        db_preferences = UserPreference(
            user_id=user_id,
            theme=preferences.theme,
            language=preferences.language,
            notifications=preferences.notifications,
            email_frequency=preferences.email_frequency,
            push_enabled=preferences.push_enabled,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        self.db.add(db_preferences)
        self.db.commit()
        self.db.refresh(db_preferences)

        return db_preferences

    def update_user_preferences(
        self, user_id: int, preferences: UserPreferenceUpdate
    ) -> UserPreference:
        """Update user preferences for a user"""
        # Get existing preferences
        db_preferences = (
            self.db.query(UserPreference)
            .filter(UserPreference.user_id == user_id)
            .first()
        )

        # If preferences don't exist, create them
        if not db_preferences:
            return self.create_user_preferences(user_id, preferences)

        # Update preferences
        if preferences.theme is not None:
            db_preferences.theme = preferences.theme

        if preferences.language is not None:
            db_preferences.language = preferences.language

        if preferences.notifications is not None:
            db_preferences.notifications = preferences.notifications

        if preferences.email_frequency is not None:
            db_preferences.email_frequency = preferences.email_frequency

        if preferences.push_enabled is not None:
            db_preferences.push_enabled = preferences.push_enabled

        db_preferences.updated_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(db_preferences)

        return db_preferences
