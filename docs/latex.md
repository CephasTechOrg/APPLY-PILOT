# LaTeX Resume & Letter Generation System

## Overview

This document defines the architecture, data flow, and design rules for generating resumes and letters (cover letters, statements, etc.) using **predefined LaTeX templates** and exporting them as **PDF documents**.

The core idea is simple and powerful:

> **LaTeX structure is fixed. User data is injected. AI assists, but never breaks structure.**

This system integrates seamlessly with the existing application tracker and AI layer, without requiring external APIs.

---

## Core Principles

1. **LaTeX as a Rendering Engine**
   - LaTeX templates define layout, spacing, typography, and margins
   - Templates are never modified dynamically

2. **Structured Data Injection**
   - User data is mapped into placeholders
   - No free-form layout generation

3. **PDF-First Output**
   - PDF is the primary export format
   - Word export is deferred to a later phase

4. **AI as an Intelligence Layer**
   - AI fills content
   - AI validates completeness
   - AI suggests improvements
   - AI does NOT alter LaTeX structure

---

## System Components

### 1. Template Repository

All LaTeX templates are stored internally.

```
/templates
  /resume
    modern.tex
    academic.tex
    internship.tex
  /letters
    cover_letter.tex
    statement.tex
```

Each template follows strict conventions.

---

### 2. Template Rules

Every LaTeX template MUST:

- Use predefined placeholders
- Avoid custom shell commands
- Avoid external file dependencies
- Compile independently

Example placeholder syntax:

```tex
{{full_name}}
{{email}}
{{experience_section}}
```

---

### 3. Data Schema

All user data is normalized into a structured schema before injection.

```json
{
  "profile": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": ""
  },
  "experience": [],
  "education": [],
  "projects": [],
  "skills": []
}
```

This schema is universal across templates.

---

### 4. AI Content Layer

The AI system:

- Accepts natural language input from the user
- Maps content into schema fields
- Rewrites text to match the document tone
- Ensures ATS-safe language

Example user input:

> "I worked at Google as a backend intern"

AI output:

```json
{
  "experience": [
    {
      "company": "Google",
      "role": "Backend Intern",
      "description": "Developed backend services..."
    }
  ]
}
```

---

## Resume Creation Flow

### Step 1: Template Selection

User selects:

- Resume type (internship, academic, industry)
- LaTeX template

---

### Step 2: Data Input

User can:

- Fill a form
- Paste resume text
- Talk to AI conversationally

All inputs are normalized into the schema.

---

### Step 3: LaTeX Injection

The system:

1. Loads selected LaTeX template
2. Replaces placeholders with schema data
3. Generates a final `.tex` file

The structure remains unchanged.

---

### Step 4: PDF Compilation

The system compiles LaTeX into PDF using a sandboxed environment.

Security rules:

- No shell escape
- Time-limited compilation
- Restricted file access

---

### Step 5: Download

User receives:

- PDF resume or letter

---

## Letters (Cover Letters & Statements)

Letters follow the same system as resumes.

Differences:

- Smaller schema
- Stronger tone control

Example schema:

```json
{
  "recipient": "",
  "organization": "",
  "body": "",
  "closing": ""
}
```

---

## Integration with Application Tracker

Each generated document is linked to:

- Job title
- Company
- Application status
- Deadlines

The system maintains version history:

```
Application
 ├── Resume v1
 ├── Resume v2 (Tailored)
 └── Cover Letter
```

---

## AI-Assisted Automation

Without email APIs, the system relies on:

- Manual status updates
- AI reminders
- AI follow-up suggestions
- Deadline tracking

AI acts as a **personal operations assistant**, not a background scraper.

---

## Why PDFs First

PDFs are:

- Deterministic
- ATS-safe
- Easy to compile
- Universally accepted

Word support is planned after HTML-based export is introduced.

---

## Non-Goals (Explicit)

The system will NOT:

- Generate random templates
- Modify LaTeX structure dynamically
- Scrape emails automatically
- Execute untrusted LaTeX code

---

## Roadmap

### Phase 1

- LaTeX templates
- Schema injection
- PDF export

### Phase 2

- Resume tailoring per job
- Letter variations
- AI scoring

### Phase 3

- HTML canonical format
- Word export
- Advanced analytics

---

## Final Philosophy

This system prioritizes:

- Predictability over randomness
- Structure over creativity
- Intelligence over automation

**AI enhances the system — it does not control it.**
