"""
Pydantic schemas for resume content (canonical JSON schema).
Based on templates.md blueprint specification.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


# === Contact Information ===
class ContactInfo(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None


# === Profile Section ===
class ProfileSection(BaseModel):
    full_name: str = Field(..., alias="fullName")
    headline: Optional[str] = None
    contact: ContactInfo = Field(default_factory=ContactInfo)

    class Config:
        populate_by_name = True


# === Experience Entry ===
class ExperienceEntry(BaseModel):
    company: str
    title: Optional[str] = None  # Job title
    role: Optional[str] = None  # Alias for title (backwards compat)
    location: Optional[str] = None
    start_date: Optional[str] = Field(None, alias="startDate")
    end_date: Optional[str] = Field(None, alias="endDate")  # "Present" for current
    bullets: List[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True


# === Project Entry ===
class ProjectEntry(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    url: Optional[str] = None
    date: Optional[str] = None  # Project date/timeframe
    bullets: List[str] = Field(default_factory=list)  # Project achievements


# === Education Entry ===
class EducationEntry(BaseModel):
    institution: str
    degree: Optional[str] = None
    field: Optional[str] = None
    location: Optional[str] = None  # Added for Jake's template
    start_date: Optional[str] = Field(None, alias="startDate")
    end_date: Optional[str] = Field(None, alias="endDate")
    gpa: Optional[str] = None
    highlights: List[str] = Field(default_factory=list)  # Additional achievements

    class Config:
        populate_by_name = True


# === Activity/Leadership Entry ===
class ActivityEntry(BaseModel):
    organization: str
    role: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = Field(None, alias="startDate")
    end_date: Optional[str] = Field(None, alias="endDate")
    bullets: List[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True


# === Skill Entry (structured) ===
class SkillEntry(BaseModel):
    category: Optional[str] = None  # e.g., "Languages", "Developer Tools"
    items: List[str] = Field(default_factory=list)
    name: Optional[str] = None  # For simple skills without category
    level: Optional[str] = None  # Proficiency level


# === Certification Entry ===
class CertificationEntry(BaseModel):
    name: str
    issuer: Optional[str] = None
    date: Optional[str] = None
    url: Optional[str] = None


# === Award Entry ===
class AwardEntry(BaseModel):
    name: str
    issuer: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None


# === Sections Container ===
class ResumeSections(BaseModel):
    summary: Optional[str] = None
    experience: List[ExperienceEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    skills: Union[List[str], List[SkillEntry]] = Field(default_factory=list)  # Support both formats
    certifications: List[CertificationEntry] = Field(default_factory=list)
    awards: List[AwardEntry] = Field(default_factory=list)
    activities: List[ActivityEntry] = Field(default_factory=list)  # Leadership, clubs, etc.
    coursework: List[str] = Field(default_factory=list)  # Relevant coursework


# === Meta Information ===
class ResumeMeta(BaseModel):
    resume_id: Optional[int] = Field(None, alias="resumeId")
    purpose: Optional[str] = None  # software_engineer, academic, business
    industry: Optional[str] = None
    language: str = "en"
    tone: str = "professional"  # professional, confident, creative

    class Config:
        populate_by_name = True


# === Full Canonical Resume Schema ===
class CanonicalResumeSchema(BaseModel):
    """
    The canonical resume schema as defined in templates.md.
    This is the single source of truth for resume data.
    """
    meta: ResumeMeta = Field(default_factory=ResumeMeta)
    profile: ProfileSection
    sections: ResumeSections = Field(default_factory=ResumeSections)


# === Purpose Presets ===
class SectionEmphasis(BaseModel):
    """Emphasis levels for sections based on purpose"""
    projects: Optional[str] = None  # high, normal
    skills: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None


class PurposePreset(BaseModel):
    """Preset configuration for resume purpose"""
    section_order: List[str] = Field(alias="sectionOrder")
    emphasis: SectionEmphasis = Field(default_factory=SectionEmphasis)

    class Config:
        populate_by_name = True


# Purpose preset definitions
PURPOSE_PRESETS: Dict[str, PurposePreset] = {
    "software_engineer": PurposePreset(
        sectionOrder=["summary", "skills", "experience", "projects", "education"],
        emphasis=SectionEmphasis(projects="high", skills="high")
    ),
    "academic": PurposePreset(
        sectionOrder=["summary", "education", "experience", "publications", "awards"],
        emphasis=SectionEmphasis(education="high")
    ),
    "business": PurposePreset(
        sectionOrder=["summary", "experience", "skills", "education"],
        emphasis=SectionEmphasis(experience="high")
    ),
    # Student-focused presets (ideal for Jake's template)
    "student": PurposePreset(
        sectionOrder=["education", "coursework", "experience", "projects", "activities", "skills"],
        emphasis=SectionEmphasis(education="high", projects="high")
    ),
    "internship": PurposePreset(
        sectionOrder=["education", "skills", "projects", "experience", "activities"],
        emphasis=SectionEmphasis(projects="high", skills="high")
    ),
    "new_grad": PurposePreset(
        sectionOrder=["education", "experience", "projects", "skills", "activities", "awards"],
        emphasis=SectionEmphasis(experience="high", projects="high")
    ),
}


# === Design Tokens ===
class DesignTokens(BaseModel):
    """Design tokens for template customization"""
    font_family: str = Field(default="Inter", alias="fontFamily")
    spacing: str = "comfortable"  # compact, comfortable
    accent_color: str = Field(default="neutral", alias="accentColor")  # neutral, blue, green

    class Config:
        populate_by_name = True


AVAILABLE_TOKENS = {
    "fontFamily": ["Inter", "Roboto", "Georgia"],
    "spacing": ["compact", "comfortable"],
    "accentColor": ["neutral", "blue", "green"]
}


# === API Request/Response Schemas ===
class ResumeContentCreate(BaseModel):
    """Request to create/update resume content"""
    structured_data: CanonicalResumeSchema
    purpose: Optional[str] = None
    industry: Optional[str] = None
    language: str = "en"
    tone: str = "professional"


class ResumeContentUpdate(BaseModel):
    """Request to partially update resume content"""
    structured_data: Optional[Dict[str, Any]] = None
    purpose: Optional[str] = None
    industry: Optional[str] = None
    language: Optional[str] = None
    tone: Optional[str] = None


class ResumeContentResponse(BaseModel):
    """Response for resume content"""
    id: int
    resume_id: int
    structured_data: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None
    extraction_status: str
    extraction_error: Optional[str] = None
    purpose: Optional[str] = None
    industry: Optional[str] = None
    language: Optional[str] = None
    tone: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExtractResumeRequest(BaseModel):
    """Request to trigger resume extraction"""
    resume_id: int
    use_ai: bool = True  # Use AI for enhanced parsing


class ExtractResumeResponse(BaseModel):
    """Response after extraction is triggered"""
    resume_id: int
    status: str
    message: str
