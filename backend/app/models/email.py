"""Email model for storing and tracking email content and deadlines."""

from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Email(Base):
    """Email entry for storing email content, extracted dates, and deadline tracking."""
    
    __tablename__ = "emails"
    
    # Primary and Foreign Keys
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Email Content
    email_content = Column(Text, nullable=False)
    
    # AI Extracted Information
    parsed_summary = Column(Text, nullable=True)  # Brief summary from AI
    key_deadlines = Column(Text, nullable=True)  # JSON string of extracted deadlines [{"date": "2026-02-15", "description": "Interview", "is_critical": true}]
    extracted_dates = Column(Text, nullable=True)  # JSON string of all extracted dates
    key_details = Column(Text, nullable=True)  # JSON string of important details from email
    
    # Metadata
    ai_confidence = Column(String(50), nullable=True)  # "high", "medium", "low"
    source_company = Column(String(255), nullable=True)  # Company mentioned in email
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="emails")
    
    def __repr__(self):
        return f"<Email(id={self.id}, user_id={self.user_id}, created_at={self.created_at})>"
