"""Application Events API endpoints with AI email parsing."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.application import Application
from app.models.user import User
from app.models.application_event import ApplicationEvent
from app.schemas.application_event import (
    ApplicationEventCreate,
    ApplicationEventFromEmail,
    ApplicationEventListResponse,
    ApplicationEventResponse,
    ApplicationEventUpdate,
    EmailParseRequest,
    EmailParseResponse,
    AISuggestions,
    ExtractedDate,
)
from app.services.ai_service import parse_email_content

router = APIRouter(prefix="/applications/{application_id}/events", tags=["application-events"])


def _get_application_or_404(
    application_id: int,
    user_id: int,
    db: Session
) -> Application:
    """Get application and verify ownership."""
    application = (
        db.query(Application)
        .filter(
            Application.id == application_id,
            Application.user_id == user_id
        )
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


# ============================================
# Email Parsing Endpoint
# ============================================

@router.post("/parse-email", response_model=EmailParseResponse)
def parse_email(
    application_id: int,
    request: EmailParseRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Parse pasted email content using AI to extract event information.
    
    Returns AI suggestions for event type, status, deadlines, and next steps.
    The user can then confirm and create the event.
    """
    # Verify application exists and belongs to user
    application = _get_application_or_404(application_id, current_user.id, db)
    
    try:
        parsed, tokens = parse_email_content(
            email_content=request.email_content,
            additional_context=request.additional_context,
            company=application.company,
            job_title=application.job_title,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse email: {str(e)}"
        )
    
    # Convert extracted dates to proper format
    extracted_dates = []
    for date_info in parsed.get("extracted_dates", []):
        try:
            date_str = date_info.get("date", "")
            time_str = date_info.get("time", "")
            if date_str:
                if time_str:
                    dt = datetime.fromisoformat(f"{date_str}T{time_str}")
                else:
                    dt = datetime.fromisoformat(date_str)
                extracted_dates.append(ExtractedDate(
                    date=dt,
                    description=date_info.get("description", ""),
                    is_deadline=date_info.get("is_deadline", False)
                ))
        except (ValueError, TypeError):
            continue  # Skip invalid dates
    
    # Parse action deadline
    action_deadline = None
    if parsed.get("action_deadline"):
        try:
            action_deadline = datetime.fromisoformat(parsed["action_deadline"])
        except (ValueError, TypeError):
            pass
    
    suggestions = AISuggestions(
        suggested_event_type=parsed.get("event_type", "other"),
        suggested_status=parsed.get("suggested_status"),
        confidence=parsed.get("confidence", 0.5),
        extracted_dates=extracted_dates,
        key_details=parsed.get("key_details", []),
        next_steps=parsed.get("next_steps", []),
        action_required=parsed.get("action_required", False),
        action_description=parsed.get("action_description"),
        action_deadline=action_deadline,
    )
    
    return EmailParseResponse(
        success=True,
        summary=parsed.get("summary", "Email parsed successfully"),
        suggestions=suggestions,
        raw_content=request.email_content,
    )


# ============================================
# Event CRUD Endpoints
# ============================================

@router.post("", response_model=ApplicationEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    application_id: int,
    data: ApplicationEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new application event manually."""
    application = _get_application_or_404(application_id, current_user.id, db)
    
    event = ApplicationEvent(
        application_id=application_id,
        user_id=current_user.id,
        event_type=data.event_type,
        source=data.source,
        summary=data.summary,
        raw_content=data.raw_content,
        old_status=data.old_status,
        new_status=data.new_status,
        action_required=data.action_required,
        action_description=data.action_description,
        action_deadline=data.action_deadline,
        ai_suggestions=data.ai_suggestions,
        event_date=data.event_date,
    )
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return event


@router.post("/from-email", response_model=ApplicationEventResponse, status_code=status.HTTP_201_CREATED)
def create_event_from_email(
    application_id: int,
    data: ApplicationEventFromEmail,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create an event from email content with AI parsing.
    
    This endpoint combines parsing and event creation in one step.
    User overrides are applied on top of AI suggestions.
    """
    application = _get_application_or_404(application_id, current_user.id, db)
    
    # Parse the email content
    try:
        parsed, tokens = parse_email_content(
            email_content=data.email_content,
            company=application.company,
            job_title=application.job_title,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse email: {str(e)}"
        )
    
    # Use user overrides if provided, otherwise use AI suggestions
    event_type = data.event_type or parsed.get("event_type", "other")
    summary = data.summary or parsed.get("summary", "")
    action_required = data.action_required if data.action_required is not None else parsed.get("action_required", False)
    action_description = data.action_description or parsed.get("action_description")
    
    # Handle event date
    event_date = data.event_date
    if not event_date and parsed.get("extracted_dates"):
        # Use the first extracted date as event date
        first_date = parsed["extracted_dates"][0]
        try:
            date_str = first_date.get("date", "")
            time_str = first_date.get("time", "")
            if date_str:
                if time_str:
                    event_date = datetime.fromisoformat(f"{date_str}T{time_str}")
                else:
                    event_date = datetime.fromisoformat(date_str)
        except (ValueError, TypeError):
            pass
    
    # Handle action deadline
    action_deadline = data.action_deadline
    if not action_deadline and parsed.get("action_deadline"):
        try:
            action_deadline = datetime.fromisoformat(parsed["action_deadline"])
        except (ValueError, TypeError):
            pass
    
    # Create the event
    event = ApplicationEvent(
        application_id=application_id,
        user_id=current_user.id,
        event_type=event_type,
        source="email",
        summary=summary,
        raw_content=data.email_content,
        action_required=action_required,
        action_description=action_description,
        action_deadline=action_deadline,
        event_date=event_date,
        ai_suggestions=parsed,  # Store full AI response for reference
    )
    
    db.add(event)
    
    # Optionally update application status
    if data.update_status and data.new_status:
        old_status = application.status
        application.status = data.new_status
        event.old_status = old_status
        event.new_status = data.new_status
    
    db.commit()
    db.refresh(event)
    
    return event


@router.get("", response_model=list[ApplicationEventListResponse])
def list_events(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all events for an application."""
    _get_application_or_404(application_id, current_user.id, db)
    
    events = (
        db.query(ApplicationEvent)
        .filter(ApplicationEvent.application_id == application_id)
        .order_by(ApplicationEvent.changed_at.desc())
        .all()
    )
    
    return events


@router.get("/{event_id}", response_model=ApplicationEventResponse)
def get_event(
    application_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific event."""
    _get_application_or_404(application_id, current_user.id, db)
    
    event = (
        db.query(ApplicationEvent)
        .filter(
            ApplicationEvent.id == event_id,
            ApplicationEvent.application_id == application_id
        )
        .first()
    )
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return event


@router.patch("/{event_id}", response_model=ApplicationEventResponse)
def update_event(
    application_id: int,
    event_id: int,
    data: ApplicationEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an event."""
    _get_application_or_404(application_id, current_user.id, db)
    
    event = (
        db.query(ApplicationEvent)
        .filter(
            ApplicationEvent.id == event_id,
            ApplicationEvent.application_id == application_id
        )
        .first()
    )
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Update fields
    if data.event_type is not None:
        event.event_type = data.event_type
    if data.summary is not None:
        event.summary = data.summary
    if data.event_date is not None:
        event.event_date = data.event_date
    if data.action_required is not None:
        event.action_required = data.action_required
    if data.action_description is not None:
        event.action_description = data.action_description
    if data.action_deadline is not None:
        event.action_deadline = data.action_deadline
    if data.action_completed is not None:
        event.action_completed = data.action_completed
    
    db.commit()
    db.refresh(event)
    
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    application_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an event."""
    _get_application_or_404(application_id, current_user.id, db)
    
    event = (
        db.query(ApplicationEvent)
        .filter(
            ApplicationEvent.id == event_id,
            ApplicationEvent.application_id == application_id
        )
        .first()
    )
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()


@router.post("/{event_id}/complete", response_model=ApplicationEventResponse)
def mark_event_action_complete(
    application_id: int,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an event's required action as complete."""
    _get_application_or_404(application_id, current_user.id, db)
    
    event = (
        db.query(ApplicationEvent)
        .filter(
            ApplicationEvent.id == event_id,
            ApplicationEvent.application_id == application_id
        )
        .first()
    )
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.action_completed = True
    db.commit()
    db.refresh(event)
    
    return event
