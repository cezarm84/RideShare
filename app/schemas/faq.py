"""Schemas for FAQ models."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# FAQ Category Schemas
class FAQCategoryBase(BaseModel):
    """Base schema for FAQ category."""

    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class FAQCategoryCreate(FAQCategoryBase):
    """Schema for creating a FAQ category."""

    pass


class FAQCategoryUpdate(FAQCategoryBase):
    """Schema for updating a FAQ category."""

    name: Optional[str] = None
    is_active: Optional[bool] = None


class FAQCategoryInDBBase(FAQCategoryBase):
    """Base schema for FAQ category in DB."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class FAQCategoryInDB(FAQCategoryInDBBase):
    """Schema for FAQ category in DB."""

    pass


class FAQCategoryResponse(FAQCategoryInDBBase):
    """Schema for FAQ category response."""

    pass


# FAQ Schemas
class FAQBase(BaseModel):
    """Base schema for FAQ."""

    question: str
    answer: str
    category_id: Optional[int] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class FAQCreate(FAQBase):
    """Schema for creating a FAQ."""

    pass


class FAQUpdate(FAQBase):
    """Schema for updating a FAQ."""

    question: Optional[str] = None
    answer: Optional[str] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


class FAQInDBBase(FAQBase):
    """Base schema for FAQ in DB."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class FAQInDB(FAQInDBBase):
    """Schema for FAQ in DB."""

    pass


class FAQResponse(FAQInDBBase):
    """Schema for FAQ response."""

    pass


class FAQWithCategory(FAQResponse):
    """Schema for FAQ with category."""

    category: Optional[FAQCategoryResponse] = None


# Combined Schemas
class FAQCategoryWithFAQs(FAQCategoryResponse):
    """Schema for FAQ category with FAQs."""

    faqs: List[FAQResponse] = Field(default_factory=list)


class FAQListResponse(BaseModel):
    """Schema for FAQ list response."""

    categories: List[FAQCategoryWithFAQs] = Field(default_factory=list)
    uncategorized: List[FAQResponse] = Field(default_factory=list)
