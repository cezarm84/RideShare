"""
Admin endpoints for managing test emails and fake enterprise users.
"""

import logging
import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from faker import Faker
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_admin_user, get_password_hash
from app.db.session import get_db
from app.models.enterprise import Enterprise
from app.models.test_email import TestEmail
from app.models.user import EnterpriseUser, User, UserType
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

router = APIRouter()


class TestEmailResponse(BaseModel):
    """Response model for test emails."""

    id: int
    to_email: str
    from_email: str
    subject: str
    html_content: str
    text_content: Optional[str] = None
    cc: Optional[str] = None
    bcc: Optional[str] = None
    created_at: datetime
    user_id: Optional[int] = None


class FakeUserCreate(BaseModel):
    """Request model for creating fake enterprise users."""

    enterprise_id: int
    count: int = 10


class FakeUserResponse(BaseModel):
    """Response model for fake user creation."""

    message: str
    count: int
    users: List[Dict[str, Any]]


def generate_enterprise_email(
    first_name: str, last_name: str, enterprise_domain: str
) -> str:
    """
    Generate a realistic enterprise email address.

    Args:
        first_name: User's first name
        last_name: User's last name
        enterprise_domain: Domain for the enterprise

    Returns:
        str: Generated email address
    """
    # Common email formats
    formats = [
        f"{first_name.lower()}.{last_name.lower()}@{enterprise_domain}",
        f"{first_name[0].lower()}{last_name.lower()}@{enterprise_domain}",
        f"{last_name.lower()}.{first_name.lower()}@{enterprise_domain}",
        f"{first_name.lower()}{last_name[0].lower()}@{enterprise_domain}",
    ]
    return random.choice(formats)


@router.get("/test-emails", response_model=List[TestEmailResponse])
async def get_test_emails(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> List[TestEmailResponse]:
    """
    Get all test emails sent by the system.
    Admin only endpoint.
    """
    try:
        # Get emails from the database
        emails = (
            db.query(TestEmail)
            .order_by(TestEmail.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [TestEmailResponse(**email.to_dict()) for email in emails]
    except Exception as e:
        logger.error(f"Error getting test emails: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting test emails: {str(e)}",
        )


@router.delete("/test-emails/{email_id}", response_model=Dict[str, str])
async def delete_test_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Dict[str, str]:
    """
    Delete a test email.
    Admin only endpoint.
    """
    try:
        # Get email from the database
        email = db.query(TestEmail).filter(TestEmail.id == email_id).first()
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Test email with ID {email_id} not found",
            )

        # Delete email
        db.delete(email)
        db.commit()

        return {"message": f"Test email with ID {email_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting test email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting test email: {str(e)}",
        )


@router.delete("/test-emails", response_model=Dict[str, str])
async def delete_all_test_emails(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> Dict[str, str]:
    """
    Delete all test emails.
    Admin only endpoint.
    """
    try:
        # Delete all emails
        count = db.query(TestEmail).delete()
        db.commit()

        return {"message": f"Deleted {count} test emails successfully"}
    except Exception as e:
        logger.error(f"Error deleting test emails: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting test emails: {str(e)}",
        )


@router.post("/create-fake-enterprise-users", response_model=FakeUserResponse)
async def create_fake_enterprise_users(
    request: FakeUserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
) -> FakeUserResponse:
    """
    Create fake users for an enterprise.
    Admin only endpoint.
    """
    try:
        # Get enterprise
        enterprise = (
            db.query(Enterprise).filter(Enterprise.id == request.enterprise_id).first()
        )
        if not enterprise:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Enterprise with ID {request.enterprise_id} not found",
            )

        # Get domain from enterprise website or use default
        domain = (
            enterprise.website.split("//")[-1].split("/")[0]
            if enterprise.website
            else f"{enterprise.name.lower().replace(' ', '')}.com"
        )

        fake = Faker()
        users = []

        for _ in range(request.count):
            first_name = fake.first_name()
            last_name = fake.last_name()
            email = generate_enterprise_email(first_name, last_name, domain)

            # Create user
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                password_hash=get_password_hash("password123"),  # Default password
                is_active=True,
                is_verified=True,  # Auto-verify enterprise users
                user_type=UserType.ENTERPRISE,
                created_at=datetime.now(timezone.utc),
            )
            db.add(user)
            db.flush()  # Flush to get the user ID

            # Create enterprise user association
            enterprise_user = EnterpriseUser(
                user_id=user.id,
                enterprise_id=request.enterprise_id,
                employee_id=f"EMP-{fake.random_number(digits=6)}",
                department=fake.job().split()[0],
                position=fake.job(),
            )
            db.add(enterprise_user)

            users.append(
                {
                    "id": user.id,
                    "email": email,
                    "name": f"{first_name} {last_name}",
                    "employee_id": enterprise_user.employee_id,
                    "department": enterprise_user.department,
                    "position": enterprise_user.position,
                }
            )

        db.commit()

        # Send welcome emails in background
        for user_data in users:
            user = db.query(User).filter(User.id == user_data["id"]).first()
            if user:
                background_tasks.add_task(email_service.send_welcome_email, user)

        return FakeUserResponse(
            message=f"Created {len(users)} fake users for enterprise {enterprise.name}",
            count=len(users),
            users=users,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating fake enterprise users: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating fake enterprise users: {str(e)}",
        )
