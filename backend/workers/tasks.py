import asyncio
from app.workers.scheduler import check_follow_up_reminders, check_interview_reminders


async def run_scheduled_tasks():
    """Run all scheduled background tasks."""
    try:
        print("Running scheduled tasks...")
        check_follow_up_reminders()
        check_interview_reminders()
        print("Scheduled tasks completed.")
    except Exception as e:
        print(f"Error running scheduled tasks: {e}")


def start_background_tasks():
    """Start background task scheduler (can be run on application startup)."""
    # This could be expanded to use APScheduler or similar for true scheduling
    # For now, it's a simple helper
    asyncio.create_task(run_scheduled_tasks())
