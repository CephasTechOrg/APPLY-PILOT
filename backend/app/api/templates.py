"""
API endpoints for resume templates.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.resume_template import ResumeTemplate
from app.models.user import User
from app.schemas.template import (
    TemplateCreate,
    TemplateListItem,
    TemplateResponse,
    TemplateUpdate,
)
from app.services.template_service import get_available_templates

router = APIRouter()


@router.get("", response_model=List[TemplateListItem])
async def list_templates(
    template_type: str = "resume",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all available templates.
    Returns both database templates and filesystem templates.
    """
    # Get filesystem templates
    fs_templates = get_available_templates()
    
    # Get database templates
    db_templates = (
        db.query(ResumeTemplate)
        .filter(
            ResumeTemplate.is_active == True,
            ResumeTemplate.template_type == template_type
        )
        .all()
    )
    
    # Combine, preferring DB over filesystem for same slug
    db_slugs = {t.slug for t in db_templates}
    
    result = []
    
    # Add DB templates
    for t in db_templates:
        result.append(TemplateListItem(
            id=t.id,
            slug=t.slug,
            name=t.name,
            description=t.description,
            template_type=t.template_type,
            thumbnail_url=t.thumbnail_url,
            is_active=t.is_active,
            is_default=t.is_default,
            version=t.version or "1.0"
        ))
    
    # Add filesystem templates not in DB
    for ft in fs_templates:
        if ft["slug"] not in db_slugs and ft.get("type", "resume") == template_type:
            result.append(TemplateListItem(
                id=0,  # Filesystem templates have no DB id
                slug=ft["slug"],
                name=ft["name"],
                description=ft.get("description", ""),
                template_type=ft.get("type", "resume"),
                thumbnail_url=None,
                is_active=True,
                is_default=ft["slug"] == "modern",
                version="1.0"
            ))
    
    return result


@router.get("/{slug}", response_model=TemplateResponse)
async def get_template(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific template by slug.
    """
    # Try database first
    template = (
        db.query(ResumeTemplate)
        .filter(ResumeTemplate.slug == slug, ResumeTemplate.is_active == True)
        .first()
    )
    
    if template:
        return template
    
    # Try filesystem
    fs_templates = get_available_templates()
    for ft in fs_templates:
        if ft["slug"] == slug:
            from app.services.template_service import load_template_css, TEMPLATES_DIR
            
            # Load HTML content
            html_path = TEMPLATES_DIR / slug / "index.html"
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            css_content = load_template_css(slug)
            
            return TemplateResponse(
                id=0,
                slug=slug,
                name=ft["name"],
                description=ft.get("description", ""),
                template_type=ft.get("type", "resume"),
                html_content=html_content,
                css_content=css_content,
                config={
                    "supportedPurposes": ft.get("supportedPurposes", []),
                    "defaultTokens": ft.get("defaultTokens", {}),
                    "features": ft.get("features", []),
                },
                thumbnail_url=None,
                is_active=True,
                is_default=slug == "modern",
                version="1.0",
                created_at=None,
                updated_at=None
            )
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Template '{slug}' not found"
    )


@router.get("/{slug}/preview")
async def preview_template(
    slug: str,
    current_user: User = Depends(get_current_user),
):
    """
    Get a preview of a template with sample data.
    """
    from app.services.template_service import render_resume_html
    
    # Sample data for preview
    sample_data = {
        "meta": {
            "purpose": "software_engineer",
            "language": "en",
            "tone": "professional"
        },
        "profile": {
            "fullName": "Alex Johnson",
            "headline": "Senior Software Engineer",
            "contact": {
                "email": "alex@example.com",
                "phone": "+1 (555) 123-4567",
                "location": "San Francisco, CA",
                "linkedin": "linkedin.com/in/alexjohnson",
                "portfolio": "github.com/alexj"
            }
        },
        "sections": {
            "summary": "Experienced software engineer with 8+ years building scalable web applications. Passionate about clean code, mentoring, and delivering impactful products.",
            "experience": [
                {
                    "company": "TechCorp Inc.",
                    "role": "Senior Software Engineer",
                    "location": "San Francisco, CA",
                    "startDate": "Jan 2021",
                    "endDate": "Present",
                    "bullets": [
                        "Led development of microservices architecture serving 10M+ users",
                        "Reduced API latency by 40% through caching optimization",
                        "Mentored team of 5 junior developers"
                    ]
                },
                {
                    "company": "StartupXYZ",
                    "role": "Software Engineer",
                    "location": "Remote",
                    "startDate": "Jun 2018",
                    "endDate": "Dec 2020",
                    "bullets": [
                        "Built real-time collaboration features using WebSockets",
                        "Implemented CI/CD pipeline reducing deployment time by 60%"
                    ]
                }
            ],
            "projects": [
                {
                    "name": "Open Source CLI Tool",
                    "description": "Command-line tool for automating development workflows",
                    "technologies": ["Python", "Click", "Docker"]
                }
            ],
            "education": [
                {
                    "institution": "University of California, Berkeley",
                    "degree": "B.S.",
                    "field": "Computer Science",
                    "startDate": "2014",
                    "endDate": "2018"
                }
            ],
            "skills": ["Python", "TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker", "Kubernetes"],
            "certifications": [
                {
                    "name": "AWS Solutions Architect",
                    "issuer": "Amazon Web Services",
                    "date": "2023"
                }
            ],
            "awards": []
        }
    }
    
    try:
        html = render_resume_html(
            template_slug=slug,
            resume_data=sample_data,
            purpose="software_engineer"
        )
        return {"html": html, "template_slug": slug}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
