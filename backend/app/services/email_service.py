"""Email service for managing user emails and extracting deadlines."""

import json
from datetime import datetime
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.email import Email
from app.models.user import User
from app.schemas.email import EmailCreate, EmailResponse, ExtractedDeadline
from app.services.ai_service import parse_email_content


class EmailService:
    """Service for handling email storage and AI parsing."""

    @staticmethod
    def create_email(
        user: User,
        email_in: EmailCreate,
        db: Session,
    ) -> EmailResponse:
        """
        Create and parse a new email entry.
        
        Uses AI to extract dates, deadlines, and key information.
        """
        # Parse email content using AI
        parsed, tokens = parse_email_content(
            email_content=email_in.email_content,
            additional_context=None,
            company=None,
            job_title=None,
        )
        
        # Extract deadlines and dates from parsed content
        key_deadlines: List[ExtractedDeadline] = []
        extracted_dates: List[ExtractedDeadline] = []
        
        for date_info in parsed.get("extracted_dates", []):
            try:
                date_str = date_info.get("date", "")
                time_str = date_info.get("time", "")
                
                if date_str:
                    # Parse datetime
                    if time_str:
                        dt = datetime.fromisoformat(f"{date_str}T{time_str}")
                    else:
                        dt = datetime.fromisoformat(date_str)
                    
                    deadline = ExtractedDeadline(
                        date=dt,
                        description=date_info.get("description", ""),
                        is_critical=date_info.get("is_deadline", False),
                    )
                    
                    # Add to appropriate list
                    if date_info.get("is_deadline", False):
                        key_deadlines.append(deadline)
                    extracted_dates.append(deadline)
            except (ValueError, TypeError):
                continue
        
        # Create email entry in database
        db_email = Email(
            user_id=user.id,
            email_content=email_in.email_content,
            parsed_summary=parsed.get("summary", "Email parsed successfully"),
            key_deadlines=json.dumps([d.model_dump() for d in key_deadlines]),
            extracted_dates=json.dumps([d.model_dump() for d in extracted_dates]),
            key_details=json.dumps(parsed.get("key_details", [])),
            ai_confidence=EmailService._get_confidence_level(parsed.get("confidence", 0.5)),
            source_company=parsed.get("source_company"),
        )
        
        db.add(db_email)
        db.commit()
        db.refresh(db_email)
        
        return EmailResponse.model_validate(db_email)

    @staticmethod
    def get_email(email_id: int, user_id: int, db: Session) -> Optional[EmailResponse]:
        """Get a single email by ID (verify user ownership)."""
        email = (
            db.query(Email)
            .filter(Email.id == email_id, Email.user_id == user_id)
            .first()
        )
        
        if not email:
            return None
        
        return EmailResponse.model_validate(email)

    @staticmethod
    def list_emails(user_id: int, db: Session, limit: int = 50, offset: int = 0) -> Tuple[List[Email], int]:
        """List emails for a user with pagination."""
        query = db.query(Email).filter(Email.user_id == user_id)
        total = query.count()
        
        emails = query.order_by(Email.created_at.desc()).offset(offset).limit(limit).all()
        
        return emails, total

    @staticmethod
    def delete_email(email_id: int, user_id: int, db: Session) -> bool:
        """Delete an email (verify user ownership)."""
        email = (
            db.query(Email)
            .filter(Email.id == email_id, Email.user_id == user_id)
            .first()
        )
        
        if not email:
            return False
        
        db.delete(email)
        db.commit()
        
        return True

    @staticmethod
    def get_upcoming_deadlines(user_id: int, db: Session, days_ahead: int = 30) -> List[dict]:
        """
        Get all upcoming deadlines from user's emails within the next N days.
        
        Returns list of deadlines with email context.
        """
        from datetime import timedelta
        
        emails = (
            db.query(Email)
            .filter(Email.user_id == user_id)
            .all()
        )
        
        upcoming = []
        now = datetime.utcnow()
        deadline_date = now + timedelta(days=days_ahead)
        
        for email in emails:
            if not email.key_deadlines:
                continue
            
            try:
                deadlines = json.loads(email.key_deadlines)
                for deadline in deadlines:
                    deadline_dt = datetime.fromisoformat(deadline["date"])
                    
                    if now <= deadline_dt <= deadline_date:
                        upcoming.append({
                            "email_id": email.id,
                            "deadline": deadline_dt,
                            "description": deadline["description"],
                            "is_critical": deadline.get("is_critical", False),
                            "days_until": (deadline_dt - now).days,
                            "source_company": email.source_company,
                        })
            except (json.JSONDecodeError, ValueError, KeyError):
                continue
        
        # Sort by days until deadline
        upcoming.sort(key=lambda x: x["days_until"])
        
        return upcoming

    @staticmethod
    def _get_confidence_level(confidence_score: float) -> str:
        """Convert confidence score to human-readable level."""
        if confidence_score >= 0.8:
            return "high"
        elif confidence_score >= 0.5:
            return "medium"
        else:
            return "low"
