"""Cover Letter model for storing user cover letters."""

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class CoverLetter(Base):
    """Cover letter with structured content and template selection."""

    __tablename__ = "cover_letters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    application_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True
    )
    
    # Template selection
    template_slug: Mapped[str] = mapped_column(String(50), default="formal")
    
    # Design tokens (same system as resumes)
    design_tokens: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Cover letter content - structured JSON
    # Schema: {
    #   "meta": { "tone": str, "jobTitle": str, "companyName": str },
    #   "content": {
    #     "salutation": str,
    #     "opening": str,
    #     "body": str[],
    #     "closing": str,
    #     "signature": str
    #   }
    # }
    content: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Metadata
    title: Mapped[str] = mapped_column(String(255), default="Untitled Cover Letter")
    is_template: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="cover_letters")
    application = relationship("Application", back_populates="cover_letter")
