from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.application import Application
from app.models.application_event import ApplicationEvent
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationEventResponse,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.services.application_service import (
    notify_application_status_change,
    suggest_follow_up_date,
)

router = APIRouter()


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    application_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    app_data = application_in.model_dump()
    
    # Auto-suggest follow-up date if not provided and status is 'applied'
    if not app_data.get("follow_up_date") and app_data.get("status") == "applied":
        app_data["follow_up_date"] = suggest_follow_up_date(
            status=app_data["status"],
            applied_at=app_data.get("applied_at"),
        )
    
    application = Application(
        user_id=current_user.id,
        **app_data
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # Create initial status event
    event = ApplicationEvent(
        application_id=application.id,
        user_id=current_user.id,
        old_status=None,
        new_status=application.status,
    )
    db.add(event)
    
    # Notify for initial status (e.g., "applied")
    if application.status in ["applied", "interview"]:
        notify_application_status_change(
            db=db,
            user_id=current_user.id,
            application=application,
            old_status=None,
        )
    
    db.commit()
    return application


@router.get("", response_model=List[ApplicationResponse])
async def list_applications(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Application).filter(Application.user_id == current_user.id)
    if status:
        query = query.filter(Application.status == status)
    applications = (
        query.order_by(Application.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return applications


@router.get("/{application_id}", response_model=ApplicationResponse)
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    return application


@router.patch("/{application_id}", response_model=ApplicationResponse)
async def update_application(
    application_id: int,
    application_in: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    update_data = application_in.model_dump(exclude_unset=True)
    old_status = application.status
    for field, value in update_data.items():
        setattr(application, field, value)

    if "status" in update_data and update_data["status"] != old_status:
        event = ApplicationEvent(
            application_id=application.id,
            user_id=current_user.id,
            old_status=old_status,
            new_status=update_data["status"],
        )
        db.add(event)
        notify_application_status_change(
            db=db,
            user_id=current_user.id,
            application=application,
            old_status=old_status,
        )

    db.commit()
    db.refresh(application)
    return application


@router.get("/{application_id}/events", response_model=List[ApplicationEventResponse])
async def list_application_events(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    events = (
        db.query(ApplicationEvent)
        .filter(ApplicationEvent.application_id == application_id, ApplicationEvent.user_id == current_user.id)
        .order_by(ApplicationEvent.changed_at.desc())
        .all()
    )
    return events


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    db.delete(application)
    db.commit()
    return None
