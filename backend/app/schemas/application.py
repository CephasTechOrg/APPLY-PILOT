from datetime import datetime
from typing import Literal, Optional, Union

from pydantic import BaseModel, field_validator

ApplicationStatus = Literal["saved", "applied", "interview", "offer", "rejected"]


class ApplicationBase(BaseModel):
    company: str
    job_title: str
    status: ApplicationStatus = "saved"
    location: Optional[str] = None
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    recruiter_phone: Optional[str] = None
    applied_at: Optional[Union[datetime, str]] = None
    interview_date: Optional[Union[datetime, str]] = None
    follow_up_date: Optional[Union[datetime, str]] = None
    resume_id: Optional[int] = None

    @field_validator("company", "job_title")
    @classmethod
    def non_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Field cannot be empty")
        return value

    @field_validator("applied_at", "interview_date", "follow_up_date", mode="before")
    @classmethod
    def parse_dates(cls, value: Optional[Union[str, datetime]]) -> Optional[datetime]:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            # Handle both ISO date (YYYY-MM-DD) and datetime (YYYY-MM-DDTHH:MM:SS) formats
            try:
                return datetime.fromisoformat(value)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid date format: {value}")
        return None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    job_title: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    location: Optional[str] = None
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    recruiter_name: Optional[str] = None
    recruiter_email: Optional[str] = None
    recruiter_phone: Optional[str] = None
    applied_at: Optional[Union[datetime, str]] = None
    interview_date: Optional[Union[datetime, str]] = None
    follow_up_date: Optional[Union[datetime, str]] = None
    resume_id: Optional[int] = None

    @field_validator("company", "job_title")
    @classmethod
    def non_empty(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Field cannot be empty")
        return value

    @field_validator("applied_at", "interview_date", "follow_up_date", mode="before")
    @classmethod
    def parse_dates(cls, value: Optional[Union[str, datetime]]) -> Optional[datetime]:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value)
            except (ValueError, TypeError):
                raise ValueError(f"Invalid date format: {value}")
        return None


class ApplicationResponse(ApplicationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ResumeRef(BaseModel):
    id: int
    title: str
    file_name: str
    is_primary: bool

    class Config:
        from_attributes = True


class ApplicationResponseWithResume(ApplicationResponse):
    resume: Optional[ResumeRef] = None


class ApplicationEventResponse(BaseModel):
    id: int
    application_id: int
    user_id: int
    old_status: Optional[ApplicationStatus] = None
    new_status: ApplicationStatus
    changed_at: datetime

    class Config:
        from_attributes = True
