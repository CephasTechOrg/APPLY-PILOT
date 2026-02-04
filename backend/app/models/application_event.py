from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ApplicationEvent(Base):
    """
    Tracks events related to an application.
    
    Events can be:
    - Status changes (old_status -> new_status)
    - Email-derived events (confirmation, interview, offer, rejection, etc.)
    - User-logged events (call, meeting, follow-up, etc.)
    """
    __tablename__ = "application_events"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Event classification
    event_type = Column(String(50), nullable=False, default="status_change")
    # Types: status_change, confirmation, interview_scheduled, interview_completed,
    #        offer, rejection, request, follow_up, assessment, other
    
    # Status change tracking (for status_change events)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    
    # Event details
    source = Column(String(50), nullable=False, default="manual")
    # Sources: email, manual, system
    summary = Column(Text, nullable=True)  # AI-generated or user-provided summary
    raw_content = Column(Text, nullable=True)  # Original pasted email content
    
    # Action tracking
    action_required = Column(Boolean, default=False)
    action_description = Column(String(500), nullable=True)  # What action is needed
    action_deadline = Column(DateTime(timezone=True), nullable=True)
    action_completed = Column(Boolean, default=False)
    
    # AI suggestions (stored as JSON for flexibility)
    ai_suggestions = Column(JSONB, nullable=True)
    # Structure: { suggested_status, confidence, extracted_dates, key_details, next_steps }
    
    # Timestamps
    event_date = Column(DateTime(timezone=True), nullable=True)  # When the event occurred
    changed_at = Column(DateTime(timezone=True), server_default=func.now())  # When logged

    application = relationship("Application", back_populates="events")
    user = relationship("User")

    def __repr__(self):
        return f"<ApplicationEvent {self.id}: {self.event_type} for app {self.application_id}>"

