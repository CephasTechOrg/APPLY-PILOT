"""Cover Letter API endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models import CoverLetter, User, Profile
from app.schemas.cover_letter import (
    CoverLetterCreate,
    CoverLetterUpdate,
    CoverLetterResponse,
    CoverLetterListResponse,
    CoverLetterPreviewRequest,
    CoverLetterExportRequest,
)
from app.services import cover_letter_service

router = APIRouter(prefix="/cover-letters", tags=["cover-letters"])


# ============================================
# Template endpoints
# ============================================

@router.get("/templates")
def list_cover_letter_templates():
    """List all available cover letter templates."""
    templates = cover_letter_service.get_available_templates()
    return templates


@router.get("/templates/{slug}")
def get_cover_letter_template(slug: str):
    """Get details of a specific template."""
    template = cover_letter_service.get_template(slug)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Don't send full HTML/CSS in list response
    return {
        "slug": template["slug"],
        "name": template["name"],
        "description": template["description"],
        "config": template["config"],
    }


# ============================================
# CRUD endpoints
# ============================================

@router.post("", response_model=CoverLetterResponse, status_code=status.HTTP_201_CREATED)
def create_cover_letter(
    data: CoverLetterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new cover letter."""
    cover_letter = CoverLetter(
        user_id=current_user.id,
        application_id=data.application_id,
        title=data.title,
        template_slug=data.template_slug,
        design_tokens=data.design_tokens.model_dump() if data.design_tokens else None,
        content=data.content.model_dump() if data.content else None,
    )
    
    db.add(cover_letter)
    db.commit()
    db.refresh(cover_letter)
    
    return cover_letter


@router.get("", response_model=list[CoverLetterListResponse])
def list_cover_letters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all cover letters for the current user."""
    cover_letters = (
        db.query(CoverLetter)
        .filter(CoverLetter.user_id == current_user.id)
        .order_by(CoverLetter.updated_at.desc())
        .all()
    )
    return cover_letters


@router.get("/{cover_letter_id}", response_model=CoverLetterResponse)
def get_cover_letter(
    cover_letter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific cover letter."""
    cover_letter = (
        db.query(CoverLetter)
        .filter(CoverLetter.id == cover_letter_id, CoverLetter.user_id == current_user.id)
        .first()
    )
    
    if not cover_letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    return cover_letter


@router.patch("/{cover_letter_id}", response_model=CoverLetterResponse)
def update_cover_letter(
    cover_letter_id: int,
    data: CoverLetterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a cover letter."""
    cover_letter = (
        db.query(CoverLetter)
        .filter(CoverLetter.id == cover_letter_id, CoverLetter.user_id == current_user.id)
        .first()
    )
    
    if not cover_letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    # Update fields
    if data.title is not None:
        cover_letter.title = data.title
    if data.application_id is not None:
        cover_letter.application_id = data.application_id
    if data.template_slug is not None:
        cover_letter.template_slug = data.template_slug
    if data.design_tokens is not None:
        cover_letter.design_tokens = data.design_tokens.model_dump()
    if data.content is not None:
        cover_letter.content = data.content.model_dump()
    
    db.commit()
    db.refresh(cover_letter)
    
    return cover_letter


@router.delete("/{cover_letter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cover_letter(
    cover_letter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a cover letter."""
    cover_letter = (
        db.query(CoverLetter)
        .filter(CoverLetter.id == cover_letter_id, CoverLetter.user_id == current_user.id)
        .first()
    )
    
    if not cover_letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    db.delete(cover_letter)
    db.commit()


# ============================================
# Preview & Export endpoints
# ============================================

def _get_user_profile(db: Session, user_id: int) -> Optional[dict]:
    """Get user profile data for template rendering."""
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    
    if not profile:
        return None
    
    return {
        "fullName": profile.full_name,
        "headline": profile.headline,
        "contact": {
            "email": profile.email,
            "phone": profile.phone,
            "location": profile.location,
            "linkedin": profile.linkedin_url,
            "portfolio": profile.portfolio_url,
        }
    }


@router.post("/{cover_letter_id}/preview")
def preview_cover_letter(
    cover_letter_id: int,
    request: CoverLetterPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate HTML preview of a cover letter."""
    cover_letter = (
        db.query(CoverLetter)
        .filter(CoverLetter.id == cover_letter_id, CoverLetter.user_id == current_user.id)
        .first()
    )
    
    if not cover_letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    if not cover_letter.content:
        raise HTTPException(status_code=400, detail="Cover letter has no content")
    
    # Get user profile for template
    profile = _get_user_profile(db, current_user.id)
    
    # Use request overrides or defaults from cover letter
    template_slug = request.template_slug or cover_letter.template_slug
    design_tokens = request.design_tokens.model_dump() if request.design_tokens else cover_letter.design_tokens
    
    try:
        html = cover_letter_service.render_cover_letter_html(
            content=cover_letter.content,
            template_slug=template_slug,
            design_tokens=design_tokens,
            profile=profile,
        )
        return {"html": html}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render preview: {str(e)}")


@router.post("/{cover_letter_id}/export/pdf")
def export_cover_letter_pdf(
    cover_letter_id: int,
    request: CoverLetterExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export cover letter as PDF."""
    cover_letter = (
        db.query(CoverLetter)
        .filter(CoverLetter.id == cover_letter_id, CoverLetter.user_id == current_user.id)
        .first()
    )
    
    if not cover_letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    if not cover_letter.content:
        raise HTTPException(status_code=400, detail="Cover letter has no content")
    
    # Get user profile
    profile = _get_user_profile(db, current_user.id)
    
    # Use request overrides or defaults
    template_slug = request.template_slug or cover_letter.template_slug
    design_tokens = request.design_tokens.model_dump() if request.design_tokens else cover_letter.design_tokens
    
    try:
        pdf_bytes = cover_letter_service.export_to_pdf(
            content=cover_letter.content,
            template_slug=template_slug,
            design_tokens=design_tokens,
            profile=profile,
        )
        
        filename = f"{cover_letter.title.replace(' ', '_')}.pdf"
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export PDF: {str(e)}")


@router.post("/{cover_letter_id}/export/docx")
def export_cover_letter_docx(
    cover_letter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export cover letter as DOCX."""
    cover_letter = (
        db.query(CoverLetter)
        .filter(CoverLetter.id == cover_letter_id, CoverLetter.user_id == current_user.id)
        .first()
    )
    
    if not cover_letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    
    if not cover_letter.content:
        raise HTTPException(status_code=400, detail="Cover letter has no content")
    
    # Get user profile
    profile = _get_user_profile(db, current_user.id)
    
    try:
        docx_bytes = cover_letter_service.export_to_docx(
            content=cover_letter.content,
            profile=profile,
        )
        
        filename = f"{cover_letter.title.replace(' ', '_')}.docx"
        
        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export DOCX: {str(e)}")
