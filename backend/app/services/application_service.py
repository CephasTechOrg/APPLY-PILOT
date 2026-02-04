from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session

from app.models.application import Application
from app.services.notification_service import create_notification


# Default follow-up period in days after applying
DEFAULT_FOLLOW_UP_DAYS = 7


def suggest_follow_up_date(status: str, applied_at: Optional[datetime] = None) -> Optional[datetime]:
    """
    Auto-suggest a follow-up date based on application status.
    - For 'applied' status: 7 days from now or from applied_at date
    - For other statuses: None (no auto-suggestion)
    """
    if status != "applied":
        return None
    
    base_date = applied_at if applied_at else datetime.utcnow()
    return base_date + timedelta(days=DEFAULT_FOLLOW_UP_DAYS)


def notify_application_status_change(
    db: Session,
    user_id: int,
    application: Application,
    old_status: Optional[str],
) -> None:
    """Create notification when application status changes."""
    new_status = application.status

    notifications_map = {
        "applied": {
            "title": "Application submitted",
            "message": f"You applied to {application.job_title} at {application.company}. Follow-up reminder set.",
            "category": "general",
        },
        "interview": {
            "title": "Interview scheduled",
            "message": f"Interview confirmed for {application.job_title} at {application.company}. Good luck!",
            "category": "interview",
        },
        "offer": {
            "title": "🎉 Offer received!",
            "message": f"Congratulations! You received an offer from {application.company} for {application.job_title}!",
            "category": "general",
        },
        "rejected": {
            "title": "Application update",
            "message": f"Your application to {application.company} was not selected. Keep going!",
            "category": "general",
        },
    }

    if new_status in notifications_map:
        notif = notifications_map[new_status]
        create_notification(
            db=db,
            user_id=user_id,
            title=notif["title"],
            message=notif["message"],
            category=notif["category"],
            action_url=f"/Applications/{application.id}",
        )


def notify_follow_up_reminder(
    db: Session,
    user_id: int,
    application: Application,
) -> None:
    """Create follow-up reminder notification."""
    if application.follow_up_date:
        create_notification(
            db=db,
            user_id=user_id,
            title="Follow up due",
            message=f"Time to follow up on your application to {application.company} for {application.job_title}.",
            category="follow_up",
            action_url=f"/Applications/{application.id}",
        )
