"""Service for managing contact messages."""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Union

from fastapi import HTTPException
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.contact import ContactMessage, ContactStatus
from app.schemas.contact import ContactMessageCreate, ContactMessageUpdate

logger = logging.getLogger(__name__)


class ContactService:
    """Service for managing contact messages."""

    def __init__(self, db: Session):
        """Initialize the service with a database session."""
        self.db = db

    def create_message(
        self, obj_in: ContactMessageCreate, user_id: Optional[int] = None
    ) -> ContactMessage:
        """Create a new contact message."""
        db_obj = ContactMessage(
            name=obj_in.name,
            email=obj_in.email,
            phone=obj_in.phone,
            subject=obj_in.subject,
            message=obj_in.message,
            category=obj_in.category,
            status=ContactStatus.NEW,
            user_id=user_id,
            is_read=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get_message(self, message_id: int) -> Optional[ContactMessage]:
        """Get a contact message by ID."""
        return (
            self.db.query(ContactMessage)
            .filter(ContactMessage.id == message_id)
            .first()
        )

    def get_messages(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        category: Optional[str] = None,
        email: Optional[str] = None,
        user_id: Optional[int] = None,
        is_read: Optional[bool] = None,
    ) -> List[ContactMessage]:
        """Get all contact messages with optional filters."""
        query = self.db.query(ContactMessage)

        if status:
            query = query.filter(ContactMessage.status == status)

        if category:
            query = query.filter(ContactMessage.category == category)

        if email:
            query = query.filter(ContactMessage.email == email)

        if user_id is not None:
            query = query.filter(ContactMessage.user_id == user_id)

        if is_read is not None:
            query = query.filter(ContactMessage.is_read == is_read)

        return (
            query.order_by(desc(ContactMessage.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_message(
        self, message_id: int, obj_in: Union[ContactMessageUpdate, Dict]
    ) -> Optional[ContactMessage]:
        """Update a contact message."""
        db_obj = self.get_message(message_id)
        if not db_obj:
            return None

        # Convert to dict if it's not already
        update_data = (
            obj_in
            if isinstance(obj_in, dict)
            else obj_in.model_dump(exclude_unset=True)
        )

        # Update the message
        for field, value in update_data.items():
            if hasattr(db_obj, field) and value is not None:
                setattr(db_obj, field, value)

        db_obj.updated_at = datetime.utcnow()
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete_message(self, message_id: int) -> bool:
        """Delete a contact message."""
        db_obj = self.get_message(message_id)
        if not db_obj:
            return False

        self.db.delete(db_obj)
        self.db.commit()
        return True

    def mark_as_read(self, message_id: int) -> Optional[ContactMessage]:
        """Mark a contact message as read."""
        return self.update_message(message_id, {"is_read": True})

    def mark_as_unread(self, message_id: int) -> Optional[ContactMessage]:
        """Mark a contact message as unread."""
        return self.update_message(message_id, {"is_read": False})

    def update_status(self, message_id: int, status: str) -> Optional[ContactMessage]:
        """Update the status of a contact message."""
        if status not in [s.value for s in ContactStatus]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status}",
            )

        return self.update_message(message_id, {"status": status})

    def get_unread_count(self) -> int:
        """Get the count of unread contact messages."""
        return (
            self.db.query(ContactMessage)
            .filter(ContactMessage.is_read == False)
            .count()
        )

    def get_messages_by_email(
        self, email: str, skip: int = 0, limit: int = 100
    ) -> List[ContactMessage]:
        """Get all contact messages for a specific email."""
        return self.get_messages(skip=skip, limit=limit, email=email)

    def get_messages_by_user(
        self, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[ContactMessage]:
        """Get all contact messages for a specific user."""
        return self.get_messages(skip=skip, limit=limit, user_id=user_id)
