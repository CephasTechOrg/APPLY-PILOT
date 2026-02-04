"""Email management API endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.email import EmailCreate, EmailListResponse, EmailListItem, EmailResponse
from app.services.email_service import EmailService

router = APIRouter(prefix="/emails", tags=["emails"])


@router.post("", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
async def create_email(
    email_in: EmailCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new email entry.
    
    Automatically parses email content using AI to extract:
    - Summary
    - Deadlines and dates
    - Key details
    - Source company (if identifiable)
    """
    try:
        email = EmailService.create_email(current_user, email_in, db)
        return email
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse email: {str(e)}",
        )


@router.get("", response_model=EmailListResponse)
async def list_emails(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List user's stored emails with pagination.
    
    Returns most recent first.
    """
    emails, total = EmailService.list_emails(current_user.id, db, limit, offset)
    
    email_items = [
        EmailListItem(
            id=email.id,
            parsed_summary=email.parsed_summary,
            source_company=email.source_company,
            ai_confidence=email.ai_confidence,
            created_at=email.created_at,
        )
        for email in emails
    ]
    
    return EmailListResponse(total=total, emails=email_items)


@router.get("/{email_id}", response_model=EmailResponse)
async def get_email(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single email by ID."""
    email = EmailService.get_email(email_id, current_user.id, db)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    
    return email


@router.delete("/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email(
    email_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an email entry."""
    success = EmailService.delete_email(email_id, current_user.id, db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not found",
        )
    
    return None


@router.get("/deadlines/upcoming", response_model=dict)
async def get_upcoming_deadlines(
    days_ahead: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all upcoming deadlines from stored emails.
    
    Parameters:
    - days_ahead: Look ahead this many days (default: 30)
    
    Returns list of upcoming deadlines sorted by date.
    """
    deadlines = EmailService.get_upcoming_deadlines(
        current_user.id, db, days_ahead
    )
    
    return {
        "total": len(deadlines),
        "deadlines": deadlines,
    }
