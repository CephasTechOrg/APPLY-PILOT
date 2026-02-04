from fastapi import APIRouter
from app.api import auth, dashboard, applications, profile, resumes, ai, notifications, templates, resume_content, cover_letters, events

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
router.include_router(applications.router, prefix="/applications", tags=["Applications"])
router.include_router(events.router, tags=["Application Events"])
router.include_router(profile.router, prefix="/profile", tags=["Profile"])
router.include_router(resumes.router, prefix="/resumes", tags=["Resumes"])
router.include_router(resume_content.router, prefix="/resumes", tags=["Resume Content"])
router.include_router(templates.router, prefix="/templates", tags=["Templates"])
router.include_router(ai.router, prefix="/ai", tags=["AI"])
router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
router.include_router(cover_letters.router, tags=["Cover Letters"])
