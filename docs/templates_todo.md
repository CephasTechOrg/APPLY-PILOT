# Resume & Cover Letter Template System — Implementation TODO

> Based on [templates.md](templates.md) blueprint. Check off items as completed.

---

## Phase 1: Text Extraction & Schema Foundation ✅ COMPLETE

### 1.1 Dependencies & Setup

- [x] Install `pdfplumber` for PDF text extraction
- [x] Install `python-docx` for DOCX text extraction
- [x] Install `weasyprint` for HTML → PDF export
- [x] Create `backend/templates/` directory structure

### 1.2 Resume Content Model

- [x] Create `ResumeContent` model (stores parsed JSON schema per resume)
  - `id`, `resume_id` (FK), `structured_data` (JSON), `extraction_status`, `created_at`, `updated_at`
- [x] Create Alembic migration for `resume_contents` table
- [x] Create Pydantic schemas for resume content

### 1.3 Text Extraction Service

- [x] Create `backend/app/services/extraction_service.py`
- [x] Implement `extract_text_from_pdf()` using pdfplumber
- [x] Implement `extract_text_from_docx()` using python-docx
- [x] Implement `parse_to_schema()` — converts raw text to canonical JSON schema
- [x] Add AI-assisted parsing for unstructured resumes (use DeepSeek)
- [x] Trigger extraction on resume upload (auto-trigger with redirect to builder)

### 1.4 Canonical Resume Schema

- [x] Create `backend/app/schemas/resume_content.py` with full schema:
  ```
  meta: { resumeId, purpose, industry, language, tone }
  profile: { fullName, headline, contact: {...} }
  sections: { summary, experience[], projects[], education[], skills[], certifications[], awards[] }
  ```
- [x] Add validation rules (required vs optional fields)
- [x] Create schema for purpose presets (software_engineer, academic, business)

---

## Phase 2: Template System ✅ COMPLETE

### 2.1 Template Model & Storage

- [x] Create `ResumeTemplate` model
  - `id`, `slug`, `name`, `type` (resume/cover_letter), `html_content`, `css_content`, `config` (JSON), `is_active`, `created_at`
- [x] Create Alembic migration for `resume_templates` table
- [x] Create Pydantic schemas for templates

### 2.2 Seed Templates

- [x] Create `modern` template (HTML + CSS)
- [x] Create `classic` template (HTML + CSS)
- [x] Create `minimal` template (HTML + CSS)
- [x] Add template config.json for each (supported purposes, default tokens)
- [x] Templates stored as files in `backend/templates/resume/` (loaded dynamically)

### 2.3 Design Token System

- [x] Define token schema:
  ```
  fontFamily: ["Inter", "Roboto", "Georgia"]
  spacing: ["compact", "comfortable"]
  accentColor: ["neutral", "blue", "green"]
  ```
- [x] Implement CSS variable injection based on tokens
- [x] Create token presets for quick selection

---

## Phase 3: HTML Rendering Engine ✅ COMPLETE

### 3.1 Template Renderer

- [x] Create `backend/app/services/template_service.py`
- [x] Implement `render_resume_html()` — merges schema + template + tokens
- [x] Use Jinja2 for HTML templating
- [x] Handle section ordering based on purpose preset
- [x] Handle emphasis levels (high/normal) for sections
- [x] Implement page break logic (CSS-based)

### 3.2 Preview API

- [x] `GET /templates` — list available templates
- [x] `GET /templates/{slug}` — get template details
- [x] `POST /resumes/{id}/preview` — render HTML preview with selected template + tokens
- [x] Return rendered HTML for iframe display

---

## Phase 4: Export Pipeline ✅ COMPLETE

### 4.1 PDF Export

- [x] Implement `export_to_pdf()` using WeasyPrint
- [x] Configure A4 and US Letter page sizes
- [x] Handle page margins and breaks
- [x] `POST /resumes/{id}/export/pdf` — download PDF

### 4.2 DOCX Export

- [x] Implement `export_to_docx()` using python-docx
- [x] Map HTML elements to Word styles:
  - `h1` → Heading 1
  - `p` → Paragraph
  - `ul/li` → Bullet list
- [x] `POST /resumes/{id}/export/docx` — download DOCX

### 4.3 Validation

- [x] Schema validation before export (block if required fields missing)
- [ ] Template PDF render test before release

---

## Phase 5: Cover Letter System ✅ COMPLETE

### 5.1 Cover Letter Model

- [x] Create `CoverLetter` model
  - `id`, `user_id`, `application_id` (optional FK), `template_slug`, `content` (JSON), `design_tokens`, `created_at`, `updated_at`
- [x] Create Alembic migration
- [x] Create Pydantic schemas

### 5.2 Cover Letter Schema

- [x] Implement canonical schema:
  ```
  meta: { tone, job_title, company_name, industry }
  content: { salutation, opening, body[], closing, signature, sender_name }
  ```

### 5.3 Cover Letter Templates

- [x] Create 3 cover letter templates (formal, modern, creative)
- [x] Reuse design token system from resumes

### 5.4 Cover Letter APIs

- [x] `POST /cover-letters` — create new cover letter
- [x] `GET /cover-letters` — list user's cover letters
- [x] `GET /cover-letters/{id}` — get single cover letter
- [x] `PATCH /cover-letters/{id}` — update cover letter
- [x] `DELETE /cover-letters/{id}` — delete cover letter
- [x] `POST /cover-letters/{id}/preview` — render preview
- [x] `POST /cover-letters/{id}/export/pdf` — download PDF
- [x] `POST /cover-letters/{id}/export/docx` — download DOCX

### 5.5 Cover Letter Frontend

- [x] Create `frontend/src/services/coverLetterService.ts`
- [x] Create `frontend/src/app/CoverLetters/page.tsx` — list page with create modal
- [x] Create `frontend/src/app/CoverLetters/[id]/edit/page.tsx` — full editor with:
  - Template selection
  - Design token controls
  - Section-by-section form
  - Live preview
  - Auto-save
  - PDF/DOCX export

---

## Phase 6: Frontend Integration ✅ COMPLETE

### 6.1 Template Gallery

- [x] Create `frontend/src/app/Resumes/templates/page.tsx`
- [x] Display template cards with thumbnail previews
- [x] Template selection flow

### 6.2 Resume Builder UI

- [x] Create `frontend/src/app/Resumes/[id]/edit/page.tsx`
- [x] Section-by-section form editor
- [x] Live preview panel (iframe with rendered HTML)
- [x] Auto-save structured data

### 6.3 Design Token Controls

- [x] Font family dropdown
- [x] Spacing toggle (compact/comfortable)
- [x] Accent color picker
- [x] Real-time preview updates

### 6.4 Export Controls

- [x] Download PDF button
- [x] Download DOCX button
- [x] Export validation feedback (missing required fields)

### 6.5 Resume Service Updates

- [x] Add `getResumeContent()` method
- [x] Add `updateResumeContent()` method
- [x] Add `previewResume()` method
- [x] Add `exportResumePdf()` method
- [x] Add `exportResumeDocx()` method

---

## Phase 7: AI Integration

### 7.1 Content Enhancement

- [ ] Add AI rewrite endpoint for individual sections
- [ ] Bullet point optimization (action verbs, metrics)
- [ ] Tone adjustment (professional, confident, creative)
- [ ] Summary generation from experience

### 7.2 Template Suggestions

- [ ] AI suggests template + tokens based on industry/purpose
- [ ] AI suggests section order based on job description

---

## Phase 8: Polish & Testing

### 8.1 Testing

- [ ] Unit tests for extraction service
- [ ] Unit tests for template renderer
- [ ] Unit tests for export pipeline
- [ ] Integration tests for full flow

### 8.2 Validation & Error Handling

- [ ] Graceful handling of malformed PDFs
- [ ] Fallback for extraction failures
- [ ] Export error messaging

### 8.3 Performance

- [ ] Cache rendered templates
- [ ] Optimize PDF generation speed
- [ ] Background job for large exports

---

## File Structure Reference

```
backend/
├── app/
│   ├── models/
│   │   ├── resume_content.py      # Parsed resume JSON
│   │   ├── resume_template.py     # Template definitions
│   │   └── cover_letter.py        # Cover letters
│   ├── schemas/
│   │   ├── resume_content.py      # Canonical schema
│   │   ├── template.py            # Template schemas
│   │   └── cover_letter.py        # Cover letter schemas
│   ├── services/
│   │   ├── extraction_service.py  # PDF/DOCX → JSON
│   │   └── template_service.py    # Render + Export
│   └── api/
│       ├── templates.py           # Template CRUD
│       └── exports.py             # PDF/DOCX exports
├── templates/
│   └── resume/
│       ├── modern/
│       │   ├── index.html
│       │   ├── styles.css
│       │   └── config.json
│       ├── classic/
│       └── minimal/
└── migrations/
    └── versions/
        ├── YYYYMMDD_resume_contents.py
        ├── YYYYMMDD_resume_templates.py
        └── YYYYMMDD_cover_letters.py

frontend/
└── src/
    ├── app/
    │   └── Resumes/
    │       ├── templates/page.tsx     # Template gallery
    │       └── [id]/
    │           └── edit/page.tsx      # Resume builder
    ├── components/
    │   └── resume/
    │       ├── ResumePreview.tsx      # Live preview iframe
    │       ├── SectionEditor.tsx      # Form per section
    │       └── TokenSelector.tsx      # Design controls
    └── services/
        └── templateService.ts         # Template API calls
```

---

## Priority Order

| Priority  | Phase   | Rationale                                           |
| --------- | ------- | --------------------------------------------------- |
| 🔴 High   | Phase 1 | Foundation — without extraction, no structured data |
| 🔴 High   | Phase 2 | Templates are the core feature                      |
| 🟡 Medium | Phase 3 | Rendering enables preview                           |
| 🟡 Medium | Phase 4 | Export is the final deliverable                     |
| 🟢 Lower  | Phase 5 | Cover letters can wait                              |
| 🟢 Lower  | Phase 6 | Frontend after backend is solid                     |
| 🔵 Later  | Phase 7 | AI enhancement is polish                            |
| 🔵 Later  | Phase 8 | Testing after MVP works                             |

---

## Current Status

**Phase 1: Not Started**

Next action: Install extraction dependencies and create ResumeContent model.
