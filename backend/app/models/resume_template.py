from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class TemplateType(str, enum.Enum):
    RESUME = "resume"
    COVER_LETTER = "cover_letter"


class ResumeTemplate(Base):
    """
    Stores resume and cover letter templates with HTML/CSS content.
    Templates are versioned and configurable via design tokens.
    """
    __tablename__ = "resume_templates"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    template_type = Column(String(20), default=TemplateType.RESUME.value, nullable=False)
    
    # Template content
    html_content = Column(Text, nullable=False)
    css_content = Column(Text, nullable=False)
    
    # Configuration: supported purposes, default tokens, etc.
    config = Column(JSONB, nullable=True, default=dict)
    
    # Preview image path (optional)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    # Versioning
    version = Column(String(20), default="1.0")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<ResumeTemplate {self.slug} v{self.version}>"
