from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from datetime import datetime, timedelta
from typing import List, Optional

from app.core.database import get_db
from app.models.application import Application
from app.models.application_event import ApplicationEvent
from app.models.ai_request import AIRequest
from app.models.notification import Notification
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics with real data."""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    
    # Applications this week (status = applied, created in last 7 days)
    apps_this_week = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.created_at >= week_ago,
        Application.status == "applied"
    ).count()
    
    # Interviews scheduled (current status = interview)
    interviews = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.status == "interview"
    ).count()
    
    # Offers received
    offers = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.status == "offer"
    ).count()
    
    # Pipeline breakdown
    pipeline = {}
    for status in ["saved", "applied", "interview", "offer", "rejected"]:
        count = db.query(Application).filter(
            Application.user_id == current_user.id,
            Application.status == status
        ).count()
        pipeline[status] = count
    
    # Upcoming follow-ups (next 7 days, ordered by date)
    upcoming = (
        db.query(Application)
        .filter(
            Application.user_id == current_user.id,
            Application.follow_up_date.isnot(None),
            Application.follow_up_date >= now,
            Application.follow_up_date <= now + timedelta(days=7),
            Application.status.notin_(["rejected", "offer"]),  # Exclude closed applications
        )
        .order_by(Application.follow_up_date.asc())
        .limit(5)
        .all()
    )

    # AI credits remaining (daily quota)
    ai_used = db.query(AIRequest).filter(
        AIRequest.user_id == current_user.id,
        AIRequest.created_at >= now - timedelta(days=1)
    ).count()
    ai_credits_left = max(0, settings.AI_DAILY_QUOTA - ai_used)
    
    return {
        "stats": {
            "applications_this_week": apps_this_week,
            "interviews_scheduled": interviews,
            "offers_received": offers,
            "ai_credits_left": ai_credits_left,
            "ai_daily_quota": settings.AI_DAILY_QUOTA,
        },
        "pipeline": pipeline,
        "upcoming_followups": [
            {
                "id": app.id,
                "company": app.company,
                "job_title": app.job_title,
                "follow_up_date": app.follow_up_date.isoformat() if app.follow_up_date else None,
                "status": app.status,
            }
            for app in upcoming
        ]
    }


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activity: application events + AI requests + notifications."""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    
    activities = []
    
    # Get recent application events (status changes)
    events = (
        db.query(ApplicationEvent)
        .join(Application, ApplicationEvent.application_id == Application.id)
        .filter(
            ApplicationEvent.user_id == current_user.id,
            ApplicationEvent.changed_at >= week_ago,
        )
        .order_by(ApplicationEvent.changed_at.desc())
        .limit(limit)
        .all()
    )
    
    for event in events:
        app = db.query(Application).filter(Application.id == event.application_id).first()
        if app:
            action = _get_event_action(event.old_status, event.new_status)
            activities.append({
                "id": f"event-{event.id}",
                "type": "application",
                "action": action,
                "company": app.company,
                "job_title": app.job_title,
                "timestamp": event.changed_at.isoformat(),
                "icon": _get_status_icon(event.new_status),
                "icon_color": _get_status_color(event.new_status),
                "application_id": app.id,
            })
    
    # Get recent AI requests
    ai_requests = (
        db.query(AIRequest)
        .filter(
            AIRequest.user_id == current_user.id,
            AIRequest.created_at >= week_ago,
            AIRequest.status == "success",
        )
        .order_by(AIRequest.created_at.desc())
        .limit(5)
        .all()
    )
    
    for req in ai_requests:
        tool_name = _get_ai_tool_name(req.tool)
        activities.append({
            "id": f"ai-{req.id}",
            "type": "ai",
            "action": f"Used {tool_name}",
            "company": "",
            "job_title": "",
            "timestamp": req.created_at.isoformat(),
            "icon": "auto_awesome",
            "icon_color": "text-primary bg-primary/10",
            "application_id": None,
        })
    
    # Sort all activities by timestamp descending
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"activities": activities[:limit]}


def _get_event_action(old_status: Optional[str], new_status: str) -> str:
    """Generate human-readable action text for status changes."""
    if old_status is None:
        return "Saved job at"
    
    actions = {
        "saved": "Saved job at",
        "applied": "Applied to",
        "interview": "Interview scheduled with",
        "offer": "Received offer from",
        "rejected": "Application closed at",
    }
    return actions.get(new_status, f"Updated status to {new_status} at")


def _get_status_icon(status: str) -> str:
    """Get Material Symbols icon for status."""
    icons = {
        "saved": "bookmark",
        "applied": "send",
        "interview": "event",
        "offer": "verified",
        "rejected": "close",
    }
    return icons.get(status, "circle")


def _get_status_color(status: str) -> str:
    """Get TailwindCSS color classes for status."""
    colors = {
        "saved": "text-gray-500 bg-gray-100 dark:bg-gray-800",
        "applied": "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
        "interview": "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
        "offer": "text-green-500 bg-green-50 dark:bg-green-900/20",
        "rejected": "text-red-500 bg-red-50 dark:bg-red-900/20",
    }
    return colors.get(status, "text-gray-500 bg-gray-100")


def _get_ai_tool_name(tool: str) -> str:
    """Get human-readable AI tool name."""
    names = {
        "tailor_resume": "Resume Tailor",
        "cover_letter": "Cover Letter Generator",
        "ats_checklist": "ATS Checker",
    }
    return names.get(tool, tool.replace("_", " ").title())
