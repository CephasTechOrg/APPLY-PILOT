from datetime import datetime
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.models.notification import Notification


def list_notifications(
	db: Session,
	user_id: int,
	unread_only: bool = False,
	limit: int = 50,
	offset: int = 0,
) -> Tuple[list[Notification], int]:
	query = db.query(Notification).filter(Notification.user_id == user_id)
	if unread_only:
		query = query.filter(Notification.is_read.is_(False))

	total = query.count()
	items = (
		query.order_by(Notification.created_at.desc())
		.offset(offset)
		.limit(limit)
		.all()
	)
	return items, total


def create_notification(
	db: Session,
	user_id: int,
	title: str,
	message: str,
	category: str = "general",
	action_url: Optional[str] = None,
) -> Notification:
	notification = Notification(
		user_id=user_id,
		title=title,
		message=message,
		category=category,
		action_url=action_url,
	)
	db.add(notification)
	db.commit()
	db.refresh(notification)
	return notification


def mark_notification_read(db: Session, notification: Notification) -> Notification:
	if not notification.is_read:
		notification.is_read = True
		notification.read_at = datetime.utcnow()
		db.commit()
		db.refresh(notification)
	return notification


def mark_all_read(db: Session, user_id: int) -> int:
	updated = (
		db.query(Notification)
		.filter(Notification.user_id == user_id, Notification.is_read.is_(False))
		.update({"is_read": True, "read_at": datetime.utcnow()})
	)
	db.commit()
	return updated
