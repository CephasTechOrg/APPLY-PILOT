from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProfileBase(BaseModel):
    avatar_url: Optional[str] = None
    headline: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    time_zone: Optional[str] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    experience_level: Optional[str] = None
    preferred_role: Optional[str] = None
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None
    open_to_work: Optional[bool] = True
    education_level: Optional[str] = None
    school: Optional[str] = None
    graduation_year: Optional[int] = None
    certifications: Optional[str] = None
    work_authorization: Optional[str] = None
    visa_sponsorship_required: Optional[bool] = False
    years_experience: Optional[int] = None
    industry: Optional[str] = None
    languages: Optional[str] = None
    relocation_open: Optional[bool] = False
    remote_preference: Optional[str] = None
    salary_expectation: Optional[str] = None
    notice_period: Optional[str] = None


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
