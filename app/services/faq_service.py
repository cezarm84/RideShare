"""Service for managing FAQs."""

import logging
from datetime import datetime
from typing import Dict, List, Optional, Union

from fastapi import HTTPException, status
from sqlalchemy import asc
from sqlalchemy.orm import Session

from app.models.faq import FAQ, FAQCategory
from app.schemas.faq import (
    FAQCategoryCreate,
    FAQCategoryUpdate,
    FAQCreate,
    FAQListResponse,
    FAQUpdate,
)

logger = logging.getLogger(__name__)


class FAQService:
    """Service for managing FAQs."""

    def __init__(self, db: Session):
        """Initialize the service with a database session."""
        self.db = db

    # FAQ Category Methods
    def create_category(self, obj_in: FAQCategoryCreate) -> FAQCategory:
        """Create a new FAQ category."""
        db_obj = FAQCategory(
            name=obj_in.name,
            description=obj_in.description,
            icon=obj_in.icon,
            display_order=obj_in.display_order,
            is_active=obj_in.is_active,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get_category(self, category_id: int) -> Optional[FAQCategory]:
        """Get a FAQ category by ID."""
        return self.db.query(FAQCategory).filter(FAQCategory.id == category_id).first()

    def get_categories(
        self, skip: int = 0, limit: int = 100, include_inactive: bool = False
    ) -> List[FAQCategory]:
        """Get all FAQ categories."""
        query = self.db.query(FAQCategory)

        if not include_inactive:
            query = query.filter(FAQCategory.is_active == True)

        return (
            query.order_by(asc(FAQCategory.display_order))
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_category(
        self, category_id: int, obj_in: Union[FAQCategoryUpdate, Dict]
    ) -> Optional[FAQCategory]:
        """Update a FAQ category."""
        db_obj = self.get_category(category_id)
        if not db_obj:
            return None

        # Convert to dict if it's not already
        update_data = (
            obj_in
            if isinstance(obj_in, dict)
            else obj_in.model_dump(exclude_unset=True)
        )

        # Update the category
        for field, value in update_data.items():
            if hasattr(db_obj, field) and value is not None:
                setattr(db_obj, field, value)

        db_obj.updated_at = datetime.utcnow()
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete_category(self, category_id: int) -> bool:
        """Delete a FAQ category."""
        db_obj = self.get_category(category_id)
        if not db_obj:
            return False

        self.db.delete(db_obj)
        self.db.commit()
        return True

    # FAQ Methods
    def create_faq(self, obj_in: FAQCreate) -> FAQ:
        """Create a new FAQ."""
        # Verify category exists if provided
        if obj_in.category_id:
            category = self.get_category(obj_in.category_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"FAQ category with ID {obj_in.category_id} not found",
                )

        db_obj = FAQ(
            question=obj_in.question,
            answer=obj_in.answer,
            category_id=obj_in.category_id,
            display_order=obj_in.display_order,
            is_active=obj_in.is_active,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get_faq(self, faq_id: int) -> Optional[FAQ]:
        """Get a FAQ by ID."""
        return self.db.query(FAQ).filter(FAQ.id == faq_id).first()

    def get_faqs(
        self,
        skip: int = 0,
        limit: int = 100,
        include_inactive: bool = False,
        category_id: Optional[int] = None,
    ) -> List[FAQ]:
        """Get all FAQs, optionally filtered by category."""
        query = self.db.query(FAQ)

        if not include_inactive:
            query = query.filter(FAQ.is_active == True)

        if category_id is not None:
            query = query.filter(FAQ.category_id == category_id)

        return query.order_by(asc(FAQ.display_order)).offset(skip).limit(limit).all()

    def update_faq(self, faq_id: int, obj_in: Union[FAQUpdate, Dict]) -> Optional[FAQ]:
        """Update a FAQ."""
        db_obj = self.get_faq(faq_id)
        if not db_obj:
            return None

        # Convert to dict if it's not already
        update_data = (
            obj_in
            if isinstance(obj_in, dict)
            else obj_in.model_dump(exclude_unset=True)
        )

        # Verify category exists if provided
        if "category_id" in update_data and update_data["category_id"] is not None:
            category = self.get_category(update_data["category_id"])
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"FAQ category with ID {update_data['category_id']} not found",
                )

        # Update the FAQ
        for field, value in update_data.items():
            if hasattr(db_obj, field) and value is not None:
                setattr(db_obj, field, value)

        db_obj.updated_at = datetime.utcnow()
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete_faq(self, faq_id: int) -> bool:
        """Delete a FAQ."""
        db_obj = self.get_faq(faq_id)
        if not db_obj:
            return False

        self.db.delete(db_obj)
        self.db.commit()
        return True

    def search_faqs(self, query: str, limit: int = 100) -> List[FAQ]:
        """Search FAQs by question or answer."""
        search_term = f"%{query}%"
        return (
            self.db.query(FAQ)
            .filter(
                FAQ.is_active == True,
                (FAQ.question.ilike(search_term) | FAQ.answer.ilike(search_term)),
            )
            .order_by(asc(FAQ.display_order))
            .limit(limit)
            .all()
        )

    def get_faq_list(self) -> FAQListResponse:
        """Get all FAQs organized by category."""
        # Get all active categories with their FAQs
        categories = (
            self.db.query(FAQCategory)
            .filter(FAQCategory.is_active == True)
            .order_by(asc(FAQCategory.display_order))
            .all()
        )

        # Get uncategorized FAQs
        uncategorized = (
            self.db.query(FAQ)
            .filter(FAQ.is_active == True, FAQ.category_id.is_(None))
            .order_by(asc(FAQ.display_order))
            .all()
        )

        return FAQListResponse(
            categories=[
                {
                    "id": category.id,
                    "name": category.name,
                    "description": category.description,
                    "icon": category.icon,
                    "display_order": category.display_order,
                    "is_active": category.is_active,
                    "created_at": category.created_at or None,
                    "updated_at": category.updated_at or None,
                    "faqs": [
                        {
                            "id": faq.id,
                            "question": faq.question,
                            "answer": faq.answer,
                            "category_id": faq.category_id,
                            "display_order": faq.display_order,
                            "is_active": faq.is_active,
                            "created_at": faq.created_at or None,
                            "updated_at": faq.updated_at or None,
                        }
                        for faq in category.faqs
                        if faq.is_active
                    ],
                }
                for category in categories
            ],
            uncategorized=[
                {
                    "id": faq.id,
                    "question": faq.question,
                    "answer": faq.answer,
                    "category_id": faq.category_id,
                    "display_order": faq.display_order,
                    "is_active": faq.is_active,
                    "created_at": faq.created_at or None,
                    "updated_at": faq.updated_at or None,
                }
                for faq in uncategorized
            ],
        )
