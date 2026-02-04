"""Application Event schemas for AI-powered email parsing."""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# Event types supported by the system
EventType = Literal[
    "status_change",      # Application status changed
    "confirmation",       # Application received/confirmed
    "interview_scheduled", # Interview scheduled
    "interview_completed", # Interview completed
    "assessment",         # Technical assessment, coding test, etc.
    "offer",              # Job offer received
    "rejection",          # Application rejected
    "request",            # Request for additional info
    "follow_up",          # Follow-up sent or needed
    "other"               # Other event type
]

EventSource = Literal["email", "manual", "system"]


# ============================================
# Email Parsing Schemas
# ============================================

class EmailParseRequest(BaseModel):
    """Request to parse email content and extract event information."""
    email_content: str = Field(..., min_length=10, description="Raw email content to parse")
    additional_context: Optional[str] = Field(None, description="Additional context about the application")


class ExtractedDate(BaseModel):
    """A date extracted from email content."""
    date: datetime
    description: str  # What this date refers to (e.g., "interview", "deadline")
    is_deadline: bool = False


class AISuggestions(BaseModel):
    """AI-generated suggestions from email parsing."""
    suggested_event_type: EventType
    suggested_status: Optional[str] = None  # Suggested application status update
    confidence: float = Field(..., ge=0.0, le=1.0)  # Confidence score 0-1
    extracted_dates: List[ExtractedDate] = []
    key_details: List[str] = []  # Key points extracted from email
    next_steps: List[str] = []  # Suggested next actions
    action_required: bool = False
    action_description: Optional[str] = None
    action_deadline: Optional[datetime] = None


class EmailParseResponse(BaseModel):
    """Response from email parsing with AI suggestions."""
    success: bool
    summary: str  # AI-generated summary of the email
    suggestions: AISuggestions
    raw_content: str  # Original email content (for storage)
    
    class Config:
        from_attributes = True


# ============================================
# Event CRUD Schemas
# ============================================

class ApplicationEventBase(BaseModel):
    """Base schema for application events."""
    event_type: EventType = "other"
    source: EventSource = "manual"
    summary: Optional[str] = None
    event_date: Optional[datetime] = None
    action_required: bool = False
    action_description: Optional[str] = None
    action_deadline: Optional[datetime] = None


class ApplicationEventCreate(ApplicationEventBase):
    """Schema for creating an application event."""
    raw_content: Optional[str] = None  # Original email content if from email
    ai_suggestions: Optional[dict] = None  # Store AI suggestions
    # For status change events
    old_status: Optional[str] = None
    new_status: Optional[str] = None


class ApplicationEventFromEmail(BaseModel):
    """Schema for creating an event from parsed email with user confirmation."""
    email_content: str = Field(..., min_length=10)
    # User can override AI suggestions
    event_type: Optional[EventType] = None
    summary: Optional[str] = None
    event_date: Optional[datetime] = None
    action_required: Optional[bool] = None
    action_description: Optional[str] = None
    action_deadline: Optional[datetime] = None
    # Whether to also update application status
    update_status: bool = False
    new_status: Optional[str] = None


class ApplicationEventUpdate(BaseModel):
    """Schema for updating an application event."""
    event_type: Optional[EventType] = None
    summary: Optional[str] = None
    event_date: Optional[datetime] = None
    action_required: Optional[bool] = None
    action_description: Optional[str] = None
    action_deadline: Optional[datetime] = None
    action_completed: Optional[bool] = None


class ApplicationEventResponse(BaseModel):
    """Response schema for application events."""
    id: int
    application_id: int
    event_type: EventType
    source: EventSource
    summary: Optional[str] = None
    raw_content: Optional[str] = None
    
    # Status change fields
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    
    # Action tracking
    action_required: bool = False
    action_description: Optional[str] = None
    action_deadline: Optional[datetime] = None
    action_completed: bool = False
    
    # AI suggestions (if available)
    ai_suggestions: Optional[dict] = None
    
    # Timestamps
    event_date: Optional[datetime] = None
    changed_at: datetime
    
    class Config:
        from_attributes = True


class ApplicationEventListResponse(BaseModel):
    """Simplified response for event lists."""
    id: int
    application_id: int
    event_type: EventType
    source: EventSource
    summary: Optional[str] = None
    action_required: bool = False
    action_completed: bool = False
    event_date: Optional[datetime] = None
    changed_at: datetime
    
    class Config:
        from_attributes = True
