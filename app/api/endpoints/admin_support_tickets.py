"""Admin endpoints for managing support tickets."""

import logging
from datetime import datetime, timezone
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user, get_db
from app.models.support_ticket import SupportTicket
from app.models.user import User
from app.schemas.support_ticket import (
    SupportTicketResponse,
    SupportTicketUpdate,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("", response_model=List[SupportTicketResponse])
async def get_support_tickets(
    status: Optional[str] = Query(None, description="Filter by status (open, in_progress, closed)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Get all support tickets.

    This endpoint returns all support tickets, optionally filtered by status.
    Only admin users can access this endpoint.
    """
    query = db.query(SupportTicket)

    if status:
        query = query.filter(SupportTicket.status == status)

    # Order by created_at desc (newest first)
    query = query.order_by(desc(SupportTicket.created_at))

    tickets = query.all()
    return tickets


@router.get("/{ticket_id}", response_model=SupportTicketResponse)
async def get_support_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Get a specific support ticket by ID.

    This endpoint returns a specific support ticket by its ID.
    Only admin users can access this endpoint.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support ticket not found",
        )

    return ticket


@router.put("/{ticket_id}", response_model=SupportTicketResponse)
async def update_support_ticket(
    ticket_id: int,
    ticket_update: SupportTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
) -> Any:
    """
    Update a support ticket.

    This endpoint updates a support ticket with the provided data.
    Only admin users can access this endpoint.
    """
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support ticket not found",
        )

    # Update the ticket with the provided data
    update_data = ticket_update.dict(exclude_unset=True)

    # If status is being changed to 'closed', set closed_at
    if update_data.get("status") == "closed" and ticket.status != "closed":
        update_data["closed_at"] = datetime.now(timezone.utc)

    # If assigned_to is being changed, check if the user exists
    if "assigned_to" in update_data and update_data["assigned_to"] is not None:
        assignee = db.query(User).filter(User.id == update_data["assigned_to"]).first()

        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignee user not found",
            )

    # Update the ticket
    for key, value in update_data.items():
        setattr(ticket, key, value)

    # Update the updated_at timestamp
    ticket.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(ticket)

    return ticket
