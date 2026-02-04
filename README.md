ApplyPilot

Quick Start

Backend
1) Create/activate venv
2) Install deps:
   pip install -r backend/requirements.txt
3) Run migrations:
   cd backend
   alembic -c alembic.ini upgrade head
4) Start API:
   uvicorn app.main:app --reload

Frontend
1) Install deps:
   cd frontend
   npm install
2) Start dev server:
   npm run dev

Notes
- Migrations are now the source of truth; create_all is removed.
- Dashboard stats require a valid access token (sign in / verify first).
