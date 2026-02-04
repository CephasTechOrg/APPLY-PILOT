from typing import List, Optional
import asyncio

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db, SessionLocal
from app.core.storage import StorageError, download_resume_file, resolve_resume_url, upload_resume_file
from app.models.resume import Resume
from app.models.resume_content import ExtractionStatus, ResumeContent
from app.models.user import User
from app.schemas.resume import ResumeResponse, ResumeUpdate
from app.services.extraction_service import extract_text, parse_resume_with_ai, basic_parse_resume, validate_resume_schema
from app.services.ai_service import _call_deepseek

router = APIRouter()

MAX_RESUME_SIZE = 5 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _auto_extract_resume(resume_id: int, use_ai: bool = True):
	"""
	Automatically extract and parse resume content in background.
	Uses its own database session to avoid threading issues.
	"""
	db = SessionLocal()
	
	try:
		resume = db.query(Resume).filter(Resume.id == resume_id).first()
		if not resume:
			return
		
		# Create content record
		content = ResumeContent(
			resume_id=resume_id,
			extraction_status=ExtractionStatus.PROCESSING.value
		)
		db.add(content)
		db.commit()
		
		try:
			# Download and extract text
			file_bytes = download_resume_file(resume.storage_path)
			raw_text = extract_text(file_bytes, resume.content_type)
			
			if not raw_text.strip():
				raise ValueError("No text could be extracted from the resume")
			
			# Parse with AI or basic parser
			if use_ai:
				loop = asyncio.new_event_loop()
				asyncio.set_event_loop(loop)
				try:
					parsed_data = loop.run_until_complete(parse_resume_with_ai(raw_text, _call_deepseek))
				finally:
					loop.close()
			else:
				parsed_data = basic_parse_resume(raw_text)
			
			# Validate schema
			is_valid, error = validate_resume_schema(parsed_data)
			if not is_valid:
				content.extraction_status = ExtractionStatus.FAILED.value
				content.extraction_error = f"Schema validation failed: {error}"
				db.commit()
				return
			
			# Save parsed data
			content.structured_data = parsed_data
			content.extraction_status = ExtractionStatus.COMPLETED.value
			content.extraction_error = None
			
			# Extract metadata
			meta = parsed_data.get("meta", {})
			content.purpose = meta.get("purpose")
			content.industry = meta.get("industry")
			content.language = meta.get("language", "en")
			content.tone = meta.get("tone", "professional")
			
			db.commit()
			
		except Exception as e:
			content.extraction_status = ExtractionStatus.FAILED.value
			content.extraction_error = str(e)
			db.commit()
	finally:
		db.close()


@router.get("", response_model=List[ResumeResponse])
async def list_resumes(
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	resumes = (
		db.query(Resume)
		.filter(Resume.user_id == current_user.id)
		.order_by(Resume.created_at.desc())
		.all()
	)
	for resume in resumes:
		resume.file_url = resolve_resume_url(resume.storage_path)
	return resumes


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
	resume_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	resume = (
		db.query(Resume)
		.filter(Resume.id == resume_id, Resume.user_id == current_user.id)
		.first()
	)
	if not resume:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
	resume.file_url = resolve_resume_url(resume.storage_path)
	return resume


@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
	background_tasks: BackgroundTasks,
	file: UploadFile = File(...),
	title: Optional[str] = Form(None),
	is_primary: bool = Form(False),
	auto_extract: bool = Form(True),
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	if not file.content_type or file.content_type not in ALLOWED_CONTENT_TYPES:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid resume file type.")

	content = await file.read()
	if len(content) > MAX_RESUME_SIZE:
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="Resume must be smaller than 5MB.",
		)

	try:
		object_path, signed_url = upload_resume_file(
			content,
			file.content_type,
			file.filename,
			current_user.id,
		)
	except StorageError as exc:
		raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

	resume_title = title.strip() if title and title.strip() else (file.filename or "Resume")

	if is_primary:
		db.query(Resume).filter(Resume.user_id == current_user.id).update({Resume.is_primary: False})

	resume = Resume(
		user_id=current_user.id,
		title=resume_title,
		file_name=file.filename or resume_title,
		storage_path=object_path,
		content_type=file.content_type,
		file_size=len(content),
		is_primary=is_primary,
	)
	db.add(resume)
	db.commit()
	db.refresh(resume)
	resume.file_url = signed_url
	
	# Automatically extract resume content in background
	if auto_extract:
		background_tasks.add_task(_auto_extract_resume, resume.id, True)
	
	return resume


@router.patch("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
	resume_id: int,
	payload: ResumeUpdate,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	resume = (
		db.query(Resume)
		.filter(Resume.id == resume_id, Resume.user_id == current_user.id)
		.first()
	)
	if not resume:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

	updates = payload.model_dump(exclude_unset=True)

	if updates.get("is_primary"):
		db.query(Resume).filter(Resume.user_id == current_user.id).update({Resume.is_primary: False})

	for key, value in updates.items():
		setattr(resume, key, value)

	db.commit()
	db.refresh(resume)
	resume.file_url = resolve_resume_url(resume.storage_path)
	return resume


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
	resume_id: int,
	current_user: User = Depends(get_current_user),
	db: Session = Depends(get_db),
):
	resume = (
		db.query(Resume)
		.filter(Resume.id == resume_id, Resume.user_id == current_user.id)
		.first()
	)
	if not resume:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

	db.delete(resume)
	db.commit()
	return None
