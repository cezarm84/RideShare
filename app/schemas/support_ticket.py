"""Schemas for support tickets."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SupportTicketBase(BaseModel):
    """Base schema for support tickets."""
    
    issue: str
    source: str = "chatbot"
    session_id: Optional[str] = None


class SupportTicketCreate(SupportTicketBase):
    """Schema for creating a support ticket."""
    
    pass


class SupportTicketUpdate(BaseModel):
    """Schema for updating a support ticket."""
    
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    closed_at: Optional[datetime] = None


class SupportTicketInDBBase(SupportTicketBase):
    """Base schema for support ticket in DB."""
    
    id: int
    ticket_number: str
    user_id: int
    status: str
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None
    
    class Config:
        """Pydantic config."""
        
        from_attributes = True


class SupportTicketResponse(SupportTicketInDBBase):
    """Schema for support ticket response."""
    
    pass
