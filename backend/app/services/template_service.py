"""
Template rendering service - merges resume data with HTML templates.
"""
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.schemas.resume_content import PURPOSE_PRESETS, AVAILABLE_TOKENS


# Template directory
TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates" / "resume"


def get_template_env() -> Environment:
    """Create Jinja2 environment for template rendering."""
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(['html', 'xml']),
        trim_blocks=True,
        lstrip_blocks=True,
    )


def load_template_config(template_slug: str) -> Dict[str, Any]:
    """
    Load template configuration from config.json.
    
    Args:
        template_slug: Template folder name (modern, classic, minimal)
        
    Returns:
        Configuration dictionary
    """
    config_path = TEMPLATES_DIR / template_slug / "config.json"
    if not config_path.exists():
        return {}
    
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_template_css(template_slug: str) -> str:
    """
    Load template CSS content.
    
    Args:
        template_slug: Template folder name
        
    Returns:
        CSS content as string
    """
    css_path = TEMPLATES_DIR / template_slug / "styles.css"
    if not css_path.exists():
        return ""
    
    with open(css_path, 'r', encoding='utf-8') as f:
        return f.read()


def get_available_templates() -> list[Dict[str, Any]]:
    """
    Get list of available templates with their configs.
    
    Returns:
        List of template info dictionaries
    """
    templates = []
    
    if not TEMPLATES_DIR.exists():
        return templates
    
    for folder in TEMPLATES_DIR.iterdir():
        if folder.is_dir() and (folder / "index.html").exists():
            config = load_template_config(folder.name)
            templates.append({
                "slug": folder.name,
                "name": config.get("name", folder.name.title()),
                "description": config.get("description", ""),
                "type": config.get("type", "resume"),
                "supportedPurposes": config.get("supportedPurposes", []),
                "defaultTokens": config.get("defaultTokens", {}),
                "features": config.get("features", []),
            })
    
    return templates


def get_section_order(purpose: Optional[str] = None) -> list[str]:
    """
    Get section order based on purpose preset.
    
    Args:
        purpose: Resume purpose (software_engineer, academic, business)
        
    Returns:
        List of section names in display order
    """
    if purpose and purpose in PURPOSE_PRESETS:
        return PURPOSE_PRESETS[purpose].section_order
    
    # Default order
    return ["summary", "experience", "skills", "projects", "education", "certifications", "awards"]


def get_section_emphasis(purpose: Optional[str] = None) -> Dict[str, str]:
    """
    Get section emphasis levels based on purpose.
    
    Args:
        purpose: Resume purpose
        
    Returns:
        Dictionary of section -> emphasis level
    """
    if purpose and purpose in PURPOSE_PRESETS:
        preset = PURPOSE_PRESETS[purpose]
        return {
            "projects": preset.emphasis.projects or "normal",
            "skills": preset.emphasis.skills or "normal",
            "experience": preset.emphasis.experience or "normal",
            "education": preset.emphasis.education or "normal",
        }
    
    return {}


def resolve_design_tokens(
    tokens: Optional[Dict[str, str]] = None,
    template_slug: Optional[str] = None
) -> Dict[str, str]:
    """
    Resolve design tokens, falling back to template defaults then system defaults.
    
    Args:
        tokens: User-provided tokens
        template_slug: Template to get defaults from
        
    Returns:
        Resolved token dictionary
    """
    # System defaults
    result = {
        "fontFamily": "Inter",
        "spacing": "comfortable",
        "accentColor": "neutral"
    }
    
    # Template defaults
    if template_slug:
        config = load_template_config(template_slug)
        default_tokens = config.get("defaultTokens", {})
        result.update(default_tokens)
    
    # User overrides
    if tokens:
        for key, value in tokens.items():
            if key in AVAILABLE_TOKENS and value in AVAILABLE_TOKENS[key]:
                result[key] = value
    
    return result


def render_resume_html(
    template_slug: str,
    resume_data: Dict[str, Any],
    design_tokens: Optional[Dict[str, str]] = None,
    purpose: Optional[str] = None,
    inline_css: bool = True,
    profile: Optional[Dict[str, Any]] = None
) -> str:
    """
    Render resume data to HTML using specified template.
    
    Unified with cover letter rendering for consistency.
    
    Args:
        template_slug: Template to use (modern, classic, minimal)
        resume_data: Resume data in canonical schema
        design_tokens: Design token overrides
        purpose: Resume purpose for section ordering
        inline_css: Whether to inline CSS in the HTML
        profile: User profile data for rendering (name, email, phone, etc.)
        
    Returns:
        Rendered HTML string
    """
    env = get_template_env()
    
    # Load template
    try:
        template = env.get_template(f"{template_slug}/index.html")
    except Exception as e:
        raise ValueError(f"Template '{template_slug}' not found: {e}")
    
    # Resolve tokens
    tokens = resolve_design_tokens(design_tokens, template_slug)
    
    # Get section order and emphasis
    section_order = get_section_order(purpose or resume_data.get("meta", {}).get("purpose"))
    emphasis = get_section_emphasis(purpose or resume_data.get("meta", {}).get("purpose"))
    
    # Load template CSS
    css = load_template_css(template_slug)
    
    # Prepare template context - unified with cover letter schema
    context = {
        # Design tokens
        "font_family_token": tokens.get("fontFamily", "Inter"),
        "spacing_token": tokens.get("spacing", "comfortable"),
        "accent_color_token": tokens.get("accentColor", "neutral"),
        
        # CSS (inlined or for link)
        "css": css,
        "styles": css,  # Template variable name
        
        # Resume data
        "profile": profile or resume_data.get("profile", {}),
        "basics": resume_data.get("profile", {}),  # Old schema compatibility
        "sections": resume_data.get("sections", {}),
        "meta": resume_data.get("meta", {}),
        
        # Legacy JSON Resume fields for existing templates
        "education": resume_data.get("sections", {}).get("education", []),
        "work": resume_data.get("sections", {}).get("experience", []),
        "skills": resume_data.get("sections", {}).get("skills", []),
        "projects": resume_data.get("sections", {}).get("projects", []),
        "volunteer": resume_data.get("sections", {}).get("volunteer", []),
        "certifications": resume_data.get("sections", {}).get("certifications", []),
        "coursework": resume_data.get("sections", {}).get("coursework", []),
        
        # Layout control
        "section_order": section_order,
        "emphasis": emphasis,
    }
    
    # Render HTML
    html = template.render(**context)
    
    return html


def render_resume_for_export(
    template_slug: str,
    resume_data: Dict[str, Any],
    design_tokens: Optional[Dict[str, str]] = None,
    purpose: Optional[str] = None,
    page_size: str = "A4"
) -> str:
    """
    Render resume HTML optimized for PDF export.
    
    Args:
        template_slug: Template to use
        resume_data: Resume data
        design_tokens: Design tokens
        purpose: Resume purpose
        page_size: Page size (A4 or letter)
        
    Returns:
        Export-ready HTML
    """
    html = render_resume_html(
        template_slug=template_slug,
        resume_data=resume_data,
        design_tokens=design_tokens,
        purpose=purpose,
        inline_css=True
    )
    
    # Update page size if needed
    if page_size.lower() == "letter":
        html = html.replace("size: A4;", "size: letter;")
    
    return html
