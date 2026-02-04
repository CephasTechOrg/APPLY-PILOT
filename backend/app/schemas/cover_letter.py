"""Pydantic schemas for Cover Letters."""

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


# ============================================
# Cover Letter Content Schema (Canonical)
# ============================================

class CoverLetterMeta(BaseModel):
    """Metadata about the cover letter context."""
    
    tone: str = Field(default="professional", description="Writing tone: professional, confident, creative, friendly")
    job_title: str = Field(default="", description="Target job title")
    company_name: str = Field(default="", description="Target company name")
    industry: Optional[str] = Field(default=None, description="Industry context")


class CoverLetterContent(BaseModel):
    """The actual cover letter content structure."""
    
    salutation: str = Field(default="Dear Hiring Manager,", description="Opening salutation")
    opening: str = Field(default="", description="Opening paragraph - hook and position reference")
    body: List[str] = Field(default_factory=list, description="Body paragraphs - skills, experience, value proposition")
    closing: str = Field(default="", description="Closing paragraph - call to action")
    signature: str = Field(default="Sincerely,", description="Sign-off phrase")
    sender_name: str = Field(default="", description="Sender's full name")


class CoverLetterStructuredData(BaseModel):
    """Complete structured data for a cover letter."""
    
    meta: CoverLetterMeta = Field(default_factory=CoverLetterMeta)
    content: CoverLetterContent = Field(default_factory=CoverLetterContent)


# ============================================
# Design Tokens (Shared with Resume system)
# ============================================

class CoverLetterDesignTokens(BaseModel):
    """Design customization tokens."""
    
    font_family: str = Field(default="Inter", description="Font: Inter, Roboto, Georgia")
    spacing: str = Field(default="comfortable", description="Spacing: compact, comfortable")
    accent_color: str = Field(default="neutral", description="Accent: neutral, blue, green")


# ============================================
# API Request/Response Schemas
# ============================================

class CoverLetterCreate(BaseModel):
    """Create a new cover letter."""
    
    title: str = Field(default="Untitled Cover Letter", max_length=255)
    application_id: Optional[int] = Field(default=None, description="Link to job application")
    template_slug: str = Field(default="formal")
    design_tokens: Optional[CoverLetterDesignTokens] = None
    content: Optional[CoverLetterStructuredData] = None


class CoverLetterUpdate(BaseModel):
    """Update an existing cover letter."""
    
    title: Optional[str] = Field(default=None, max_length=255)
    application_id: Optional[int] = None
    template_slug: Optional[str] = None
    design_tokens: Optional[CoverLetterDesignTokens] = None
    content: Optional[CoverLetterStructuredData] = None


class CoverLetterResponse(BaseModel):
    """Cover letter response with all fields."""
    
    id: int
    user_id: int
    application_id: Optional[int] = None
    title: str
    template_slug: str
    design_tokens: Optional[dict] = None
    content: Optional[dict] = None
    is_template: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CoverLetterListResponse(BaseModel):
    """Minimal cover letter info for lists."""
    
    id: int
    title: str
    template_slug: str
    application_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# Preview & Export Schemas
# ============================================

class CoverLetterPreviewRequest(BaseModel):
    """Request to preview a cover letter."""
    
    template_slug: Optional[str] = None
    design_tokens: Optional[CoverLetterDesignTokens] = None


class CoverLetterExportRequest(BaseModel):
    """Request to export a cover letter."""
    
    format: str = Field(default="pdf", description="Export format: pdf, docx")
    template_slug: Optional[str] = None
    design_tokens: Optional[CoverLetterDesignTokens] = None


# ============================================
# AI Generation Schemas
# ============================================

class CoverLetterGenerateRequest(BaseModel):
    """Request to generate a cover letter with AI."""
    
    job_title: str
    company_name: str
    job_description: Optional[str] = None
    resume_id: Optional[int] = Field(default=None, description="Use resume data for personalization")
    tone: str = Field(default="professional")
    emphasis: List[str] = Field(default_factory=list, description="Skills/experiences to emphasize")


class CoverLetterSuggestionRequest(BaseModel):
    """Request AI suggestions for a specific section."""
    
    section: str = Field(description="Section to improve: opening, body, closing")
    current_content: str = Field(description="Current content of the section")
    job_context: Optional[str] = Field(default=None, description="Job description for context")
