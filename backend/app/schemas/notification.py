from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

NotificationCategory = Literal["follow_up", "interview", "ai", "system", "general"]


class NotificationBase(BaseModel):
    title: str
    message: str
    category: NotificationCategory = "general"
    action_url: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int


class NotificationUnreadCount(BaseModel):
    unread_count: int
