# ApplyPilot

AI-powered job application tracking and optimization platform.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m alembic upgrade heads
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Features

- **Application Tracking** - Track job applications with status, interviews, and follow-ups
- **Resume Management** - Upload, extract, and manage multiple resume versions
- **Email Parser** - Extract deadlines and key details from recruitment emails
- **Cover Letters** - Create personalized cover letters for applications
- **AI Tools** - Resume tailoring, cover letter generation, ATS optimization
- **Dashboard** - Real-time overview of applications and upcoming deadlines
- **Notifications** - Stay updated on application status changes

## Tech Stack

- **Frontend** - Next.js 14, React 18, TailwindCSS, TypeScript
- **Backend** - FastAPI, SQLAlchemy, PostgreSQL, Alembic
- **AI** - Deepseek API for text extraction and parsing

## Development

All API endpoints are authenticated. Sign up/login to access the dashboard.

Database migrations are managed with Alembic - always run `alembic upgrade heads` after pulling changes.
