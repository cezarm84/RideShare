"""API endpoints for FAQs."""

import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_db
from app.models.user import User
from app.schemas.faq import (
    FAQCategoryCreate,
    FAQCategoryResponse,
    FAQCategoryUpdate,
    FAQCategoryWithFAQs,
    FAQCreate,
    FAQListResponse,
    FAQResponse,
    FAQUpdate,
    FAQWithCategory,
)
from app.services.faq_service import FAQService

logger = logging.getLogger(__name__)

router = APIRouter()


# Public endpoints (no authentication required)
@router.get("", response_model=FAQListResponse)
async def get_faqs(
    db: Session = Depends(get_db),
) -> Any:
    """
    Get all FAQs organized by category.
    """
    try:
        faq_service = FAQService(db)
        return faq_service.get_faq_list()
    except Exception as e:
        logger.error(f"Error getting FAQs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting FAQs: {str(e)}",
        )


@router.get("/search", response_model=List[FAQResponse])
async def search_faqs(
    query: str = Query(..., min_length=2),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> Any:
    """
    Search FAQs by question or answer.
    """
    try:
        faq_service = FAQService(db)
        return faq_service.search_faqs(query, limit)
    except Exception as e:
        logger.error(f"Error searching FAQs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching FAQs: {str(e)}",
        )


@router.get("/categories", response_model=List[Dict])
async def get_faq_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get all FAQ categories.
    """
    try:
        faq_service = FAQService(db)
        categories = faq_service.get_categories(skip, limit)
        # Convert to dictionaries to avoid validation errors
        return [
            {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "icon": category.icon,
                "display_order": category.display_order,
                "is_active": category.is_active,
                "created_at": category.created_at or None,
                "updated_at": category.updated_at or None,
            }
            for category in categories
        ]
    except Exception as e:
        logger.error(f"Error getting FAQ categories: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting FAQ categories: {str(e)}",
        )


@router.get("/categories/{category_id}", response_model=FAQCategoryWithFAQs)
async def get_faq_category(
    category_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific FAQ category with its FAQs.
    """
    try:
        faq_service = FAQService(db)
        category = faq_service.get_category(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"FAQ category with ID {category_id} not found",
            )

        # Get FAQs for this category
        faqs = faq_service.get_faqs(category_id=category_id)

        # Construct the response
        return {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "icon": category.icon,
            "display_order": category.display_order,
            "is_active": category.is_active,
            "created_at": category.created_at,
            "updated_at": category.updated_at,
            "faqs": faqs,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting FAQ category: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting FAQ category: {str(e)}",
        )


@router.get("/{faq_id}", response_model=FAQWithCategory)
async def get_faq(
    faq_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific FAQ.
    """
    try:
        faq_service = FAQService(db)
        faq = faq_service.get_faq(faq_id)
        if not faq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"FAQ with ID {faq_id} not found",
            )

        # Get category if it exists
        category = None
        if faq.category_id:
            category = faq_service.get_category(faq.category_id)

        # Construct the response
        response = {
            "id": faq.id,
            "question": faq.question,
            "answer": faq.answer,
            "category_id": faq.category_id,
            "display_order": faq.display_order,
            "is_active": faq.is_active,
            "created_at": faq.created_at or None,
            "updated_at": faq.updated_at or None,
            "category": None,
        }

        if category:
            response["category"] = {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "icon": category.icon,
                "display_order": category.display_order,
                "is_active": category.is_active,
                "created_at": category.created_at or None,
                "updated_at": category.updated_at or None,
            }

        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting FAQ: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting FAQ: {str(e)}",
        )


# Admin endpoints (require admin authentication)
@router.post(
    "/categories",
    response_model=FAQCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_faq_category(
    category_in: FAQCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Create a new FAQ category.
    """
    try:
        faq_service = FAQService(db)
        return faq_service.create_category(category_in)
    except Exception as e:
        logger.error(f"Error creating FAQ category: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating FAQ category: {str(e)}",
        )


@router.put("/categories/{category_id}", response_model=FAQCategoryResponse)
async def update_faq_category(
    category_in: FAQCategoryUpdate,
    category_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Update a FAQ category.
    """
    try:
        faq_service = FAQService(db)
        category = faq_service.update_category(category_id, category_in)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"FAQ category with ID {category_id} not found",
            )
        return category
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating FAQ category: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating FAQ category: {str(e)}",
        )


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq_category(
    category_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> None:
    """
    Delete a FAQ category.
    """
    try:
        faq_service = FAQService(db)
        result = faq_service.delete_category(category_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"FAQ category with ID {category_id} not found",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting FAQ category: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting FAQ category: {str(e)}",
        )


@router.post("", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
async def create_faq(
    faq_in: FAQCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Create a new FAQ.
    """
    try:
        faq_service = FAQService(db)
        return faq_service.create_faq(faq_in)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating FAQ: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating FAQ: {str(e)}",
        )


@router.put("/{faq_id}", response_model=FAQResponse)
async def update_faq(
    faq_in: FAQUpdate,
    faq_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Update a FAQ.
    """
    try:
        faq_service = FAQService(db)
        faq = faq_service.update_faq(faq_id, faq_in)
        if not faq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"FAQ with ID {faq_id} not found",
            )
        return faq
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating FAQ: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating FAQ: {str(e)}",
        )


@router.delete("/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(
    faq_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> None:
    """
    Delete a FAQ.
    """
    try:
        faq_service = FAQService(db)
        result = faq_service.delete_faq(faq_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"FAQ with ID {faq_id} not found",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting FAQ: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting FAQ: {str(e)}",
        )
