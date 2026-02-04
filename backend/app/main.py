from contextlib import asynccontextmanager
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api import router as api_router
from app.core.rate_limiter import limiter


async def periodic_tasks():
    """Run scheduled tasks periodically (every hour)."""
    from app.workers.scheduler import run_all_scheduled_tasks
    while True:
        try:
            run_all_scheduled_tasks()
        except Exception as e:
            print(f"[Scheduler] Error in periodic tasks: {e}")
        await asyncio.sleep(3600)  # Run every hour


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    task = asyncio.create_task(periodic_tasks())
    yield
    # Shutdown
    print("Shutting down...")
    task.cancel()

app = FastAPI(
    title="ApplyPilot API",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS middleware - MUST be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["Content-Length", "Content-Range"],
    max_age=600,
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "ApplyPilot API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "applypilot-api"}
