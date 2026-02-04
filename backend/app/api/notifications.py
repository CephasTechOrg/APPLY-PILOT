from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.rate_limiter import limiter
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
	NotificationCreate,
	NotificationListResponse,
	NotificationResponse,
	NotificationUnreadCount,
)
from app.services.notification_service import (
	create_notification,
	list_notifications,
	mark_all_read,
	mark_notification_read,
)

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
	unread_only: bool = False,
	limit: int = 50,
	offset: int = 0,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	items, total = list_notifications(
		db=db,
		user_id=current_user.id,
		unread_only=unread_only,
		limit=limit,
		offset=offset,
	)
	return {"items": items, "total": total}


@router.get("/unread-count", response_model=NotificationUnreadCount)
async def get_unread_count(
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	unread_count = (
		db.query(Notification)
		.filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
		.count()
	)
	return {"unread_count": unread_count}


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_notification_endpoint(
	payload: NotificationCreate,
	request: Request,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	return create_notification(
		db=db,
		user_id=current_user.id,
		title=payload.title,
		message=payload.message,
		category=payload.category,
		action_url=payload.action_url,
	)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
@limiter.limit("30/minute")
async def mark_read(
	notification_id: int,
	request: Request,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	notification = (
		db.query(Notification)
		.filter(Notification.id == notification_id, Notification.user_id == current_user.id)
		.first()
	)
	if not notification:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
	return mark_notification_read(db, notification)


@router.post("/read-all", response_model=NotificationUnreadCount)
@limiter.limit("10/minute")
async def mark_all_read_endpoint(
	request: Request,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	mark_all_read(db, current_user.id)
	return {"unread_count": 0}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def delete_notification(
	notification_id: int,
	request: Request,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	notification = (
		db.query(Notification)
		.filter(Notification.id == notification_id, Notification.user_id == current_user.id)
		.first()
	)
	if not notification:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
	db.delete(notification)
	db.commit()
	return None
