"""Pydantic schemas for Email model."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ============================================
# Deadline Models
# ============================================

class ExtractedDeadline(BaseModel):
    """A deadline extracted from email."""
    date: datetime
    description: str
    is_critical: bool = False


# ============================================
# Email Schemas
# ============================================

class EmailCreate(BaseModel):
    """Request schema for creating an email entry."""
    email_content: str = Field(..., min_length=10, description="Raw email content")


class EmailResponse(BaseModel):
    """Response schema for email entry."""
    id: int
    user_id: int
    email_content: str
    parsed_summary: Optional[str] = None
    key_deadlines: Optional[List[ExtractedDeadline]] = None
    extracted_dates: Optional[List[ExtractedDeadline]] = None
    key_details: Optional[List[str]] = None
    ai_confidence: Optional[str] = None
    source_company: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmailListItem(BaseModel):
    """Email item for list responses (minimal info)."""
    id: int
    parsed_summary: Optional[str] = None
    source_company: Optional[str] = None
    key_deadlines: Optional[List[ExtractedDeadline]] = None
    ai_confidence: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EmailListResponse(BaseModel):
    """Paginated list of emails."""
    total: int
    emails: List[EmailListItem]
