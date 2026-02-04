from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


class ResumeBase(BaseModel):
    title: Optional[str] = None
    is_primary: Optional[bool] = False

    @field_validator("title")
    @classmethod
    def non_empty_title(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and not value.strip():
            raise ValueError("Title cannot be empty")
        return value


class ResumeUpdate(ResumeBase):
    pass


class ResumeResponse(BaseModel):
    id: int
    user_id: int
    title: str
    file_name: str
    content_type: str
    file_size: int
    is_primary: bool
    storage_path: str
    file_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
