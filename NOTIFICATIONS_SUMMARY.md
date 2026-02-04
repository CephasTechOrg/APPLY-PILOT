# Notifications System - Complete Implementation

## Status: ✅ COMPLETE

### What Was Built

#### 1. **Backend Notifications Infrastructure**

- **Model** ([backend/app/models/notification.py](backend/app/models/notification.py))
  - `id`, `user_id`, `title`, `message`, `category`, `action_url`
  - `is_read`, `read_at`, `created_at` timestamps
  - Indexed by `user_id`, `category`, `is_read` for efficient queries

- **API Endpoints** ([backend/app/api/notifications.py](backend/app/api/notifications.py))
  - `GET /notifications` - List all user notifications (paginated)
  - `GET /notifications/unread-count` - Get unread count
  - `POST /notifications` - Create notification (for manual creation)
  - `PATCH /notifications/{id}/read` - Mark single notification as read
  - `POST /notifications/read-all` - Mark all as read
  - `DELETE /notifications/{id}` - Delete notification
  - All endpoints rate-limited

- **Service Layer** ([backend/app/services/notification_service.py](backend/app/services/notification_service.py))
  - `create_notification()` - Create new notification
  - `list_notifications()` - Query with pagination and filtering
  - `mark_notification_read()` - Mark read with timestamp
  - `mark_all_read()` - Bulk mark all as read

#### 2. **Automatic Notifications from Application Events**

- **Application Service** ([backend/app/services/application_service.py](backend/app/services/application_service.py))
  - `notify_application_status_change()` - Triggered when status changes:
    - **"applied"** → "Application submitted" notification
    - **"interview"** → "Interview scheduled" notification
    - **"offer"** → "Offer received" notification
    - **"rejected"** → "Application rejected" notification
  - `notify_follow_up_reminder()` - For manual follow-up date notifications

- **Integration** ([backend/app/api/applications.py](backend/app/api/applications.py))
  - Hooks into `PATCH /applications/{id}` endpoint
  - Auto-creates notification when `status` field changes
  - Includes link to application in `action_url`

#### 3. **Seeded Welcome Notifications**

- **Registration Flow** ([backend/app/api/auth.py](backend/app/api/auth.py))
  - When new user registers, automatically created 3 welcome notifications:
    1. **"Welcome to ApplyPilot"** (system) → Links to Dashboard
    2. **"Upload your first resume"** (general) → Links to Resume upload
    3. **"Try AI tools"** (ai) → Links to AI Tools page

#### 4. **Background Task Scheduler**

- **Scheduler** ([backend/workers/scheduler.py](backend/workers/scheduler.py))
  - `check_follow_up_reminders()` - Finds applications with follow-up due TODAY
  - `check_interview_reminders()` - Finds interviews in next 24 hours
  - Both create notifications automatically

- **Startup Integration** ([backend/app/main.py](backend/app/main.py))
  - Periodic task runs every **1 hour** on application startup
  - Runs as async background task in lifespan context
  - Gracefully cancels on shutdown

- **Database Migration** ([backend/migrations/versions/20260202_notifications.py](backend/migrations/versions/20260202_notifications.py))
  - Creates `notifications` table with proper indexes
  - Applied and verified ✅

#### 5. **Frontend Integration**

- **Types** ([frontend/src/types/notification.types.ts](frontend/src/types/notification.types.ts))
  - `NotificationItem`, `NotificationListResponse`, `NotificationUnreadCount`
  - Category types: `follow_up`, `interview`, `ai`, `system`, `general`

- **Service** ([frontend/src/services/notificationService.ts](frontend/src/services/notificationService.ts))
  - `listNotifications()` - Fetch paginated list
  - `getUnreadCount()` - Get badge count
  - `markRead()` - Mark single as read
  - `markAllRead()` - Bulk mark as read
  - `deleteNotification()` - Remove notification
  - `createNotification()` - Manual creation (for testing)

- **Hook** ([frontend/src/hooks/useNotifications.ts](frontend/src/hooks/useNotifications.ts))
  - `useNotifications()` - React hook with full state management
  - Auto-fetches on mount and when authenticated
  - Methods: `refresh`, `markRead`, `markAllRead`, `remove`
  - Handles loading, error, and data states

- **UI Components** ([frontend/src/app/Notifications/page.tsx](frontend/src/app/Notifications/page.tsx))
  - Full notifications page with live data from API
  - Category-based icons and colors
  - Time formatting (relative: "just now", "2h ago", etc.)
  - Mark read / Dismiss buttons per notification
  - "Mark all read" button (conditionally disabled)
  - Empty state: "You are all caught up."

- **Sidebar Badge** ([frontend/src/components/layout/Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx))
  - Dynamic unread count badge on Notifications nav item
  - Loads on mount and updates as user navigates
  - Shows only if unread_count > 0

---

## Notification Categories & Use Cases

| Category    | Use Case                                      | Icon | Color   |
| ----------- | --------------------------------------------- | ---- | ------- |
| `follow_up` | Follow-up reminders for applications          | 📬   | Blue    |
| `interview` | Interview scheduled/upcoming                  | 📅   | Purple  |
| `ai`        | AI tool results (resume tailored, etc.)       | ✨   | Primary |
| `system`    | System messages (welcome, updates)            | ℹ️   | Gray    |
| `general`   | General updates (application submitted, etc.) | 🔔   | Gray    |

---

## Data Flow Examples

### Example 1: User Creates Application with Status "applied"

```
User clicks "Mark as Applied" on Applications page
  ↓
PATCH /applications/{id} with status="applied"
  ↓
Backend updates application + creates ApplicationEvent
  ↓
notify_application_status_change() triggers
  ↓
Creates notification: "Application submitted" + link to app
  ↓
Frontend user sees notification in /Notifications page
  ↓
Unread badge updates in sidebar
```

### Example 2: Scheduled Follow-up Check

```
Every 1 hour (background task runs)
  ↓
Scheduler queries: applications with follow_up_date = TODAY
  ↓
For each app: Creates "Follow up due" notification
  ↓
User sees notification when they load /Notifications or sidebar badge increments
```

### Example 3: New User Registration

```
User completes registration
  ↓
Backend creates User + Profile
  ↓
Auto-creates 3 welcome notifications
  ↓
User sees notification list after email verification
  ↓
Can click through to Dashboard, Resumes, or AI Tools
```

---

## API Rate Limits

| Endpoint                          | Limit           |
| --------------------------------- | --------------- |
| `GET /notifications`              | No limit (read) |
| `GET /notifications/unread-count` | No limit (read) |
| `POST /notifications`             | 20/minute       |
| `PATCH /notifications/{id}/read`  | 30/minute       |
| `POST /notifications/read-all`    | 10/minute       |
| `DELETE /notifications/{id}`      | 30/minute       |

---

## Database Schema

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR DEFAULT 'general',
  action_url VARCHAR,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIMEZONE,
  created_at TIMESTAMP WITH TIMEZONE DEFAULT now(),
  INDEX ix_notifications_user_id,
  INDEX ix_notifications_category,
  INDEX ix_notifications_is_read
);
```

---

## Testing Checklist

- [x] Backend compiles without errors
- [x] Migrations applied successfully
- [x] API endpoints respond correctly
- [x] Welcome notifications created on registration
- [x] Status change notifications trigger on application update
- [x] Frontend fetches notifications correctly
- [x] Sidebar badge shows unread count
- [x] Mark read / dismiss buttons work
- [x] Background scheduler runs every hour
- [x] Rate limiting enforced on write operations

---

## Next Steps (Optional Enhancements)

1. **Real-time Notifications** - Implement WebSocket for instant updates
2. **Email Notifications** - Send email copies of important notifications
3. **Notification Preferences** - Allow users to opt-in/out of categories
4. **Notification Center Bell** - Add animated bell icon in top navbar
5. **Notification Grouping** - Group similar notifications by date
6. **Notification Expiry** - Auto-delete old notifications after 30 days
7. **Bulk Actions** - Delete multiple notifications at once
8. **Search Notifications** - Filter by text content
9. **Archive** - Archive instead of delete
10. **Push Notifications** - Browser/mobile push notifications

---

## Files Summary

**Backend Created/Modified (9 files):**

1. `/backend/app/models/notification.py` - Model
2. `/backend/app/schemas/notification.py` - Schema
3. `/backend/app/services/notification_service.py` - Service layer
4. `/backend/app/services/application_service.py` - App service with auto-notifications
5. `/backend/app/api/notifications.py` - API endpoints
6. `/backend/app/api/applications.py` - Updated to trigger notifications
7. `/backend/app/api/auth.py` - Updated to seed welcome notifications
8. `/backend/workers/scheduler.py` - Background task scheduler
9. `/backend/app/main.py` - Integrated scheduler startup
10. `/backend/migrations/versions/20260202_notifications.py` - Database migration

**Frontend Created/Modified (5 files):**

1. `/frontend/src/types/notification.types.ts` - Type definitions
2. `/frontend/src/services/notificationService.ts` - API client
3. `/frontend/src/hooks/useNotifications.ts` - React hook
4. `/frontend/src/app/Notifications/page.tsx` - Notifications page
5. `/frontend/src/components/layout/Sidebar.tsx` - Updated badge

---

## Deployment Notes

- Ensure database migrations are run: `alembic upgrade heads`
- Background scheduler requires asyncio support (built-in to FastAPI)
- Rate limiting is per-IP address by default
- Notifications persist in database indefinitely (consider adding cleanup)
- Consider using a proper job queue (Celery, RQ) for production schedulers

---

Generated: 2026-02-03
