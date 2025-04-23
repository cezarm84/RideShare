"""API endpoints for simulating an email inbox."""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.email_domains import (DRIVER_DOMAIN, ENTERPRISE_DOMAINS,
                                   SYSTEM_DOMAIN, is_driver_email,
                                   is_enterprise_email, is_system_email)
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.inbox_email import InboxEmail
from app.models.test_email import TestEmail
from app.models.user import User

router = APIRouter()


class InboxEmailBase(BaseModel):
    """Base schema for inbox emails."""
    to_email: EmailStr
    from_email: EmailStr
    subject: str
    html_content: str
    text_content: Optional[str] = None
    cc: Optional[str] = None
    bcc: Optional[str] = None


class InboxEmailCreate(InboxEmailBase):
    """Schema for creating an inbox email."""
    pass


class InboxEmailUpdate(BaseModel):
    """Schema for updating an inbox email."""
    read: Optional[bool] = None
    replied: Optional[bool] = None


class InboxEmailResponse(InboxEmailBase):
    """Schema for inbox email response."""
    id: int
    created_at: datetime
    read: bool
    replied: bool

    class Config:
        orm_mode = True


@router.get("/inbox", response_model=List[InboxEmailResponse])
async def get_inbox_emails(
    email_address: Optional[str] = Query(None),
    domain_type: Optional[str] = Query(None, enum=["system", "driver", "enterprise", "all"]),
    unread_only: bool = Query(False),
    limit: int = Query(100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get emails from the inbox.
    
    Filter by:
    - email_address: Specific email address
    - domain_type: Type of domain (system, driver, enterprise, all)
    - unread_only: Only show unread emails
    """
    query = db.query(InboxEmail)
    
    # Filter by email address if provided
    if email_address:
        query = query.filter(InboxEmail.to_email == email_address)
    
    # Filter by domain type if provided
    if domain_type and domain_type != "all":
        if domain_type == "system":
            query = query.filter(InboxEmail.to_email.endswith(f"@{SYSTEM_DOMAIN}"))
            # Exclude driver and enterprise domains
            query = query.filter(~InboxEmail.to_email.endswith(f"@{DRIVER_DOMAIN}"))
            for enterprise_domain in [f"@{domain}" for domain in ENTERPRISE_DOMAINS.values()]:
                query = query.filter(~InboxEmail.to_email.endswith(enterprise_domain))
        elif domain_type == "driver":
            query = query.filter(InboxEmail.to_email.endswith(f"@{DRIVER_DOMAIN}"))
        elif domain_type == "enterprise":
            # Filter for any enterprise domain
            enterprise_filter = False
            for enterprise_domain in [f"@{domain}" for domain in ENTERPRISE_DOMAINS.values()]:
                if not enterprise_filter:
                    enterprise_filter = InboxEmail.to_email.endswith(enterprise_domain)
                else:
                    enterprise_filter = enterprise_filter | InboxEmail.to_email.endswith(enterprise_domain)
            query = query.filter(enterprise_filter)
    
    # Filter by read status if requested
    if unread_only:
        query = query.filter(InboxEmail.read == False)
    
    # Order by creation date (newest first)
    query = query.order_by(InboxEmail.created_at.desc())
    
    # Apply pagination
    emails = query.offset(offset).limit(limit).all()
    
    return emails


@router.post("/inbox/send", response_model=InboxEmailResponse)
async def send_to_inbox(
    email_data: InboxEmailCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Simulate sending an email to the inbox.
    
    This endpoint allows testing the receiving of emails from:
    - Users to system
    - System to users
    - Drivers to system
    - System to drivers
    - Enterprise users to system
    - System to enterprise users
    """
    # Create the inbox email
    inbox_email = InboxEmail(
        to_email=email_data.to_email,
        from_email=email_data.from_email,
        subject=email_data.subject,
        html_content=email_data.html_content,
        text_content=email_data.text_content,
        cc=email_data.cc,
        bcc=email_data.bcc,
        created_at=datetime.now(timezone.utc),
        read=False,
        replied=False
    )
    
    # Also create a test email to view in the email viewer
    test_email = TestEmail(
        to_email=email_data.to_email,
        from_email=email_data.from_email,
        subject=email_data.subject,
        html_content=email_data.html_content,
        text_content=email_data.text_content,
        cc=email_data.cc,
        bcc=email_data.bcc,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(inbox_email)
    db.add(test_email)
    db.commit()
    db.refresh(inbox_email)
    
    return inbox_email


@router.put("/inbox/{email_id}", response_model=InboxEmailResponse)
async def update_inbox_email(
    email_id: int,
    email_data: InboxEmailUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an inbox email (mark as read/replied).
    """
    # Get the email
    email = db.query(InboxEmail).filter(InboxEmail.id == email_id).first()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Update the email
    if email_data.read is not None:
        email.read = email_data.read
    
    if email_data.replied is not None:
        email.replied = email_data.replied
    
    db.commit()
    db.refresh(email)
    
    return email


@router.delete("/inbox/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inbox_email(
    email_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete an inbox email.
    """
    # Get the email
    email = db.query(InboxEmail).filter(InboxEmail.id == email_id).first()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Delete the email
    db.delete(email)
    db.commit()
    
    return None


@router.post("/inbox/reply/{email_id}", response_model=InboxEmailResponse)
async def reply_to_email(
    email_id: int,
    reply_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reply to an email in the inbox.
    
    This creates a new email in the inbox with the reply content,
    and marks the original email as replied.
    """
    # Get the original email
    original_email = db.query(InboxEmail).filter(InboxEmail.id == email_id).first()
    if not original_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found"
        )
    
    # Create the reply email
    reply_subject = f"Re: {original_email.subject}" if not original_email.subject.startswith("Re: ") else original_email.subject
    reply_html = f"<p>{reply_data.get('content', '')}</p><hr><div>{original_email.html_content}</div>"
    reply_text = f"{reply_data.get('content', '')}\n\n---\n\n{original_email.text_content}"
    
    reply_email = InboxEmail(
        to_email=original_email.from_email,  # Reply to the sender
        from_email=original_email.to_email,  # From the original recipient
        subject=reply_subject,
        html_content=reply_html,
        text_content=reply_text,
        created_at=datetime.now(timezone.utc),
        read=False,
        replied=False
    )
    
    # Also create a test email to view in the email viewer
    test_email = TestEmail(
        to_email=original_email.from_email,
        from_email=original_email.to_email,
        subject=reply_subject,
        html_content=reply_html,
        text_content=reply_text,
        created_at=datetime.now(timezone.utc)
    )
    
    # Mark the original email as replied
    original_email.replied = True
    
    db.add(reply_email)
    db.add(test_email)
    db.commit()
    db.refresh(reply_email)
    
    return reply_email
