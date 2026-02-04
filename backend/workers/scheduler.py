from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.core.database import SessionLocal
from app.models.application import Application
from app.models.notification import Notification
from app.services.notification_service import create_notification


def _notification_exists_today(db: Session, user_id: int, title_pattern: str, application_id: int) -> bool:
    """Check if a similar notification already exists today for this application."""
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.title.ilike(f"%{title_pattern}%"),
            Notification.action_url.contains(f"/Applications/{application_id}"),
            Notification.created_at >= today_start,
        )
        .first()
    )
    return existing is not None


def check_follow_up_reminders():
    """Check for applications with follow-up dates due today and create reminders."""
    db = SessionLocal()
    try:
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today + timedelta(days=1), datetime.min.time())
        
        # Find applications with follow-up date today (exclude closed statuses)
        applications_due = (
            db.query(Application)
            .filter(
                Application.follow_up_date.isnot(None),
                Application.follow_up_date >= today_start,
                Application.follow_up_date < today_end,
                Application.status.notin_(["rejected", "offer"]),
            )
            .all()
        )
        
        for app in applications_due:
            # Prevent duplicate notifications
            if not _notification_exists_today(db, app.user_id, "Follow up", app.id):
                create_notification(
                    db=db,
                    user_id=app.user_id,
                    title="Follow up due today",
                    message=f"Time to follow up with {app.company} about your {app.job_title} application.",
                    category="follow_up",
                    action_url=f"/Applications/{app.id}",
                )
        
        print(f"[Scheduler] Checked {len(applications_due)} follow-up reminders")
    except Exception as e:
        print(f"[Scheduler] Error in follow-up reminders: {e}")
    finally:
        db.close()


def check_interview_reminders():
    """Check for upcoming interviews (next 24 hours) and create reminders."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)
        
        # Find interviews in the next 24 hours
        interviews_upcoming = (
            db.query(Application)
            .filter(
                Application.interview_date.isnot(None),
                Application.interview_date >= now,
                Application.interview_date <= tomorrow,
                Application.status == "interview",
            )
            .all()
        )
        
        for app in interviews_upcoming:
            # Prevent duplicate notifications
            if not _notification_exists_today(db, app.user_id, "Interview", app.id):
                # Calculate hours until interview
                hours_until = int((app.interview_date - now).total_seconds() / 3600)
                time_text = f"in {hours_until} hours" if hours_until > 1 else "soon"
                
                create_notification(
                    db=db,
                    user_id=app.user_id,
                    title="Interview reminder",
                    message=f"Your interview with {app.company} for {app.job_title} is {time_text}.",
                    category="interview",
                    action_url=f"/Applications/{app.id}",
                )
        
        print(f"[Scheduler] Checked {len(interviews_upcoming)} interview reminders")
    except Exception as e:
        print(f"[Scheduler] Error in interview reminders: {e}")
    finally:
        db.close()


def check_stale_applications():
    """Check for applications that haven't been updated in a while."""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        stale_threshold = now - timedelta(days=14)  # 2 weeks without update
        
        # Find applications in "applied" status without updates for 2 weeks
        stale_apps = (
            db.query(Application)
            .filter(
                Application.status == "applied",
                Application.updated_at.isnot(None),
                Application.updated_at < stale_threshold,
            )
            .all()
        )
        
        for app in stale_apps:
            # Only notify once per week for stale applications
            week_ago = now - timedelta(days=7)
            recent_stale_notification = (
                db.query(Notification)
                .filter(
                    Notification.user_id == app.user_id,
                    Notification.title.ilike("%no update%"),
                    Notification.action_url.contains(f"/Applications/{app.id}"),
                    Notification.created_at >= week_ago,
                )
                .first()
            )
            
            if not recent_stale_notification:
                days_since_update = (now - app.updated_at).days
                create_notification(
                    db=db,
                    user_id=app.user_id,
                    title="Application needs update",
                    message=f"Your application to {app.company} has had no update for {days_since_update} days. Consider following up.",
                    category="follow_up",
                    action_url=f"/Applications/{app.id}",
                )
        
        print(f"[Scheduler] Checked {len(stale_apps)} stale applications")
    except Exception as e:
        print(f"[Scheduler] Error in stale applications check: {e}")
    finally:
        db.close()


def run_all_scheduled_tasks():
    """Run all scheduled notification tasks."""
    print(f"[Scheduler] Running scheduled tasks at {datetime.utcnow().isoformat()}")
    check_follow_up_reminders()
    check_interview_reminders()
    check_stale_applications()
