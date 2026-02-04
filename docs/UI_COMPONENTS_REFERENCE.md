# Application Feature - UI Components Reference

## Color System

### Status Badges

```tsx
const statusClasses: Record<string, string> = {
  saved: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  interview:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  offer: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const statusIcons: Record<string, string> = {
  saved: "bookmark",
  applied: "send",
  interview: "calendar_month",
  offer: "verified",
  rejected: "close",
};
```

## Application Card Component

Used in list view (3-column grid on desktop).

**Structure**:

```tsx
<Link href={`/Applications/${app.id}`}>
  <div
    className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-750 
                  rounded-2xl p-5 hover:shadow-lg dark:hover:shadow-xl 
                  hover:border-primary/30 transition-all"
  >
    {/* Company Avatar */}
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
      {companyInitials}
    </div>

    {/* Company & Job Info */}
    <p className="text-sm font-bold">{app.company}</p>
    <p className="text-xs text-text-secondary">{app.job_title}</p>

    {/* Location */}
    {app.location && (
      <div className="flex items-center gap-2 text-xs">
        <span className="material-symbols-outlined">location_on</span>
        {app.location}
      </div>
    )}

    {/* Key Metrics */}
    {app.applied_at && <p>{formatDate(app.applied_at)}</p>}
    {app.interview_date && (
      <div className="bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1.5 rounded-lg">
        <span className="material-symbols-outlined">calendar_month</span>
        {formatDate(app.interview_date)}
      </div>
    )}

    {/* Status & Salary */}
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusClasses[app.status]}`}
    >
      <span className="material-symbols-outlined">
        {statusIcons[app.status]}
      </span>
      {statusLabel[app.status]}
    </div>
  </div>
</Link>
```

## Form Section Component

Used in Create/Edit modals.

**Structure**:

```tsx
<div>
  <h4
    className="text-sm font-bold text-text-main dark:text-white mb-4 
                 flex items-center gap-2"
  >
    <span className="material-symbols-outlined text-base">description</span>
    Job Details
  </h4>
  <div className="space-y-4">{/* Input fields */}</div>
</div>
```

**Section Dividers**:

```tsx
<div className="border-t border-gray-100 dark:border-gray-800 pt-6">
```

## Detail Page Information Card

**Pattern**:

```tsx
{
  /* Color-coded card for important dates */
}
<div
  className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 
                border border-blue-100 dark:border-blue-800/30"
>
  <p
    className="text-xs uppercase text-blue-700 dark:text-blue-300 font-semibold mb-2 
                flex items-center gap-1"
  >
    <span className="material-symbols-outlined text-[14px]">send</span>
    Applied On
  </p>
  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
    {formatDate(application.applied_at)}
  </p>
</div>;
```

## Timeline Event Component

**Structure**:

```tsx
<div className="flex items-start gap-4 relative">
  {/* Connector line */}
  {index !== events.length - 1 && (
    <div
      className="absolute left-5 top-10 h-4 w-0.5 
                    bg-gradient-to-b from-gray-300 to-transparent"
    ></div>
  )}

  {/* Status dot */}
  <div
    className={`w-10 h-10 rounded-full flex items-center justify-center 
                   text-sm font-bold text-white ${colorByStatus}`}
  >
    <span className="material-symbols-outlined">
      {statusIcons[event.new_status]}
    </span>
  </div>

  {/* Event content */}
  <div>
    <p className="text-sm font-semibold">{statusTransition}</p>
    <p className="text-xs text-text-secondary">
      {formatDate(event.changed_at)}
    </p>
  </div>
</div>
```

## Responsive Breakpoints

**Cards Grid**:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

**Form Inputs**:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* Inputs */}</div>
```

**Information Grid**:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Info boxes */}
</div>
```

## Button Styles

**Primary Action** (Save, Submit):

```tsx
<button
  className="px-5 py-2.5 rounded-xl bg-primary text-white 
                   text-sm font-bold shadow-lg shadow-primary/30 
                   hover:bg-primary-dark disabled:opacity-60"
>
  {isSaving ? "Saving..." : "Save Changes"}
</button>
```

**Secondary Action** (Edit, Cancel):

```tsx
<button
  className="px-4 py-2.5 rounded-xl border border-gray-200 
                   dark:border-gray-700 text-sm font-semibold 
                   text-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800"
>
  Cancel
</button>
```

**Danger Action** (Delete):

```tsx
<button
  className="px-4 py-2.5 rounded-xl bg-red-600 text-white 
                   text-sm font-semibold hover:bg-red-700"
>
  Delete
</button>
```

## Input Styles

**Text Inputs**:

```tsx
<input
  className="w-full rounded-xl border border-gray-200 
                  dark:border-gray-700 bg-white dark:bg-gray-900 
                  px-4 py-3 text-sm 
                  focus:ring-2 focus:ring-primary/40 focus:border-transparent 
                  transition"
/>
```

**Selects**:

```tsx
<select
  className="w-full rounded-xl border border-gray-200 
                   dark:border-gray-700 bg-white dark:bg-gray-900 
                   px-4 py-3 text-sm 
                   focus:ring-2 focus:ring-primary/40 focus:border-transparent 
                   transition"
/>
```

**Textareas**:

```tsx
<textarea
  className="w-full rounded-xl border border-gray-200 
                     dark:border-gray-700 bg-white dark:bg-gray-900 
                     px-4 py-3 text-sm min-h-[100px]
                     focus:ring-2 focus:ring-primary/40 focus:border-transparent 
                     transition"
/>
```

## Empty States

**No Applications**:

```tsx
<div className="text-center py-12">
  <span
    className="material-symbols-outlined text-5xl 
                   text-gray-300 dark:text-gray-700 mb-3"
  >
    work_off
  </span>
  <p className="text-sm text-text-secondary">
    No applications found. Create your first one!
  </p>
</div>
```

## Error States

**Error Message**:

```tsx
<div
  className="bg-red-50 dark:bg-red-900/20 border border-red-200 
                dark:border-red-800/50 rounded-lg px-4 py-3"
>
  <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
</div>
```

## Loading States

**Loading Spinner**:

```tsx
<div className="text-center py-12 text-sm text-text-secondary">
  <span className="material-symbols-outlined animate-spin text-2xl mb-2">
    refresh
  </span>
  <p>Loading applications...</p>
</div>
```

## Spacing System

- **Gap between sections**: `gap-6`, `pt-6`, `mt-8 pt-8`
- **Card padding**: `p-5` (cards), `p-6` (sections), `p-8` (detail page)
- **Input spacing**: `mt-2` (label to input)
- **Section dividers**: `border-t border-gray-100 dark:border-gray-800`

## Typography

- **Section Headers**: `text-lg font-bold text-text-main dark:text-white`
- **Labels**: `text-sm font-semibold text-text-main dark:text-white`
- **Info Labels**: `text-xs uppercase text-text-secondary font-semibold`
- **Values**: `text-sm font-semibold text-text-main dark:text-white`
- **Secondary Text**: `text-xs text-text-secondary`

## Icons Used

- `work` - Work/Applications
- `bookmark` - Saved status
- `send` - Applied status
- `calendar_month` - Interview/Calendar
- `verified` - Offer status
- `close` - Rejected/Close
- `location_on` - Location
- `person` - Recruiter/Person
- `description` - Job Description
- `notes` - Notes
- `open_in_new` - External link
- `history` - Timeline/History
- `alarm` - Follow-up/Alert
- `edit` - Edit action
- `delete` - Delete action
- `arrow_back` - Back navigation
- `work_off` - No applications/Empty state
- `event_note` - Events/Timeline
- `info` - Information/Required
- `refresh` - Refresh action

---

This reference guide provides consistent styling patterns across all Application feature components. Use these styles when building new features or components.
