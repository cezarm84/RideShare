"""FAQ models for the application."""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class FAQCategory(Base):
    """Model for FAQ categories."""

    __tablename__ = "faq_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    icon = Column(String, nullable=True)  # Icon name or URL
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    faqs = relationship("FAQ", back_populates="category", cascade="all, delete-orphan")


class FAQ(Base):
    """Model for frequently asked questions."""

    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String, nullable=False, index=True)
    answer = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("faq_categories.id"), nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    category = relationship("FAQCategory", back_populates="faqs")
