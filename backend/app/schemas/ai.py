from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, field_validator

AIToolType = Literal["tailor_resume", "cover_letter", "ats_checklist"]


class AIBaseRequest(BaseModel):
    resume_text: Optional[str] = None
    job_description: str
    resume_id: Optional[int] = None
    instructions: Optional[str] = None

    @field_validator("job_description")
    @classmethod
    def non_empty_job_desc(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Job description cannot be empty")
        return value
    
    @field_validator("resume_text")
    @classmethod
    def validate_resume_text(cls, value: Optional[str]) -> Optional[str]:
        # Resume text is now optional - will be auto-fetched if not provided
        return value


class AITailorResumeRequest(AIBaseRequest):
    pass


class AICoverLetterRequest(AIBaseRequest):
    tone: Optional[str] = None


class AIATSChecklistRequest(AIBaseRequest):
    pass


class AIResponse(BaseModel):
    request_id: int
    tool: AIToolType
    content: str
    credits_left: int


class AIRequestResponse(BaseModel):
    id: int
    user_id: int
    tool: AIToolType
    status: str
    prompt: str
    response_text: Optional[str] = None
    error_message: Optional[str] = None
    tokens_used: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
