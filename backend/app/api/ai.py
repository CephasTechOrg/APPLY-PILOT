from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.ai_request import AIRequest
from app.models.resume import Resume
from app.models.resume_content import ResumeContent
from app.models.user import User
from app.schemas.ai import (
	AIATSChecklistRequest,
	AICoverLetterRequest,
	AIResponse,
	AITailorResumeRequest,
)
from app.services.ai_service import (
	generate_ats_checklist,
	generate_cover_letter,
	generate_tailored_resume,
)

router = APIRouter()


def _get_resume_content(db: Session, user_id: int, resume_id: Optional[int] = None) -> str:
	"""
	Get resume content as formatted text.
	If resume_id is provided, use that resume. Otherwise, use primary resume.
	Prefers extracted structured data, falls back to raw file extraction.
	"""
	# Get the resume
	if resume_id:
		resume = db.query(Resume).filter(
			Resume.id == resume_id,
			Resume.user_id == user_id
		).first()
	else:
		# Use primary resume
		resume = db.query(Resume).filter(
			Resume.user_id == user_id,
			Resume.is_primary == True
		).first()
		
		# If no primary, use most recent
		if not resume:
			resume = db.query(Resume).filter(
				Resume.user_id == user_id
			).order_by(Resume.created_at.desc()).first()
	
	if not resume:
		raise HTTPException(
			status_code=status.HTTP_404_NOT_FOUND,
			detail="No resume found. Please upload a resume first."
		)
	
	# Try to get extracted content
	content = db.query(ResumeContent).filter(
		ResumeContent.resume_id == resume.id
	).first()
	
	if content and content.extraction_status == "completed" and content.structured_data:
		# Format structured data as text
		return _format_structured_resume(content.structured_data)
	
	# Fallback: extract from file directly
	from app.core.storage import download_resume_file
	from app.services.extraction_service import extract_text
	
	try:
		file_bytes = download_resume_file(resume.storage_path)
		return extract_text(file_bytes, resume.content_type)
	except Exception as e:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail=f"Failed to extract resume content: {str(e)}"
		)


def _format_structured_resume(data: dict) -> str:
	"""Format structured resume data as readable text."""
	lines = []
	
	# Profile
	profile = data.get("profile", {})
	if profile.get("fullName"):
		lines.append(profile["fullName"])
	if profile.get("headline"):
		lines.append(profile["headline"])
	
	contact = profile.get("contact", {})
	contact_parts = []
	if contact.get("email"):
		contact_parts.append(contact["email"])
	if contact.get("phone"):
		contact_parts.append(contact["phone"])
	if contact.get("location"):
		contact_parts.append(contact["location"])
	if contact_parts:
		lines.append(" | ".join(contact_parts))
	
	lines.append("")
	
	sections = data.get("sections", {})
	
	# Summary
	if sections.get("summary"):
		lines.append("SUMMARY")
		lines.append(sections["summary"])
		lines.append("")
	
	# Experience
	if sections.get("experience"):
		lines.append("EXPERIENCE")
		for exp in sections["experience"]:
			lines.append(f"{exp.get('role', 'Role')} at {exp.get('company', 'Company')}")
			if exp.get("startDate") or exp.get("endDate"):
				date_str = f"{exp.get('startDate', '')} - {exp.get('endDate', 'Present')}"
				lines.append(date_str)
			if exp.get("bullets"):
				for bullet in exp["bullets"]:
					lines.append(f"• {bullet}")
			lines.append("")
	
	# Projects
	if sections.get("projects"):
		lines.append("PROJECTS")
		for proj in sections["projects"]:
			lines.append(f"{proj.get('name', 'Project')}")
			if proj.get("description"):
				lines.append(proj["description"])
			if proj.get("technologies"):
				lines.append(f"Technologies: {', '.join(proj['technologies'])}")
			lines.append("")
	
	# Education
	if sections.get("education"):
		lines.append("EDUCATION")
		for edu in sections["education"]:
			lines.append(f"{edu.get('degree', 'Degree')} in {edu.get('field', 'Field')}")
			lines.append(edu.get("institution", "Institution"))
			if edu.get("startDate") or edu.get("endDate"):
				date_str = f"{edu.get('startDate', '')} - {edu.get('endDate', '')}"
				lines.append(date_str)
			lines.append("")
	
	# Skills
	if sections.get("skills"):
		lines.append("SKILLS")
		lines.append(", ".join(sections["skills"]))
		lines.append("")
	
	# Certifications
	if sections.get("certifications"):
		lines.append("CERTIFICATIONS")
		for cert in sections["certifications"]:
			lines.append(f"{cert.get('name', 'Certification')} - {cert.get('issuer', '')}")
		lines.append("")
	
	return "\n".join(lines)


def _remaining_ai_quota(db: Session, user_id: int) -> int:
	since = datetime.utcnow() - timedelta(days=1)
	used = (
		db.query(AIRequest)
		.filter(AIRequest.user_id == user_id, AIRequest.created_at >= since)
		.count()
	)
	return max(0, settings.AI_DAILY_QUOTA - used)


def _enforce_quota(db: Session, user_id: int) -> int:
	remaining = _remaining_ai_quota(db, user_id)
	if remaining <= 0:
		raise HTTPException(
			status_code=status.HTTP_429_TOO_MANY_REQUESTS,
			detail="Daily AI quota exceeded",
		)
	return remaining


@router.post("/tailor-resume", response_model=AIResponse)
async def tailor_resume(
	payload: AITailorResumeRequest,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	_enforce_quota(db, current_user.id)
	
	# Auto-fetch resume content if not provided
	resume_text = payload.resume_text
	if not resume_text or not resume_text.strip():
		resume_text = _get_resume_content(db, current_user.id, payload.resume_id)
	
	prompt = "Tailor resume request"
	ai_request = AIRequest(
		user_id=current_user.id,
		tool="tailor_resume",
		status="processing",
		prompt=prompt,
		input_data=payload.model_dump(),
	)
	db.add(ai_request)
	db.commit()
	db.refresh(ai_request)

	try:
		content, tokens = generate_tailored_resume(
			resume_text, payload.job_description, payload.instructions
		)
		ai_request.status = "success"
		ai_request.response_text = content
		ai_request.tokens_used = tokens
		db.commit()
	except HTTPException as exc:
		ai_request.status = "error"
		ai_request.error_message = exc.detail
		db.commit()
		raise

	return {
		"request_id": ai_request.id,
		"tool": "tailor_resume",
		"content": content,
		"credits_left": _remaining_ai_quota(db, current_user.id),
	}


@router.post("/generate-cover-letter", response_model=AIResponse)
async def generate_cover_letter_endpoint(
	payload: AICoverLetterRequest,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	_enforce_quota(db, current_user.id)
	
	# Auto-fetch resume content if not provided
	resume_text = payload.resume_text
	if not resume_text or not resume_text.strip():
		resume_text = _get_resume_content(db, current_user.id, payload.resume_id)
	
	prompt = "Cover letter request"
	ai_request = AIRequest(
		user_id=current_user.id,
		tool="cover_letter",
		status="processing",
		prompt=prompt,
		input_data=payload.model_dump(),
	)
	db.add(ai_request)
	db.commit()
	db.refresh(ai_request)

	try:
		content, tokens = generate_cover_letter(
			resume_text,
			payload.job_description,
			payload.tone,
			payload.instructions,
		)
		ai_request.status = "success"
		ai_request.response_text = content
		ai_request.tokens_used = tokens
		db.commit()
	except HTTPException as exc:
		ai_request.status = "error"
		ai_request.error_message = exc.detail
		db.commit()
		raise

	return {
		"request_id": ai_request.id,
		"tool": "cover_letter",
		"content": content,
		"credits_left": _remaining_ai_quota(db, current_user.id),
	}


@router.post("/ats-checklist", response_model=AIResponse)
async def ats_checklist(
	payload: AIATSChecklistRequest,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	_enforce_quota(db, current_user.id)
	
	# Auto-fetch resume content if not provided
	resume_text = payload.resume_text
	if not resume_text or not resume_text.strip():
		resume_text = _get_resume_content(db, current_user.id, payload.resume_id)
	
	prompt = "ATS checklist request"
	ai_request = AIRequest(
		user_id=current_user.id,
		tool="ats_checklist",
		status="processing",
		prompt=prompt,
		input_data=payload.model_dump(),
	)
	db.add(ai_request)
	db.commit()
	db.refresh(ai_request)

	try:
		content, tokens = generate_ats_checklist(
			resume_text, payload.job_description, payload.instructions
		)
		ai_request.status = "success"
		ai_request.response_text = content
		ai_request.tokens_used = tokens
		db.commit()
	except HTTPException as exc:
		ai_request.status = "error"
		ai_request.error_message = exc.detail
		db.commit()
		raise

	return {
		"request_id": ai_request.id,
		"tool": "ats_checklist",
		"content": content,
		"credits_left": _remaining_ai_quota(db, current_user.id),
	}
