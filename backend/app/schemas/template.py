"""
Pydantic schemas for resume templates.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# === Template Config Schema ===
class TemplateConfig(BaseModel):
    """Configuration for a template"""
    supported_purposes: List[str] = Field(default_factory=list, alias="supportedPurposes")
    default_tokens: Dict[str, str] = Field(default_factory=dict, alias="defaultTokens")

    class Config:
        populate_by_name = True


# === API Schemas ===
class TemplateCreate(BaseModel):
    """Request to create a new template"""
    slug: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    template_type: str = "resume"
    html_content: str
    css_content: str
    config: Optional[TemplateConfig] = None
    is_active: bool = True
    is_default: bool = False
    version: str = "1.0"


class TemplateUpdate(BaseModel):
    """Request to update a template"""
    name: Optional[str] = None
    description: Optional[str] = None
    html_content: Optional[str] = None
    css_content: Optional[str] = None
    config: Optional[TemplateConfig] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    version: Optional[str] = None


class TemplateResponse(BaseModel):
    """Response for a template"""
    id: int
    slug: str
    name: str
    description: Optional[str] = None
    template_type: str
    html_content: str
    css_content: str
    config: Optional[Dict[str, Any]] = None
    thumbnail_url: Optional[str] = None
    is_active: bool
    is_default: bool
    version: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TemplateListItem(BaseModel):
    """Lightweight template for listing"""
    id: int
    slug: str
    name: str
    description: Optional[str] = None
    template_type: str
    thumbnail_url: Optional[str] = None
    is_active: bool
    is_default: bool
    version: str

    class Config:
        from_attributes = True


# === Render Request/Response ===
class RenderResumeRequest(BaseModel):
    """Request to render a resume with a template"""
    template_slug: str
    design_tokens: Optional[Dict[str, str]] = None  # fontFamily, spacing, accentColor
    purpose: Optional[str] = None  # Override section order


class RenderResumeResponse(BaseModel):
    """Response with rendered HTML"""
    html: str
    template_slug: str
    tokens_used: Dict[str, str]


# === Export Request ===
class ExportResumeRequest(BaseModel):
    """Request to export resume as PDF or DOCX"""
    template_slug: str
    format: str = "pdf"  # pdf, docx
    design_tokens: Optional[Dict[str, str]] = None
    page_size: str = "A4"  # A4, letter
