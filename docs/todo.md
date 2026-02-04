ApplyPilot - Project Roadmap & TODO

WHAT "TRACKING" MEANS IN APPLYPILOT

1. USER CREATES AN APPLICATION RECORD
   When the user finds a job, they add it to ApplyPilot with:
   - Job title
   - Company
   - Job link
   - Job description (paste or optional)
   - Status (Saved/Applied/Interview/Offer/Rejected)
   - Follow-up date
   - Notes

   Backend stores this in Postgres (applications table).

2. STATUS UPDATES BECOME THE "TRACKER"
   Each time the user progresses, they update the status:
   - Saved → Applied
   - Applied → Interview
   - Interview → Offer / Rejected

   Every change updates the application row and creates a timeline entry.
   Track via application_events table with:
   - old_status
   - new_status
   - time changed

3. FOLLOW-UPS AND REMINDERS (SMART NUDGING)
   - When status = Applied, system auto-suggests follow-up (7 days later)
   - Daily background job checks:
     - "Any follow-ups due today?"
     - "Any applications sitting too long without update?"
   - Creates in-app notifications + email reminders (SendGrid)

4. DASHBOARD PULLS TRACKING DATA
   Stats are queries on applications + events tables:
   - Applications this week = count recent created/updated
   - Interviews scheduled = count where status = 'interview'
   - Offers = count where status = 'offer'
   - Pipeline breakdown = counts per status
   - Upcoming follow-ups = where follow_up_date is near today
   - Recent activity = latest events + AI events

IMPORTANT: NO AUTO-APPLY (MVP)
✗ Does NOT log into LinkedIn/Indeed and auto-apply
✓ DOES help generate AI resume/cover letter
✓ DOES track what you applied to
✓ DOES remind you when to follow up

================================================================================
COMPLETED (✅ DONE)
================================================================================

BACKEND ✅
✅ FastAPI bootstrap with CORS, lifespan, health endpoints
✅ PostgreSQL + SQLAlchemy setup
✅ Alembic migrations for core tables
✅ Auth: register/login/refresh endpoints
✅ Email verification flow (code + SendGrid)
✅ Password reset flow (request + reset with code)
✅ Profile persistence (profiles table + /api/profile/me + Supabase avatar upload)
✅ Profile fields expanded (education, certifications, work authorization, etc.)
✅ Bcrypt password hashing
✅ JWT tokens (access + refresh)
✅ Auth dependency (get_current_user)
✅ Application model + schemas
✅ Application CRUD API (/api/applications)
✅ Application events model + events API
✅ Dashboard stats endpoint (/api/dashboard/stats)
✅ SendGrid email integration
✅ Supabase image storage and signed URL generation fixed (avatar displays on sidebar, profile, etc.)
✅ Resume model + schema
✅ Resume upload endpoint with file validation
✅ Resume storage integration (Supabase)
✅ Resume CRUD endpoints
✅ Resume list + upload UI
✅ Application ↔ Resume linkage (resume_id)
✅ AI Service integration (AIRequest logging + quota + DeepSeek integration)
✅ AI Tools UI (Tailor Resume, Cover Letter, ATS Checklist)

=========================================================================

FRONTEND ✅
✅ Next.js 14 + TailwindCSS scaffolding
✅ Layout components (AppShell, Header, Sidebar)
✅ Material Symbols icons configured
✅ Auth flow wired (sign-up, verify, sign-in, logout)
✅ Profile page + sidebar link with persisted profile data
✅ Profile UI expanded with company-style fields
✅ API client layer (axios + auth interceptor)
✅ Dashboard connected to API with loading + retry
✅ Applications list connected to API
✅ Applications detail connected to API
✅ Timeline shows real application events
✅ Timeline refresh action with icon
✅ Status filter on applications list
✅ Create Application UI (modal + POST /api/applications)
✅ Edit/Delete Application UI

================================================================================
REMAINING (❌ NOT DONE YET)
================================================================================

BACKEND - HIGH PRIORITY
❌ [3] Resume parsing (optional) - Text extraction from PDF/DOCX - Structured parsing for skills/experience

❌ [4] AI configuration (production) - Add DEEPSEEK_API_KEY to backend .env - Confirm AI quota values for production

❌ [5] Notifications system - Notification model (in-app, email, status) - Notification endpoints (GET, POST, mark-read) - Scheduler for follow-up reminders - Celery/Redis background job runner

BACKEND - MEDIUM PRIORITY
❌ [7] Advanced application features - Richer filtering/search on applications - Salary range parsing - Application export (CSV) - Bulk status updates

BACKEND - TESTING
❌ [9] Unit & integration tests - test_auth.py - register, login, refresh - test_applications.py - CRUD + auth - test_dashboard.py - stats queries - CI-ready test setup

FRONTEND - MEDIUM PRIORITY
❌ [16] Resume upload polish - Drag-drop support - Preview/extraction display

INFRASTRUCTURE - MEDIUM/LOW PRIORITY
❌ [18] Background jobs - Redis + Celery setup - Daily reminder scheduler - Email notification worker

❌ [19] Production hardening - Rate limiting (FastAPI SlowAPI) - Malware file scanning - Stricter CORS - Structured logging - Environment-specific config

❌ [20] Database optimization - Indexes on frequently queried fields - Query profiling - Connection pooling tuning

================================================================================
RECOMMENDED NEXT STEP (ONE AT A TIME)
================================================================================

Next: [5] Notifications system (in-app + email reminders) 1. Notification model + endpoints 2. Scheduler + worker for follow-ups 3. Production hardening (#19)
